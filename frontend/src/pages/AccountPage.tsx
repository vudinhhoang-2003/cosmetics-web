import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { User, Package, ChevronRight, Lock, Phone, UserCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { userApi, orderApi } from '../api/endpoints'
import { useAuthStore } from '../store/authStore'
import type { Order } from '../types'
import { formatPrice } from '../utils/format'

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
  const [tab, setTab] = useState<Tab>('profile')
  const { user, setAuth, accessToken, refreshToken } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => userApi.me().then((r) => r.data),
  })

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => orderApi.list(0, 50).then((r) => r.data),
    enabled: tab === 'orders',
  })

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

  const {
    register: regPwd,
    handleSubmit: handlePwd,
    watch,
    reset: resetPwd,
    formState: { errors: pwdErrors },
  } = useForm<PasswordForm>()

  const profileMutation = useMutation({
    mutationFn: (data: ProfileForm) => userApi.update(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      setAuth(res.data, accessToken!, refreshToken!)
      toast.success('Cập nhật thông tin thành công')
    },
    onError: () => toast.error('Không thể cập nhật thông tin'),
  })

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
                              {new Date(order.created_at).toLocaleDateString('vi-VN')}
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
                              <Link
                                to="/account"
                                className="flex items-center gap-1 text-gold hover:underline text-xs whitespace-nowrap"
                              >
                                Chi tiết <ChevronRight size={12} />
                              </Link>
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
    </div>
  )
}
