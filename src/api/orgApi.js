import client from './axiosClient';

const USE_MOCK_API = true;

function simulateRequest({ data, delay = 1000, failRate = 0 } = {}) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < failRate) {
        reject(new Error('Simulated API error'));
      } else {
        resolve({ data });
      }
    }, delay);
  });
}

export const createOrganization = (data) => {
    if (USE_MOCK_API) {
        console.info('[MOCK] createOrganization', data);
        return simulateRequest({ data: { id: 'mock-org-id', status: 'pending' }, delay: 1200 });
    }
    return client.post('/organizations', data);
};

export const resendOrganizationRegistrationEmail = (email) => {
    if (USE_MOCK_API) {
        console.info('[MOCK] resendOrganizationConfirmationEmail', email);
        return simulateRequest({ data: { resent: true }, delay: 1000 });
    }
    return client.post('/organizations/resend-registration', { email });
};