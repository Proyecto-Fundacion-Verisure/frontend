import client from './axiosClient';

const DASHBOARD_FILTERS = ['year', 'line'];
const YEAR_FILTER = ['year'];

export function sanitizeDashboardParams(params = {}, allowed = DASHBOARD_FILTERS) {
  return allowed.reduce((result, key) => {
    const value = params[key];
    if (value !== undefined && value !== null && value !== '') result[key] = value;
    return result;
  }, {});
}

const requestConfig = (params, config = {}, allowed = DASHBOARD_FILTERS) => ({
  ...config,
  params: sanitizeDashboardParams(params, allowed),
});

export const getDashboard = (params = {}, config = {}) => (
  client.get('/dashboard', requestConfig(params, config))
);

const fileConfig = (params, config = {}, allowed = DASHBOARD_FILTERS) => requestConfig(params, {
  ...config,
  responseType: 'blob',
}, allowed);

const isMockEnabled = () => import.meta.env.DEV && import.meta.env.MODE !== 'test';

function mockBlob(content, type) {
  return Promise.resolve({ data: new Blob([content], { type }) });
}

export const exportParticipationsCsv = (params = {}, config = {}) => {
  if (isMockEnabled()) {
    const csv = `id,actividad,horas,departamento\n1,Actividad seudonimizada 1,8,Tecnología\n2,Actividad seudonimizada 2,5,Personas\n`;
    return mockBlob(csv, 'text/csv');
  }
  return client.get('/dashboard/participations.csv', fileConfig(params, config));
};

export const exportPartnersCsv = (params = {}, config = {}) => {
  if (isMockEnabled()) {
    const csv = `organizacion,actividades,horas\nOrg seudonimizada A,2,15\nOrg seudonimizada B,1,8\n`;
    return mockBlob(csv, 'text/csv');
  }
  return client.get('/dashboard/partners.csv', fileConfig(params, config, YEAR_FILTER));
};

export const exportDashboardPdf = (params = {}, config = {}) => {
  if (isMockEnabled()) {
    const pdfPlaceholder = `%PDF-1.4\n% Mock PDF for dashboard\n1 0 obj\n<< /Type /Catalog >>\nendobj\n`;
    return mockBlob(pdfPlaceholder, 'application/pdf');
  }
  return client.get('/dashboard/report.pdf', fileConfig(params, config, YEAR_FILTER));
};
