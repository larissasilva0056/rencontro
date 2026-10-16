import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiService } from '../ai/ai.service';
import { AuthUser, CaseStatus, Role, TipStatus } from '../common/enums';
import { AiAnalysis, Case, CaseUpdate, Tip } from '../entities';
import { CreateTipDto, ReviewTipDto } from './cases.dto';
import { isPrivileged } from './cases.service';
import { AuditService, NotificationsService } from '../notifications/notifications.module';

@Injectable()
export class TipsService {
  constructor(
    @InjectRepository(Tip) private tips: Repository<Tip>,
    @InjectRepository(Case) private cases: Repository<Case>,
    @InjectRepository(AiAnalysis) private analyses: Repository<AiAnalysis>,
    @InjectRepository(CaseUpdate) private updates: Repository<CaseUpdate>,
    private ai: AiService,
    private notifs: NotificationsService,
    private audit: AuditService,
  ) {}

  private view(t: Tip, u: AuthUser, withAnalysis: boolean) {
    const priv = isPrivileged(u);
    return {
      id: t.id, description: t.description, photoUrl: t.photoUrl, possibleLocation: t.possibleLocation, seenAt: t.seenAt,
      status: t.status, reviewNote: t.reviewNote, createdAt: t.createdAt,
      case: t.case ? { id: t.case.id, fullName: t.case.fullName, photoUrl: t.case.photoUrl } : undefined,
      contact: priv ? t.contact : undefined, // identidade de quem informou é protegida da família
      analysis: withAnalysis && t.analysis
        ? { compatibility: t.analysis.compatibility, summary: t.analysis.summary, priorityAlert: t.analysis.priorityAlert, source: t.analysis.source, relatedCases: JSON.parse(t.analysis.relatedCases) }
        : undefined,
    };
  }

  async create(caseId: number, dto: CreateTipDto, u: AuthUser) {
    const c = await this.cases.findOne({ where: { id: caseId }, relations: ['owner'] });
    if (!c || c.status !== CaseStatus.PUBLICADO) throw new NotFoundException('Caso não encontrado ou já encerrado.');
    const tip = await this.tips.save(this.tips.create({
      case: { id: caseId } as Case, author: { id: u.id } as any, description: dto.description,
      photoUrl: dto.photoUrl ?? null, possibleLocation: dto.possibleLocation ?? null,
      seenAt: dto.seenAt ?? null, contact: dto.contact ?? null, status: TipStatus.EM_ANALISE,
    }));
    const published = await this.cases.find({ where: { status: CaseStatus.PUBLICADO } });
    const r = await this.ai.analyze(tip, published);
    await this.analyses.save(this.analyses.create({
      tip, compatibility: r.compatibility, relatedCases: JSON.stringify(r.related), summary: r.summary, priorityAlert: r.priorityAlert, source: r.source,
    }));
    await this.notifs.notify(c.owner.id, 'Nova pista recebida', 'Uma nova informação foi enviada e está em análise.', '/painel');
    return { id: tip.id, status: tip.status, message: 'Informação recebida e em análise. Nada é confirmado sem verificação.' };
  }

  async forCase(caseId: number, u: AuthUser) {
    const c = await this.cases.findOne({ where: { id: caseId }, relations: ['owner'] });
    if (!c) throw new NotFoundException();
    if (c.owner.id !== u.id && !isPrivileged(u)) throw new ForbiddenException();
    const rows = await this.tips.find({ where: { case: { id: caseId } }, relations: ['case', 'analysis'], order: { createdAt: 'DESC' } });
    return rows.map((t) => this.view(t, u, isPrivileged(u)));
  }

  async mine(u: AuthUser) {
    const rows = await this.tips.find({ where: { case: { owner: { id: u.id } } }, relations: ['case', 'analysis'], order: { createdAt: 'DESC' } });
    return rows.map((t) => this.view(t, u, false));
  }

  /** Fila de triagem para ADMIN / ONG / ÓRGÃO, ordenada por compatibilidade da IA. */
  async queue(status: TipStatus, u: AuthUser) {
    const rows = await this.tips.find({ where: { status }, relations: ['case', 'analysis'], order: { createdAt: 'DESC' } });
    return rows
      .map((t) => this.view(t, u, true))
      .sort((a, b) => (b.analysis?.compatibility ?? 0) - (a.analysis?.compatibility ?? 0));
  }

  async review(id: number, dto: ReviewTipDto, u: AuthUser) {
    const t = await this.tips.findOne({ where: { id }, relations: ['case', 'analysis'] });
    if (!t) throw new NotFoundException();
    if (t.status !== TipStatus.EM_ANALISE) throw new BadRequestException('Esta pista já foi analisada.');
    t.status = dto.decision as TipStatus;
    t.reviewNote = dto.note ?? null;
    t.reviewedBy = { id: u.id } as any;
    await this.tips.save(t);
    await this.updates.save(this.updates.create({
      case: { id: t.case.id } as Case, author: { id: u.id } as any,
      description: dto.decision === 'CONFIRMADA' ? 'Uma pista foi analisada e confirmada por um revisor.' : 'Uma pista recebida foi analisada e descartada.',
    }));
    await this.audit.record(u, `TIP_${dto.decision}`, 'tip', id, dto.note);
    return this.view(t, u, true);
  }
}
