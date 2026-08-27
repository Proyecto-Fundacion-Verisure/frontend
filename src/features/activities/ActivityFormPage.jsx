import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createActivity } from '../../api/activitiesApi';
import useForm from '../../hooks/useForm';
import { Button, Input, Select, Textarea } from '../../components/ui';

const initialValues = {
  title: '',
  description: '',
  line: '',
  modality: '',
  maxParticipants: '',
  hours: '',
  startDate: '',
  endDate: '',
  registrationDeadline: '',
  imageUrl: '',
};

function toISOString(localValue) {
  if (!localValue) return '';
  return new Date(localValue).toISOString();
}

function validate(values) {
  const errors = {};
  if (!values.title.trim()) errors.title = 'Indica el título de la actividad.';
  else if (values.title.trim().length > 120) errors.title = 'El título no puede superar los 120 caracteres.';
  if (!values.description.trim()) errors.description = 'Describe la actividad.';
  if (!values.line) errors.line = 'Selecciona una línea.';
  if (!values.modality) errors.modality = 'Selecciona una modalidad.';
  if (!values.maxParticipants) {
    errors.maxParticipants = 'Indica el número máximo de participantes.';
  } else if (Number(values.maxParticipants) < 1) {
    errors.maxParticipants = 'Debe ser al menos 1.';
  }
  if (!values.hours) {
    errors.hours = 'Indica las horas estimadas.';
  } else if (Number(values.hours) < 1) {
    errors.hours = 'Debe ser al menos 1.';
  }
  if (!values.startDate) {
    errors.startDate = 'Indica la fecha de inicio.';
  }
  if (!values.endDate) {
    errors.endDate = 'Indica la fecha de fin.';
  }
  if (!values.registrationDeadline) {
    errors.registrationDeadline = 'Indica la fecha límite de inscripción.';
  }

  if (values.startDate && values.endDate) {
    const start = new Date(values.startDate);
    const end = new Date(values.endDate);
    if (end <= start) {
      errors.endDate = 'La fecha de fin debe ser posterior a la de inicio.';
    }
  }

  if (values.startDate && values.registrationDeadline) {
    const start = new Date(values.startDate);
    const deadline = new Date(values.registrationDeadline);
    if (deadline > start) {
      errors.registrationDeadline = 'La fecha límite no puede ser posterior al inicio.';
    }
  }

  return errors;
}

export default function ActivityFormPage() {
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
      await createActivity({
        title: values.title.trim(),
        description: values.description.trim(),
        line: values.line,
        modality: values.modality,
        maxParticipants: Number(values.maxParticipants),
        hours: Number(values.hours),
        startDate: toISOString(values.startDate),
        endDate: toISOString(values.endDate),
        registrationDeadline: toISOString(values.registrationDeadline),
        imageUrl: values.imageUrl.trim() || null,
      });
      setStatus('success');
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

  if (status === 'success') {
    return (
      <section className="activity-form-page activity-form-page--success">
        <p className="activity-form-page__eyebrow">Actividad creada</p>
        <h1>Tu actividad está lista</h1>
        <p>
          Ya puedes revisarla, editarla o publicarla desde tu panel de actividades.
        </p>
        <div className="activity-form-page__success-actions">
          <Button size="large" onClick={() => { setStatus('idle'); setErrors({}); setTouched({}); }}>
            Crear otra actividad
          </Button>
          <Link className="button button--secondary button--large" to="/org/activities">
            Volver al listado
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="activity-form-page" aria-labelledby="activity-form-title">
      <div className="activity-form-page__intro">
        <Link to="/org/activities" className="activity-form-page__back">&larr; Volver al listado</Link>
        <p className="activity-form-page__eyebrow">Nueva actividad</p>
        <h1 id="activity-form-title">Crear actividad de voluntariado</h1>
        <p>
          Rellena los datos para publicar una actividad en el catálogo interno.
          Podrás editarla antes de enviarla a revisión.
        </p>
      </div>

      <form className="activity-form" onSubmit={handleSubmit} noValidate>
        <div className="activity-form__grid">
          <Input label="Título" placeholder="Nombre de la actividad" required {...fieldProps('title')} />
          <Select label="Línea" required {...fieldProps('line')}>
            <option value="">Selecciona una línea</option>
            <option value="desoledad">Desoledad</option>
            <option value="educar">Educar para proteger</option>
            <option value="acoso">Protegidos ante el acoso</option>
            <option value="voluntariado">Voluntariado</option>
          </Select>
        </div>

        <Textarea
          label="Descripción"
          placeholder="Describe la actividad, su objetivo y a quién beneficia."
          required
          rows={4}
          {...fieldProps('description')}
        />

        <div className="activity-form__grid">
          <Select label="Modalidad" required {...fieldProps('modality')}>
            <option value="">Selecciona una modalidad</option>
            <option value="presencial">Presencial</option>
            <option value="online">Online</option>
          </Select>
          <Input type="number" min="1" label="Máximo de participantes" required {...fieldProps('maxParticipants')} />
        </div>

        <div className="activity-form__grid">
          <Input type="number" min="1" label="Horas estimadas por persona" required {...fieldProps('hours')} />
          <Input label="URL de imagen de portada" placeholder="https://..." hint="Sube la imagen previamente desde el panel de administración." {...fieldProps('imageUrl')} />
        </div>

        <div className="activity-form__grid activity-form__grid--dates">
          <Input type="datetime-local" label="Fecha y hora de inicio" required {...fieldProps('startDate')} />
          <Input type="datetime-local" label="Fecha y hora de fin" required {...fieldProps('endDate')} />
          <Input type="datetime-local" label="Fecha límite de inscripción" required {...fieldProps('registrationDeadline')} />
        </div>

        {status === 'error' && (
          <p className="activity-form__error" role="alert">
            No hemos podido crear la actividad. Revisa los campos o inténtalo de nuevo.
          </p>
        )}

        <div className="activity-form__footer">
          <small>Los campos marcados con * son obligatorios.</small>
          <Button type="submit" size="large" isLoading={status === 'loading'} loadingLabel="Creando…">
            Crear actividad
          </Button>
        </div>
      </form>
    </section>
  );
}
