import { describe, expect, it } from 'vitest';
import { MENSAJES, getDomainMessage, translateFieldErrors } from './domainMessages';

const REQUIRED_CODES = [
  'VALIDATION_ERROR',
  'DEADLINE_PASSED',
  'ACTIVITY_NOT_FINISHED',
  'INVALID_DATE_RANGE',
  'NOT_OWNER',
  'ACCOUNT_NOT_VERIFIED',
  'ACCOUNT_PENDING_APPROVAL',
  'ACCOUNT_REJECTED',
  'ALREADY_REGISTERED',
  'REGISTRATION_NOT_CONFIRMED',
  'ACTIVITY_NOT_CLOSED',
  'CLOSURE_ALREADY_CLOSED',
  'ACTIVITY_FINISHED',
  'ACTIVITY_NOT_EDITABLE',
  'CIF_ALREADY_REGISTERED',
  'PROPOSAL_ALREADY_DECIDED',
  'VERIFICATION_EXPIRED',
  'RATE_LIMIT_EXCEEDED',
];

describe('MENSAJES', () => {
  it.each(REQUIRED_CODES)('provides a readable Spanish message for %s', (code) => {
    expect(MENSAJES[code]).toEqual(expect.any(String));
    expect(MENSAJES[code]).not.toBe(code);
  });

  it('falls back safely for unknown codes', () => {
    expect(getDomainMessage('UNKNOWN_CODE', 'Mensaje del servidor.')).toBe('Mensaje del servidor.');
  });

  it('translates domain codes returned as field errors', () => {
    expect(translateFieldErrors({ cif: ['CIF_ALREADY_REGISTERED'], email: ['Correo inválido.'] })).toEqual({
      cif: MENSAJES.CIF_ALREADY_REGISTERED,
      email: 'Correo inválido.',
    });
  });

  it('joins multiple validation messages from the ApiError fields map', () => {
    expect(translateFieldErrors({ cif: ['debe tener 9 caracteres', 'solo admite letras y números'] })).toEqual({
      cif: 'debe tener 9 caracteres solo admite letras y números',
    });
  });
});
