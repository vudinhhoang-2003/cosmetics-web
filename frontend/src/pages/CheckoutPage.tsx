import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard, Wallet, MapPin, ChevronRight, Truck, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { orderApi } from '../api/endpoints'
import { useCartStore } from '../store/cartStore'
import type { ShippingAddress } from '../types'
import { formatPrice } from '../utils/format'

const FREE_SHIP_THRESHOLD = 500000

const CITIES = [
  'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng',
  'Nha Trang', 'Huế', 'Vũng Tàu', 'Đà Lạt', 'Biên Hòa',
  'Quy Nhơn', 'Nam Định', 'Vinh', 'Thái Nguyên', 'Bắc Ninh',
]

interface CheckoutForm extends ShippingAddress {}

type PaymentMethod = 'COD' | 'online'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { items, clearCart, setItems } = useCartStore()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<CheckoutForm>()

  // Quản lý việc đóng mở Custom City Dropdown và theo dõi giá trị thành phố được chọn
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false)
  const selectedCity = watch('city')

  // Lấy các sản phẩm được chọn từ giỏ hàng để mang đi thanh toán (truyền qua state từ CartPage)
  const selectedItemIds = location.state?.selectedItemIds as string[] | undefined
  const checkoutItems = selectedItemIds
    ? items.filter((item) => selectedItemIds.includes(item.id))
    : items

  // Tính tổng tiền tạm tính chỉ dựa trên các sản phẩm được chọn thanh toán
  const subtotal = checkoutItems.reduce((sum, item) => {
    const price = item.product?.sale_price ?? item.product?.price ?? 0
    return sum + price * item.quantity
  }, 0)
  
  // Áp dụng phí giao hàng: 30k nếu tạm tính dưới 500k, ngược lại miễn phí (0k)
  const shipping = subtotal >= FREE_SHIP_THRESHOLD ? 0 : 30000
  const grandTotal = subtotal + shipping

  // Xử lý khi nhấn nút Đặt Hàng
  const onSubmit = async (data: CheckoutForm) => {
    if (checkoutItems.length === 0) {
      toast.error('Không có sản phẩm nào được chọn để thanh toán')
      return
    }
    setIsSubmitting(true)
    try {
      // 1. Gọi API tạo đơn hàng, truyền kèm theo địa chỉ, phương thức và danh sách ID sản phẩm được thanh toán
      const res = await orderApi.create({
        shipping_address: {
          full_name: data.full_name,
          phone: data.phone,
          address: data.address,
          district: data.district,
          city: data.city,
          note: data.note || undefined,
        },
        payment_method: paymentMethod.toLowerCase(),
        cart_item_ids: selectedItemIds,
      })
      
      // 2. Cập nhật giỏ hàng cục bộ (Zustand Store) sau khi tạo đơn hàng thành công
      // Nếu chỉ thanh toán một số sản phẩm, giữ lại các sản phẩm chưa thanh toán trong giỏ hàng. Ngược lại xóa sạch.
      if (selectedItemIds) {
        setItems(items.filter((item) => !selectedItemIds.includes(item.id)))
      } else {
        clearCart()
      }
      
      // 3. Làm mới Cache của React Query để đồng bộ giỏ hàng và danh sách đơn hàng mới nhất từ Server
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      
      toast.success('Đặt hàng thành công!')
      
      // 4. Nếu chọn thanh toán Online qua cổng PayOS, chuyển hướng người dùng sang cổng thanh toán VietQR
      if (res.data.payment_url) {
        window.location.href = res.data.payment_url
      } else {
        // Nếu chọn COD, chuyển hướng trực tiếp sang trang thông báo đặt hàng thành công
        navigate(`/order/success?id=${res.data.id}`)
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Đặt hàng thất bại. Vui lòng thử lại.'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (checkoutItems.length === 0) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="font-serif text-2xl text-dark-text mb-4">Giỏ hàng trống</p>
          <button onClick={() => navigate('/products')} className="btn-gold px-8">
            Mua sắm ngay
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Page header */}
      <div className="bg-beige border-b border-soft-gray py-10 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs font-sans text-muted-gray mb-4 justify-center">
            <span className="text-gold">Giỏ hàng</span>
            <ChevronRight size={12} />
            <span className="text-dark-text font-medium">Thanh toán</span>
          </nav>
          <h1 className="section-title text-center">Thanh Toán</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            {/* Left: Shipping + Payment */}
            <div className="lg:col-span-3 space-y-8">
              {/* Shipping address */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white border border-soft-gray p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-gold text-white flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <h2 className="font-serif text-lg text-dark-text flex items-center gap-2">
                    <MapPin size={16} className="text-gold" />
                    Địa Chỉ Giao Hàng
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label className="block font-sans text-sm text-muted-gray mb-1">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('full_name', { required: 'Vui lòng nhập họ tên' })}
                      placeholder="Nguyễn Văn A"
                      className="input-field w-full"
                    />
                    {errors.full_name && (
                      <p className="text-red-500 text-xs mt-1 font-sans">{errors.full_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-sans text-sm text-muted-gray mb-1">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('phone', {
                        required: 'Vui lòng nhập số điện thoại',
                        pattern: {
                          value: /^(0|\+84)[0-9]{9}$/,
                          message: 'Số điện thoại không hợp lệ',
                        },
                      })}
                      placeholder="0912345678"
                      className="input-field w-full"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-1 font-sans">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-sans text-sm text-muted-gray mb-1">
                      Phường/Xã <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('district', { required: 'Vui lòng nhập phường/xã' })}
                      placeholder="Phường Bến Nghé"
                      className="input-field w-full"
                    />
                    {errors.district && (
                      <p className="text-red-500 text-xs mt-1 font-sans">{errors.district.message}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-sans text-sm text-muted-gray mb-1">
                      Địa chỉ cụ thể <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('address', { required: 'Vui lòng nhập địa chỉ' })}
                      placeholder="Số nhà, tên đường..."
                      className="input-field w-full"
                    />
                    {errors.address && (
                      <p className="text-red-500 text-xs mt-1 font-sans">{errors.address.message}</p>
                    )}
                  </div>

                   <div>
                    <label className="block font-sans text-sm text-muted-gray mb-1">
                      Tỉnh/Thành phố <span className="text-red-500">*</span>
                    </label>
                    <input type="hidden" {...register('city', { required: 'Vui lòng chọn tỉnh/thành phố' })} />
                    
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                        className="w-full flex items-center justify-between px-4 py-3 border border-soft-gray bg-white text-dark-text text-sm font-sans focus:outline-none focus:border-gold transition-colors cursor-pointer text-left"
                      >
                        <span className={selectedCity ? 'text-dark-text' : 'text-muted-gray'}>
                          {selectedCity || '-- Chọn tỉnh/thành phố --'}
                        </span>
                        <ChevronDown size={14} className="text-muted-gray" />
                      </button>

                      <AnimatePresence>
                        {isCityDropdownOpen && (
                          <>
                            {/* Backdrop click to close */}
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setIsCityDropdownOpen(false)}
                            />
                            
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.15 }}
                              className="absolute left-0 right-0 mt-1 bg-[#FAF6F0] border border-gold/15 shadow-xl z-20 max-h-60 overflow-y-auto rounded-none py-1"
                            >
                              <div
                                onClick={() => {
                                  setValue('city', '')
                                  trigger('city')
                                  setIsCityDropdownOpen(false)
                                }}
                                className="px-4 py-2.5 text-sm font-sans text-muted-gray hover:bg-gold/5 hover:text-gold cursor-pointer transition-colors"
                              >
                                -- Chọn tỉnh/thành phố --
                              </div>
                              {CITIES.map((c) => (
                                <div
                                  key={c}
                                  onClick={() => {
                                    setValue('city', c)
                                    trigger('city')
                                    setIsCityDropdownOpen(false)
                                  }}
                                  className={`px-4 py-2.5 text-sm font-sans cursor-pointer transition-colors flex items-center justify-between ${
                                    selectedCity === c
                                      ? 'bg-gold/10 text-gold font-medium'
                                      : 'text-dark-text hover:bg-gold/5 hover:text-gold'
                                  }`}
                                >
                                  <span>{c}</span>
                                  {selectedCity === c && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                                  )}
                                </div>
                              ))}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                    {errors.city && (
                      <p className="text-red-500 text-xs mt-1 font-sans">{errors.city.message}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-sans text-sm text-muted-gray mb-1">
                      Ghi chú đơn hàng (tuỳ chọn)
                    </label>
                    <textarea
                      {...register('note')}
                      rows={3}
                      placeholder="Giao hàng giờ hành chính, để trước cửa..."
                      className="input-field w-full resize-none"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Payment method */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="bg-white border border-soft-gray p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-gold text-white flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <h2 className="font-serif text-lg text-dark-text flex items-center gap-2">
                    <CreditCard size={16} className="text-gold" />
                    Phương Thức Thanh Toán
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* COD */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('COD')}
                    className={`flex items-center gap-4 p-5 border-2 transition-all text-left ${
                      paymentMethod === 'COD'
                        ? 'border-gold bg-gold/5'
                        : 'border-soft-gray hover:border-gold/50'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        paymentMethod === 'COD' ? 'border-gold' : 'border-muted-gray'
                      }`}
                    >
                      {paymentMethod === 'COD' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-gold" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Truck size={16} className="text-gold" />
                        <p className="font-sans text-sm font-semibold text-dark-text">Thanh toán khi nhận hàng</p>
                      </div>
                      <p className="font-sans text-xs text-muted-gray">COD – Trả tiền mặt khi giao hàng</p>
                    </div>
                  </button>

                  {/* Online payment */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('online')}
                    className={`flex items-center gap-4 p-5 border-2 transition-all text-left ${
                      paymentMethod === 'online'
                        ? 'border-gold bg-gold/5'
                        : 'border-soft-gray hover:border-gold/50'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        paymentMethod === 'online' ? 'border-gold' : 'border-muted-gray'
                      }`}
                    >
                      {paymentMethod === 'online' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-gold" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Wallet size={16} className="text-gold" />
                        <p className="font-sans text-sm font-semibold text-dark-text">Chuyển khoản VietQR</p>
                      </div>
                      <p className="font-sans text-xs text-muted-gray">Quét mã nhanh qua cổng PayOS</p>
                    </div>
                  </button>
                </div>

                {paymentMethod === 'online' && (
                  <div className="mt-4 bg-amber-50 border border-amber-200 p-3 rounded-sm">
                    <p className="font-sans text-xs text-amber-700">
                      Bạn sẽ được chuyển hướng đến cổng thanh toán PayOS để quét mã VietQR.
                    </p>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Right: Order summary */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-beige p-6 sticky top-24"
              >
                <h2 className="font-serif text-lg text-dark-text mb-6">Đơn Hàng Của Bạn</h2>

                {/* Items list */}
                <div className="space-y-4 mb-6 max-h-72 overflow-y-auto pr-1">
                  {checkoutItems.map((item) => {
                    const price = item.product?.sale_price ?? item.product?.price ?? 0
                    return (
                      <div key={item.id} className="flex gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={
                              item.product?.images?.[0] ||
                              'https://images.unsplash.com/photo-1586495777744-4e6232bf2f8f?w=200'
                            }
                            alt={item.product?.name}
                            className="w-14 h-14 object-cover bg-white"
                          />
                          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gold text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-sans text-xs text-dark-text line-clamp-2 leading-snug">
                            {item.product?.name}
                          </p>
                          <div className="flex justify-between items-center mt-1">
                            <span className="font-sans text-xs text-muted-gray">Số lượng: {item.quantity}</span>
                            <p className="price-gold text-sm">{formatPrice(price * item.quantity)}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Pricing breakdown */}
                <div className="border-t border-soft-gray pt-4 space-y-2 font-sans text-sm mb-6">
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

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-gold w-full py-4 text-sm tracking-widest disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    'ĐẶT HÀNG'
                  )}
                </button>

                <p className="font-sans text-xs text-muted-gray text-center mt-3 leading-relaxed">
                  Bằng cách đặt hàng, bạn đồng ý với{' '}
                  <span className="text-gold cursor-pointer hover:underline">Điều khoản dịch vụ</span>{' '}
                  của chúng tôi.
                </p>
              </motion.div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
