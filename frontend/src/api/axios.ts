import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const isAdminRequest = config.url?.includes('/admin') || window.location.pathname.startsWith('/admin')
  const token = isAdminRequest
    ? localStorage.getItem('admin_access_token')
    : localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const isAdminRequest = window.location.pathname.startsWith('/admin')
      const refreshKey = isAdminRequest ? 'admin_refresh_token' : 'refresh_token'
      const accessKey = isAdminRequest ? 'admin_access_token' : 'access_token'
      const refresh = localStorage.getItem(refreshKey)
      if (refresh) {
        try {
          const res = await axios.post('/api/auth/refresh', null, {
            params: { refresh_token: refresh },
          })
          localStorage.setItem(accessKey, res.data.access_token)
          error.config.headers.Authorization = `Bearer ${res.data.access_token}`
          return api.request(error.config)
        } catch {
          localStorage.removeItem(accessKey)
          localStorage.removeItem(refreshKey)
          window.location.href = isAdminRequest ? '/admin/login' : '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
