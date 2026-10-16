import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthUser, CaseStatus, Role } from '../common/enums';
import { AccessLog, Case, CaseUpdate, Report, Share } from '../entities';
import { CreateCaseDto, ListCasesQuery, UpdateCaseDto } from './cases.dto';

const PRIVILEGED = [Role.ADMIN, Role.ONG, Role.ORGAO];
export const isPrivileged = (u?: AuthUser | null) => !!u && PRIVILEGED.includes(u.role);

@Injectable()
export class CasesService {
  constructor(
    @InjectRepository(Case) private cases: Repository<Case>,
    @InjectRepository(CaseUpdate) private updates: Repository<CaseUpdate>,
    @InjectRepository(Share) private shares: Repository<Share>,
    @InjectRepository(Report) private reports: Repository<Report>,
    @InjectRepository(AccessLog) private logs: Repository<AccessLog>,
  ) {}

  /** Remove dados sensíveis conforme quem está olhando (LGPD). */
  view(c: Case, u?: AuthUser | null) {
    const isOwner = !!u && c.owner?.id === u.id;
    const full = isOwner || isPrivileged(u);
    const { owner, contactInfo, rejectionReason, acceptedTermsAt, ...pub } = c as any;
    return {
      ...pub,
      isOwner,
      owner: full && owner ? { id: owner.id, name: owner.name } : undefined,
      contactInfo: full ? contactInfo : undefined,
      rejectionReason: isOwner || u?.role === Role.ADMIN ? rejectionReason : undefined,
    };
  }

  private async load(id: number) {
    const c = await this.cases.findOne({ where: { id }, relations: ['owner'] });
    if (!c) throw new NotFoundException('Caso não encontrado.');
    return c;
  }
  private canSee(c: Case, u?: AuthUser | null) {
    if (c.status === CaseStatus.PUBLICADO || c.status === CaseStatus.LOCALIZADO) return true;
    return (!!u && c.owner.id === u.id) || isPrivileged(u);
  }
  async getVisible(id: number, u?: AuthUser | null) {
    const c = await this.load(id);
    if (!this.canSee(c, u)) throw new NotFoundException('Caso não encontrado.');
    return c;
  }
  async getOwned(id: number, u: AuthUser) {
    const c = await this.load(id);
    if (c.owner.id !== u.id && u.role !== Role.ADMIN) throw new ForbiddenException('Apenas quem cadastrou o caso pode fazer isso.');
    return c;
  }
  private async log(c: Case, text: string, author: AuthUser | null) {
    await this.updates.save(this.updates.create({ case: { id: c.id } as Case, author: author ? ({ id: author.id } as any) : null, description: text }));
  }

