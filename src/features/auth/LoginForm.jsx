import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '../../components/ui';
import { useAuth } from './AuthContext';
import { getRoleHomePath } from '../../routes/routeAccess';

function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setFormError('');
    setIsLoading(true);

    try {
      const authenticatedUser = await login({ email, password });
      navigate(getRoleHomePath(authenticatedUser.role), { replace: true });
    } catch (error) {
      if (error.fieldErrors) {
        setFieldErrors(error.fieldErrors);
      } else {
        setFormError(error.message);
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