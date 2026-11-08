import { Suspense } from 'react';
import PublicHeader from '../PublicHeader/PublicHeader';
import PublicFooter from '../PublicFooter/PublicFooter';
import RouteFallback from '../../routing/RouteFallback';

export default function PublicLayout({ children }) {
  return (
    <div className="public-layout">
      <a href="#main" className="skip-link">
        Saltar al contenido
      </a>
      <PublicHeader />
      <main id="main" tabIndex={-1}>
        {/* Las páginas públicas que no son la landing también se cargan bajo
            demanda; la cabecera y el pie se quedan montados mientras llegan. */}
        <Suspense fallback={<RouteFallback />}>{children}</Suspense>
      </main>
      <PublicFooter />
    </div>
  );
}
