import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getRoleHomePath } from '../../routes/routeAccess';
import { EmptyState } from '../../components/ui';

export default function NotFoundPage() {
  const headingRef = useRef(null);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const to = isAuthenticated ? getRoleHomePath(user?.role) : '/';
  const label = isAuthenticated ? 'Volver al inicio' : 'Volver a la portada';

  return (
    <section className="not-found" aria-labelledby="notfound-title">
      <h1 id="notfound-title" ref={headingRef} tabIndex={-1} className="sr-only">
        404 — Página no encontrada
      </h1>
      <EmptyState
        icon={<span aria-hidden="true">404</span>}
        title="Página no encontrada"
        description="La ruta que has solicitado no existe. Comprueba la dirección o vuelve al inicio."
        action={
          <Link to={to} className="button button--primary">
            {label}
          </Link>
        }
      />
    </section>
  );
}
