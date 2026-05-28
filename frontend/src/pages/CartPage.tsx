import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Truck } from 'lucide-react'
import toast from 'react-hot-toast'
import { cartApi } from '../api/endpoints'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'
import type { CartItem } from '../types'
import { formatPrice } from '../utils/format'

const FREE_SHIP_THRESHOLD = 500000

export default function CartPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { items, setItems, updateItem, removeItem, clearCart, total, count } = useCartStore()
  const queryClient = useQueryClient()

  // Nếu chưa đăng nhập, xóa giỏ hàng cục bộ cũ và điều hướng sang trang đăng nhập
  useEffect(() => {
    if (!isAuthenticated) {
      clearCart()
      toast.error('Vui lòng đăng nhập để xem giỏ hàng')
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated])

  // Sync cart with server when authenticated
  const { data: serverCart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.get().then((r) => r.data),
    enabled: isAuthenticated,
  })

  useEffect(() => {
    if (serverCart) setItems(serverCart.items)
  }, [serverCart])

  const updateMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      cartApi.update(id, quantity),
    onSuccess: (res, vars) => {
      updateItem(vars.id, vars.quantity)
    },
    onError: () => toast.error('Không thể cập nhật giỏ hàng'),
  })

  const removeMutation = useMutation({
    mutationFn: (id: string) => cartApi.remove(id),
    onSuccess: (_, id) => {
      removeItem(id)
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast.success('Đã xóa sản phẩm')
    },
    onError: () => toast.error('Không thể xóa sản phẩm'),
  })

  const handleQuantityChange = (item: CartItem, delta: number) => {
    const newQty = item.quantity + delta
    if (newQty < 1) return
    if (newQty > item.product.stock) {
      toast.error('Không đủ hàng trong kho')
      return
    }
    if (isAuthenticated) {
      updateMutation.mutate({ id: item.id, quantity: newQty })
    } else {
      updateItem(item.id, newQty)
    }
  }

  const handleRemove = (item: CartItem) => {
    if (isAuthenticated) {
      removeMutation.mutate(item.id)
    } else {
      removeItem(item.id)
      toast.success('Đã xóa sản phẩm')
    }
  }

  const subtotal = total()
  const shipping = subtotal >= FREE_SHIP_THRESHOLD ? 0 : 30000
  const grandTotal = subtotal + shipping

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-6 px-6 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-20 h-20 rounded-full bg-beige flex items-center justify-center">
            <ShoppingBag size={36} className="text-muted-gray" />
          </div>
          <h2 className="font-serif text-2xl text-dark-text">Giỏ hàng trống</h2>
          <p className="font-sans text-sm text-muted-gray text-center max-w-xs">
            Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá bộ sưu tập của chúng tôi.
          </p>
          <Link to="/products" className="btn-gold px-10 py-3 flex items-center gap-2">
            Mua sắm ngay <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-beige border-b border-soft-gray py-10 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gold text-xs tracking-[0.4em] uppercase font-sans mb-2">Mua sắm</p>
          <h1 className="section-title">Giỏ Hàng ({count()} sản phẩm)</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Cart items */}
          <div className="lg:col-span-2">
            {/* Shipping notice */}
            {subtotal < FREE_SHIP_THRESHOLD && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50 border border-amber-200 rounded-sm p-4 mb-6 flex items-center gap-3"
              >
                <Truck size={16} className="text-amber-600 shrink-0" />
                <p className="font-sans text-sm text-amber-700">
                  Mua thêm{' '}
                  <strong>{formatPrice(FREE_SHIP_THRESHOLD - subtotal)}</strong>{' '}
                  để được miễn phí vận chuyển!
                </p>
              </motion.div>
            )}

            <div className="space-y-1">
              <AnimatePresence>
                {items.map((item) => {
                  const price = item.product?.sale_price ?? item.product?.price ?? 0
                  const img =
                    item.product?.images?.[0] ||
                    'https://images.unsplash.com/photo-1586495777744-4e6232bf2f8f?w=400'

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex gap-5 bg-white p-5 border border-soft-gray"
                    >
                      {/* Product image */}
                      <Link to={`/products/${item.product?.slug}`} className="shrink-0">
                        <img
                          src={img}
                          alt={item.product?.name}
                          className="w-24 h-24 object-cover bg-beige"
                        />
                      </Link>

                      {/* Product info */}
                      <div className="flex-1 min-w-0">
                        {item.product?.brand && (
                          <p className="text-[10px] text-gold tracking-widest uppercase font-sans mb-0.5">
                            {item.product.brand}
                          </p>
                        )}
                        <Link
                          to={`/products/${item.product?.slug}`}
                          className="font-sans text-sm font-medium text-dark-text hover:text-gold transition-colors line-clamp-2"
                        >
                          {item.product?.name}
                        </Link>

                        <div className="flex items-center justify-between mt-3">
                          {/* Quantity control */}
                          <div className="flex items-center border border-soft-gray">
                            <button
                              onClick={() => handleQuantityChange(item, -1)}
                              disabled={item.quantity <= 1}
                              className="w-8 h-8 flex items-center justify-center hover:bg-soft-gray transition-colors disabled:opacity-40"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-9 text-center font-sans text-sm text-dark-text">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(item, 1)}
                              disabled={item.quantity >= (item.product?.stock || 99)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-soft-gray transition-colors disabled:opacity-40"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <p className="price-gold text-base">
                              {formatPrice(price * item.quantity)}
                            </p>
                            {item.quantity > 1 && (
                              <p className="text-xs text-muted-gray font-sans">
                                {formatPrice(price)} / cái
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => handleRemove(item)}
                        disabled={removeMutation.isPending}
                        className="self-start text-muted-gray hover:text-red-500 transition-colors ml-2 mt-1"
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {/* Continue shopping */}
            <div className="mt-6">
              <Link
                to="/products"
                className="font-sans text-sm text-gold hover:underline flex items-center gap-1"
              >
                ← Tiếp tục mua sắm
              </Link>
            </div>
          </div>

          {/* Order summary sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-beige p-6 sticky top-24">
              <h2 className="font-serif text-xl text-dark-text mb-6">Tóm Tắt Đơn Hàng</h2>

              <div className="space-y-3 font-sans text-sm mb-6">
                <div className="flex justify-between text-dark-text">
                  <span>Tạm tính</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-dark-text">Phí vận chuyển</span>
                  {shipping === 0 ? (
                    <span className="text-green-600 font-medium">Miễn phí</span>
                  ) : (
                    <span className="text-dark-text">{formatPrice(shipping)}</span>
                  )}
                </div>
                <div className="border-t border-soft-gray pt-3 flex justify-between font-semibold text-base">
                  <span className="text-dark-text">Tổng cộng</span>
                  <span className="price-gold">{formatPrice(grandTotal)}</span>
                </div>
              </div>

              {shipping === 0 && (
                <div className="flex items-center gap-2 mb-5 text-green-600">
                  <Truck size={14} />
                  <p className="font-sans text-xs">Bạn được miễn phí vận chuyển!</p>
                </div>
              )}

              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    toast.error('Vui lòng đăng nhập để thanh toán')
                    navigate('/login')
                    return
                  }
                  navigate('/checkout')
                }}
                className="btn-gold w-full py-4 flex items-center justify-center gap-2"
              >
                TIẾN HÀNH THANH TOÁN <ArrowRight size={16} />
              </button>

              <p className="font-sans text-xs text-muted-gray text-center mt-4">
                Giao hàng toàn quốc · Đổi trả trong 30 ngày
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
