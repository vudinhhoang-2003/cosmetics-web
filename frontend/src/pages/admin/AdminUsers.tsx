import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Users, ToggleRight, ToggleLeft, Search, ShieldCheck, User, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/endpoints'
import type { User as UserType } from '../../types'

const PAGE_SIZE = 20

export default function AdminUsers() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data: usersData, isLoading, isFetching } = useQuery({
    queryKey: ['admin-users', page],
    queryFn: () =>
      adminApi.users({ skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE }).then((r) => r.data),
  })

  const users: UserType[] = Array.isArray(usersData) ? usersData : []

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase().trim()
    return (
      !q ||
      u.email.toLowerCase().includes(q) ||
      (u.full_name || '').toLowerCase().includes(q)
    )
  })

  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminApi.toggleUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Cập nhật trạng thái thành công')
    },
    onError: () => toast.error('Không thể cập nhật trạng thái'),
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl text-dark-text">Quản Lý Người Dùng</h1>
          <p className="font-sans text-sm text-muted-gray mt-1">
            Quản lý tài khoản khách hàng và nhân viên, quản trị phân quyền truy cập hệ thống.
          </p>
        </div>
        <button
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] })
            toast.success('Đã cập nhật danh sách người dùng mới nhất')
          }}
          className="btn-outline flex items-center gap-2 self-start sm:self-auto px-4 py-2 text-xs"
        >
          <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} /> Làm mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Tổng thành viên',
            value: users.length,
            icon: Users,
            color: 'text-gold bg-gold/10 border-gold/10',
          },
          {
            label: 'Đang hoạt động',
            value: users.filter((u) => u.is_active).length,
            icon: ToggleRight,
            color: 'text-green-600 bg-emerald-50 border-emerald-200/30',
          },
          {
            label: 'Bị vô hiệu hóa',
            value: users.filter((u) => !u.is_active).length,
            icon: ToggleLeft,
            color: 'text-red-500 bg-red-50 border-red-200/30',
          },
          {
            label: 'Quản trị viên',
            value: users.filter((u) => u.role === 'admin').length,
            icon: ShieldCheck,
            color: 'text-purple-600 bg-purple-50 border-purple-200/30',
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className={`bg-white border p-4 flex items-center justify-between shadow-sm transition-all hover:shadow-md ${color.split(' ')[2] || 'border-soft-gray'}`}
          >
            <div>
              <p className="font-sans text-[10px] text-muted-gray uppercase tracking-wider">{label}</p>
              <p className="font-sans text-2xl font-bold text-dark-text mt-1">{value}</p>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color.split(' ').slice(0, 2).join(' ')}`}>
              <Icon size={18} />
            </div>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-soft-gray p-5 shadow-sm">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-gray" />
          <input
            type="text"
            placeholder="Tìm kiếm thành viên theo email hoặc tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 w-full bg-white font-sans text-sm focus:border-gold"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-soft-gray overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 text-center">
            <Users size={40} className="text-soft-gray mx-auto mb-3" />
            <p className="font-serif text-lg text-dark-text">Không tìm thấy thành viên</p>
            <p className="font-sans text-xs text-muted-gray mt-1">Thử thay đổi từ khóa tìm kiếm hoặc cập nhật danh sách.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full font-sans text-sm">
              <thead>
                <tr className="bg-beige border-b border-soft-gray">
                  <th className="px-6 py-3.5 text-left text-xs text-muted-gray uppercase tracking-luxury font-bold">
                    Thành viên
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs text-muted-gray uppercase tracking-luxury font-bold hidden sm:table-cell">
                    Số điện thoại
                  </th>
                  <th className="px-6 py-3.5 text-center text-xs text-muted-gray uppercase tracking-luxury font-bold">
                    Vai trò
                  </th>
                  <th className="px-6 py-3.5 text-center text-xs text-muted-gray uppercase tracking-luxury font-bold">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs text-muted-gray uppercase tracking-luxury font-bold hidden md:table-cell">
                    Ngày tham gia
                  </th>
                  <th className="px-6 py-3.5 text-center text-xs text-muted-gray uppercase tracking-luxury font-bold">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soft-gray">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-beige/25 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-beige border border-soft-gray/50 flex items-center justify-center shrink-0">
                          {user.role === 'admin' ? (
                            <ShieldCheck size={16} className="text-gold" />
                          ) : (
                            <User size={16} className="text-muted-gray/80" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-dark-text">
                            {user.full_name || '(Chưa cập nhật tên)'}
                          </p>
                          <p className="text-xs text-muted-gray font-mono">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-gray font-mono text-xs hidden sm:table-cell">
                      {user.phone || '—'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold border ${
                          user.role === 'admin'
                            ? 'bg-gold/10 text-gold border-gold/20'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {user.role === 'admin' ? 'Admin' : 'Khách hàng'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold border ${
                          user.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                            : 'bg-red-50 text-red-600 border-red-200/50'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full inline-block ${
                            user.is_active ? 'bg-green-500 animate-pulse' : 'bg-red-400'
                          }`}
                        />
                        {user.is_active ? 'Đang hoạt động' : 'Bị khóa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-gray text-xs hidden md:table-cell">
                      {new Date(user.created_at).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {user.role !== 'admin' ? (
                        <button
                          onClick={() => toggleMutation.mutate(user.id)}
                          disabled={toggleMutation.isPending}
                          title={user.is_active ? 'Khóa tài khoản khách hàng' : 'Mở khóa tài khoản khách hàng'}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-sans border transition-all duration-200 disabled:opacity-60 font-semibold shadow-sm ${
                            user.is_active
                              ? 'border-red-200 text-red-600 bg-white hover:bg-red-50 hover:border-red-300'
                              : 'border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50 hover:border-emerald-300'
                          }`}
                        >
                          {user.is_active ? (
                            <>
                              <ToggleRight size={13} />
                              Khóa tài khoản
                            </>
                          ) : (
                            <>
                              <ToggleLeft size={13} />
                              Kích hoạt
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-muted-gray italic">Không có quyền thao tác</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Fix */}
      {(page > 1 || users.length === PAGE_SIZE) && (
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
            disabled={users.length < PAGE_SIZE}
            className="p-2 border border-soft-gray text-dark-text bg-white hover:border-gold hover:text-gold disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
