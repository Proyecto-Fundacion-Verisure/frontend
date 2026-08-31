import { useState } from "react";
import { Link } from "react-router-dom";
import { createProposal } from "../../api/proposalsApi";
import useForm from "../../hooks/useForm";
import { Button, Input, Select, Textarea } from "../../components/ui";
import { ACTIVITY_LINES, getLineByValue } from "../../constants/activityLines";
import ProposalImagePreview from "./ProposalImagePreview";
import ProposalSuccess from "./ProposalSuccess";
import ProposalConsentField from "./ProposalConsentField";

const initialValues = {
  organizationName: "",
  cif: "",
  contactName: "",
  email: "",
  phone: "",
  estimatedVolunteers: "12",
  line: "",
  description: "",
  consent: false,
};

function validate(values) {
  const errors = {};
  if (!values.organizationName.trim())
    errors.organizationName = "Indica el nombre de la organización.";
  if (!/^[A-Z]\d{7}[A-Z0-9]$/i.test(values.cif.trim()))
    errors.cif = "Introduce un CIF válido.";
  if (!values.contactName.trim())
    errors.contactName = "Indica una persona de contacto.";
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim()))
    errors.email = "Introduce un correo válido.";
  if (!values.phone.trim()) errors.phone = "Indica un teléfono de contacto.";
  if (!values.description.trim())
    errors.description = "Describe la necesidad de la organización.";
  if (
    values.estimatedVolunteers &&
    (!Number.isInteger(Number(values.estimatedVolunteers)) ||
      Number(values.estimatedVolunteers) < 1)
  ) {
    errors.estimatedVolunteers = "Debe ser un número entero mayor que cero.";
  }
  if (!values.consent)
    errors.consent = "Debes aceptar la política de privacidad.";
  return errors;
}

function validateField(name, valuesToValidate) {
  return validate(valuesToValidate)[name];
}

function getServerFieldErrors(error) {
  if (!error?.fieldErrors || Array.isArray(error.fieldErrors)) return null;

  const fieldErrors = Object.entries(error.fieldErrors).reduce(
    (result, [field, message]) => {
      const fieldMessage = Array.isArray(message) ? message[0] : message;
      if (field in initialValues && typeof fieldMessage === "string") {
        result[field] = fieldMessage;
      }
      return result;
    },
    {},
  );

  return Object.keys(fieldErrors).length ? fieldErrors : null;
}

function focusFirstInvalid() {
  requestAnimationFrame(() => {
    document.querySelector('[aria-invalid="true"]')?.focus();
  });
}

