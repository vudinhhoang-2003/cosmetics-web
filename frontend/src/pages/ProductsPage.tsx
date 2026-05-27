import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { productApi, categoryApi } from '../api/endpoints'
import ProductCard from '../components/ProductCard'
import type { Category } from '../types'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá: Thấp → Cao' },
  { value: 'price_desc', label: 'Giá: Cao → Thấp' },
  { value: 'popular', label: 'Phổ biến nhất' },
]

const BRANDS = [
  'Chanel', 'Dior', 'Lancôme', 'SK-II', 'Estée Lauder',
  'Shiseido', 'La Mer', 'YSL', 'Givenchy', 'MAC',
]

const PAGE_SIZE = 12

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Filter states synced with URL
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    searchParams.get('brand') ? searchParams.get('brand')!.split(',') : []
  )
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '')
  const [page, setPage] = useState(Number(searchParams.get('page') || 1))

  const skip = (page - 1) * PAGE_SIZE

  // Sync filters to URL
  useEffect(() => {
    const params: Record<string, string> = {}
    if (search) params.search = search
    if (sort && sort !== 'newest') params.sort = sort
    if (selectedCategory) params.category = selectedCategory
    if (selectedBrands.length) params.brand = selectedBrands.join(',')
    if (minPrice) params.min_price = minPrice
    if (maxPrice) params.max_price = maxPrice
    if (page > 1) params.page = String(page)
    setSearchParams(params, { replace: true })
  }, [search, sort, selectedCategory, selectedBrands, minPrice, maxPrice, page])

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.list().then((r) => r.data),
  })
  const categories: Category[] = categoriesData || []

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', { search, sort, selectedCategory, selectedBrands, minPrice, maxPrice, skip }],
    queryFn: () =>
      productApi
        .list({
          skip,
          limit: PAGE_SIZE,
          search: search || undefined,
          sort: sort || undefined,
          category: selectedCategory || undefined,
          min_price: minPrice ? Number(minPrice) : undefined,
          max_price: maxPrice ? Number(maxPrice) : undefined,
        })
        .then((r) => r.data),
    placeholderData: keepPreviousData,
  })

  const products = productsData?.items || []
  const total = productsData?.total || 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const handleCategoryToggle = (slug: string) => {
    setSelectedCategory(prev => (prev === slug ? '' : slug))
    setPage(1)
  }

  const handleBrandToggle = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    )
    setPage(1)
  }

  const clearFilters = () => {
    setSearch('')
    setSort('newest')
    setSelectedCategory('')
    setSelectedBrands([])
    setMinPrice('')
    setMaxPrice('')
    setPage(1)
  }

  const hasActiveFilters =
    search || selectedCategory || selectedBrands.length || minPrice || maxPrice

  const Sidebar = () => (
    <aside className="w-full space-y-8">
      {/* Category filter */}
      <div>
        <h3 className="font-serif text-base text-dark-text mb-4 pb-2 border-b border-soft-gray">
          Danh mục
        </h3>
        <ul className="space-y-2">
          {categories.map((cat) => (
            <li key={cat.id}>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedCategory === cat.slug}
                  onChange={() => handleCategoryToggle(cat.slug)}
                  className="w-4 h-4 accent-[#C9A96E]"
                />
                <span className="font-sans text-sm text-dark-text group-hover:text-gold transition-colors">
                  {cat.name}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      {/* Price range filter */}
      <div>
        <h3 className="font-serif text-base text-dark-text mb-4 pb-2 border-b border-soft-gray">
          Khoảng giá
        </h3>
        <div className="space-y-3">
          <input
            type="number"
            placeholder="Giá tối thiểu"
            value={minPrice}
            onChange={(e) => { setMinPrice(e.target.value); setPage(1) }}
            className="input-field text-sm"
          />
          <input
            type="number"
            placeholder="Giá tối đa"
            value={maxPrice}
            onChange={(e) => { setMaxPrice(e.target.value); setPage(1) }}
            className="input-field text-sm"
          />
        </div>
      </div>

      {/* Brand filter */}
      <div>
        <h3 className="font-serif text-base text-dark-text mb-4 pb-2 border-b border-soft-gray">
          Thương hiệu
        </h3>
        <ul className="space-y-2">
          {BRANDS.map((brand) => (
            <li key={brand}>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={() => handleBrandToggle(brand)}
                  className="w-4 h-4 accent-[#C9A96E]"
                />
                <span className="font-sans text-sm text-dark-text group-hover:text-gold transition-colors">
                  {brand}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-2 text-sm text-accent-brown hover:text-gold transition-colors font-sans"
        >
          <X size={14} />
          Xóa bộ lọc
        </button>
      )}
    </aside>
  )

  return (
    <div className="min-h-screen bg-cream">
      {/* Page header */}
      <div className="bg-beige border-b border-soft-gray py-10 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gold text-xs tracking-[0.4em] uppercase font-sans mb-2">Bộ sưu tập</p>
          <h1 className="section-title">Tất Cả Sản Phẩm</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex gap-10">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-60 shrink-0">
            <Sidebar />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-gray" />
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  className="input-field pl-10 w-full"
                />
              </div>

              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1) }}
                className="input-field w-full sm:w-52 bg-white cursor-pointer"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              {/* Mobile filter toggle */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden btn-outline flex items-center gap-2 px-4"
              >
                <SlidersHorizontal size={16} />
                Bộ lọc
              </button>
            </div>

            {/* Result count */}
            <p className="font-sans text-sm text-muted-gray mb-6">
              {isLoading ? 'Đang tải...' : `Hiển thị ${products.length} / ${total} sản phẩm`}
            </p>

            {/* Products grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <div key={i} className="aspect-square bg-soft-gray animate-pulse rounded-sm" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-24"
              >
                <p className="font-serif text-2xl text-dark-text mb-3">Không tìm thấy sản phẩm</p>
                <p className="font-sans text-muted-gray mb-6">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                <button onClick={clearFilters} className="btn-gold px-8">
                  Xóa bộ lọc
                </button>
              </motion.div>
            ) : (
              <motion.div
                key={`${page}-${selectedCategory}-${search}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 md:grid-cols-3 gap-6"
              >
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </motion.div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-soft-gray text-dark-text hover:border-gold hover:text-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...')
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, idx) =>
                    p === '...' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-muted-gray font-sans text-sm">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`w-10 h-10 font-sans text-sm transition-colors border ${
                          page === p
                            ? 'bg-gold text-white border-gold'
                            : 'border-soft-gray text-dark-text hover:border-gold hover:text-gold'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 border border-soft-gray text-dark-text hover:border-gold hover:text-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="absolute left-0 top-0 bottom-0 w-80 bg-cream overflow-y-auto p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-lg text-dark-text">Bộ lọc</h2>
              <button onClick={() => setSidebarOpen(false)}>
                <X size={20} className="text-dark-text" />
              </button>
            </div>
            <Sidebar />
            <button
              onClick={() => setSidebarOpen(false)}
              className="btn-gold w-full mt-6"
            >
              Áp dụng
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}
