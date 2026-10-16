import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errMsg } from '../api';
import { Shell } from '../components/Shell';
import { Alert, Field, ImageUpload } from '../components/ui';
import { UFS } from '../types';

const init = {
  fullName: '', age: '', birthDate: '', heightCm: '', eyeColor: '', hairColor: '', skinColor: '', characteristics: '', photoUrl: '', imageAuthorization: false,
  disappearedAt: '', city: '', state: 'SP', lastSeenPlace: '', circumstances: '', vulnerable: false,
  contactInfo: '', shareAuthorized: false, acceptedTerms: false,
};
type F = typeof init;

export default function CaseWizard() {
  const [step, setStep] = useState(1);
  const [f, setF] = useState<F>(init);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ id: number; urgent: boolean } | null>(null);
  const set = (k: keyof F) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value });

  const today = new Date().toISOString().slice(0, 10);
  const hasFeature = f.heightCm || f.eyeColor || f.hairColor || f.skinColor || f.characteristics.trim();
  const valid: Record<number, string | null> = {
    1: f.fullName.trim().length < 3 ? 'Informe o nome completo.' : f.age === '' || +f.age < 0 || +f.age > 120 ? 'Informe uma idade válida.' : !hasFeature ? 'Informe ao menos uma característica física.' : !f.photoUrl ? 'Envie uma foto para divulgação.' : !f.imageAuthorization ? 'É necessário ter autorização para o uso da imagem.' : null,
    2: !f.disappearedAt ? 'Informe a data do desaparecimento.' : f.disappearedAt > today ? 'A data não pode estar no futuro.' : f.city.trim().length < 2 ? 'Informe a cidade.' : null,
    3: !f.contactInfo.trim() ? 'Informe um contato para as autoridades e parceiros.' : null,
    4: !f.acceptedTerms ? 'Aceite o termo de responsabilidade.' : null,
  };
  const next = () => { const e = valid[step]; if (e) setErr(e); else { setErr(''); setStep(step + 1); } };

  const submit = async () => {
    setBusy(true); setErr('');
    try {
      const body = {
        fullName: f.fullName.trim(), age: +f.age, birthDate: f.birthDate || undefined, heightCm: f.heightCm ? Math.round(+f.heightCm) : undefined,
        eyeColor: f.eyeColor || undefined, hairColor: f.hairColor || undefined, skinColor: f.skinColor || undefined, characteristics: f.characteristics || undefined,
        photoUrl: f.photoUrl, imageAuthorization: f.imageAuthorization, disappearedAt: f.disappearedAt, city: f.city.trim(), state: f.state,
        lastSeenPlace: f.lastSeenPlace || undefined, circumstances: f.circumstances || undefined, vulnerable: f.vulnerable,
        contactInfo: f.contactInfo.trim(), shareAuthorized: f.shareAuthorized, acceptedTerms: f.acceptedTerms,
      };
      setResult((await api.post('/cases', body)).data);
    } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  };

  if (result) return (
    <Shell title="Cadastro enviado">
      <div className="page narrow">
        <Alert kind="ok">Caso enviado para verificação. Ele será publicado assim que for aprovado por um revisor.{result.urgent ? ' Casos urgentes têm prioridade na análise.' : ''}</Alert>
        <Link to="/painel" className="btn">Ver meus casos</Link>
      </div>
    </Shell>
  );

  return (
    <Shell title="Cadastrar desaparecimento" back>
      <div className="page narrow">
        <div className="stepper" aria-label={`Passo ${step} de 4`}>{['Dados', 'Desaparecimento', 'Responsável', 'Revisão'].map((l, i) => <div key={l}><span className={`step ${i + 1 <= step ? 'on' : ''}`}>{i + 1}</span><span className="lbl">{l}</span></div>)}</div>
        {err && <Alert>{err}</Alert>}

        {step === 1 && <div className="stack">
          <h2 className="section-title">Dados da pessoa <span className="muted">· Passo 1 de 4</span></h2>
          <Field label="Nome completo *"><input value={f.fullName} onChange={set('fullName')} placeholder="Ex.: Ana Souza" /></Field>
          <div className="row"><Field label="Idade *"><input type="number" min={0} max={120} value={f.age} onChange={set('age')} /></Field><Field label="Nascimento"><input type="date" value={f.birthDate} max={today} onChange={set('birthDate')} /></Field></div>
          <div className="row"><Field label="Altura (cm)"><input type="number" min={30} max={250} value={f.heightCm} onChange={set('heightCm')} /></Field><Field label="Cor dos olhos"><input value={f.eyeColor} onChange={set('eyeColor')} placeholder="castanhos" /></Field></div>
          <div className="row"><Field label="Cabelos"><input value={f.hairColor} onChange={set('hairColor')} placeholder="longos e lisos" /></Field><Field label="Pele"><input value={f.skinColor} onChange={set('skinColor')} placeholder="clara" /></Field></div>
          <Field label="Outras características" hint="Cicatrizes, tatuagens, roupas, objetos pessoais…"><textarea value={f.characteristics} onChange={set('characteristics')} /></Field>
          <ImageUpload label="Foto para divulgação *" value={f.photoUrl} onChange={(u) => setF({ ...f, photoUrl: u })} />
          <label className="check"><input type="checkbox" checked={f.imageAuthorization} onChange={set('imageAuthorization')} /><span>Tenho autorização para usar esta imagem na divulgação do caso.</span></label>
        </div>}

        {step === 2 && <div className="stack">
          <h2 className="section-title">Desaparecimento <span className="muted">· Passo 2 de 4</span></h2>
          <Field label="Data do desaparecimento *"><input type="date" max={today} value={f.disappearedAt} onChange={set('disappearedAt')} /></Field>
          <div className="row"><Field label="Cidade *"><input value={f.city} onChange={set('city')} /></Field><Field label="UF *"><select value={f.state} onChange={set('state')}>{UFS.map((u) => <option key={u}>{u}</option>)}</select></Field></div>
          <Field label="Último local visto" hint="Bairro, ponto de referência…"><input value={f.lastSeenPlace} onChange={set('lastSeenPlace')} /></Field>
          <Field label="Circunstâncias"><textarea value={f.circumstances} onChange={set('circumstances')} /></Field>
          <label className="check"><input type="checkbox" checked={f.vulnerable} onChange={set('vulnerable')} /><span>A pessoa é vulnerável (idosa, com deficiência, problema de saúde ou necessita de medicação). Menores de 18 anos já recebem prioridade automaticamente.</span></label>
        </div>}

        {step === 3 && <div className="stack">
          <h2 className="section-title">Contato e divulgação <span className="muted">· Passo 3 de 4</span></h2>
          <Field label="Contato do responsável *" hint="Visível apenas para você, administradores, ONGs e órgãos autorizados. Não aparece publicamente."><input value={f.contactInfo} onChange={set('contactInfo')} placeholder="Telefone ou e-mail" /></Field>
          <label className="check"><input type="checkbox" checked={f.shareAuthorized} onChange={set('shareAuthorized')} /><span>Autorizo o compartilhamento do card deste caso em redes sociais após a publicação. Você pode revogar a qualquer momento.</span></label>
          <Alert kind="warn">Não compartilhe informações sensíveis ou dados pessoais desnecessários.</Alert>
        </div>}

        {step === 4 && <div className="stack">
          <h2 className="section-title">Revisão <span className="muted">· Passo 4 de 4</span></h2>
          <div className="card stack"><strong>{f.fullName}, {f.age} anos</strong><span className="muted">Desaparecida(o) em {f.disappearedAt && new Date(f.disappearedAt + 'T12:00').toLocaleDateString('pt-BR')} · {f.city}/{f.state}</span><span className="muted">Divulgação em redes: {f.shareAuthorized ? 'autorizada' : 'não autorizada'}</span>{(f.vulnerable || +f.age < 18) && <span className="badge red" style={{ width: 'fit-content' }}>Caso prioritário</span>}</div>
          <Alert kind="warn">Todo caso passa por verificação antes de ser publicado, para evitar a circulação de informações falsas.</Alert>
          <label className="check"><input type="checkbox" checked={f.acceptedTerms} onChange={set('acceptedTerms')} /><span>Declaro que as informações são verdadeiras e assumo a responsabilidade por elas (termo de responsabilidade).</span></label>
        </div>}

        <div className="row">
          {step > 1 && <button className="btn secondary" onClick={() => { setErr(''); setStep(step - 1); }}>Voltar</button>}
          {step < 4 ? <button className="btn" style={{ flex: 1 }} onClick={next}>Próximo</button> : <button className="btn" style={{ flex: 1 }} disabled={busy || !f.acceptedTerms} onClick={submit}>{busy ? 'Enviando…' : 'Enviar para verificação'}</button>}
        </div>
      </div>
    </Shell>
  );
}
