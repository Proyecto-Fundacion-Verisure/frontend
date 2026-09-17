import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input } from '../../components/ui';
import { useAuth } from './AuthContext';
import { getRoleHomePath } from '../../routes/routeAccess';

// Una entidad a la que el backend deniega el acceso por el estado de su cuenta
// tiene una página que se lo explica (y, sin correo verificado, un reenvío).
const PENDING_ACCOUNT_LINKS = {
  ACCOUNT_NOT_VERIFIED: '/account-status?pending=verification',
  ACCOUNT_PENDING_APPROVAL: '/account-status?pending=approval',
};

function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [pendingLink, setPendingLink] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setFormError('');
    setPendingLink(null);
    setIsLoading(true);

    try {
      const authenticatedUser = await login({ email, password });
      navigate(getRoleHomePath(authenticatedUser.role), { replace: true });
    } catch (error) {
      if (error.fieldErrors) {
        setFieldErrors(error.fieldErrors);
      } else {
        setFormError(error.message);
        setPendingLink(PENDING_ACCOUNT_LINKS[error.code] ?? null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      {formError && (
        <div className="login-form__error" role="alert">
          {formError}
          {pendingLink && (
            <>
              {' '}
              <Link to={pendingLink}>Ver el estado de tu cuenta</Link>
            </>
          )}
        </div>
      )}

      <Input
        id="email"
        type="email"
        label="Correo electrónico"
        placeholder="tu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldErrors.email}
      />

      <Input
        id="password"
        type="password"
        label="Contraseña"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={fieldErrors.password}
      />

      <Button
        type="submit"
        variant="primary"
        size="large"
        className="login-form__submit"
        isLoading={isLoading}
        loadingLabel="Entrando..."
      >
        Entrar al portal <span aria-hidden="true">→</span>
      </Button>
    </form>
    </>
  );
}

export default LoginForm;