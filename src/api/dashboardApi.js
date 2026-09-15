import client from './axiosClient';
import { getDashboardMockData } from '../assets/mock/data/dashboard';
import { isDevelopmentMockEnabled as isModuleMockEnabled } from './mockConfig';

const DASHBOARD_FILTERS = ['year', 'line'];
const YEAR_FILTER = ['year'];
const isDevelopmentMockEnabled = () => isModuleMockEnabled('DASHBOARD');

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

const mockResponse = (data, config = {}) => {
  if (config.signal?.aborted) return Promise.reject({ isCanceled: true });
  return Promise.resolve({ data });
};

export const getDashboard = (params = {}, config = {}) => {
  const cleanParams = sanitizeDashboardParams(params);
  if (isDevelopmentMockEnabled()) return mockResponse(getDashboardMockData(cleanParams), config);
  return client.get('/dashboard', requestConfig(cleanParams, config));
};

const fileConfig = (params, config = {}, allowed = DASHBOARD_FILTERS) => requestConfig(params, {
  ...config,
  responseType: 'blob',
}, allowed);

export const exportParticipationsCsv = (params = {}, config = {}) => {
  if (isDevelopmentMockEnabled()) {
    const csv = `id,actividad,horas,departamento\n1,Actividad seudonimizada 1,8,Tecnología\n2,Actividad seudonimizada 2,5,Personas\n`;
    return mockResponse(new Blob([csv], { type: 'text/csv' }), config);
  }
  return client.get('/dashboard/participations.csv', fileConfig(params, config));
};

export const exportPartnersCsv = (params = {}, config = {}) => {
  if (isDevelopmentMockEnabled()) {
    const csv = `organizacion,actividades,horas\nOrg seudonimizada A,2,15\nOrg seudonimizada B,1,8\n`;
    return mockResponse(new Blob([csv], { type: 'text/csv' }), config);
  }
  return client.get('/dashboard/partners.csv', fileConfig(params, config, YEAR_FILTER));
};

export const exportDashboardPdf = (params = {}, config = {}) => {
  if (isDevelopmentMockEnabled()) {
    const pdfPlaceholder = `%PDF-1.4\n% Mock PDF for dashboard\n1 0 obj\n<< /Type /Catalog >>\nendobj\n`;
    return mockResponse(new Blob([pdfPlaceholder], { type: 'application/pdf' }), config);
  }
  return client.get('/dashboard/report.pdf', fileConfig(params, config, YEAR_FILTER));
};
