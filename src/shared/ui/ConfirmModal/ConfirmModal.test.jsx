import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ConfirmModal from './ConfirmModal';

function renderModal(props = {}) {
  const onClose = vi.fn();
  const onConfirm = vi.fn();
  render(
    <ConfirmModal
      isOpen
      title="Rechazar inscripción"
      description="No se puede deshacer."
      confirmLabel="Confirmar rechazo"
      loadingLabel="Rechazando…"
      onClose={onClose}
      onConfirm={onConfirm}
      {...props}
    />,
  );
  return { onClose, onConfirm };
}

describe('ConfirmModal', () => {
  it('renders nothing while closed', () => {
    renderModal({ isOpen: false });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows what will happen and confirms only on the confirm button', async () => {
    const user = userEvent.setup();
    const { onClose, onConfirm } = renderModal();

    expect(screen.getByRole('dialog', { name: 'Rechazar inscripción' })).toHaveTextContent(
      'No se puede deshacer.',
    );
    await user.click(screen.getByRole('button', { name: 'Confirmar rechazo' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes without confirming when going back', async () => {
    const user = userEvent.setup();
    const { onClose, onConfirm } = renderModal();

    await user.click(screen.getByRole('button', { name: 'Volver' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('blocks going back while the action is in progress', () => {
    renderModal({ isLoading: true });

    expect(screen.getByRole('button', { name: 'Volver' })).toBeDisabled();
    expect(screen.getByText('Rechazando…')).toBeInTheDocument();
  });
});
