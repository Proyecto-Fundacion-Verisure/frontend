import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createActivity } from '../../api/activitiesApi';
import useForm from '../../hooks/useForm';
import { Button, Input, Select, Textarea } from '../../components/ui';
import ActivityCard from './ActivityCard';

const initialValues = {
  title: '',
  description: '',
  line: '',
  modality: '',
  date: '',
  location: '',
  totalSlots: '',
  contactEmail: '',
};

function validate(values) {
  const errors = {};
  if (!values.title.trim()) errors.title = 'Indica el título de la actividad.';
  if (!values.description.trim()) errors.description = 'Describe la actividad.';
  if (!values.line) errors.line = 'Selecciona una línea.';
  if (!values.modality) errors.modality = 'Selecciona la modalidad.';
  if (!values.date) errors.date = 'Indica una fecha.';
  if (values.modality === 'presencial' && !values.location.trim()) {
    errors.location = 'Indica la ubicación para actividades presenciales.';
  }
  if (!values.totalSlots || Number(values.totalSlots) < 1) {
    errors.totalSlots = 'Indica el número de plazas disponible.';
  }
  if (!/^\S+@\S+\.\S+$/.test(values.contactEmail.trim())) {
    errors.contactEmail = 'Introduce un correo de contacto válido.';
  }
  return errors;
}

export default function ActivityFormPage() {
  const { values, handleChange, reset } = useForm(initialValues);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setStatus('loading');
    try {
      await createActivity({
        ...values,
        totalSlots: Number(values.totalSlots),
      });
      setStatus('success');
      reset();
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <section className="activity-form-page activity-form--success">
        <p className="activity-form-page__eyebrow">Actividad creada</p>
        <h1>Actividad publicada</h1>
        <p>
          Tu actividad ya está disponible en el catálogo. Los voluntarios podrán
          verla y apuntarse.
        </p>
        <Button size="large" onClick={() => setStatus('idle')}>
          Crear otra actividad
        </Button>
      </section>
    );
  }

  return (
    <section className="activity-form-page" aria-labelledby="activity-form-title">
      <div className="activity-form-page__header">
        <Link to="/org/activities">← Volver a mis actividades</Link>
        <p className="activity-form-page__eyebrow">Crear actividad</p>
        <h1 id="activity-form-title">Nueva actividad del catálogo</h1>
      </div>

      <div className="activity-form-page__layout">
        <form className="activity-form" onSubmit={handleSubmit} noValidate>
          <div className="activity-form__grid">
            <Input
              name="title"
              label="Título"
              placeholder="Nombre de la actividad"
              required
              value={values.title}
              onChange={handleChange}
              error={errors.title}
            />
            <Input
              name="contactEmail"
              type="email"
              label="Correo de contacto"
              placeholder="contacto@organizacion.org"
              required
              value={values.contactEmail}
              onChange={handleChange}
              error={errors.contactEmail}
            />
          </div>

          <Textarea
            name="description"
            label="Descripción"
            placeholder="Describe la actividad, a quién va dirigida y qué se hará."
            required
            rows={4}
            value={values.description}
            onChange={handleChange}
            error={errors.description}
          />

          <div className="activity-form__grid">
            <Select
              name="line"
              label="Línea"
              required
              value={values.line}
              onChange={handleChange}
              error={errors.line}
            >
              <option value="">Selecciona una línea</option>
              <option value="desoledad">Desoledad</option>
              <option value="educar">Educar para proteger</option>
              <option value="acoso">Protegidos ante el acoso</option>
              <option value="voluntariado">Voluntariado</option>
            </Select>

            <Select
              name="modality"
              label="Modalidad"
              required
              value={values.modality}
              onChange={handleChange}
              error={errors.modality}
            >
              <option value="">Selecciona modalidad</option>
              <option value="presencial">Presencial</option>
              <option value="online">Online</option>
            </Select>
          </div>

          <div className="activity-form__grid">
            <Input
              name="date"
              type="date"
              label="Fecha"
              required
              value={values.date}
              onChange={handleChange}
              error={errors.date}
            />
            <Input
              name="totalSlots"
              type="number"
              min="1"
              label="Plazas disponibles"
              required
              value={values.totalSlots}
              onChange={handleChange}
              error={errors.totalSlots}
            />
          </div>

          {values.modality === 'presencial' && (
            <Input
              name="location"
              label="Ubicación"
              placeholder="Dirección o lugar del evento"
              value={values.location}
              onChange={handleChange}
              error={errors.location}
            />
          )}

          {status === 'error' && (
            <p className="activity-form__error" role="alert">
              No hemos podido crear la actividad. Inténtalo de nuevo.
            </p>
          )}

          <div className="activity-form__footer">
            <small>Los campos marcados con * son obligatorios.</small>
            <Button
              type="submit"
              size="large"
              isLoading={status === 'loading'}
              loadingLabel="Creando…"
            >
              Crear actividad
            </Button>
          </div>
        </form>

        <aside className="activity-preview">
          <p className="activity-preview__label">Vista previa</p>
          <ActivityCard
            activity={values}
            preview
          />
        </aside>
      </div>
    </section>
  );
}
