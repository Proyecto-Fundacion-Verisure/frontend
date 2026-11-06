import PublicHeader from '../PublicHeader/PublicHeader';
import PublicFooter from '../PublicFooter/PublicFooter';

export default function PublicLayout({ children }) {
  return (
    <div className="public-layout">
      <a href="#main" className="skip-link">
        Saltar al contenido
      </a>
      <PublicHeader />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
