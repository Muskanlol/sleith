import api from "./client";

export const customersApi = {
  getAll: () => api.get("/admin/customers/"),
  getById: (id) => api.get(`/admin/customers/${id}/`),
  create: (payload) => api.post("/admin/customers/create/", payload),
  update: (id, payload) => api.patch(`/admin/customers/${id}/update/`, payload),
  deactivate: (id) => api.post(`/admin/customers/${id}/deactivate/`),
};