import api from "./client";

export const staffApi = {
  getAll: () => api.get("/admin/staff-directory/"),
  getById: (id) => api.get(`/admin/staff-directory/${id}/`),
  create: (payload) => api.post("/admin/staff-directory/", payload),
  update: (id, payload) => api.patch(`/admin/staff-directory/${id}/`, payload),
  updateMultipart: (id, formData) =>
    api.patch(`/admin/staff-directory/${id}/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deactivate: (id) => api.post(`/admin/staff-directory/${id}/deactivate/`),

  getEligibleUsers: () => api.get("/admin/staff/"),

  getServices: (staffId) => api.get(`/admin/staff-directory/${staffId}/services/`),
  assignService: (staffId, serviceId) =>
    api.post(`/admin/staff-directory/${staffId}/services/`, { service: serviceId }),
  removeService: (staffServiceId) => api.delete(`/admin/staff-services/${staffServiceId}/`),

  getAvailability: (staffId) => api.get(`/admin/staff-directory/${staffId}/availability/`),
  setAvailability: (staffId, payload) =>
    api.post(`/admin/staff-directory/${staffId}/availability/`, payload),
  deleteAvailability: (availabilityId) =>
    api.delete(`/admin/staff-availability/${availabilityId}/`),

  getLeaves: (staffId) => api.get(`/admin/staff-directory/${staffId}/leaves/`),
  requestLeave: (staffId, payload) =>
    api.post(`/admin/staff-directory/${staffId}/leaves/`, payload),
  approveLeave: (leaveId) => api.post(`/admin/staff-leaves/${leaveId}/approve/`),
};