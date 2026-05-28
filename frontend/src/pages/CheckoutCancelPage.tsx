import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { XCircle, ShoppingBag, ArrowLeft, ShieldAlert } from 'lucide-react'

export default function CheckoutCancelPage() {
  const [searchParams] = useSearchParams()
  const orderCode = searchParams.get('order_code')

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6 py-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="bg-white border border-soft-gray p-10 md:p-16 max-w-lg w-full text-center"
      >
        {/* Cancel icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-full bg-rose-500 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-rose-500/20"
        >
          <XCircle size={40} className="text-white" />
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="font-serif text-3xl text-dark-text mb-3">Thanh Toán Thất Bại</h1>
          <p className="font-sans text-muted-gray leading-relaxed mb-6">
            Giao dịch chuyển khoản trực tuyến qua cổng <span className="text-gold font-semibold">PayOS</span> đã bị hủy bỏ hoặc không thể hoàn thành.
            Bạn đừng lo lắng, tiền của bạn vẫn chưa bị trừ.
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
              Mã giao dịch bị hủy
            </p>
            <p className="font-serif text-lg text-dark-text font-semibold tracking-wide">
              #{orderCode}
            </p>
            <p className="font-sans text-xs text-muted-gray mt-1 flex items-center justify-center gap-1">
              <ShieldAlert size={12} className="text-rose-600" />
              Giao dịch đã kết thúc tự động
            </p>
          </motion.div>
        )}

        {/* Support items */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-left space-y-3 mb-8 bg-[#FFF5F5] border border-red-100 p-4 rounded-sm"
        >
          <p className="font-sans text-xs font-semibold text-rose-800 uppercase tracking-wider mb-2">Các gợi ý giải quyết:</p>
          {[
            'Kiểm tra lại kết nối mạng của điện thoại / thiết bị di động.',
            'Đảm bảo số dư trong tài khoản ngân hàng đủ thực hiện thanh toán.',
            'Bạn có thể vào lịch sử mua hàng để lấy lại link thanh toán hoặc chuyển sang thanh toán COD khi nhận hàng.',
          ].map((text, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <p className="font-sans text-xs text-rose-700 leading-normal">{text}</p>
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
            to="/cart"
            className="btn-navy flex items-center justify-center gap-2 py-3 flex-1"
          >
            <ArrowLeft size={16} />
            Quay về giỏ hàng
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
