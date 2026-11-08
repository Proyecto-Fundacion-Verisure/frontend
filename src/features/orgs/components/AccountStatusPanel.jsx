export default function AccountStatusPanel({ title, description, children, actions }) {
  return (
    <section className="account-status" aria-labelledby="account-status-title">
      <h1 id="account-status-title" className="account-status__title">
        {title}
      </h1>
      {description && <p>{description}</p>}
      {children}
      {actions && <div className="account-status__actions">{actions}</div>}
    </section>
  );
}
