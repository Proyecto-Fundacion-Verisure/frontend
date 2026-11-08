import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  approveActivity,
  cancelActivity,
  createActivity,
  getActivityDetail,
  getAdminActivities,
  getAdminActivity,
  getPendingActivities,
  getPublishedActivities,
  publishActivity,
  returnActivity,
  updateActivity,
} from './activitiesApi';

const { client } = vi.hoisted(() => ({
  client: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('../../../shared/api/axiosClient', () => ({ default: client }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('activity API contract', () => {
  it('separates catalog and administration routes and filters unsupported params', () => {
    getActivityDetail(12);
    getAdminActivity(12);
    getPublishedActivities({ line: 'educar', page: 2, size: 12, q: 'ignored' });
    getAdminActivities({ status: 'DRAFT', page: 0, size: 10, sort: 'ignored' });
    createActivity({ title: 'Nueva' });
    updateActivity(12, { title: 'Editada' });
    publishActivity(12);
    cancelActivity(12);

    expect(client.get).toHaveBeenNthCalledWith(1, '/activities/12');
    expect(client.get).toHaveBeenNthCalledWith(2, '/admin/activities/12');
    expect(client.get).toHaveBeenNthCalledWith(3, '/activities', {
      params: { line: 'educar', page: 2, size: 12 },
    });
    expect(client.get).toHaveBeenNthCalledWith(4, '/admin/activities', {
      params: { status: 'DRAFT', page: 0, size: 10 },
    });
    expect(client.post).toHaveBeenCalledWith('/admin/activities', { title: 'Nueva' });
    expect(client.put).toHaveBeenCalledWith('/admin/activities/12', { title: 'Editada' });
    expect(client.patch).toHaveBeenNthCalledWith(1, '/admin/activities/12/publish');
    expect(client.patch).toHaveBeenNthCalledWith(2, '/admin/activities/12/cancel');
  });

  // La subida de portada se fue con `B2-03`: no hay `POST /admin/activity-images`,
  // la imagen es la de la línea de acción y la resuelve el frontend.
  it('uses the partner-approval routes', () => {
    getPendingActivities({ page: 0, size: 10, status: 'ignored' });
    approveActivity(31);
    returnActivity(32, 'Completa la descripción.');

    expect(client.get).toHaveBeenCalledWith('/admin/activities/pending', {
      params: { page: 0, size: 10 },
    });
    expect(client.patch).toHaveBeenNthCalledWith(1, '/admin/activities/31/approve');
    expect(client.patch).toHaveBeenNthCalledWith(2, '/admin/activities/32/return', {
      note: 'Completa la descripción.',
    });
  });
});
