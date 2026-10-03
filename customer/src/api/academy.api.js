import api from './client'

export const academyApi = {
  getCourses: () => api.get('/academy/courses/'),
  getCourse: (id) => api.get(`/academy/courses/${id}/`),
  getCourseModules: (id) => api.get(`/academy/courses/${id}/modules/`),
  getBatches: () => api.get('/academy/batches/'),
  getCourseBatches: (id) => api.get(`/academy/batches/?course=${id}`),
  getTrainers: () => api.get('/academy/trainers/'),
  getTrainer: (id) => api.get(`/academy/trainers/${id}/`),
  apply: (data) => api.post('/academy/apply/', data),
  respondToApplication: (id, response) =>
    api.post(`/academy/applications/${id}/respond/`, { response }),
  getMyApplications: () => api.get('/academy/my-applications/'),
  getMyEnrollments: () => api.get('/academy/my-enrollments/'),
  getMyFees: () => api.get('/academy/my-fees/'),
  getMyAttendance: () => api.get('/academy/my-attendance/'),
  getMyResults: () => api.get('/academy/my-results/'),
  getMyCertificates: () => api.get('/academy/my-certificates/'),
  getMyPracticals: () => api.get('/academy/my-practicals/'),
}
