import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingCart, Tag, Users, LogOut, ExternalLink } from 'lucide-react'
import { useAdminAuthStore } from '../store/authStore'

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

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen flex bg-beige">
      {/* Sidebar */}
      <aside className="w-60 bg-navy flex flex-col flex-shrink-0">
        <div className="px-6 py-6 border-b border-white/10">
          <span className="font-serif text-xl font-bold text-white tracking-widest">
            LUXE<span className="text-gold"> ADMIN</span>
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ label, to, icon: Icon }) => {
            const active = to === '/admin' ? pathname === '/admin' : pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-sm transition-colors ${
                  active
                    ? 'bg-gold text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </nav>

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

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
