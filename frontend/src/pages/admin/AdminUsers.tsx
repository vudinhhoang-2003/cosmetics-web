import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Users, ToggleRight, ToggleLeft, Search, ShieldCheck, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi } from '../../api/endpoints'
import type { User as UserType } from '../../types'

const PAGE_SIZE = 20

export default function AdminUsers() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', page],
    queryFn: () =>
      adminApi.users({ skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE }).then((r) => r.data),
  })

  const users: UserType[] = Array.isArray(usersData) ? usersData : []

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase()
    return (
      !search ||
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-2xl text-dark-text">Quản Lý Người Dùng</h1>
          <p className="font-sans text-sm text-muted-gray mt-0.5">
            {filteredUsers.length} người dùng
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-gray" />
        <input
          type="text"
          placeholder="Tìm theo email hoặc tên..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10 w-full bg-white"
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Tổng người dùng',
            value: users.length,
            icon: Users,
            color: 'bg-blue-50 text-blue-600',
          },
          {
            label: 'Đang hoạt động',
            value: users.filter((u) => u.is_active).length,
            icon: ToggleRight,
            color: 'bg-green-50 text-green-600',
          },
          {
            label: 'Bị vô hiệu hóa',
            value: users.filter((u) => !u.is_active).length,
            icon: ToggleLeft,
            color: 'bg-red-50 text-red-500',
          },
          {
            label: 'Quản trị viên',
            value: users.filter((u) => u.role === 'admin').length,
            icon: ShieldCheck,
            color: 'bg-purple-50 text-purple-600',
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-soft-gray p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="font-sans text-xl text-dark-text font-bold">{value}</p>
              <p className="font-sans text-xs text-muted-gray">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-soft-gray overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={36} className="text-soft-gray mx-auto mb-3" />
            <p className="font-sans text-muted-gray">Không tìm thấy người dùng</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full font-sans text-sm">
              <thead>
                <tr className="bg-beige border-b border-soft-gray">
                  <th className="px-5 py-3 text-left text-xs text-muted-gray uppercase tracking-wider font-medium">
                    Người dùng
                  </th>
                  <th className="px-5 py-3 text-left text-xs text-muted-gray uppercase tracking-wider font-medium hidden sm:table-cell">
                    Số điện thoại
                  </th>
                  <th className="px-5 py-3 text-center text-xs text-muted-gray uppercase tracking-wider font-medium">
                    Vai trò
                  </th>
                  <th className="px-5 py-3 text-center text-xs text-muted-gray uppercase tracking-wider font-medium">
                    Trạng thái
                  </th>
                  <th className="px-5 py-3 text-left text-xs text-muted-gray uppercase tracking-wider font-medium hidden md:table-cell">
                    Ngày đăng ký
                  </th>
                  <th className="px-5 py-3 text-center text-xs text-muted-gray uppercase tracking-wider font-medium">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soft-gray">
                {filteredUsers.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-beige/30 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-beige flex items-center justify-center shrink-0">
                          {user.role === 'admin' ? (
                            <ShieldCheck size={16} className="text-gold" />
                          ) : (
                            <User size={16} className="text-muted-gray" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-dark-text">
                            {user.full_name || '(Chưa cập nhật)'}
                          </p>
                          <p className="text-xs text-muted-gray">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-gray hidden sm:table-cell">
                      {user.phone || '—'}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {user.role === 'admin' ? 'Admin' : 'Khách hàng'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium ${
                          user.is_active ? 'text-green-600' : 'text-red-500'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full inline-block ${
                            user.is_active ? 'bg-green-500' : 'bg-red-400'
                          }`}
                        />
                        {user.is_active ? 'Đang hoạt động' : 'Bị vô hiệu hóa'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-gray text-xs hidden md:table-cell">
                      {new Date(user.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => toggleMutation.mutate(user.id)}
                          disabled={toggleMutation.isPending}
                          title={user.is_active ? 'Vô hiệu hóa tài khoản' : 'Kích hoạt tài khoản'}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans border transition-colors disabled:opacity-60 ${
                            user.is_active
                              ? 'border-red-200 text-red-500 hover:bg-red-50'
                              : 'border-green-200 text-green-600 hover:bg-green-50'
                          }`}
                        >
                          {user.is_active ? (
                            <>
                              <ToggleRight size={14} />
                              Vô hiệu hóa
                            </>
                          ) : (
                            <>
                              <ToggleLeft size={14} />
                              Kích hoạt
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {users.length === PAGE_SIZE && (
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
    </div>
  )
}
