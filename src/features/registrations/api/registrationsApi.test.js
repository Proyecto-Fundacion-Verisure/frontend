import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  acceptRegistration,
  cancelRegistration,
  createRegistration,
  getActivityRegistrations,
  getMyRegistrations,
  getRegistrationCounts,
  rejectRegistration,
} from './registrationsApi';

const { client } = vi.hoisted(() => ({
  client: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('../../../shared/api/axiosClient', () => ({ default: client }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('registration API contracts', () => {
  it('uses the employee and administrative registration routes', () => {
    createRegistration(21);
    getMyRegistrations();
    getActivityRegistrations(21, { status: 'WAITLISTED', page: 0 });
    getRegistrationCounts(21);
    acceptRegistration(4);
    rejectRegistration(5);
    cancelRegistration(6, 'Cambio de disponibilidad');

    expect(client.post).toHaveBeenCalledWith('/registrations', { activityId: 21 });
    expect(client.get).toHaveBeenNthCalledWith(1, '/registrations/me');
    expect(client.get).toHaveBeenNthCalledWith(2, '/admin/registrations', {
      params: { activityId: 21, status: 'WAITLISTED', page: 0 },
    });
    // Los contadores van en su propia ruta y activityId es obligatorio.
    expect(client.get).toHaveBeenNthCalledWith(3, '/admin/registrations/counts', {
      params: { activityId: 21 },
    });
    expect(client.patch).toHaveBeenNthCalledWith(1, '/registrations/4/accept');
    expect(client.patch).toHaveBeenNthCalledWith(2, '/registrations/5/reject');
    expect(client.patch).toHaveBeenNthCalledWith(3, '/registrations/6/cancel', {
      reason: 'Cambio de disponibilidad',
    });
  });
});
