import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, ChevronDown, Package, Search, ChevronLeft, ChevronRight,
  CreditCard, User, Phone, MapPin, MessageSquare, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi, orderApi } from '../../api/endpoints'
import type { Order } from '../../types'
import { formatPrice } from '../../utils/format'
import Select from '../../components/Select'
import { useSearchParams } from 'react-router-dom'

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'shipping', label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'cancelled', label: 'Đã hủy' },
]

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chờ xác nhận', color: 'bg-amber-50 text-amber-700 border border-amber-200/50' },
  confirmed: { label: 'Đã xác nhận', color: 'bg-sky-50 text-sky-700 border border-sky-200/50' },
  shipping: { label: 'Đang giao', color: 'bg-indigo-50 text-indigo-700 border border-indigo-200/50' },
  delivered: { label: 'Đã giao', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' },
  cancelled: { label: 'Đã hủy', color: 'bg-red-50 text-red-600 border border-red-200/50' },
}

const FILTER_STATUS_STYLE: Record<string, { active: string; inactive: string }> = {
  pending: {
    active: 'bg-amber-500 text-white border-amber-500 shadow-sm font-semibold',
    inactive: 'border-amber-200/50 bg-amber-50/20 text-amber-700 hover:bg-amber-50/50 hover:border-amber-300'
  },
  confirmed: {
    active: 'bg-sky-500 text-white border-sky-500 shadow-sm font-semibold',
    inactive: 'border-sky-200/50 bg-sky-50/20 text-sky-700 hover:bg-sky-50/50 hover:border-sky-300'
  },
  shipping: {
    active: 'bg-indigo-500 text-white border-indigo-500 shadow-sm font-semibold',
    inactive: 'border-indigo-200/50 bg-indigo-50/20 text-indigo-700 hover:bg-indigo-50/50 hover:border-indigo-300'
  },
  delivered: {
    active: 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-semibold',
    inactive: 'border-emerald-200/50 bg-emerald-50/20 text-emerald-700 hover:bg-emerald-50/50 hover:border-emerald-300'
  },
  cancelled: {
    active: 'bg-red-500 text-white border-red-500 shadow-sm font-semibold',
    inactive: 'border-red-200/50 bg-red-50/20 text-red-600 hover:bg-red-50/50 hover:border-red-300'
  }
}

const PAGE_SIZE = 20

