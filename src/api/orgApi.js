import client from './axiosClient';

export const createOrganization = (data) => client.post('/organizations', data);
