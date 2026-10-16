import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Landmark, ShieldCheck } from 'lucide-react';
import { api } from '../api';

export function Footer() {
  const [partners, setPartners] = useState<{ id: number; name: string }[]>([]);
  useEffect(() => { api.get('/public/partners').then((r) => setPartners(r.data)).catch(() => {}); }, []);
  return (
    <footer className="footer">
      <div className="inner">
        {partners.length > 0 && (
          <div className="partners"><b>Nossas instituições parceiras</b>{partners.slice(0, 6).map((p) => <span key={p.id} className="row" style={{ gap: 6 }}><Landmark size={14} />{p.name}</span>)}</div>
        )}
        <div className="row between" style={{ flexWrap: 'wrap', gap: 12 }}>
          <span className="row" style={{ gap: 6 }}><ShieldCheck size={16} />Dados protegidos conforme a LGPD. Cada pista aproxima. Cada reencontro importa.</span>
          <div className="links"><Link to="/termos">Privacidade</Link><Link to="/termos">Termos de uso</Link><Link to="/como-ajudar">Ajuda</Link></div>
        </div>
      </div>
    </footer>
  );
}
