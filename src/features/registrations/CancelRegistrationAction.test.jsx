import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CancelRegistrationAction from './CancelRegistrationAction';

const registration = { registrationId: 10, status: 'CONFIRMED', accepted: true };

describe('CancelRegistrationAction', () => {
  it.each([
    ['con motivo', 'Cambio de disponibilidad', 'Cambio de disponibilidad'],
    ['sin motivo', '', undefined],
  ])('confirms cancellation %s', async (_label, input, expectedReason) => {
    const onCancel = vi.fn().mockResolvedValue({ status: 'CANCELLED' });
    const user = userEvent.setup();
    render(<CancelRegistrationAction registration={registration} onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: /dar de baja/i }));
    if (input) await user.type(screen.getByLabelText(/motivo \(opcional\)/i), input);
    await user.click(screen.getByRole('button', { name: /confirmar baja/i }));

    expect(onCancel).toHaveBeenCalledWith(10, expectedReason);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps the modal open and permits retry after an error', async () => {
    const onCancel = vi.fn()
      .mockRejectedValueOnce({ message: 'No se pudo cancelar.' })
      .mockResolvedValueOnce({ status: 'CANCELLED' });
    const user = userEvent.setup();
    render(<CancelRegistrationAction registration={registration} onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: /dar de baja/i }));
    await user.click(screen.getByRole('button', { name: /confirmar baja/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cancelar.');

    await user.click(screen.getByRole('button', { name: /confirmar baja/i }));
    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
