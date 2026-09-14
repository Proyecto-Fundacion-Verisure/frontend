import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  acceptRegistration,
  cancelRegistration,
  getActivityRegistrations,
  getRegistrationCounts,
  rejectRegistration,
} from '../../api/registrationsApi';
import useRegistrations from './useRegistrations';

vi.mock('../../api/registrationsApi', () => ({
  acceptRegistration: vi.fn(),
  cancelRegistration: vi.fn(),
  getActivityRegistrations: vi.fn(),
  getRegistrationCounts: vi.fn(),
  rejectRegistration: vi.fn(),
}));

// El tablero es el Page de Spring: las filas van en `content` y los contadores
// llegan por su propia ruta. La versión anterior inventaba un `{ counters,
// registrations }` que es justo lo que el contrato descarta.
const page = (content) => ({
  content,
  number: 0,
  size: 10,
  totalElements: content.length,
  totalPages: content.length ? 1 : 0,
});

const INITIAL_BOARD = page([{ registrationId: 10, userName: 'Ana Torres', status: 'WAITLISTED', accepted: false }]);
const COUNTS = { confirmed: 0, waitlisted: 1, unreviewed: 1 };

beforeEach(() => {
  acceptRegistration.mockReset();
  cancelRegistration.mockReset();
  getActivityRegistrations.mockReset();
  getRegistrationCounts.mockReset();
  getRegistrationCounts.mockResolvedValue({ data: COUNTS });
  rejectRegistration.mockReset();
});

describe('useRegistrations', () => {
  it('loads the board and reloads it after accepting', async () => {
    const refreshedBoard = page([{ registrationId: 10, userName: 'Ana Torres', status: 'CONFIRMED', accepted: true }]);
    getActivityRegistrations
      .mockResolvedValueOnce({ data: INITIAL_BOARD })
      .mockResolvedValueOnce({ data: refreshedBoard });
    acceptRegistration.mockResolvedValue({
      data: { registrationId: 10, activityId: 8, status: 'CONFIRMED', accepted: true },
    });
    const { result } = renderHook(() => useRegistrations(8));

    await waitFor(() => expect(result.current.board).toEqual(INITIAL_BOARD));
    await act(async () => {
      await result.current.acceptRegistration(10);
    });

    expect(acceptRegistration).toHaveBeenCalledWith(10);
    expect(getActivityRegistrations).toHaveBeenCalledTimes(2);
    expect(result.current.board).toEqual(refreshedBoard);
    expect(result.current.decision.data).toMatchObject({ status: 'CONFIRMED', accepted: true });
  });

  it('rejects without a body and prevents a duplicate request', async () => {
    let resolveRejection;
    getActivityRegistrations
      .mockResolvedValueOnce({ data: INITIAL_BOARD })
      .mockResolvedValueOnce({ data: page([]) });
    rejectRegistration.mockReturnValue(new Promise((resolve) => {
      resolveRejection = resolve;
    }));
    const { result } = renderHook(() => useRegistrations(8));
    await waitFor(() => expect(result.current.loading).toBe(false));

    let firstRequest;
    await act(async () => {
      firstRequest = result.current.rejectRegistration(10);
      const duplicateResult = await result.current.rejectRegistration(10);
      expect(duplicateResult).toBeNull();
      resolveRejection({
        data: { registrationId: 10, activityId: 8, status: 'REJECTED', accepted: false },
      });
      await firstRequest;
    });

    expect(rejectRegistration).toHaveBeenCalledTimes(1);
    expect(rejectRegistration).toHaveBeenCalledWith(10);
  });

  it('propagates ApiError and preserves the last coherent board', async () => {
    const apiError = { status: 500, message: 'Error del servidor.' };
    getActivityRegistrations.mockResolvedValue({ data: INITIAL_BOARD });
    acceptRegistration.mockRejectedValue(apiError);
    const { result } = renderHook(() => useRegistrations(8));
    await waitFor(() => expect(result.current.board).toEqual(INITIAL_BOARD));

    await act(async () => {
      await expect(result.current.acceptRegistration(10)).rejects.toBe(apiError);
    });

    expect(result.current.board).toEqual(INITIAL_BOARD);
    expect(result.current.decision).toMatchObject({ status: 'error', error: apiError });
    expect(getActivityRegistrations).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['con motivo', 'Cambio de disponibilidad'],
    ['sin motivo', undefined],
  ])('cancels %s and reloads the board', async (_label, reason) => {
    const cancelled = { registrationId: 10, activityId: 8, status: 'CANCELLED', accepted: true };
    getActivityRegistrations
      .mockResolvedValueOnce({ data: INITIAL_BOARD })
      .mockResolvedValueOnce({ data: page([cancelled]) });
    cancelRegistration.mockResolvedValue({ data: cancelled });
    const { result } = renderHook(() => useRegistrations(8));
    await waitFor(() => expect(result.current.board).toEqual(INITIAL_BOARD));

    await act(async () => {
      await result.current.cancelRegistration(10, reason);
    });

    expect(cancelRegistration).toHaveBeenCalledWith(10, reason);
    expect(getActivityRegistrations).toHaveBeenCalledTimes(2);
    expect(result.current.board.content[0].status).toBe('CANCELLED');
  });
});
