import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Star, Minus, Plus, ShoppingBag, ChevronRight, Package } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { productApi } from '../api/endpoints'
import { useAuthStore } from '../store/authStore'
import { useCartStore } from '../store/cartStore'
import { cartApi } from '../api/endpoints'
import ProductCard from '../components/ProductCard'
import type { Review } from '../types'

function formatPrice(p: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p)
}

interface ReviewForm {
  rating: number
  comment: string
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { isAuthenticated } = useAuthStore()
  const { addItem } = useCartStore()
  const queryClient = useQueryClient()

  const [activeImage, setActiveImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [reviewRating, setReviewRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ReviewForm>()

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productApi.get(slug!).then((r) => r.data),
    enabled: !!slug,
  })

  const { data: reviews } = useQuery({
    queryKey: ['reviews', product?.id],
    queryFn: () => productApi.getReviews(product!.id).then((r) => r.data),
    enabled: !!product?.id,
  })

  const { data: relatedData } = useQuery({
    queryKey: ['related', product?.category_id],
    queryFn: () =>
      productApi
        .list({ category: product?.category?.slug, limit: 4 })
        .then((r) => r.data),
    enabled: !!product?.category?.slug,
  })

  const relatedProducts = relatedData?.items.filter((p) => p.id !== product?.id).slice(0, 4) || []

  const addToCartMutation = useMutation({
    mutationFn: () => cartApi.add(product!.id, quantity),
    onSuccess: (res) => {
      addItem(res.data)
      toast.success('Đã thêm vào giỏ hàng')
    },
    onError: () => toast.error('Không thể thêm vào giỏ hàng'),
  })

