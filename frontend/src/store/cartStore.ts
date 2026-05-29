// File: frontend/src/store/cartStore.ts
// Nhiệm vụ: Zustand store quản lý giỏ hàng cục bộ (local cart) và đồng bộ với giỏ hàng trên DB của người dùng.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Product } from '../types'

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  setItems: (items: CartItem[]) => void
  addItem: (item: CartItem) => void
  updateItem: (id: string, quantity: number) => void
  removeItem: (id: string) => void
  clearCart: () => void
  toggleCart: () => void
  total: () => number
  count: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [], // Danh sách các sản phẩm có trong giỏ hàng
      isOpen: false, // Trạng thái đóng/mở nhanh giỏ hàng ở sidebar
      
      // Đồng bộ danh sách sản phẩm từ server về store cục bộ
      setItems: (items) => set({ items }),
      
      // Thêm sản phẩm mới vào giỏ hàng cục bộ
      addItem: (item) => {
        // Kiểm tra xem sản phẩm này đã có trong giỏ hàng chưa
        const existing = get().items.find((i) => i.product_id === item.product_id)
        if (existing) {
          // Nếu đã có, chỉ cộng dồn thêm số lượng
          set((s) => ({
            items: s.items.map((i) =>
              i.product_id === item.product_id
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          }))
        } else {
          // Nếu chưa có, append sản phẩm mới vào danh sách
          set((s) => ({ items: [...s.items, item] }))
        }
      },
      
      // Cập nhật số lượng của một sản phẩm trong giỏ hàng
      updateItem: (id, quantity) =>
        set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, quantity } : i)) })),
      
      // Xóa sản phẩm khỏi giỏ hàng
      removeItem: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      
      // Xóa sạch toàn bộ giỏ hàng
      clearCart: () => set({ items: [] }),
      
      // Đóng/mở nhanh sidebar giỏ hàng ở Header
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
      
      // Tính tổng giá trị toàn bộ sản phẩm trong giỏ hàng (áp dụng giá khuyến mãi sale_price nếu có)
      total: () =>
        get().items.reduce((sum, i) => {
          const price = i.product?.sale_price ?? i.product?.price ?? 0
          return sum + price * i.quantity
        }, 0),
        
      // Tính tổng số lượng tất cả sản phẩm đang có trong giỏ hàng
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    // Lưu trữ giỏ hàng vào LocalStorage để khi F5 trang hoặc tắt trình duyệt đi vẫn giữ nguyên giỏ hàng
    { name: 'cart-storage', partialize: (s) => ({ items: s.items }) }
  )
)