export default function AdminOrders() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [page, setPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const status = searchParams.get('status') || ''
    setStatusFilter(status)
    setPage(1)
  }, [searchParams])

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setPage(1)
    if (value) {
      setSearchParams({ status: value })
    } else {
      setSearchParams({})
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchQuery])

  // Fetch summary statistics
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.stats().then((r) => r.data),
    refetchInterval: 30000,
  })

  // Fetch orders from server
  const { data: ordersData, isLoading, isFetching } = useQuery({
    queryKey: ['admin-orders-list', statusFilter, page, debouncedSearch],
    queryFn: () =>
      adminApi
        .orders({
          skip: (page - 1) * PAGE_SIZE,
          limit: PAGE_SIZE,
          status: statusFilter || undefined,
          search: debouncedSearch || undefined,
        })
        .then((r) => r.data),
  })

  const orders = Array.isArray(ordersData) ? ordersData : []

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      orderApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders-list'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      toast.success('Cập nhật trạng thái thành công')
      setUpdatingId(null)
    },
    onError: () => {
      toast.error('Không thể cập nhật trạng thái')
      setUpdatingId(null)
    },
  })

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setUpdatingId(orderId)
    updateStatusMutation.mutate({ id: orderId, status: newStatus })
  }

  const resetFilters = () => {
    setSearchQuery('')
    handleStatusFilterChange('')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-2xl text-dark-text">Quản Lý Đơn Hàng</h1>
          <p className="font-sans text-sm text-muted-gray mt-1">
            Xử lý quy trình giao nhận, theo dõi thanh toán và cập nhật trạng thái đơn hàng.
          </p>
        </div>
        <button
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-orders-list'] })
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
            toast.success('Đã cập nhật dữ liệu mới nhất')
          }}
          className="btn-outline flex items-center gap-2 self-start md:self-auto px-4 py-2 text-xs"
        >
          <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} /> Làm mới
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-soft-gray p-5 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="relative lg:col-span-2">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-gray" />
            <input
              type="search"
              placeholder="Tìm theo mã đơn hàng, tên khách hàng, số điện thoại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10 w-full bg-white font-sans text-sm focus:border-gold"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(v) => handleStatusFilterChange(v || '')}
            options={STATUS_OPTIONS}
            placeholder="Tất cả trạng thái"
          />
        </div>

        <div className="flex items-center justify-between gap-3 mt-4 flex-wrap border-t border-soft-gray/50 pt-4">
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.slice(1).map((opt) => {
              const isSelected = statusFilter === opt.value
              const style = FILTER_STATUS_STYLE[opt.value] || { active: '', inactive: '' }
              
              // Get order count for this status
              let count = 0
              if (stats) {
                if (opt.value === 'pending') count = stats.pending_orders
                else if (opt.value === 'confirmed') count = stats.confirmed_orders
                else if (opt.value === 'shipping') count = stats.shipping_orders
                else if (opt.value === 'delivered') count = stats.delivered_orders
                else if (opt.value === 'cancelled') count = stats.cancelled_orders
              }

              return (
                <button
                  key={opt.value}
                  onClick={() => handleStatusFilterChange(statusFilter === opt.value ? '' : opt.value)}
                  className={`px-4 py-1.5 text-xs font-sans border transition-all duration-200 rounded-full inline-flex items-center gap-2 ${
                    isSelected ? style.active : style.inactive
                  }`}
                >
                  <span>{opt.label}</span>
                  <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full transition-colors ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-black/5 text-current'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
          {(searchQuery || statusFilter) && (
            <button
              type="button"
              onClick={resetFilters}
              className="font-sans text-xs text-muted-gray hover:text-gold transition-colors underline"
            >
              Xóa tất cả bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-soft-gray overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full font-sans text-sm">
            <thead>
              <tr className="bg-beige border-b border-soft-gray">
                <th className="px-6 py-3.5 text-left text-xs text-muted-gray uppercase tracking-wider font-semibold">
                  Mã đơn
                </th>
                <th className="px-6 py-3.5 text-left text-xs text-muted-gray uppercase tracking-wider font-semibold">
                  Khách hàng
                </th>
                <th className="px-6 py-3.5 text-left text-xs text-muted-gray uppercase tracking-wider font-semibold hidden sm:table-cell">
                  Ngày đặt
                </th>
                <th className="px-6 py-3.5 text-right text-xs text-muted-gray uppercase tracking-wider font-semibold">
                  Tổng tiền
                </th>
                <th className="px-6 py-3.5 text-center text-xs text-muted-gray uppercase tracking-wider font-semibold">
                  Trạng thái
                </th>
                <th className="px-6 py-3.5 text-center text-xs text-muted-gray uppercase tracking-wider font-semibold">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soft-gray">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 bg-soft-gray animate-pulse rounded" />
                        </td>
                      ))}
                    </tr>
                  ))
                : orders.length === 0
                ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <Package size={40} className="text-soft-gray mx-auto mb-3" />
                      <p className="font-serif text-lg text-dark-text">Không tìm thấy đơn hàng nào</p>
                      <p className="font-sans text-xs text-muted-gray mt-1">Vui lòng kiểm tra lại từ khóa tìm kiếm hoặc bộ lọc.</p>
                    </td>
                  </tr>
                )
                : orders.map((order: Order) => {
                    const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: 'bg-gray-50 text-gray-600 border border-gray-200' }
                    const isUpdating = updatingId === order.id

                    return (
                      <tr key={order.id} className="hover:bg-beige/25 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs text-dark-text font-bold tracking-wider">
                            {order.order_code ? `#${order.order_code}` : `#${order.id.slice(0, 8).toUpperCase()}`}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-dark-text font-semibold">
                            {order.shipping_address?.full_name || 'Khách hàng vãng lai'}
                          </p>
                          <p className="text-xs text-muted-gray font-mono mt-0.5">
                            {order.shipping_address?.phone || ''}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-muted-gray text-xs hidden sm:table-cell">
                          {new Date(order.created_at).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-dark-text">
                          <span className="text-gold font-bold text-sm">
                            {formatPrice(order.total_price)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isUpdating ? (
                            <div className="flex justify-center">
                              <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                            </div>
                          ) : (
                            <div className="relative inline-block text-left">
                              <button
                                type="button"
                                onClick={() => setOpenDropdownId(openDropdownId === order.id ? null : order.id)}
                                className={`text-xs font-semibold px-3.5 py-1.5 pr-8 rounded-full border outline-none cursor-pointer shadow-sm transition-all duration-200 relative inline-flex items-center gap-1.5 ${statusInfo.color}`}
                              >
                                <span>{statusInfo.label}</span>
                                <ChevronDown
                                  size={11}
                                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 transition-transform duration-200 ${
                                    openDropdownId === order.id ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>

                              <AnimatePresence>
                                {openDropdownId === order.id && (
                                  <>
                                    {/* Backdrop click outside */}
                                    <div
                                      className="fixed inset-0 z-30"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setOpenDropdownId(null)
                                      }}
                                    />
                                    {/* Dropdown Menu */}
                                    <motion.div
                                      initial={{ opacity: 0, y: -4, scale: 0.96 }}
                                      animate={{ opacity: 1, y: 0, scale: 1 }}
                                      exit={{ opacity: 0, y: -4, scale: 0.96 }}
                                      transition={{ duration: 0.12 }}
                                      className="absolute right-0 mt-2 w-44 bg-[#FAF6F0] border border-gold/15 shadow-2xl py-1 z-40 text-left rounded-none"
                                    >
                                      {STATUS_OPTIONS.slice(1).map((opt) => {
                                        const isSelected = order.status === opt.value
                                        return (
                                          <button
                                            key={opt.value}
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleStatusChange(order.id, opt.value)
                                              setOpenDropdownId(null)
                                            }}
                                            className={`w-full text-left px-4 py-2.5 text-xs font-sans transition-all flex items-center justify-between border-b border-gold/5 last:border-0 ${
                                              isSelected
                                                ? 'bg-gold/10 text-gold font-semibold'
                                                : 'text-dark-text hover:bg-beige hover:text-gold'
                                            }`}
                                          >
                                            <span>{opt.label}</span>
                                            {isSelected && (
                                              <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                                            )}
                                          </button>
                                        )
                                      })}
                                    </motion.div>
                                  </>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="font-sans text-xs text-gold hover:text-gold-dark hover:underline transition-colors font-semibold"
                          >
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Fix */}
      {(page > 1 || orders.length === PAGE_SIZE) && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 border border-soft-gray text-dark-text bg-white hover:border-gold hover:text-gold disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-sans text-sm text-dark-text font-medium bg-beige/40 px-3.5 py-1.5 border border-soft-gray/50">Trang {page}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={orders.length < PAGE_SIZE}
            className="p-2 border border-soft-gray text-dark-text bg-white hover:border-gold hover:text-gold disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Order detail modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-obsidian/60 backdrop-blur-md"
              onClick={() => setSelectedOrder(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.2 }}
              className="relative bg-[#FAF6F0] w-full max-w-4xl max-h-[92vh] overflow-y-auto border border-gold/15 shadow-2xl rounded-none"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-8 py-5 border-b border-gold/10 sticky top-0 bg-[#FAF6F0]/90 backdrop-blur-md z-10">
                <div>
                  <h2 className="font-serif text-2xl text-navy font-semibold tracking-wide">
                    Chi Tiết Đơn Hàng
                  </h2>
                  <p className="font-mono text-xs text-muted-gray mt-1 uppercase tracking-wider">
                    {selectedOrder.order_code ? `#${selectedOrder.order_code}` : `#${selectedOrder.id}`}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 -mr-2 text-muted-gray hover:text-dark-text transition-colors border border-soft-gray/30 rounded-full hover:bg-beige/40"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-8 space-y-8">
                {/* Visual Steps Indicator */}
                <div className="bg-white border border-gold/10 p-6 shadow-sm">
                  <p className="font-sans text-[10px] text-muted-gray uppercase tracking-luxury font-bold mb-4">Trình tự trạng thái đơn hàng</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'].map((st) => {
                      const isActive = selectedOrder.status === st
                      const isCancelled = st === 'cancelled'
                      const isDelivered = st === 'delivered'
                      let cardStyle = 'border-soft-gray/50 bg-white text-muted-gray'
                      
                      if (isActive) {
                        if (isCancelled) cardStyle = 'bg-red-50 border-red-300 text-red-700 font-semibold'
                        else if (isDelivered) cardStyle = 'bg-emerald-50 border-emerald-300 text-emerald-700 font-semibold'
                        else cardStyle = 'bg-gold/10 border-gold/40 text-gold font-semibold'
                      }

                      return (
                        <div
                          key={st}
                          className={`border p-3 text-center transition-all ${cardStyle}`}
                        >
                          <p className="text-xs font-sans">
                            {st === 'pending' && '1. Chờ xác nhận'}
                            {st === 'confirmed' && '2. Đã xác nhận'}
                            {st === 'shipping' && '3. Đang giao'}
                            {st === 'delivered' && '4. Đã giao'}
                            {st === 'cancelled' && 'Đã hủy'}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 2-Column Grid for Address & Payments */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Receiver Information */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin size={14} className="text-gold" />
                        <p className="font-sans text-[10px] text-muted-gray uppercase tracking-luxury font-bold">Địa chỉ giao hàng</p>
                      </div>
                      <div className="bg-white border border-gold/10 p-5 font-sans text-sm space-y-3 shadow-sm">
                        <div className="flex items-center gap-2 border-b border-soft-gray/50 pb-2">
                          <User size={13} className="text-muted-gray" />
                          <p className="font-bold text-dark-text">{selectedOrder.shipping_address?.full_name}</p>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-xs text-muted-gray">
                          <Phone size={13} />
                          <span>{selectedOrder.shipping_address?.phone}</span>
                        </div>
                        <div className="text-muted-gray leading-relaxed pt-1">
                          {selectedOrder.shipping_address?.address},{' '}
                          {selectedOrder.shipping_address?.district},{' '}
                          {selectedOrder.shipping_address?.city}
                        </div>
                        {selectedOrder.shipping_address?.note && (
                          <div className="border-t border-soft-gray/50 pt-3 mt-1 flex items-start gap-2 bg-beige/20 p-2.5">
                            <MessageSquare size={13} className="text-gold shrink-0 mt-0.5" />
                            <p className="text-xs text-muted-gray italic">
                              <strong>Ghi chú:</strong> {selectedOrder.shipping_address.note}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Payment & Timeline */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard size={14} className="text-gold" />
                        <p className="font-sans text-[10px] text-muted-gray uppercase tracking-luxury font-bold">Thông tin thanh toán</p>
                      </div>
                      <div className="bg-white border border-gold/10 p-5 font-sans text-sm space-y-3 shadow-sm h-full">
                        <div className="flex justify-between items-center py-1">
                          <span className="text-muted-gray">Phương thức:</span>
                          <span className="font-semibold text-dark-text">
                            {selectedOrder.payment_method === 'COD'
                              ? 'Thanh toán COD khi nhận hàng'
                              : selectedOrder.payment_method === 'VIETQR'
                                ? 'Chuyển khoản online VietQR'
                                : 'Ví điện tử'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-t border-soft-gray/50">
                          <span className="text-muted-gray">Trạng thái thanh toán:</span>
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            selectedOrder.status === 'delivered'
                              ? 'bg-emerald-50 text-emerald-700'
                              : selectedOrder.status === 'cancelled'
                                ? 'bg-red-50 text-red-600'
                                : 'bg-amber-50 text-amber-600'
                          }`}>
                            {selectedOrder.status === 'delivered' ? 'Đã hoàn tất' : selectedOrder.status === 'cancelled' ? 'Giao dịch lỗi/Hủy' : 'Chờ xử lý'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-t border-soft-gray/50">
                          <span className="text-muted-gray">Thời gian tạo đơn:</span>
                          <span className="font-mono text-xs text-dark-text font-medium">
                            {new Date(selectedOrder.created_at).toLocaleString('vi-VN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ordered Items with Product Images */}
                <div>
                  <p className="font-sans text-[10px] text-muted-gray uppercase tracking-luxury font-bold mb-3">Sản phẩm trong đơn hàng</p>
                  <div className="space-y-3.5">
                    {selectedOrder.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-4 items-center bg-white border border-soft-gray p-4 shadow-sm transition-all hover:border-gold/30"
                      >
                        <img
                          src={item.image_url || 'https://images.unsplash.com/photo-1586495777744-4e6232bf2f8f?w=150'}
                          alt={item.product_name || 'Sản phẩm'}
                          className="w-16 h-16 object-cover bg-beige border border-soft-gray/50 rounded-sm shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-sans text-sm font-semibold text-dark-text leading-snug line-clamp-1">
                            {item.product_name || `Sản phẩm #${item.product_id.slice(0, 6)}`}
                          </p>
                          <p className="font-sans text-xs text-muted-gray mt-1.5">
                            Đơn giá: <span className="text-dark-text font-medium">{formatPrice(Number(item.price_at_purchase))}</span> | Số lượng: <span className="font-bold text-dark-text">x{item.quantity}</span>
                          </p>
                        </div>
                        <span className="text-gold font-bold text-sm shrink-0">
                          {formatPrice(Number(item.price_at_purchase) * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary Total */}
                <div className="border-t border-gold/10 pt-4 flex justify-between items-baseline mt-4 bg-white/40 p-4 border border-gold/5 shadow-sm">
                  <span className="font-sans text-xs uppercase tracking-luxury text-dark-text font-bold">Tổng thanh toán đơn hàng</span>
                  <span className="price-gold text-2xl font-bold text-gold">{formatPrice(selectedOrder.total_price)}</span>
                </div>

                {/* Quick Status Update Buttons */}
                <div className="border-t border-gold/10 pt-6">
                  <p className="font-sans text-[10px] text-muted-gray uppercase tracking-luxury font-bold mb-3">Cập nhật nhanh trạng thái đơn hàng</p>
                  <div className="flex gap-2 flex-wrap">
                    {STATUS_OPTIONS.slice(1).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          handleStatusChange(selectedOrder.id, opt.value)
                          setSelectedOrder({ ...selectedOrder, status: opt.value as Order['status'] })
                        }}
                        className={`px-4 py-2 text-xs font-sans border transition-all duration-200 ${
                          selectedOrder.status === opt.value
                            ? 'bg-gold text-white border-gold font-semibold shadow-sm'
                            : 'border-soft-gray bg-white text-muted-gray hover:border-gold hover:text-gold'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
