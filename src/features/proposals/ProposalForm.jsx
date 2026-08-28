import { useState } from "react";
import { Link } from "react-router-dom";
import { createProposal } from "../../api/proposalsApi";
import useForm from "../../hooks/useForm";
import { Button, Input, Select, Textarea } from "../../components/ui";

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

export default function ProposalForm() {
  const { values, setValues, handleChange, reset } = useForm(initialValues);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setStatus("loading");
    try {
      await createProposal({
        ...values,
        estimatedVolunteers: Number(values.estimatedVolunteers) || null,
      });
      setStatus("success");
      reset();
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <section className="proposal-page proposal-page--success">
        <p className="proposal-page__eyebrow">Propuesta recibida</p>
        <h1>Gracias por contarnos qué necesitáis.</h1>
        <p>
          Hemos recibido vuestra propuesta. El equipo de la Fundación Verisure
          la revisará y os contactará por correo.
        </p>
        <Button size="large" onClick={() => setStatus("idle")}>
          Enviar otra propuesta
        </Button>
      </section>
    );
  }

  return (
    <section className="proposal-page" aria-labelledby="proposal-title">
      <div className="proposal-page__intro">
        <a href="/">← Volver a la portada</a>
        <p className="proposal-page__eyebrow">Propuesta de colaboración</p>
        <h1 id="proposal-title">Contadnos qué necesitáis</h1>
        <p>
          Este formulario es uno de los canales de contacto con la Fundación. Si
          prefieres gestionar tus propias actividades,{' '}
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
              onChange={handleChange}
              error={errors.organizationName}
            />
            <Input
              name="cif"
              label="CIF"
              placeholder="G12345678"
              required
              value={values.cif}
              onChange={handleChange}
              error={errors.cif}
            />
            <Input
              name="contactName"
              label="Persona de contacto"
              placeholder="Nombre y apellidos"
              required
              value={values.contactName}
              onChange={handleChange}
              error={errors.contactName}
            />
            <Input
              name="email"
              type="email"
              label="Correo electrónico"
              placeholder="nombre@organizacion.org"
              required
              value={values.email}
              onChange={handleChange}
              error={errors.email}
            />
            <Input
              name="phone"
              type="tel"
              label="Teléfono"
              placeholder="600 000 000"
              required
              value={values.phone}
              onChange={handleChange}
              error={errors.phone}
            />
            <Input
              name="estimatedVolunteers"
              type="number"
              min="1"
              label="Voluntarios estimados"
              value={values.estimatedVolunteers}
              onChange={handleChange}
              error={errors.estimatedVolunteers}
            />
          </div>
          <Select
            name="line"
            label="Línea con la que encaja"
            value={values.line}
            onChange={handleChange}
          >
            <option value="">No lo tengo claro, ayudadme a ubicarla</option>
            <option value="desoledad">Desoledad</option>
            <option value="educar">Educar para proteger</option>
            <option value="acoso">Protegidos ante el acoso</option>
            <option value="voluntariado">Voluntariado</option>
          </Select>
          <Textarea
            name="description"
            label="Descripción de la necesidad"
            placeholder="Qué necesitáis, a quién beneficia, dónde y con qué dedicación aproximada."
            required
            rows={4}
            value={values.description}
            onChange={handleChange}
            error={errors.description}
            hint="Cuanto más concreta sea la dedicación por persona, antes podremos publicarla."
          />
          <label
            className={`proposal-form__consent${errors.consent ? " proposal-form__consent--error" : ""}`}
          >
            <input
              name="consent"
              type="checkbox"
              required
              checked={values.consent}
              aria-invalid={Boolean(errors.consent)}
              aria-describedby={errors.consent ? "proposal-consent-error" : undefined}
              onChange={(event) => {
                const isChecked = event.target.checked;
                setValues((current) => ({
                  ...current,
                  consent: isChecked,
                }));
                if (isChecked) {
                  setErrors((current) => ({ ...current, consent: undefined }));
                }
              }}
            />{" "}
            <span>
              He leído y acepto la <strong>política de privacidad</strong>.
              Autorizo a la Fundación Verisure a tratar estos datos con el único
              fin de valorar esta propuesta y ponerse en contacto conmigo.{" "}
              <b>*</b>
            </span>
          </label>
          {errors.consent && (
            <p id="proposal-consent-error" className="proposal-form__error" role="alert">
              {errors.consent}
            </p>
          )}
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
          {/* <p className="proposal-steps__note"><strong>No hace falta que tengáis cuenta.</strong> La plataforma solo la usan la Fundación y la plantilla de Verisure.</p> */}
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
