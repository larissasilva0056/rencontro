import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import { Guard } from './components/Guard';
import { dashboardPath } from './components/Shell';
import AdminPanel from './pages/AdminPanel';
import AiPage from './pages/AiPage';
import CaseDetail from './pages/CaseDetail';
import CaseWizard from './pages/CaseWizard';
import EditCase from './pages/EditCase';
import FamilyDashboard from './pages/FamilyDashboard';
import HowToHelp from './pages/HowToHelp';
import Home from './pages/Home';
import Notifications from './pages/Notifications';
import Partners from './pages/Partners';
import { Login, Register } from './pages/AuthPages';
import OrgPanel from './pages/OrgPanel';
import Profile from './pages/Profile';
import Search from './pages/Search';
import SendTip from './pages/SendTip';
import Splash from './pages/Splash';
import Terms from './pages/Terms';

function PainelRedirect() {
  const { user } = useAuth();
  return <Navigate to={dashboardPath(user?.role)} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/inicio" element={<Home />} />
      <Route path="/buscar" element={<Search />} />
      <Route path="/casos/:id" element={<CaseDetail />} />
      <Route path="/casos/:id/pista" element={<Guard><SendTip /></Guard>} />
      <Route path="/casos/:id/editar" element={<Guard roles={['FAMILIAR', 'ONG', 'ADMIN']}><EditCase /></Guard>} />
      <Route path="/cadastrar" element={<Guard roles={['FAMILIAR', 'ONG']}><CaseWizard /></Guard>} />
      <Route path="/entrar" element={<Login />} />
      <Route path="/cadastro" element={<Register />} />
      <Route path="/termos" element={<Terms />} />
      <Route path="/como-ajudar" element={<HowToHelp />} />
      <Route path="/instituicoes" element={<Partners />} />
      <Route path="/notificacoes" element={<Guard><Notifications /></Guard>} />
      <Route path="/painel" element={<Guard><PainelRedirect /></Guard>} />
      <Route path="/painel/familiar" element={<Guard roles={['FAMILIAR', 'CIDADAO']}><FamilyDashboard /></Guard>} />
      <Route path="/painel/admin" element={<Guard roles={['ADMIN']}><AdminPanel /></Guard>} />
      <Route path="/painel/ong" element={<Guard roles={['ONG']}><OrgPanel /></Guard>} />
      <Route path="/painel/governo" element={<Guard roles={['ORGAO_GOVERNAMENTAL']}><OrgPanel /></Guard>} />
      <Route path="/painel/ia" element={<Guard roles={['ADMIN', 'ONG', 'ORGAO_GOVERNAMENTAL']}><AiPage /></Guard>} />
      <Route path="/perfil" element={<Guard><Profile /></Guard>} />
      <Route path="*" element={<Navigate to="/inicio" replace />} />
    </Routes>
  );
}
