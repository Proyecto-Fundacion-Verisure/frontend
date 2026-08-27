import { Link } from 'react-router-dom';
import logoVerisure from '../../../assets/images/logo-fundacion-verisure.png';

const PublicHeader = () => {
  return (
    <header className="public-header">
      <div className="public-header__container">
        <Link to="/" className="public-header__brand">
          <img
            src={logoVerisure}
            alt="Fundación Verisure"
            className="public-header__logo"
          />
          <span className="public-header__divider" aria-hidden="true" />
          <span className="public-header__subtitle">Voluntariado Corporativo</span>
        </Link>

        <div className="public-header__actions">
          <Link to="/login" className="public-header__login-btn">
            Iniciar sesión
          </Link>
        </div>
      </div>
    </header>
  );
};

export default PublicHeader;