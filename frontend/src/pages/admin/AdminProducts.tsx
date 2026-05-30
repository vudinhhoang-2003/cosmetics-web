// File: frontend/src/pages/admin/AdminProducts.tsx
// Nhiệm vụ: Trang quản trị danh sách sản phẩm (Product Management) cho Admin: Bộ lọc nâng cao, Phân trang, Tìm kiếm, Thêm/Sửa/Xóa sản phẩm, Tải ảnh lên và Tính giá khuyến mãi.

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle, BadgePercent, ChevronDown, ChevronLeft, ChevronRight, Edit2,
  Eye, EyeOff, ImagePlus, Package, Plus, Search, Trash2, X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { adminApi, categoryApi, productApi, uploadApi } from '../../api/endpoints'
import Select from '../../components/Select'
import type { Category, Product } from '../../types'
import { formatPrice } from '../../utils/format'


interface ProductForm {
  name: string
  slug: string
  description: string
  price: number
  sale_price: string
  stock: number
  brand: string
  category_id: string
  images: string
  is_active: boolean
}

function ProductRowImage({ src, name }: { src?: string; name: string }) {
  const [error, setError] = useState(false)

  if (!src || error) {
    return (
      <div className="w-12 h-12 bg-beige border border-soft-gray/30 flex items-center justify-center rounded-sm shrink-0" title={name}>
        <Package size={16} className="text-gold/50" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setError(true)}
      className="w-12 h-12 object-cover bg-beige rounded-sm shrink-0"
    />
  )
}

const PAGE_SIZE = 20
const LOW_STOCK_LIMIT = 10

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'popular', label: 'Được đánh giá nhiều' },
  { value: 'price_asc', label: 'Giá thấp đến cao' },
  { value: 'price_desc', label: 'Giá cao đến thấp' },
]

const STOCK_OPTIONS = [
  { value: 'all', label: 'Tất cả tồn kho' },
  { value: 'in_stock', label: 'Còn hàng' },
  { value: 'low_stock', label: 'Sắp hết hàng' },
  { value: 'out_stock', label: 'Hết hàng' },
]

const SALE_OPTIONS = [
  { value: 'all', label: 'Tất cả giá' },
  { value: 'sale', label: 'Đang ưu đãi' },
]

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function getImages(value: string) {
  return value.split('\n').map((item) => item.trim()).filter(Boolean)
}

