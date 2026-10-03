import axios from 'axios'

const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

export const tokenStorage = {
    getAccess : () => localStorage.getItem(ACCESS_TOKEN_KEY),
    getRefresh : () => localStorage.getItem(REFRESH_TOKEN_KEY),
    set: (access, refresh) => {
        if (access) localStorage.setItem(ACCESS_TOKEN_KEY, access)
        if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
    },
    clear: () => {
        localStorage.removeItem(ACCESS_TOKEN_KEY)
        localStorage.removeItem(REFRESH_TOKEN_KEY)
    },
}

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 15000,
})

api.interceptors.request.use((config) => {
    const token = tokenStorage.getAccess()
    if (token) {
        config.headers.authorization = `Bearer ${token}`
    }
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
        delete config.headers['Content-Type']
        delete config.headers['content-type']
    }
    return config
})

const AUTH_EXEMPT_PATHS = ['/auth/login/', '/auth/token/refresh/', '/auth/register']

let refreshPromise = null

function isExemptFromRefresh(url = '') {
    return AUTH_EXEMPT_PATHS.some((path) => url.includes(path))
}

async function refreshAccessToken() {
  const refresh = tokenStorage.getRefresh()
  if (!refresh) throw new Error('No refresh token available')

  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${import.meta.env.VITE_API_BASE_URL}/auth/token/refresh/`, { refresh })
      .then(({ data }) => {
        tokenStorage.set(data.access, data.refresh)
        return data.access
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error
    if (!response || response.status !== 401 || config._retried || isExemptFromRefresh(config.url)) {
      return Promise.reject(error)
    }

    config._retried = true
    try {
      const newAccessToken = await refreshAccessToken()
      config.headers.Authorization = `Bearer ${newAccessToken}`
      return api(config)
    } catch (refreshError) {
      tokenStorage.clear()
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
      return Promise.reject(refreshError)
    }
  }
)

export default api
