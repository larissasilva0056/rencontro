import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { CaseCard, Empty, Field } from '../components/ui';
import { Shell } from '../components/Shell';
import { CaseItem, UFS } from '../types';

const AGES: Record<string, [number?, number?]> = { '': [], child: [0, 11], teen: [12, 17], adult: [18, 59], senior: [60, undefined] };

export default function Search() {
  const [sp] = useSearchParams();
  const [f, setF] = useState({ q: sp.get('q') ?? '', state: '', age: '', since: '', status: 'ACTIVE', sort: 'relevant' });
  const [res, setRes] = useState<{ items: CaseItem[]; total: number } | null>(null);
  const [offline, setOffline] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    const t = setTimeout(() => {
      const [minAge, maxAge] = AGES[f.age];
      setOffline(false);
      api.get('/cases', { params: { q: f.q || undefined, state: f.state || undefined, minAge, maxAge, sinceDays: f.since || undefined, status: f.status, sort: f.sort, limit: 30 } })
        .then((r) => setRes(r.data)).catch((e) => { if (!e.response) setOffline(true); setRes({ items: [], total: 0 }); });
    }, 250);
    return () => clearTimeout(t);
  }, [f]);

  return (
    <Shell title="Buscar pessoas" back>
      <div className="page">
        <div><h2 style={{ margin: 0 }}>Busca de pessoas desaparecidas</h2><p className="muted" style={{ margin: '4px 0 0' }}>Encontre pessoas por nome, região ou características.</p></div>
        <input className="input" value={f.q} onChange={set('q')} placeholder="Nome, região ou características…" aria-label="Buscar por nome ou características" />
        <div className="filters">
          <Field label="Região (UF)"><select value={f.state} onChange={set('state')}><option value="">Todas</option>{UFS.map((u) => <option key={u}>{u}</option>)}</select></Field>
          <Field label="Idade aproximada"><select value={f.age} onChange={set('age')}><option value="">Todas</option><option value="child">Criança (0–11)</option><option value="teen">Adolescente (12–17)</option><option value="adult">Adulto (18–59)</option><option value="senior">Idoso (60+)</option></select></Field>
          <Field label="Data de desaparecimento"><select value={f.since} onChange={set('since')}><option value="">Qualquer data</option><option value="7">Até 7 dias</option><option value="30">Até 30 dias</option><option value="365">Até 1 ano</option></select></Field>
          <Field label="Situação do caso"><select value={f.status} onChange={set('status')}><option value="ACTIVE">Em busca</option><option value="LOCATED">Localizados</option><option value="ALL">Todos</option></select></Field>
          <Field label="Ordenar por"><select value={f.sort} onChange={set('sort')}><option value="relevant">Mais relevantes</option><option value="recent">Mais recentes</option></select></Field>
        </div>
        <h2 className="section-title">Resultados {res && !offline ? `(${res.total})` : ''}</h2>
        {offline ? <Empty>Sem conexão com o servidor. Verifique sua internet e tente novamente.</Empty>
          : res === null ? <Empty>Buscando…</Empty>
          : res.items.length === 0 ? <Empty>Nenhum resultado. Tente remover algum filtro ou buscar por outra característica.</Empty>
          : <div className="grid">{res.items.map((c) => <CaseCard key={c.id} c={c} actions />)}</div>}
      </div>
    </Shell>
  );
}