export default function AdminProducts() {
  const queryClient = useQueryClient()
  // Trạng thái modal Thêm/Sửa sản phẩm
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [uploading, setUploading] = useState(false)
  
  // Trạng thái bộ lọc và phân trang
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sort, setSort] = useState('newest')
  const [stockFilter, setStockFilter] = useState('all')
  const [saleFilter, setSaleFilter] = useState('all')
  
  // Trạng thái dropdown lọc danh mục và nhập phần trăm giảm giá nhanh
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const [discountPercent, setDiscountPercent] = useState<number | ''>('')

  // Tự động debounce từ khóa tìm kiếm sản phẩm sau 300ms
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1) // Trở lại trang 1 khi lọc mới
    }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  // Lấy danh sách các danh mục có sẵn
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.list().then((r) => r.data),
  })
  const categories: Category[] = categoriesData || []

  // Truy vấn danh sách sản phẩm quản trị (tự động reload khi thay đổi tham số lọc)
  const { data: productsData, isLoading, isFetching, isError } = useQuery({
    queryKey: ['admin-products', page, debouncedSearch, categoryFilter, sort, stockFilter, saleFilter],
    queryFn: () =>
      adminApi.products({
        skip: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        category: categoryFilter || undefined,
        sort,
        in_stock: stockFilter === 'in_stock' || stockFilter === 'low_stock' ? true : undefined,
        sale_only: saleFilter === 'sale' ? true : undefined,
      }).then((r) => r.data),
  })

  // Lọc sản phẩm cục bộ dựa trên trạng thái tồn kho (Sắp hết hàng / Hết hàng)
  const products = useMemo(() => {
    const items = productsData?.items || []
    if (stockFilter === 'low_stock') {
      return items.filter((product) => product.stock > 0 && product.stock <= LOW_STOCK_LIMIT)
    }
    if (stockFilter === 'out_stock') {
      return items.filter((product) => product.stock === 0)
    }
    return items
  }, [productsData?.items, stockFilter])

  // Tính toán số liệu phân trang và thống kê nhanh
  const total = productsData?.total || 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const activeCount = products.filter((product) => product.is_active).length
  const lowStockCount = products.filter((product) => product.stock > 0 && product.stock <= LOW_STOCK_LIMIT).length
  const outStockCount = products.filter((product) => product.stock === 0).length


  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductForm>({
    defaultValues: {
      is_active: true,
      name: '',
      slug: '',
      description: '',
      price: 0,
      sale_price: '',
      stock: 0,
      brand: '',
      category_id: '',
      images: '',
    },
  })

  const watchedImages = watch('images') || ''
  const watchedName = watch('name') || ''
  const watchedCategoryId = watch('category_id') || ''
  const selectedCategoryName = useMemo(() => {
    return categories.find((c) => c.id === watchedCategoryId)?.name || 'Chọn danh mục'
  }, [watchedCategoryId, categories])

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrice = Number(e.target.value) || 0
    if (discountPercent !== '' && discountPercent > 0) {
      const calculatedSalePrice = Math.round(newPrice * (1 - discountPercent / 100))
      setValue('sale_price', String(calculatedSalePrice))
    }
  }

  const handleDiscountPercentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percentVal = e.target.value
    if (percentVal === '') {
      setDiscountPercent('')
      setValue('sale_price', '')
      return
    }
    const percent = Math.min(100, Math.max(0, Number(percentVal)))
    setDiscountPercent(percent)
    const currentPrice = Number(watch('price')) || 0
    if (currentPrice > 0) {
      const calculatedSalePrice = Math.round(currentPrice * (1 - percent / 100))
      setValue('sale_price', String(calculatedSalePrice))
    }
  }

  const handleSalePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const saleVal = e.target.value
    if (saleVal === '') {
      setDiscountPercent('')
      return
    }
    const salePrice = Number(saleVal) || 0
    const currentPrice = Number(watch('price')) || 0
    if (currentPrice > 0 && salePrice <= currentPrice && salePrice >= 0) {
      const calculatedPercent = Math.round(((currentPrice - salePrice) / currentPrice) * 100)
      setDiscountPercent(calculatedPercent)
    } else if (salePrice > currentPrice) {
      setDiscountPercent(0)
    }
  }

  const resetFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setCategoryFilter('')
    setSort('newest')
    setStockFilter('all')
    setSaleFilter('all')
    setPage(1)
  }

  const openAdd = () => {
    reset({
      is_active: true,
      name: '',
      slug: '',
      description: '',
      price: 0,
      sale_price: '',
      stock: 0,
      brand: '',
      category_id: '',
      images: '',
    })
    setEditingProduct(null)
    setDiscountPercent('')
    setCategoryDropdownOpen(false)
    setModalOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditingProduct(product)
    reset({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      price: product.price,
      sale_price: product.sale_price ? String(product.sale_price) : '',
      stock: product.stock,
      brand: product.brand || '',
      category_id: product.category_id || '',
      images: product.images?.join('\n') || '',
      is_active: product.is_active,
    })
    if (product.sale_price && product.price) {
      setDiscountPercent(Math.round(((Number(product.price) - Number(product.sale_price)) / Number(product.price)) * 100))
    } else {
      setDiscountPercent('')
    }
    setCategoryDropdownOpen(false)
    setModalOpen(true)
  }

  const handleProductImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    const toastId = toast.loading('Đang tải ảnh lên...')
    try {
      const response = await uploadApi.image(file)
      const currentImages = watchedImages.trim()
      setValue('images', currentImages ? `${currentImages}\n${response.data.url}` : response.data.url)
      toast.success('Tải ảnh lên thành công', { id: toastId })
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Không thể tải ảnh lên', { id: toastId })
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const createMutation = useMutation({
    mutationFn: (data: Partial<Product>) => productApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      toast.success('Thêm sản phẩm thành công')
      setModalOpen(false)
    },
    onError: () => toast.error('Không thể thêm sản phẩm'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) => productApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      toast.success('Cập nhật sản phẩm thành công')
      setModalOpen(false)
    },
    onError: () => toast.error('Không thể cập nhật sản phẩm'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
      toast.success('Đã xóa sản phẩm')
      setDeleteTarget(null)
    },
    onError: () => toast.error('Không thể xóa sản phẩm'),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: (product: Product) => productApi.update(product.id, { is_active: !product.is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
    onError: () => toast.error('Không thể cập nhật trạng thái'),
  })

  const onSubmit = (data: ProductForm) => {
    const payload: Partial<Product> = {
      name: data.name.trim(),
      slug: data.slug.trim(),
      description: data.description?.trim() || undefined,
      price: Number(data.price),
      sale_price: data.sale_price ? Number(data.sale_price) : undefined,
      stock: Number(data.stock),
      brand: data.brand?.trim() || undefined,
      category_id: data.category_id || undefined,
      images: data.images ? getImages(data.images) : [],
      is_active: data.is_active,
    }

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const imageUrls = getImages(watchedImages)
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="font-serif text-2xl text-dark-text">Quản Lý Sản Phẩm</h1>
          <p className="font-sans text-sm text-muted-gray mt-1">
            Quản lý danh mục hàng, giá bán, tồn kho và trạng thái bán.
          </p>
        </div>
        <button type="button" onClick={openAdd} className="btn-gold inline-flex items-center justify-center gap-2 px-5">
          <Plus size={16} /> Thêm sản phẩm
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng sản phẩm', value: total, icon: Package, color: 'text-gold bg-gold/10' },
          { label: 'Đang bán', value: activeCount, icon: Eye, color: 'text-green-600 bg-green-50' },
          { label: 'Sắp hết hàng', value: lowStockCount, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
          { label: 'Hết hàng', value: outStockCount, icon: EyeOff, color: 'text-red-600 bg-red-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-soft-gray p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-sans text-xs text-muted-gray uppercase tracking-wider">{label}</p>
                <p className="font-sans text-2xl font-bold text-dark-text mt-1">{value}</p>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
                <Icon size={18} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-soft-gray p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
          <div className="relative md:col-span-2 xl:col-span-2">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-gray" />
            <input
              type="search"
              placeholder="Tìm theo tên, thương hiệu, mô tả..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="input-field pl-10 w-full bg-white"
            />
          </div>

          <Select
            value={categoryFilter}
            onChange={(value) => { setCategoryFilter(value); setPage(1) }}
            placeholder="Tất cả danh mục"
            options={categories.map((category) => ({ value: category.slug, label: category.name }))}
          />

          <Select
            value={stockFilter}
            onChange={(value) => { setStockFilter(value || 'all'); setPage(1) }}
            options={STOCK_OPTIONS}
          />

          <Select
            value={saleFilter}
            onChange={(value) => { setSaleFilter(value || 'all'); setPage(1) }}
            options={SALE_OPTIONS}
          />

          <Select
            value={sort}
            onChange={(value) => { setSort(value || 'newest'); setPage(1) }}
            options={SORT_OPTIONS}
          />
        </div>

        <div className="flex flex-col gap-3 mt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-sans text-xs text-muted-gray">
            {isFetching && !isLoading ? 'Đang cập nhật...' : `Hiển thị ${products.length} / ${total} sản phẩm`}
          </p>
          <div className="flex items-center gap-3">
            {(search || categoryFilter || stockFilter !== 'all' || saleFilter !== 'all' || sort !== 'newest') && (
              <button type="button" onClick={resetFilters} className="font-sans text-xs text-muted-gray hover:text-gold">
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-soft-gray overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full font-sans text-sm">
            <thead>
              <tr className="bg-beige border-b border-soft-gray">
                <th className="w-16 px-4 py-3 text-left text-xs text-muted-gray uppercase tracking-wider font-medium">Ảnh</th>
                <th className="min-w-72 px-4 py-3 text-left text-xs text-muted-gray uppercase tracking-wider font-medium">Sản phẩm</th>
                <th className="px-4 py-3 text-left text-xs text-muted-gray uppercase tracking-wider font-medium hidden md:table-cell">Thương hiệu</th>
                <th className="px-4 py-3 text-left text-xs text-muted-gray uppercase tracking-wider font-medium hidden lg:table-cell">Danh mục</th>
                <th className="px-4 py-3 text-right text-xs text-muted-gray uppercase tracking-wider font-medium">Giá</th>
                <th className="px-4 py-3 text-center text-xs text-muted-gray uppercase tracking-wider font-medium">Tồn kho</th>
                <th className="px-4 py-3 text-center text-xs text-muted-gray uppercase tracking-wider font-medium">Trạng thái</th>
                <th className="px-4 py-3 text-center text-xs text-muted-gray uppercase tracking-wider font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soft-gray">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, row) => (
                  <tr key={row}>
                    {Array.from({ length: 8 }).map((__, cell) => (
                      <td key={cell} className="px-4 py-4">
                        <div className="h-4 bg-soft-gray animate-pulse rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <p className="font-sans text-sm text-red-600">Không thể tải danh sách sản phẩm</p>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <p className="font-serif text-lg text-dark-text mb-2">Không có sản phẩm phù hợp</p>
                    <p className="font-sans text-sm text-muted-gray mb-4">Thử bỏ bớt bộ lọc hoặc thêm sản phẩm mới.</p>
                    <button type="button" onClick={resetFilters} className="btn-outline">Xóa bộ lọc</button>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-beige/30 transition-colors">
                    <td className="px-4 py-3">
                      <ProductRowImage
                        src={product.images?.[0] || 'https://images.unsplash.com/photo-1586495777744-4e6232bf2f8f?w=80'}
                        name={product.name}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-dark-text font-medium line-clamp-1">{product.name}</p>
                      <p className="text-xs text-muted-gray font-mono mt-0.5">{product.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-gray hidden md:table-cell">{product.brand || '-'}</td>
                    <td className="px-4 py-3 text-muted-gray hidden lg:table-cell">{product.category?.name || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <p className="text-gold font-semibold">{formatPrice(product.sale_price ?? product.price)}</p>
                      {product.sale_price && (
                        <p className="text-xs text-muted-gray line-through">{formatPrice(product.price)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex min-w-10 justify-center px-2 py-1 text-xs font-semibold rounded-full ${
                          product.stock === 0
                            ? 'bg-red-100 text-red-600'
                            : product.stock <= LOW_STOCK_LIMIT
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggleActiveMutation.mutate(product)}
                        disabled={toggleActiveMutation.isPending}
                        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-sans transition-colors ${
                          product.is_active
                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                            : 'bg-gray-100 text-muted-gray hover:bg-gray-200'
                        }`}
                      >
                        {product.is_active ? <Eye size={13} /> : <EyeOff size={13} />}
                        {product.is_active ? 'Đang bán' : 'Dừng bán'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(product)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Sửa"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(product)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Xóa"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1}
            className="p-2 border border-soft-gray text-dark-text hover:border-gold hover:text-gold disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPage(item)}
              className={`w-9 h-9 text-sm font-sans border transition-colors ${
                page === item ? 'bg-gold text-white border-gold' : 'border-soft-gray text-dark-text hover:border-gold'
              }`}
            >
              {item}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page === totalPages}
            className="p-2 border border-soft-gray text-dark-text hover:border-gold hover:text-gold disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-obsidian/60 backdrop-blur-md"
              onClick={() => setModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 18 }}
              transition={{ duration: 0.2 }}
              className="relative bg-[#FAF6F0] w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gold/15 shadow-2xl"
            >
              <div className="flex items-center justify-between px-8 py-5 border-b border-gold/10 sticky top-0 bg-[#FAF6F0]/90 backdrop-blur-md z-15">
                <div>
                  <h2 className="font-serif text-2xl text-navy font-semibold tracking-wide">
                    {editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
                  </h2>
                  <p className="font-sans text-[10px] text-muted-gray uppercase tracking-wider mt-1">
                    Cập nhật thông tin bán hàng, mô tả và hình ảnh.
                  </p>
                </div>
                <button type="button" onClick={() => setModalOpen(false)} className="p-2 -mr-2 text-muted-gray hover:text-dark-text transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
                  <div className="space-y-5">
                    <div>
                      <label className="font-sans text-[10px] text-muted-gray mb-1.5 block uppercase tracking-luxury font-medium">
                        Tên sản phẩm *
                      </label>
                      <input
                        {...register('name', { required: 'Bắt buộc' })}
                        onBlur={() => {
                          if (!watch('slug')) setValue('slug', slugify(watchedName))
                        }}
                        className="input-field w-full"
                        placeholder="Kem dưỡng ẩm cao cấp..."
                      />
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <label className="font-sans text-[10px] text-muted-gray mb-1.5 block uppercase tracking-luxury font-medium">
                          Slug *
                        </label>
                        <button
                          type="button"
                          onClick={() => setValue('slug', slugify(watchedName))}
                          className="font-sans text-xs text-gold hover:text-gold-dark hover:underline transition-colors mb-1.5"
                        >
                          Tạo từ tên
                        </button>
                      </div>
                      <input
                        {...register('slug', { required: 'Bắt buộc' })}
                        className="input-field w-full font-mono text-sm"
                        placeholder="kem-duong-am-cao-cap"
                      />
                      {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <div>
                        <label className="font-sans text-[10px] text-muted-gray mb-1.5 block uppercase tracking-luxury font-medium">
                          Giá gốc (VND) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          {...register('price', { 
                            required: 'Bắt buộc', 
                            min: { value: 0, message: 'Phải >= 0' },
                            onChange: handlePriceChange
                          })}
                          className="input-field w-full"
                        />
                        {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                      </div>
                      <div>
                        <label className="font-sans text-[10px] text-muted-gray mb-1.5 block uppercase tracking-luxury font-medium">
                          Giảm giá (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={discountPercent}
                          onChange={handleDiscountPercentChange}
                          className="input-field w-full"
                          placeholder="Nhập % ưu đãi"
                        />
                      </div>
                      <div>
                        <label className="font-sans text-[10px] text-muted-gray mb-1.5 block uppercase tracking-luxury font-medium">
                          Giá ưu đãi (VND)
                        </label>
                        <input
                          type="number"
                          min="0"
                          {...register('sale_price', {
                            onChange: handleSalePriceChange,
                            validate: (val) => {
                              if (!val) return true
                              const valNum = Number(val)
                              const originalPrice = Number(watch('price')) || 0
                              if (valNum < 0) return 'Phải >= 0'
                              if (valNum > originalPrice) return 'Phải <= Giá gốc'
                              return true
                            }
                          })}
                          className="input-field w-full"
                          placeholder="Để trống nếu không có"
                        />
                        {errors.sale_price && <p className="text-red-500 text-xs mt-1">{errors.sale_price.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="font-sans text-[10px] text-muted-gray mb-1.5 block uppercase tracking-luxury font-medium">
                          Tồn kho *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          {...register('stock', {
                            required: 'Bắt buộc',
                            min: { value: 0, message: 'Phải >= 0' },
                            validate: (val) => Number.isInteger(Number(val)) || 'Phải là số nguyên'
                          })}
                          className="input-field w-full"
                        />
                        {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock.message}</p>}
                      </div>
                      <div>
                        <label className="font-sans text-[10px] text-muted-gray mb-1.5 block uppercase tracking-luxury font-medium">
                          Thương hiệu
                        </label>
                        <input {...register('brand')} className="input-field w-full" placeholder="Dior, Chanel..." />
                      </div>
                    </div>

                    <div>
                      <label className="font-sans text-[10px] text-muted-gray mb-1.5 block uppercase tracking-luxury font-medium">
                        Danh mục *
                      </label>
                      <input type="hidden" {...register('category_id', { required: 'Bắt buộc' })} />
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                          className="w-full text-left px-4 py-3 border border-soft-gray bg-white text-dark-text text-sm font-sans flex items-center justify-between focus:outline-none focus:border-gold transition-colors duration-200"
                        >
                          <span className={watchedCategoryId ? 'text-dark-text' : 'text-muted-gray'}>
                            {selectedCategoryName}
                          </span>
                          <ChevronDown size={14} className={`text-muted-gray transition-transform duration-300 ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {categoryDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-20" onClick={() => setCategoryDropdownOpen(false)} />
                            <div className="absolute z-30 w-full mt-1 bg-white border border-soft-gray shadow-xl max-h-60 overflow-y-auto animate-fadeIn rounded-none">
                              <button
                                type="button"
                                onClick={() => {
                                  setValue('category_id', '')
                                  setCategoryDropdownOpen(false)
                                }}
                                className="w-full text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-gray hover:bg-beige hover:text-gold transition-colors font-medium border-b border-soft-gray/50"
                              >
                                Chọn danh mục
                              </button>
                              {categories.map((category) => (
                                <button
                                  key={category.id}
                                  type="button"
                                  onClick={() => {
                                    setValue('category_id', category.id)
                                    setCategoryDropdownOpen(false)
                                  }}
                                  className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between ${
                                    watchedCategoryId === category.id
                                      ? 'bg-beige text-gold font-medium'
                                      : 'text-dark-text hover:bg-beige hover:text-gold'
                                  }`}
                                >
                                  <span>{category.name}</span>
                                  {watchedCategoryId === category.id && <span className="w-1.5 h-1.5 rounded-full bg-gold" />}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                      {errors.category_id && <p className="text-red-500 text-xs mt-1">{errors.category_id.message}</p>}
                    </div>

                    <div>
                      <label className="font-sans text-[10px] text-muted-gray mb-1.5 block uppercase tracking-luxury font-medium">
                        Mô tả sản phẩm
                      </label>
                      <textarea
                        {...register('description')}
                        rows={5}
                        className="input-field w-full resize-none"
                        placeholder="Mô tả công dụng, thành phần, cách dùng..."
                      />
                    </div>
                  </div>

                  <aside className="space-y-5">
                    <div className="border border-soft-gray p-4 bg-white">
                      <label className="flex items-center justify-between gap-4 cursor-pointer">
                        <div>
                          <span className="block font-sans text-xs uppercase tracking-luxury text-dark-text font-medium">Đang bán</span>
                          <span className="block font-sans text-[10px] text-muted-gray mt-1 leading-relaxed">Tắt để dừng bán và ẩn khỏi trang khách hàng</span>
                        </div>
                        <div className="relative shrink-0">
                          <input
                            type="checkbox"
                            {...register('is_active')}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-6 bg-soft-gray rounded-full relative peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold transition-colors" />
                        </div>
                      </label>
                    </div>

                    <div>
                      <label className="font-sans text-[10px] text-muted-gray mb-2 block uppercase tracking-luxury font-medium">
                        Hình ảnh sản phẩm
                      </label>
                      <input type="hidden" {...register('images')} />
                      <div className="grid grid-cols-3 gap-3">
                        {imageUrls.map((url, index) => (
                          <div key={`${url}-${index}`} className="relative aspect-square border border-soft-gray bg-white group overflow-hidden">
                            <img
                              src={url}
                              alt={`Sản phẩm ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(event) => { (event.currentTarget as HTMLImageElement).style.display = 'none' }}
                            />
                            <button
                              type="button"
                              onClick={() => setValue('images', imageUrls.filter((_, itemIndex) => itemIndex !== index).join('\n'))}
                              className="absolute top-1.5 right-1.5 w-6 h-6 bg-obsidian/75 backdrop-blur text-white flex items-center justify-center shadow hover:bg-red-600 transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                        <label className={`aspect-square border border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors bg-white ${
                          uploading ? 'border-gold/50 text-gold/50 cursor-not-allowed' : 'border-soft-gray text-muted-gray hover:border-gold hover:text-gold'
                        }`}>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProductImageUpload}
                            disabled={uploading}
                            className="hidden"
                          />
                          {uploading ? (
                            <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin mb-1" />
                          ) : (
                            <ImagePlus size={18} className="mb-1" />
                          )}
                          <span className="text-[9px] uppercase font-sans tracking-wide">Thêm ảnh</span>
                        </label>
                      </div>
                    </div>
                  </aside>
                </div>

                <div className="flex justify-end gap-3 pt-5 border-t border-gold/10 mt-8">
                  <button type="button" onClick={() => setModalOpen(false)} className="btn-outline px-6">
                    Hủy
                  </button>
                  <button type="submit" disabled={isSubmitting} className="btn-gold px-8 disabled:opacity-70">
                    {isSubmitting ? 'Đang lưu...' : editingProduct ? 'Cập nhật' : 'Thêm mới'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setDeleteTarget(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="relative bg-white p-8 max-w-sm w-full text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={22} className="text-red-500" />
              </div>
              <h3 className="font-serif text-lg text-dark-text mb-2">Xóa sản phẩm?</h3>
              <p className="font-sans text-sm text-muted-gray mb-6">
                Bạn có chắc muốn xóa <strong>"{deleteTarget.name}"</strong>? Sản phẩm sẽ chuyển sang dừng bán và ẩn khỏi trang khách hàng.
              </p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setDeleteTarget(null)} className="btn-outline flex-1">
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(deleteTarget.id)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 bg-red-500 text-white py-2 px-4 font-sans text-sm tracking-wider hover:bg-red-600 transition-colors disabled:opacity-70"
                >
                  {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
