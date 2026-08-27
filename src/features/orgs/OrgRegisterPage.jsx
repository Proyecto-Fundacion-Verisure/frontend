import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createOrganization } from '../../api/orgApi';
import useForm from '../../hooks/useForm';
import { Button, Input } from '../../components/ui';

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

const CIF_LETTERS = /^[ABCDEFGHJKLMNPQRSUVW]$/i;

function isValidCif(value) {
  const cif = value.trim().toUpperCase();
  if (cif.length < 9) return false;
  if (!CIF_LETTERS.test(cif[0])) return false;
  if (!/^\d{7}[A-Z0-9]$/.test(cif.slice(1))) return false;

  let sum = 0;
  for (let i = 1; i <= 7; i++) {
    const n = parseInt(cif[i], 10);
    sum += i % 2 === 0 ? n : (n < 5 ? n * 2 : n * 2 - 9);
  }
  const controlDigit = (10 - (sum % 10)) % 10;
  const lastChar = cif[8];
  return lastChar === String(controlDigit) || lastChar === 'J' === false;
}

function validate(values) {
  const errors = {};
  if (!values.organizationName.trim()) errors.organizationName = 'Enter the organization name.';
  if (!values.cif.trim()) {
    errors.cif = 'Enter the CIF.';
  } else if (!isValidCif(values.cif)) {
    errors.cif = 'Enter a valid CIF (letter + 7 digits + control digit).';
  }
  if (!values.contactName.trim()) errors.contactName = 'Enter a contact person.';
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = 'Enter a valid email address.';
  if (!values.phone.trim()) errors.phone = 'Enter a contact phone number.';
  if (!values.password) {
    errors.password = 'Enter a password.';
  } else if (values.password.length < 8) {
    errors.password = 'The password must be at least 8 characters.';
  }
  if (values.password !== values.confirmPassword) errors.confirmPassword = 'Passwords do not match.';
  if (!values.consent) errors.consent = 'You must accept the privacy policy.';
  return errors;
}

export default function OrgRegisterPage() {
  const navigate = useNavigate();
  const { values, setValues, handleChange } = useForm(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState('idle');

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
    try {
      await createOrganization({
        organizationName: values.organizationName.trim(),
        cif: values.cif.trim().toUpperCase(),
        contactName: values.contactName.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim(),
        password: values.password,
      });
      navigate('/account-status');
    } catch (err) {
      const apiErrors = err?.fieldErrors;
      if (apiErrors) {
        setErrors(apiErrors);
        setTouched(Object.keys(apiErrors).reduce((acc, k) => ({ ...acc, [k]: true }), {}));
      }
      setStatus('error');
    }
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
        <Link to="/" className="org-register-page__back">&larr; Back to home</Link>
        <p className="org-register-page__eyebrow">Organization account</p>
        <h1 id="org-register-title">Register your organization</h1>
        <p>
          Create an account to post volunteering activities and manage
          the enrollments from the Verisure staff.
        </p>
      </div>

      <div className="org-register-page__layout">
        <form className="org-register-form" onSubmit={handleSubmit} noValidate>
          <div className="org-register-form__grid">
            <Input label="Organization name" placeholder="Association, foundation or entity" required {...fieldProps('organizationName')} />
            <Input label="CIF" placeholder="A12345678" required {...fieldProps('cif')} />
          </div>
          <div className="org-register-form__grid">
            <Input label="Contact person" placeholder="Full name" required {...fieldProps('contactName')} />
            <Input type="email" label="Email" placeholder="name@organization.org" required {...fieldProps('email')} />
          </div>
          <div className="org-register-form__grid">
            <Input type="tel" label="Phone" placeholder="600 000 000" required {...fieldProps('phone')} />
            <span />
          </div>
          <div className="org-register-form__grid">
            <Input type="password" label="Password" placeholder="Minimum 8 characters" required {...fieldProps('password')} />
            <Input type="password" label="Confirm password" placeholder="Re-enter your password" required {...fieldProps('confirmPassword')} />
          </div>

          <label className={`org-register-form__consent${errors.consent ? ' org-register-form__consent--error' : ''}`}>
            <input
              type="checkbox"
              checked={values.consent}
              onChange={(event) => setValues((current) => ({ ...current, consent: event.target.checked }))}
            />{' '}
            <span>
              I have read and accept the <strong>privacy policy</strong>.
              I authorize Fundación Verisure to process this data solely for the
              purpose of creating my account and managing the volunteering platform.{' '}
              <b>*</b>
            </span>
          </label>
          {errors.consent && <p className="org-register-form__error" role="alert">{errors.consent}</p>}

          {status === 'error' && (
            <p className="org-register-form__error" role="alert">
              We could not create the account. Please try again.
            </p>
          )}

          <div className="org-register-form__footer">
            <small>Fields marked with * are required.</small>
            <Button type="submit" size="large" isLoading={status === 'loading'} loadingLabel="Creating account…">
              Create account
            </Button>
          </div>
        </form>

        <aside className="org-register-aside">
          <p className="org-register-page__eyebrow">Already have an account?</p>
          <p>
            If your organization is already registered, you can{' '}
            <Link to="/login">log in</Link> directly.
          </p>
          <p className="org-register-aside__alt">
            Don't want to create an account?{' '}
            <Link to="/new-proposal">Propose a collaboration without signing up</Link>.
          </p>
        </aside>
      </div>
    </section>
  );
}
