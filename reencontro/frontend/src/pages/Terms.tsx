import { Shell } from '../components/Shell';

export default function Terms() {
  return (
    <Shell title="Termos e privacidade" back>
      <div className="page narrow">
        <div className="card stack">
          <h2>Termos de uso</h2>
          <p className="muted">O Reencontro é uma ferramenta de apoio. Ele auxilia as buscas e não substitui o trabalho das autoridades policiais: registre sempre um boletim de ocorrência.</p>
          <p className="muted">Quem cadastra um caso assume a responsabilidade pelas informações fornecidas. Todo caso passa por verificação antes de ser publicado, e informações falsas ou trotes podem levar ao bloqueio da conta.</p>
          <p className="muted">Nenhuma pista é considerada confirmada sem análise prévia de um revisor.</p>
        </div>
        <div className="card stack">
          <h2>Privacidade (LGPD)</h2>
          <p className="muted">Dados pessoais e sensíveis de familiares e das pessoas desaparecidas são usados apenas para os fins da plataforma. Contatos de familiares ficam visíveis só para o responsável, ONGs e órgãos autorizados e administradores.</p>
          <p className="muted">A divulgação em redes sociais só ocorre com autorização expressa do familiar responsável e segue as regras de cada rede.</p>
          <p className="muted">Você pode atualizar seus dados a qualquer momento no seu perfil.</p>
        </div>
      </div>
    </Shell>
  );
}
