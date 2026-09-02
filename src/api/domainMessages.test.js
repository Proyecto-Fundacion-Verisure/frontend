import { describe, expect, it } from 'vitest';
import { MENSAJES, getDomainMessage, translateFieldErrors } from './domainMessages';

const REQUIRED_CODES = [
  'ACTIVITY_NOT_FINISHED',
  'REGISTRATION_NOT_CONFIRMED',
  'CLOSURE_ALREADY_CLOSED',
  'REPORT_ALREADY_SUBMITTED',
  'REGISTRATION_NOT_FOUND',
  'ACTIVITY_NOT_FOUND',
  'USER_NOT_FOUND',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'VALIDATION_ERROR',
  'FILE_TOO_LARGE',
  'UNSUPPORTED_MEDIA_TYPE',
  'DUPLICATE_CIF',
  'ACCOUNT_PENDING',
  'ACCOUNT_REJECTED',
  'ACTIVITY_FULL',
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
    expect(translateFieldErrors({ cif: 'DUPLICATE_CIF', email: 'Correo inválido.' })).toEqual({
      cif: MENSAJES.DUPLICATE_CIF,
      email: 'Correo inválido.',
    });
  });
});
