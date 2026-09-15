import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyEmail } from '../../api/authApi';
import { Button, Spinner } from '../../components/ui';

export default function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState({ status: token ? 'loading' : 'invalid', error: null });

  const verify = useCallback(async () => {
    if (!token) {
      setState({ status: 'invalid', error: null });
      return;
    }
    setState({ status: 'loading', error: null });
    try {
      await verifyEmail(token);
      setState({ status: 'success', error: null });
    } catch (error) {
      setState({ status: 'error', error });
    }
  }, [token]);

  useEffect(() => {
    void verify();
  }, [verify]);

  if (state.status === 'loading') {
    return <Spinner label="Verificando correo electrónico…" />;
  }

  if (state.status === 'success') {
    return (
      <section className="account-status" aria-labelledby="verification-title">
        <h1 id="verification-title" className="account-status__title">Correo verificado</h1>
        <p>Tu dirección se ha verificado correctamente. La Fundación revisará ahora la solicitud de tu entidad.</p>
        <Link className="button button--primary button--medium" to="/login">Ir al inicio de sesión</Link>
      </section>
    );
  }

  const missingToken = state.status === 'invalid';
  return (
    <section className="account-status" aria-labelledby="verification-title">
      <h1 id="verification-title" className="account-status__title">
        {missingToken ? 'Enlace de verificación incompleto' : 'No hemos podido verificar el correo'}
      </h1>
      <p role="alert">
        {missingToken
          ? 'El enlace no contiene un token de verificación.'
          : state.error?.message || 'El enlace puede haber caducado o ya haberse utilizado.'}
      </p>
      {!missingToken && <Button onClick={verify}>Reintentar</Button>}
      {' '}
      <Link className="button button--secondary button--medium" to="/login">Volver al acceso</Link>
    </section>
  );
}
