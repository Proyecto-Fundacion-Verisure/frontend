import { describe, expect, it } from 'vitest';
import {
  EMPTY_PENDING_ORGANIZATIONS,
  getAccountStatusView,
  getOrganizationActionCopy,
  getPendingCountLabel,
  getVerificationErrorMessage,
  isExpiredVerification,
  normalizePendingOrganizationsPage,
} from './accountStatus';

describe('accountStatus model', () => {
  it('resuelve la vista pública a partir de la URL y del estado de verificación', () => {
    const base = { token: null, pending: null, verifyState: 'idle', verifyError: null };

    expect(getAccountStatusView({ ...base, token: 'abc', verifyState: 'loading' })).toBe(
      'verifying',
    );
    expect(getAccountStatusView({ ...base, token: 'abc', verifyState: 'success' })).toBe(
      'verified',
    );
    expect(getAccountStatusView({ ...base, token: 'abc', verifyState: 'error' })).toBe(
      'verification-error',
    );
    expect(
      getAccountStatusView({
        ...base,
        token: 'abc',
        verifyState: 'error',
        verifyError: { code: 'VERIFICATION_EXPIRED' },
      }),
    ).toBe('expired');
    expect(getAccountStatusView({ ...base, pending: 'verification' })).toBe('pending-verification');
    expect(getAccountStatusView({ ...base, pending: 'approval' })).toBe('pending-approval');
    expect(getAccountStatusView(base)).toBe('guest');
  });

  it('prioriza el token sobre el motivo de espera', () => {
    expect(
      getAccountStatusView({
        token: 'abc',
        pending: 'verification',
        verifyState: 'success',
        verifyError: null,
      }),
    ).toBe('verified');
  });

  it('detecta el enlace caducado y usa el mensaje del backend', () => {
    expect(isExpiredVerification({ code: 'VERIFICATION_EXPIRED' })).toBe(true);
    expect(isExpiredVerification({ code: 'INVALID_TOKEN' })).toBe(false);
    expect(isExpiredVerification(null)).toBe(false);

    expect(getVerificationErrorMessage({ message: 'El enlace no es válido.' })).toBe(
      'El enlace no es válido.',
    );
    expect(getVerificationErrorMessage(null)).toBe('Inténtalo de nuevo más tarde.');
  });

  it('normaliza la página de Spring y la lista antigua', () => {
    expect(
      normalizePendingOrganizationsPage({
        content: [{ id: 1 }],
        totalPages: 3,
        totalElements: 7,
      }),
    ).toEqual({ organizations: [{ id: 1 }], totalPages: 3, totalElements: 7 });

    expect(normalizePendingOrganizationsPage([{ id: 2 }])).toEqual({
      organizations: [{ id: 2 }],
      totalPages: 1,
      totalElements: 0,
    });

    expect(normalizePendingOrganizationsPage(null)).toEqual(EMPTY_PENDING_ORGANIZATIONS);
    expect(
      normalizePendingOrganizationsPage({ content: 'no-es-lista', totalPages: 0 }),
    ).toMatchObject({ organizations: [], totalPages: 1 });
  });

  it('concuerda el contador en singular y plural', () => {
    expect(getPendingCountLabel(1)).toBe('1 cuenta por aprobar');
    expect(getPendingCountLabel(4)).toBe('4 cuentas por aprobar');
    expect(getPendingCountLabel(0)).toBe('0 cuentas por aprobar');
  });

  it('elige la copia de la acción y cae a aceptar', () => {
    expect(getOrganizationActionCopy('reject')).toMatchObject({
      title: 'Rechazar entidad',
      variant: 'danger',
    });
    expect(getOrganizationActionCopy('accept').question('Cáritas')).toBe(
      '¿Deseas aceptar la cuenta de "Cáritas"?',
    );
    expect(getOrganizationActionCopy(null).title).toBe('Aceptar entidad');
  });
});
