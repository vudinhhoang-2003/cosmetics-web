import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, ShoppingBag, ClipboardList, ShieldCheck } from 'lucide-react'

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams()
  const orderCode = searchParams.get('order_code')
  const orderId = searchParams.get('order_id')

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6 py-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="bg-white border border-soft-gray p-10 md:p-16 max-w-lg w-full text-center"
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-500/20"
        >
          <CheckCircle size={40} className="text-white" />
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="font-serif text-3xl text-dark-text mb-3">Thanh Toán Thành Công!</h1>
          <p className="font-sans text-muted-gray leading-relaxed mb-6">
            Giao dịch chuyển khoản trực tuyến qua cổng <span className="text-gold font-semibold">PayOS</span> của bạn đã hoàn tất.
            Đơn hàng đang được chuẩn bị và sẽ sớm được vận chuyển đến bạn.
          </p>
        </motion.div>

        {/* Order specs */}
        {orderCode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-beige border border-soft-gray p-4 mb-8"
          >
            <p className="font-sans text-xs text-muted-gray uppercase tracking-widest mb-1">
              Mã giao dịch đơn hàng
            </p>
            <p className="font-serif text-lg text-dark-text font-semibold tracking-wide">
              #{orderCode}
            </p>
            <p className="font-sans text-xs text-muted-gray mt-1 flex items-center justify-center gap-1">
              <ShieldCheck size={12} className="text-emerald-600" />
              Thanh toán trực tuyến bảo mật bởi PayOS
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
            'Hệ thống tự động ghi nhận thanh toán hoàn tất.',
            'Đơn hàng sẽ được chuyển sang bộ phận đóng gói và bàn giao đối tác vận chuyển trong 24 giờ.',
            'Bạn có thể theo dõi hành trình đơn hàng tại trang cá nhân.',
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
            to={orderId ? `/account?order_id=${orderId}` : (orderCode ? `/account?order_code=${orderCode}` : '/account')}
            className="btn-navy flex items-center justify-center gap-2 py-3 flex-1"
          >
            <ClipboardList size={16} />
            Lịch sử mua hàng
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
