import api from "./client";

export const authApi = {
  register: (payload) => api.post('/auth/register/', payload),
  login: (email, password) => api.post('/auth/login/', { email, password }),
  logout: (refresh) => api.post('/auth/logout/', { refresh }),
  me: () => api.get('/auth/me/'),
  updateMe: (payload) => api.patch('/auth/me/', payload),
  changePassword: (old_password, new_password) =>
    api.post('/auth/change-password/', { old_password, new_password }),
  forgotPassword: (email) => api.post('/auth/forgot-password/', { email }),
  resetPassword: (token, new_password) =>
    api.post('/auth/reset-password/', { token, new_password }),
  verifyEmail: (token) => api.post('/auth/verify-email/', { token }),
}