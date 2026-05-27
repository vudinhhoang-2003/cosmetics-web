import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Instagram, Facebook, Youtube } from 'lucide-react'

export default function Footer() {
  const [email, setEmail] = useState('')

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault()
    setEmail('')
  }

  return (
    <footer className="bg-obsidian text-white">
      {/* Newsletter strip */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-14 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <p className="editorial-label mb-2">Bản Tin Độc Quyền</p>
            <h3 className="font-display text-2xl md:text-3xl font-light text-white">
              Nhận ưu đãi riêng dành cho thành viên
            </h3>
          </div>
          <form onSubmit={handleNewsletter} className="flex gap-0 w-full md:w-auto md:min-w-[380px]">
            <input
              type="email"
              placeholder="Địa chỉ email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 bg-transparent border border-white/20 border-r-0 px-5 py-3.5
                         text-sm text-white placeholder-white/30 focus:outline-none focus:border-gold/60 transition-colors"
            />
            <button
              type="submit"
              className="btn-gold shrink-0 px-6 py-3.5 text-[10px]"
            >
              Đăng Ký
            </button>
          </form>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 pt-14 pb-10">
        {/* Logo + tagline */}
        <div className="mb-10">
          <Link to="/" className="inline-block mb-4">
            <span className="font-display text-3xl font-light tracking-ultra select-none">
              LUXE<span className="text-gold"> BEAUTY</span>
            </span>
          </Link>
          <p className="text-xs text-white/40 tracking-wider max-w-xs leading-relaxed">
            Mỹ phẩm cao cấp chính hãng. Nơi vẻ đẹp đẳng cấp hội tụ.
          </p>
        </div>

        {/* Gold rule */}
        <span className="luxury-rule mb-10 block opacity-30" />

        {/* Links grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand / Social */}
          <div>
            <p className="editorial-label mb-6">Kết Nối</p>
            <div className="flex gap-3">
              {[
                { icon: Instagram, href: '#' },
                { icon: Facebook, href: '#' },
                { icon: Youtube, href: '#' },
              ].map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center
                             text-white/50 hover:border-gold hover:text-gold transition-all duration-300"
                >
                  <Icon size={13} />
                </a>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <p className="editorial-label mb-6">Danh Mục</p>
            <ul className="space-y-3">
              {[
                { label: 'Son Môi', to: '/products?category=son-moi' },
                { label: 'Kem Dưỡng Da', to: '/products?category=kem-duong-da' },
                { label: 'Nước Hoa', to: '/products?category=nuoc-hoa' },
                { label: 'Phấn Trang Điểm', to: '/products?category=phan-trang-diem' },
                { label: 'Chăm Sóc Da', to: '/products?category=cham-soc-da' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="text-xs text-white/45 hover:text-gold transition-colors duration-300 tracking-wider"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <p className="editorial-label mb-6">Hỗ Trợ</p>
            <ul className="space-y-3">
              {[
                { label: 'Tài khoản của tôi', to: '/account' },
                { label: 'Lịch sử đơn hàng', to: '/account' },
                { label: 'Chính sách đổi trả', to: '#' },
                { label: 'Hướng dẫn mua hàng', to: '#' },
                { label: 'Câu hỏi thường gặp', to: '#' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="text-xs text-white/45 hover:text-gold transition-colors duration-300 tracking-wider"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="editorial-label mb-6">Liên Hệ</p>
            <ul className="space-y-3 text-xs text-white/45 tracking-wider leading-relaxed">
              <li>123 Đường Nguyễn Huệ<br />Quận 1, TP.HCM</li>
              <li>1800 6789 (Miễn phí)</li>
              <li>hello@luxebeauty.vn</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <span className="luxury-rule mt-12 mb-6 block opacity-20" />
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-[10px] text-white/25 tracking-wider">
            © 2026 Luxe Beauty. Tất cả quyền được bảo lưu.
          </p>
          <p className="text-[10px] text-white/25 tracking-wider">
            Được xây dựng với ♥ tại Việt Nam
          </p>
        </div>
      </div>
    </footer>
  )
}
