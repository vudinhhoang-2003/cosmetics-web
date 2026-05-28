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
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sort, setSort] = useState('newest')
  const [stockFilter, setStockFilter] = useState('all')
  const [saleFilter, setSaleFilter] = useState('all')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.list().then((r) => r.data),
  })
  const categories: Category[] = categoriesData || []

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
          { label: 'Tổng kết quả', value: total, icon: Package, color: 'text-gold bg-gold/10' },
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
            <button
              type="button"
              onClick={() => setSaleFilter(saleFilter === 'sale' ? 'all' : 'sale')}
              className={`inline-flex items-center gap-2 border px-3 py-2 font-sans text-xs transition-colors ${
                saleFilter === 'sale'
                  ? 'bg-gold border-gold text-white'
                  : 'bg-white border-soft-gray text-dark-text hover:border-gold'
              }`}
            >
              <BadgePercent size={14} />
              Ưu đãi
            </button>
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
                      <img
                        src={product.images?.[0] || 'https://images.unsplash.com/photo-1586495777744-4e6232bf2f8f?w=80'}
                        alt={product.name}
                        className="w-12 h-12 object-cover bg-beige rounded-sm"
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
              className="absolute inset-0 bg-black/50"
              onClick={() => setModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 18 }}
              transition={{ duration: 0.2 }}
              className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-soft-gray sticky top-0 bg-white z-10">
                <div>
                  <h2 className="font-serif text-lg text-dark-text">
                    {editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
                  </h2>
                  <p className="font-sans text-xs text-muted-gray mt-0.5">
                    Cập nhật thông tin bán hàng, mô tả và hình ảnh.
                  </p>
                </div>
                <button type="button" onClick={() => setModalOpen(false)} className="p-2 -mr-2">
                  <X size={20} className="text-muted-gray hover:text-dark-text" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="font-sans text-xs text-muted-gray mb-1 block uppercase tracking-wider">
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
                        <label className="font-sans text-xs text-muted-gray mb-1 block uppercase tracking-wider">
                          Slug *
                        </label>
                        <button
                          type="button"
                          onClick={() => setValue('slug', slugify(watchedName))}
                          className="font-sans text-xs text-gold hover:underline"
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-sans text-xs text-muted-gray mb-1 block uppercase tracking-wider">
                          Giá gốc (VND) *
                        </label>
                        <input
                          type="number"
                          {...register('price', { required: 'Bắt buộc', min: { value: 0, message: 'Phải >= 0' } })}
                          className="input-field w-full"
                        />
                        {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                      </div>
                      <div>
                        <label className="font-sans text-xs text-muted-gray mb-1 block uppercase tracking-wider">
                          Giá ưu đãi
                        </label>
                        <input
                          type="number"
                          {...register('sale_price')}
                          className="input-field w-full"
                          placeholder="Để trống nếu không có"
                        />
                      </div>
                      <div>
                        <label className="font-sans text-xs text-muted-gray mb-1 block uppercase tracking-wider">
                          Tồn kho *
                        </label>
                        <input
                          type="number"
                          {...register('stock', { required: 'Bắt buộc', min: { value: 0, message: 'Phải >= 0' } })}
                          className="input-field w-full"
                        />
                        {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock.message}</p>}
                      </div>
                      <div>
                        <label className="font-sans text-xs text-muted-gray mb-1 block uppercase tracking-wider">
                          Thương hiệu
                        </label>
                        <input {...register('brand')} className="input-field w-full" placeholder="Dior, Chanel..." />
                      </div>
                    </div>

                    <div>
                      <label className="font-sans text-xs text-muted-gray mb-1 block uppercase tracking-wider">
                        Danh mục
                      </label>
                      <div className="relative">
                        <select
                          {...register('category_id')}
                          className="w-full appearance-none px-4 py-3 pr-10 border border-soft-gray bg-white text-dark-text text-sm font-sans focus:outline-none focus:border-gold transition-colors cursor-pointer"
                        >
                          <option value="">Chọn danh mục</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-gray" />
                      </div>
                    </div>

                    <div>
                      <label className="font-sans text-xs text-muted-gray mb-1 block uppercase tracking-wider">
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
                    <div className="border border-soft-gray p-4">
                      <label className="flex items-center justify-between gap-3 cursor-pointer">
                        <span>
                          <span className="block font-sans text-sm text-dark-text font-medium">Đang bán</span>
                          <span className="block font-sans text-xs text-muted-gray mt-0.5">Tắt để dừng bán và ẩn khỏi trang khách hàng</span>
                        </span>
                        <input type="checkbox" {...register('is_active')} className="w-4 h-4 accent-[#C9A96E]" />
                      </label>
                    </div>

                    <div>
                      <label className="font-sans text-xs text-muted-gray mb-2 block uppercase tracking-wider">
                        Hình ảnh sản phẩm
                      </label>
                      <input type="hidden" {...register('images')} />
                      <div className="grid grid-cols-3 gap-3">
                        {imageUrls.map((url, index) => (
                          <div key={`${url}-${index}`} className="relative aspect-square border border-soft-gray bg-beige group overflow-hidden">
                            <img
                              src={url}
                              alt={`Sản phẩm ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(event) => { (event.currentTarget as HTMLImageElement).style.display = 'none' }}
                            />
                            <button
                              type="button"
                              onClick={() => setValue('images', imageUrls.filter((_, itemIndex) => itemIndex !== index).join('\n'))}
                              className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white flex items-center justify-center shadow hover:bg-red-600 transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                        <label className={`aspect-square border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors bg-beige/50 ${
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
                          <span className="text-[10px] uppercase font-sans tracking-wide">Thêm ảnh</span>
                        </label>
                      </div>
                    </div>
                  </aside>
                </div>

                <div className="flex justify-end gap-3 pt-5 border-t border-soft-gray mt-6">
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
