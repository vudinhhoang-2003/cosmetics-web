import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Shield, Truck } from 'lucide-react'
import { productApi, categoryApi } from '../api/endpoints'
import ProductCard from '../components/ProductCard'
import type { Category, Product } from '../types'

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
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

  const categories: Category[] = categoriesData || []
  const products: Product[] = productsData?.items || []

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Section */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1800&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-navy/60" />
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <motion.p
            initial={{ opacity: 0, letterSpacing: '0.3em' }}
            animate={{ opacity: 1, letterSpacing: '0.5em' }}
            transition={{ duration: 1 }}
            className="text-gold text-xs font-sans tracking-[0.5em] uppercase mb-6"
          >
            Chào mừng đến với
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="font-serif text-6xl md:text-8xl text-white mb-6 leading-none tracking-wide"
          >
            LUXE BEAUTY
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="font-sans text-white/80 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Khám phá bộ sưu tập mỹ phẩm cao cấp, được chắt lọc từ những tinh hoa
            thiên nhiên và công nghệ làm đẹp tiên tiến nhất thế giới.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/products" className="btn-gold px-10 py-4 text-sm tracking-widest">
              KHÁM PHÁ
            </Link>
            <Link to="/products" className="btn-outline border-white text-white hover:bg-white hover:text-navy px-10 py-4 text-sm tracking-widest transition-colors">
              MUA NGAY
            </Link>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-white/60 text-xs tracking-widest uppercase font-sans">Cuộn xuống</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-0.5 h-8 bg-gold/60 rounded-full"
          />
        </motion.div>
      </section>

      {/* Features Strip */}
      <section className="bg-navy py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-white/10">
            {[
              { icon: Truck, label: 'Miễn phí vận chuyển', sub: 'Đơn hàng từ 500.000đ' },
              { icon: Shield, label: 'Cam kết chính hãng', sub: '100% sản phẩm authentic' },
              { icon: Sparkles, label: 'Tư vấn làm đẹp', sub: 'Chuyên gia hỗ trợ 24/7' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-4 justify-center py-2 md:py-0">
                <Icon size={22} className="text-gold shrink-0" />
                <div>
                  <p className="text-white font-sans text-sm font-semibold">{label}</p>
                  <p className="text-white/50 text-xs font-sans">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="py-20 px-6 bg-beige">
          <div className="max-w-7xl mx-auto">
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center mb-14"
            >
              <p className="text-gold text-xs tracking-[0.4em] uppercase font-sans mb-3">Danh mục</p>
              <h2 className="section-title">Bộ Sưu Tập</h2>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {categories.slice(0, 6).map((cat) => (
                <motion.div key={cat.id} variants={fadeInUp}>
                  <Link
                    to={`/products?category=${cat.slug}`}
                    className="group relative block aspect-[4/3] overflow-hidden rounded-sm bg-soft-gray"
                  >
                    <img
                      src={
                        cat.image_url ||
                        'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=70'
                      }
                      alt={cat.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="font-serif text-2xl text-white mb-1">{cat.name}</h3>
                      <span className="text-gold text-xs tracking-widest uppercase flex items-center gap-1 font-sans">
                        Khám phá <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {products.length > 0 && (
        <section className="py-20 px-6 bg-cream">
          <div className="max-w-7xl mx-auto">
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center mb-14"
            >
              <p className="text-gold text-xs tracking-[0.4em] uppercase font-sans mb-3">Nổi bật</p>
              <h2 className="section-title">Sản Phẩm Được Yêu Thích</h2>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
              {products.map((product) => (
                <motion.div key={product.id} variants={fadeInUp}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <Link to="/products" className="btn-navy px-12 py-4 text-sm tracking-widest inline-block">
                XEM TẤT CẢ SẢN PHẨM
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* Luxury Banner */}
      <section className="relative py-32 px-6 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=1800&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-navy/75" />
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative z-10 text-center max-w-3xl mx-auto"
        >
          <p className="text-gold text-xs tracking-[0.5em] uppercase font-sans mb-5">Đặc quyền thành viên</p>
          <h2 className="font-serif text-4xl md:text-5xl text-white mb-6 leading-tight">
            Trải Nghiệm Vẻ Đẹp<br />Đẳng Cấp Thượng Lưu
          </h2>
          <p className="text-white/70 font-sans mb-10 text-lg leading-relaxed">
            Đăng ký thành viên để nhận ưu đãi độc quyền, tư vấn làm đẹp cá nhân hóa
            và quyền tiếp cận sớm các bộ sưu tập mới nhất.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-gold px-10 py-4 text-sm tracking-widest">
              ĐĂNG KÝ NGAY
            </Link>
            <Link to="/products" className="border border-white/50 text-white hover:border-gold hover:text-gold px-10 py-4 text-sm tracking-widest transition-colors font-sans">
              TÌM HIỂU THÊM
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Testimonial / Brand Values */}
      <section className="py-20 px-6 bg-beige">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="text-gold text-xs tracking-[0.4em] uppercase font-sans mb-3">Tại sao chọn chúng tôi</p>
            <h2 className="section-title mb-16">Cam Kết Của Luxe Beauty</h2>
          </motion.div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-10"
          >
            {[
              {
                title: 'Thành phần thiên nhiên',
                desc: 'Mỗi sản phẩm được chắt lọc từ những nguyên liệu thiên nhiên thuần khiết, không chứa hóa chất độc hại.',
              },
              {
                title: 'Công nghệ tiên tiến',
                desc: 'Kết hợp công nghệ làm đẹp hiện đại nhất với tri thức dưỡng da truyền thống để mang lại hiệu quả tối ưu.',
              },
              {
                title: 'Kiểm định quốc tế',
                desc: 'Tất cả sản phẩm đều đạt chứng nhận an toàn quốc tế, được kiểm tra nghiêm ngặt trước khi đến tay bạn.',
              },
            ].map(({ title, desc }) => (
              <motion.div key={title} variants={fadeInUp} className="text-center">
                <div className="w-16 h-0.5 bg-gold mx-auto mb-6" />
                <h3 className="font-serif text-xl text-dark-text mb-4">{title}</h3>
                <p className="font-sans text-muted-gray text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  )
}
