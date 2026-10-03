import client from "./client";

export const packagesApi = {
  getAll: () => client.get("/admin/packages/"),
  getById: (id) => client.get(`/admin/packages/${id}/`),
  create: (data) => client.post("/admin/packages/", data),
  update: (id, data) => client.patch(`/admin/packages/${id}/`, data),
  deactivate: (id) => client.post(`/admin/packages/${id}/deactivate/`),
};