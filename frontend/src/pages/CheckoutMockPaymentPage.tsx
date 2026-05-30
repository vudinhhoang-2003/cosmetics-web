import { useSearchParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, QrCode, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api/axios'
import { formatPrice } from '../utils/format'

export default function CheckoutMockPaymentPage() {
  /**
   * Cổng thanh toán giả lập PayOS (VietQR) dành cho lập trình viên/thử nghiệm.
   * - Hiển thị mã QR VietQR tượng trưng.
   * - Nút "Xác nhận đã quét & pay thành công" sẽ gọi API giả lập chuyển khoản `/payment/simulate-success` ở Backend để cập nhật trạng thái đơn hàng.
   * - Nút "Hủy bỏ giao dịch" sẽ chuyển hướng về trang `/checkout/cancel` để hủy đơn hàng và hoàn lại tồn kho.
   */
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const orderCode = searchParams.get('orderCode')
  const amount = searchParams.get('amount')
  const [isLoading, setIsLoading] = useState(false)

  // Gọi API backend để chuyển trạng thái đơn hàng sang đã thanh toán (confirmed)
  const handleSimulateSuccess = async () => {
    setIsLoading(true)
    try {
      await api.post(`/payment/simulate-success?order_code=${orderCode}`)
      toast.success('Giả lập thanh toán thành công!')
      navigate(`/checkout/success?order_code=${orderCode}`)
    } catch {
      toast.error('Có lỗi xảy ra khi giả lập thanh toán')
    } finally {
      setIsLoading(false)
    }
  }

  // Hủy giao dịch giả lập, chuyển hướng về trang cancel để backend khôi phục hàng
  const handleCancel = () => {
    toast.error('Giao dịch đã bị hủy')
    navigate(`/checkout/cancel?order_code=${orderCode}`)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-slate-900 border border-slate-800 p-8 md:p-12 max-w-md w-full text-center shadow-2xl relative overflow-hidden rounded-2xl"
      >
        {/* Điểm nhấn vệt sáng neon sang trọng */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#C9A96E]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl animate-pulse" />

        <div className="flex justify-center items-center gap-2 mb-8">
          <ShieldCheck className="text-[#C9A96E] shrink-0" size={24} />
          <span className="font-sans text-[10px] tracking-[0.3em] text-slate-400 uppercase font-semibold">
            PayOS Simulation Portal
          </span>
        </div>

        <h1 className="font-serif text-2xl text-[#C9A96E] mb-6 tracking-wide">LUXE BEAUTY</h1>

        {/* Thông số hóa đơn chi tiết */}
        <div className="bg-slate-950/60 border border-slate-800/60 p-5 rounded-xl space-y-3 mb-8">
          <div className="flex justify-between items-center text-xs font-sans text-slate-400">
            <span>Mã đơn hàng:</span>
            <span className="text-white font-mono font-semibold">#{orderCode}</span>
          </div>
          <div className="flex justify-between items-center text-xs font-sans text-slate-400">
            <span>Số tiền thanh toán:</span>
            <span className="text-[#C9A96E] font-sans font-bold text-base">{formatPrice(Number(amount))}</span>
          </div>
        </div>

        {/* VietQR Mock Code */}
        <div className="relative inline-block p-4 bg-white rounded-2xl mb-8 shadow-inner group">
          <div className="w-48 h-48 flex items-center justify-center bg-slate-100 rounded-xl relative overflow-hidden">
            <QrCode size={140} className="text-slate-900" />
            <div className="absolute inset-0 bg-[#C9A96E]/5 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <span className="bg-slate-900/90 text-[#C9A96E] text-[8px] font-sans tracking-widest px-2.5 py-1.5 uppercase font-bold rounded shadow border border-[#C9A96E]/30">
                VietQR Scan Pay
              </span>
            </div>
          </div>
        </div>

        <p className="font-sans text-xs text-slate-400 leading-relaxed mb-8 max-w-xs mx-auto">
          Đây là chế độ **Giả lập Cổng thanh toán PayOS**. Nhấp nút dưới đây để hoàn tất giả lập giao dịch một cách nhanh chóng!
        </p>

        {/* Các nút hành động */}
        <div className="space-y-4">
          <button
            onClick={handleSimulateSuccess}
            disabled={isLoading}
            className="w-full bg-[#C9A96E] hover:bg-[#b0915a] text-slate-900 font-sans text-xs tracking-widest font-bold py-4 uppercase rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            XÁC NHẬN ĐÃ QUÉT & PAY THÀNH CÔNG
          </button>

          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="w-full bg-transparent hover:bg-slate-800/50 border border-slate-700 text-slate-300 font-sans text-xs tracking-widest font-bold py-4 uppercase rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <XCircle size={16} />
            HỦY BỎ GIAO DỊCH
          </button>
        </div>
      </motion.div>
    </div>
  )
}
