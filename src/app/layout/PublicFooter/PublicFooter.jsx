import { Link } from 'react-router-dom';

const CONTACT_EMAIL = 'voluntariado@fundacionverisure.org';

const PublicFooter = () => {
  return (
    <footer className="public-footer">
      <div className="public-footer__container">
        <div className="public-footer__brand">
          <div className="public-footer__brand-heading">
            <span className="public-footer__brand-name">FUNDACIÓN VERISURE</span>
          </div>
          <p className="public-footer__legal-text">
            Proyecto académico desarrollado con la Fundación Verisure.
            <br />
            Plataforma de demostración: los datos son ficticios y no se usan con fines comerciales.
          </p>
        </div>

        <nav className="public-footer__col" aria-labelledby="footer-legal-heading">
          <h2 id="footer-legal-heading" className="public-footer__col-title">
            Legal
          </h2>
          <ul className="public-footer__links">
            <li>
              <Link to="/" className="public-footer__link">
                Política de privacidad
              </Link>
            </li>
            <li>
              <Link to="/" className="public-footer__link">
                Aviso legal
              </Link>
            </li>
            <li>
              <Link to="/" className="public-footer__link">
                Política de cookies
              </Link>
            </li>
          </ul>
        </nav>

        <div className="public-footer__col" aria-labelledby="footer-contact-heading">
          <h2 id="footer-contact-heading" className="public-footer__col-title">
            Contacto
          </h2>
          <ul className="public-footer__links">
            <li>
              <a href={`mailto:${CONTACT_EMAIL}`} className="public-footer__link">
                {CONTACT_EMAIL}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
