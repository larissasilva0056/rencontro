import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/ui';

export default function Splash() {
  const nav = useNavigate();
  useEffect(() => { const t = setTimeout(() => nav('/inicio', { replace: true }), 1800); return () => clearTimeout(t); }, [nav]);
  return (
    <div className="splash">
      <Logo size={84} light />
      <h1>Reencontro</h1>
      <p style={{ opacity: .85, margin: 0 }}>Cada pista aproxima.<br />Cada reencontro importa.</p>
      <div className="bar"><i /></div>
    </div>
  );
}
