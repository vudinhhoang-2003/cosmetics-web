import { Link } from 'react-router-dom'
import { Instagram, Facebook, Youtube, Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-navy text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <h3 className="font-serif text-2xl font-bold tracking-widest mb-4">
              LUXE<span className="text-gold"> BEAUTY</span>
            </h3>
            <p className="text-sm text-white/60 leading-relaxed mb-6">
              Mỹ phẩm cao cấp chính hãng từ các thương hiệu danh tiếng thế giới.
              Nơi vẻ đẹp đẳng cấp hội tụ.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 border border-white/20 flex items-center justify-center hover:border-gold hover:text-gold transition-colors">
                <Instagram size={16} />
              </a>
              <a href="#" className="w-9 h-9 border border-white/20 flex items-center justify-center hover:border-gold hover:text-gold transition-colors">
                <Facebook size={16} />
              </a>
              <a href="#" className="w-9 h-9 border border-white/20 flex items-center justify-center hover:border-gold hover:text-gold transition-colors">
                <Youtube size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-sans font-medium tracking-widest uppercase text-gold mb-5">Danh Mục</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Son Môi', to: '/products?category=son-moi' },
                { label: 'Kem Dưỡng Da', to: '/products?category=kem-duong-da' },
                { label: 'Nước Hoa', to: '/products?category=nuoc-hoa' },
                { label: 'Phấn Trang Điểm', to: '/products?category=phan-trang-diem' },
                { label: 'Chăm Sóc Da', to: '/products?category=cham-soc-da' },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="text-sm text-white/60 hover:text-gold transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer */}
          <div>
            <h4 className="text-xs font-sans font-medium tracking-widest uppercase text-gold mb-5">Hỗ Trợ</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Tài khoản của tôi', to: '/account' },
                { label: 'Lịch sử đơn hàng', to: '/account' },
                { label: 'Chính sách đổi trả', to: '#' },
                { label: 'Hướng dẫn mua hàng', to: '#' },
                { label: 'Câu hỏi thường gặp', to: '#' },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="text-sm text-white/60 hover:text-gold transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-sans font-medium tracking-widest uppercase text-gold mb-5">Liên Hệ</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-white/60">
                <MapPin size={15} className="mt-0.5 flex-shrink-0 text-gold" />
                123 Đường Nguyễn Huệ, Quận 1, TP.HCM
              </li>
              <li className="flex items-center gap-3 text-sm text-white/60">
                <Phone size={15} className="flex-shrink-0 text-gold" />
                1800 6789 (Miễn phí)
              </li>
              <li className="flex items-center gap-3 text-sm text-white/60">
                <Mail size={15} className="flex-shrink-0 text-gold" />
                hello@luxebeauty.vn
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-white/40">
            © 2026 Luxe Beauty. Tất cả quyền được bảo lưu.
          </p>
          <p className="text-xs text-white/40">
            Được xây dựng với ♥ tại Việt Nam
          </p>
        </div>
      </div>
    </footer>
  )
}
