import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingBag, User, Search, Menu, X, LogOut, LayoutDashboard } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { useCartStore } from '../store/cartStore'

const navLinks = [
  { label: 'Trang Chủ', to: '/' },
  { label: 'Sản Phẩm', to: '/products' },
  { label: 'Son Môi', to: '/products?category=son-moi' },
  { label: 'Chăm Sóc Da', to: '/products?category=cham-soc-da' },
  { label: 'Nước Hoa', to: '/products?category=nuoc-hoa' },
]

function NavLink({ label, to }: { label: string; to: string }) {
  const { pathname, search } = useLocation()
  const currentFull = pathname + search
  const isActive =
    to === '/'
      ? pathname === '/'
      : currentFull.startsWith(to.split('?')[0]) &&
        (to.includes('?') ? currentFull.includes(to.split('?')[1]) : true)

  return (
    <Link to={to} className={`nav-link${isActive ? ' active' : ''}`}>
      {label}
    </Link>
  )
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const { isAuthenticated, user, logout, isAdmin } = useAuthStore()
  const { count } = useCartStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`)
      setSearchOpen(false)
      setSearchTerm('')
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 border-t-2 border-gold transition-all duration-300 ${
        scrolled ? 'bg-white border-b border-gold/20' : 'bg-white'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-[60px] md:h-[72px]">

          {/* Desktop left nav */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 flex-1">
            {navLinks.slice(0, 2).map((link) => (
              <NavLink key={link.to} {...link} />
            ))}
          </nav>

          {/* Logo — centered absolutely */}
          <Link
            to="/"
            className="absolute left-1/2 -translate-x-1/2 z-10 flex-shrink-0"
          >
            <span
              className="font-display text-lg md:text-xl font-medium text-navy select-none whitespace-nowrap"
              style={{ letterSpacing: '0.45em' }}
            >
              LUXE<span className="text-gold"> BEAUTY</span>
            </span>
          </Link>

          {/* Desktop right nav */}
          <div className="hidden md:flex items-center justify-end gap-6 lg:gap-8 flex-1">
            {navLinks.slice(2).map((link) => (
              <NavLink key={link.to} {...link} />
            ))}

            {/* Icons */}
            <div className="flex items-center gap-3 ml-1 pl-3 border-l border-soft-gray">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="text-dark-text hover:text-gold transition-colors duration-300 p-0.5"
              >
                <Search size={16} />
              </button>

              <Link to="/cart" className="relative text-dark-text hover:text-gold transition-colors duration-300 p-0.5">
                <ShoppingBag size={16} />
                {count() > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-gold text-white text-[8px] rounded-full flex items-center justify-center font-bold leading-none">
                    {count()}
                  </span>
                )}
              </Link>

              {isAuthenticated ? (
                <div className="relative group p-0.5">
                  <button className="text-dark-text hover:text-gold transition-colors duration-300">
                    <User size={16} />
                  </button>
                  {/* Dropdown */}
                  <div className="absolute right-0 top-full mt-3 w-52 bg-white border border-soft-gray border-t-2 border-t-gold opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-sm">
                    <div className="px-4 py-3 border-b border-soft-gray">
                      <p className="editorial-label mb-0.5">Xin chào</p>
                      <p className="text-sm font-serif text-navy truncate">{user?.full_name || user?.email}</p>
                    </div>
                    <Link to="/account" className="flex items-center gap-2 px-4 py-2.5 text-[11px] text-dark-text hover:text-gold hover:bg-pearl transition-colors" style={{ letterSpacing: '0.08em' }}>
                      <User size={12} /> Tài khoản của tôi
                    </Link>
                    {isAdmin() && (
                      <Link to="/admin" className="flex items-center gap-2 px-4 py-2.5 text-[11px] text-dark-text hover:text-gold hover:bg-pearl transition-colors" style={{ letterSpacing: '0.08em' }}>
                        <LayoutDashboard size={12} /> Quản trị viên
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-[11px] text-dark-text hover:text-gold hover:bg-pearl transition-colors border-t border-soft-gray"
                      style={{ letterSpacing: '0.08em' }}
                    >
                      <LogOut size={12} /> Đăng xuất
                    </button>
                  </div>
                </div>
              ) : (
                <Link to="/login" className="nav-link">Đăng nhập</Link>
              )}
            </div>
          </div>

          {/* Mobile */}
          <div className="md:hidden flex items-center gap-3 ml-auto">
            <button onClick={() => setSearchOpen(!searchOpen)} className="text-dark-text hover:text-gold transition-colors p-1">
              <Search size={17} />
            </button>
            <Link to="/cart" className="relative text-dark-text hover:text-gold transition-colors p-1">
              <ShoppingBag size={17} />
              {count() > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-gold text-white text-[8px] rounded-full flex items-center justify-center font-bold">
                  {count()}
                </span>
              )}
            </Link>
            <button onClick={() => setMenuOpen(!menuOpen)} className="text-dark-text hover:text-gold transition-colors p-1">
              {menuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-soft-gray bg-pearl overflow-hidden"
          >
            <form onSubmit={handleSearch} className="max-w-xl mx-auto px-6 py-3.5 flex gap-3 items-center">
              <Search size={13} className="text-gold shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent border-b border-soft-gray focus:border-gold outline-none text-sm py-1 text-dark-text placeholder-muted-gray transition-colors"
              />
              <button type="submit" className="text-[10px] text-gold hover:text-gold-dark transition-colors" style={{ letterSpacing: '0.15em' }}>
                TÌM
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden border-t border-soft-gray bg-white overflow-hidden"
          >
            <div className="px-6 py-5 space-y-0.5">
              {navLinks.map((link) => (
                <NavLink key={link.to} {...link} />
              ))}
              <div className="pt-4 border-t border-soft-gray/60 mt-2">
                {!isAuthenticated ? (
                  <div className="flex gap-4">
                    <Link to="/login" className="btn-ghost-dark text-[10px]">Đăng nhập</Link>
                    <Link to="/register" className="btn-ghost-dark text-[10px]">Đăng ký</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link to="/account" className="block nav-link">Tài khoản</Link>
                    <button onClick={handleLogout} className="block text-[11px] uppercase text-muted-gray hover:text-gold transition-colors" style={{ letterSpacing: '0.1em' }}>
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
