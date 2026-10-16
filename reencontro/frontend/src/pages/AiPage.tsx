import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { api } from '../api';
import { Shell } from '../components/Shell';
import { TipReview } from '../components/TipReview';
import { Alert, Empty } from '../components/ui';
import { Tip } from '../types';

interface Dup { a: { id: number; fullName: string; age: number }; b: { id: number; fullName: string; age: number }; similarity: number }

export default function AiPage() {
  const [tips, setTips] = useState<Tip[] | null>(null);
  const [dups, setDups] = useState<Dup[]>([]);
  const load = useCallback(() => {
    api.get('/tips').then((r) => setTips(r.data)).catch(() => setTips([]));
    api.get('/organizations/duplicates').then((r) => setDups(r.data)).catch(() => setDups([]));
  }, []);
  useEffect(load, [load]);
  const ranked = (tips ?? []).filter((t) => (t.analysis?.compatibility ?? 0) >= 20);
  const rest = (tips ?? []).filter((t) => (t.analysis?.compatibility ?? 0) < 20);

  return (
    <Shell title="IA e organização de pistas" back>
      <div className="page mid">
        <div className="alert ok"><Sparkles size={18} /><div>A IA cruza as pistas recebidas com os casos ativos e sugere correspondências. Toda sugestão exige revisão humana.</div></div>
        <h2 className="section-title">Sugestões de correspondência ({ranked.length})</h2>
        {tips === null ? <Empty>Carregando…</Empty> : ranked.length === 0 ? <Empty>Nenhuma pista com correspondência relevante.</Empty> : ranked.map((t) => <TipReview key={t.id} tip={t} onDone={load} />)}
        <h2 className="section-title">Possíveis duplicidades ({dups.length})</h2>
        {dups.length === 0 ? <Empty>Nenhum cadastro duplicado detectado.</Empty> : dups.map((d, i) => <div key={i} className="card stack"><span className="muted">{d.similarity}% de semelhança</span><Link to={`/casos/${d.a.id}`}>{d.a.fullName}, {d.a.age} anos</Link><Link to={`/casos/${d.b.id}`}>{d.b.fullName}, {d.b.age} anos</Link></div>)}
        {rest.length > 0 && <><h2 className="section-title">Outras pistas em análise ({rest.length})</h2>{rest.map((t) => <TipReview key={t.id} tip={t} onDone={load} />)}</>}
        <Alert kind="warn">Sugestão gerada por IA — requer revisão humana.</Alert>
      </div>
    </Shell>
  );
}
