import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { productApi, categoryApi } from '../api/endpoints'
import ProductCard from '../components/ProductCard'
import Select from '../components/Select'
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

  // Derived filter values directly from URL searchParams
  const search = searchParams.get('search') || ''
  const sort = searchParams.get('sort') || 'newest'
  const selectedCategory = searchParams.get('category') || ''
  const selectedBrands = searchParams.get('brand') ? searchParams.get('brand')!.split(',') : []
  const minPrice = searchParams.get('min_price') || ''
  const maxPrice = searchParams.get('max_price') || ''
  const page = Number(searchParams.get('page') || 1)

  // Local state for debounced inputs
  const [searchInput, setSearchInput] = useState(search)
  const [minPriceInput, setMinPriceInput] = useState(minPrice)
  const [maxPriceInput, setMaxPriceInput] = useState(maxPrice)

  // Sync inputs when URL parameters change from outside (e.g. Navbar or Footer)
  useEffect(() => {
    setSearchInput(search)
  }, [search])

  useEffect(() => {
    setMinPriceInput(minPrice)
  }, [minPrice])

  useEffect(() => {
    setMaxPriceInput(maxPrice)
  }, [maxPrice])

  const skip = (page - 1) * PAGE_SIZE

  // Helper to update searchParams cleanly
  const updateUrlParams = (newParams: Record<string, string | string[] | number | null>) => {
    const nextParams = new URLSearchParams(searchParams)
    Object.entries(newParams).forEach(([key, val]) => {
      if (val === null || val === '') {
        nextParams.delete(key)
      } else if (Array.isArray(val)) {
        if (val.length === 0) {
          nextParams.delete(key)
        } else {
          nextParams.set(key, val.join(','))
        }
      } else {
        nextParams.set(key, String(val))
      }
    })
    // Reset page on filter changes unless page is explicitly updated
    if (!newParams.hasOwnProperty('page')) {
      nextParams.delete('page')
    }
    setSearchParams(nextParams, { replace: true })
  }

  // Debounce search input to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        updateUrlParams({ search: searchInput || null })
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput, search])

  // Debounce price inputs to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      if (minPriceInput !== minPrice || maxPriceInput !== maxPrice) {
        updateUrlParams({
          min_price: minPriceInput || null,
          max_price: maxPriceInput || null,
        })
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [minPriceInput, maxPriceInput, minPrice, maxPrice])

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.list().then((r) => r.data),
  })
  const categories: Category[] = Array.isArray(categoriesData) ? categoriesData : []

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
    const nextCategory = selectedCategory === slug ? null : slug
    updateUrlParams({ category: nextCategory })
  }

  const handleBrandToggle = (brand: string) => {
    const nextBrands = selectedBrands.includes(brand)
      ? selectedBrands.filter(b => b !== brand)
      : [...selectedBrands, brand]
    updateUrlParams({ brand: nextBrands })
  }

  const clearFilters = () => {
    setSearchInput('')
    setMinPriceInput('')
    setMaxPriceInput('')
    setSearchParams({}, { replace: true })
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
            value={minPriceInput}
            onChange={(e) => setMinPriceInput(e.target.value)}
            className="input-field text-sm"
          />
          <input
            type="number"
            placeholder="Giá tối đa"
            value={maxPriceInput}
            onChange={(e) => setMaxPriceInput(e.target.value)}
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
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="input-field pl-10 w-full"
                />
              </div>

              <Select
                value={sort}
                onChange={(v) => updateUrlParams({ sort: v })}
                options={SORT_OPTIONS}
                className="w-full sm:w-52"
              />

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
            <div className="mb-6">
              <p className="font-sans text-xs text-muted-gray uppercase tracking-widest">
                Tìm thấy {total} sản phẩm
              </p>
            </div>

            {/* Products grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-white border border-soft-gray p-4 h-[350px]">
                    <div className="bg-pearl aspect-square mb-4" />
                    <div className="h-4 bg-pearl w-2/3 mb-2" />
                    <div className="h-4 bg-pearl w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 bg-white border border-soft-gray"
              >
                <p className="font-serif text-lg text-dark-text mb-4">Không tìm thấy sản phẩm nào</p>
                <p className="font-sans text-sm text-muted-gray mb-6">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
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
                  onClick={() => updateUrlParams({ page: Math.max(1, page - 1) })}
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
                        onClick={() => updateUrlParams({ page: p as number })}
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
                  onClick={() => updateUrlParams({ page: Math.min(totalPages, page + 1) })}
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
