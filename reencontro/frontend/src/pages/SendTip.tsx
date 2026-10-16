import { FormEvent, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { api, errMsg } from '../api';
import { Shell } from '../components/Shell';
import { Alert, Field, ImageUpload } from '../components/ui';

export default function SendTip() {
  const { id } = useParams();
  const [f, setF] = useState({ description: '', seenAt: '', possibleLocation: '', photoUrl: '', contact: '' });
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const body = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ''));
      setOk((await api.post(`/cases/${id}/tips`, body)).data.message);
    } catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  };
  if (ok) return <Shell title="Enviar pista"><div className="page narrow"><Alert kind="ok">{ok}</Alert><Link to={`/casos/${id}`} className="btn">Voltar ao caso</Link></div></Shell>;
  return (
    <Shell title="Enviar pista" back>
      <form className="page narrow" onSubmit={submit}>
        <div><strong>Sua informação pode ajudar a encontrar essa pessoa.</strong></div>
        {err && <Alert>{err}</Alert>}
        <Field label="Descrição da pista *"><textarea required minLength={10} value={f.description} onChange={set('description')} placeholder="Conte mais detalhes: onde viu, com quem estava, como estava vestida(o)…" /></Field>
        <Field label="Data e horário (opcional)"><input type="datetime-local" value={f.seenAt} onChange={set('seenAt')} /></Field>
        <Field label="Possível localização (opcional)"><input value={f.possibleLocation} onChange={set('possibleLocation')} placeholder="Bairro, cidade, ponto de referência" /></Field>
        <ImageUpload label="Anexar imagem (opcional)" value={f.photoUrl} onChange={(u) => setF({ ...f, photoUrl: u })} />
        <Field label="Deixar contato (opcional)" hint="Só será visto pela equipe de análise e por parceiros autorizados."><input value={f.contact} onChange={set('contact')} placeholder="E-mail ou telefone" /></Field>
        <div className="alert warn"><ShieldAlert size={18} /><div>Não compartilhe informações sensíveis ou dados pessoais de terceiros. Toda pista fica em análise e nada é confirmado sem verificação.</div></div>
        <button className="btn block" disabled={busy}>{busy ? 'Enviando…' : 'Enviar pista'}</button>
      </form>
    </Shell>
  );
}
