import { ChangeEvent, ReactNode, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ImagePlus, XCircle } from 'lucide-react';
import { assetUrl, errMsg, uploadImage } from '../api';
import { CaseItem, CaseStatus, STATUS_LABEL } from '../types';

export function Logo({ size = 28, light = false }: { size?: number; light?: boolean }) {
  const c = light ? '#fff' : '#142b4a';
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle cx="24" cy="13" r="6" stroke="#176568" strokeWidth="3" />
      <path d="M10 30c4 8 9 12 14 14 5-2 10-6 14-14" stroke={c} strokeWidth="3" strokeLinecap="round" />
      <path d="M14 26c3-5 7-7 10-7s7 2 10 7" stroke="#176568" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export const initials = (n: string) => n.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
export function Avatar({ name, src, sm }: { name: string; src?: string | null; sm?: boolean }) {
  return src ? <img className={`avatar ${sm ? 'sm' : ''}`} src={assetUrl(src)} alt={`Foto de ${name}`} /> : <div className={`avatar ${sm ? 'sm' : ''}`} aria-hidden>{initials(name)}</div>;
}

const STATUS_CLASS: Record<CaseStatus, string> = { AGUARDANDO_ANALISE: 'amber', PUBLICADO: '', LOCALIZADO: 'navy', REJEITADO: 'red' };
export const StatusBadge = ({ status }: { status: CaseStatus }) => <span className={`badge ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>;
export const PriorityBadge = () => <span className="badge red">Prioritário</span>;

export function CaseCard({ c, to, extra, actions }: { c: CaseItem; to?: string; extra?: ReactNode; actions?: boolean }) {
  const link = to ?? `/casos/${c.id}`;
  return (
    <div className="card casecard-wrap">
      <Link to={link} className="casecard">
        <Avatar name={c.fullName} src={c.photoUrl} />
        <div className="info">
          <strong>{c.fullName}</strong>
          <span className="muted">{c.age} anos · {c.city}/{c.state}</span>
          <span className="muted">Desaparecida(o) em {new Date(c.disappearedAt + 'T12:00').toLocaleDateString('pt-BR')}</span>
          <div className="badges">{c.urgent && <PriorityBadge />}<StatusBadge status={c.status} />{extra}</div>
        </div>
      </Link>
      {actions && (
        <div className="row actions">
          <Link to={link} className="btn secondary small">Ver detalhes</Link>
          {c.status === 'PUBLICADO' && <Link to={`/casos/${c.id}/pista`} className="btn small">Enviar informação</Link>}
        </div>
      )}
    </div>
  );
}

export const Alert = ({ kind = 'error', children }: { kind?: 'error' | 'warn' | 'ok'; children: ReactNode }) => (
  <div className={`alert ${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
    {kind === 'error' ? <XCircle size={18} /> : kind === 'warn' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
    <div>{children}</div>
  </div>
);

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="field">{label}{children}{hint && <span className="hint">{hint}</span>}</label>;
}

export function ImageUpload({ value, onChange, label, hint }: { value?: string | null; onChange: (url: string) => void; label: string; hint?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const pick = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true); setErr('');
    try { onChange(await uploadImage(f)); } catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  };
  return (
    <div className="stack">
      <div className="muted" style={{ fontWeight: 500 }}>{label}</div>
      <button type="button" className="upload" onClick={() => ref.current?.click()}>
        {value ? <img src={assetUrl(value)} alt="Pré-visualização" /> : <ImagePlus />}
        <span>{busy ? 'Enviando…' : value ? 'Trocar imagem' : 'Toque para enviar (JPG ou PNG, até 5 MB)'}</span>
      </button>
      <input ref={ref} type="file" accept="image/jpeg,image/png" hidden onChange={pick} />
      {hint && <span className="muted">{hint}</span>}
      {err && <Alert>{err}</Alert>}
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="row between"><h2 style={{ margin: 0, fontSize: '1.05rem' }}>{title}</h2><button className="iconbtn" onClick={onClose} aria-label="Fechar"><XCircle /></button></div>
        {children}
      </div>
    </div>
  );
}
export const Empty = ({ children }: { children: ReactNode }) => <div className="empty">{children}</div>;
