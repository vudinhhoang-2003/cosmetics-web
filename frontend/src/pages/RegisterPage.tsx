import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '../api/endpoints'
import { useAuthStore } from '../store/authStore'

interface RegisterForm {
  full_name: string
  email: string
  phone: string
  password: string
  confirm_password: string
}

export default function RegisterPage() {
  /**
   * Trang Đăng Ký Tài Khoản Khách Hàng.
   * - Hỗ trợ xác thực form: họ tên, email hợp lệ, sđt Việt Nam và độ dài mật khẩu.
   * - Tự động so sánh Password và Confirm Password thời gian thực (watch).
   * - Hiển thị vệt màu chỉ báo độ mạnh/yếu của mật khẩu đang nhập.
   * - Đăng ký thành công sẽ nhận được JWT Token từ server và tự động đăng nhập luôn (auto login).
   */
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuth, isAuthenticated } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)     // Ẩn/hiện mật khẩu
  const [showConfirm, setShowConfirm] = useState(false)       // Ẩn/hiện mật khẩu xác nhận
  const [isLoading, setIsLoading] = useState(false)           // Trạng thái chờ gọi API đăng ký

  const from = (location.state as { from?: string })?.from || '/'

  // Khởi tạo react-hook-form
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>()

  // Tự động chuyển hướng về trang cũ nếu người dùng đã đăng nhập sẵn
  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true })
  }, [isAuthenticated])

  // Xử lý gửi biểu mẫu đăng ký
  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    try {
      // Gửi API tạo người dùng mới
      const res = await authApi.register({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        phone: data.phone || undefined,
      })
      const { access_token, refresh_token, user } = res.data
      
      // Đăng nhập tự động ngay sau khi đăng ký thành công
      setAuth(user, access_token, refresh_token)
      toast.success('Đăng ký thành công! Chào mừng bạn đến với Luxe Beauty.')
      navigate(from, { replace: true })
    } catch (err: any) {
      const detail = err?.response?.data?.detail
      if (typeof detail === 'string') {
        toast.error(detail)
      } else {
        toast.error('Đăng ký thất bại. Email có thể đã được sử dụng.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-beige flex items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white border border-soft-gray w-full max-w-md p-10"
      >
        {/* Tiêu đề & Logo */}
        <div className="text-center mb-10">
          <Link to="/">
            <h1 className="font-serif text-3xl text-dark-text tracking-widest">LUXE BEAUTY</h1>
            <div className="w-12 h-0.5 bg-gold mx-auto mt-2" />
          </Link>
          <p className="font-sans text-sm text-muted-gray mt-4">
            Tạo tài khoản để bắt đầu trải nghiệm
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nhập Họ và tên */}
          <div>
            <label className="font-sans text-sm text-muted-gray mb-1.5 block">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-gray" />
              <input
                {...register('full_name', {
                  required: 'Vui lòng nhập họ tên',
                  minLength: { value: 2, message: 'Họ tên ít nhất 2 ký tự' },
                })}
                placeholder="Nguyễn Văn A"
                className="input-field pl-10 w-full"
              />
            </div>
            {errors.full_name && (
              <p className="text-red-500 text-xs mt-1 font-sans">{errors.full_name.message}</p>
            )}
          </div>

          {/* Nhập Email */}
          <div>
            <label className="font-sans text-sm text-muted-gray mb-1.5 block">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-gray" />
              <input
                type="email"
                {...register('email', {
                  required: 'Vui lòng nhập email',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Email không hợp lệ',
                  },
                })}
                placeholder="you@example.com"
                className="input-field pl-10 w-full"
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1 font-sans">{errors.email.message}</p>
            )}
          </div>

          {/* Nhập Số điện thoại */}
          <div>
            <label className="font-sans text-sm text-muted-gray mb-1.5 block">
              Số điện thoại (tuỳ chọn)
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-gray" />
              <input
                {...register('phone', {
                  pattern: {
                    value: /^(0|\+84)[0-9]{9}$/,
                    message: 'Số điện thoại không hợp lệ',
                  },
                })}
                placeholder="0912345678"
                className="input-field pl-10 w-full"
              />
            </div>
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1 font-sans">{errors.phone.message}</p>
            )}
          </div>

          {/* Nhập Mật khẩu */}
          <div>
            <label className="font-sans text-sm text-muted-gray mb-1.5 block">
              Mật khẩu <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-gray" />
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password', {
                  required: 'Vui lòng nhập mật khẩu',
                  minLength: { value: 6, message: 'Mật khẩu ít nhất 6 ký tự' },
                })}
                placeholder="••••••••"
                className="input-field pl-10 pr-10 w-full"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-gray hover:text-dark-text"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1 font-sans">{errors.password.message}</p>
            )}
          </div>

          {/* Xác nhận lại mật khẩu */}
          <div>
            <label className="font-sans text-sm text-muted-gray mb-1.5 block">
              Xác nhận mật khẩu <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-gray" />
              <input
                type={showConfirm ? 'text' : 'password'}
                {...register('confirm_password', {
                  required: 'Vui lòng xác nhận mật khẩu',
                  validate: (val) =>
                    val === watch('password') || 'Mật khẩu xác nhận không khớp',
                })}
                placeholder="••••••••"
                className="input-field pl-10 pr-10 w-full"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-gray hover:text-dark-text"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirm_password && (
              <p className="text-red-500 text-xs mt-1 font-sans">{errors.confirm_password.message}</p>
            )}
          </div>

          {/* Chỉ báo độ mạnh yếu của mật khẩu */}
          {watch('password') && (
            <div className="flex gap-1 mt-1">
              {[1, 2, 3].map((level) => (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    watch('password').length >= level * 4
                      ? level === 1
                        ? 'bg-red-400'
                        : level === 2
                        ? 'bg-amber-400'
                        : 'bg-green-400'
                      : 'bg-soft-gray'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Nút bấm Đăng ký */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-gold w-full py-3.5 mt-2 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang đăng ký...
              </>
            ) : (
              'TẠO TÀI KHOẢN'
            )}
          </button>
        </form>

        {/* Liên kết quay về Đăng nhập */}
        <div className="mt-8 text-center space-y-3">
          <p className="font-sans text-sm text-muted-gray">
            Đã có tài khoản?{' '}
            <Link
              to="/login"
              state={{ from }}
              className="text-gold hover:underline font-medium"
            >
              Đăng nhập
            </Link>
          </p>
          <Link to="/" className="font-sans text-xs text-muted-gray hover:text-gold transition-colors block">
            ← Quay về trang chủ
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

