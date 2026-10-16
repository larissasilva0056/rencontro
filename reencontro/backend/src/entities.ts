import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne,
  PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { CaseStatus, Role, TipStatus } from './common/enums';

// SQLite usa 'datetime'; PostgreSQL usa 'timestamp'.
const DT = process.env.DB_TYPE === 'postgres' ? 'timestamp' : 'datetime';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn() id: number;
  @Column() name: string;
  @Column({ unique: true }) email: string;
  @Column({ select: false }) passwordHash: string;
  @Column({ type: 'varchar' }) role: Role;
  /** ONGs e órgãos governamentais só entram após aprovação do administrador. */
  @Column({ default: true }) approved: boolean;
  @Column({ default: false }) blocked: boolean;
  @Column({ type: 'varchar', nullable: true }) phone: string | null;
  @Column({ type: 'varchar', nullable: true }) organizationName: string | null;
  @Column({ type: DT as any, nullable: true }) termsAcceptedAt: Date | null;
  @CreateDateColumn() createdAt: Date;
}

@Entity('cases')
export class Case {
  @PrimaryGeneratedColumn() id: number;
  @Column() fullName: string;
  @Column({ type: 'int' }) age: number;
  @Column({ type: 'varchar', nullable: true }) birthDate: string | null;
  @Column({ type: 'int', nullable: true }) heightCm: number | null;
  @Column({ type: 'varchar', nullable: true }) eyeColor: string | null;
  @Column({ type: 'varchar', nullable: true }) hairColor: string | null;
  @Column({ type: 'varchar', nullable: true }) skinColor: string | null;
  @Column({ type: 'text', nullable: true }) characteristics: string | null;
  @Column({ type: 'varchar', nullable: true }) photoUrl: string | null;
  @Column() disappearedAt: string; // YYYY-MM-DD
  @Column() city: string;
  @Column() state: string;
  @Column({ type: 'varchar', nullable: true }) lastSeenPlace: string | null;
  @Column({ type: 'text', nullable: true }) circumstances: string | null;
  @Column({ default: false }) vulnerable: boolean;
  /** Prioridade: menores de 18 anos ou pessoas vulneráveis. */
  @Column({ default: false }) urgent: boolean;
  @Column({ type: 'varchar' }) status: CaseStatus;
  @Column({ type: 'text', nullable: true }) rejectionReason: string | null;
  @Column({ type: 'varchar', nullable: true }) contactInfo: string | null;
  @Column({ default: false }) shareAuthorized: boolean;
  @Column({ type: DT as any }) acceptedTermsAt: Date;
  @Column({ type: DT as any, nullable: true }) publishedAt: Date | null;
  @Column({ type: DT as any, nullable: true }) locatedAt: Date | null;
  @ManyToOne(() => User, { nullable: false }) owner: User;
  @OneToMany(() => CaseUpdate, (u) => u.case) updates: CaseUpdate[];
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

@Entity('case_updates')
export class CaseUpdate {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => Case, (c) => c.updates, { onDelete: 'CASCADE' }) case: Case;
  @ManyToOne(() => User, { nullable: true }) author: User | null;
  @Column({ type: 'text' }) description: string;
  @CreateDateColumn() createdAt: Date;
}

@Entity('shares')
export class Share {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => Case, { onDelete: 'CASCADE' }) case: Case;
  @Column() network: string;
  @Column() authorized: boolean;
  @CreateDateColumn() createdAt: Date;
}

@Entity('tips')
export class Tip {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => Case, { onDelete: 'CASCADE', nullable: false }) case: Case;
  @ManyToOne(() => User, { nullable: false }) author: User;
  @Column({ type: 'text' }) description: string;
  @Column({ type: 'varchar', nullable: true }) photoUrl: string | null;
  @Column({ type: 'varchar', nullable: true }) possibleLocation: string | null;
  @Column({ type: 'varchar', nullable: true }) seenAt: string | null;
  @Column({ type: 'varchar', nullable: true }) contact: string | null;
  @Column({ type: 'varchar' }) status: TipStatus;
  @Column({ type: 'text', nullable: true }) reviewNote: string | null;
  @ManyToOne(() => User, { nullable: true }) reviewedBy: User | null;
  @OneToOne(() => AiAnalysis, (a) => a.tip) analysis: AiAnalysis | null;
  @CreateDateColumn() createdAt: Date;
}

@Entity('ai_analyses')
export class AiAnalysis {
  @PrimaryGeneratedColumn() id: number;
  @OneToOne(() => Tip, (t) => t.analysis, { onDelete: 'CASCADE' }) @JoinColumn() tip: Tip;
  @Column({ type: 'float' }) compatibility: number;
  /** JSON: [{ caseId, fullName, score }] */
  @Column({ type: 'text' }) relatedCases: string;
  @Column({ type: 'text' }) summary: string;
  @Column({ default: false }) priorityAlert: boolean;
  /** 'gemini' ou 'heuristic' (fallback local). */
  @Column({ type: 'varchar', default: 'heuristic' }) source: string;
  @CreateDateColumn() createdAt: Date;
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => Case, { onDelete: 'CASCADE' }) case: Case;
  @ManyToOne(() => User) reporter: User;
  @Column({ type: 'text' }) reason: string;
  @Column({ default: false }) resolved: boolean;
  @CreateDateColumn() createdAt: Date;
}

@Entity('forwards')
export class Forward {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => Case, { onDelete: 'CASCADE' }) case: Case;
  @ManyToOne(() => User) organization: User;
  @Column({ type: 'text', nullable: true }) note: string | null;
  @CreateDateColumn() createdAt: Date;
}

@Entity('communications')
export class Communication {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => Case, { onDelete: 'CASCADE' }) case: Case;
  @ManyToOne(() => User) author: User;
  @Column({ type: 'text' }) message: string;
  @CreateDateColumn() createdAt: Date;
}

@Entity('access_logs')
export class AccessLog {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => User) user: User;
  @ManyToOne(() => Case, { onDelete: 'CASCADE' }) case: Case;
  @CreateDateColumn() createdAt: Date;
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) user: User;
  @Column() title: string;
  @Column({ type: 'text' }) body: string;
  @Column({ type: 'varchar', nullable: true }) link: string | null;
  @Column({ default: false }) isRead: boolean;
  @CreateDateColumn() createdAt: Date;
}

/** Registro de auditoria de ações importantes (moderação, bloqueios, remoções, revisões de pistas). */
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn() id: number;
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' }) actor: User | null;
  @Column() action: string;
  @Column({ type: 'varchar', nullable: true }) targetType: string | null;
  @Column({ type: 'int', nullable: true }) targetId: number | null;
  @Column({ type: 'text', nullable: true }) details: string | null;
  @CreateDateColumn() createdAt: Date;
}

export const ALL_ENTITIES = [
  User, Case, CaseUpdate, Share, Tip, AiAnalysis, Report, Forward, Communication, AccessLog, Notification, AuditLog,
];
