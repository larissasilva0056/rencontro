import { Link } from 'react-router-dom';
import { Shell } from '../components/Shell';

export default function HowToHelp() {
  return (
    <Shell title="Como ajudar" back>
      <div className="page mid">
        <div><h2 style={{ margin: 0 }}>Como ajudar</h2><p className="muted">Toda informação pode ser importante, mas precisa chegar de forma segura e responsável.</p></div>
        <div className="grid">
          <div className="card stack"><h2>Tenho uma informação</h2><ol className="muted" style={{ margin: 0, paddingLeft: 18 }}><li>Encontre o caso em <Link to="/buscar">Buscar pessoas</Link>.</li><li>Toque em “Tenho uma informação” (é preciso ter conta).</li><li>Descreva o que viu: onde, quando e como a pessoa estava.</li><li>Sua pista fica em análise. Nada é confirmado sem revisão humana.</li></ol></div>
          <div className="card stack"><h2>Sou familiar</h2><ol className="muted" style={{ margin: 0, paddingLeft: 18 }}><li>Crie uma conta de familiar e cadastre o caso em 4 passos.</li><li>Todo caso é verificado antes de ser publicado.</li><li>Você decide se o caso pode ser compartilhado em redes sociais.</li><li>Quando a pessoa for encontrada, marque como “Localizada”.</li></ol></div>
          <div className="card stack"><h2>Orientações de segurança</h2><ul className="muted" style={{ margin: 0, paddingLeft: 18 }}><li>Nunca vá sozinho(a) a um local para tentar resgatar alguém.</li><li>Em risco imediato, ligue 190. Registre sempre um boletim de ocorrência.</li><li>Não compartilhe dados pessoais de terceiros nas pistas.</li><li>Desconfie de pedidos de dinheiro em nome de famílias.</li><li>Use “Sinalizar” em informações falsas ou suspeitas.</li></ul></div>
          <div className="card stack"><h2>Privacidade e IA</h2><p className="muted" style={{ margin: 0 }}>Contatos de familiares nunca aparecem publicamente. Uma IA (Gemini) pode sugerir relações entre pistas e casos, usando apenas dados mínimos. Ela não confirma identidades nem publica nada: toda sugestão é revisada por uma pessoa.</p></div>
        </div>
        <p className="muted">A plataforma auxilia as buscas e não substitui o trabalho das autoridades.</p>
      </div>
    </Shell>
  );
}
