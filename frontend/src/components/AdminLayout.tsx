import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingCart, Tag, Users, LogOut, ExternalLink } from 'lucide-react'
import { useAdminAuthStore } from '../store/authStore'

// Danh sách các mục menu trên thanh Sidebar của trang Admin
const navItems = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
  { label: 'Sản phẩm', to: '/admin/products', icon: Package },
  { label: 'Đơn hàng', to: '/admin/orders', icon: ShoppingCart },
  { label: 'Danh mục', to: '/admin/categories', icon: Tag },
  { label: 'Người dùng', to: '/admin/users', icon: Users },
]

export default function AdminLayout() {
  const { pathname } = useLocation()
  const { user, logout } = useAdminAuthStore()
  const navigate = useNavigate()

  // Hàm xử lý đăng xuất tài khoản Admin và chuyển hướng về trang đăng nhập của Admin
  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen flex bg-beige">
      {/* Sidebar - Thanh điều hướng bên trái dành cho Admin */}
      <aside className="w-60 bg-navy flex flex-col flex-shrink-0">
        <div className="px-6 py-6 border-b border-white/10">
          <span className="font-serif text-xl font-bold text-white tracking-widest">
            LUXE<span className="text-gold"> ADMIN</span>
          </span>
        </div>

        {/* Danh sách các link điều hướng quản trị */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ label, to, icon: Icon }) => {
            // Xác định trạng thái active của menu dựa trên đường dẫn hiện tại
            const active = to === '/admin' ? pathname === '/admin' : pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-sm transition-colors ${
                  active
                    ? 'bg-gold text-white' // Màu Gold nổi bật khi đang active
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Khu vực thông tin tài khoản và đăng xuất ở chân Sidebar */}
        <div className="px-3 py-4 border-t border-white/10">
          <Link
            to="/"
            target="_blank"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:text-white transition-colors"
          >
            <ExternalLink size={16} /> Xem website
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:text-white transition-colors mt-1"
          >
            <LogOut size={16} /> Đăng xuất
          </button>
          <div className="px-4 pt-3">
            <p className="text-xs text-white/40 truncate">{user?.email}</p>
          </div>
        </div>
      </aside>

      {/* Khu vực hiển thị nội dung chính của trang Admin tương ứng */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

