import axios from 'axios'
import { useAuthStore, useAdminAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const isAdminRequest = config.url?.includes('/admin') || window.location.pathname.startsWith('/admin')
  const token = isAdminRequest
    ? useAdminAuthStore.getState().accessToken
    : useAuthStore.getState().accessToken
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
      const authStore = isAdminRequest ? useAdminAuthStore : useAuthStore
      const refresh = authStore.getState().refreshToken
      if (refresh) {
        try {
          const res = await axios.post('/api/auth/refresh', null, {
            params: { refresh_token: refresh },
          })
          const newAccessToken = res.data.access_token
          authStore.setState({ accessToken: newAccessToken })
          error.config.headers.Authorization = `Bearer ${newAccessToken}`
          return api.request(error.config)
        } catch {
          authStore.getState().logout()
          window.location.href = isAdminRequest ? '/admin/login' : '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
