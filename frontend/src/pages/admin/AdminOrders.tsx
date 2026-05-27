import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronDown, Package, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi, orderApi } from '../../api/endpoints'
import type { Order } from '../../types'

function formatPrice(p: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p)
}

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'shipping', label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'cancelled', label: 'Đã hủy' },
]

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chờ xác nhận', color: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700' },
  shipping: { label: 'Đang giao', color: 'bg-indigo-100 text-indigo-700' },
  delivered: { label: 'Đã giao', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-600' },
}

const PAGE_SIZE = 20

export default function AdminOrders() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['admin-orders-list', statusFilter, page],
    queryFn: () =>
      adminApi
        .orders({ skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE, status: statusFilter || undefined })
        .then((r) => r.data),
  })

  const orders = Array.isArray(ordersData) ? ordersData : []

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-2xl text-dark-text">Quản Lý Đơn Hàng</h1>
          <p className="font-sans text-sm text-muted-gray mt-0.5">{orders.length} đơn hàng</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="input-field bg-white cursor-pointer text-sm pr-8 min-w-[180px]"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.slice(1).map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setStatusFilter(statusFilter === opt.value ? '' : opt.value); setPage(1) }}
              className={`px-3 py-1.5 text-xs font-sans border transition-colors rounded-full ${
                statusFilter === opt.value
                  ? 'bg-gold text-white border-gold'
                  : 'border-soft-gray text-muted-gray hover:border-gold hover:text-gold'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-soft-gray overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full font-sans text-sm">
            <thead>
              <tr className="bg-beige border-b border-soft-gray">
                <th className="px-5 py-3 text-left text-xs text-muted-gray uppercase tracking-wider font-medium">
                  Mã đơn
                </th>
                <th className="px-5 py-3 text-left text-xs text-muted-gray uppercase tracking-wider font-medium">
                  Khách hàng
                </th>
                <th className="px-5 py-3 text-left text-xs text-muted-gray uppercase tracking-wider font-medium hidden sm:table-cell">
                  Ngày đặt
                </th>
                <th className="px-5 py-3 text-right text-xs text-muted-gray uppercase tracking-wider font-medium">
                  Tổng tiền
                </th>
                <th className="px-5 py-3 text-center text-xs text-muted-gray uppercase tracking-wider font-medium">
                  Trạng thái
                </th>
                <th className="px-5 py-3 text-center text-xs text-muted-gray uppercase tracking-wider font-medium">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soft-gray">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 bg-soft-gray animate-pulse rounded" />
                        </td>
                      ))}
                    </tr>
                  ))
                : orders.length === 0
                ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <Package size={36} className="text-soft-gray mx-auto mb-3" />
                      <p className="font-sans text-muted-gray">Không tìm thấy đơn hàng</p>
                    </td>
                  </tr>
                )
                : orders.map((order: Order) => {
                    const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-600' }
                    const isUpdating = updatingId === order.id

                    return (
                      <tr key={order.id} className="hover:bg-beige/30 transition-colors">
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs text-dark-text font-semibold">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-dark-text font-medium">
                            {order.shipping_address?.full_name || '—'}
                          </p>
                          <p className="text-xs text-muted-gray">
                            {order.shipping_address?.phone || ''}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-muted-gray text-xs hidden sm:table-cell">
                          {new Date(order.created_at).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-gold font-semibold">
                            {formatPrice(order.total_price)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          {isUpdating ? (
                            <div className="flex justify-center">
                              <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                            </div>
                          ) : (
                            <div className="relative inline-block">
                              <select
                                value={order.status}
                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                className={`text-xs font-medium px-2.5 py-1 pr-6 rounded-full border-none outline-none cursor-pointer appearance-none ${statusInfo.color}`}
                              >
                                {STATUS_OPTIONS.slice(1).map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown
                                size={10}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none"
                              />
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="font-sans text-xs text-gold hover:underline"
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

      {/* Pagination */}
      {orders.length === PAGE_SIZE && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-outline px-4 py-2 text-sm disabled:opacity-40"
          >
            ← Trước
          </button>
          <span className="font-sans text-sm text-muted-gray">Trang {page}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            className="btn-outline px-4 py-2 text-sm"
          >
            Sau →
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
              className="absolute inset-0 bg-black/50"
              onClick={() => setSelectedOrder(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-lg max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-soft-gray sticky top-0 bg-white">
                <h2 className="font-serif text-lg text-dark-text">
                  Chi tiết đơn #{selectedOrder.id.slice(0, 8).toUpperCase()}
                </h2>
                <button onClick={() => setSelectedOrder(null)}>
                  <X size={18} className="text-muted-gray hover:text-dark-text" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Status */}
                <div>
                  <p className="font-sans text-xs text-muted-gray uppercase tracking-wider mb-2">Trạng thái</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${STATUS_MAP[selectedOrder.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_MAP[selectedOrder.status]?.label || selectedOrder.status}
                  </span>
                </div>

                {/* Shipping address */}
                <div>
                  <p className="font-sans text-xs text-muted-gray uppercase tracking-wider mb-2">Địa chỉ giao hàng</p>
                  <div className="bg-beige p-4 font-sans text-sm space-y-1">
                    <p className="font-semibold text-dark-text">{selectedOrder.shipping_address?.full_name}</p>
                    <p className="text-muted-gray">{selectedOrder.shipping_address?.phone}</p>
                    <p className="text-muted-gray">
                      {selectedOrder.shipping_address?.address},{' '}
                      {selectedOrder.shipping_address?.district},{' '}
                      {selectedOrder.shipping_address?.city}
                    </p>
                    {selectedOrder.shipping_address?.note && (
                      <p className="text-muted-gray italic">Ghi chú: {selectedOrder.shipping_address.note}</p>
                    )}
                  </div>
                </div>

                {/* Payment */}
                <div>
                  <p className="font-sans text-xs text-muted-gray uppercase tracking-wider mb-2">Thanh toán</p>
                  <p className="font-sans text-sm text-dark-text">
                    {selectedOrder.payment_method === 'COD'
                      ? 'Thanh toán khi nhận hàng (COD)'
                      : 'Ví điện tử'}
                  </p>
                </div>

                {/* Items */}
                <div>
                  <p className="font-sans text-xs text-muted-gray uppercase tracking-wider mb-2">Sản phẩm</p>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center bg-beige px-4 py-2.5"
                      >
                        <div>
                          <p className="font-sans text-sm text-dark-text">
                            {item.product_name || `Sản phẩm #${item.product_id.slice(0, 6)}`}
                          </p>
                          <p className="font-sans text-xs text-muted-gray">x{item.quantity}</p>
                        </div>
                        <span className="text-gold font-semibold text-sm">
                          {formatPrice(item.price_at_purchase * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-soft-gray pt-3 flex justify-between">
                  <span className="font-sans text-sm font-semibold text-dark-text">Tổng cộng</span>
                  <span className="price-gold text-lg">{formatPrice(selectedOrder.total_price)}</span>
                </div>

                {/* Update status */}
                <div>
                  <p className="font-sans text-xs text-muted-gray uppercase tracking-wider mb-2">Cập nhật trạng thái</p>
                  <div className="flex gap-2 flex-wrap">
                    {STATUS_OPTIONS.slice(1).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          handleStatusChange(selectedOrder.id, opt.value)
                          setSelectedOrder({ ...selectedOrder, status: opt.value as Order['status'] })
                        }}
                        className={`px-3 py-1.5 text-xs font-sans border transition-colors ${
                          selectedOrder.status === opt.value
                            ? 'bg-gold text-white border-gold'
                            : 'border-soft-gray text-muted-gray hover:border-gold hover:text-gold'
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
