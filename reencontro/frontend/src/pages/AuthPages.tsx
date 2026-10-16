import { FormEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { errMsg } from '../api';
import { useAuth } from '../auth';
import { Shell, dashboardPath } from '../components/Shell';
import { Alert, Field, Logo } from '../components/ui';
import { Role } from '../types';

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation() as any;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await login(email, password); nav(loc.state?.from ?? '/painel', { replace: true }); } catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  };
  return (
    <Shell title="Entrar" back="/inicio">
      <form className="page narrow" onSubmit={submit}>
        <div style={{ textAlign: 'center' }}><Logo size={56} /><h2 style={{ margin: '8px 0 0' }}>Bem-vindo(a)!</h2><p className="muted">Entre na sua conta para continuar.</p></div>
        {err && <Alert>{err}</Alert>}
        <Field label="E-mail"><input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="exemplo@email.com" /></Field>
        <Field label="Senha"><input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Digite sua senha" /></Field>
        <button className="btn block" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
        <Link to="/cadastro" className="btn secondary block">Criar uma conta</Link>
        <p className="muted" style={{ textAlign: 'center' }}>Ajudando pessoas a se reencontrarem.</p>
      </form>
    </Shell>
  );
}

export function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'FAMILIAR' as Role, organizationName: '', phone: '', acceptedTerms: false });
  const [err, setErr] = useState('');
  const [done, setDone] = useState('');
  const [busy, setBusy] = useState(false);
  const isOrg = f.role === 'ONG' || f.role === 'ORGAO_GOVERNAMENTAL';
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const r = await register({ ...f, organizationName: isOrg ? f.organizationName : undefined, phone: f.phone || undefined });
      if (r.pendingApproval) setDone(r.message ?? ''); else nav(dashboardPath(f.role), { replace: true });
    } catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  };
  if (done) return <Shell title="Cadastro recebido" back="/inicio"><div className="page narrow"><Alert kind="ok">{done}</Alert><Link to="/inicio" className="btn">Voltar ao início</Link></div></Shell>;
  return (
    <Shell title="Criar conta" back="/entrar">
      <form className="page narrow" onSubmit={submit}>
        {err && <Alert>{err}</Alert>}
        <Field label="Tipo de usuário"><select value={f.role} onChange={set('role')}><option value="FAMILIAR">Familiar ou responsável</option><option value="CIDADAO">Cidadão (quero ajudar com pistas)</option><option value="ONG">ONG parceira</option><option value="ORGAO_GOVERNAMENTAL">Órgão governamental</option></select></Field>
        {isOrg && <><Alert kind="warn">Contas de instituições são validadas por um administrador antes do primeiro acesso.</Alert><Field label="Nome da instituição"><input required value={f.organizationName} onChange={set('organizationName')} /></Field></>}
        <Field label="Nome completo"><input required minLength={3} autoComplete="name" value={f.name} onChange={set('name')} /></Field>
        <Field label="E-mail"><input type="email" required autoComplete="email" value={f.email} onChange={set('email')} /></Field>
        <Field label="Telefone (opcional)"><input type="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} /></Field>
        <Field label="Senha" hint="Mínimo de 8 caracteres."><input type="password" required minLength={8} autoComplete="new-password" value={f.password} onChange={set('password')} /></Field>
        <label className="check"><input type="checkbox" checked={f.acceptedTerms} onChange={(e) => setF({ ...f, acceptedTerms: e.target.checked })} /><span>Li e aceito os <Link to="/termos">termos de uso e a política de privacidade (LGPD)</Link>.</span></label>
        <button className="btn block" disabled={busy || !f.acceptedTerms}>{busy ? 'Criando…' : 'Criar conta'}</button>
      </form>
    </Shell>
  );
}
