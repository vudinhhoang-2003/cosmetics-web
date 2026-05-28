import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'

interface AuthStore {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, access: string, refresh: string) => void
  logout: () => void
  isAdmin: () => boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, access, refresh) => {
        set({ user, accessToken: access, refreshToken: refresh, isAuthenticated: true })
      },
      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
        // Xóa giỏ hàng khi đăng xuất để giỏ hàng đi theo tài khoản
        import('./cartStore').then(({ useCartStore }) => {
          useCartStore.getState().clearCart()
        })
      },
      isAdmin: () => get().user?.role === 'admin',
    }),
    { name: 'auth-storage', partialize: (s) => ({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken, isAuthenticated: s.isAuthenticated }) }
  )
)

export const useAdminAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (user, access, refresh) => {
        set({ user, accessToken: access, refreshToken: refresh, isAuthenticated: true })
      },
      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },
      isAdmin: () => get().user?.role === 'admin',
    }),
    { name: 'admin-auth-storage', partialize: (s) => ({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken, isAuthenticated: s.isAuthenticated }) }
  )
)