export default function ProposalForm() {
  const { values, setValues, handleChange, reset } = useForm(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState("idle");
  const selectedLine = getLineByValue(values.line);

  const handleFieldChange = (event) => {
    const { name, value, type, checked } = event.target;
    const nextValue = type === "checkbox" ? checked : value;

    if (type === "checkbox") {
      setValues((current) => ({ ...current, [name]: nextValue }));
    } else {
      handleChange(event);
    }

    if (touched[name]) {
      const nextValues = { ...values, [name]: nextValue };
      const fieldError = validateField(name, nextValues);
      setErrors((current) => ({ ...current, [name]: fieldError }));
    } else if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: undefined }));
    }
  };

  const handleBlur = (event) => {
    const { name, value, type, checked } = event.target;
    const nextValue = type === "checkbox" ? checked : value;
    setTouched((current) => ({ ...current, [name]: true }));
    const nextValues = { ...values, [name]: nextValue };
    const fieldError = validateField(name, nextValues);
    setErrors((current) => ({ ...current, [name]: fieldError }));
  };

  const handleConsentChange = (event) => {
    handleFieldChange(event);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(values);
    const nextTouched = Object.fromEntries(
      Object.keys(initialValues).map((key) => [key, true]),
    );
    setTouched(nextTouched);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      focusFirstInvalid();
      return;
    }

    setStatus("loading");
    try {
      await createProposal({
        ...values,
        estimatedVolunteers: Number(values.estimatedVolunteers) || null,
        image: selectedLine?.image ?? null,
      });
      setStatus("success");
      reset();
      setTouched({});
      setErrors({});
    } catch (error) {
      const serverFieldErrors = getServerFieldErrors(error);
      if (serverFieldErrors) {
        setErrors(serverFieldErrors);
        setTouched((current) => ({
          ...current,
          ...Object.fromEntries(
            Object.keys(serverFieldErrors).map((key) => [key, true]),
          ),
        }));
        setStatus("idle");
        focusFirstInvalid();
      } else {
        setStatus("error");
      }
    }
  };

  const handleResetSuccess = () => {
    setStatus("idle");
    setTouched({});
    setErrors({});
  };

  if (status === "success") {
    return <ProposalSuccess onReset={handleResetSuccess} />;
  }

  return (
    <section className="proposal-page" aria-labelledby="proposal-title">
      <div className="proposal-page__intro">
        <a href="/">← Volver a la portada</a>
        <p className="proposal-page__eyebrow">Propuesta de colaboración</p>
        <h1 id="proposal-title">Contadnos qué necesitáis</h1>
        <p>
          Este formulario es uno de los canales de contacto con la Fundación. Si
          prefieres gestionar tus propias actividades,{" "}
          <Link to="/register-organization">crea una cuenta de entidad</Link>.
        </p>
      </div>
      <div className="proposal-page__layout">
        <form className="proposal-form" onSubmit={handleSubmit} noValidate>
          <div className="proposal-form__grid">
            <Input
              name="organizationName"
              label="Nombre de la organización"
              placeholder="Asociación, fundación o entidad"
              required
              value={values.organizationName}
              onChange={handleFieldChange}
              onBlur={handleBlur}
              error={touched.organizationName ? errors.organizationName : undefined}
            />
            <Input
              name="cif"
              label="CIF"
              placeholder="G12345678"
              required
              value={values.cif}
              onChange={handleFieldChange}
              onBlur={handleBlur}
              error={touched.cif ? errors.cif : undefined}
            />
            <Input
              name="contactName"
              label="Persona de contacto"
              placeholder="Nombre y apellidos"
              required
              value={values.contactName}
              onChange={handleFieldChange}
              onBlur={handleBlur}
              error={touched.contactName ? errors.contactName : undefined}
            />
            <Input
              name="email"
              type="email"
              label="Correo electrónico"
              placeholder="nombre@organizacion.org"
              required
              value={values.email}
              onChange={handleFieldChange}
              onBlur={handleBlur}
              error={touched.email ? errors.email : undefined}
            />
            <Input
              name="phone"
              type="tel"
              label="Teléfono"
              placeholder="600 000 000"
              required
              value={values.phone}
              onChange={handleFieldChange}
              onBlur={handleBlur}
              error={touched.phone ? errors.phone : undefined}
            />
            <Input
              name="estimatedVolunteers"
              type="number"
              min="1"
              label="Voluntarios estimados"
              value={values.estimatedVolunteers}
              onChange={handleFieldChange}
              onBlur={handleBlur}
              error={touched.estimatedVolunteers ? errors.estimatedVolunteers : undefined}
            />
          </div>
          <Select
            name="line"
            label="Línea con la que encaja"
            value={values.line}
            onChange={handleFieldChange}
            onBlur={handleBlur}
          >
            <option value="">No lo tengo claro, ayudadme a ubicarla</option>
            {ACTIVITY_LINES.map((line) => (
              <option key={line.value} value={line.value}>
                {line.label}
              </option>
            ))}
          </Select>

          <ProposalImagePreview line={selectedLine} />

          <Textarea
            name="description"
            label="Descripción de la necesidad"
            placeholder="Qué necesitáis, a quién beneficia, dónde y con qué dedicación aproximada."
            required
            rows={4}
            value={values.description}
            onChange={handleFieldChange}
            onBlur={handleBlur}
            error={touched.description ? errors.description : undefined}
            hint="Cuanto más concreta sea la dedicación por persona, antes podremos publicarla."
          />
          <ProposalConsentField
            checked={values.consent}
            error={touched.consent ? errors.consent : undefined}
            onChange={handleConsentChange}
            onBlur={handleBlur}
          />
          {status === "error" && (
            <p className="proposal-form__error" role="alert">
              No hemos podido enviar la propuesta. Inténtalo de nuevo.
            </p>
          )}
          <div className="proposal-form__footer">
            <small>Los campos marcados con * son obligatorios.</small>
            <Button
              type="submit"
              size="large"
              isLoading={status === "loading"}
              loadingLabel="Enviando…"
            >
              Enviar propuesta
            </Button>
          </div>
        </form>
        <aside className="proposal-steps">
          <p className="proposal-page__eyebrow">Qué pasa después</p>
          <ol>
            <li>
              <span>1</span>
              <div>
                <strong>Recibimos tu propuesta</strong>
                <p>Te llega un correo de acuse al instante.</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>La revisamos</strong>
                <p>
                  El equipo la valora y te llama para concretar fechas, plazas y
                  dedicación.
                </p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>La publicamos</strong>
                <p>Se convierte en una actividad del catálogo interno.</p>
              </div>
            </li>
            <li>
              <span>4</span>
              <div>
                <strong>Medimos el impacto</strong>
                <p>
                  Al terminar, cada persona reporta sus horas y la Fundación las
                  valida.
                </p>
              </div>
            </li>
          </ol>
          <div className="proposal-steps__cta">
            <Link className="button button--primary button--large" to="/register-organization">
              Regístrate como entidad
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
