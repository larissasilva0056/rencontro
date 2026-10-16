import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AiService } from '../ai/ai.service';
import { AuthUser, CaseStatus, Role, TipStatus } from '../common/enums';
import { AccessLog, Case, CaseUpdate, Communication, Forward, Report, Tip, User } from '../entities';
import { CasesService } from '../cases/cases.service';
import { AuditService, NotificationsService } from '../notifications/notifications.module';
import { CommunicationDto, ForwardDto, ReviewCaseDto, UpdateUserDto } from './admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Case) private cases: Repository<Case>,
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Tip) private tips: Repository<Tip>,
    @InjectRepository(Report) private reports: Repository<Report>,
    @InjectRepository(Forward) private forwards: Repository<Forward>,
    @InjectRepository(Communication) private comms: Repository<Communication>,
    @InjectRepository(AccessLog) private logs: Repository<AccessLog>,
    @InjectRepository(CaseUpdate) private updates: Repository<CaseUpdate>,
    private casesSvc: CasesService,
    private ai: AiService,
    private notifs: NotificationsService,
    private audit: AuditService,
  ) {}

  async overview() {
    const count = (status: CaseStatus) => this.cases.count({ where: { status } });
    return {
      pending: await count(CaseStatus.AGUARDANDO),
      published: await count(CaseStatus.PUBLICADO),
      located: await count(CaseStatus.LOCALIZADO),
      rejected: await count(CaseStatus.REJEITADO),
      tipsInReview: await this.tips.count({ where: { status: TipStatus.EM_ANALISE } }),
      openReports: await this.reports.count({ where: { resolved: false } }),
      pendingUsers: await this.users.count({ where: { approved: false, blocked: false } }),
    };
  }

  async casesByStatus(status: CaseStatus, u: AuthUser) {
    const rows = await this.cases.find({ where: { status }, relations: ['owner'], order: { urgent: 'DESC', createdAt: 'ASC' } });
    return rows.map((c) => this.casesSvc.view(c, u));
  }

  /** Verificação obrigatória antes da publicação (RN). */
  async reviewCase(id: number, dto: ReviewCaseDto, admin: AuthUser) {
    const c = await this.cases.findOne({ where: { id }, relations: ['owner'] });
    if (!c) throw new NotFoundException('Caso não encontrado.');
    if (c.status !== CaseStatus.AGUARDANDO) throw new BadRequestException('Este caso não está aguardando análise.');
    if (!dto.approve && !dto.reason) throw new BadRequestException('Informe o motivo da rejeição.');
    c.status = dto.approve ? CaseStatus.PUBLICADO : CaseStatus.REJEITADO;
    c.publishedAt = dto.approve ? new Date() : null;
    c.rejectionReason = dto.approve ? null : dto.reason!;
    await this.cases.save(c);
    await this.updates.save(this.updates.create({
      case: { id } as Case, author: { id: admin.id } as any,
      description: dto.approve ? 'Caso verificado e publicado.' : `Cadastro não aprovado: ${dto.reason}`,
    }));
    await this.notifs.notify(c.owner.id, dto.approve ? 'Caso publicado' : 'Caso não aprovado', dto.approve ? 'Seu caso foi verificado e publicado.' : 'Seu caso precisa de correções. Abra para ver o motivo.', `/casos/${id}`);
    await this.audit.record(admin, dto.approve ? 'CASE_APPROVED' : 'CASE_REJECTED', 'case', id, dto.reason);
    return this.casesSvc.view(c, admin);
  }

  /** Remoção definitiva: somente administradores (RN). */
  async deleteCase(id: number, admin: AuthUser) {
    const r = await this.cases.delete(id);
    if (!r.affected) throw new NotFoundException();
    await this.audit.record(admin, 'CASE_DELETED', 'case', id);
    return { ok: true };
  }

  listUsers() { return this.users.find({ order: { createdAt: 'DESC' } }); }
  async updateUser(id: number, dto: UpdateUserDto, admin: AuthUser) {
    if (id === admin.id) throw new BadRequestException('Você não pode alterar a própria conta.');
    const r = await this.users.update(id, dto);
    if (!r.affected) throw new NotFoundException();
    await this.audit.record(admin, 'USER_UPDATED', 'user', id, JSON.stringify(dto));
    return this.users.findOneOrFail({ where: { id } });
  }
  listOrganizations() { return this.users.find({ where: { role: In([Role.ONG, Role.ORGAO]), approved: true, blocked: false }, select: ['id', 'name', 'organizationName', 'role'] }); }

  reportsList() { return this.reports.find({ where: { resolved: false }, relations: ['case', 'reporter'], order: { createdAt: 'DESC' } }).then((rows) => rows.map((r) => ({ id: r.id, reason: r.reason, createdAt: r.createdAt, case: { id: r.case.id, fullName: r.case.fullName }, reporter: r.reporter.name }))); }
  async resolveReport(id: number, admin: AuthUser) { await this.reports.update(id, { resolved: true }); await this.audit.record(admin, 'REPORT_RESOLVED', 'report', id); return { ok: true }; }
  auditList() { return this.audit.list(); }

  async forward(caseId: number, dto: ForwardDto, admin: AuthUser) {
    const org = await this.users.findOne({ where: { id: dto.organizationId, role: In([Role.ONG, Role.ORGAO]), approved: true } });
    if (!org) throw new NotFoundException('Instituição não encontrada.');
    const c = await this.cases.findOne({ where: { id: caseId } });
    if (!c || c.status === CaseStatus.REJEITADO) throw new NotFoundException('Caso não encontrado.');
    await this.forwards.save(this.forwards.create({ case: { id: caseId } as Case, organization: { id: org.id } as any, note: dto.note ?? null }));
    await this.updates.save(this.updates.create({ case: { id: caseId } as Case, author: { id: admin.id } as any, description: `Caso encaminhado para ${org.organizationName ?? org.name}.` }));
    await this.notifs.notify(org.id, 'Novo caso encaminhado', 'Um caso foi encaminhado para a sua instituição.', `/casos/${caseId}`);
    await this.audit.record(admin, 'CASE_FORWARDED', 'case', caseId, `org ${org.id}`);
    return { ok: true };
  }

  // ---------- Área de ONGs e órgãos governamentais ----------
  async orgCases(scope: 'forwarded' | 'all', u: AuthUser) {
    if (scope === 'forwarded') {
      const rows = await this.forwards.find({ where: { organization: { id: u.id } }, relations: ['case', 'case.owner'], order: { createdAt: 'DESC' } });
      return rows.map((f) => ({ ...this.casesSvc.view(f.case, u), forwardNote: f.note, forwardedAt: f.createdAt }));
    }
    const rows = await this.cases.find({ where: { status: In([CaseStatus.AGUARDANDO, CaseStatus.PUBLICADO]) }, relations: ['owner'], order: { urgent: 'DESC', createdAt: 'DESC' } });
    return rows.map((c) => this.casesSvc.view(c, u));
  }

  async orgDashboard(u: AuthUser) {
    const recent = await this.logs.find({ where: { user: { id: u.id } }, relations: ['case'], order: { createdAt: 'DESC' }, take: 5 });
    return {
      forwarded: await this.forwards.count({ where: { organization: { id: u.id } } }),
      active: await this.cases.count({ where: { status: CaseStatus.PUBLICADO } }),
      communications: await this.comms.count({ where: { author: { id: u.id } } }),
      recentAccess: recent.map((l) => ({ id: l.id, caseId: l.case.id, fullName: l.case.fullName, at: l.createdAt })),
    };
  }

  async communicate(dto: CommunicationDto, u: AuthUser) {
    const c = await this.cases.findOne({ where: { id: dto.caseId } });
    if (!c) throw new NotFoundException('Caso não encontrado.');
    await this.comms.save(this.comms.create({ case: { id: c.id } as Case, author: { id: u.id } as any, message: dto.message }));
    await this.updates.save(this.updates.create({ case: { id: c.id } as Case, author: { id: u.id } as any, description: 'Uma comunicação oficial foi registrada por uma instituição parceira.' }));
    return { ok: true };
  }
  async myCommunications(u: AuthUser) {
    const rows = await this.comms.find({ where: { author: { id: u.id } }, relations: ['case'], order: { createdAt: 'DESC' }, take: 20 });
    return rows.map((r) => ({ id: r.id, message: r.message, createdAt: r.createdAt, case: { id: r.case.id, fullName: r.case.fullName } }));
  }

  async duplicates() {
    return this.ai.duplicates(await this.cases.find({ where: { status: In([CaseStatus.AGUARDANDO, CaseStatus.PUBLICADO]) } }));
  }

  // ---------- Público ----------
  async publicStats() {
    return {
      active: await this.cases.count({ where: { status: CaseStatus.PUBLICADO } }),
      located: await this.cases.count({ where: { status: CaseStatus.LOCALIZADO } }),
      partners: await this.users.count({ where: { role: In([Role.ONG, Role.ORGAO]), approved: true, blocked: false } }),
    };
  }
  async partners() {
    const rows = await this.users.find({ where: { role: In([Role.ONG, Role.ORGAO]), approved: true, blocked: false }, order: { organizationName: 'ASC' } });
    return rows.map((u) => ({ id: u.id, name: u.organizationName ?? u.name, type: u.role === Role.ONG ? 'ONG' : 'Órgão público' }));
  }
}
