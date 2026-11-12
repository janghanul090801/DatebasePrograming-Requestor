import { apiRequest } from './client';

export const requestsApi = {
  list: ({ search = '', method = '' } = {}) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (method) params.set('method', method);
    const query = params.toString();
    return apiRequest(`/api/requests${query ? `?${query}` : ''}`);
  },

  get: (id) => apiRequest(`/api/requests/${id}`),

  create: (payload) =>
    apiRequest('/api/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id, payload) =>
    apiRequest(`/api/requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  remove: (id) =>
    apiRequest(`/api/requests/${id}`, {
      method: 'DELETE',
    }),
};
