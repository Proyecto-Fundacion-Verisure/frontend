import { useState } from 'react';
import { resendOrganizationRegistrationEmail } from '../api/orgApi';

// El backend responde 204 siempre, exista o no el correo: la interfaz confirma
// el envío sin decir si la cuenta existe.
export default function useResendVerification() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [emailError, setEmailError] = useState('');

  const handleEmailChange = (event) => setEmail(event.target.value);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      setEmailError('Indica el correo con el que se registró la entidad.');
      return;
    }

    setEmailError('');
    setStatus('loading');
    try {
      await resendOrganizationRegistrationEmail(email.trim());
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  return {
    email,
    emailError,
    status,
    isSending: status === 'loading',
    isSent: status === 'success',
    hasError: status === 'error',
    handleEmailChange,
    handleSubmit,
  };
}
