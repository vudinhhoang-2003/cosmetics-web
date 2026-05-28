import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { CreditCard, Wallet, MapPin, ChevronRight, Truck } from 'lucide-react'
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

type PaymentMethod = 'COD' | 'e-wallet'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, total, clearCart } = useCartStore()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutForm>()

  const subtotal = total()
  const shipping = subtotal >= FREE_SHIP_THRESHOLD ? 0 : 30000
  const grandTotal = subtotal + shipping

  const onSubmit = async (data: CheckoutForm) => {
    if (items.length === 0) {
      toast.error('Giỏ hàng của bạn đang trống')
      return
    }
    setIsSubmitting(true)
    try {
      const res = await orderApi.create({
        shipping_address: {
          full_name: data.full_name,
          phone: data.phone,
          address: data.address,
          district: data.district,
          city: data.city,
          note: data.note || undefined,
        },
        payment_method: paymentMethod,
      })
      clearCart()
      toast.success('Đặt hàng thành công!')
      navigate(`/order/success?id=${res.data.id}`)
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Đặt hàng thất bại. Vui lòng thử lại.'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (items.length === 0) {
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
                      Quận/Huyện <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('district', { required: 'Vui lòng nhập quận/huyện' })}
                      placeholder="Quận 1"
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
                      placeholder="Số nhà, tên đường, phường/xã..."
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
                    <select
                      {...register('city', { required: 'Vui lòng chọn tỉnh/thành phố' })}
                      className="input-field w-full bg-white cursor-pointer"
                    >
                      <option value="">-- Chọn tỉnh/thành phố --</option>
                      {CITIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
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

                  {/* E-wallet */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('e-wallet')}
                    className={`flex items-center gap-4 p-5 border-2 transition-all text-left ${
                      paymentMethod === 'e-wallet'
                        ? 'border-gold bg-gold/5'
                        : 'border-soft-gray hover:border-gold/50'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        paymentMethod === 'e-wallet' ? 'border-gold' : 'border-muted-gray'
                      }`}
                    >
                      {paymentMethod === 'e-wallet' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-gold" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Wallet size={16} className="text-gold" />
                        <p className="font-sans text-sm font-semibold text-dark-text">Ví điện tử</p>
                      </div>
                      <p className="font-sans text-xs text-muted-gray">MoMo, ZaloPay, VNPay</p>
                    </div>
                  </button>
                </div>

                {paymentMethod === 'e-wallet' && (
                  <div className="mt-4 bg-amber-50 border border-amber-200 p-3 rounded-sm">
                    <p className="font-sans text-xs text-amber-700">
                      Bạn sẽ được chuyển hướng đến cổng thanh toán sau khi đặt hàng.
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
                  {items.map((item) => {
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
                          <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-gold text-white text-[10px] font-bold rounded-full flex items-center justify-center w-5 h-5">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-sans text-xs text-dark-text line-clamp-2 leading-snug">
                            {item.product?.name}
                          </p>
                          <p className="price-gold text-sm mt-1">{formatPrice(price * item.quantity)}</p>
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
