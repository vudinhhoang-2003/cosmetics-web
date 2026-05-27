import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ShoppingBag, User, Search, Menu, X, LogOut, LayoutDashboard } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { useCartStore } from '../store/cartStore'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const { isAuthenticated, user, logout, isAdmin } = useAuthStore()
  const { count } = useCartStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50)
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

  const navLinks = [
    { label: 'Trang Chủ', to: '/' },
    { label: 'Sản Phẩm', to: '/products' },
    { label: 'Son Môi', to: '/products?category=son-moi' },
    { label: 'Chăm Sóc Da', to: '/products?category=cham-soc-da' },
    { label: 'Nước Hoa', to: '/products?category=nuoc-hoa' },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm' : 'bg-white'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <span className="font-serif text-xl md:text-2xl font-bold text-navy tracking-widest">
              LUXE<span className="text-gold"> BEAUTY</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="text-sm font-sans text-dark-text hover:text-gold tracking-wider uppercase transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-1 text-dark-text hover:text-gold transition-colors"
            >
              <Search size={20} />
            </button>

            <Link to="/cart" className="relative p-1 text-dark-text hover:text-gold transition-colors">
              <ShoppingBag size={20} />
              {count() > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {count()}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center gap-1 p-1 text-dark-text hover:text-gold transition-colors">
                  <User size={20} />
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white shadow-lg border border-soft-gray opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="px-4 py-3 border-b border-soft-gray">
                    <p className="text-xs text-muted-gray">Xin chào,</p>
                    <p className="text-sm font-medium text-navy truncate">{user?.full_name || user?.email}</p>
                  </div>
                  <Link to="/account" className="flex items-center gap-2 px-4 py-2.5 text-sm text-dark-text hover:bg-beige hover:text-gold transition-colors">
                    <User size={15} /> Tài khoản
                  </Link>
                  {isAdmin() && (
                    <Link to="/admin" className="flex items-center gap-2 px-4 py-2.5 text-sm text-dark-text hover:bg-beige hover:text-gold transition-colors">
                      <LayoutDashboard size={15} /> Quản trị
                    </Link>
                  )}
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-dark-text hover:bg-beige hover:text-gold transition-colors"
                  >
                    <LogOut size={15} /> Đăng xuất
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="hidden md:block text-sm font-medium text-navy hover:text-gold transition-colors">
                Đăng nhập
              </Link>
            )}

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-1 text-dark-text hover:text-gold transition-colors"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
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
            className="border-t border-soft-gray bg-white overflow-hidden"
          >
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto px-4 py-4 flex gap-3">
              <input
                autoFocus
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 input-field"
              />
              <button type="submit" className="btn-gold px-4">
                <Search size={18} />
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
            className="md:hidden border-t border-soft-gray bg-white overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="block py-2.5 text-sm font-sans tracking-wider text-dark-text hover:text-gold transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              {!isAuthenticated && (
                <>
                  <Link to="/login" className="block py-2.5 text-sm font-medium text-navy">Đăng nhập</Link>
                  <Link to="/register" className="block py-2.5 text-sm font-medium text-gold">Đăng ký</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
