import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { verifyEmail } from '../../api/authApi';
import EmailVerificationPage from './EmailVerificationPage';

vi.mock('../../api/authApi', () => ({ verifyEmail: vi.fn() }));

describe('EmailVerificationPage', () => {
  beforeEach(() => verifyEmail.mockReset());

  it('verifica el token de la URL y muestra el resultado', async () => {
    verifyEmail.mockResolvedValue({ data: { verified: true } });
    render(
      <MemoryRouter initialEntries={['/verify-email?token=abc123']}>
        <EmailVerificationPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: /correo verificado/i })).toBeInTheDocument();
    expect(verifyEmail).toHaveBeenCalledWith('abc123');
  });

  it('rechaza un enlace sin token sin llamar a la API', async () => {
    render(
      <MemoryRouter initialEntries={['/verify-email']}>
        <EmailVerificationPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: /enlace de verificación incompleto/i })).toBeInTheDocument();
    expect(verifyEmail).not.toHaveBeenCalled();
  });
});
