import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errMsg, fmtDateTime } from '../api';
import { Shell } from '../components/Shell';
import { TipReview } from '../components/TipReview';
import { Alert, CaseCard, Empty, Modal } from '../components/ui';
import { CaseItem, ROLE_LABEL, Role, Tip } from '../types';

type Tab = 'pending' | 'tips' | 'reports' | 'cases' | 'users' | 'audit';
interface Overview { pending: number; published: number; located: number; tipsInReview: number; openReports: number; pendingUsers: number }
interface Org { id: number; name: string; organizationName?: string; role: Role }
interface AdminUser { id: number; name: string; email: string; role: Role; approved: boolean; blocked: boolean; organizationName?: string }

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>('pending');
  const [ov, setOv] = useState<Overview | null>(null);
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [tips, setTips] = useState<Tip[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [msg, setMsg] = useState('');
  const [reject, setReject] = useState<CaseItem | null>(null);
  const [reason, setReason] = useState('');
  const [fwd, setFwd] = useState<CaseItem | null>(null);
  const [org, setOrg] = useState('');

  const load = useCallback(async () => {
    setOv((await api.get('/admin/overview')).data);
    if (tab === 'pending') setCases((await api.get('/admin/cases', { params: { status: 'AGUARDANDO_ANALISE' } })).data);
    if (tab === 'cases') setCases((await api.get('/admin/cases', { params: { status: 'PUBLICADO' } })).data);
    if (tab === 'tips') setTips((await api.get('/tips')).data);
    if (tab === 'reports') setReports((await api.get('/admin/reports')).data);
    if (tab === 'users') setUsers((await api.get('/admin/users')).data);
    if (tab === 'audit') setAudit((await api.get('/admin/audit')).data);
  }, [tab]);
  useEffect(() => { load().catch((e) => setMsg(errMsg(e))); }, [load]);

  const act = async (fn: () => Promise<unknown>) => { try { await fn(); setMsg(''); await load(); } catch (e) { setMsg(errMsg(e)); } };
  const approve = (c: CaseItem) => act(() => api.patch(`/admin/cases/${c.id}/review`, { approve: true }));
  const doReject = () => act(async () => { await api.patch(`/admin/cases/${reject!.id}/review`, { approve: false, reason }); setReject(null); setReason(''); });
  const remove = (c: CaseItem) => { if (confirm(`Remover definitivamente o caso de ${c.fullName}?`)) act(() => api.delete(`/admin/cases/${c.id}`)); };
  const openFwd = async (c: CaseItem) => { setOrgs((await api.get('/admin/organizations')).data); setFwd(c); };
  const doFwd = () => act(async () => { await api.post(`/admin/cases/${fwd!.id}/forward`, { organizationId: +org }); setFwd(null); setOrg(''); });

  const tabs: [Tab, string][] = [['pending', `Pendentes ${ov?.pending ?? ''}`], ['tips', `Pistas ${ov?.tipsInReview ?? ''}`], ['reports', `Denúncias ${ov?.openReports ?? ''}`], ['cases', 'Publicados'], ['audit', 'Auditoria'], ['users', `Usuários ${ov?.pendingUsers ? `(${ov.pendingUsers})` : ''}`]];
  return (
    <Shell title="Painel administrativo">
      <div className="page mid">
        {ov && <div className="stats"><div className="stat"><b>{ov.published}</b><span>Em busca</span></div><div className="stat"><b>{ov.located}</b><span>Localizados</span></div><div className="stat"><b>{ov.pending}</b><span>Pendentes</span></div></div>}
        <Link to="/painel/ia" className="btn secondary">Organização de pistas (IA)</Link>
        <div className="tabs" role="tablist">{tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} className={`tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>{l}</button>)}</div>
        {msg && <Alert>{msg}</Alert>}

        {(tab === 'pending' || tab === 'cases') && (cases.length === 0 ? <Empty>{tab === 'pending' ? 'Nenhum caso aguardando verificação.' : 'Nenhum caso publicado.'}</Empty> : cases.map((c) => (
          <div key={c.id} className="stack">
            <CaseCard c={c} />
            {c.contactInfo && <span className="muted">Responsável: {c.owner?.name} · {c.contactInfo}</span>}
            {tab === 'pending' ? <div className="row"><button className="btn small" style={{ flex: 1 }} onClick={() => approve(c)}>Aprovar e publicar</button><button className="btn small danger" style={{ flex: 1 }} onClick={() => setReject(c)}>Rejeitar</button></div>
              : <div className="row"><button className="btn small secondary" style={{ flex: 1 }} onClick={() => openFwd(c)}>Encaminhar a parceiro</button><button className="btn small danger" onClick={() => remove(c)}>Remover</button></div>}
          </div>)))}

        {tab === 'tips' && (tips.length === 0 ? <Empty>Nenhuma pista em análise.</Empty> : tips.map((t) => <TipReview key={t.id} tip={t} onDone={load} />))}

        {tab === 'reports' && (reports.length === 0 ? <Empty>Nenhuma denúncia aberta.</Empty> : reports.map((r) => (
          <div key={r.id} className="card stack"><Link to={`/casos/${r.case.id}`}><strong>{r.case.fullName}</strong></Link><span>{r.reason}</span><span className="muted">Por {r.reporter} · {fmtDateTime(r.createdAt)}</span>
            <div className="row"><button className="btn small" style={{ flex: 1 }} onClick={() => act(() => api.patch(`/admin/reports/${r.id}/resolve`))}>Marcar como resolvida</button><button className="btn small danger" onClick={() => remove({ id: r.case.id, fullName: r.case.fullName } as CaseItem)}>Remover caso</button></div></div>)))}

        {tab === 'audit' && (audit.length === 0 ? <Empty>Nenhuma ação registrada.</Empty> : audit.map((a) => <div key={a.id} className="card row between"><div><strong>{a.action}</strong><div className="muted">{a.actor}{a.targetType ? ` · ${a.targetType} #${a.targetId}` : ''}{a.details ? ` · ${a.details}` : ''}</div></div><span className="muted">{fmtDateTime(a.createdAt)}</span></div>))}

        {tab === 'users' && users.map((u) => (
          <div key={u.id} className="card stack"><div className="row between"><strong>{u.name}</strong><span className="badge slate">{ROLE_LABEL[u.role]}</span></div><span className="muted">{u.email}{u.organizationName ? ` · ${u.organizationName}` : ''}</span>
            <div className="badges">{!u.approved && <span className="badge amber">Aguardando aprovação</span>}{u.blocked && <span className="badge red">Bloqueado</span>}</div>
            {u.role !== 'ADMIN' && <div className="row">{!u.approved && <button className="btn small" onClick={() => act(() => api.patch(`/admin/users/${u.id}`, { approved: true }))}>Aprovar</button>}<button className="btn small danger" onClick={() => act(() => api.patch(`/admin/users/${u.id}`, { blocked: !u.blocked }))}>{u.blocked ? 'Desbloquear' : 'Bloquear'}</button></div>}
          </div>))}
      </div>

      {reject && <Modal title={`Rejeitar: ${reject.fullName}`} onClose={() => setReject(null)}><textarea className="input" rows={3} placeholder="Motivo (a família verá esta mensagem)" value={reason} onChange={(e) => setReason(e.target.value)} /><button className="btn danger" disabled={!reason.trim()} onClick={doReject}>Confirmar rejeição</button></Modal>}
      {fwd && <Modal title={`Encaminhar: ${fwd.fullName}`} onClose={() => setFwd(null)}>{orgs.length === 0 ? <span className="muted">Nenhuma ONG ou órgão aprovado.</span> : <select className="input" value={org} onChange={(e) => setOrg(e.target.value)}><option value="">Selecione a instituição</option>{orgs.map((o) => <option key={o.id} value={o.id}>{o.organizationName ?? o.name} ({ROLE_LABEL[o.role]})</option>)}</select>}<button className="btn" disabled={!org} onClick={doFwd}>Encaminhar caso</button></Modal>}
    </Shell>
  );
}
