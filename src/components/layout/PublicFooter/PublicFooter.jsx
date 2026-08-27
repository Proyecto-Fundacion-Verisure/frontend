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
            Responsable del tratamiento: Verisure España S.A.U.
            <br />
            Los datos de esta propuesta se conservan mientras esté activa y hasta un año
            después de descartarla.
          </p>
        </div>

        <nav className="public-footer__col" aria-labelledby="footer-legal-heading">
          <h3 id="footer-legal-heading" className="public-footer__col-title">
            Legal
          </h3>
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
          <h3 id="footer-contact-heading" className="public-footer__col-title">
            Contacto
          </h3>
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