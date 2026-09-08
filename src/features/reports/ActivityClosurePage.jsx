import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  finalizeActivityClosure,
  getActivityClosure,
  saveActivityClosure,
} from '../../api/closuresApi';
import { Button, Input, Spinner, Textarea } from '../../components/ui';

export default function ActivityClosurePage() {
  const { activityId } = useParams();
  const [closure, setClosure] = useState(null);
  const [values, setValues] = useState({
    collaborationRating: '',
    closingNotes: '',
    lessonsLearned: '',
  });
  const [state, setState] = useState({ status: 'loading', error: null });

  const load = useCallback(async () => {
    setState({ status: 'loading', error: null });
    try {
      const { data } = await getActivityClosure(activityId);
      setClosure(data);
      setValues({
        collaborationRating: data.collaborationRating ?? '',
        closingNotes: data.closingNotes ?? '',
        lessonsLearned: data.lessonsLearned ?? '',
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

  const payload = () => {
    const collaborationRating = values.collaborationRating
      ? Number(values.collaborationRating)
      : undefined;
    if (collaborationRating !== undefined
      && (collaborationRating < 1 || collaborationRating > 5)) {
      setState({ status: 'idle', error: new Error('La valoración debe estar entre 1 y 5.') });
      return null;
    }
    return {
      collaborationRating,
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
      setClosure(data);
      setState({ status: 'saved', error: null });
    } catch (error) {
      setState({ status: 'idle', error });
    }
  };

  const finalize = async () => {
    const request = payload();
    if (!request) return;
    setState({ status: 'finalizing', error: null });
    try {
      await saveActivityClosure(activityId, request);
      const { data } = await finalizeActivityClosure(activityId);
      setClosure(data);
      setState({ status: 'finalized', error: null });
    } catch (error) {
      setState({ status: 'idle', error });
    }
  };

  if (state.status === 'loading') return <Spinner label="Cargando cierre de actividad…" />;
  if (state.status === 'error') {
    return (
      <section>
        <h1>No hemos podido cargar el cierre de actividad</h1>
        <p role="alert">{state.error?.message || 'Inténtalo de nuevo.'}</p>
        <Button onClick={load}>Reintentar</Button>
      </section>
    );
  }

  const isClosed = closure?.status === 'CLOSED';

  return (
    <section aria-labelledby="activity-closure-title">
      <Link to="/admin/activities/pending-closure">← Volver a cierres pendientes</Link>
      <h1 id="activity-closure-title">Cierre de actividad</h1>
      <dl>
        <div><dt>Horas previstas</dt><dd>{closure?.expectedHours ?? 0}</dd></div>
        <div><dt>Horas reportadas</dt><dd>{closure?.reportedHours ?? 0}</dd></div>
        <div><dt>Personas confirmadas</dt><dd>{closure?.confirmedVolunteers ?? 0}</dd></div>
        <div><dt>Participaciones cerradas</dt><dd>{closure?.closedParticipations ?? 0}</dd></div>
        <div><dt>Evidencias</dt><dd>{closure?.evidenceCount ?? 0}</dd></div>
      </dl>

      <Input
        type="number"
        min="1"
        max="5"
        name="collaborationRating"
        label="Valoración de la colaboración"
        value={values.collaborationRating}
        onChange={updateValue}
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
        label="Aprendizajes"
        value={values.lessonsLearned}
        onChange={updateValue}
        disabled={isClosed}
      />
      {state.error && <p role="alert">{state.error.message || 'No se pudo completar la operación.'}</p>}
      {['saved', 'finalized'].includes(state.status) && (
        <p role="status">{state.status === 'saved' ? 'Cierre guardado.' : 'Actividad cerrada.'}</p>
      )}
      {!isClosed && (
        <div>
          <Button onClick={save} isLoading={state.status === 'saving'}>Guardar borrador</Button>
          <Button onClick={finalize} isLoading={state.status === 'finalizing'}>Finalizar cierre</Button>
        </div>
      )}
    </section>
  );
}
