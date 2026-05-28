import api from './axios'
import type {
  Token, User, Product, ProductList, Category,
  Cart, CartItem, Order, Review, AdminStats
} from '../types'

// Auth
export const authApi = {
  register: (data: { email: string; password: string; full_name?: string; phone?: string }) =>
    api.post<Token>('/auth/register', data),
  login: (email: string, password: string) =>
    api.post<Token>('/auth/login', { email, password }),
  refresh: (token: string) =>
    api.post<{ access_token: string }>('/auth/refresh', null, { params: { refresh_token: token } }),
}

// Products
export const productApi = {
  list: (params?: {
    skip?: number; limit?: number; category?: string
    min_price?: number; max_price?: number; search?: string; sort?: string
  }) => api.get<ProductList>('/products', { params }),
  get: (slug: string) => api.get<Product>(`/products/${slug}`),
  create: (data: Partial<Product>) => api.post<Product>('/products', data),
  update: (id: string, data: Partial<Product>) => api.put<Product>(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  getReviews: (id: string) => api.get<Review[]>(`/products/${id}/reviews`),
  createReview: (id: string, data: { rating: number; comment?: string }) =>
    api.post<Review>(`/products/${id}/reviews`, data),
}

// Categories
export const categoryApi = {
  list: () => api.get<Category[]>('/categories'),
  create: (data: { name: string; slug: string; image_url?: string }) =>
    api.post<Category>('/categories', data),
  update: (id: string, data: Partial<Category>) => api.put<Category>(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
}

// Cart
export const cartApi = {
  get: () => api.get<Cart>('/cart/'),
  add: (product_id: string, quantity: number) =>
    api.post<CartItem>('/cart/', { product_id, quantity }),
  update: (item_id: string, quantity: number) =>
    api.put<CartItem>(`/cart/${item_id}`, { quantity }),
  remove: (item_id: string) => api.delete(`/cart/${item_id}`),
}

// Orders
export const orderApi = {
  create: (data: { shipping_address: object; payment_method: string }) =>
    api.post<Order>('/orders/', data),
  list: (skip = 0, limit = 20) => api.get<Order[]>('/orders/', { params: { skip, limit } }),
  get: (id: string) => api.get<Order>(`/orders/${id}`),
  updateStatus: (id: string, status: string) =>
    api.put<Order>(`/orders/${id}/status`, { status }),
}

// Users
export const userApi = {
  me: () => api.get<User>('/users/me'),
  update: (data: { full_name?: string; phone?: string; password?: string }) =>
    api.put<User>('/users/me', data),
}

// Admin
export const adminApi = {
  stats: () => api.get<AdminStats>('/admin/stats'),
  orders: (params?: { skip?: number; limit?: number; status?: string }) =>
    api.get<Order[]>('/admin/orders', { params }),
  users: (params?: { skip?: number; limit?: number }) =>
    api.get<User[]>('/admin/users', { params }),
  toggleUser: (id: string) => api.put<User>(`/admin/users/${id}/toggle-active`),
}

// Upload
export const uploadApi = {
  image: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<{ url: string; filename: string }>('/upload/image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
