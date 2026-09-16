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

export const getDashboard = (params = {}, config = {}) =>
  client.get('/dashboard', requestConfig(params, config));

const fileConfig = (params, config = {}, allowed = DASHBOARD_FILTERS) => requestConfig(params, {
  ...config,
  responseType: 'blob',
}, allowed);

export const exportParticipationsCsv = (params = {}, config = {}) =>
  client.get('/dashboard/participations.csv', fileConfig(params, config));

export const exportPartnersCsv = (params = {}, config = {}) =>
  client.get('/dashboard/partners.csv', fileConfig(params, config, YEAR_FILTER));

export const exportDashboardPdf = (params = {}, config = {}) =>
  client.get('/dashboard/report.pdf', fileConfig(params, config, YEAR_FILTER));