  async list(q: ListCasesQuery, u?: AuthUser | null) {
    const qb = this.cases.createQueryBuilder('c');
    const st = q.status ?? 'ACTIVE';
    const statuses = st === 'ACTIVE' ? [CaseStatus.PUBLICADO] : st === 'LOCATED' ? [CaseStatus.LOCALIZADO] : [CaseStatus.PUBLICADO, CaseStatus.LOCALIZADO];
    qb.where('c.status IN (:...statuses)', { statuses });
    if (q.q?.trim()) {
      qb.andWhere(
        '(LOWER(c.fullName) LIKE :like OR LOWER(c.city) LIKE :like OR LOWER(c.characteristics) LIKE :like OR LOWER(c.eyeColor) LIKE :like OR LOWER(c.hairColor) LIKE :like OR LOWER(c.skinColor) LIKE :like)',
        { like: `%${q.q.trim().toLowerCase()}%` },
      );
    }
    if (q.state) qb.andWhere('c.state = :state', { state: q.state.toUpperCase() });
    if (q.city) qb.andWhere('LOWER(c.city) LIKE :city', { city: `%${q.city.toLowerCase()}%` });
    if (q.minAge !== undefined) qb.andWhere('c.age >= :minAge', { minAge: q.minAge });
    if (q.maxAge !== undefined) qb.andWhere('c.age <= :maxAge', { maxAge: q.maxAge });
    if (q.sinceDays) {
      const d = new Date(Date.now() - q.sinceDays * 86400000).toISOString().slice(0, 10);
      qb.andWhere('c.disappearedAt >= :d', { d });
    }
    if (q.sort === 'recent') qb.orderBy('c.disappearedAt', 'DESC');
    else qb.orderBy('c.urgent', 'DESC').addOrderBy('c.publishedAt', 'DESC');
    const page = q.page ?? 1, limit = q.limit ?? 20;
    const [items, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    return { items: items.map((c) => this.view(c, u)), total, page, limit };
  }

  async mine(u: AuthUser) {
    const items = await this.cases.find({ where: { owner: { id: u.id } }, relations: ['owner'], order: { createdAt: 'DESC' } });
    return items.map((c) => this.view(c, u));
  }

  async detail(id: number, u?: AuthUser | null) {
    const c = await this.getVisible(id, u);
    if (u && (u.role === Role.ONG || u.role === Role.ORGAO)) await this.logs.save(this.logs.create({ user: { id: u.id } as any, case: { id: c.id } as Case }));
    return this.view(c, u);
  }

  async create(dto: CreateCaseDto, u: AuthUser) {
    if (!dto.acceptedTerms) throw new BadRequestException('Aceite o termo de responsabilidade para concluir o cadastro.');
    if (!dto.imageAuthorization) throw new BadRequestException('É necessária autorização para uso da imagem da pessoa.');
    if (new Date(dto.disappearedAt) > new Date()) throw new BadRequestException('A data do desaparecimento não pode estar no futuro.');
    if (!dto.heightCm && !dto.eyeColor && !dto.hairColor && !dto.skinColor && !dto.characteristics)
      throw new BadRequestException('Informe ao menos uma característica física.');
    const { acceptedTerms, imageAuthorization, ...data } = dto;
    const c = await this.cases.save(
      this.cases.create({
        ...data, state: data.state.toUpperCase(), urgent: dto.vulnerable || dto.age < 18,
        status: CaseStatus.AGUARDANDO, owner: { id: u.id } as any, acceptedTermsAt: new Date(),
      } as any) as unknown as Case,
    );
    await this.log(c, 'Cadastro realizado. Caso enviado para verificação.', u);
    return { id: c.id, status: c.status, urgent: c.urgent };
  }

  async update(id: number, dto: UpdateCaseDto, u: AuthUser) {
    const c = await this.getOwned(id, u);
    if (c.status === CaseStatus.LOCALIZADO) throw new BadRequestException('Casos localizados não podem mais ser alterados.');
    const { note, ...changes } = dto;
    if (changes.disappearedAt && new Date(changes.disappearedAt) > new Date()) throw new BadRequestException('A data do desaparecimento não pode estar no futuro.');
    Object.assign(c, changes);
    if (changes.state) c.state = changes.state.toUpperCase();
    c.urgent = c.vulnerable || c.age < 18;
    let msg = note || `Dados atualizados (${Object.keys(changes).join(', ') || 'sem alterações'}).`;
    if (c.status === CaseStatus.REJEITADO) {
      c.status = CaseStatus.AGUARDANDO; c.rejectionReason = null;
      msg += ' Caso reenviado para nova verificação.';
    }
    await this.cases.save(c);
    await this.log(c, msg, u);
    return this.view(c, u);
  }

  async markLocated(id: number, note: string | undefined, u: AuthUser) {
    const c = await this.getOwned(id, u);
    if (c.status !== CaseStatus.PUBLICADO) throw new BadRequestException('Apenas casos publicados podem ser marcados como localizados.');
    c.status = CaseStatus.LOCALIZADO; c.locatedAt = new Date();
    await this.cases.save(c);
    await this.log(c, note ? `Pessoa localizada. ${note}` : 'Pessoa localizada. Caso encerrado.', u);
    return this.view(c, u);
  }

  async history(id: number, u?: AuthUser | null) {
    await this.getVisible(id, u);
    const rows = await this.updates.find({ where: { case: { id } }, order: { createdAt: 'ASC' } });
    return rows.map((r) => ({ id: r.id, description: r.description, createdAt: r.createdAt }));
  }

  async setShareAuthorization(id: number, authorized: boolean, u: AuthUser) {
    const c = await this.getOwned(id, u);
    c.shareAuthorized = authorized;
    await this.cases.save(c);
    await this.log(c, authorized ? 'Divulgação em redes sociais autorizada pela família.' : 'Autorização de divulgação em redes sociais revogada.', u);
    return { shareAuthorized: authorized };
  }

  async share(id: number, network: string, u?: AuthUser | null) {
    const c = await this.getVisible(id, u);
    if (c.status !== CaseStatus.PUBLICADO) throw new BadRequestException('Apenas casos publicados e ativos podem ser compartilhados.');
    if (!c.shareAuthorized) throw new ForbiddenException('A família ainda não autorizou o compartilhamento deste caso.');
    await this.shares.save(this.shares.create({ case: { id } as Case, network, authorized: true }));
    const link = `${process.env.PUBLIC_URL ?? 'http://localhost:5173'}/casos/${id}`;
    const text = encodeURIComponent(`Ajude a encontrar ${c.fullName}, ${c.age} anos, desaparecido(a) em ${c.city}/${c.state}.`);
    const url = encodeURIComponent(link);
    const shareUrl: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      x: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      telegram: `https://t.me/share/url?url=${url}&text=${text}`,
    };
    return { link, shareUrl: shareUrl[network] ?? null, note: network === 'instagram' ? 'O Instagram não possui link de compartilhamento web. Copie o link e publique no app.' : undefined };
  }

  async report(id: number, reason: string, u: AuthUser) {
    const c = await this.getVisible(id, u);
    await this.reports.save(this.reports.create({ case: { id: c.id } as Case, reporter: { id: u.id } as any, reason }));
    return { ok: true, message: 'Denúncia registrada. Nossa equipe vai analisar.' };
  }
}
