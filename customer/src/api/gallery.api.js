import api from './client'

export const galleryApi = {
  getItems: () => api.get('/gallery/'),
  getItem:  (id) => api.get(`/gallery/${id}/`),
}
