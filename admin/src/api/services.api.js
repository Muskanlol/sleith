import api from "./client";

export const servicesApi = {
  getAll: () => api.get("/admin/services/"),
  getById: (id) => api.get(`/admin/services/${id}/`),
  create: (payload) => {
    const isForm = typeof FormData !== "undefined" && payload instanceof FormData;
    return api.post("/admin/services/", payload, isForm ? { headers: { "Content-Type": "multipart/form-data" } } : undefined);
  },
  update: (id, payload) => {
    const isForm = typeof FormData !== "undefined" && payload instanceof FormData;
    return api.patch(`/admin/services/${id}/`, payload, isForm ? { headers: { "Content-Type": "multipart/form-data" } } : undefined);
  },
  deactivate: (id) => api.post(`/admin/services/${id}/deactivate/`),
};

export const serviceCategoriesApi = {
  getAll:   () => api.get("/admin/service-categories/"),
  create:   (payload)  => api.post("/admin/service-categories/", payload),
  createMultipart: (formData) =>
    api.post("/admin/service-categories/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update:   (id, payload)  => api.patch(`/admin/service-categories/${id}/`, payload),
  updateMultipart: (id, formData) =>
    api.patch(`/admin/service-categories/${id}/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deactivate: (id) => api.post(`/admin/service-categories/${id}/deactivate/`),
};