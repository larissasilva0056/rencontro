import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, errMsg, fmtDateTime } from '../api';
import { Shell } from '../components/Shell';
import { Alert, Empty, Field, Modal } from '../components/ui';
import { CaseItem, Tip } from '../types';

export default function EditCase() {
  const { id } = useParams();
  const nav = useNavigate();
  const [c, setC] = useState<CaseItem | null>(null);
  const [f, setF] = useState({ characteristics: '', lastSeenPlace: '', circumstances: '', contactInfo: '', note: '' });
  const [share, setShare] = useState(false);
  const [tips, setTips] = useState<Tip[]>([]);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    api.get(`/cases/${id}`).then((r) => { const d: CaseItem = r.data; setC(d); setShare(d.shareAuthorized); setF({ characteristics: d.characteristics ?? '', lastSeenPlace: d.lastSeenPlace ?? '', circumstances: d.circumstances ?? '', contactInfo: d.contactInfo ?? '', note: '' }); })
      .catch((e) => setMsg({ kind: 'error', text: errMsg(e) }));
    api.get(`/cases/${id}/tips`).then((r) => setTips(r.data)).catch(() => {});
  }, [id]);

  const save = async () => {
    try { await api.patch(`/cases/${id}`, Object.fromEntries(Object.entries(f).filter(([, v]) => v.trim() !== ''))); setMsg({ kind: 'ok', text: 'Atualização registrada no histórico do caso.' }); }
    catch (e) { setMsg({ kind: 'error', text: errMsg(e) }); }
  };
  const toggleShare = async (v: boolean) => {
    try { await api.patch(`/cases/${id}/share-authorization`, { authorized: v }); setShare(v); } catch (e) { setMsg({ kind: 'error', text: errMsg(e) }); }
  };
  const located = async () => {
    try { await api.post(`/cases/${id}/located`, { note: f.note || undefined }); nav(`/casos/${id}`); } catch (e) { setMsg({ kind: 'error', text: errMsg(e) }); setConfirm(false); }
  };
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  if (!c) return <Shell title="Atualizar caso" back>{msg ? <div className="page narrow"><Alert>{msg.text}</Alert></div> : <Empty>Carregando…</Empty>}</Shell>;
  return (
    <Shell title={`Atualizar: ${c.fullName}`} back>
      <div className="page narrow">
        {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
        {c.status === 'REJEITADO' && <Alert>Motivo da rejeição: {c.rejectionReason}. Ao salvar, o caso volta para verificação.</Alert>}
        <Field label="Características"><textarea value={f.characteristics} onChange={set('characteristics')} /></Field>
        <Field label="Último local visto"><input value={f.lastSeenPlace} onChange={set('lastSeenPlace')} /></Field>
        <Field label="Circunstâncias / novas informações"><textarea value={f.circumstances} onChange={set('circumstances')} /></Field>
        <Field label="Contato do responsável"><input value={f.contactInfo} onChange={set('contactInfo')} /></Field>
        <Field label="Nota para o histórico (opcional)"><input value={f.note} onChange={set('note')} /></Field>
        <button className="btn" onClick={save}>Salvar atualização</button>
        <label className="check card"><input type="checkbox" checked={share} onChange={(e) => toggleShare(e.target.checked)} /><span>Autorizo o compartilhamento deste caso em redes sociais.</span></label>
        {tips.length > 0 && <div className="card stack"><h2>Pistas recebidas ({tips.length})</h2>{tips.map((t) => <div key={t.id} className="stack"><span>{t.description}</span><span className="muted">{fmtDateTime(t.createdAt)} · {t.status === 'EM_ANALISE' ? 'Em análise' : t.status === 'CONFIRMADA' ? 'Confirmada' : 'Descartada'}</span></div>)}</div>}
        {c.status === 'PUBLICADO' && <button className="btn danger" onClick={() => setConfirm(true)}>Marcar como localizada</button>}
      </div>
      {confirm && <Modal title="Pessoa localizada?" onClose={() => setConfirm(false)}><p className="muted" style={{ margin: 0 }}>O caso será encerrado e sairá da lista de buscas ativas. Essa ação não pode ser desfeita.</p><button className="btn" onClick={located}>Confirmar: pessoa localizada</button></Modal>}
    </Shell>
  );
}
