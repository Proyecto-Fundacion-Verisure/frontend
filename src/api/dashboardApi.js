import client from './axiosClient';

const DASHBOARD_FILTERS = ['year', 'line'];

export function sanitizeDashboardParams(params = {}) {
  return DASHBOARD_FILTERS.reduce((result, key) => {
    const value = params[key];
    if (value !== undefined && value !== null && value !== '') result[key] = value;
    return result;
  }, {});
}

const requestConfig = (params, config = {}) => ({
  ...config,
  params: sanitizeDashboardParams(params),
});

export const getDashboard = (params = {}, config = {}) => (
  client.get('/dashboard', requestConfig(params, config))
);

const fileConfig = (params, config = {}) => requestConfig(params, {
  ...config,
  responseType: 'blob',
});

export const exportParticipationsCsv = (params = {}, config = {}) => (
  client.get('/dashboard/export/participations.csv', fileConfig(params, config))
);

export const exportPartnersCsv = (params = {}, config = {}) => (
  client.get('/dashboard/export/partners.csv', fileConfig(params, config))
);

export const exportDashboardPdf = (params = {}, config = {}) => (
  client.get('/dashboard/export/report.pdf', fileConfig(params, config))
);
