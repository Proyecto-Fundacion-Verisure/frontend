import { describe, it, expect } from 'vitest';
import { ApiError } from '../api/apiError';
import { createApiError, httpErrors, domainErrors, ok, created, noContent } from './fixtures/apiErrors';
import { MOCK_USERS_V2, makeAuthResponse } from './fixtures/auth';
import { MOCK_ACTIVITIES_V2, ActivityStatus, isPublicVisible } from './fixtures/activities';
import { RegistrationStatus, makeMyRegistrationItem } from './fixtures/registrations';
import { makeReportSummary, makeReportDetailResponse, makePage, makeCreateReportRequest, ReportStatus } from './fixtures/reports';
import { ProposalStatus } from './fixtures/proposals';
import { mockUploadCover, mockUploadEvidence } from './mocks/auth.mock';
import * as registrationsMock from './mocks/registrations.mock';
import * as reportsMock from './mocks/reports.mock';
import * as authMock from './mocks/auth.mock';
import { makeImageFile, makeEvidenceFile, MAX_IMAGE_BYTES, MAX_EVIDENCE_BYTES } from './fixtures/uploads';

describe('fixtures y enums coinciden con v2', () => {
  it('RegistrationStatus y accepted separados', () => {
    const item = makeMyRegistrationItem({ status: RegistrationStatus.WAITLISTED, accepted: false, queuePosition: 2 });
    expect(item.status).toBe('WAITLISTED');
    expect(item.accepted).toBe(false);
    expect(item.queuePosition).toBe(2);
  });

  it('MyRegistrationItem incluye campos de revisión', () => {
    const item = makeMyRegistrationItem({ registrationId: 42, reportId: 501, reportStatus: 'RETURNED', queuePosition: 1 });
    expect(item.registrationId).toBe(42);
    expect(item.activity).toHaveProperty('id');
    expect(item.reportId).toBe(501);
    expect(item.reportStatus).toBe('RETURNED');
  });

  it('CreateReportRequest incluye registrationId, actualHours, rating, comment?, evidenceConsent + archivo separado', () => {
    const req = makeCreateReportRequest({ registrationId: 10, actualHours: 6, rating: 5, evidenceConsent: true });
    expect(req).toMatchObject({ registrationId: 10, actualHours: 6, rating: 5, evidenceConsent: true });
    const file = makeEvidenceFile('evidencia.pdf', 1024, 'application/pdf');
    expect(file.name).toBe('evidencia.pdf');
  });

  it('ReportSummary y ReportDetailResponse son distintos', () => {
    const summary = makeReportSummary({ id: 501 });
    const detail = makeReportDetailResponse({ reportId: 501 });
    expect(summary).toHaveProperty('id');
    expect(summary).not.toHaveProperty('validatedHours');
    expect(detail).toHaveProperty('reportId');
    expect(detail).toHaveProperty('expectedHours');
    expect(detail).toHaveProperty('validatedHours');
  });

  it('GET /reports/pending es Page<ReportSummary>', () => {
    const page = makePage([makeReportSummary()], { totalElements: 1, page: 0, size: 10 });
    expect(page).toHaveProperty('content');
    expect(page).toHaveProperty('totalElements');
    expect(page).toHaveProperty('totalPages');
  });

  it('ProposalStatus NEW/ACCEPTED/REJECTED', () => {
    expect(ProposalStatus.NEW).toBe('NEW');
    expect(ProposalStatus.ACCEPTED).toBe('ACCEPTED');
    expect(ProposalStatus.REJECTED).toBe('REJECTED');
  });

  it('detalle público solo PUBLISHED/FULL/IN_PROGRESS/FINISHED, admin cualquier estado', () => {
    expect(isPublicVisible(ActivityStatus.PUBLISHED)).toBe(true);
    expect(isPublicVisible(ActivityStatus.FULL)).toBe(true);
    expect(isPublicVisible(ActivityStatus.IN_PROGRESS)).toBe(true);
    expect(isPublicVisible(ActivityStatus.FINISHED)).toBe(true);
    expect(isPublicVisible(ActivityStatus.DRAFT)).toBe(false);
    expect(isPublicVisible(ActivityStatus.CANCELLED)).toBe(false);
    expect(MOCK_ACTIVITIES_V2.find((a) => a.status === 'DRAFT')).toBeTruthy();
  });

  it('no existe ACTIVITY_FULL', () => {
    expect(ActivityStatus).not.toHaveProperty('ACTIVITY_FULL');
  });

  it('AuthResponse/UserResponse shape', () => {
    const auth = makeAuthResponse(MOCK_USERS_V2.empleado);
    expect(auth).toMatchObject({ accessToken: expect.any(String), tokenType: 'Bearer', expiresIn: 7200, user: expect.objectContaining({ role: 'EMPLOYEE' }) });
  });

  it('ApiError formato común', () => {
    const err = createApiError({ status: 409, code: 'ALREADY_REGISTERED', message: 'Ya estás inscrito' });
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 409, code: 'ALREADY_REGISTERED', isNetworkError: false, isCanceled: false });
  });
});

