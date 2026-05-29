// File: frontend/src/api/endpoints.ts
// Nhiệm vụ: Khai báo các API client wrappers sử dụng Axios instance để gọi về Backend

import api from './axios'
import type {
  Token, User, Product, ProductList, Category,
  Cart, CartItem, Order, Review, AdminStats
} from '../types'

// ==========================================
// 1. Xác thực người dùng (Auth)
// ==========================================
export const authApi = {
  // Đăng ký tài khoản khách hàng mới
  register: (data: { email: string; password: string; full_name?: string; phone?: string }) =>
    api.post<Token>('/auth/register', data),
  
  // Đăng nhập hệ thống (Lấy Access Token & Refresh Token)
  login: (email: string, password: string) =>
    api.post<Token>('/auth/login', { email, password }),
  
  // Làm mới access token hết hạn sử dụng refresh token
  refresh: (token: string) =>
    api.post<{ access_token: string }>('/auth/refresh', null, { params: { refresh_token: token } }),
}

// ==========================================
// 2. Quản lý sản phẩm (Products)
// ==========================================
export const productApi = {
  // Lấy danh sách sản phẩm công khai hỗ trợ bộ lọc và phân trang
  list: (params?: {
    skip?: number; limit?: number; category?: string
    min_price?: number; max_price?: number; search?: string; sort?: string
    brand?: string; in_stock?: boolean; sale_only?: boolean
  }) => api.get<ProductList>('/products/', { params }),
  
  // Lấy thông tin chi tiết một sản phẩm theo slug
  get: (slug: string) => api.get<Product>(`/products/${slug}`),
  
  // Tạo sản phẩm mới (chỉ Admin)
  create: (data: Partial<Product>) => api.post<Product>('/products/', data),
  
  // Cập nhật thông tin sản phẩm (chỉ Admin)
  update: (id: string, data: Partial<Product>) => api.put<Product>(`/products/${id}`, data),
  
  // Xóa sản phẩm khỏi hệ thống (chỉ Admin)
  delete: (id: string) => api.delete(`/products/${id}`),
  
  // Lấy danh sách đánh giá của sản phẩm theo ID
  getReviews: (id: string) => api.get<Review[]>(`/products/${id}/reviews`),
  
  // Tạo đánh giá và bình luận mới cho sản phẩm
  createReview: (id: string, data: { rating: number; comment?: string }) =>
    api.post<Review>(`/products/${id}/reviews`, data),
}

// ==========================================
// 3. Quản lý danh mục (Categories)
// ==========================================
export const categoryApi = {
  // Lấy danh sách danh mục sản phẩm công khai
  list: () => api.get<Category[]>('/categories/'),
  
  // Tạo danh mục sản phẩm mới (chỉ Admin)
  create: (data: { name: string; slug: string; image_url?: string }) =>
    api.post<Category>('/categories/', data),
  
  // Cập nhật thông tin danh mục (chỉ Admin)
  update: (id: string, data: Partial<Category>) => api.put<Category>(`/categories/${id}`, data),
  
  // Xóa danh mục sản phẩm (chỉ Admin)
  delete: (id: string) => api.delete(`/categories/${id}`),
}

// ==========================================
// 4. Giỏ hàng cá nhân (Cart)
// ==========================================
export const cartApi = {
  // Lấy thông tin giỏ hàng của người dùng hiện tại
  get: () => api.get<Cart>('/cart/'),
  
  // Thêm sản phẩm vào giỏ hàng
  add: (product_id: string, quantity: number) =>
    api.post<CartItem>('/cart/', { product_id, quantity }),
  
  // Cập nhật số lượng của một mặt hàng trong giỏ hàng
  update: (item_id: string, quantity: number) =>
    api.put<CartItem>(`/cart/${item_id}`, { quantity }),
  
  // Xóa mặt hàng khỏi giỏ hàng
  remove: (item_id: string) => api.delete(`/cart/${item_id}`),
}

// ==========================================
// 5. Quản lý đơn hàng (Orders)
// ==========================================
export const orderApi = {
  // Tạo đơn hàng mới từ danh sách cart items được chọn
  create: (data: { shipping_address: object; payment_method: string; cart_item_ids?: string[] }) =>
    api.post<Order>('/orders/', data),
  
  // Lấy lịch sử mua hàng cá nhân hỗ trợ phân trang
  list: (skip = 0, limit = 20) => api.get<Order[]>('/orders/', { params: { skip, limit } }),
  
  // Lấy thông tin chi tiết một đơn hàng theo ID
  get: (id: string) => api.get<Order>(`/orders/${id}`),
  
  // Cập nhật trạng thái đơn hàng (chỉ Admin)
  updateStatus: (id: string, status: string) =>
    api.put<Order>(`/orders/${id}/status`, { status }),
  
  // Hủy giao dịch thanh toán trực tuyến
  cancelPayment: (params: { order_id?: string; order_code?: number }) =>
    api.post<Order>('/orders/cancel-payment', null, { params }),
  
  // Hủy đơn hàng trước khi vận chuyển
  cancel: (id: string) =>
    api.post<Order>(`/orders/${id}/cancel`),
}

// ==========================================
// 6. Quản lý tài khoản (Users)
// ==========================================
export const userApi = {
  // Lấy thông tin tài khoản cá nhân của người dùng hiện tại
  me: () => api.get<User>('/users/me'),
  
  // Cập nhật thông tin cá nhân hoặc mật khẩu
  update: (data: { full_name?: string; phone?: string; password?: string }) =>
    api.put<User>('/users/me', data),
}

// ==========================================
// 7. Bảng điều khiển quản trị (Admin)
// ==========================================
export const adminApi = {
  // Lấy dữ liệu thống kê doanh thu và đơn hàng cho Dashboard
  stats: () => api.get<AdminStats>('/admin/stats'),
  
  // Xem danh sách sản phẩm đầy đủ của hệ thống
  products: (params?: {
    skip?: number; limit?: number; category?: string
    min_price?: number; max_price?: number; search?: string; sort?: string
    brand?: string; in_stock?: boolean; sale_only?: boolean
  }) => api.get<ProductList>('/admin/products', { params }),
  
  // Xem danh sách toàn bộ đơn hàng của tất cả khách hàng
  orders: (params?: { skip?: number; limit?: number; status?: string; search?: string }) =>
    api.get<Order[]>('/admin/orders', { params }),
  
  // Xem danh sách toàn bộ khách hàng trên hệ thống
  users: (params?: { skip?: number; limit?: number }) =>
    api.get<User[]>('/admin/users', { params }),
  
  // Kích hoạt hoặc vô hiệu hóa tài khoản người dùng
  toggleUser: (id: string) => api.put<User>(`/admin/users/${id}/toggle-active`),
}

// ==========================================
// 8. Tải tệp tin (Upload)
// ==========================================
export const uploadApi = {
  // Upload hình ảnh lên máy chủ (ảnh sản phẩm/danh mục)
  image: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<{ url: string; filename: string }>('/upload/image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

