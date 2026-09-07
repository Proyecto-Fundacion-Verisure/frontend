import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cancelActivity,
  getActivityDetail,
  getAdminActivity,
  getPublishedActivities,
} from './activitiesApi';
import {
  acceptRegistration,
  cancelRegistration,
  createRegistration,
  getActivityRegistrations,
  getMyRegistrations,
  rejectRegistration,
} from './registrationsApi';
import {
  getPendingReports,
  getReport,
  returnReport,
  submitReport,
  validateReport,
} from './reportsApi';
import { acceptProposal, rejectProposal } from './proposalsApi';
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

beforeEach(() => vi.clearAllMocks());

describe('activity API contract', () => {
  it('separates public and administrative detail endpoints', () => {
    getActivityDetail(12);
    getAdminActivity(12);
    getPublishedActivities({ page: 2 });
    cancelActivity(12);

    expect(client.get).toHaveBeenNthCalledWith(1, '/activities/12');
    expect(client.get).toHaveBeenNthCalledWith(2, '/admin/activities/12');
    expect(client.get).toHaveBeenNthCalledWith(3, '/activities/published', {
      params: { page: 2 },
    });
    expect(client.patch).toHaveBeenCalledWith('/activities/12/cancel');
    expect(client.delete).not.toHaveBeenCalledWith('/activities/12');
  });
});

describe('registration API contract', () => {
  it('uses Registration routes and the shared cancellation endpoint', () => {
    createRegistration(21);
    getMyRegistrations();
    getActivityRegistrations(21);
    acceptRegistration(4);
    rejectRegistration(5);
    cancelRegistration(6, 'Cambio de disponibilidad');

    expect(client.post).toHaveBeenCalledWith('/registrations', { activityId: 21 });
    expect(client.get).toHaveBeenNthCalledWith(1, '/registrations/me');
    expect(client.get).toHaveBeenNthCalledWith(2, '/activities/21/registrations');
    expect(client.patch).toHaveBeenNthCalledWith(1, '/registrations/4/accept');
    expect(client.patch).toHaveBeenNthCalledWith(2, '/registrations/5/reject');
    expect(client.patch).toHaveBeenNthCalledWith(
      3,
      '/registrations/6/cancel',
      { reason: 'Cambio de disponibilidad' },
    );
  });
});

describe('report API contract', () => {
  it('uses reportId for reads and the same POST for creation and resubmission', () => {
    const newReport = { registrationId: 8, actualHours: 6, rating: 5 };
    const returnedReport = { registrationId: 8, actualHours: 7, rating: 5 };

    submitReport(newReport);
    submitReport(returnedReport);
    getPendingReports({ page: 0 });
    getReport(31);
    validateReport(31, { validatedHours: 7 });
    returnReport(31, { note: 'Adjunta una evidencia legible.' });

    expect(client.post).toHaveBeenNthCalledWith(1, '/reports', newReport);
    expect(client.post).toHaveBeenNthCalledWith(2, '/reports', returnedReport);
    expect(client.get).toHaveBeenNthCalledWith(1, '/reports/pending', {
      params: { page: 0 },
    });
    expect(client.get).toHaveBeenNthCalledWith(2, '/reports/31');
    expect(client.patch).toHaveBeenNthCalledWith(
      1,
      '/reports/31/validate',
      { validatedHours: 7 },
    );
    expect(client.patch).toHaveBeenNthCalledWith(
      2,
      '/reports/31/return',
      { note: 'Adjunta una evidencia legible.' },
    );
  });
});

describe('proposal and dashboard API contracts', () => {
  it('uses explicit proposal decision endpoints', () => {
    acceptProposal(9);
    rejectProposal(10);

    expect(client.post).toHaveBeenCalledWith('/proposals/9/accept');
    expect(client.patch).toHaveBeenCalledWith('/proposals/10/reject');
  });

  it('shares dashboard filters with both CSV exports and the PDF', () => {
    const filters = { year: 2026, line: 'SOCIAL' };

    getDashboard(filters);
    exportParticipationsCsv(filters);
    exportPartnersCsv(filters);
    exportDashboardPdf(filters);

    expect(client.get).toHaveBeenNthCalledWith(1, '/dashboard', { params: filters });
    expect(client.get).toHaveBeenNthCalledWith(
      2,
      '/dashboard/export/participations.csv',
      { params: filters, responseType: 'blob' },
    );
    expect(client.get).toHaveBeenNthCalledWith(
      3,
      '/dashboard/export/partners.csv',
      { params: filters, responseType: 'blob' },
    );
    expect(client.get).toHaveBeenNthCalledWith(
      4,
      '/dashboard/export/report.pdf',
      { params: filters, responseType: 'blob' },
    );
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
