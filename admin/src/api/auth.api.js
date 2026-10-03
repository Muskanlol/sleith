import api from "./client";

export const authApi = {
  login: (credentials) => api.post("/auth/login/", credentials),
  logout: (refreshToken) => api.post("/auth/logout/", { refresh: refreshToken }),
  refresh: (refreshToken) => api.post("/auth/token/refresh/", { refresh: refreshToken }),
  me: () => api.get("/auth/me/"),
  changePassword: (data) => api.post("/auth/change-password/", data),
};