import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ClipboardCheck, MapPin, XCircle, Hourglass } from 'lucide-react';
import { api, fmtDateTime } from '../api';
import { useAuth } from '../auth';
import { Shell } from '../components/Shell';
import { Avatar, CaseCard, Empty } from '../components/ui';
import { CaseItem, ROLE_LABEL, Tip } from '../types';

const LEGEND = [
  [Hourglass, 'Em análise', 'O caso foi enviado e está sendo verificado.'],
  [ClipboardCheck, 'Publicado', 'O caso está visível para a comunidade.'],
  [MapPin, 'Localizado', 'A pessoa foi encontrada e o caso foi encerrado.'],
  [XCircle, 'Rejeitado', 'O cadastro não foi aprovado. Veja o motivo e edite.'],
] as const;

export default function FamilyDashboard() {
  const { user } = useAuth();
  const [cases, setCases] = useState<CaseItem[] | null>(null);
  const [tips, setTips] = useState<Tip[]>([]);
  const family = user?.role === 'FAMILIAR';
  useEffect(() => {
    if (!family) { setCases([]); return; }
    api.get('/cases/mine').then((r) => setCases(r.data)).catch(() => setCases([]));
    api.get('/tips/mine').then((r) => setTips(r.data)).catch(() => {});
  }, [family]);
  const news = tips.filter((t) => t.status === 'EM_ANALISE').length;

  return (
    <Shell title="Painel do familiar">
      <div className="page mid">
        <div className="row"><Avatar name={user!.name} sm /><div><div style={{ fontWeight: 600 }}>Olá, {user!.name.split(' ')[0]}</div><div className="muted">{ROLE_LABEL[user!.role]}</div></div></div>
        {!family ? <div className="card stack"><span>Sua conta de cidadão permite enviar pistas. Abra um caso e toque em “Tenho uma informação”.</span><Link to="/buscar" className="btn">Buscar pessoas</Link></div> : <>
          <h2 className="section-title">Meus casos</h2>
          {cases === null ? <Empty>Carregando…</Empty> : cases.length === 0 ? <Empty>Você ainda não cadastrou nenhum caso.</Empty> : cases.map((c) => <div key={c.id} className="stack"><CaseCard c={c} />{c.status === 'REJEITADO' && <Link to={`/casos/${c.id}/editar`} className="btn small danger">Ver motivo e corrigir</Link>}{c.status === 'PUBLICADO' && <Link to={`/casos/${c.id}/editar`} className="btn small secondary">Atualizar ou encerrar</Link>}</div>)}
          <Link to="/cadastrar" className="btn">Cadastrar novo caso</Link>
          <div className="row between"><h2 className="section-title" style={{ margin: 0 }}>Pistas recebidas</h2>{news > 0 && <span className="badge amber">{news} em análise</span>}</div>
          {tips.length === 0 ? <Empty>Nenhuma pista recebida ainda.</Empty> : tips.slice(0, 5).map((t) => <div key={t.id} className="card stack"><strong>Pista sobre {t.case?.fullName}</strong><span>{t.description}</span><span className="muted">{fmtDateTime(t.createdAt)} · {t.status === 'EM_ANALISE' ? 'Em análise' : t.status === 'CONFIRMADA' ? 'Confirmada' : 'Descartada'}</span></div>)}
        </>}
        <div className="card stack"><h2>Entenda os estados</h2>{LEGEND.map(([Icon, t, d]) => <div key={t} className="row"><Icon size={20} color="#176568" /><div><strong style={{ fontSize: '.88rem' }}>{t}</strong><div className="muted">{d}</div></div></div>)}<div className="row"><CheckCircle2 size={20} color="#176568" /><div className="muted">Pistas só viram “confirmadas” após análise de um revisor.</div></div></div>
      </div>
    </Shell>
  );
}
