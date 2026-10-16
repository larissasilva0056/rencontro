import { ReactNode, useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, HelpCircle, Home, LayoutDashboard, LogOut, Menu, PlusCircle, Search, Settings, Sparkles, User as UserIcon, FolderOpen } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';
import { Footer } from './Footer';
import { Logo } from './ui';

export function dashboardPath(role?: string) {
  switch (role) {
    case 'ADMIN': return '/painel/admin';
    case 'ONG': return '/painel/ong';
    case 'ORGAO_GOVERNAMENTAL': return '/painel/governo';
    default: return '/painel/familiar';
  }
}
const LINKS: [string, string][] = [['/inicio', 'Início'], ['/buscar', 'Pessoas desaparecidas'], ['/como-ajudar', 'Como ajudar'], ['/instituicoes', 'Instituições parceiras']];

export function Shell({ children, title, back, home }: { children: ReactNode; title?: string; back?: boolean | string; home?: boolean }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const canRegister = user?.role === 'FAMILIAR' || user?.role === 'ONG';
  const staff = user?.role === 'ADMIN' || user?.role === 'ONG' || user?.role === 'ORGAO_GOVERNAMENTAL';
  const go = (p: string) => { setOpen(false); nav(p); };
  const showTitle = !!title && !home;

  useEffect(() => {
    if (!user) { setUnread(0); return; }
    api.get('/notifications/unread-count').then((r) => setUnread(r.data.count)).catch(() => {});
  }, [user, title]);

  return (
    <div className="shell">
      <header className="topbar">
        <div className="inner">
          {back ? <button className="iconbtn" aria-label="Voltar" onClick={() => (typeof back === 'string' ? nav(back) : nav(-1))}><ArrowLeft /></button> : null}
          <Link to="/inicio" className={`brand ${showTitle ? 'brand-hide-mobile' : ''}`}><Logo light />Reencontro</Link>
          {showTitle && <h1 className="title-mobile-only">{title}</h1>}
          <nav className="dnav" aria-label="Principal">{LINKS.map(([to, l]) => <NavLink key={to} to={to}>{l}</NavLink>)}</nav>
          <div className="dactions">
            {user ? (
              <>
                <Link to="/notificacoes" className="iconbtn" aria-label={`Notificações${unread ? `, ${unread} novas` : ''}`}><Bell size={20} />{unread > 0 && <span className="badge amber" style={{ marginLeft: -6 }}>{unread}</span>}</Link>
                <Link className="btn small ghost" to={dashboardPath(user.role)}>Painel</Link>
                <Link className="btn small ghost" to="/perfil">Perfil</Link>
                <button className="btn small light" onClick={() => { logout(); nav('/inicio'); }}>Sair</button>
              </>
            ) : (
              <><Link className="btn small ghost" to="/entrar">Entrar</Link><Link className="btn small light" to="/cadastro">Cadastrar</Link></>
            )}
          </div>
          <button className="iconbtn hamb" aria-label="Abrir menu" onClick={() => setOpen(true)}><Menu />{unread > 0 && <span className="badge amber">{unread}</span>}</button>
        </div>
      </header>
      <div className="grow">{children}</div>
      <Footer />
      {open && (
        <>
          <div className="drawer-back" onClick={() => setOpen(false)} />
          <aside className="drawer" aria-label="Menu">
            <div className="row" style={{ marginBottom: 12 }}>
              <div className="avatar sm" style={{ background: '#fff' }}>{user ? user.name[0] : '?'}</div>
              <div><div style={{ fontWeight: 600 }}>{user?.name ?? 'Visitante'}</div><div style={{ opacity: .7, fontSize: '.8rem' }}>{user ? user.email : 'Entre para colaborar'}</div></div>
            </div>
            <button onClick={() => go('/inicio')}><Home size={18} />Início</button>
            <button onClick={() => go('/buscar')}><Search size={18} />Buscar pessoas</button>
            {user && <button onClick={() => go(dashboardPath(user.role))}><FolderOpen size={18} />{user.role === 'FAMILIAR' ? 'Meus casos' : 'Meu painel'}</button>}
            {staff && <button onClick={() => go('/painel/ia')}><Sparkles size={18} />Organização de pistas (IA)</button>}
            {canRegister && <button onClick={() => go('/cadastrar')}><PlusCircle size={18} />Cadastrar desaparecimento</button>}
            {user && <button onClick={() => go('/notificacoes')}><Bell size={18} />Notificações{unread > 0 ? ` (${unread})` : ''}</button>}
            {user && <button onClick={() => go('/perfil')}><Settings size={18} />Perfil e configurações</button>}
            <button onClick={() => go('/como-ajudar')}><HelpCircle size={18} />Como ajudar e segurança</button>
            <button onClick={() => go('/instituicoes')}><LayoutDashboard size={18} />Instituições parceiras</button>
            <div style={{ flex: 1 }} />
            {user ? <button onClick={() => { logout(); go('/inicio'); }}><LogOut size={18} />Sair</button> : <button onClick={() => go('/entrar')}><UserIcon size={18} />Entrar</button>}
          </aside>
        </>
      )}
      <nav className="nav" aria-label="Navegação principal">
        <NavLink to="/inicio"><Home size={20} />Início</NavLink>
        <NavLink to="/buscar"><Search size={20} />Buscar</NavLink>
        {canRegister ? <NavLink to="/cadastrar"><PlusCircle size={20} />Cadastrar</NavLink> : user ? <NavLink to={dashboardPath(user.role)}><LayoutDashboard size={20} />Painel</NavLink> : <NavLink to="/cadastro"><PlusCircle size={20} />Criar conta</NavLink>}
        {user && <NavLink to="/notificacoes"><Bell size={20} />Avisos</NavLink>}
        <NavLink to={user ? '/perfil' : '/entrar'}><UserIcon size={20} />{user ? 'Perfil' : 'Entrar'}</NavLink>
      </nav>
    </div>
  );
}
