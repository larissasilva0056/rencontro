import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Calendar, Eye, Flag, Info, MapPin, Phone, Ruler, Share2 } from 'lucide-react';
import { api, assetUrl, errMsg, fmtDate, fmtDateTime } from '../api';
import { useAuth } from '../auth';
import { Shell } from '../components/Shell';
import { Alert, Avatar, Empty, Modal, PriorityBadge, StatusBadge } from '../components/ui';
import { CaseItem } from '../types';

const NETWORKS = [['whatsapp', 'WhatsApp'], ['facebook', 'Facebook'], ['instagram', 'Instagram'], ['x', 'X (Twitter)'], ['telegram', 'Telegram'], ['link', 'Copiar link']];

export default function CaseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [c, setC] = useState<CaseItem | null>(null);
  const [hist, setHist] = useState<{ id: number; description: string; createdAt: string }[]>([]);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<'share' | 'report' | null>(null);
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    api.get(`/cases/${id}`).then((r) => setC(r.data)).catch((e) => setError(errMsg(e)));
    api.get(`/cases/${id}/updates`).then((r) => setHist(r.data)).catch(() => {});
  }, [id]);

  const share = async (network: string) => {
    try {
      const { data } = await api.post(`/cases/${id}/share`, { network });
      if (network === 'link' || !data.shareUrl) { await navigator.clipboard?.writeText(data.link); setMsg({ kind: 'ok', text: data.note ?? 'Link copiado.' }); }
      else window.open(data.shareUrl, '_blank', 'noopener');
      setModal(null);
    } catch (e) { setMsg({ kind: 'error', text: errMsg(e) }); setModal(null); }
  };
  const report = async () => {
    try { const { data } = await api.post(`/cases/${id}/report`, { reason }); setMsg({ kind: 'ok', text: data.message }); setReason(''); setModal(null); }
    catch (e) { setMsg({ kind: 'error', text: errMsg(e) }); }
  };
  const needLogin = (fn: () => void) => (user ? fn() : nav('/entrar', { state: { from: `/casos/${id}` } }));

  if (error) return <Shell title="Caso" back><div className="page"><Empty>{error}</Empty></div></Shell>;
  if (!c) return <Shell title="Caso" back><Empty>Carregando…</Empty></Shell>;
  const active = c.status === 'PUBLICADO';
  const privileged = user && (c.isOwner || ['ADMIN', 'ONG', 'ORGAO_GOVERNAMENTAL'].includes(user.role));

  return (
    <Shell title={c.fullName} back>
      <div className="page detail-layout">
        {c.photoUrl ? <img className="detail-photo" src={assetUrl(c.photoUrl)} alt={`Foto de ${c.fullName}`} /> : <div className="detail-photo"><Avatar name={c.fullName} /></div>}
        <div className="stack">
          <div>
            <div className="badges" style={{ marginBottom: 6 }}>{c.urgent && <PriorityBadge />}<StatusBadge status={c.status} /></div>
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{c.fullName}</h2>
            <div className="muted">{c.age} anos · {c.city}/{c.state}</div>
          </div>
          {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
          {c.status === 'AGUARDANDO_ANALISE' && <Alert kind="warn">Este caso está em verificação e ainda não é público. A divulgação em redes sociais só acontece com autorização da família responsável.</Alert>}
          {c.status === 'REJEITADO' && <Alert>Cadastro não aprovado{c.rejectionReason ? `: ${c.rejectionReason}` : '.'} Edite os dados para reenviar.</Alert>}
          {c.status === 'LOCALIZADO' && <Alert kind="ok">Esta pessoa foi localizada. Obrigado a todos que ajudaram.</Alert>}
          <div className="card">
            <div className="kv"><Calendar size={16} />Desaparecida(o) em {new Date(c.disappearedAt + 'T12:00').toLocaleDateString('pt-BR')}</div>
            <div className="kv"><MapPin size={16} />Última localização: {[c.lastSeenPlace, `${c.city}/${c.state}`].filter(Boolean).join(' · ')}</div>
            {privileged && c.contactInfo && <div className="kv"><Phone size={16} />Contato da família: {c.contactInfo}</div>}
          </div>
          <div className="card">
            <h2>Características</h2>
            {c.heightCm ? <div className="kv"><Ruler size={16} />Altura: {(c.heightCm / 100).toFixed(2).replace('.', ',')} m</div> : null}
            {c.eyeColor && <div className="kv"><Eye size={16} />Olhos: {c.eyeColor}</div>}
            {c.hairColor && <div className="kv"><Info size={16} />Cabelos: {c.hairColor}</div>}
            {c.skinColor && <div className="kv"><Info size={16} />Pele: {c.skinColor}</div>}
            {c.characteristics && <div className="kv"><Info size={16} />{c.characteristics}</div>}
            {c.circumstances && <div className="kv"><Info size={16} />{c.circumstances}</div>}
          </div>
          {active && (
            <div className="stack">
              <div className="row" style={{ flexWrap: 'wrap' }}>
                <button className="btn" style={{ flex: 1 }} onClick={() => needLogin(() => nav(`/casos/${id}/pista`))}>Tenho uma informação</button>
                <button className="btn secondary" style={{ flex: 1 }} disabled={!c.shareAuthorized} onClick={() => setModal('share')}><Share2 size={16} />Compartilhar caso</button>
              </div>
              {!c.shareAuthorized && <span className="muted">O compartilhamento será liberado quando a família autorizar.</span>}
              <div className="card row between"><span className="muted">Se você acredita que esta informação é falsa ou suspeita, nos avise.</span><button className="btn small danger" onClick={() => needLogin(() => setModal('report'))}><Flag size={14} />Sinalizar</button></div>
            </div>
          )}
          {c.isOwner && c.status !== 'LOCALIZADO' && <Link to={`/casos/${c.id}/editar`} className="btn navy">Atualizar ou encerrar caso</Link>}
          <div className="card">
            <h2>Histórico de atualizações</h2>
            {hist.length === 0 ? <span className="muted">Sem atualizações.</span> : <ul className="timeline">{hist.map((h) => <li key={h.id}><div>{h.description}</div><div className="muted">{fmtDateTime(h.createdAt)}</div></li>)}</ul>}
          </div>
          <p className="muted">Esta plataforma auxilia nas buscas e não substitui o trabalho das autoridades policiais.</p>
        </div>
      </div>

      {modal === 'share' && <Modal title="Compartilhar caso" onClose={() => setModal(null)}>{NETWORKS.map(([k, l]) => <button key={k} className="btn secondary" onClick={() => share(k)}>{l}</button>)}</Modal>}
      {modal === 'report' && (
        <Modal title="Sinalizar informação falsa ou suspeita" onClose={() => setModal(null)}>
          <textarea className="input" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explique o que parece incorreto ou suspeito (mín. 10 caracteres)." />
          <button className="btn" disabled={reason.trim().length < 10} onClick={report}>Enviar denúncia</button>
        </Modal>
      )}
    </Shell>
  );
}
