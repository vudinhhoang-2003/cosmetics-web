import axios from 'axios'
import { useAuthStore, useAdminAuthStore } from '../store/authStore'

// Khởi tạo đối tượng Axios Instance dùng chung cho toàn bộ ứng dụng Frontend
const api = axios.create({
  baseURL: '/api',  // API gốc sẽ đi qua proxy thiết lập (ví dụ Nginx hoặc Vite proxy)
  headers: { 'Content-Type': 'application/json' },
})

// Request Interceptor: Tự động chạy trước khi bất kỳ request nào được gửi lên server
api.interceptors.request.use((config) => {
  // Xác định xem request có đích đến trang Admin hay do Admin thực thi không
  const isAdminRequest = config.url?.includes('/admin') || window.location.pathname.startsWith('/admin')
  
  // Trích xuất Token phù hợp từ Store quản lý trạng thái tương ứng (Admin / Customer)
  const token = isAdminRequest
    ? useAdminAuthStore.getState().accessToken
    : useAuthStore.getState().accessToken
    
  // Nếu tồn tại token, tự động chèn vào header Authorization dưới dạng Bearer Token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response Interceptor: Tự động chạy khi nhận được phản hồi (Response) từ server
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    // Nếu gặp lỗi 401 (Unauthorized - Token hết hạn hoặc không hợp lệ)
    if (error.response?.status === 401) {
      const isAdminRequest = window.location.pathname.startsWith('/admin')
      const authStore = isAdminRequest ? useAdminAuthStore : useAuthStore
      const refresh = authStore.getState().refreshToken
      
      // Nếu có sẵn Refresh Token trong máy khách, tiến hành gửi request lấy Access Token mới
      if (refresh) {
        try {
          const res = await axios.post('/api/auth/refresh', null, {
            params: { refresh_token: refresh },
          })
          const newAccessToken = res.data.access_token
          
          // Cập nhật Access Token mới vào store để dùng cho các request tiếp theo
          authStore.setState({ accessToken: newAccessToken })
          
          // Ghi đè header Authorization của request cũ bị lỗi và gửi lại request đó (retry)
          error.config.headers.Authorization = `Bearer ${newAccessToken}`
          return api.request(error.config)
        } catch {
          // Nếu việc refresh token thất bại (refresh token hết hạn), đăng xuất và chuyển hướng về trang Login
          authStore.getState().logout()
          window.location.href = isAdminRequest ? '/admin/login' : '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api

