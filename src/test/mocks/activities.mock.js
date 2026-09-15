import { createApiError } from '../fixtures/apiErrors';
import { MOCK_ACTIVITIES_V2, isPublicVisible } from '../fixtures/activities';

export function mockGetPublishedActivities(params = {}) {
  let results = [...MOCK_ACTIVITIES_V2].filter((a) => isPublicVisible(a.status));

  if (params.line) results = results.filter((a) => a.line === params.line);
  if (params.mode) results = results.filter((a) => a.mode === params.mode);
  if (params.q) {
    const q = params.q.toLowerCase();
    results = results.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.partnerName.toLowerCase().includes(q) ||
        (a.location && a.location.toLowerCase().includes(q)),
    );
  }

  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 12;
  const start = (page - 1) * limit;
  const paged = results.slice(start, start + limit);

  return Promise.resolve({
    data: paged,
    headers: { 'x-total-count': String(results.length) },
  });
}

export function mockGetActivityDetail(id) {
  const activity = MOCK_ACTIVITIES_V2.find((a) => String(a.id) === String(id));
  if (!activity || !isPublicVisible(activity.status)) {
    return Promise.reject(createApiError({ status: 404, message: 'No se ha encontrado el recurso solicitado.' }));
  }
  return Promise.resolve({ data: { ...activity }, status: 200 });
}

export function mockGetAdminActivity(id) {
  const activity = MOCK_ACTIVITIES_V2.find((a) => String(a.id) === String(id));
  if (!activity) {
    return Promise.reject(createApiError({ status: 404, message: 'No se ha encontrado el recurso solicitado.' }));
  }
  return Promise.resolve({ data: { ...activity }, status: 200 });
}

export function mockCreateActivity(data) {
  return Promise.resolve({ data: { id: 999, status: 'DRAFT', ...data }, status: 201 });
}

export function mockPublishActivity(id) {
  const activity = MOCK_ACTIVITIES_V2.find((a) => String(a.id) === String(id));
  if (!activity) return Promise.reject(createApiError({ status: 404, message: 'No se ha encontrado el recurso solicitado.' }));
  return Promise.resolve({ data: { ...activity, status: 'PUBLISHED' }, status: 200 });
}

export function mockCancelActivity(id) {
  const activity = MOCK_ACTIVITIES_V2.find((a) => String(a.id) === String(id));
  if (!activity) return Promise.reject(createApiError({ status: 404, message: 'No se ha encontrado el recurso solicitado.' }));
  return Promise.resolve({ data: { ...activity, status: 'CANCELLED' }, status: 200 });
}
