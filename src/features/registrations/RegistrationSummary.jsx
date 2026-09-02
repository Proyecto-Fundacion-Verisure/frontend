import { ProgressBar } from '../../components/ui';

function getCounter(counters, ...keys) {
  const key = keys.find((candidate) => counters?.[candidate] !== undefined);
  return Number(key ? counters[key] : 0) || 0;
}

export default function RegistrationSummary({ board }) {
  const counters = board?.counters ?? {};
  const confirmed = getCounter(counters, 'confirmed', 'confirmedCount');
  const waitlisted = getCounter(counters, 'waitlisted', 'waitlistCount');
  const unreviewed = getCounter(counters, 'unreviewed', 'unreviewedCount');
  const acceptedWaitlisted = getCounter(
    counters,
    'acceptedWaitlisted',
    'acceptedInQueue',
    'accepted',
  );
  const totalSpots = Number(
    board?.activity?.spots
      ?? board?.activity?.maxParticipants
      ?? board?.spots
      ?? counters.totalSpots,
  ) || 0;
  const occupiedSpots = Math.min(Math.max(confirmed, 0), totalSpots);

  const cards = [
    { label: 'Confirmadas', value: confirmed },
    { label: 'En cola', value: waitlisted },
    { label: 'Aceptadas en cola', value: acceptedWaitlisted },
    { label: 'Sin revisar', value: unreviewed },
  ];

  return (
    <section className="registration-summary" aria-label="Resumen de inscripciones">
      <dl className="registration-summary__cards">
        {cards.map((card) => (
          <div className="registration-summary__card" key={card.label}>
            <dt>{card.label}</dt>
            <dd>{card.value}</dd>
          </div>
        ))}
      </dl>
      <div className="registration-summary__capacity">
        <ProgressBar
          label="Aforo confirmado"
          value={occupiedSpots}
          max={totalSpots}
          showValue
          valueLabel={`${occupiedSpots} de ${totalSpots} plazas`}
        />
        <p>{occupiedSpots} de {totalSpots} plazas ocupadas</p>
      </div>
    </section>
  );
}
