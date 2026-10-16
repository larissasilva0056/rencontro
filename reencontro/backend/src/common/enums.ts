export enum Role {
  FAMILIAR = 'FAMILIAR',
  CIDADAO = 'CIDADAO',
  ONG = 'ONG',
  ORGAO = 'ORGAO_GOVERNAMENTAL',
  ADMIN = 'ADMIN',
}
export enum CaseStatus {
  AGUARDANDO = 'AGUARDANDO_ANALISE',
  PUBLICADO = 'PUBLICADO',
  LOCALIZADO = 'LOCALIZADO',
  REJEITADO = 'REJEITADO',
}
export enum TipStatus {
  EM_ANALISE = 'EM_ANALISE',
  CONFIRMADA = 'CONFIRMADA',
  DESCARTADA = 'DESCARTADA',
}
export interface AuthUser {
  id: number;
  role: Role;
  name: string;
  email: string;
}
