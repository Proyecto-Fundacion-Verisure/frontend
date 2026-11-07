import { describe, expect, it } from 'vitest';
import {
  ACTIVITY_FORM_INITIAL_VALUES,
  buildActivityPayload,
  getActivityFormHeaderCopy,
  getActivityFormResultCopy,
  getActivityFormView,
  toActivityFormValues,
  validateActivityForm,
} from './activityForm';

const VALID_VALUES = {
  title: '  Taller de code  ',
  description: '  Un taller para aprender  ',
  line: 'educar',
  mode: 'PRESENCIAL',
  location: '  Madrid  ',
  spots: '15',
  hours: '3',
  startDate: '2026-09-10',
  endDate: '2026-09-10',
  registrationDeadline: '2026-09-08',
};

describe('activityForm model', () => {
  it('normaliza los valores del detalle para el formulario', () => {
    const values = toActivityFormValues({
      title: 'Mentoría',
      line: 'EDUCAR',
      mode: 'presencial',
      spots: 15,
      hours: 3,
      startDate: '2026-10-10T00:00:00',
    });

    expect(values).toMatchObject({
      title: 'Mentoría',
      line: 'educar',
      mode: 'PRESENCIAL',
      spots: '15',
      hours: '3',
      startDate: '2026-10-10',
    });
    expect(values.description).toBe('');
  });

  it('construye el payload del contrato y normaliza espacios', () => {
    expect(buildActivityPayload(VALID_VALUES)).toEqual({
      title: 'Taller de code',
      description: 'Un taller para aprender',
      line: 'educar',
      mode: 'PRESENCIAL',
      location: 'Madrid',
      startDate: '2026-09-10',
      endDate: '2026-09-10',
      registrationDeadline: '2026-09-08',
      hours: 3,
      spots: 15,
    });
  });

  it('valida campos obligatorios y rangos de fechas', () => {
    const errors = validateActivityForm({
      ...ACTIVITY_FORM_INITIAL_VALUES,
      startDate: '2026-09-10',
      endDate: '2026-09-09',
      registrationDeadline: '2026-09-11',
    });

    expect(errors.title).toBe('Indica el título de la actividad.');
    expect(errors.endDate).toBe('La fecha de fin no puede ser anterior a la de inicio.');
    expect(errors.registrationDeadline).toBe('La fecha límite no puede ser posterior al inicio.');
  });

  it('elige la copia y la vista según el rol y el estado', () => {
    expect(getActivityFormHeaderCopy({ isPartner: true, isEditMode: false })).toMatchObject({
      eyebrow: 'Nueva propuesta',
    });
    expect(getActivityFormResultCopy({
      requestStatus: 'published',
      isPartner: true,
      isEditMode: false,
    })).toMatchObject({
      title: 'La propuesta está pendiente de aprobación',
      showPublish: false,
    });
    expect(getActivityFormView('loading', null)).toBe('loading');
    expect(getActivityFormView('publishing', { id: 1 })).toBe('result');
    expect(getActivityFormView('idle', null)).toBe('form');
  });
});
