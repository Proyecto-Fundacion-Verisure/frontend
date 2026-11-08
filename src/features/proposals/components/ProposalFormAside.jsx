import { Link } from 'react-router-dom';

const STEPS = [
  {
    id: 'received',
    title: 'Recibimos tu propuesta',
    description: 'Queda registrada y llega directamente al equipo de la Fundación.',
  },
  {
    id: 'review',
    title: 'La revisamos',
    description: 'El equipo la valora y te llama para concretar fechas, plazas y dedicación.',
  },
  {
    id: 'publish',
    title: 'La publicamos',
    description: 'Se convierte en una actividad del catálogo interno.',
  },
  {
    id: 'measure',
    title: 'Medimos el impacto',
    description: 'Al terminar, cada persona reporta sus horas y la Fundación las valida.',
  },
];

export default function ProposalFormAside() {
  return (
    <aside className="proposal-steps">
      <p className="proposal-page__eyebrow">Qué pasa después</p>
      <ol>
        {STEPS.map((step, index) => (
          <li key={step.id}>
            <span>{index + 1}</span>
            <div>
              <strong>{step.title}</strong>
              <p>{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="proposal-steps__cta">
        <Link className="button button--primary button--medium" to="/register-organization">
          Regístrate como entidad
        </Link>
      </div>
    </aside>
  );
}
