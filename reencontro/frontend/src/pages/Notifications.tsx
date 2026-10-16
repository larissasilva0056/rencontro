import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmtDateTime } from '../api';
import { Shell } from '../components/Shell';
import { Empty } from '../components/ui';

interface N { id: number; title: string; body: string; link?: string | null; isRead: boolean; createdAt: string }
export default function Notifications() {
  const [items, setItems] = useState<N[] | null>(null);
  useEffect(() => { api.get('/notifications').then((r) => { setItems(r.data); api.patch('/notifications/read-all').catch(() => {}); }).catch(() => setItems([])); }, []);
  return (
    <Shell title="Notificações" back>
      <div className="page mid">
        {items === null ? <Empty>Carregando…</Empty> : items.length === 0 ? <Empty>Você não tem notificações.</Empty> : items.map((n) => (
          <Link key={n.id} to={n.link ?? '/painel'} className="card stack" style={{ color: 'inherit', borderLeft: n.isRead ? undefined : '4px solid var(--amber)' }}>
            <strong>{n.title}</strong><span>{n.body}</span><span className="muted">{fmtDateTime(n.createdAt)}</span>
          </Link>
        ))}
      </div>
    </Shell>
  );
}
