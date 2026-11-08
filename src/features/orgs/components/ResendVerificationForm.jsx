import { Button, Input } from '../../../shared/ui';
import useResendVerification from '../hooks/useResendVerification';

export default function ResendVerificationForm() {
  const resend = useResendVerification();

  return (
    <form className="account-status__resend" onSubmit={resend.handleSubmit} noValidate>
      <Input
        id="resend-email"
        type="email"
        label="Correo de la entidad"
        value={resend.email}
        onChange={resend.handleEmailChange}
        error={resend.emailError}
        required
      />
      <Button type="submit" isLoading={resend.isSending} loadingLabel="Reenviando…">
        Reenviar enlace
      </Button>
      {resend.isSent && (
        <p role="status">
          Si el correo está pendiente de verificar, te hemos enviado un enlace nuevo.
        </p>
      )}
      {resend.hasError && (
        <p role="alert">No hemos podido reenviar el enlace. Inténtalo de nuevo.</p>
      )}
    </form>
  );
}
