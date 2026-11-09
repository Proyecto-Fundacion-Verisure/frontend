import { Link } from 'react-router-dom';

export default function ProposalFormIntro() {
  return (
    <div className="proposal-page__intro">
      <a href="/">← Volver a la portada</a>
      <p className="proposal-page__eyebrow">Propuesta de colaboración</p>
      <h1 id="proposal-title">Contadnos qué necesitáis</h1>
      <p>
        Este formulario es uno de los canales de contacto con la Fundación. Si prefieres gestionar
        tus propias actividades,{' '}
        <Link to="/register-organization">crea una cuenta de organización</Link>.
      </p>
    </div>
  );
}
