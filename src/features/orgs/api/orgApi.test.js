import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  approveOrganization,
  createOrgActivity,
  createOrgProposal,
  createOrganization,
  getOrgActivities,
  getOrgDashboard,
  getOrgProposals,
  getPendingOrganizations,
  rejectOrganization,
  resendOrganizationRegistrationEmail,
  submitOrgActivity,
  updateOrgActivity,
} from './orgApi';

const { client } = vi.hoisted(() => ({
  client: {
    delete: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('../../../shared/api/axiosClient', () => ({ default: client }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('VITE_USE_MOCKS', 'false');
});

describe('partner API contracts', () => {
  it('uses /org for partner resources and /admin/org-accounts for approval', () => {
    const account = { name: 'Entidad', cif: 'G12345678', email: 'partner@example.org' };
    const activity = { title: 'Actividad' };
    const proposal = { title: 'Propuesta' };

    createOrganization(account);
    resendOrganizationRegistrationEmail(account.email);
    getPendingOrganizations({ status: 'PENDING', page: 0 });
    approveOrganization(7);
    rejectOrganization(8);
    getOrgActivities({ status: 'DRAFT', page: 0, size: 10, sort: 'ignored' });
    createOrgActivity(activity);
    updateOrgActivity(4, activity);
    submitOrgActivity(4);
    getOrgProposals({ page: 0, status: 'ignored' });
    createOrgProposal(proposal);
    getOrgDashboard(2026);

    expect(client.post).toHaveBeenNthCalledWith(1, '/auth/register', account);
    expect(client.post).toHaveBeenNthCalledWith(2, '/auth/resend-verification', {
      email: account.email,
    });
    expect(client.get).toHaveBeenNthCalledWith(1, '/admin/org-accounts', {
      params: { status: 'PENDING', page: 0 },
    });
    expect(client.patch).toHaveBeenNthCalledWith(1, '/admin/org-accounts/7/approve');
    expect(client.patch).toHaveBeenNthCalledWith(2, '/admin/org-accounts/8/reject');
    expect(client.get).toHaveBeenNthCalledWith(2, '/org/activities', {
      params: { status: 'DRAFT', page: 0, size: 10 },
    });
    expect(client.post).toHaveBeenNthCalledWith(3, '/org/activities', activity);
    expect(client.put).toHaveBeenCalledWith('/org/activities/4', activity);
    expect(client.patch).toHaveBeenNthCalledWith(3, '/org/activities/4/submit');
    expect(client.get).toHaveBeenNthCalledWith(3, '/org/proposals', { params: { page: 0 } });
    expect(client.post).toHaveBeenNthCalledWith(4, '/org/proposals', proposal);
    expect(client.get).toHaveBeenNthCalledWith(4, '/org/dashboard', { params: { year: 2026 } });
  });
});
