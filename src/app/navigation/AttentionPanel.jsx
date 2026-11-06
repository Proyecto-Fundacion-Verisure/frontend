import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { SidebarCountsContext } from './useSidebarCounts';

const ATTENTION_ITEMS = [
  { key: 'pendingReview', to: '/admin/activities/pending', one: 'actividad por aprobar', many: 'actividades por aprobar' },
  { key: 'proposals', to: '/proposals', one: 'propuesta por revisar', many: 'propuestas por revisar' },
  { key: 'inscriptions', to: '/admin/registrations', one: 'inscripción por revisar', many: 'inscripciones por revisar' },
  { key: 'closes', to: '/admin/activities/pending-closure', one: 'actividad por cerrar', many: 'actividades por cerrar' },
  { key: 'pendingAccounts', to: '/admin/account-status', one: 'cuenta por aprobar', many: 'cuentas por aprobar' },
];

// Lo primero que ve la administradora: qué le toca hacer hoy. Las que están a
// cero siguen ahí y atenuadas, para que el bloque no cambie de forma.
export default function AttentionPanel() {
  const counts = useContext(SidebarCountsContext);
  return (
    <section className="attention-panel" aria-labelledby="attention-panel-title">
      <h2 id="attention-panel-title" className="attention-panel__title">Requiere tu atención</h2>
      <ul className="attention-panel__grid">
        {ATTENTION_ITEMS.map(({ key, to, one, many }) => {
          const count = counts[key] ?? 0;
          return (
            <li key={key}>
              <Link to={to} className={`attention-card${count === 0 ? ' attention-card--empty' : ''}`}>
                <strong className="attention-card__count">{count}</strong>
                <span className="attention-card__label">{count === 1 ? one : many}</span>
                <ChevronRight className="attention-card__icon" aria-hidden="true" size={16} />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
