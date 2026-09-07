import { describe, expect, it } from 'vitest';
import { ApiError } from '../api/apiError';
import {
  createApiError,
  created,
  domainErrors,
  httpErrors,
  noContent,
  ok,
} from './fixtures/apiErrors';
import { MOCK_USERS_V2, Role, makeAuthResponse } from './fixtures/auth';
import { ActivityStatus, MOCK_ACTIVITIES_V2, isPublicVisible } from './fixtures/activities';
import { RegistrationStatus, makeMyRegistrationItem } from './fixtures/registrations';
import {
  ActivityClosureStatus,
  makeActivityClosure,
  makeClosureDetail,
  makeCreateClosureRequest,
  makePage,
} from './fixtures/closures';
import { ProposalStatus } from './fixtures/proposals';
import { mockUploadCover, mockUploadEvidence } from './mocks/auth.mock';
import * as registrationsMock from './mocks/registrations.mock';
import {
  MAX_EVIDENCE_BYTES,
  MAX_IMAGE_BYTES,
  makeEvidenceFile,
  makeImageFile,
} from './fixtures/uploads';

describe('fixtures follow the current API enums and DTOs', () => {
  it('contains only the three contract roles', () => {
    expect(Object.values(Role)).toEqual(['ADMIN', 'EMPLOYEE', 'PARTNER']);
  });

  it('keeps RegistrationStatus and accepted as separate fields', () => {
    expect(Object.values(RegistrationStatus)).toEqual([
      'WAITLISTED',
      'CONFIRMED',
      'REJECTED',
      'CANCELLED',
      'PENDING_CLOSURE',
      'CLOSED',
    ]);
    const item = makeMyRegistrationItem({
      registrationId: 42,
      status: RegistrationStatus.WAITLISTED,
      accepted: false,
      queuePosition: 2,
      closureId: null,
      activityClosed: false,
    });
    expect(item).toMatchObject({
      registrationId: 42,
      status: 'WAITLISTED',
      accepted: false,
      queuePosition: 2,
      closureId: null,
      activityClosed: false,
    });
  });

  it('represents employee and activity closures as different DTOs', () => {
    const request = makeCreateClosureRequest({ registrationId: 10, actualHours: 6, rating: 5 });
    const detail = makeClosureDetail({ closureId: 501 });
    const activityClosure = makeActivityClosure({ activityId: 4 });

    expect(request).toMatchObject({
      registrationId: 10,
      actualHours: 6,
      rating: 5,
      evidenceConsent: true,
    });
    expect(detail).toHaveProperty('closureId', 501);
    expect(activityClosure).toMatchObject({
      activityId: 4,
      status: ActivityClosureStatus.DRAFT,
      expectedHours: expect.any(Number),
      reportedHours: expect.any(Number),
    });
  });

  it('uses the standard zero-based Spring Page shape', () => {
    const page = makePage([makeActivityClosure()], { totalElements: 21, page: 1, size: 10 });
    expect(page).toMatchObject({
      content: expect.any(Array),
      totalElements: 21,
      totalPages: 3,
      number: 1,
      size: 10,
      first: false,
      last: false,
    });
  });

  it('contains every ActivityStatus including partner approval', () => {
    expect(Object.values(ActivityStatus)).toEqual([
      'DRAFT',
      'PENDING_APPROVAL',
      'PUBLISHED',
      'FULL',
      'IN_PROGRESS',
      'FINISHED',
      'CANCELLED',
    ]);
    expect(isPublicVisible(ActivityStatus.PUBLISHED)).toBe(true);
    expect(isPublicVisible(ActivityStatus.FINISHED)).toBe(true);
    expect(isPublicVisible(ActivityStatus.DRAFT)).toBe(false);
    expect(isPublicVisible(ActivityStatus.PENDING_APPROVAL)).toBe(false);
    expect(MOCK_ACTIVITIES_V2.find((activity) => activity.status === 'DRAFT')).toBeTruthy();
  });

  it('contains the three proposal statuses', () => {
    expect(Object.values(ProposalStatus)).toEqual(['NEW', 'ACCEPTED', 'REJECTED']);
  });

  it('uses AuthResponse with a two-hour access token', () => {
    const auth = makeAuthResponse(MOCK_USERS_V2.empleado);
    expect(auth).toMatchObject({
      accessToken: expect.any(String),
      tokenType: 'Bearer',
      expiresIn: 7200,
      user: expect.objectContaining({ role: 'EMPLOYEE' }),
    });
  });
});

