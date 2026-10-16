import { Controller, Get, Global, Injectable, Module, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrentUser, JwtAuthGuard } from '../common/auth-helpers';
import { AuthUser } from '../common/enums';
import { AuditLog, Notification, User } from '../entities';

@Injectable()
export class NotificationsService {
  constructor(@InjectRepository(Notification) private repo: Repository<Notification>) {}
  /** Notificações nunca carregam dados sensíveis (nome, contato): apenas avisos genéricos com link. */
  async notify(userId: number, title: string, body: string, link?: string) {
    await this.repo.save(this.repo.create({ user: { id: userId } as User, title, body, link: link ?? null }));
  }
  list(userId: number) { return this.repo.find({ where: { user: { id: userId } }, order: { createdAt: 'DESC' }, take: 50 }); }
  async unread(userId: number) { return { count: await this.repo.count({ where: { user: { id: userId }, isRead: false } }) }; }
  async readAll(userId: number) { await this.repo.update({ user: { id: userId } }, { isRead: true }); return { ok: true }; }
  async read(userId: number, id: number) { await this.repo.update({ id, user: { id: userId } }, { isRead: true }); return { ok: true }; }
}

@Injectable()
export class AuditService {
  constructor(@InjectRepository(AuditLog) private repo: Repository<AuditLog>) {}
  async record(actor: AuthUser | null, action: string, targetType?: string, targetId?: number, details?: string) {
    await this.repo.save(this.repo.create({ actor: actor ? ({ id: actor.id } as User) : null, action, targetType: targetType ?? null, targetId: targetId ?? null, details: details ?? null }));
  }
  async list() {
    const rows = await this.repo.find({ relations: ['actor'], order: { createdAt: 'DESC' }, take: 100 });
    return rows.map((r) => ({ id: r.id, action: r.action, targetType: r.targetType, targetId: r.targetId, details: r.details, actor: r.actor?.name ?? 'Sistema', createdAt: r.createdAt }));
  }
}

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private svc: NotificationsService) {}
  @Get() list(@CurrentUser() u: AuthUser) { return this.svc.list(u.id); }
  @Get('unread-count') unread(@CurrentUser() u: AuthUser) { return this.svc.unread(u.id); }
  @Patch('read-all') readAll(@CurrentUser() u: AuthUser) { return this.svc.readAll(u.id); }
  @Patch(':id/read') read(@CurrentUser() u: AuthUser, @Param('id', ParseIntPipe) id: number) { return this.svc.read(u.id, id); }
}

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Notification, AuditLog])],
  controllers: [NotificationsController],
  providers: [NotificationsService, AuditService],
  exports: [NotificationsService, AuditService],
})
export class NotificationsModule {}
