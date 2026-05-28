import { Link } from 'react-router-dom'
import { Instagram, Facebook } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-obsidian text-white">
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
                { icon: Instagram, href: 'https://www.instagram.com' },
                { icon: Facebook, href: 'https://www.facebook.com' },
              ].map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
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
                { label: 'Mascara & Mắt', to: '/products?category=mascara-mat' },
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
              <li>Gia Lâm, Hà Nội</li>
              <li>0845366882</li>
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
        </div>
      </div>
    </footer>
  )
}
