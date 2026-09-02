import { createApiError } from '../fixtures/apiErrors';
import { makeReportDetailResponse, makeReportSummary, makePage, ReportStatus } from '../fixtures/reports';

// Store keyed by reportId and by registrationId
const byReportId = new Map();
const byRegistrationId = new Map();
let nextReportId = 500;

export function resetReportsMock() {
  byReportId.clear();
  byRegistrationId.clear();
  nextReportId = 500;
}

export function seedReports(reports) {
  reports.forEach((r) => {
    byReportId.set(r.reportId, { ...r });
    if (r._registrationId) byRegistrationId.set(r._registrationId, r.reportId);
  });
}

// POST /reports — 201 create, 200 resubmit RETURNED (same ID), 409 otherwise
export function mockSubmitReport(data, evidenceFile = null) {
  void evidenceFile; // evidence validated in uploads fixture, not here
  const { registrationId, actualHours, rating, comment, evidenceConsent } = data ?? {};

  if (!registrationId) {
    return Promise.reject(createApiError({ status: 400, code: 'VALIDATION_ERROR', message: 'La solicitud no es válida.', fieldErrors: { registrationId: 'Requerido' } }));
  }

  const existingReportId = byRegistrationId.get(Number(registrationId));
  const existing = existingReportId ? byReportId.get(existingReportId) : null;

  if (!existing) {
    // Create new — 201
    const report = makeReportDetailResponse({
      reportId: nextReportId++,
      actualHours,
      rating,
      comment: comment ?? null,
      status: ReportStatus.SUBMITTED,
      evidenceUrl: evidenceFile ? `/uploads/evidence-${registrationId}.pdf` : null,
    });
    report._registrationId = Number(registrationId);
    byReportId.set(report.reportId, report);
    byRegistrationId.set(Number(registrationId), report.reportId);
    return Promise.resolve({ data: stripInternal(report), status: 201 });
  }

  // Exists — only RETURNED allows resubmit (200 same ID)
  if (existing.status === ReportStatus.RETURNED) {
    existing.actualHours = actualHours ?? existing.actualHours;
    existing.rating = rating ?? existing.rating;
    existing.comment = comment ?? existing.comment;
    existing.status = ReportStatus.SUBMITTED;
    existing.returnNote = null;
    return Promise.resolve({ data: stripInternal({ ...existing }), status: 200 });
  }

  // SUBMITTED or VALIDATED → 409 REPORT_ALREADY_SUBMITTED
  return Promise.reject(
    createApiError({ status: 409, code: 'REPORT_ALREADY_SUBMITTED', message: 'Ya has enviado el cierre para esta inscripción.' }),
  );
}

// GET /reports/pending → Page<ReportSummary> (admin)
export function mockGetPendingReports({ page = 0, size = 10 } = {}) {
  const all = [...byReportId.values()].map((r) =>
    makeReportSummary({
      id: r.reportId,
      reportId: r.reportId,
      activity: r.activity,
      person: r.person,
      sentDate: r.sentDate ?? new Date().toISOString(),
      actualHours: r.actualHours,
      status: r.status,
    }),
  );
  // Sorted by antiquity (sentDate asc) per contract
  all.sort((a, b) => new Date(a.sentDate) - new Date(b.sentDate));
  const start = page * size;
  const content = all.slice(start, start + size);
  const pageObj = makePage(content, { totalElements: all.length, page, size });
  return Promise.resolve({ data: pageObj, status: 200 });
}

// GET /reports/{id} → ReportDetailResponse with 200/403/404
export function mockGetReport(reportId, { forbidden = false } = {}) {
  if (forbidden) {
    return Promise.reject(createApiError({ status: 403, code: 'NOT_OWNER', message: 'No tienes permiso para realizar esta acción.' }));
  }
  const report = byReportId.get(Number(reportId));
  if (!report) {
    return Promise.reject(createApiError({ status: 404, message: 'No se ha encontrado el recurso solicitado.' }));
  }
  return Promise.resolve({ data: stripInternal({ ...report }), status: 200 });
}

// PATCH /reports/{id}/validate {validatedHours} → 200 ReportDetailResponse
export function mockValidateReport(reportId, { validatedHours }) {
  const report = byReportId.get(Number(reportId));
  if (!report) return Promise.reject(createApiError({ status: 404, message: 'No se ha encontrado el recurso solicitado.' }));
  report.status = ReportStatus.VALIDATED;
  report.validatedHours = validatedHours;
  return Promise.resolve({ data: stripInternal({ ...report }), status: 200 });
}

// PATCH /reports/{id}/return {note} → 200
export function mockReturnReport(reportId, { note }) {
  const report = byReportId.get(Number(reportId));
  if (!report) return Promise.reject(createApiError({ status: 404, message: 'No se ha encontrado el recurso solicitado.' }));
  if (!note?.trim()) {
    return Promise.reject(createApiError({ status: 400, code: 'VALIDATION_ERROR', message: 'La solicitud no es válida.', fieldErrors: { note: 'Requerido' } }));
  }
  report.status = ReportStatus.RETURNED;
  report.returnNote = note;
  return Promise.resolve({ data: stripInternal({ ...report }), status: 200 });
}

// GET /reports/{id}/certificate → 200 if VALIDATED else 409
export function mockGetCertificate(reportId) {
  const report = byReportId.get(Number(reportId));
  if (!report) return Promise.reject(createApiError({ status: 404, message: 'No se ha encontrado el recurso solicitado.' }));
  if (report.status !== ReportStatus.VALIDATED) {
    return Promise.reject(createApiError({ status: 409, code: 'REPORT_NOT_VALIDATED', message: 'El informe no está validado.' }));
  }
  return Promise.resolve({
    data: {
      name: report.person.name,
      title: report.activity.title,
      partner: report.activity.partner,
      line: 'desoledad',
      startDate: report.activity.startDate,
      endDate: report.activity.endDate,
      validatedHours: report.validatedHours,
      issuedAt: new Date().toISOString(),
      ref: `CERT-2026-${String(report.reportId).padStart(4, '0')}`,
    },
    status: 200,
  });
}

function stripInternal(r) {
  const { _registrationId, ...rest } = r;
  return rest;
}

export const _stores = { byReportId, byRegistrationId };