describe('mocks distinguen 200/201/204 y errores', () => {
  it('helpers ok/created/noContent', () => {
    expect(ok({ a: 1 }, { status: 200 }).status).toBe(200);
    expect(created({ id: 1 }).status).toBe(201);
    expect(noContent().status).toBe(204);
  });

  it('mocks cubren 400/401/403/404/409/413/415/429/500', async () => {
    expect(httpErrors.validation({ email: 'bad' }).status).toBe(400);
    expect(httpErrors.unauthorized().status).toBe(401);
    expect(httpErrors.forbidden().status).toBe(403);
    expect(httpErrors.notFound().status).toBe(404);
    expect(httpErrors.conflict('X').status).toBe(409);
    expect(httpErrors.payloadTooLarge().status).toBe(413);
    expect(httpErrors.unsupportedMedia().status).toBe(415);
    expect(httpErrors.rateLimited().status).toBe(429);
    expect(httpErrors.serverError().status).toBe(500);
    expect(domainErrors.alreadyRegistered().code).toBe('ALREADY_REGISTERED');
    expect(domainErrors.proposalAlreadyDecided().code).toBe('PROPOSAL_ALREADY_DECIDED');
  });

  it('ningún mock usa Enrollment o /api/enrollments', async () => {
    const hayEnrollment = [
      MOCK_USERS_V2,
      MOCK_ACTIVITIES_V2,
      Object.values(RegistrationStatus),
      Object.values(ReportStatus),
    ].join(' ').toLowerCase().includes('enrollment');
    expect(hayEnrollment).toBe(false);
  });
});

describe('reenvío REPORT conserva mismo ID (RETURNED → 200, otro estado → 409)', () => {
  it('201 al crear, 200 al reenviar RETURNED, 409 si SUBMITTED', async () => {
    reportsMock.resetReportsMock();
    const first = await reportsMock.mockSubmitReport({ registrationId: 100, actualHours: 6, rating: 5, evidenceConsent: true });
    expect(first.status).toBe(201);
    const reportId = first.data.reportId;

    // Simulate RETURNED then resubmit
    const stored = reportsMock._stores.byReportId.get(reportId);
    stored.status = ReportStatus.RETURNED;
    const second = await reportsMock.mockSubmitReport({ registrationId: 100, actualHours: 7, rating: 4, evidenceConsent: true });
    expect(second.status).toBe(200);
    expect(second.data.reportId).toBe(reportId);

    // SUBMITTED again → 409
    await expect(reportsMock.mockSubmitReport({ registrationId: 100, actualHours: 7, rating: 4, evidenceConsent: true })).rejects.toMatchObject({ code: 'REPORT_ALREADY_SUBMITTED', status: 409 });
  });
});

describe('CancelRequest y validatedHours', () => {
  it('PATCH /registrations/{id}/cancel acepta {reason?} y sin motivo', async () => {
    registrationsMock.resetRegistrationsMock([{ registrationId: 10, activityId: 1, status: RegistrationStatus.CONFIRMED, accepted: true }]);
    const withReason = await registrationsMock.mockCancelRegistration(10, { reason: 'Motivo' });
    expect(withReason.data.status).toBe(RegistrationStatus.CANCELLED);
    registrationsMock.resetRegistrationsMock([{ registrationId: 11, activityId: 1, status: RegistrationStatus.CONFIRMED, accepted: true }]);
    const withoutReason = await registrationsMock.mockCancelRegistration(11, {});
    expect(withoutReason.data.status).toBe(RegistrationStatus.CANCELLED);
  });

  it('PATCH /reports/{id}/validate usa validatedHours camelCase', async () => {
    reportsMock.resetReportsMock();
    const created = await reportsMock.mockSubmitReport({ registrationId: 200, actualHours: 5, rating: 5, evidenceConsent: true });
    const validated = await reportsMock.mockValidateReport(created.data.reportId, { validatedHours: 6 });
    expect(validated.data.validatedHours).toBe(6);
  });

  it('rechazo sin motivo (PATCH /registrations/{id}/reject)', async () => {
    registrationsMock.resetRegistrationsMock([{ registrationId: 12, activityId: 2, status: RegistrationStatus.WAITLISTED, accepted: false }]);
    const res = await registrationsMock.mockRejectRegistration(12);
    expect(res.data.status).toBe(RegistrationStatus.REJECTED);
  });
});

