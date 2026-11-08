import { useEffect, useRef, useState } from 'react';
import { verifyEmail } from '../../auth';

// El token es de un solo uso: la segunda llamada devuelve 410 «ya utilizado».
// `StrictMode` monta los efectos dos veces en desarrollo, así que la petición
// se guarda por token y el segundo montaje reutiliza la misma promesa.
export default function useEmailVerification(token) {
  const [verifyState, setVerifyState] = useState(token ? 'loading' : 'idle');
  const [verifyError, setVerifyError] = useState(null);
  const verification = useRef({ token: null, promise: null });

  useEffect(() => {
    if (!token) return undefined;

    let isActive = true;
    if (verification.current.token !== token) {
      verification.current = { token, promise: verifyEmail(token) };
    }

    verification.current.promise
      .then(() => {
        if (isActive) setVerifyState('success');
      })
      .catch((error) => {
        if (!isActive) return;
        setVerifyError(error);
        setVerifyState('error');
      });

    return () => {
      isActive = false;
    };
  }, [token]);

  return { verifyState, verifyError };
}