  const reviewMutation = useMutation({
    mutationFn: (data: ReviewForm) =>
      productApi.createReview(product!.id, { rating: reviewRating, comment: data.comment }),
    onSuccess: () => {
      toast.success('Cảm ơn bạn đã đánh giá!')
      queryClient.invalidateQueries({ queryKey: ['reviews', product?.id] })
      queryClient.invalidateQueries({ queryKey: ['product', slug] })
      reset()
      setReviewRating(5)
    },
    onError: () => toast.error('Không thể gửi đánh giá'),
  })

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng')
      return
    }
    addToCartMutation.mutate()
  }

  const onSubmitReview = (data: ReviewForm) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để đánh giá')
      return
    }
    reviewMutation.mutate(data)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-4">
        <p className="font-serif text-2xl text-dark-text">Không tìm thấy sản phẩm</p>
        <Link to="/products" className="btn-gold px-8">Quay lại cửa hàng</Link>
      </div>
    )
  }

  const images =
    product.images?.length
      ? product.images
      : ['https://images.unsplash.com/photo-1586495777744-4e6232bf2f8f?w=800']

  const displayPrice = product.sale_price ?? product.price
  const discount = product.sale_price
    ? Math.round(((product.price - product.sale_price) / product.price) * 100)
    : 0

  const averageRating =
    reviews && reviews.length
      ? reviews.reduce((s: number, r: Review) => s + r.rating, 0) / reviews.length
      : product.avg_rating || 0

  return (
    <div className="min-h-screen bg-cream">
      {/* Breadcrumb */}
      <div className="bg-beige border-b border-soft-gray py-3 px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs font-sans text-muted-gray">
          <Link to="/" className="hover:text-gold transition-colors">Trang chủ</Link>
          <ChevronRight size={12} />
          <Link to="/products" className="hover:text-gold transition-colors">Sản phẩm</Link>
          <ChevronRight size={12} />
          {product.category && (
            <>
              <Link
                to={`/products?category=${product.category.slug}`}
                className="hover:text-gold transition-colors"
              >
                {product.category.name}
              </Link>
              <ChevronRight size={12} />
            </>
          )}
          <span className="text-dark-text line-clamp-1">{product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Main product section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">
          {/* Image gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Main image */}
            <div className="aspect-square bg-beige overflow-hidden mb-4">
              <motion.img
                key={activeImage}
                src={images[activeImage]}
                alt={product.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`shrink-0 w-20 h-20 overflow-hidden border-2 transition-colors ${
                      activeImage === idx ? 'border-gold' : 'border-transparent hover:border-soft-gray'
                    }`}
                  >
                    <img src={img} alt={`Ảnh ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col"
          >
            {/* Brand */}
            {product.brand && (
              <p className="text-xs text-gold tracking-[0.4em] uppercase font-sans mb-3">
                {product.brand}
              </p>
            )}

            {/* Name */}
            <h1 className="font-serif text-3xl md:text-4xl text-dark-text mb-4 leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            {reviews && reviews.length > 0 && (
              <div className="flex items-center gap-2 mb-5">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={16}
                      className={s <= Math.round(averageRating) ? 'text-gold fill-gold' : 'text-soft-gray fill-soft-gray'}
                    />
                  ))}
                </div>
                <span className="font-sans text-sm text-muted-gray">
                  {averageRating.toFixed(1)} ({reviews.length} đánh giá)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="price-gold text-3xl">{formatPrice(displayPrice)}</span>
              {product.sale_price && (
                <>
                  <span className="text-lg text-muted-gray line-through">{formatPrice(product.price)}</span>
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 font-sans font-semibold">
                    -{discount}%
                  </span>
                </>
              )}
            </div>

            {/* Stock indicator */}
            <div className="flex items-center gap-2 mb-6">
              <Package size={16} className={product.stock > 0 ? 'text-green-500' : 'text-red-400'} />
              {product.stock > 10 ? (
                <span className="font-sans text-sm text-green-600">Còn hàng</span>
              ) : product.stock > 0 ? (
                <span className="font-sans text-sm text-amber-600">Chỉ còn {product.stock} sản phẩm</span>
              ) : (
                <span className="font-sans text-sm text-red-500">Hết hàng</span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="font-sans text-sm text-muted-gray leading-relaxed mb-8 border-t border-soft-gray pt-6">
                {product.description}
              </p>
            )}

            {/* Quantity + Add to cart */}
            {product.stock > 0 && (
              <div className="flex items-center gap-4 mb-8">
                {/* Quantity selector */}
                <div className="flex items-center border border-soft-gray">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-10 h-11 flex items-center justify-center text-dark-text hover:bg-soft-gray transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-12 text-center font-sans text-sm text-dark-text">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                    className="w-10 h-11 flex items-center justify-center text-dark-text hover:bg-soft-gray transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={addToCartMutation.isPending}
                  className="flex-1 btn-gold flex items-center justify-center gap-3 py-3 disabled:opacity-70"
                >
                  <ShoppingBag size={18} />
                  {addToCartMutation.isPending ? 'Đang thêm...' : 'THÊM VÀO GIỎ'}
                </button>
              </div>
            )}

            {/* Category */}
            {product.category && (
              <p className="font-sans text-xs text-muted-gray">
                Danh mục:{' '}
                <Link
                  to={`/products?category=${product.category.slug}`}
                  className="text-gold hover:underline"
                >
                  {product.category.name}
                </Link>
              </p>
            )}
          </motion.div>
        </div>

        {/* Reviews section */}
        <div className="mt-20">
          <h2 className="font-serif text-2xl text-dark-text mb-8 pb-4 border-b border-soft-gray">
            Đánh Giá ({reviews?.length || 0})
          </h2>

          {/* Review list */}
          {reviews && reviews.length > 0 ? (
            <div className="space-y-6 mb-12">
              {reviews.map((review: Review) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-beige p-6"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-sans text-sm font-semibold text-dark-text">
                        {review.user_name || 'Khách hàng'}
                      </p>
                      <p className="font-sans text-xs text-muted-gray mt-0.5">
                        {new Date(review.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={13}
                          className={s <= review.rating ? 'text-gold fill-gold' : 'text-soft-gray fill-soft-gray'}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="font-sans text-sm text-dark-text leading-relaxed">{review.comment}</p>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="font-sans text-muted-gray text-sm mb-10">
              Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!
            </p>
          )}

          {/* Add review form */}
          {isAuthenticated ? (
            <div className="bg-beige p-8 max-w-xl">
              <h3 className="font-serif text-xl text-dark-text mb-6">Viết Đánh Giá</h3>

              {/* Star rating input */}
              <div className="mb-5">
                <label className="font-sans text-sm text-muted-gray mb-2 block">Đánh giá của bạn</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setReviewRating(s)}
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      <Star
                        size={28}
                        className={
                          s <= (hoverRating || reviewRating)
                            ? 'text-gold fill-gold'
                            : 'text-soft-gray fill-soft-gray'
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmitReview)} className="space-y-4">
                <div>
                  <label className="font-sans text-sm text-muted-gray mb-1 block">Nhận xét (tuỳ chọn)</label>
                  <textarea
                    {...register('comment')}
                    rows={4}
                    placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                    className="input-field resize-none w-full"
                  />
                </div>
                <button
                  type="submit"
                  disabled={reviewMutation.isPending}
                  className="btn-gold px-8 disabled:opacity-70"
                >
                  {reviewMutation.isPending ? 'Đang gửi...' : 'GỬI ĐÁNH GIÁ'}
                </button>
              </form>
            </div>
          ) : (
            <p className="font-sans text-sm text-muted-gray">
              <Link to="/login" className="text-gold hover:underline">Đăng nhập</Link> để viết đánh giá.
            </p>
          )}
        </div>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <div className="mt-20">
            <h2 className="font-serif text-2xl text-dark-text mb-8 pb-4 border-b border-soft-gray">
              Sản Phẩm Liên Quan
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
