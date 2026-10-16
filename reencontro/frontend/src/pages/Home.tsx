import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartHandshake, Lightbulb, Search as SearchIcon, Users } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';
import { CaseCard, Empty } from '../components/ui';
import { Shell } from '../components/Shell';
import { CaseItem } from '../types';

export default function Home() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [items, setItems] = useState<CaseItem[] | null>(null);
  const [stats, setStats] = useState<{ active: number; located: number; partners: number } | null>(null);
  useEffect(() => {
    api.get('/cases', { params: { limit: 6, sort: 'relevant' } }).then((r) => setItems(r.data.items)).catch(() => setItems([]));
    api.get('/public/stats').then((r) => setStats(r.data)).catch(() => {});
  }, []);
  const submit = (e: FormEvent) => { e.preventDefault(); nav(`/buscar?q=${encodeURIComponent(q)}`); };
  const canRegister = user?.role === 'FAMILIAR' || user?.role === 'ONG';

  return (
    <Shell home>
      <div className="hero-wrap">
        <section className="hero">
          <small>PLATAFORMA DE BUSCA E LOCALIZAÇÃO DE PESSOAS DESAPARECIDAS</small>
          <h2>Ajudar alguém a voltar para casa começa com uma informação.</h2>
          <p>Aqui, familiares, cidadãos, ONGs e órgãos públicos se unem para encontrar pessoas desaparecidas.</p>
          <div className="cta">
            <Link to="/buscar" className="btn">Buscar pessoas</Link>
            <Link to={canRegister ? '/cadastrar' : user ? '/painel' : '/cadastro'} className="btn secondary">{canRegister ? 'Cadastrar desaparecimento' : user ? 'Meu painel' : 'Criar conta para cadastrar'}</Link>
          </div>
        </section>
      </div>
      <div className="page pull">
        <form onSubmit={submit} className="searchbar" role="search">
          <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, região ou características…" aria-label="Buscar" />
          <button className="btn" aria-label="Buscar"><SearchIcon size={18} /></button>
        </form>
        <div className="home-cols">
          <section className="stack">
            <div className="row between"><h2 className="section-title" style={{ margin: 0 }}>Casos recentes</h2><Link to="/buscar" className="muted">Ver todos</Link></div>
            {items === null ? <Empty>Carregando…</Empty> : items.length === 0 ? <Empty>Nenhum caso publicado no momento.</Empty> : <div className="grid">{items.map((c) => <CaseCard key={c.id} c={c} actions />)}</div>}
          </section>
          <aside className="stack">
            <div className="aside-card">
              <div className="row"><Lightbulb size={20} /><strong>Como enviar pistas?</strong></div>
              <p>Você pode enviar informações, fotos, relatos ou possíveis localizações de forma segura. Todas as pistas passam por análise antes de serem publicadas.</p>
              <Link to="/como-ajudar" className="btn">Entenda como ajudar</Link>
            </div>
            <div className="card stack">
              <h2>Juntos por mais reencontros</h2>
              <div className="metric"><Users size={18} color="#176568" /><b>{stats?.active ?? '–'}</b><span className="muted">pessoas em busca</span></div>
              <div className="metric"><HeartHandshake size={18} color="#176568" /><b>{stats?.located ?? '–'}</b><span className="muted">reencontros</span></div>
              <div className="metric"><Users size={18} color="#176568" /><b>{stats?.partners ?? '–'}</b><span className="muted">instituições parceiras</span></div>
            </div>
          </aside>
        </div>
        <p className="muted" style={{ textAlign: 'center' }}>Esta plataforma auxilia nas buscas e não substitui o trabalho das autoridades policiais.</p>
      </div>
    </Shell>
  );
}
