import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  finalizeActivityClosure,
  getActivityClosure,
  getCertificate,
  getClosure,
  getPendingActivityClosures,
  saveActivityClosure,
  submitClosure,
} from './closuresApi';

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

describe('closure API contract', () => {
  it('submits the employee closure as multipart and reads it by closureId', () => {
    const request = {
      registrationId: 8,
      actualHours: 6,
      rating: 5,
      evidenceConsent: true,
    };
    const evidence = new File(['proof'], 'proof.pdf', { type: 'application/pdf' });

    submitClosure(request, evidence);
    getClosure(31);
    getCertificate(31);

    const body = client.post.mock.calls[0][1];
    expect(client.post.mock.calls[0][0]).toBe('/closures');
    expect(body).toBeInstanceOf(FormData);
    expect(body.get('request')).toBeInstanceOf(Blob);
    expect(body.get('request').type).toBe('application/json');
    expect(body.get('evidence')).toBe(evidence);
    expect(client.get).toHaveBeenNthCalledWith(1, '/closures/31');
    expect(client.get).toHaveBeenNthCalledWith(2, '/closures/31/certificate');
  });

  it('uses activity-level administration routes without legacy report decisions', () => {
    const draft = { collaborationRating: 4, closingNotes: 'Buen resultado.' };

    getPendingActivityClosures({ page: 0, status: 'ignored' });
    getActivityClosure(41);
    saveActivityClosure(41, draft);
    finalizeActivityClosure(41);

    expect(client.get).toHaveBeenNthCalledWith(1, '/admin/activities/pending-closure', {
      params: { page: 0 },
    });
    expect(client.get).toHaveBeenNthCalledWith(2, '/admin/activities/41/closure');
    expect(client.put).toHaveBeenCalledWith('/admin/activities/41/closure', draft);
    expect(client.patch).toHaveBeenCalledWith('/admin/activities/41/closure/finalize');
  });
});
