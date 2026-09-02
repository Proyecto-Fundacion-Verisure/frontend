import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cancelActivity } from '../../api/activitiesApi';
import { getActivityRegistrations } from '../../api/registrationsApi';
import CancelActivityButton from './CancelActivityButton';

vi.mock('../../api/activitiesApi', () => ({
  cancelActivity: vi.fn(),
}));

vi.mock('../../api/registrationsApi', () => ({
  getActivityRegistrations: vi.fn(),
}));

const activity = { id: 12, title: 'Mentoría digital', status: 'PUBLISHED' };

beforeEach(() => {
  cancelActivity.mockReset();
  getActivityRegistrations.mockReset();
});

describe('CancelActivityButton', () => {
  it('shows the backend count, cancels on 204 and refreshes related data', async () => {
    getActivityRegistrations
      .mockResolvedValueOnce({
        data: {
          registrations: [
            { id: 1, status: 'CONFIRMED' },
            { id: 2, status: 'WAITLISTED' },
            { id: 3, status: 'CANCELLED' },
          ],
        },
      })
      .mockResolvedValueOnce({ data: { registrations: [] } });
    cancelActivity.mockResolvedValue({ status: 204 });
    const onCancelled = vi.fn();
    const user = userEvent.setup();
    render(<CancelActivityButton activity={activity} onCancelled={onCancelled} />);

    await user.click(screen.getByRole('button', { name: /^cancelar$/i }));

    expect(await screen.findByText(/afectará a 2 personas inscritas/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /confirmar cancelación/i }));

    await waitFor(() => expect(cancelActivity).toHaveBeenCalledWith(12));
    expect(onCancelled).toHaveBeenCalledWith(12);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(getActivityRegistrations).toHaveBeenCalledTimes(2));
  });

  it('keeps the modal open and explains an ACTIVITY_FINISHED conflict', async () => {
    getActivityRegistrations.mockResolvedValue({ data: { affectedCount: 1 } });
    cancelActivity.mockRejectedValue({
      status: 409,
      code: 'ACTIVITY_FINISHED',
      message: 'Conflicto.',
    });
    const onCancelled = vi.fn();
    const user = userEvent.setup();
    render(<CancelActivityButton activity={activity} onCancelled={onCancelled} />);

    await user.click(screen.getByRole('button', { name: /^cancelar$/i }));
    await screen.findByText(/afectará a 1 persona inscrita/i);
    await user.click(screen.getByRole('button', { name: /confirmar cancelación/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/ya ha finalizado/i);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(onCancelled).not.toHaveBeenCalled();
  });

  it('does not cancel or change data when confirmation is closed', async () => {
    getActivityRegistrations.mockResolvedValue({ data: { registrations: [] } });
    const onCancelled = vi.fn();
    const user = userEvent.setup();
    render(<CancelActivityButton activity={activity} onCancelled={onCancelled} />);

    await user.click(screen.getByRole('button', { name: /^cancelar$/i }));
    await screen.findByText(/afectará a 0 personas inscritas/i);
    await user.click(screen.getByRole('button', { name: /^volver$/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(cancelActivity).not.toHaveBeenCalled();
    expect(onCancelled).not.toHaveBeenCalled();
  });
});
