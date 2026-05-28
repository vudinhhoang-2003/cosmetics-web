import { useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { authApi } from '../api/endpoints'
import { useAuthStore } from '../store/authStore'

interface LoginForm {
  email: string
  password: string
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuth, isAuthenticated } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const from = (location.state as { from?: string })?.from || '/'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>()

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true })
  }, [isAuthenticated])

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const res = await authApi.login(data.email, data.password)
      const { access_token, refresh_token, user } = res.data
      setAuth(user, access_token, refresh_token)
      toast.success(`Xin chào, ${user.full_name || user.email}!`)
      navigate(user.role === 'admin' ? '/admin' : from, { replace: true })
    } catch (err: any) {
      const status = err?.response?.status
      let msg = 'Đã có lỗi xảy ra. Vui lòng thử lại.'
      if (status === 401) msg = 'Email hoặc mật khẩu không đúng.'
      else if (status === 403) msg = 'Tài khoản đã bị vô hiệu hóa.'
      toast.error(msg)
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
        {/* Logo */}
        <div className="text-center mb-10">
          <Link to="/">
            <h1 className="font-serif text-3xl text-dark-text tracking-widest">LUXE BEAUTY</h1>
            <div className="w-12 h-0.5 bg-gold mx-auto mt-2" />
          </Link>
          <p className="font-sans text-sm text-muted-gray mt-4">
            Đăng nhập để trải nghiệm mua sắm cao cấp
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
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

          {/* Password */}
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

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-gold w-full py-3.5 mt-2 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang đăng nhập...
              </>
            ) : (
              'ĐĂNG NHẬP'
            )}
          </button>
        </form>

        {/* Footer links */}
        <div className="mt-8 text-center space-y-3">
          <p className="font-sans text-sm text-muted-gray">
            Chưa có tài khoản?{' '}
            <Link
              to="/register"
              state={{ from }}
              className="text-gold hover:underline font-medium"
            >
              Đăng ký ngay
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
