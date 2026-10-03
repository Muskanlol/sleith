import api from "./client";

export const usersApi = {
  getAll: () => api.get("/admin/users/"),
  create: (payload) => api.post("/admin/users/", payload),
  updateRole: (id, payload) => api.patch(`/admin/users/${id}/role/`, payload),
};