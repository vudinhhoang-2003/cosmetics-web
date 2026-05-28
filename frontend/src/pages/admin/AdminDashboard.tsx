import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp, ShoppingBag, Package, Users, AlertCircle, ChevronRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { adminApi } from '../../api/endpoints'
import type { Order, AdminStats } from '../../types'
import { formatPrice } from '../../utils/format'

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chờ xác nhận', color: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700' },
  shipping: { label: 'Đang giao', color: 'bg-indigo-100 text-indigo-700' },
  delivered: { label: 'Đã giao', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-600' },
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
}

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.stats().then((r) => r.data),
    refetchInterval: 30000,
  })

  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders', 'recent'],
    queryFn: () => adminApi.orders({ limit: 10 }).then((r) => r.data),
    refetchInterval: 30000,
  })

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const statCards = stats
    ? [
        {
          label: 'Doanh Thu',
          value: formatPrice(stats.total_revenue),
          icon: TrendingUp,
          color: 'bg-gold/10 text-gold',
          sub: 'Tổng doanh thu',
        },
        {
          label: 'Đơn Hàng',
          value: stats.total_orders,
          icon: ShoppingBag,
          color: 'bg-blue-50 text-blue-600',
          sub: `${stats.pending_orders} chờ xử lý`,
          warning: stats.pending_orders > 0,
        },
        {
          label: 'Sản Phẩm',
          value: stats.total_products,
          icon: Package,
          color: 'bg-emerald-50 text-emerald-600',
          sub: 'Sản phẩm đang bán',
        },
        {
          label: 'Khách Hàng',
          value: stats.total_users,
          icon: Users,
          color: 'bg-purple-50 text-purple-600',
          sub: 'Thành viên đã đăng ký',
        },
      ]
    : []

  const chartData = stats?.top_products?.map((p) => ({
    name: p.name.length > 15 ? p.name.slice(0, 15) + '…' : p.name,
    'Đã bán': p.total_sold,
  })) || []

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div>
        <h1 className="font-serif text-2xl text-dark-text">Tổng Quan</h1>
        <p className="font-sans text-sm text-muted-gray mt-1">
          Chào mừng trở lại! Đây là tóm tắt hoạt động kinh doanh hôm nay.
        </p>
      </div>

      {/* Pending orders warning */}
      {stats && stats.pending_orders > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 p-4 flex items-center gap-3 rounded-sm"
        >
          <AlertCircle size={18} className="text-amber-600 shrink-0" />
          <p className="font-sans text-sm text-amber-700">
            Có <strong>{stats.pending_orders}</strong> đơn hàng đang chờ xác nhận.{' '}
            <Link to="/admin/orders" className="underline font-medium">
              Xử lý ngay
            </Link>
          </p>
        </motion.div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {statCards.map((card, i) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.label}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="bg-white border border-soft-gray p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${card.color}`}>
                  <Icon size={20} />
                </div>
                {card.warning && (
                  <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full font-sans">
                    {stats!.pending_orders} mới
                  </span>
                )}
              </div>
              <p className="font-sans text-2xl text-dark-text font-bold mb-1">{card.value}</p>
              <p className="font-sans text-xs text-muted-gray uppercase tracking-wider">{card.label}</p>
              <p className="font-sans text-xs text-muted-gray mt-1">{card.sub}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Charts + Recent orders */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Top products bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="xl:col-span-2 bg-white border border-soft-gray p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-lg text-dark-text">Top 5 Sản Phẩm Bán Chạy</h2>
            <Link
              to="/admin/products"
              className="font-sans text-xs text-gold hover:underline flex items-center gap-1"
            >
              Xem tất cả <ChevronRight size={12} />
            </Link>
          </div>

          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ left: 0, right: 10, top: 5, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontFamily: 'Lato', fontSize: 11, fill: '#8B8B8B' }}
                  angle={-30}
                  textAnchor="end"
                  height={60}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontFamily: 'Lato', fontSize: 11, fill: '#8B8B8B' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    fontFamily: 'Lato',
                    fontSize: 12,
                    borderColor: '#E8E8E0',
                    borderRadius: 0,
                  }}
                  formatter={(val: number) => [`${val} cái`, 'Đã bán']}
                />
                <Bar dataKey="Đã bán" fill="#C9A96E" radius={[2, 2, 0, 0]} maxBarSize={56} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="font-sans text-sm text-muted-gray">Chưa có dữ liệu</p>
            </div>
          )}
        </motion.div>

        {/* Quick stats side panel */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-navy p-6 flex flex-col justify-between"
          >
            <div>
              <p className="font-sans text-xs text-white/50 tracking-widest uppercase mb-2">Tỷ lệ hoàn thành</p>
              <p className="font-sans text-4xl text-white font-bold mb-1">
                {stats.total_orders > 0
                  ? Math.round(((stats.total_orders - stats.pending_orders) / stats.total_orders) * 100)
                  : 0}%
              </p>
              <p className="font-sans text-xs text-white/60">Đơn hàng đã xử lý</p>
            </div>

            <div className="space-y-3 mt-8">
              {[
                { label: 'Tổng đơn hàng', value: stats.total_orders },
                { label: 'Chờ xử lý', value: stats.pending_orders },
                { label: 'Sản phẩm đang bán', value: stats.total_products },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="font-sans text-xs text-white/60">{label}</span>
                  <span className="font-sans text-xs text-white font-semibold">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-white/10 pt-5">
              <Link
                to="/admin/orders"
                className="font-sans text-xs text-gold flex items-center gap-1 hover:gap-2 transition-all"
              >
                Quản lý đơn hàng <ChevronRight size={12} />
              </Link>
            </div>
          </motion.div>
        )}
      </div>

      {/* Recent orders table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white border border-soft-gray"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-soft-gray">
          <h2 className="font-serif text-lg text-dark-text">Đơn Hàng Gần Đây</h2>
          <Link
            to="/admin/orders"
            className="font-sans text-xs text-gold hover:underline flex items-center gap-1"
          >
            Xem tất cả <ChevronRight size={12} />
          </Link>
        </div>

        {ordersLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !recentOrders || recentOrders.length === 0 ? (
          <div className="py-10 text-center">
            <p className="font-sans text-sm text-muted-gray">Chưa có đơn hàng nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full font-sans text-sm">
              <thead>
                <tr className="bg-beige border-b border-soft-gray">
                  <th className="text-left px-6 py-3 text-xs text-muted-gray uppercase tracking-wider font-medium">
                    Mã đơn
                  </th>
                  <th className="text-left px-6 py-3 text-xs text-muted-gray uppercase tracking-wider font-medium">
                    Khách hàng
                  </th>
                  <th className="text-left px-6 py-3 text-xs text-muted-gray uppercase tracking-wider font-medium">
                    Ngày đặt
                  </th>
                  <th className="text-left px-6 py-3 text-xs text-muted-gray uppercase tracking-wider font-medium">
                    Trạng thái
                  </th>
                  <th className="text-right px-6 py-3 text-xs text-muted-gray uppercase tracking-wider font-medium">
                    Tổng tiền
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soft-gray">
                {recentOrders.map((order: Order) => {
                  const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-600' }
                  return (
                    <tr key={order.id} className="hover:bg-beige/40 transition-colors">
                      <td className="px-6 py-3.5">
                        <span className="font-mono text-xs text-dark-text font-semibold">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-dark-text">
                        {order.shipping_address?.full_name || '—'}
                      </td>
                      <td className="px-6 py-3.5 text-muted-gray text-xs">
                        {new Date(order.created_at).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <span className="text-gold font-semibold text-sm">
                          {formatPrice(order.total_price)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}
