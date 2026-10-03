import client from './client';

export const appointmentsApi = {
  getAll: (params = {}) => client.get('/admin/appointments/', { params }),
  getById: (id) => client.get(`/admin/appointments/${id}/`),
  create: (data) => client.post('/admin/appointments/', data),
  update: (id, data) => client.patch(`/admin/appointments/${id}/`, data),
  remove: (id) => client.delete(`/admin/appointments/${id}/`),
};