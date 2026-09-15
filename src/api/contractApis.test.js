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
import {
  getCurrentUser,
  logout,
  registerPartner,
  resendVerification,
  verifyEmail,
} from './authApi';
import {
  acceptRegistration,
  cancelRegistration,
  createRegistration,
  getActivityRegistrations,
  getMyRegistrations,
  getRegistrationCounts,
  rejectRegistration,
} from './registrationsApi';
import {
  finalizeActivityClosure,
  getActivityClosure,
  getCertificate,
  getClosure,
  getPendingActivityClosures,
  saveActivityClosure,
  submitClosure,
} from './closuresApi';
import { favoriteActivity, unfavoriteActivity } from './favoritesApi';
import {
  acceptProposal,
  createProposal,
  getProposal,
  getProposals,
  rejectProposal,
} from './proposalsApi';
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
import {
  exportDashboardPdf,
  exportPartnersCsv,
  exportParticipationsCsv,
  getDashboard,
  sanitizeDashboardParams,
} from './dashboardApi';

const { client } = vi.hoisted(() => ({
  client: {
    delete: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('./axiosClient', () => ({ default: client }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('VITE_USE_MOCKS', 'false');
});

describe('authentication API contract', () => {
  it('uses the public registration and verification endpoints', () => {
    const registration = { email: 'partner@example.org' };

    registerPartner(registration);
    verifyEmail('verification-token');
    resendVerification('partner@example.org');
    getCurrentUser();
    logout('access-token');

    expect(client.post).toHaveBeenNthCalledWith(1, '/auth/register', registration);
    expect(client.get).toHaveBeenNthCalledWith(1, '/auth/verify', {
      params: { token: 'verification-token' },
    });
    expect(client.post).toHaveBeenNthCalledWith(2, '/auth/resend-verification', {
      email: 'partner@example.org',
    });
    expect(client.get).toHaveBeenNthCalledWith(2, '/auth/me');
    expect(client.post).toHaveBeenNthCalledWith(3, '/auth/logout', undefined, {
      headers: { Authorization: 'Bearer access-token' },
    });
  });
});

describe('activity API contract', () => {
  it('separates catalog and administration routes and filters unsupported params', () => {
    getActivityDetail(12);
    getAdminActivity(12);
    getPublishedActivities({ line: 'educar', page: 2, size: 12, q: 'ignored' });
    getAdminActivities({ status: 'DRAFT', page: 0, size: 50 });
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
      params: { status: 'DRAFT', page: 0 },
    });
    expect(client.post).toHaveBeenCalledWith('/admin/activities', { title: 'Nueva' });
    expect(client.put).toHaveBeenCalledWith('/admin/activities/12', { title: 'Editada' });
    expect(client.patch).toHaveBeenNthCalledWith(1, '/admin/activities/12/publish');
    expect(client.patch).toHaveBeenNthCalledWith(2, '/admin/activities/12/cancel');
  });

  // La subida de portada se fue con `B2-03`: no hay `POST /admin/activity-images`,
  // la imagen es la de la línea de acción y la resuelve el frontend.
  it('uses the partner-approval routes', () => {
    getPendingActivities({ page: 0, status: 'ignored' });
    approveActivity(31);
    returnActivity(32, 'Completa la descripción.');

    expect(client.get).toHaveBeenCalledWith('/admin/activities/pending', { params: { page: 0 } });
    expect(client.patch).toHaveBeenNthCalledWith(1, '/admin/activities/31/approve');
    expect(client.patch).toHaveBeenNthCalledWith(2, '/admin/activities/32/return', {
      note: 'Completa la descripción.',
    });
  });
});

describe('registration and favorite API contracts', () => {
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

  it('uses the dedicated favorite routes', () => {
    favoriteActivity(8);
    unfavoriteActivity(8);

    expect(client.post).toHaveBeenCalledWith('/favorites', { activityId: 8 });
    expect(client.delete).toHaveBeenCalledWith('/favorites/8');
  });
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

describe('proposal and partner API contracts', () => {
  it('uses public creation and administrative proposal routes', () => {
    const proposal = { organizationName: 'Entidad' };

    createProposal(proposal);
    getProposals({ status: 'NEW', page: 0, size: 50 });
    getProposal(9);
    acceptProposal(9);
    rejectProposal(10);

    expect(client.post).toHaveBeenNthCalledWith(1, '/proposals', proposal);
    expect(client.get).toHaveBeenNthCalledWith(1, '/admin/proposals', {
      params: { status: 'NEW', page: 0 },
    });
    expect(client.get).toHaveBeenNthCalledWith(2, '/admin/proposals/9');
    expect(client.post).toHaveBeenNthCalledWith(2, '/admin/proposals/9/accept');
    expect(client.patch).toHaveBeenCalledWith('/admin/proposals/10/reject');
  });

  it('uses /org for partner resources and /admin/org-accounts for approval', () => {
    const account = { name: 'Entidad', cif: 'G12345678', email: 'partner@example.org' };
    const activity = { title: 'Actividad' };
    const proposal = { title: 'Propuesta' };

    createOrganization(account);
    resendOrganizationRegistrationEmail(account.email);
    getPendingOrganizations({ status: 'PENDING', page: 0 });
    approveOrganization(7);
    rejectOrganization(8);
    getOrgActivities({ status: 'DRAFT', page: 0, size: 50 });
    createOrgActivity(activity);
    updateOrgActivity(4, activity);
    submitOrgActivity(4);
    getOrgProposals({ page: 0, status: 'ignored' });
    createOrgProposal(proposal);
    getOrgDashboard(2026);

    expect(client.post).toHaveBeenNthCalledWith(1, '/auth/register', account);
    expect(client.post).toHaveBeenNthCalledWith(2, '/auth/resend-verification', { email: account.email });
    expect(client.get).toHaveBeenNthCalledWith(1, '/admin/org-accounts', {
      params: { status: 'PENDING', page: 0 },
    });
    expect(client.patch).toHaveBeenNthCalledWith(1, '/admin/org-accounts/7/approve');
    expect(client.patch).toHaveBeenNthCalledWith(2, '/admin/org-accounts/8/reject');
    expect(client.get).toHaveBeenNthCalledWith(2, '/org/activities', {
      params: { status: 'DRAFT', page: 0 },
    });
    expect(client.post).toHaveBeenNthCalledWith(3, '/org/activities', activity);
    expect(client.put).toHaveBeenCalledWith('/org/activities/4', activity);
    expect(client.patch).toHaveBeenNthCalledWith(3, '/org/activities/4/submit');
    expect(client.get).toHaveBeenNthCalledWith(3, '/org/proposals', { params: { page: 0 } });
    expect(client.post).toHaveBeenNthCalledWith(4, '/org/proposals', proposal);
    expect(client.get).toHaveBeenNthCalledWith(4, '/org/dashboard', { params: { year: 2026 } });
  });
});

describe('dashboard API contract', () => {
  it('uses the contract export paths and filters each export independently', () => {
    const filters = { year: 2026, line: 'SOCIAL' };

    getDashboard(filters);
    exportParticipationsCsv(filters);
    exportPartnersCsv(filters);
    exportDashboardPdf(filters);

    expect(client.get).toHaveBeenNthCalledWith(1, '/dashboard', { params: filters });
    expect(client.get).toHaveBeenNthCalledWith(2, '/dashboard/participations.csv', {
      params: filters,
      responseType: 'blob',
    });
    expect(client.get).toHaveBeenNthCalledWith(3, '/dashboard/partners.csv', {
      params: { year: 2026 },
      responseType: 'blob',
    });
    expect(client.get).toHaveBeenNthCalledWith(4, '/dashboard/report.pdf', {
      params: { year: 2026 },
      responseType: 'blob',
    });
  });

  it('never sends filters outside the dashboard contract', () => {
    expect(sanitizeDashboardParams({
      year: 2026,
      line: 'desoledad',
      department: 'Tecnología',
      page: 3,
    })).toEqual({ year: 2026, line: 'desoledad' });
  });
});
