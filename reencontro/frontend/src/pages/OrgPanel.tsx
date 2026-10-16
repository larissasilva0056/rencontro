import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errMsg, fmtDateTime } from '../api';
import { useAuth } from '../auth';
import { Shell } from '../components/Shell';
import { Alert, CaseCard, Empty, Field, StatusBadge } from '../components/ui';
import { CaseItem } from '../types';

export default function OrgPanel() {
  const { user } = useAuth();
  const gov = user?.role === 'ORGAO_GOVERNAMENTAL';
  const [dash, setDash] = useState<any>(null);
  const [scope, setScope] = useState<'forwarded' | 'all'>('forwarded');
  const [cases, setCases] = useState<(CaseItem & { forwardNote?: string })[] | null>(null);
  const [comms, setComms] = useState<any[]>([]);
  const [form, setForm] = useState({ caseId: '', message: '' });
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const loadAll = () => {
    api.get('/organizations/dashboard').then((r) => setDash(r.data));
    api.get('/organizations/communications').then((r) => setComms(r.data));
  };
  useEffect(loadAll, []);
  useEffect(() => { setCases(null); api.get('/organizations/cases', { params: { scope } }).then((r) => setCases(r.data)).catch(() => setCases([])); }, [scope]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    try { await api.post('/organizations/communications', { caseId: +form.caseId, message: form.message }); setForm({ caseId: '', message: '' }); setMsg({ kind: 'ok', text: 'Comunicação registrada no histórico do caso.' }); loadAll(); }
    catch (x) { setMsg({ kind: 'error', text: errMsg(x) }); }
  };

  return (
    <Shell title={gov ? 'Órgãos governamentais' : 'Área de ONGs'}>
      <div className="page mid">
        <div className="card"><strong>{user?.organizationName ?? user?.name}</strong><div className="muted">{gov ? 'Canal de comunicação com autoridades' : 'Instituição parceira'}</div></div>
        {dash && <div className="stats"><div className="stat"><b>{dash.forwarded}</b><span>Casos encaminhados</span></div><div className="stat"><b>{dash.active}</b><span>Casos ativos</span></div><div className="stat"><b>{dash.communications}</b><span>Comunicações</span></div></div>}
        <Link to="/painel/ia" className="btn secondary">Triagem de pistas com apoio de IA</Link>

        <div className="tabs"><button className={`tab ${scope === 'forwarded' ? 'on' : ''}`} onClick={() => setScope('forwarded')}>Casos encaminhados</button><button className={`tab ${scope === 'all' ? 'on' : ''}`} onClick={() => setScope('all')}>Acompanhar todos</button></div>
        {cases === null ? <Empty>Carregando…</Empty> : cases.length === 0 ? <Empty>{scope === 'forwarded' ? 'Nenhum caso encaminhado a você ainda.' : 'Nenhum caso ativo.'}</Empty> : cases.map((c) => <div key={c.id} className="stack"><CaseCard c={c} />{c.forwardNote && <span className="muted">Nota: {c.forwardNote}</span>}</div>)}

        <form className="card stack" onSubmit={send}>
          <h2>Registrar comunicação</h2>
          {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
          <Field label="Caso"><select required value={form.caseId} onChange={(e) => setForm({ ...form, caseId: e.target.value })}><option value="">Selecione</option>{(cases ?? []).map((c) => <option key={c.id} value={c.id}>{c.fullName}</option>)}</select></Field>
          <Field label="Mensagem"><textarea required minLength={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></Field>
          <button className="btn">Registrar</button>
        </form>

        <h2 className="section-title">Últimos acessos</h2>
        {dash?.recentAccess?.length ? dash.recentAccess.map((a: any) => <div key={a.id} className="card row between"><Link to={`/casos/${a.caseId}`}>{a.fullName}</Link><span className="muted">{fmtDateTime(a.at)}</span></div>) : <Empty>Sem acessos recentes.</Empty>}
        {comms.length > 0 && <><h2 className="section-title">Comunicações registradas</h2>{comms.map((c) => <div key={c.id} className="card stack"><strong>{c.case.fullName}</strong><span>{c.message}</span><span className="muted">{fmtDateTime(c.createdAt)}</span></div>)}</>}
      </div>
    </Shell>
  );
}
