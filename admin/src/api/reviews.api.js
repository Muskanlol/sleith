import api from './client';

export const reviewsApi = {
  getAll: (params = {}) => api.get('/admin/reviews/', { params }),
  updateStatus: (id, status) => api.patch(`/admin/reviews/${id}/status/`, { status }),
};
