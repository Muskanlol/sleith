import api from './client'

export const galleryApi = {
  // Public
  getAll:    ()   => api.get('/gallery/'),
  getOne:    (id) => api.get(`/gallery/${id}/`),

  // Admin — multipart/form-data for image upload
  create: (formData) =>
    api.post('/gallery/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id, formData) =>
    api.patch(`/gallery/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  remove: (id) => api.delete(`/gallery/${id}/`),
}
