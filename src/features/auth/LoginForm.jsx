import { useState } from 'react';
import Button from '../../components/ui/Button/Button';
import Input from '../../components/ui/Input/Input';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <form className="login-form" onSubmit={(e) => e.preventDefault()}>
      <Input
        id="email"
        type="email"
        label="Correo electrónico"
        placeholder="tu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <Input
        id="password"
        type="password"
        label="Contraseña"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <div className="login-form__row">
        <label className="login-form__checkbox">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <span>Recordar sesión</span>
        </label>

        <a href="/forgot-password" className="login-form__link">
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="large"
        className="login-form__submit"
      >
        Entrar al portal <span aria-hidden="true">→</span>
      </Button>
    </form>
  );

}

export default LoginForm;