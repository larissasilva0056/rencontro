import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errMsg, fmtDateTime } from '../api';
import { Tip } from '../types';
import { Alert } from './ui';

export function TipReview({ tip, onDone }: { tip: Tip; onDone: () => void }) {
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const decide = async (decision: 'CONFIRMADA' | 'DESCARTADA') => {
    try { await api.patch(`/tips/${tip.id}/review`, { decision, note: note || undefined }); onDone(); } catch (e) { setErr(errMsg(e)); }
  };
  const a = tip.analysis;
  return (
    <div className="card stack">
      <div className="row between"><Link to={`/casos/${tip.case?.id}`}><strong>{tip.case?.fullName}</strong></Link><span className="muted">{fmtDateTime(tip.createdAt)}</span></div>
      <div>{tip.description}</div>
      {tip.possibleLocation && <span className="muted">Local: {tip.possibleLocation}</span>}
      {tip.contact && <span className="muted">Contato: {tip.contact}</span>}
      {a && <>
        <div className={`compat ${a.compatibility >= 70 ? 'hi' : ''}`} aria-label={`Compatibilidade ${a.compatibility}%`}><i style={{ width: `${a.compatibility}%` }} /></div>
        <span className="muted">IA ({a.source === 'gemini' ? 'Gemini' : 'análise local'}): {a.summary}</span>
        {a.priorityAlert && <span className="badge amber" style={{ width: 'fit-content' }}>Alerta de prioridade</span>}
      </>}
      {err && <Alert>{err}</Alert>}
      <input className="input" placeholder="Nota do revisor (opcional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="row"><button className="btn small" style={{ flex: 1 }} onClick={() => decide('CONFIRMADA')}>Confirmar pista</button><button className="btn small danger" style={{ flex: 1 }} onClick={() => decide('DESCARTADA')}>Descartar</button></div>
    </div>
  );
}
