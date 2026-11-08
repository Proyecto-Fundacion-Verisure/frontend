export default function DashboardSection({ id, number, title, description, children }) {
  return (
    <section className="dashboard-block" aria-labelledby={`${id}-title`}>
      <header className="dashboard-block__header">
        <span className="dashboard-block__number" aria-hidden="true">{number}</span>
        <div>
          <h2 id={`${id}-title`}>{title}</h2>
          <p>{description}</p>
        </div>
      </header>
      {children}
    </section>
  );
}
