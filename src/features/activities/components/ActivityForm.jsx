import { Link } from 'react-router-dom';
import { Button, Input, PageHeader, Select, Textarea } from '../../../shared/ui';
import { ACTIVITY_LINE_OPTIONS, ACTIVITY_MODE_OPTIONS } from '../model/activityForm';

export default function ActivityForm({ form, backPath }) {
  const publishLabel = form.isPartner ? 'Enviar' : 'Publicar actividad';

  return (
    <section className="activity-form-page" aria-labelledby="activity-form-title">
      <Link to={backPath} className="activity-form-page__back">&larr; Volver</Link>
      <PageHeader
        eyebrow={form.headerCopy.eyebrow}
        title={form.headerCopy.title}
        titleId="activity-form-title"
        description={form.headerCopy.description}
      />

      {/* Viene de aceptar una propuesta: el backend solo pudo precargar
          descripción, línea, plazas y entidad; el resto son marcadores. */}
      {form.isFromProposal && (
        <p className="activity-form__notice" role="status">
          Esta actividad nace de una propuesta aceptada. La descripción, la línea y las
          plazas vienen de la propuesta; el título, las fechas y las horas son
          provisionales y hay que completarlos antes de publicarla.
        </p>
      )}

      {form.showReviewNote && (
        <p className="activity-form__review-note" role="status">
          <strong>Comentario de la Fundación:</strong> {form.activity.reviewNote}
        </p>
      )}

      {/* La fila de la entidad no trae la descripción y no hay detalle que la
          sirva: hay que volver a escribirla al editar. Cuando BE3 entregue
          `GET /api/org/activities/{id}`, este aviso sobra. */}
      {form.showMissingDescriptionNotice && (
        <p className="activity-form__notice" role="status">
          Al editar hay que volver a escribir la descripción: «Mis propuestas»
          todavía no la recupera.
        </p>
      )}

      <form className="activity-form" onSubmit={form.handleSave} noValidate>
        <div className="activity-form__grid">
          <Input
            label="Título"
            placeholder="Nombre de la actividad"
            required
            {...form.fieldProps('title')}
          />
          <Select label="Línea" required {...form.fieldProps('line')}>
            <option value="">Selecciona una línea</option>
            {ACTIVITY_LINE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        </div>

        <Textarea
          label="Descripción"
          placeholder="Describe la actividad, su objetivo y a quién beneficia."
          required
          rows={4}
          {...form.fieldProps('description')}
        />

        <div className="activity-form__grid">
          <Select label="Modalidad" required {...form.fieldProps('mode')}>
            <option value="">Selecciona una modalidad</option>
            {ACTIVITY_MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
          <Input
            label="Lugar"
            placeholder="Ciudad o sede (opcional)"
            {...form.fieldProps('location')}
          />
        </div>

        {/* Aquí estaba el control de portada. `B2-03` decidió que la imagen es
            la de la línea de acción, que ya se elige arriba, así que no hay nada
            que subir ni que escribir. */}
        <div className="activity-form__grid">
          <Input type="number" min="1" label="Plazas" required {...form.fieldProps('spots')} />
          <Input
            type="number"
            min="1"
            label="Horas estimadas por persona"
            required
            {...form.fieldProps('hours')}
          />
        </div>

        <div className="activity-form__grid activity-form__grid--dates">
          <Input type="date" label="Fecha de inicio" required {...form.fieldProps('startDate')} />
          <Input type="date" label="Fecha de fin" required {...form.fieldProps('endDate')} />
          <Input
            type="date"
            label="Fecha límite de inscripción"
            required
            {...form.fieldProps('registrationDeadline')}
          />
        </div>

        {form.errorMessage && (
          <p className="activity-form__error" role="alert">{form.errorMessage}</p>
        )}

        <div className="activity-form__footer">
          <small>Los campos marcados con * son obligatorios.</small>
          <div className="activity-form__actions">
            <Button
              type="submit"
              variant="secondary"
              isLoading={form.requestStatus === 'saving'}
              loadingLabel="Guardando…"
              disabled={form.isPublishing}
            >
              {form.isEditMode ? 'Guardar cambios' : 'Guardar borrador'}
            </Button>
            {!form.isEditMode && (
              <Button
                type="button"
                onClick={form.handlePublishRequest}
                disabled={form.requestStatus === 'saving'}
              >
                {publishLabel}
              </Button>
            )}
          </div>
        </div>
      </form>
    </section>
  );
}
