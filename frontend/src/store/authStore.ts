// File: frontend/src/store/authStore.ts
// Nhiệm vụ: Quản lý trạng thái đăng nhập, thông tin người dùng và JWT tokens bằng Zustand, hỗ trợ lưu trạng thái vào LocalStorage.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'

// Khai báo kiểu dữ liệu cho Store quản lý xác thực
interface AuthStore {
  user: User | null             // Thông tin người dùng hiện tại (null nếu chưa đăng nhập)
  accessToken: string | null    // Access Token để gửi lên Header khi gọi API
  refreshToken: string | null   // Refresh Token dùng để cấp lại Access Token
  isAuthenticated: boolean      // Trạng thái xác thực (đã đăng nhập hay chưa)
  setAuth: (user: User, access: string, refresh: string) => void  // Hàm thiết lập thông tin xác thực sau khi đăng nhập thành công
  logout: () => void            // Hàm đăng xuất, xóa toàn bộ thông tin
  isAdmin: () => boolean        // Hàm kiểm tra nhanh xem người dùng hiện tại có phải là Admin hay không
}

// -------------------------------------------------------------
// 1. Store xác thực dành cho Khách hàng (Customer Auth Store)
// -------------------------------------------------------------
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      
      // Thiết lập thông tin đăng nhập mới
      setAuth: (user, access, refresh) => {
        set({ user, accessToken: access, refreshToken: refresh, isAuthenticated: true })
      },
      
      // Đăng xuất và dọn dẹp các thông tin liên quan
      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
        // Xóa giỏ hàng khi đăng xuất để giỏ hàng đi theo tài khoản
        import('./cartStore').then(({ useCartStore }) => {
          useCartStore.getState().clearCart()
        })
      },
      
      // Kiểm tra quyền Admin
      isAdmin: () => get().user?.role === 'admin',
    }),
    { 
      name: 'auth-storage', // Tên key trong LocalStorage
      // Chỉ lưu trữ một số trường thông tin cần thiết vào LocalStorage
      partialize: (s) => ({ 
        user: s.user, 
        accessToken: s.accessToken, 
        refreshToken: s.refreshToken, 
        isAuthenticated: s.isAuthenticated 
      }) 
    }
  )
)

// -------------------------------------------------------------
// 2. Store xác thực độc lập dành cho Admin (Admin Auth Store)
// -------------------------------------------------------------
export const useAdminAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      
      // Thiết lập thông tin đăng nhập của Admin
      setAuth: (user, access, refresh) => {
        set({ user, accessToken: access, refreshToken: refresh, isAuthenticated: true })
      },
      
      // Đăng xuất Admin
      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },
      
      // Kiểm tra quyền Admin
      isAdmin: () => get().user?.role === 'admin',
    }),
    { 
      name: 'admin-auth-storage', // Tên key trong LocalStorage của Admin
      partialize: (s) => ({ 
        user: s.user, 
        accessToken: s.accessToken, 
        refreshToken: s.refreshToken, 
        isAuthenticated: s.isAuthenticated 
      }) 
    }
  )
)

