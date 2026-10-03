import api from './client'

export const salonApi = {
  getCategories: () => api.get('/categories/'),
  getServices: () => api.get('/services/'),
  getService: (id) => api.get(`/services/${id}/`),
  getServiceStaff: (id) => api.get(`/services/${id}/staff/`),
  getStaff: () => api.get('/staff/'),
  getStaffMember: (id) => api.get(`/staff/${id}/`),
  getStaffServices: (id) => api.get(`/staff/${id}/services/`),
  getStaffAvailability: (id) => api.get(`/staff/${id}/availability/`),
  getPackages: () => api.get('/packages/'),
  getPackage: (id) => api.get(`/packages/${id}/`),
  getPublicReviews: (params) => api.get('/reviews/public/', { params }),
}
