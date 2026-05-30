// File: frontend/src/pages/admin/AdminLoginPage.tsx
// Nhiệm vụ: Trang đăng nhập độc lập dành cho Quản trị viên (Super Admin / Admin), kiểm tra quyền 'admin' trước khi cho phép điều hướng vào trang quản lý.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { authApi } from '../../api/endpoints'
import { useAdminAuthStore } from '../../store/authStore'


interface LoginForm {
  email: string
  password: string
}

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { setAuth, isAuthenticated, isAdmin } = useAdminAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()

  useEffect(() => {
    if (isAuthenticated && isAdmin()) navigate('/admin', { replace: true })
  }, [isAuthenticated])

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    setErrorMsg('')
    try {
      const res = await authApi.login(data.email, data.password)
      const { access_token, refresh_token, user } = res.data
      if (user.role !== 'admin') {
        setErrorMsg('Tài khoản không có quyền truy cập trang quản trị.')
        return
      }
      setAuth(user, access_token, refresh_token)
      navigate('/admin', { replace: true })
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 401) setErrorMsg('Email hoặc mật khẩu không đúng.')
      else if (status === 403) setErrorMsg('Tài khoản đã bị vô hiệu hóa.')
      else setErrorMsg('Đã có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#1e293b] border border-[#334155] mb-4">
            <ShieldCheck size={26} className="text-[#C9A96E]" />
          </div>
          <h1 className="text-white text-2xl font-semibold tracking-wide">Quản trị hệ thống</h1>
          <p className="text-[#64748b] text-sm mt-1">Luxe Beauty Admin Panel</p>
        </div>

        {/* Form */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-8 space-y-5">
          {/* Email */}
          <div>
            <label className="block text-xs text-[#94a3b8] mb-1.5 uppercase tracking-wider">
              Email
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />
              <input
                type="email"
                {...register('email', {
                  required: 'Vui lòng nhập email',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email không hợp lệ' },
                })}
                placeholder="admin@example.com"
                className="w-full bg-[#0f172a] border border-[#334155] text-white placeholder-[#475569] rounded px-3 py-2.5 pl-9 text-sm focus:outline-none focus:border-[#C9A96E] transition-colors"
              />
            </div>
            {errors.email && (
              <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs text-[#94a3b8] mb-1.5 uppercase tracking-wider">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password', { required: 'Vui lòng nhập mật khẩu' })}
                placeholder="••••••••"
                className="w-full bg-[#0f172a] border border-[#334155] text-white placeholder-[#475569] rounded px-3 py-2.5 pl-9 pr-9 text-sm focus:outline-none focus:border-[#C9A96E] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#94a3b8] transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Error message */}
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 rounded px-3 py-2.5 text-red-400 text-sm">
              {errorMsg}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isLoading}
            className="w-full bg-[#C9A96E] hover:bg-[#b8954f] disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded transition-colors flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang đăng nhập...
              </>
            ) : (
              'Đăng nhập'
            )}
          </button>
        </div>

        {/* Back link */}
        <p className="text-center mt-5 text-xs text-[#475569]">
          <a href="/" className="hover:text-[#94a3b8] transition-colors">
            ← Quay về trang khách hàng
          </a>
        </p>
      </motion.div>
    </div>
  )
}
