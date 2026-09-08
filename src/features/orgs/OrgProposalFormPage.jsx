import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createOrgProposal, submitOrgProposal } from "../../api/orgApi";
import { useAuth } from "../auth/AuthContext";
import useForm from "../../hooks/useForm";
import { Button, Input, Modal, Select, Textarea } from "../../components/ui";
import { ACTIVITY_LINES, getLineByValue } from "../../constants/activityLines";
import ProposalImagePreview from "../proposals/ProposalImagePreview";
import ProposalConsentField from "../proposals/ProposalConsentField";

const initialValues = {
  estimatedVolunteers: "12",
  line: "",
  description: "",
  consent: false,
};

function validate(values) {
  const errors = {};
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

function focusFirstInvalid() {
  requestAnimationFrame(() => {
    document.querySelector('[aria-invalid="true"]')?.focus();
  });
}

export default function OrgProposalFormPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { values, setValues, handleChange, reset } = useForm(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState("idle");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingProposalId, setPendingProposalId] = useState(null);
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

  const validateAndTouch = () => {
    const nextErrors = validate(values);
    const nextTouched = Object.fromEntries(
      Object.keys(initialValues).map((key) => [key, true]),
    );
    setTouched(nextTouched);
    setErrors(nextErrors);
    return nextErrors;
  };

  const handleSaveDraft = async () => {
    const nextErrors = validateAndTouch();
    if (Object.keys(nextErrors).length) {
      focusFirstInvalid();
      return;
    }

    setStatus("loading");
    try {
      await createOrgProposal({
        ...values,
        estimatedVolunteers: Number(values.estimatedVolunteers) || null,
        image: selectedLine?.image ?? null,
        status: "DRAFT",
      });
      navigate("/org/proposals");
    } catch (error) {
      setStatus("error");
    }
  };

  const handleSubmitForReview = async () => {
    const nextErrors = validateAndTouch();
    if (Object.keys(nextErrors).length) {
      focusFirstInvalid();
      return;
    }

    setStatus("loading");
    try {
      const { data } = await createOrgProposal({
        ...values,
        estimatedVolunteers: Number(values.estimatedVolunteers) || null,
        image: selectedLine?.image ?? null,
        status: "PENDING_APPROVAL",
      });
      setPendingProposalId(data.id);
      setShowConfirmModal(true);
      setStatus("idle");
    } catch (error) {
      setStatus("error");
    }
  };

  const handleCloseModal = () => {
    setShowConfirmModal(false);
    reset();
    setTouched({});
    setErrors({});
    navigate("/org/proposals");
  };

  return (
    <section className="proposal-page" aria-labelledby="org-proposal-title">
      <div className="proposal-page__intro">
        <Link to="/org/proposals">← Volver a mis propuestas</Link>
        <p className="proposal-page__eyebrow">Entidad colaboradora</p>
        <h1 id="org-proposal-title">Nueva propuesta</h1>
        <p>
          Describe tu propuesta y la Fundación Verisure la revisará.
        </p>
      </div>
      <form className="proposal-form" onSubmit={(e) => e.preventDefault()} noValidate>
          <div className="proposal-form__grid">
            <Input
              name="organizationName"
              label="Entidad colaboradora"
              value={user?.organization ?? user?.name ?? ""}
              disabled
              readOnly
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
            onChange={handleFieldChange}
            onBlur={handleBlur}
          />
          {status === "error" && (
            <p className="proposal-form__error" role="alert">
              No hemos podido guardar la propuesta. Inténtalo de nuevo.
            </p>
          )}
          <div className="proposal-form__footer">
            <small>Los campos marcados con * son obligatorios.</small>
            <div className="proposal-form__actions">
              <Button
                type="button"
                variant="secondary"
                size="large"
                isLoading={status === "loading"}
                loadingLabel="Guardando…"
                onClick={handleSaveDraft}
              >
                Guardar borrador
              </Button>
              <Button
                type="button"
                size="large"
                isLoading={status === "loading"}
                loadingLabel="Enviando…"
                onClick={handleSubmitForReview}
              >
                Enviar a revisión
              </Button>
            </div>
          </div>
      </form>

      <Modal
        isOpen={showConfirmModal}
        onClose={handleCloseModal}
        title="Propuesta enviada"
        footer={
          <Button onClick={handleCloseModal}>
            Cerrar
          </Button>
        }
      >
        <p>
          Tu propuesta ha sido enviada correctamente y será revisada por el
          equipo de la Fundación Verisure.
        </p>
      </Modal>
    </section>
  );
}
