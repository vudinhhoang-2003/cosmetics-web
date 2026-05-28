import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  BadgePercent, ChevronLeft, ChevronRight, Filter, Search, SlidersHorizontal,
  Sparkles, X,
} from 'lucide-react'
import { categoryApi, productApi } from '../api/endpoints'
import ProductCard from '../components/ProductCard'
import Select from '../components/Select'
import type { Category } from '../types'

const PAGE_SIZE = 12

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'popular', label: 'Được đánh giá nhiều' },
  { value: 'price_asc', label: 'Giá thấp đến cao' },
  { value: 'price_desc', label: 'Giá cao đến thấp' },
]

const BRANDS = [
  'Chanel', 'Dior', 'Lancôme', 'SK-II', 'Estée Lauder',
  'Shiseido', 'La Mer', 'YSL', 'Givenchy', 'MAC',
]

const PRICE_PRESETS = [
  { label: 'Dưới 500K', min: '', max: '500000' },
  { label: '500K - 1 triệu', min: '500000', max: '1000000' },
  { label: '1 - 3 triệu', min: '1000000', max: '3000000' },
  { label: 'Trên 3 triệu', min: '3000000', max: '' },
]

function formatCompactPrice(value: string) {
  if (!value) return ''
  const num = Number(value)
  if (!Number.isFinite(num)) return value
  if (num >= 1000000) return `${num / 1000000} triệu`
  return `${Math.round(num / 1000)}K`
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filterOpen, setFilterOpen] = useState(false)

  const search = searchParams.get('search') || ''
  const sort = searchParams.get('sort') || 'newest'
  const category = searchParams.get('category') || ''
  const brands = searchParams.get('brand') ? searchParams.get('brand')!.split(',').filter(Boolean) : []
  const minPrice = searchParams.get('min_price') || ''
  const maxPrice = searchParams.get('max_price') || ''
  const inStock = searchParams.get('in_stock') === 'true'
  const saleOnly = searchParams.get('sale_only') === 'true'
  const page = Math.max(1, Number(searchParams.get('page') || 1))

  const [searchInput, setSearchInput] = useState(search)
  const [minPriceInput, setMinPriceInput] = useState(minPrice)
  const [maxPriceInput, setMaxPriceInput] = useState(maxPrice)

  useEffect(() => setSearchInput(search), [search])
  useEffect(() => setMinPriceInput(minPrice), [minPrice])
  useEffect(() => setMaxPriceInput(maxPrice), [maxPrice])

  const updateParams = (updates: Record<string, string | string[] | number | boolean | null>) => {
    const next = new URLSearchParams(searchParams)

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || value === false) {
        next.delete(key)
      } else if (Array.isArray(value)) {
        value.length ? next.set(key, value.join(',')) : next.delete(key)
      } else {
        next.set(key, String(value))
      }
    })

    if (!Object.prototype.hasOwnProperty.call(updates, 'page')) {
      next.delete('page')
    }

    setSearchParams(next, { replace: true })
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchInput !== search) {
        updateParams({ search: searchInput.trim() || null })
      }
    }, 350)
    return () => window.clearTimeout(timer)
  }, [searchInput, search])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (minPriceInput !== minPrice || maxPriceInput !== maxPrice) {
        updateParams({
          min_price: minPriceInput || null,
          max_price: maxPriceInput || null,
        })
      }
    }, 450)
    return () => window.clearTimeout(timer)
  }, [minPriceInput, maxPriceInput, minPrice, maxPrice])

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.list().then((r) => r.data),
  })

  const categories: Category[] = Array.isArray(categoriesData) ? categoriesData : []
  const selectedCategory = categories.find((cat) => cat.slug === category)

  const skip = (page - 1) * PAGE_SIZE
  const { data: productsData, isLoading, isFetching, isError } = useQuery({
    queryKey: ['products', { search, sort, category, brands, minPrice, maxPrice, inStock, saleOnly, skip }],
    queryFn: () =>
      productApi.list({
        skip,
        limit: PAGE_SIZE,
        search: search || undefined,
        sort,
        category: category || undefined,
        brand: brands.length ? brands.join(',') : undefined,
        min_price: minPrice ? Number(minPrice) : undefined,
        max_price: maxPrice ? Number(maxPrice) : undefined,
        in_stock: inStock || undefined,
        sale_only: saleOnly || undefined,
      }).then((r) => r.data),
    placeholderData: keepPreviousData,
  })

  const products = productsData?.items || []
  const total = productsData?.total || 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const rangeStart = total === 0 ? 0 : skip + 1
  const rangeEnd = Math.min(skip + products.length, total)

  const activeFilters = useMemo(() => {
    const filters: { key: string; label: string; clear: () => void }[] = []
    if (search) filters.push({ key: 'search', label: `Từ khóa: ${search}`, clear: () => updateParams({ search: null }) })
    if (selectedCategory) filters.push({ key: 'category', label: selectedCategory.name, clear: () => updateParams({ category: null }) })
    brands.forEach((brand) => filters.push({
      key: `brand-${brand}`,
      label: brand,
      clear: () => updateParams({ brand: brands.filter((item) => item !== brand) }),
    }))
    if (minPrice || maxPrice) {
      filters.push({
        key: 'price',
        label: `${minPrice ? formatCompactPrice(minPrice) : '0'} - ${maxPrice ? formatCompactPrice(maxPrice) : 'trở lên'}`,
        clear: () => {
          setMinPriceInput('')
          setMaxPriceInput('')
          updateParams({ min_price: null, max_price: null })
        },
      })
    }
    if (inStock) filters.push({ key: 'stock', label: 'Còn hàng', clear: () => updateParams({ in_stock: null }) })
    if (saleOnly) filters.push({ key: 'sale', label: 'Đang ưu đãi', clear: () => updateParams({ sale_only: null }) })
    return filters
  }, [search, selectedCategory, brands, minPrice, maxPrice, inStock, saleOnly])

  const clearFilters = () => {
    setSearchInput('')
    setMinPriceInput('')
    setMaxPriceInput('')
    setSearchParams({}, { replace: true })
  }

  const toggleBrand = (brand: string) => {
    updateParams({
      brand: brands.includes(brand)
        ? brands.filter((item) => item !== brand)
        : [...brands, brand],
    })
  }

  const setPricePreset = (min: string, max: string) => {
    setMinPriceInput(min)
    setMaxPriceInput(max)
    updateParams({ min_price: min || null, max_price: max || null })
  }

  const FilterPanel = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gold" />
          <h2 className="font-serif text-lg text-dark-text">Bộ lọc</h2>
        </div>
        {activeFilters.length > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="font-sans text-xs text-muted-gray hover:text-gold transition-colors"
          >
            Xóa tất cả
          </button>
        )}
      </div>

      <section>
        <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-dark-text mb-3">
          Danh mục
        </h3>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => updateParams({ category: null })}
            className={`w-full text-left px-3 py-2 text-sm font-sans transition-colors ${
              !category ? 'bg-gold text-white' : 'text-dark-text hover:bg-pearl'
            }`}
          >
            Tất cả sản phẩm
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => updateParams({ category: category === cat.slug ? null : cat.slug })}
              className={`w-full text-left px-3 py-2 text-sm font-sans transition-colors ${
                category === cat.slug ? 'bg-gold text-white' : 'text-dark-text hover:bg-pearl'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-dark-text mb-3">
          Khoảng giá
        </h3>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {PRICE_PRESETS.map((preset) => {
            const active = minPrice === preset.min && maxPrice === preset.max
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => setPricePreset(preset.min, preset.max)}
                className={`px-3 py-2 text-xs font-sans border transition-colors ${
                  active
                    ? 'border-gold bg-gold text-white'
                    : 'border-soft-gray bg-white text-dark-text hover:border-gold'
                }`}
              >
                {preset.label}
              </button>
            )
          })}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min="0"
            placeholder="Từ"
            value={minPriceInput}
            onChange={(e) => setMinPriceInput(e.target.value)}
            className="input-field text-sm"
          />
          <input
            type="number"
            min="0"
            placeholder="Đến"
            value={maxPriceInput}
            onChange={(e) => setMaxPriceInput(e.target.value)}
            className="input-field text-sm"
          />
        </div>
      </section>

      <section>
        <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-dark-text mb-3">
          Thương hiệu
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {BRANDS.map((brand) => (
            <label
              key={brand}
              className={`flex items-center gap-2 px-3 py-2 border text-sm font-sans cursor-pointer transition-colors ${
                brands.includes(brand)
                  ? 'border-gold bg-gold/10 text-gold'
                  : 'border-soft-gray bg-white text-dark-text hover:border-gold'
              }`}
            >
              <input
                type="checkbox"
                checked={brands.includes(brand)}
                onChange={() => toggleBrand(brand)}
                className="w-3.5 h-3.5 accent-[#C9A96E]"
              />
              <span className="truncate">{brand}</span>
            </label>
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-sans text-xs font-semibold uppercase tracking-wider text-dark-text mb-3">
          Trạng thái
        </h3>
        <div className="space-y-2">
          <label className="flex items-center justify-between gap-3 cursor-pointer bg-white border border-soft-gray px-3 py-2">
            <span className="font-sans text-sm text-dark-text">Chỉ hiện sản phẩm còn hàng</span>
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => updateParams({ in_stock: e.target.checked || null })}
              className="w-4 h-4 accent-[#C9A96E]"
            />
          </label>
          <label className="flex items-center justify-between gap-3 cursor-pointer bg-white border border-soft-gray px-3 py-2">
            <span className="font-sans text-sm text-dark-text">Đang ưu đãi</span>
            <input
              type="checkbox"
              checked={saleOnly}
              onChange={(e) => updateParams({ sale_only: e.target.checked || null })}
              className="w-4 h-4 accent-[#C9A96E]"
            />
          </label>
        </div>
      </section>
    </div>
  )

  return (
    <div className="min-h-screen bg-cream">
      <section className="bg-white border-b border-soft-gray">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="editorial-label mb-3">Bộ sưu tập</p>
              <h1 className="font-serif text-3xl md:text-4xl text-dark-text font-semibold">
                Sản phẩm làm đẹp
              </h1>
              <p className="font-sans text-sm text-muted-gray mt-3 leading-relaxed">
                Tìm nhanh theo danh mục, thương hiệu, mức giá và tình trạng hàng.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:flex">
              <div className="flex items-center gap-2 bg-pearl border border-soft-gray px-4 py-3">
                <Sparkles size={15} className="text-gold" />
                <span className="font-sans text-xs text-dark-text">{total} sản phẩm</span>
              </div>
              <button
                type="button"
                onClick={() => updateParams({ sale_only: saleOnly ? null : true })}
                className={`flex items-center justify-center gap-2 border px-4 py-3 font-sans text-xs transition-colors ${
                  saleOnly
                    ? 'bg-gold border-gold text-white'
                    : 'bg-white border-soft-gray text-dark-text hover:border-gold'
                }`}
              >
                <BadgePercent size={15} />
                Ưu đãi
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24 border-r border-soft-gray pr-6">
              <FilterPanel />
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="flex flex-col gap-4 mb-5 xl:flex-row xl:items-center">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-gray" />
                <input
                  type="search"
                  placeholder="Tìm sản phẩm, thương hiệu..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="input-field pl-10 w-full"
                />
              </div>

              <div className="flex gap-3">
                <Select
                  value={sort}
                  onChange={(value) => updateParams({ sort: value === 'newest' ? null : value })}
                  options={SORT_OPTIONS}
                  className="flex-1 sm:w-56"
                />
                <button
                  type="button"
                  onClick={() => setFilterOpen(true)}
                  className="lg:hidden inline-flex items-center justify-center gap-2 border border-soft-gray bg-white px-4 py-3 font-sans text-sm text-dark-text hover:border-gold transition-colors"
                >
                  <SlidersHorizontal size={16} />
                  Lọc
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4 mb-7">
              <div className="flex items-center justify-between gap-4">
                <p className="font-sans text-xs text-muted-gray uppercase tracking-wider">
                  Hiển thị {rangeStart}-{rangeEnd} trong {total} sản phẩm
                </p>
                {isFetching && !isLoading && (
                  <span className="font-sans text-xs text-gold">Đang cập nhật...</span>
                )}
              </div>

              {activeFilters.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {activeFilters.map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={filter.clear}
                      className="inline-flex items-center gap-2 bg-white border border-soft-gray px-3 py-1.5 font-sans text-xs text-dark-text hover:border-gold hover:text-gold transition-colors"
                    >
                      {filter.label}
                      <X size={12} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isError ? (
              <div className="border border-soft-gray bg-white py-16 text-center">
                <p className="font-serif text-lg text-dark-text mb-2">Không thể tải sản phẩm</p>
                <p className="font-sans text-sm text-muted-gray">Vui lòng thử lại sau.</p>
              </div>
            ) : isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="animate-pulse bg-white border border-soft-gray">
                    <div className="bg-pearl aspect-square" />
                    <div className="p-4 space-y-3">
                      <div className="h-3 bg-pearl w-1/2" />
                      <div className="h-4 bg-pearl w-full" />
                      <div className="h-4 bg-pearl w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 bg-white border border-soft-gray"
              >
                <p className="font-serif text-lg text-dark-text mb-3">Không tìm thấy sản phẩm nào</p>
                <p className="font-sans text-sm text-muted-gray mb-6">
                  Hãy thử bỏ bớt bộ lọc hoặc dùng từ khóa khác.
                </p>
                <button type="button" onClick={clearFilters} className="btn-gold">
                  Xóa bộ lọc
                </button>
              </motion.div>
            ) : (
              <motion.div
                key={`${page}-${category}-${search}-${brands.join('-')}-${minPrice}-${maxPrice}-${inStock}-${saleOnly}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5"
              >
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </motion.div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  type="button"
                  onClick={() => updateParams({ page: Math.max(1, page - 1) })}
                  disabled={page === 1}
                  className="p-2 border border-soft-gray text-dark-text hover:border-gold hover:text-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Trang trước"
                >
                  <ChevronLeft size={18} />
                </button>

                {Array.from({ length: totalPages }, (_, index) => index + 1)
                  .filter((item) => item === 1 || item === totalPages || Math.abs(item - page) <= 2)
                  .reduce<(number | '...')[]>((acc, item, index, arr) => {
                    if (index > 0 && item - arr[index - 1] > 1) acc.push('...')
                    acc.push(item)
                    return acc
                  }, [])
                  .map((item, index) => item === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-muted-gray font-sans text-sm">...</span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => updateParams({ page: item })}
                      className={`w-10 h-10 font-sans text-sm transition-colors border ${
                        page === item
                          ? 'bg-gold text-white border-gold'
                          : 'border-soft-gray text-dark-text hover:border-gold hover:text-gold'
                      }`}
                    >
                      {item}
                    </button>
                  ))}

                <button
                  type="button"
                  onClick={() => updateParams({ page: Math.min(totalPages, page + 1) })}
                  disabled={page === totalPages}
                  className="p-2 border border-soft-gray text-dark-text hover:border-gold hover:text-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Trang sau"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {filterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Đóng bộ lọc"
            className="absolute inset-0 bg-black/50"
            onClick={() => setFilterOpen(false)}
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="absolute left-0 top-0 bottom-0 w-[min(88vw,360px)] bg-cream overflow-y-auto p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-lg text-dark-text">Bộ lọc</h2>
              <button type="button" onClick={() => setFilterOpen(false)} className="p-2 -mr-2">
                <X size={20} className="text-dark-text" />
              </button>
            </div>
            <FilterPanel />
            <button type="button" onClick={() => setFilterOpen(false)} className="btn-gold w-full mt-8">
              Áp dụng
            </button>
          </motion.aside>
        </div>
      )}
    </div>
  )
}
