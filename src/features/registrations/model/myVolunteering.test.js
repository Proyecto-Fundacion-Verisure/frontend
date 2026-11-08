import { describe, expect, it } from 'vitest';
import {
  canCancelRegistration,
  getActivityTitle,
  getRegistrationAction,
  getStatusBadge,
  hasActivityStarted,
  isActiveRegistration,
  splitRegistrations,
} from './myVolunteering';

function makeItem(overrides = {}) {
  return {
    registrationId: 101,
    status: 'WAITLISTED',
    accepted: false,
    queuePosition: 3,
    activityClosed: false,
    activity: { id: 10, title: 'Acompañamiento a mayores', startDate: '2099-01-01' },
    ...overrides,
  };
}

describe('myVolunteering model', () => {
  it('separa inscripciones vivas de historial', () => {
    const items = [
      makeItem({ registrationId: 1, status: 'WAITLISTED' }),
      makeItem({ registrationId: 2, status: 'CONFIRMED' }),
      makeItem({ registrationId: 3, status: 'PENDING_CLOSURE' }),
      makeItem({ registrationId: 4, status: 'CLOSED' }),
      makeItem({ registrationId: 5, status: 'REJECTED' }),
      makeItem({ registrationId: 6, status: 'CANCELLED' }),
    ];
    const { active, history } = splitRegistrations(items);

    expect(active.map((item) => item.registrationId)).toEqual([1, 2, 3]);
    expect(history.map((item) => item.registrationId)).toEqual([4, 5, 6]);
  });

  it('trata una actividad cerrada como historial aunque el estado siga vivo', () => {
    expect(isActiveRegistration(makeItem({ activityClosed: true }))).toBe(false);
    expect(isActiveRegistration(makeItem({ status: 'CLOSED' }))).toBe(false);
    expect(isActiveRegistration(makeItem())).toBe(true);
  });

  it('resuelve el badge de estado y cae al estado en crudo', () => {
    expect(getStatusBadge('CONFIRMED')).toEqual({ label: 'Confirmada', variant: 'success' });
    expect(getStatusBadge('PENDING_CLOSURE')).toEqual({
      label: 'Pendiente de cierre',
      variant: 'warning',
    });
    expect(getStatusBadge('DESCONOCIDO')).toEqual({ label: 'DESCONOCIDO', variant: 'neutral' });
  });

  it('usa el título de la actividad y cae al identificador', () => {
    expect(getActivityTitle({ id: 10, title: 'Acompañamiento' })).toBe('Acompañamiento');
    expect(getActivityTitle({ id: 10 })).toBe('Actividad 10');
    expect(getActivityTitle(undefined)).toBe('Actividad ');
  });

  it('considera empezada solo si la fecha ya pasó', () => {
    expect(hasActivityStarted('2026-09-14', '2026-09-15')).toBe(true);
    expect(hasActivityStarted('2026-09-14', '2026-09-14')).toBe(false);
    expect(hasActivityStarted('2026-09-14', '2026-09-13')).toBe(false);
    expect(hasActivityStarted('', '2026-09-13')).toBe(false);
  });

  it('deja cancelar el mismo día de inicio, como el backend', () => {
    const item = makeItem({ activity: { id: 10, startDate: '2026-09-14' } });

    expect(canCancelRegistration(item, '2026-09-14')).toBe(true);
    expect(canCancelRegistration(item, '2026-09-15')).toBe(false);
  });

  it('no deja cancelar estados que ya no son accionables', () => {
    const today = '2026-09-01';

    expect(canCancelRegistration(makeItem({ status: 'WAITLISTED' }), today)).toBe(true);
    expect(canCancelRegistration(makeItem({ status: 'CONFIRMED' }), today)).toBe(true);
    expect(canCancelRegistration(makeItem({ status: 'PENDING_CLOSURE' }), today)).toBe(false);
    expect(canCancelRegistration(makeItem({ status: 'CLOSED' }), today)).toBe(false);
  });

  it('elige la acción según el cierre y el estado de la actividad', () => {
    expect(getRegistrationAction(makeItem({ status: 'PENDING_CLOSURE' }))).toMatchObject({
      key: 'start-closure',
      to: '/closures/new?registrationId=101',
      label: 'Cerrar tu participación',
      testIdPrefix: 'action-enviar',
    });

    expect(getRegistrationAction(makeItem({ closureId: 501, activityClosed: true }))).toMatchObject(
      {
        key: 'certificate',
        to: '/closures/501/certificate',
        label: 'Descargar certificado',
        testIdPrefix: 'action-cert',
      },
    );

    expect(
      getRegistrationAction(makeItem({ closureId: 502, activityClosed: false })),
    ).toMatchObject({
      key: 'view-closure',
      to: '/closures/502',
      label: 'Ver cierre',
      variant: 'secondary',
      testIdPrefix: 'action-ver',
    });
  });

  it('no propone acción cuando la inscripción no la necesita', () => {
    expect(getRegistrationAction(makeItem({ status: 'CLOSED' }))).toBeNull();
    expect(getRegistrationAction(makeItem({ status: 'CONFIRMED' }))).toBeNull();
    expect(
      getRegistrationAction(makeItem({ status: 'PENDING_CLOSURE', activityClosed: true })),
    ).toBeNull();
  });
});
