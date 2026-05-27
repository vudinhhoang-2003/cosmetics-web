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

  const navLinks = [
    { label: 'Trang Chủ', to: '/' },
    { label: 'Sản Phẩm', to: '/products' },
    { label: 'Son Môi', to: '/products?category=son-moi' },
    { label: 'Chăm Sóc Da', to: '/products?category=cham-soc-da' },
    { label: 'Nước Hoa', to: '/products?category=nuoc-hoa' },
  ]

  return (
    <>
      {/* Gold top accent line */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-gold z-50" />

      <header
        className={`fixed top-0.5 left-0 right-0 z-40 transition-all duration-500 ${
          scrolled
            ? 'bg-white/97 backdrop-blur-sm border-b border-gold/30'
            : 'bg-white'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">

            {/* Desktop left nav */}
            <nav className="hidden md:flex items-center gap-8 w-64">
              {navLinks.slice(0, 3).map((link) => (
                <Link key={link.label} to={link.to} className="nav-link pb-0.5">
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Logo — centered on desktop */}
            <Link to="/" className="absolute left-1/2 -translate-x-1/2 flex-shrink-0">
              <span className="font-display text-xl md:text-2xl font-medium text-navy tracking-ultra select-none">
                LUXE<span className="text-gold"> BEAUTY</span>
              </span>
            </Link>

            {/* Desktop right nav */}
            <div className="hidden md:flex items-center gap-8 justify-end w-64">
              {navLinks.slice(3).map((link) => (
                <Link key={link.label} to={link.to} className="nav-link pb-0.5">
                  {link.label}
                </Link>
              ))}

              {/* Icons */}
              <div className="flex items-center gap-4 ml-2">
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="text-dark-text hover:text-gold transition-colors duration-300"
                >
                  <Search size={17} />
                </button>

                <Link to="/cart" className="relative text-dark-text hover:text-gold transition-colors duration-300">
                  <ShoppingBag size={17} />
                  {count() > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-gold text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                      {count()}
                    </span>
                  )}
                </Link>

                {isAuthenticated ? (
                  <div className="relative group">
                    <button className="text-dark-text hover:text-gold transition-colors duration-300">
                      <User size={17} />
                    </button>
                    {/* Dropdown */}
                    <div className="absolute right-0 top-full mt-4 w-52 bg-white border-l border-gold opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                      <div className="px-5 py-4 border-b border-soft-gray">
                        <p className="editorial-label mb-0.5">Xin chào</p>
                        <p className="text-sm font-serif text-navy truncate">{user?.full_name || user?.email}</p>
                      </div>
                      <Link to="/account" className="flex items-center gap-2.5 px-5 py-3 text-xs tracking-wider text-dark-text hover:text-gold hover:bg-pearl transition-colors">
                        <User size={13} /> Tài khoản
                      </Link>
                      {isAdmin() && (
                        <Link to="/admin" className="flex items-center gap-2.5 px-5 py-3 text-xs tracking-wider text-dark-text hover:text-gold hover:bg-pearl transition-colors">
                          <LayoutDashboard size={13} /> Quản trị
                        </Link>
                      )}
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2.5 px-5 py-3 text-xs tracking-wider text-dark-text hover:text-gold hover:bg-pearl transition-colors"
                      >
                        <LogOut size={13} /> Đăng xuất
                      </button>
                    </div>
                  </div>
                ) : (
                  <Link to="/login" className="nav-link pb-0.5">
                    Đăng nhập
                  </Link>
                )}
              </div>
            </div>

            {/* Mobile */}
            <div className="md:hidden flex items-center gap-4 ml-auto">
              <Link to="/cart" className="relative text-dark-text hover:text-gold transition-colors">
                <ShoppingBag size={18} />
                {count() > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-gold text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                    {count()}
                  </span>
                )}
              </Link>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-dark-text hover:text-gold transition-colors"
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
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
              transition={{ duration: 0.3 }}
              className="border-t border-soft-gray bg-pearl overflow-hidden"
            >
              <form onSubmit={handleSearch} className="max-w-xl mx-auto px-6 py-4 flex gap-4 items-center">
                <Search size={14} className="text-gold shrink-0" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent border-b border-soft-gray focus:border-gold outline-none text-sm py-1 text-dark-text placeholder-muted-gray transition-colors"
                />
                <button type="submit" className="editorial-label hover:text-gold-dark transition-colors">
                  Tìm
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
              transition={{ duration: 0.3 }}
              className="md:hidden border-t border-soft-gray bg-white overflow-hidden"
            >
              <div className="px-6 py-6 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.to}
                    className="block py-3 text-xs tracking-luxury uppercase text-dark-text hover:text-gold transition-colors border-b border-soft-gray/50"
                  >
                    {link.label}
                  </Link>
                ))}
                {!isAuthenticated ? (
                  <div className="pt-4 flex gap-4">
                    <Link to="/login" className="btn-ghost-dark">Đăng nhập</Link>
                    <Link to="/register" className="btn-ghost-dark">Đăng ký</Link>
                  </div>
                ) : (
                  <div className="pt-4 space-y-3">
                    <Link to="/account" className="block text-xs tracking-luxury uppercase text-dark-text hover:text-gold">
                      Tài khoản
                    </Link>
                    <button onClick={logout} className="block text-xs tracking-luxury uppercase text-muted-gray hover:text-gold">
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  )
}
