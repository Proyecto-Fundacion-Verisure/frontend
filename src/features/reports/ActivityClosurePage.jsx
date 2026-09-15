import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  finalizeActivityClosure,
  getActivityClosure,
  saveActivityClosure,
} from '../../api/closuresApi';
import { Button, Input, Modal, Spinner, Table, Textarea } from '../../components/ui';

const toNumber = (value) => {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const deviationOf = (expected, reported) => {
  const base = toNumber(expected);
  const current = toNumber(reported);
  if (base === null || base === 0 || current === null) return null;
  return ((current - base) / base) * 100;
};

const formatDeviation = (value) => (
  value === null ? '—' : `${value > 0 ? '+' : ''}${Math.round(value)} %`
);

const deviationClass = (value) => {
  if (value === null || value === 0) return 'closure-form__deviation--neutral';
  return value < 0
    ? 'closure-form__deviation--negative'
    : 'closure-form__deviation--positive';
};

export default function ActivityClosurePage() {
  const { activityId } = useParams();
  const [closure, setClosure] = useState(null);
  const [values, setValues] = useState({
    collaborationRating: '',
    closingNotes: '',
    lessonsLearned: '',
  });
  const [state, setState] = useState({ status: 'loading', error: null });
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState('');

  const load = useCallback(async () => {
    setState({ status: 'loading', error: null });
    try {
      const { data } = await getActivityClosure(activityId);
      setClosure(data);
      setValues({
        collaborationRating: data?.collaborationRating ?? '',
        closingNotes: data?.closingNotes ?? '',
        lessonsLearned: data?.lessonsLearned ?? '',
      });
      setState({ status: 'idle', error: null });
    } catch (error) {
      setState({ status: 'error', error });
    }
  }, [activityId]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateValue = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  };

  const ratingError = values.collaborationRating
    && (Number(values.collaborationRating) < 1 || Number(values.collaborationRating) > 5)
    ? 'La valoración debe estar entre 1 y 5.'
    : '';

  const payload = () => {
    if (ratingError) return null;
    return {
      collaborationRating: values.collaborationRating ? Number(values.collaborationRating) : undefined,
      closingNotes: values.closingNotes.trim() || undefined,
      lessonsLearned: values.lessonsLearned.trim() || undefined,
    };
  };

  const save = async () => {
    const request = payload();
    if (!request) return;
    setState({ status: 'saving', error: null });
    try {
      const { data } = await saveActivityClosure(activityId, request);
      setClosure((current) => data ?? current);
      setState({ status: 'saved', error: null });
    } catch (error) {
      setState({ status: 'idle', error });
    }
  };

  const openConfirm = () => {
    if (payload()) {
      setFinalizeError('');
      setIsConfirmOpen(true);
    }
  };

  const closeConfirm = () => {
    if (finalizing) return;
    setIsConfirmOpen(false);
    setFinalizeError('');
  };

  const confirmFinalize = async () => {
    const request = payload();
    if (!request) {
      setFinalizeError('La valoración debe estar entre 1 y 5.');
      return;
    }
    setFinalizing(true);
    setFinalizeError('');
    try {
      await saveActivityClosure(activityId, request);
      const { data } = await finalizeActivityClosure(activityId);
      setClosure((current) => data ?? { ...current, status: 'CLOSED' });
      setState({ status: 'finalized', error: null });
      setIsConfirmOpen(false);
    } catch (error) {
      setFinalizeError(error?.message || 'No se ha podido finalizar el cierre.');
    } finally {
      setFinalizing(false);
    }
  };

  if (state.status === 'loading') return <Spinner label="Cargando cierre de actividad…" />;

  if (state.status === 'error') {
    const isForbidden = state.error?.status === 403;
    const isNotFound = state.error?.status === 404;
    return (
      <section className="report-form-page" aria-labelledby="activity-closure-load-error">
        <p className="activity-form-page__eyebrow">Cierre de actividad</p>
        <h1 id="activity-closure-load-error">
          {isNotFound
            ? 'No hemos encontrado esta actividad para cerrar'
            : isForbidden
              ? 'No tienes permiso para cerrar esta actividad'
              : 'No hemos podido cargar el cierre de actividad'}
        </h1>
        <p role="alert">{state.error?.message || 'Inténtalo de nuevo.'}</p>
        {!isForbidden && !isNotFound && <Button onClick={load}>Reintentar</Button>}
        <Link className="button button--secondary button--medium" to="/admin/activities/pending-closure">
          Volver a cierres pendientes
        </Link>
      </section>
    );
  }

  const isClosed = closure?.status === 'CLOSED';
  const saved = state.status === 'saved' || state.status === 'finalized';

  const expectedHours = toNumber(closure?.expectedHours);
  const reportedHours = toNumber(closure?.reportedHours);
  const confirmedVolunteers = toNumber(closure?.confirmedVolunteers);
  const closedParticipations = toNumber(closure?.closedParticipations);
  const evidenceCount = toNumber(closure?.evidenceCount);

  const rows = [
    {
      key: 'hours',
      label: 'Horas de voluntariado',
      expected: expectedHours === null ? '—' : `${expectedHours} h`,
      reported: reportedHours === null ? '—' : `${reportedHours} h`,
      deviationValue: deviationOf(expectedHours, reportedHours),
    },
    {
      key: 'volunteers',
      label: 'Voluntarios que cerraron',
      expected: confirmedVolunteers ?? '—',
      reported: closedParticipations ?? '—',
      deviationValue: deviationOf(confirmedVolunteers, closedParticipations),
    },
    {
      key: 'evidence',
      label: 'Evidencias adjuntadas',
      expected: closedParticipations ?? '—',
      reported: evidenceCount ?? '—',
      deviationValue: deviationOf(closedParticipations, evidenceCount),
    },
  ];

  const columns = [
    { key: 'label', label: 'Concepto' },
    { key: 'expected', label: 'Previsto' },
    { key: 'reported', label: 'Reportado' },
    {
      key: 'deviation',
      label: 'Desviación',
      render: (row) => (
        <span
          className={`closure-form__deviation ${deviationClass(row.deviationValue)}`}
          data-testid={`closure-deviation-${row.key}`}
        >
          {formatDeviation(row.deviationValue)}
        </span>
      ),
    },
  ];

  return (
    <section className="report-form-page" aria-labelledby="activity-closure-title">
      <Link to="/admin/activities/pending-closure">← Volver a cierres pendientes</Link>
      <p className="activity-form-page__eyebrow">Cierre de actividad</p>
      <h1 id="activity-closure-title">Cierre de la actividad</h1>
      <p>{closure?.activityTitle ?? `Actividad ${activityId}`}</p>

      {saved && (
        <p className="closure-form__notice" role="status" data-testid="activity-closure-status">
          {state.status === 'saved' ? 'Cierre guardado.' : 'Actividad cerrada.'}
        </p>
      )}

      <div className="closure-form__contrast">
        <Table
          caption="Contraste previsto frente a reportado"
          columns={columns}
          data={rows}
          rowKey="key"
        />
      </div>

      <div className="closure-form__fields">
        <Input
          type="number"
          min="1"
          max="5"
          name="collaborationRating"
          label="Valoración de la colaboración"
          value={values.collaborationRating}
          onChange={updateValue}
          error={ratingError}
          disabled={isClosed}
        />
        <Textarea
          name="closingNotes"
          label="Notas de cierre"
          value={values.closingNotes}
          onChange={updateValue}
          disabled={isClosed}
        />
        <Textarea
          name="lessonsLearned"
          label="Lecciones aprendidas"
          value={values.lessonsLearned}
          onChange={updateValue}
          disabled={isClosed}
        />
      </div>

      {state.error && <p className="activity-form__error" role="alert">{state.error?.message || 'No se pudo completar la operación.'}</p>}

      {!isClosed && (
        <div className="closure-form__actions">
          <Button
            onClick={save}
            isLoading={state.status === 'saving'}
            loadingLabel="Guardando…"
          >
            Guardar borrador
          </Button>
          <Button variant="secondary" onClick={openConfirm}>
            Finalizar cierre
          </Button>
        </div>
      )}

      <Modal
        isOpen={isConfirmOpen}
        onClose={closeConfirm}
        closeDisabled={finalizing}
        title="Finalizar cierre de actividad"
        description="Se guardará el borrador y se cerrará la actividad de forma definitiva. Esta acción no se puede deshacer."
        footer={(
          <>
            <Button variant="secondary" disabled={finalizing} onClick={closeConfirm}>
              Volver
            </Button>
            <Button
              isLoading={finalizing}
              loadingLabel="Finalizando…"
              onClick={confirmFinalize}
            >
              Finalizar
            </Button>
          </>
        )}
      >
        {finalizeError && <p className="activity-form__error" role="alert">{finalizeError}</p>}
      </Modal>
    </section>
  );
}