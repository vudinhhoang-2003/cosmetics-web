// File: frontend/src/pages/AccountPage.tsx
// Nhiệm vụ: Trang cá nhân của khách hàng, cho phép quản lý thông tin cá nhân, đổi mật khẩu, xem lịch sử đặt hàng và trạng thái đơn hàng.

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Package, ChevronRight, Lock, Phone, UserCircle, X } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { userApi, orderApi } from '../api/endpoints'
import { useAuthStore } from '../store/authStore'
import type { Order } from '../types'
import { formatPrice, formatDateTime } from '../utils/format'


type Tab = 'profile' | 'orders'

interface ProfileForm {
  full_name: string
  phone: string
}

interface PasswordForm {
  password: string
  confirm_password: string
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chờ xác nhận', color: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700' },
  shipping: { label: 'Đang giao', color: 'bg-indigo-100 text-indigo-700' },
  delivered: { label: 'Đã giao', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-600' },
}

export default function AccountPage() {
  // Tab hiện tại: 'profile' (Thông tin) hoặc 'orders' (Đơn hàng)
  const [tab, setTab] = useState<Tab>('profile')
  // Đơn hàng đang chọn để hiển thị trên Modal chi tiết
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  
  // Lấy thông tin tài khoản và hàm cập nhật auth từ Zustand store
  const { user, setAuth, accessToken, refreshToken } = useAuthStore()
  const queryClient = useQueryClient()

  // Tải thông tin tài khoản người dùng từ backend
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => userApi.me().then((r) => r.data),
  })

  // Tải danh sách đơn hàng cá nhân (chỉ thực hiện khi người dùng chuyển sang tab Đơn hàng)
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => orderApi.list(0, 50).then((r) => r.data),
    enabled: tab === 'orders',
  })

  // 1. Phân tích các query parameter từ URL (ví dụ: ?order_id=xxx hoặc ?order_code=yyy khi đi từ trang đặt hàng thành công sang)
  const [searchParams] = useSearchParams()
  const queryOrderId = searchParams.get('order_id')
  const queryOrderCode = searchParams.get('order_code')

  // 2. Tự động chuyển hướng hiển thị sang tab "Đơn hàng" (orders) và làm mới cache đơn hàng từ server
  useEffect(() => {
    if (queryOrderId || queryOrderCode) {
      setTab('orders')
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    }
  }, [queryOrderId, queryOrderCode, queryClient])

  // 3. Khi danh sách đơn hàng được nạp xong, tìm kiếm đơn hàng trùng mã và tự động bật Modal chi tiết lên
  useEffect(() => {
    if (orders && (queryOrderId || queryOrderCode)) {
      const found = orders.find(
        (o) =>
          (queryOrderId && o.id === queryOrderId) ||
          (queryOrderCode && String(o.order_code) === queryOrderCode)
      )
      if (found) {
        setSelectedOrder(found) // Gán dữ liệu đơn hàng tìm thấy vào state để mở Modal chi tiết
      }
    }
  }, [orders, queryOrderId, queryOrderCode])

  // Form cập nhật thông tin cá nhân
  const {
    register: regProfile,
    handleSubmit: handleProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileForm>({
    values: {
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
    },
  })

  // Form cập nhật mật khẩu mới
  const {
    register: regPwd,
    handleSubmit: handlePwd,
    watch,
    reset: resetPwd,
    formState: { errors: pwdErrors },
  } = useForm<PasswordForm>()

  // Mutation cập nhật thông tin cá nhân lên database
  const profileMutation = useMutation({
    mutationFn: (data: ProfileForm) => userApi.update(data),
    onSuccess: (res) => {
      // Làm mới dữ liệu profile và cập nhật Zustand store cục bộ
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      setAuth(res.data, accessToken!, refreshToken!)
      toast.success('Cập nhật thông tin thành công')
    },
    onError: () => toast.error('Không thể cập nhật thông tin'),
  })

  // Mutation cập nhật mật khẩu mới lên database
  const passwordMutation = useMutation({

    mutationFn: (data: PasswordForm) => userApi.update({ password: data.password }),
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công')
      resetPwd()
    },
    onError: () => toast.error('Không thể đổi mật khẩu'),
  })

  const onSaveProfile = (data: ProfileForm) => profileMutation.mutate(data)
  const onChangePassword = (data: PasswordForm) => passwordMutation.mutate(data)

  const cancelOrderMutation = useMutation({
    mutationFn: (id: string) => orderApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Hủy đơn hàng thành công')
      setSelectedOrder(null)
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || 'Không thể hủy đơn hàng'
      toast.error(msg)
    },
  })

  const handleCancelOrder = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) {
      cancelOrderMutation.mutate(id)
    }
  }

  const tabs = [
    { key: 'profile' as Tab, label: 'Thông tin cá nhân', icon: User },
    { key: 'orders' as Tab, label: 'Lịch sử đơn hàng', icon: Package },
  ]

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-beige border-b border-soft-gray py-10 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-gold text-xs tracking-[0.4em] uppercase font-sans mb-2">Tài khoản</p>
          <h1 className="section-title">Trang Cá Nhân</h1>
          {profile && (
            <p className="font-sans text-muted-gray text-sm mt-2">
              Xin chào, <span className="text-dark-text font-medium">{profile.full_name || profile.email}</span>!
            </p>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Tabs */}
        <div className="flex border-b border-soft-gray mb-8">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-6 py-3 font-sans text-sm transition-colors relative ${
                tab === key
                  ? 'text-gold font-medium'
                  : 'text-muted-gray hover:text-dark-text'
              }`}
            >
              <Icon size={16} />
              {label}
              {tab === key && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold"
                />
              )}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {tab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {/* Personal info form */}
            <div className="bg-white border border-soft-gray p-6">
              <h2 className="font-serif text-lg text-dark-text mb-5 flex items-center gap-2">
                <UserCircle size={18} className="text-gold" />
                Thông Tin Cá Nhân
              </h2>
              <form onSubmit={handleProfile(onSaveProfile)} className="space-y-4">
                <div>
                  <label className="font-sans text-sm text-muted-gray mb-1 block">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="input-field w-full bg-soft-gray/50 cursor-not-allowed text-muted-gray"
                  />
                </div>

                <div>
                  <label className="font-sans text-sm text-muted-gray mb-1 block">
                    Họ và tên
                  </label>
                  <input
                    {...regProfile('full_name')}
                    placeholder="Nguyễn Văn A"
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="font-sans text-sm text-muted-gray mb-1 block flex items-center gap-1">
                    <Phone size={12} />
                    Số điện thoại
                  </label>
                  <input
                    {...regProfile('phone', {
                      pattern: {
                        value: /^(0|\+84)[0-9]{9}$/,
                        message: 'Số điện thoại không hợp lệ',
                      },
                    })}
                    placeholder="0912345678"
                    className="input-field w-full"
                  />
                  {profileErrors.phone && (
                    <p className="text-red-500 text-xs mt-1 font-sans">{profileErrors.phone.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={profileMutation.isPending}
                  className="btn-gold w-full disabled:opacity-70"
                >
                  {profileMutation.isPending ? 'Đang lưu...' : 'LƯU THAY ĐỔI'}
                </button>
              </form>
            </div>

            {/* Change password form */}
            <div className="bg-white border border-soft-gray p-6">
              <h2 className="font-serif text-lg text-dark-text mb-5 flex items-center gap-2">
                <Lock size={18} className="text-gold" />
                Đổi Mật Khẩu
              </h2>
              <form onSubmit={handlePwd(onChangePassword)} className="space-y-4">
                <div>
                  <label className="font-sans text-sm text-muted-gray mb-1 block">
                    Mật khẩu mới <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    {...regPwd('password', {
                      required: 'Vui lòng nhập mật khẩu mới',
                      minLength: { value: 6, message: 'Tối thiểu 6 ký tự' },
                    })}
                    placeholder="••••••••"
                    className="input-field w-full"
                  />
                  {pwdErrors.password && (
                    <p className="text-red-500 text-xs mt-1 font-sans">{pwdErrors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="font-sans text-sm text-muted-gray mb-1 block">
                    Xác nhận mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    {...regPwd('confirm_password', {
                      required: 'Vui lòng xác nhận mật khẩu',
                      validate: (val) =>
                        val === watch('password') || 'Mật khẩu xác nhận không khớp',
                    })}
                    placeholder="••••••••"
                    className="input-field w-full"
                  />
                  {pwdErrors.confirm_password && (
                    <p className="text-red-500 text-xs mt-1 font-sans">{pwdErrors.confirm_password.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={passwordMutation.isPending}
                  className="btn-navy w-full disabled:opacity-70"
                >
                  {passwordMutation.isPending ? 'Đang đổi...' : 'ĐỔI MẬT KHẨU'}
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* Orders tab */}
        {tab === 'orders' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {ordersLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !orders || orders.length === 0 ? (
              <div className="text-center py-20">
                <Package size={48} className="text-soft-gray mx-auto mb-4" />
                <p className="font-serif text-xl text-dark-text mb-2">Chưa có đơn hàng</p>
                <p className="font-sans text-muted-gray text-sm mb-6">
                  Bạn chưa có đơn hàng nào. Hãy mua sắm ngay!
                </p>
                <Link to="/products" className="btn-gold px-10">Mua sắm ngay</Link>
              </div>
            ) : (
              <div className="bg-white border border-soft-gray overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full font-sans text-sm">
                    <thead>
                      <tr className="bg-beige border-b border-soft-gray">
                        <th className="text-left px-5 py-3 text-xs text-muted-gray uppercase tracking-wider font-medium">
                          Mã đơn
                        </th>
                        <th className="text-left px-5 py-3 text-xs text-muted-gray uppercase tracking-wider font-medium">
                          Ngày đặt
                        </th>
                        <th className="text-left px-5 py-3 text-xs text-muted-gray uppercase tracking-wider font-medium">
                          Trạng thái
                        </th>
                        <th className="text-right px-5 py-3 text-xs text-muted-gray uppercase tracking-wider font-medium">
                          Tổng tiền
                        </th>
                        <th className="px-5 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-soft-gray">
                      {orders.map((order: Order) => {
                        const statusInfo = STATUS_MAP[order.status] || {
                          label: order.status,
                          color: 'bg-gray-100 text-gray-600',
                        }
                        return (
                          <tr key={order.id} className="hover:bg-beige/50 transition-colors">
                            <td className="px-5 py-4">
                              <span className="font-mono text-xs text-dark-text font-semibold">
                                #{order.id.slice(0, 8).toUpperCase()}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-muted-gray">
                              {formatDateTime(order.created_at)}
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}
                              >
                                {statusInfo.label}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <span className="price-gold text-sm font-semibold">
                                {formatPrice(order.total_price)}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="flex items-center gap-1 text-gold hover:underline text-xs whitespace-nowrap"
                              >
                                Chi tiết <ChevronRight size={12} />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white max-w-xl w-full max-h-[85vh] flex flex-col relative shadow-2xl border border-soft-gray overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-soft-gray flex justify-between items-center bg-beige">
                <div>
                  <h3 className="font-serif text-lg text-dark-text">Chi Tiết Đơn Hàng</h3>
                  <p className="font-sans text-[10px] text-muted-gray uppercase tracking-wider mt-0.5">
                    Mã đơn: #{selectedOrder.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-muted-gray hover:text-dark-text transition-colors p-1"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Status & Date */}
                <div className="grid grid-cols-2 gap-4 bg-pearl/50 p-4 border border-soft-gray">
                  <div>
                    <p className="font-sans text-xs text-muted-gray mb-1 uppercase tracking-wider">Trạng thái</p>
                    <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-medium ${
                      STATUS_MAP[selectedOrder.status]?.color || 'bg-gray-100 text-gray-700'
                    }`}>
                      {STATUS_MAP[selectedOrder.status]?.label || selectedOrder.status}
                    </span>
                  </div>
                  <div>
                    <p className="font-sans text-xs text-muted-gray mb-1 uppercase tracking-wider">Ngày đặt hàng</p>
                    <span className="font-sans text-sm text-dark-text">
                      {formatDateTime(selectedOrder.created_at)}
                    </span>
                  </div>
                </div>

                {/* Shipping Info */}
                <div>
                  <h4 className="font-serif text-sm text-dark-text mb-3 uppercase tracking-wider border-b border-soft-gray pb-1.5">
                    Thông tin giao hàng
                  </h4>
                  <div className="space-y-1.5 font-sans text-xs text-muted-gray">
                    <p><strong className="text-dark-text">Người nhận:</strong> {selectedOrder.shipping_address.full_name}</p>
                    <p><strong className="text-dark-text">Số điện thoại:</strong> {selectedOrder.shipping_address.phone}</p>
                    <p>
                      <strong className="text-dark-text">Địa chỉ:</strong>{' '}
                      {selectedOrder.shipping_address.address}, {selectedOrder.shipping_address.district},{' '}
                      {selectedOrder.shipping_address.city}
                    </p>
                    {selectedOrder.shipping_address.note && (
                      <p><strong className="text-dark-text">Ghi chú:</strong> "{selectedOrder.shipping_address.note}"</p>
                    )}
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <h4 className="font-serif text-sm text-dark-text mb-3 uppercase tracking-wider border-b border-soft-gray pb-1.5">
                    Phương thức thanh toán
                  </h4>
                  <p className="font-sans text-xs text-muted-gray">
                    {selectedOrder.payment_method === 'online' ? (
                      <span className="flex items-center gap-1.5 text-emerald-700 font-medium font-sans">
                        Chuyển khoản VietQR (PayOS)
                      </span>
                    ) : (
                      <span>Thanh toán tiền mặt khi nhận hàng (COD)</span>
                    )}
                  </p>
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="font-serif text-sm text-dark-text mb-3 uppercase tracking-wider border-b border-soft-gray pb-1.5">
                    Danh sách sản phẩm
                  </h4>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center gap-4 text-xs font-sans">
                        <div className="flex-1 min-w-0">
                          <p className="text-dark-text font-medium truncate">{item.product_name || 'Sản phẩm'}</p>
                          <p className="text-muted-gray mt-0.5">SL: {item.quantity} x {formatPrice(Number(item.price_at_purchase))}</p>
                        </div>
                        <span className="text-dark-text font-semibold shrink-0">
                          {formatPrice(Number(item.price_at_purchase) * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Total & Actions */}
              <div className="px-6 py-4 border-t border-soft-gray bg-beige flex flex-col sm:flex-row justify-between items-center gap-4 font-sans w-full">
                <div className="flex justify-between w-full sm:w-auto items-center gap-2">
                  <span className="text-sm font-medium text-dark-text uppercase tracking-wider">Tổng giá trị:</span>
                  <span className="price-gold text-lg font-bold">{formatPrice(selectedOrder.total_price)}</span>
                </div>
                {selectedOrder.status === 'pending' && (
                  <button
                    onClick={() => handleCancelOrder(selectedOrder.id)}
                    disabled={cancelOrderMutation.isPending}
                    className="w-full sm:w-auto px-5 py-2 border border-rose-200 hover:border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50"
                  >
                    {cancelOrderMutation.isPending ? 'Đang hủy...' : 'Hủy đơn hàng'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
