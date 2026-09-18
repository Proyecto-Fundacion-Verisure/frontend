import client from './axiosClient';

// Las actividades de la entidad (`B2-13`) viven en `orgApi.js`. Todo lo de aquí
// va contra el backend real; los mocks de desarrollo se retiraron al terminar
// la integración (solo queda el del dashboard de la entidad, en `orgApi.js`).

const pickParams = (params = {}, allowed = []) => Object.fromEntries(
  Object.entries(params).filter(([key, value]) => (
    allowed.includes(key) && value !== undefined && value !== null && value !== ''
  )),
);

export const getAdminActivities = (params) => (
  client.get('/admin/activities', { params: pickParams(params, ['status', 'page', 'size']) })
);
export const getActivities = (params = {}) => (
  client.get('/activities', {
    params: pickParams(params, ['line', 'mode', 'from', 'to', 'page', 'size']),
  })
);
export const getPublishedActivities = getActivities;
export const getActivityDetail = (id) => client.get(`/activities/${id}`);
export const getAdminActivity = (id) => client.get(`/admin/activities/${id}`);
export const createActivity = (data) => client.post('/admin/activities', data);
export const updateActivity = (id, data) => client.put(`/admin/activities/${id}`, data);
export const publishActivity = (id) => client.patch(`/admin/activities/${id}/publish`);
export const cancelActivity = (id) => client.patch(`/admin/activities/${id}/cancel`);

// `uploadActivityImage` vivía aquí y llamaba a `POST /admin/activity-images`, que
// nunca llegó a existir en el backend. `B2-03` decidió que las portadas no se
// suben ni se editan: son la imagen de la línea de acción, que resuelve el
// frontend con `getLineByValue`. La subida de archivos que sí queda es la
// evidencia del cierre, que va por `FileStorageService`.

export const getPendingActivities = (params = {}) => (
  client.get('/admin/activities/pending', { params: pickParams(params, ['page', 'size']) })
);
export const approveActivity = (id) => client.patch(`/admin/activities/${id}/approve`);
export const returnActivity = (id, note) => (
  client.patch(`/admin/activities/${id}/return`, { note })
);

// `getPartnerActivities` vivía aquí y era un segundo camino hacia
// `/org/activities`. El único es `getOrgActivities`, en `orgApi.js`.
