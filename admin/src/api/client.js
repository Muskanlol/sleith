import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

const api = axios.create({ baseURL: API_BASE_URL });

const refreshClient = axios.create({ baseURL: API_BASE_URL });

let refreshPromise = null;

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function redirectToLogin() {
  if (window.location.pathname !== "/admin/login") {
    window.location.href = "/admin/login";
  }
}

function requestNewAccessToken() {
  if (!refreshPromise) {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    refreshPromise = refreshClient
      .post("auth/token/refresh/", { refresh: refreshToken })
      .then(({ data }) => {
        localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
        if (data.refresh) {
          localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh);
        }
        return data.access;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;

    if (!response || !config) {
      return Promise.reject(error);
    }

    const isAuthEndpoint =
      config.url?.includes("/auth/login/") ||
      config.url?.includes("/auth/token/refresh/");

    if (response.status === 401 && !config._retry && !isAuthEndpoint) {
      config._retry = true;
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (!refreshToken) {
        clearSession();
        redirectToLogin();
        return Promise.reject(error);
      }

      try {
        const newAccessToken = await requestNewAccessToken();
        config.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(config);
      } catch (refreshError) {
        clearSession();
        redirectToLogin();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;