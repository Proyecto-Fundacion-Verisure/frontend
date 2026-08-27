import { Link } from 'react-router-dom';

export default function AccountStatusPage() {
  return (
    <section className="org-register-page org-register-page--status" aria-labelledby="account-status-title">
      <p className="org-register-page__eyebrow">Account created</p>
      <h1 id="account-status-title">Check your email</h1>
      <p>
        We have sent a confirmation message to your email address.
        Open the link to activate your account and start managing
        volunteering activities.
      </p>
      <p>
        If you don't receive it within a few minutes, check your spam folder or
        contact us at <strong>voluntariado@fundacionverisure.org</strong>.
      </p>
      <Link className="button button--primary button--large" to="/login">
        Go to log in
      </Link>
    </section>
  );
}
