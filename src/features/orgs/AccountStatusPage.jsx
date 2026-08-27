import { Link } from 'react-router-dom';

export default function AccountStatusPage() {
  return (
    <section className="org-register-page org-register-page--status" aria-labelledby="account-status-title">
      <p className="org-register-page__eyebrow">Cuenta creada</p>
      <h1 id="account-status-title">Revisa tu correo</h1>
      <p>
        Hemos enviado un mensaje de confirmación a tu dirección de email.
        Abre el enlace para activar tu cuenta y empezar a gestionar actividades
        de voluntariado.
      </p>
      <p>
        Si no lo recibes en unos minutos, revisa la carpeta de spam o
        contacta con nosotros en <strong>voluntariado@fundacionverisure.org</strong>.
      </p>
      <Link className="button button--primary button--large" to="/login">
        Ir a iniciar sesión
      </Link>
    </section>
  );
}
