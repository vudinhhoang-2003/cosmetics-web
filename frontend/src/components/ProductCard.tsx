import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ShoppingBag, Star } from 'lucide-react'
import type { Product } from '../types'
import { useCartStore } from '../store/cartStore'
import { cartApi } from '../api/endpoints'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { formatPrice } from '../utils/format'

interface Props {
  product: Product
}

export default function ProductCard({ product }: Props) {
  const queryClient = useQueryClient()
  const { addItem } = useCartStore()
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
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      toast.success('Đã thêm vào giỏ hàng')
    } catch {
      toast.error('Không thể thêm vào giỏ hàng')
    }
  }

  return (
    <div className="product-card group border border-transparent hover:border-gold/30 transition-all duration-500 h-full">
      <Link to={`/products/${product.slug}`} className="h-full flex flex-col">
        {/* Image */}
        <div className="relative overflow-hidden bg-pearl aspect-square">
          <img
            src={img}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />

          {product.sale_price && (
            <span className="absolute top-3 left-3 bg-rose-gold text-white text-[9px] font-sans tracking-luxury px-2.5 py-1 uppercase">
              Ưu đãi
            </span>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="editorial-label !text-muted-gray">Hết hàng</span>
            </div>
          )}

          {/* Quick-add strip */}
          {product.stock > 0 && (
            <button
              onClick={handleAddToCart}
              className="absolute bottom-0 left-0 right-0 bg-obsidian text-white text-[10px] tracking-luxury py-3
                         translate-y-full group-hover:translate-y-0 transition-transform duration-500
                         flex items-center justify-center gap-2 uppercase"
            >
              <ShoppingBag size={12} />
              Thêm vào giỏ
            </button>
          )}
        </div>

        {/* Info - Sử dụng flex-col và flex-1 để kéo giãn phần nội dung thông tin */}
        <div className="px-4 py-4 border-t border-soft-gray/60 flex-1 flex flex-col">
          {product.brand && (
            <p className="editorial-label mb-2">{product.brand}</p>
          )}
          {/* Tên sản phẩm: Đặt min-h-[2.5rem] (tương đương 2 dòng chữ) để đảm bảo dù tên ngắn 1 dòng hay dài 2 dòng thì chiều cao phần chứa tên vẫn bằng nhau, tránh lệch hàng */}
          <h3 className="font-serif text-sm text-dark-text line-clamp-2 mb-2 leading-snug min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* Đánh giá sao: Cố định min-h-[1.25rem] để các card không có đánh giá vẫn thẳng hàng với card có đánh giá */}
          <div className="min-h-[1.25rem] mb-3 flex items-center">
            {product.avg_rating !== undefined && product.avg_rating !== null && (
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={10}
                    className={s <= Math.round(product.avg_rating!) ? 'text-gold fill-gold' : 'text-soft-gray fill-soft-gray'}
                  />
                ))}
                {product.review_count ? (
                  <span className="text-[10px] text-muted-gray ml-1 font-sans">({product.review_count})</span>
                ) : null}
              </div>
            )}
          </div>

          {/* Giá tiền và tồn kho: Sử dụng mt-auto để đẩy toàn bộ khối này xuống sát đáy cùng của card */}
          <div className="mt-auto pt-3 border-t border-soft-gray/30 space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="price-gold text-sm">
                {formatPrice(Number(product.sale_price || product.price))}
              </span>
              {product.sale_price && (
                <span className="text-xs text-muted-gray line-through font-sans">
                  {formatPrice(Number(product.price))}
                </span>
              )}
            </div>
            
            {/* Hiển thị số lượng tồn kho hoặc thông báo hết hàng */}
            <p className="text-[10px] text-muted-gray font-sans">
              {product.stock > 0 ? `Còn lại: ${product.stock}` : 'Hết hàng'}
            </p>
          </div>
        </div>
      </Link>
    </div>
  )
}
