import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createOrganization } from '../../api/orgApi';
import useForm from '../../hooks/useForm';
import { Button, Input, Modal } from '../../components/ui';

// El backend nombra `name` lo que el formulario llama `organizationName`. Los
// `fields` de un 400 se traducen aquí para que caigan sobre su input.
const API_FIELD_NAMES = { name: 'organizationName' };

// Los dos 409 del alta son del correo: `CIF_ALREADY_REGISTERED` es «este correo
// ya tiene cuenta en esa entidad» y `EMAIL_ALREADY_REGISTERED` «este correo ya
// está en cualquier cuenta». Los dos se pintan sobre el campo de correo.
const EMAIL_CONFLICTS = new Set(['CIF_ALREADY_REGISTERED', 'EMAIL_ALREADY_REGISTERED']);

const initialValues = {
  organizationName: '',
  cif: '',
  contactName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  consent: false,
};

function isValidCif(value) {
  return /^[A-Z0-9]{9}$/i.test(value.trim());
}

function validate(values) {
  const errors = {};
  if (!values.organizationName.trim()) errors.organizationName = 'Indica el nombre de la organización.';
  if (!values.cif.trim()) {
    errors.cif = 'Introduce el CIF.';
  } else if (!isValidCif(values.cif)) {
    errors.cif = 'Introduce un CIF de 9 caracteres alfanuméricos.';
  }
  if (!values.contactName.trim()) errors.contactName = 'Indica una persona de contacto.';
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = 'Introduce un correo electrónico válido.';
  if (!values.phone.trim()) errors.phone = 'Indica un teléfono de contacto.';
  if (!values.password) {
    errors.password = 'Introduce una contraseña.';
  } else if (values.password.length < 8) {
    errors.password = 'La contraseña debe tener al menos 8 caracteres.';
  }
  if (values.password !== values.confirmPassword) errors.confirmPassword = 'Las contraseñas no coinciden.';
  if (!values.consent) errors.consent = 'Debes aceptar la política de privacidad.';
  return errors;
}

