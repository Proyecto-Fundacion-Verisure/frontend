import { describe, expect, it } from 'vitest';
import {
  PROPOSAL_INITIAL_VALUES,
  buildProposalPayload,
  createTouchedFields,
  getProposalFieldError,
  getServerFieldErrors,
  validateProposal,
} from './proposalForm';

const VALID_VALUES = {
  ...PROPOSAL_INITIAL_VALUES,
  organizationName: 'Fundación Prueba',
  cif: 'G12345678',
  contactName: 'Ana Pérez',
  email: 'ana@fundacion.org',
  phone: '600000000',
  description: 'Necesitamos apoyo voluntario.',
  consent: true,
};

describe('proposalForm model', () => {
  it('no devuelve errores con un formulario válido', () => {
    expect(validateProposal(VALID_VALUES)).toEqual({});
  });

  it('valida los campos obligatorios y el formato del CIF', () => {
    const errors = validateProposal(PROPOSAL_INITIAL_VALUES);

    expect(errors).toMatchObject({
      organizationName: 'Indica el nombre de la organización.',
      cif: 'Introduce un CIF válido.',
      contactName: 'Indica una persona de contacto.',
      email: 'Introduce un correo válido.',
      phone: 'Indica un teléfono de contacto.',
      description: 'Describe la necesidad de la organización.',
      consent: 'Debes aceptar la política de privacidad.',
    });
    expect(errors.estimatedVolunteers).toBeUndefined();
  });

  it('exige un número entero positivo de voluntarios', () => {
    expect(getProposalFieldError('estimatedVolunteers', { ...VALID_VALUES, estimatedVolunteers: '0' }))
      .toBe('Debe ser un número entero mayor que cero.');
    expect(getProposalFieldError('estimatedVolunteers', { ...VALID_VALUES, estimatedVolunteers: '2.5' }))
      .toBe('Debe ser un número entero mayor que cero.');
    expect(getProposalFieldError('estimatedVolunteers', { ...VALID_VALUES, estimatedVolunteers: '' }))
      .toBeUndefined();
  });

  it('normaliza el número de voluntarios en el payload', () => {
    expect(buildProposalPayload({ ...VALID_VALUES, estimatedVolunteers: '12' }))
      .toMatchObject({ estimatedVolunteers: 12, consent: true });
    expect(buildProposalPayload({ ...VALID_VALUES, estimatedVolunteers: '' }))
      .toMatchObject({ estimatedVolunteers: null });
  });

  it('se queda con el primer mensaje de los campos conocidos del servidor', () => {
    const fieldErrors = getServerFieldErrors({
      fieldErrors: {
        email: ['Ya existe una propuesta con este correo.', 'Otro mensaje'],
        unknownField: 'Se descarta',
        phone: 42,
      },
    });

    expect(fieldErrors).toEqual({ email: 'Ya existe una propuesta con este correo.' });
  });

  it('devuelve null cuando no hay errores de campo aprovechables', () => {
    expect(getServerFieldErrors(new Error('Fallo de red'))).toBeNull();
    expect(getServerFieldErrors({ fieldErrors: ['lista'] })).toBeNull();
    expect(getServerFieldErrors({ fieldErrors: { unknownField: 'Se descarta' } })).toBeNull();
  });

  it('marca como tocados todos los campos o solo los indicados', () => {
    expect(Object.keys(createTouchedFields())).toHaveLength(9);
    expect(createTouchedFields(['email'])).toEqual({ email: true });
  });
});
