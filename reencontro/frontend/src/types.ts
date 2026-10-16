export type Role = 'FAMILIAR' | 'CIDADAO' | 'ONG' | 'ORGAO_GOVERNAMENTAL' | 'ADMIN';
export type CaseStatus = 'AGUARDANDO_ANALISE' | 'PUBLICADO' | 'LOCALIZADO' | 'REJEITADO';
export type TipStatus = 'EM_ANALISE' | 'CONFIRMADA' | 'DESCARTADA';

export interface User { id: number; name: string; email: string; role: Role; phone?: string | null; organizationName?: string | null; approved: boolean }
export interface CaseItem {
  id: number; fullName: string; age: number; heightCm?: number | null; eyeColor?: string | null; hairColor?: string | null;
  skinColor?: string | null; characteristics?: string | null; photoUrl?: string | null; disappearedAt: string; city: string; state: string;
  lastSeenPlace?: string | null; circumstances?: string | null; vulnerable: boolean; urgent: boolean; status: CaseStatus;
  rejectionReason?: string | null; contactInfo?: string; shareAuthorized: boolean; isOwner: boolean; owner?: { id: number; name: string };
  publishedAt?: string | null; forwardNote?: string | null;
}
export interface Tip {
  id: number; description: string; photoUrl?: string | null; possibleLocation?: string | null; seenAt?: string | null; status: TipStatus;
  createdAt: string; reviewNote?: string | null; contact?: string; case?: { id: number; fullName: string; photoUrl?: string | null };
  analysis?: { compatibility: number; summary: string; priorityAlert: boolean; source?: string; relatedCases: { caseId: number; fullName: string; score: number }[] };
}
export const ROLE_LABEL: Record<Role, string> = {
  FAMILIAR: 'Familiar', CIDADAO: 'Cidadão', ONG: 'ONG parceira', ORGAO_GOVERNAMENTAL: 'Órgão governamental', ADMIN: 'Administrador',
};
export const STATUS_LABEL: Record<CaseStatus, string> = {
  AGUARDANDO_ANALISE: 'Em análise', PUBLICADO: 'Publicado', LOCALIZADO: 'Localizado', REJEITADO: 'Rejeitado',
};
export const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
