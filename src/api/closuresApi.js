import client from './axiosClient';

export const getClosure = (closureId) => client.get(`/closures/${closureId}`);
// El multipart no se fija a mano: si resolvemos el `Content-Type`, el navegador
// no añade su `boundary` y el servidor no puede delimitar las partes (`request` +
// `evidence`). Sin cabecera, axios deja que el navegador la genere con el límite.
export const submitClosure = (request, evidence = null) => {
  const body = new FormData();
  body.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));
  if (evidence) body.append('evidence', evidence);
  return client.post('/closures', body);
};
export const getCertificate = (closureId) => client.get(`/closures/${closureId}/certificate`);

// Admin closures
export const getPendingActivityClosures = ({ page, size } = {}) => {
  const params = {};
  if (page !== undefined && page !== null) params.page = page;
  if (size !== undefined && size !== null) params.size = size;
  return client.get('/admin/activities/pending-closure', { params });
};
export const getActivityClosure = (activityId) => client.get(`/admin/activities/${activityId}/closure`);
export const saveActivityClosure = (activityId, data) => client.put(`/admin/activities/${activityId}/closure`, data);
export const finalizeActivityClosure = (activityId) => client.patch(`/admin/activities/${activityId}/closure/finalize`);
