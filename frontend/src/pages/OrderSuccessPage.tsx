// File: frontend/src/pages/OrderSuccessPage.tsx
// Nhiệm vụ: Trang thông báo đặt hàng COD thành công, cung cấp mã đơn hàng, thời gian đặt và các bước tiếp theo cho khách hàng.

import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, ShoppingBag, ClipboardList } from 'lucide-react'

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('id')

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6 py-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="bg-white border border-soft-gray p-10 md:p-16 max-w-lg w-full text-center"
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-full bg-gold flex items-center justify-center mx-auto mb-8"
        >
          <CheckCircle size={40} className="text-white" />
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="font-serif text-3xl text-dark-text mb-3">Đặt Hàng Thành Công!</h1>
          <p className="font-sans text-muted-gray leading-relaxed mb-6">
            Cảm ơn bạn đã tin tưởng và mua sắm tại{' '}
            <span className="text-gold font-semibold">Luxe Beauty</span>.
            Đơn hàng của bạn đã được xác nhận và đang được xử lý.
          </p>
        </motion.div>

        {/* Order ID */}
        {orderId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-beige border border-soft-gray p-4 mb-8"
          >
            <p className="font-sans text-xs text-muted-gray uppercase tracking-widest mb-1">
              Mã đơn hàng
            </p>
            <p className="font-serif text-lg text-dark-text font-semibold tracking-wide">
              #{orderId.slice(0, 8).toUpperCase()}
            </p>
            <p className="font-sans text-xs text-muted-gray mt-1">
              {new Date().toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </motion.div>
        )}

        {/* Info steps */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-left space-y-3 mb-8"
        >
          {[
            'Xác nhận đơn hàng qua email trong vòng 30 phút.',
            'Đơn hàng sẽ được giao trong 2-5 ngày làm việc.',
            'Theo dõi trạng thái đơn hàng trong mục Tài khoản.',
          ].map((text, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-gold/20 text-gold text-[10px] font-bold flex items-center justify-center mt-0.5 shrink-0">
                {i + 1}
              </span>
              <p className="font-sans text-sm text-muted-gray">{text}</p>
            </div>
          ))}
        </motion.div>

        {/* Divider */}
        <div className="w-12 h-0.5 bg-gold mx-auto mb-8" />

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link
            to={orderId ? `/account?order_id=${orderId}` : '/account'}
            className="btn-navy flex items-center justify-center gap-2 py-3 flex-1"
          >
            <ClipboardList size={16} />
            Xem đơn hàng
          </Link>
          <Link
            to="/products"
            className="btn-outline flex items-center justify-center gap-2 py-3 flex-1"
          >
            <ShoppingBag size={16} />
            Tiếp tục mua sắm
          </Link>
        </motion.div>

        {/* Back home */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="font-sans text-xs text-muted-gray mt-6"
        >
          <Link to="/" className="text-gold hover:underline">← Về trang chủ</Link>
        </motion.p>
      </motion.div>
    </div>
  )
}