describe('subida portada image 5MB y evidencia request/evidence 10MB con 413/415', () => {
  it('image 5MB ok, >5MB 413, tipo inválido 415', async () => {
    const okFile = makeImageFile('cover.jpg', 1024, 'image/jpeg');
    expect((await mockUploadCover(okFile)).status).toBe(201);
    const big = makeImageFile('big.jpg', MAX_IMAGE_BYTES + 1, 'image/jpeg');
    await expect(mockUploadCover(big)).rejects.toMatchObject({ status: 413 });
    const badType = makeImageFile('bad.txt', 1024, 'text/plain');
    await expect(mockUploadCover(badType)).rejects.toMatchObject({ status: 415 });
  });

  it('evidencia 10MB con partes request/evidence, 413/415', async () => {
    const ev = makeEvidenceFile('ev.pdf', 1024, 'application/pdf');
    expect((await mockUploadEvidence({ request: { evidenceConsent: true }, evidence: ev })).status).toBe(201);
    const bigEv = makeEvidenceFile('big.pdf', MAX_EVIDENCE_BYTES + 1, 'application/pdf');
    await expect(mockUploadEvidence({ request: { evidenceConsent: true }, evidence: bigEv })).rejects.toMatchObject({ status: 413 });
    const badEv = makeEvidenceFile('bad.txt', 1024, 'text/plain');
    await expect(mockUploadEvidence({ request: { evidenceConsent: true }, evidence: badEv })).rejects.toMatchObject({ status: 415 });
  });
});

describe('GET /reports/{id} variantes 200/403/404 y pending Page', () => {
  it('200, 403 NOT_OWNER, 404', async () => {
    reportsMock.resetReportsMock();
    const created = await reportsMock.mockSubmitReport({ registrationId: 300, actualHours: 4, rating: 5, evidenceConsent: true });
    expect((await reportsMock.mockGetReport(created.data.reportId)).status).toBe(200);
    await expect(reportsMock.mockGetReport(9999)).rejects.toMatchObject({ status: 404 });
    await expect(reportsMock.mockGetReport(created.data.reportId, { forbidden: true })).rejects.toMatchObject({ status: 403, code: 'NOT_OWNER' });
  });

  it('pending es Page<ReportSummary>', async () => {
    reportsMock.resetReportsMock();
    await reportsMock.mockSubmitReport({ registrationId: 400, actualHours: 4, rating: 5, evidenceConsent: true });
    await reportsMock.mockSubmitReport({ registrationId: 401, actualHours: 5, rating: 4, evidenceConsent: true });
    const page = await reportsMock.mockGetPendingReports({ page: 0, size: 10 });
    expect(page.data.content[0]).toHaveProperty('id');
    expect(page.data).toHaveProperty('totalElements');
  });
});

describe('PROPOSAL_ALREADY_DECIDED y ALREADY_REGISTERED', () => {
  it('PROPOSAL_ALREADY_DECIDED 409 cuando no NEW', async () => {
    const { mockAcceptProposal } = await import('./mocks/proposals.mock');
    // id 3 is ACCEPTED in fixtures
    await expect(mockAcceptProposal(3)).rejects.toMatchObject({ code: 'PROPOSAL_ALREADY_DECIDED', status: 409 });
  });

  it('ALREADY_REGISTERED 409 en createRegistration duplicado', async () => {
    registrationsMock.resetRegistrationsMock([{ registrationId: 1, activityId: 99, status: RegistrationStatus.CONFIRMED, accepted: true }]);
    await expect(registrationsMock.mockCreateRegistration({ activityId: 99 })).rejects.toMatchObject({ code: 'ALREADY_REGISTERED' });
  });
});