describe('shared error and response fixtures', () => {
  it('uses the common ApiError representation', () => {
    const error = createApiError({
      status: 409,
      code: 'ALREADY_REGISTERED',
      message: 'Ya estás inscrito',
    });
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 409,
      code: 'ALREADY_REGISTERED',
      isNetworkError: false,
      isCanceled: false,
    });
  });

  it('distinguishes successful 200, 201 and 204 responses', () => {
    expect(ok({ a: 1 }, { status: 200 }).status).toBe(200);
    expect(created({ id: 1 }).status).toBe(201);
    expect(noContent().status).toBe(204);
  });

  it('covers the relevant HTTP and domain errors', () => {
    expect(httpErrors.validation({ email: ['bad'] }).status).toBe(400);
    expect(httpErrors.unauthorized().status).toBe(401);
    expect(httpErrors.forbidden().status).toBe(403);
    expect(httpErrors.notFound().status).toBe(404);
    expect(httpErrors.conflict('X').status).toBe(409);
    expect(httpErrors.payloadTooLarge().status).toBe(413);
    expect(httpErrors.unsupportedMedia().status).toBe(415);
    expect(httpErrors.rateLimited().status).toBe(429);
    expect(httpErrors.serverError().status).toBe(500);
    expect(domainErrors.alreadyRegistered().code).toBe('ALREADY_REGISTERED');
    expect(domainErrors.activityNotClosed().code).toBe('ACTIVITY_NOT_CLOSED');
    expect(domainErrors.closureAlreadyClosed().code).toBe('CLOSURE_ALREADY_CLOSED');
    expect(domainErrors.proposalAlreadyDecided().code).toBe('PROPOSAL_ALREADY_DECIDED');
  });
});

describe('registration and upload mocks', () => {
  it('accepts optional cancellation reason and rejection without a body', async () => {
    registrationsMock.resetRegistrationsMock([
      { registrationId: 10, activityId: 1, status: RegistrationStatus.CONFIRMED, accepted: true },
      { registrationId: 11, activityId: 2, status: RegistrationStatus.WAITLISTED, accepted: false },
    ]);

    const cancelled = await registrationsMock.mockCancelRegistration(10, { reason: 'Motivo' });
    const rejected = await registrationsMock.mockRejectRegistration(11);

    expect(cancelled.data.status).toBe(RegistrationStatus.CANCELLED);
    expect(rejected.data.status).toBe(RegistrationStatus.REJECTED);
  });

  it('rejects a duplicate active registration', async () => {
    registrationsMock.resetRegistrationsMock([
      { registrationId: 1, activityId: 99, status: RegistrationStatus.CONFIRMED, accepted: true },
    ]);
    await expect(
      registrationsMock.mockCreateRegistration({ activityId: 99 }),
    ).rejects.toMatchObject({ code: 'ALREADY_REGISTERED', status: 409 });
  });

  it('limits cover images to JPG/PNG and 5 MB', async () => {
    expect((await mockUploadCover(makeImageFile('cover.jpg', 1024, 'image/jpeg'))).status).toBe(201);
    await expect(
      mockUploadCover(makeImageFile('big.jpg', MAX_IMAGE_BYTES + 1, 'image/jpeg')),
    ).rejects.toMatchObject({ status: 413 });
    await expect(
      mockUploadCover(makeImageFile('bad.txt', 1024, 'text/plain')),
    ).rejects.toMatchObject({ status: 415 });
  });

  it('limits evidence to PDF/JPG/PNG and 10 MB and requires consent', async () => {
    const request = makeCreateClosureRequest({ evidenceConsent: true });
    expect((await mockUploadEvidence({
      request,
      evidence: makeEvidenceFile('evidence.pdf', 1024, 'application/pdf'),
    })).status).toBe(201);
    await expect(mockUploadEvidence({
      request,
      evidence: makeEvidenceFile('big.pdf', MAX_EVIDENCE_BYTES + 1, 'application/pdf'),
    })).rejects.toMatchObject({ status: 413 });
    await expect(mockUploadEvidence({
      request,
      evidence: makeEvidenceFile('bad.txt', 1024, 'text/plain'),
    })).rejects.toMatchObject({ status: 415 });
    await expect(mockUploadEvidence({
      request: makeCreateClosureRequest({ evidenceConsent: false }),
      evidence: makeEvidenceFile('evidence.pdf', 1024, 'application/pdf'),
    })).rejects.toMatchObject({ status: 400, code: 'VALIDATION_ERROR' });
  });
});
