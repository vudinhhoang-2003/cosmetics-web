import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShoppingBag, Star } from 'lucide-react'
import type { Product } from '../types'
import { useCartStore } from '../store/cartStore'
import { cartApi } from '../api/endpoints'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

interface Props {
  product: Product
}

function formatPrice(p: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p)
}

export default function ProductCard({ product }: Props) {
  const { addItem, count } = useCartStore()
  const { isAuthenticated } = useAuthStore()
  const img = product.images?.[0] || 'https://images.unsplash.com/photo-1586495777744-4e6232bf2f8f?w=600'

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng')
      return
    }
    try {
      const res = await cartApi.add(product.id, 1)
      addItem(res.data)
      toast.success('Đã thêm vào giỏ hàng')
    } catch {
      toast.error('Không thể thêm vào giỏ hàng')
    }
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="product-card group"
    >
      <Link to={`/products/${product.slug}`}>
        <div className="relative overflow-hidden bg-beige aspect-square">
          <img
            src={img}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {product.sale_price && (
            <span className="absolute top-3 left-3 bg-gold text-white text-[11px] font-medium px-2 py-0.5 tracking-wide">
              SALE
            </span>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="text-sm font-medium text-muted-gray tracking-wider">HẾT HÀNG</span>
            </div>
          )}
          {product.stock > 0 && (
            <button
              onClick={handleAddToCart}
              className="absolute bottom-0 left-0 right-0 bg-navy text-white text-xs tracking-wider py-2.5
                         translate-y-full group-hover:translate-y-0 transition-transform duration-300
                         flex items-center justify-center gap-2"
            >
              <ShoppingBag size={14} />
              THÊM VÀO GIỎ
            </button>
          )}
        </div>

        <div className="p-4">
          {product.brand && (
            <p className="text-[11px] text-muted-gray tracking-widest uppercase mb-1">{product.brand}</p>
          )}
          <h3 className="text-sm font-sans font-medium text-dark-text line-clamp-2 mb-2 leading-snug">
            {product.name}
          </h3>

          {product.avg_rating !== undefined && product.avg_rating !== null && (
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={11}
                  className={s <= Math.round(product.avg_rating!) ? 'text-gold fill-gold' : 'text-soft-gray'}
                />
              ))}
              <span className="text-[11px] text-muted-gray ml-1">({product.review_count})</span>
            </div>
          )}

          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-gold">
              {formatPrice(Number(product.sale_price || product.price))}
            </span>
            {product.sale_price && (
              <span className="text-xs text-muted-gray line-through">
                {formatPrice(Number(product.price))}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
