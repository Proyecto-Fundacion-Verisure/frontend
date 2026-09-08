import client from './axiosClient';
import { getDashboardMockData } from '../assets/mock/data/dashboard';

const DASHBOARD_FILTERS = ['year', 'line'];
const YEAR_FILTER = ['year'];
const useDevelopmentMocks = () => (
  import.meta.env.DEV
  && import.meta.env.MODE !== 'test'
  && import.meta.env.VITE_USE_MOCKS !== 'false'
);

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
  if (useDevelopmentMocks()) return mockResponse(getDashboardMockData(cleanParams), config);
  return client.get('/dashboard', requestConfig(cleanParams, config));
};

const fileConfig = (params, config = {}, allowed = DASHBOARD_FILTERS) => requestConfig(params, {
  ...config,
  responseType: 'blob',
}, allowed);

export const exportParticipationsCsv = (params = {}, config = {}) => {
  if (useDevelopmentMocks()) {
    return mockResponse(new Blob(['activity,participants\nMock activity,598'], { type: 'text/csv' }), config);
  }
  return client.get('/dashboard/participations.csv', fileConfig(params, config));
};

export const exportPartnersCsv = (params = {}, config = {}) => {
  if (useDevelopmentMocks()) {
    return mockResponse(new Blob(['partner,activities\nMock partner,24'], { type: 'text/csv' }), config);
  }
  return client.get('/dashboard/partners.csv', fileConfig(params, config, YEAR_FILTER));
};

export const exportDashboardPdf = (params = {}, config = {}) => {
  if (useDevelopmentMocks()) {
    return mockResponse(new Blob(['Mock dashboard report'], { type: 'application/pdf' }), config);
  }
  return client.get('/dashboard/report.pdf', fileConfig(params, config, YEAR_FILTER));
};
