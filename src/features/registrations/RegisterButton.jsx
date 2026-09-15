import { useCallback, useMemo, useRef, useState } from 'react';
import { createRegistration } from '../../api/registrationsApi';
import { useRegistrationsOptional } from './RegistrationsContext';
import { Button } from '../../components/ui';
import { isPastLocalDate } from '../../utils/dates';
import RegistrationInfoModal from './RegistrationInfoModal';

export default function RegisterButton({ activity, children = 'Solicitar inscripción', disabled = false, onSuccess, ...props }) {
  const activityId = activity?.id ?? activity?.activityId;
  const registrationsCtx = useRegistrationsOptional();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const submittingRef = useRef(false);

  // El propio día del plazo todavía admite inscripciones, igual que en el backend
  // (`SpotServiceImpl`: `LocalDate.now().isAfter(deadline)`). Comparar instantes
  // en vez de días naturales cerraba la inscripción un día antes.
  const isDeadlinePassed = useMemo(() => {
    const raw = activity?.registrationDeadline ?? activity?.deadline ?? activity?.inscriptionDeadline;
    return isPastLocalDate(raw);
  }, [activity]);

  const handleOpen = useCallback(() => {
    if (disabled || isDeadlinePassed) return;
    setError(null);
    setIsModalOpen(true);
  }, [disabled, isDeadlinePassed]);

  const handleClose = useCallback(() => {
    if (submittingRef.current) return;
    setIsModalOpen(false);
    setError(null);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (submittingRef.current) return;
    if (!activityId) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await createRegistration(Number(activityId) || activityId);
      const data = response?.data ?? response;
      // Backend: valid request returns 201 RegistrationResponse { registrationId, activityId, status: WAITLISTED, accepted, queuePosition? }
      if (registrationsCtx) {
        registrationsCtx.addRegistration(data);
      }
      if (onSuccess) onSuccess(data);
      setIsModalOpen(false);
    } catch (err) {
      // No cambian la interfaz: mantenemos no inscrito, solo mostramos error
      // Tratar ALREADY_REGISTERED y DEADLINE_PASSED de forma explícita pero sin cambiar estado
      setError(err);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [activityId, onSuccess, registrationsCtx]);

  if (isDeadlinePassed) {
    return (
      <p role="note" className="register-button__closed">
        Plazo cerrado: Ya no se admiten inscripciones para esta actividad.
      </p>
    );
  }

  return (
    <>
      <Button
        onClick={handleOpen}
        disabled={disabled || isSubmitting}
        data-testid="open-registration-modal"
        {...props}
      >
        {children}
      </Button>
      {/* El error se pinta dentro del modal, que es donde está mirando quien acaba
          de pulsar Confirmar y lo único visible mientras el modal está abierto.
          Aquí fuera solo queda para el caso de que ya se haya cerrado. */}
      {error && !isModalOpen && (
        <p role="alert" className="register-button__error">
          {error.message || 'No se pudo completar la solicitud.'}
        </p>
      )}
      <RegistrationInfoModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        isSubmitting={isSubmitting}
        error={error}
      />
    </>
  );
}