export default function OrgRegisterPage() {
  const navigate = useNavigate();
  const { values, setValues, handleChange } = useForm(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState('idle');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const validateField = (name) => {
    const fieldErrors = validate(values);
    if (fieldErrors[name]) {
      setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] }));
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleBlur = ({ target: { name } }) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setTouched(Object.keys(initialValues).reduce((acc, k) => ({ ...acc, [k]: true }), {}));
    if (Object.keys(nextErrors).length) return;

    setStatus('loading');
    setSubmitError('');
    try {
      await createOrganization({
        name: values.organizationName.trim(),
        cif: values.cif.trim().toUpperCase(),
        contactName: values.contactName.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim(),
        password: values.password,
        consent: values.consent,
      });
      setStatus('idle');
      setIsSuccessModalOpen(true);
    } catch (err) {
      let apiErrors = err?.fieldErrors;
      if (apiErrors) {
        apiErrors = Object.fromEntries(Object.entries(apiErrors).map(([field, message]) => (
          [API_FIELD_NAMES[field] ?? field, message]
        )));
      } else if (EMAIL_CONFLICTS.has(err?.code)) {
        apiErrors = { email: err.message };
      }
      if (apiErrors) {
        setErrors(apiErrors);
        setTouched(Object.keys(apiErrors).reduce((acc, k) => ({ ...acc, [k]: true }), {}));
        setSubmitError('Revisa los campos marcados.');
      } else {
        setSubmitError(err?.message || 'No hemos podido crear la cuenta. Inténtalo de nuevo.');
      }
      setStatus('error');
    }
  };

  const handleGoHome = () => {
    setIsSuccessModalOpen(false);
    navigate('/');
  };

  const fieldProps = (name) => ({
    name,
    value: values[name],
    onChange: handleChange,
    onBlur: handleBlur,
    error: touched[name] ? errors[name] : undefined,
  });

  return (
    <section className="org-register-page" aria-labelledby="org-register-title">
      <div className="org-register-page__intro">
        <Link to="/" className="org-register-page__back">&larr; Volver a la portada</Link>
        <p className="org-register-page__eyebrow">Cuenta de entidad</p>
        <h1 id="org-register-title">Registra tu entidad</h1>
        <p>
          Crea una cuenta para publicar actividades de voluntariado y gestionar
          las inscripciones de la plantilla de Verisure.
        </p>
      </div>

      <div className="org-register-page__layout">
        <form className="org-register-form" onSubmit={handleSubmit} noValidate>
          <div className="org-register-form__grid">
            <Input label="Nombre de la entidad" placeholder="Asociación, fundación o entidad" required {...fieldProps('organizationName')} />
            <Input label="CIF" placeholder="A12345678" required {...fieldProps('cif')} />
          </div>
          <div className="org-register-form__grid">
            <Input label="Persona de contacto" placeholder="Nombre y apellidos" required {...fieldProps('contactName')} />
            <Input type="email" label="Correo electrónico" placeholder="nombre@organizacion.org" required {...fieldProps('email')} />
          </div>
          <div className="org-register-form__grid">
            <Input type="tel" label="Teléfono" placeholder="600 000 000" required {...fieldProps('phone')} />
            <span />
          </div>
          <div className="org-register-form__grid">
            <Input type="password" label="Contraseña" placeholder="Mínimo 8 caracteres" required {...fieldProps('password')} />
            <Input type="password" label="Repite la contraseña" placeholder="Confirma tu contraseña" required {...fieldProps('confirmPassword')} />
          </div>

          <label className={`org-register-form__consent${errors.consent ? ' org-register-form__consent--error' : ''}`} htmlFor="org-consent">
            <input
              id="org-consent"
              type="checkbox"
              checked={values.consent}
              onChange={(event) => setValues((current) => ({ ...current, consent: event.target.checked }))}
              aria-invalid={Boolean(errors.consent)}
              aria-describedby={errors.consent ? 'consent-error' : undefined}
              required
            />{' '}
            <span>
              He leído y acepto la <strong>política de privacidad</strong>.
              Autorizo a la Fundación Verisure a tratar estos datos con el único
              fin de crear mi cuenta y gestionar la plataforma de voluntariado.{' '}
              <b>*</b>
            </span>
          </label>
          {errors.consent && (
            <p id="consent-error" className="org-register-form__error" role="alert">
              {errors.consent}
            </p>
          )}

          {status === 'error' && submitError && (
            <p className="org-register-form__error" role="alert">
              {submitError}
            </p>
          )}

          <div className="org-register-form__footer">
            <small>Los campos marcados con * son obligatorios.</small>
            <Button type="submit" size="large" isLoading={status === 'loading'} loadingLabel="Enviando solicitud...">
              Crear cuenta
            </Button>
          </div>
        </form>

        <aside className="org-register-aside">
          <p className="org-register-page__eyebrow">¿Ya tienes cuenta?</p>
          <p>
            Si tu entidad ya está registrada, puedes{' '}
            <Link to="/login">iniciar sesión</Link> directamente.
          </p>
          <p className="org-register-aside__alt">
            ¿No quieres crear cuenta?{' '}
            <Link to="/new-proposal">Propón una colaboración sin registro</Link>.
          </p>
        </aside>
      </div>
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={handleGoHome}
        title="Solicitud recibida"
        description="Tu solicitud de registro ha llegado a la Fundación Verisure."
        closeOnBackdrop={false}
        footer={
          <Button type="button" size="large" onClick={handleGoHome}>
            Volver al inicio
          </Button>
        }
      >
        {/* Sin «reenviar correo»: la verificación por correo (`B1-15`/`B1-16`)
            todavía no existe en el backend, y prometerla aquí sería mentir.
            Tampoco se nombra la entidad: el 201 devuelve un `UserResponse` sin
            ella, y con un CIF que ya existía la cuenta se cuelga de la entidad
            de siempre, no de la que se acaba de escribir. */}
        <p>
          Hemos recibido tu solicitud de cuenta para el CIF{' '}
          <strong>{values.cif.trim().toUpperCase()}</strong>. Si la entidad ya estaba
          registrada, tu cuenta queda vinculada a ella con el nombre que ya tenía.
        </p>
        <p>
          La Fundación la revisará y se pondrá en contacto contigo en{' '}
          <strong>{values.email.trim()}</strong> cuando esté activa. Hasta entonces no
          podrás iniciar sesión.
        </p>
      </Modal>
    </section>
  );
}
