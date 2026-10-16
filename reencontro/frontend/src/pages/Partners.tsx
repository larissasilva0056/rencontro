import { useEffect, useState } from 'react';
import { Landmark } from 'lucide-react';
import { api } from '../api';
import { Shell } from '../components/Shell';
import { Empty } from '../components/ui';

export default function Partners() {
  const [items, setItems] = useState<{ id: number; name: string; type: string }[] | null>(null);
  useEffect(() => { api.get('/public/partners').then((r) => setItems(r.data)).catch(() => setItems([])); }, []);
  return (
    <Shell title="Instituições parceiras" back>
      <div className="page">
        <div><h2 style={{ margin: 0 }}>Instituições parceiras</h2><p className="muted">ONGs e órgãos públicos validados que apoiam a triagem e a divulgação dos casos.</p></div>
        {items === null ? <Empty>Carregando…</Empty> : items.length === 0 ? <Empty>Nenhuma instituição parceira aprovada ainda.</Empty> : <div className="grid">{items.map((p) => <div key={p.id} className="card row"><Landmark color="#176568" /><div><strong>{p.name}</strong><div className="muted">{p.type}</div></div></div>)}</div>}
      </div>
    </Shell>
  );
}
