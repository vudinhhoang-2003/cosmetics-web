import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Truck, Shield, Sparkles } from 'lucide-react'
import { productApi, categoryApi } from '../api/endpoints'
import ProductCard from '../components/ProductCard'
import type { Category, Product } from '../types'

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

export default function HomePage() {
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.list().then((r) => r.data),
  })
  const { data: productsData } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productApi.list({ limit: 8 }).then((r) => r.data),
  })

  const categories: Category[] = Array.isArray(categoriesData) ? categoriesData : []
  const products: Product[] = productsData?.items || []

  return (
    <div className="min-h-screen bg-cream">

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative h-screen min-h-[640px] flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1800&q=85')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian/85 via-obsidian/50 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-8 sm:px-12 w-full">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="flex items-center gap-4 mb-8"
            >
              <span className="block w-px h-10 bg-gold" />
              <p className="editorial-label !text-gold/80">Bộ sưu tập 2026</p>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2 }}
              className="font-display font-light text-white leading-[0.9] mb-8"
              style={{ fontSize: 'clamp(3.5rem, 8vw, 7.5rem)' }}
            >
              L'Art de
              <br />
              <em className="text-gold">la Beauté</em>
              <br />
              Parfaite
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              className="font-sans text-white/65 text-sm md:text-base mb-10 max-w-md leading-relaxed tracking-wide"
            >
              Mỹ phẩm cao cấp dành cho người phụ nữ biết trân trọng vẻ đẹp thuần khiết.
              Chắt lọc từ tinh hoa thiên nhiên và nghệ thuật làm đẹp của những bậc thầy.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex items-center gap-10"
            >
              <Link to="/products" className="btn-ghost">Khám phá ngay</Link>
              <Link
                to="/products"
                className="flex items-center gap-2 text-white/50 text-[10px] tracking-luxury uppercase hover:text-gold transition-colors duration-300"
              >
                Xem bộ sưu tập <ArrowRight size={11} />
              </Link>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
        >
          <span className="editorial-label !text-white/30">Scroll</span>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="w-px h-10 bg-gradient-to-b from-gold/60 to-transparent"
          />
        </motion.div>
      </section>

      {/* ── Features strip ────────────────────────────────── */}
      <section className="border-y border-soft-gray bg-pearl py-5">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-soft-gray">
            {[
              { icon: Truck, label: 'Miễn phí vận chuyển', sub: 'Đơn hàng từ 500.000đ' },
              { icon: Shield, label: 'Cam kết chính hãng', sub: '100% sản phẩm authentic' },
              { icon: Sparkles, label: 'Tư vấn làm đẹp', sub: 'Chuyên gia hỗ trợ 24/7' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-4 justify-center py-4">
                <Icon size={16} className="text-gold shrink-0" />
                <div>
                  <p className="font-sans text-xs font-medium text-dark-text tracking-wide">{label}</p>
                  <p className="font-sans text-[11px] text-muted-gray">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories — editorial masonry ────────────────── */}
      {categories.length > 0 && (
        <section className="py-24 px-8 bg-cream">
          <div className="max-w-7xl mx-auto">
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mb-14"
            >
              <p className="editorial-label mb-4">Danh mục</p>
              <h2 className="section-title">Bộ Sưu Tập</h2>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-3 gap-3"
            >
              {categories[0] && (
                <motion.div variants={fadeInUp} className="col-span-2">
                  <Link
                    to={`/products?category=${categories[0].slug}`}
                    className="group relative block aspect-[16/7] overflow-hidden bg-soft-gray"
                  >
                    <img
                      src={categories[0].image_url || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=900&q=80'}
                      alt={categories[0].name}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian/80 via-obsidian/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-8">
                      <p className="editorial-label mb-2 !text-gold/80">Collection</p>
                      <h3 className="font-display text-4xl font-light text-white mb-3">{categories[0].name}</h3>
                      <span className="flex items-center gap-2 text-white/60 text-[10px] tracking-luxury uppercase group-hover:text-gold transition-colors duration-300">
                        Khám phá <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              )}

              {categories.slice(1, 3).map((cat) => (
                <motion.div key={cat.id} variants={fadeInUp}>
                  <Link
                    to={`/products?category=${cat.slug}`}
                    className="group relative block aspect-[4/5] overflow-hidden bg-soft-gray"
                  >
                    <img
                      src={cat.image_url || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=70'}
                      alt={cat.name}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian/80 via-obsidian/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-6">
                      <h3 className="font-display text-2xl font-light text-white mb-2">{cat.name}</h3>
                      <span className="flex items-center gap-2 text-white/60 text-[10px] tracking-luxury uppercase group-hover:text-gold transition-colors duration-300">
                        Xem thêm <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}

              {categories.slice(3, 6).map((cat) => (
                <motion.div key={cat.id} variants={fadeInUp}>
                  <Link
                    to={`/products?category=${cat.slug}`}
                    className="group relative block aspect-[4/3] overflow-hidden bg-soft-gray"
                  >
                    <img
                      src={cat.image_url || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=70'}
                      alt={cat.name}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian/70 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 p-5">
                      <h3 className="font-serif text-lg text-white">{cat.name}</h3>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ── Manifesto ─────────────────────────────────────── */}
      <section className="bg-obsidian py-28 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <span className="luxury-rule w-16 mx-auto mb-10 block" />
            <blockquote
              className="font-display italic font-light text-white mb-8"
              style={{ fontSize: 'clamp(1.8rem, 4.5vw, 3.8rem)', lineHeight: 1.3 }}
            >
              "Vẻ đẹp không phải là điều bạn sở hữu —<br />
              <em className="text-gold">đó là nghệ thuật bạn thể hiện."</em>
            </blockquote>
            <span className="luxury-rule w-16 mx-auto mb-10 block" />
            <p className="editorial-label !text-white/30 mb-10">Luxe Beauty — Philosophy</p>
            <Link to="/products" className="btn-ghost">Khám phá triết lý làm đẹp</Link>
          </motion.div>
        </div>
      </section>

      {/* ── Featured Products ─────────────────────────────── */}
      {products.length > 0 && (
        <section className="py-24 px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex items-end justify-between mb-14"
            >
              <div>
                <p className="editorial-label mb-4">Nổi bật</p>
                <h2 className="section-title">Được Yêu Thích</h2>
              </div>
              <Link to="/products" className="btn-ghost-dark hidden sm:block">Xem tất cả</Link>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {products.map((product) => (
                <motion.div key={product.id} variants={fadeInUp}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>

            <div className="text-center mt-12 sm:hidden">
              <Link to="/products" className="btn-ghost-dark">Xem tất cả sản phẩm</Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Editorial Banner ──────────────────────────────── */}
      <section className="relative py-36 px-8 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=1800&q=80')" }}
        />
        <div className="absolute inset-0 bg-obsidian/60" />
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative z-10 max-w-xl"
        >
          <p className="editorial-label !text-gold/80 mb-6">Đặc quyền thành viên</p>
          <h2
            className="font-display font-light text-white mb-6"
            style={{ fontSize: 'clamp(2.2rem, 4.5vw, 4rem)', lineHeight: 1.1 }}
          >
            Trải Nghiệm<br />
            <em className="text-gold">Vẻ Đẹp Đỉnh Cao</em>
          </h2>
          <span className="luxury-rule w-12 mb-6 block" />
          <p className="font-sans text-white/60 text-sm mb-10 leading-relaxed max-w-sm">
            Đăng ký thành viên để nhận ưu đãi độc quyền và quyền tiếp cận sớm các bộ sưu tập mới nhất.
          </p>
          <div className="flex items-center gap-8">
            <Link to="/register" className="btn-ghost">Đăng ký ngay</Link>
            <Link
              to="/products"
              className="text-white/40 text-[10px] tracking-luxury uppercase hover:text-gold transition-colors"
            >
              Tìm hiểu thêm
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Brand Values ──────────────────────────────────── */}
      <section className="py-24 px-8 bg-pearl">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="editorial-label mb-4">Tại sao chọn chúng tôi</p>
            <h2 className="section-title">Cam Kết Của Luxe Beauty</h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-soft-gray"
          >
            {[
              { num: '01', title: 'Thành phần thiên nhiên', desc: 'Mỗi sản phẩm được chắt lọc từ những nguyên liệu thiên nhiên thuần khiết, không chứa hóa chất độc hại.' },
              { num: '02', title: 'Công nghệ tiên tiến', desc: 'Kết hợp công nghệ làm đẹp hiện đại với tri thức dưỡng da truyền thống để mang lại hiệu quả tối ưu.' },
              { num: '03', title: 'Kiểm định quốc tế', desc: 'Tất cả sản phẩm đạt chứng nhận an toàn quốc tế, được kiểm tra nghiêm ngặt trước khi đến tay bạn.' },
            ].map(({ num, title, desc }) => (
              <motion.div key={num} variants={fadeInUp} className="px-10 py-12 first:pl-0 last:pr-0">
                <p className="font-display text-5xl font-light text-gold/20 mb-6 leading-none">{num}</p>
                <h3 className="font-serif text-lg text-dark-text mb-4">{title}</h3>
                <p className="font-sans text-muted-gray text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  )
}
