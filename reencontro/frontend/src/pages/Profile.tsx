import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, errMsg } from '../api';
import { useAuth } from '../auth';
import { Shell } from '../components/Shell';
import { Alert, Field } from '../components/ui';
import { ROLE_LABEL, Role } from '../types';

const PERMS: Record<Role, string[]> = {
  FAMILIAR: ['Cadastrar e atualizar seus casos', 'Autorizar ou revogar divulgação em redes sociais', 'Marcar o caso como localizado', 'Enviar pistas e sinalizar informações suspeitas'],
  CIDADAO: ['Buscar casos', 'Enviar pistas e sinalizar informações suspeitas'],
  ONG: ['Visualizar casos e contatos autorizados', 'Apoiar a triagem e a divulgação', 'Revisar pistas e registrar comunicações'],
  ORGAO_GOVERNAMENTAL: ['Acessar painel de atividades', 'Receber casos encaminhados', 'Revisar pistas e registrar comunicações oficiais'],
  ADMIN: ['Verificar e publicar casos', 'Moderar conteúdo, pistas e denúncias', 'Bloquear usuários e remover casos', 'Aprovar ONGs e órgãos'],
};

export default function Profile() {
  const { user, refresh, logout } = useAuth();
  const nav = useNavigate();
  const [p, setP] = useState({ name: user!.name, phone: user!.phone ?? '' });
  const [pw, setPw] = useState({ current: '', next: '' });
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [large, setLarge] = useState(localStorage.getItem('a11y-large') === '1');
  const [contrast, setContrast] = useState(localStorage.getItem('a11y-contrast') === '1');

  const saveProfile = async (e: FormEvent) => { e.preventDefault(); try { await api.patch('/auth/me', { name: p.name, phone: p.phone || undefined }); await refresh(); setMsg({ kind: 'ok', text: 'Dados atualizados.' }); } catch (x) { setMsg({ kind: 'error', text: errMsg(x) }); } };
  const savePw = async (e: FormEvent) => { e.preventDefault(); try { await api.patch('/auth/password', pw); setPw({ current: '', next: '' }); setMsg({ kind: 'ok', text: 'Senha alterada.' }); } catch (x) { setMsg({ kind: 'error', text: errMsg(x) }); } };
  const toggle = (key: string, cls: string, v: boolean, set: (b: boolean) => void) => { set(v); localStorage.setItem(key, v ? '1' : '0'); document.documentElement.classList.toggle(cls, v); };

  return (
    <Shell title="Perfil e configurações">
      <div className="page narrow">
        {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
        <form className="card stack" onSubmit={saveProfile}>
          <h2>Dados pessoais</h2>
          <Field label="Nome"><input value={p.name} minLength={3} onChange={(e) => setP({ ...p, name: e.target.value })} /></Field>
          <Field label="E-mail"><input value={user!.email} disabled /></Field>
          <Field label="Telefone"><input value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} /></Field>
          <button className="btn">Salvar dados</button>
        </form>
        <div className="card stack"><h2>Tipo de perfil e permissões</h2><span className="badge" style={{ width: 'fit-content' }}>{ROLE_LABEL[user!.role]}</span><ul className="muted" style={{ margin: 0, paddingLeft: 18 }}>{PERMS[user!.role].map((x) => <li key={x}>{x}</li>)}</ul></div>
        <form className="card stack" onSubmit={savePw}>
          <h2>Alterar senha</h2>
          <Field label="Senha atual"><input type="password" required autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></Field>
          <Field label="Nova senha"><input type="password" required minLength={8} autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></Field>
          <button className="btn secondary">Alterar senha</button>
        </form>
        <div className="card stack"><h2>Acessibilidade</h2>
          <label className="check"><input type="checkbox" checked={large} onChange={(e) => toggle('a11y-large', 'large', e.target.checked, setLarge)} /><span>Texto maior</span></label>
          <label className="check"><input type="checkbox" checked={contrast} onChange={(e) => toggle('a11y-contrast', 'contrast', e.target.checked, setContrast)} /><span>Alto contraste</span></label></div>
        <div className="card stack"><h2>Privacidade</h2><span className="muted">Seus dados são protegidos conforme a LGPD e usados apenas para os fins da plataforma. Contatos de familiares nunca aparecem publicamente.</span></div>
        <button className="btn danger" onClick={() => { logout(); nav('/inicio'); }}>Sair</button>
      </div>
    </Shell>
  );
}
