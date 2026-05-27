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
      items: [],
      isOpen: false,
      setItems: (items) => set({ items }),
      addItem: (item) => {
        const existing = get().items.find((i) => i.product_id === item.product_id)
        if (existing) {
          set((s) => ({
            items: s.items.map((i) =>
              i.product_id === item.product_id
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          }))
        } else {
          set((s) => ({ items: [...s.items, item] }))
        }
      },
      updateItem: (id, quantity) =>
        set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, quantity } : i)) })),
      removeItem: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clearCart: () => set({ items: [] }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
      total: () =>
        get().items.reduce((sum, i) => {
          const price = i.product?.sale_price ?? i.product?.price ?? 0
          return sum + price * i.quantity
        }, 0),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'cart-storage', partialize: (s) => ({ items: s.items }) }
  )
)
