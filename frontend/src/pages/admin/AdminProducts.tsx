import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Trash2, X, Search, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { productApi, categoryApi } from '../../api/endpoints'
import type { Product, Category } from '../../types'
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

export default function AdminProducts() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.list().then((r) => r.data),
  })
  const categories: Category[] = categoriesData || []

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['admin-products', page, search],
    queryFn: () =>
      productApi
        .list({ skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE, search: search || undefined })
        .then((r) => r.data),
  })

  const products = productsData?.items || []
  const total = productsData?.total || 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductForm>({
    defaultValues: { is_active: true },
  })

  const openAdd = () => {
    reset({ is_active: true, name: '', slug: '', description: '', price: 0, sale_price: '', stock: 0, brand: '', category_id: '', images: '' })
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

  const createMutation = useMutation({
    mutationFn: (data: Partial<Product>) => productApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      toast.success('Thêm sản phẩm thành công')
      setModalOpen(false)
    },
    onError: () => toast.error('Không thể thêm sản phẩm'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      productApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      toast.success('Cập nhật sản phẩm thành công')
      setModalOpen(false)
    },
    onError: () => toast.error('Không thể cập nhật sản phẩm'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      toast.success('Đã xóa sản phẩm')
      setDeleteTarget(null)
    },
    onError: () => toast.error('Không thể xóa sản phẩm'),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: (product: Product) =>
      productApi.update(product.id, { is_active: !product.is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
    onError: () => toast.error('Không thể cập nhật trạng thái'),
  })

  const onSubmit = (data: ProductForm) => {
    const payload: Partial<Product> = {
      name: data.name,
      slug: data.slug,
      description: data.description,
      price: Number(data.price),
      sale_price: data.sale_price ? Number(data.sale_price) : undefined,
      stock: Number(data.stock),
      brand: data.brand || undefined,
      category_id: data.category_id || undefined,
      images: data.images ? data.images.split('\n').map(s => s.trim()).filter(Boolean) : [],
      is_active: data.is_active,
    }
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  // Auto-generate slug from name
  const watchName = watch('name')
  const generateSlug = () => {
    const slug = watchName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
    setValue('slug', slug)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-dark-text">Quản Lý Sản Phẩm</h1>
          <p className="font-sans text-sm text-muted-gray mt-0.5">{total} sản phẩm</p>
        </div>
        <button onClick={openAdd} className="btn-gold flex items-center gap-2 px-5">
          <Plus size={16} /> Thêm sản phẩm
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-gray" />
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="input-field pl-10 w-full bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-soft-gray overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full font-sans text-sm">
            <thead>
              <tr className="bg-beige border-b border-soft-gray">
                <th className="w-14 px-4 py-3 text-left text-xs text-muted-gray uppercase tracking-wider font-medium">
                  Ảnh
                </th>
                <th className="px-4 py-3 text-left text-xs text-muted-gray uppercase tracking-wider font-medium">
                  Tên sản phẩm
                </th>
                <th className="px-4 py-3 text-left text-xs text-muted-gray uppercase tracking-wider font-medium hidden md:table-cell">
                  Thương hiệu
                </th>
                <th className="px-4 py-3 text-left text-xs text-muted-gray uppercase tracking-wider font-medium hidden lg:table-cell">
                  Danh mục
                </th>
                <th className="px-4 py-3 text-right text-xs text-muted-gray uppercase tracking-wider font-medium">
                  Giá
                </th>
                <th className="px-4 py-3 text-center text-xs text-muted-gray uppercase tracking-wider font-medium">
                  Tồn kho
                </th>
                <th className="px-4 py-3 text-center text-xs text-muted-gray uppercase tracking-wider font-medium">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-center text-xs text-muted-gray uppercase tracking-wider font-medium">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soft-gray">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-soft-gray animate-pulse rounded" />
                        </td>
                      ))}
                    </tr>
                  ))
                : products.map((product) => (
                    <tr key={product.id} className="hover:bg-beige/30 transition-colors">
                      <td className="px-4 py-3">
                        <img
                          src={
                            product.images?.[0] ||
                            'https://images.unsplash.com/photo-1586495777744-4e6232bf2f8f?w=80'
                          }
                          alt={product.name}
                          className="w-10 h-10 object-cover bg-beige rounded-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-dark-text font-medium line-clamp-1">{product.name}</p>
                        <p className="text-xs text-muted-gray">{product.slug}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-gray hidden md:table-cell">
                        {product.brand || '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-gray hidden lg:table-cell">
                        {product.category?.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-gold font-semibold">
                          {formatPrice(product.sale_price ?? product.price)}
                        </p>
                        {product.sale_price && (
                          <p className="text-xs text-muted-gray line-through">
                            {formatPrice(product.price)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-sm font-semibold ${
                            product.stock === 0
                              ? 'text-red-500'
                              : product.stock < 5
                              ? 'text-amber-600'
                              : 'text-dark-text'
                          }`}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleActiveMutation.mutate(product)}
                          className="inline-flex items-center gap-1 text-xs font-sans"
                        >
                          {product.is_active ? (
                            <>
                              <ToggleRight size={22} className="text-green-500" />
                              <span className="text-green-600 hidden sm:inline">Đang bán</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft size={22} className="text-muted-gray" />
                              <span className="text-muted-gray hidden sm:inline">Ẩn</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEdit(product)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Sửa"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(product)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Xóa"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 text-sm font-sans border transition-colors ${
                page === p
                  ? 'bg-gold text-white border-gold'
                  : 'border-soft-gray text-dark-text hover:border-gold'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
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
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-soft-gray sticky top-0 bg-white z-10">
                <h2 className="font-serif text-lg text-dark-text">
                  {editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
                </h2>
                <button onClick={() => setModalOpen(false)}>
                  <X size={20} className="text-muted-gray hover:text-dark-text" />
                </button>
              </div>

              {/* Modal body */}
              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="sm:col-span-2">
                    <label className="font-sans text-xs text-muted-gray mb-1 block uppercase tracking-wider">
                      Tên sản phẩm *
                    </label>
                    <input
                      {...register('name', { required: 'Bắt buộc' })}
                      onBlur={generateSlug}
                      className="input-field w-full"
                      placeholder="Kem dưỡng ẩm Lancôme..."
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                  </div>

                  {/* Slug */}
                  <div className="sm:col-span-2">
                    <label className="font-sans text-xs text-muted-gray mb-1 block uppercase tracking-wider">
                      Slug *
                    </label>
                    <input
                      {...register('slug', { required: 'Bắt buộc' })}
                      className="input-field w-full font-mono text-sm"
                      placeholder="kem-duong-am-lancome"
                    />
                    {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>}
                  </div>

                  {/* Price */}
                  <div>
                    <label className="font-sans text-xs text-muted-gray mb-1 block uppercase tracking-wider">
                      Giá gốc (VND) *
                    </label>
                    <input
                      type="number"
                      {...register('price', { required: 'Bắt buộc', min: { value: 0, message: 'Phải >= 0' } })}
                      className="input-field w-full"
                      placeholder="500000"
                    />
                    {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                  </div>

                  {/* Sale price */}
                  <div>
                    <label className="font-sans text-xs text-muted-gray mb-1 block uppercase tracking-wider">
                      Giá khuyến mãi (VND)
                    </label>
                    <input
                      type="number"
                      {...register('sale_price')}
                      className="input-field w-full"
                      placeholder="Để trống nếu không có"
                    />
                  </div>

                  {/* Stock */}
                  <div>
                    <label className="font-sans text-xs text-muted-gray mb-1 block uppercase tracking-wider">
                      Tồn kho *
                    </label>
                    <input
                      type="number"
                      {...register('stock', { required: 'Bắt buộc', min: { value: 0, message: 'Phải >= 0' } })}
                      className="input-field w-full"
                      placeholder="100"
                    />
                    {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock.message}</p>}
                  </div>

                  {/* Brand */}
                  <div>
                    <label className="font-sans text-xs text-muted-gray mb-1 block uppercase tracking-wider">
                      Thương hiệu
                    </label>
                    <input
                      {...register('brand')}
                      className="input-field w-full"
                      placeholder="Lancôme"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="font-sans text-xs text-muted-gray mb-1 block uppercase tracking-wider">
                      Danh mục
                    </label>
                    <select {...register('category_id')} className="input-field w-full bg-white cursor-pointer">
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Is active */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_active"
                      {...register('is_active')}
                      className="w-4 h-4 accent-[#C9A96E]"
                    />
                    <label htmlFor="is_active" className="font-sans text-sm text-dark-text cursor-pointer">
                      Hiển thị sản phẩm (đang bán)
                    </label>
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-2">
                    <label className="font-sans text-xs text-muted-gray mb-1 block uppercase tracking-wider">
                      Mô tả sản phẩm
                    </label>
                    <textarea
                      {...register('description')}
                      rows={3}
                      className="input-field w-full resize-none"
                      placeholder="Mô tả chi tiết về sản phẩm..."
                    />
                  </div>

                  {/* Images */}
                  <div className="sm:col-span-2">
                    <label className="font-sans text-xs text-muted-gray mb-1 block uppercase tracking-wider">
                      URL ảnh (mỗi dòng một URL)
                    </label>
                    <textarea
                      {...register('images')}
                      rows={3}
                      className="input-field w-full resize-none font-mono text-xs"
                      placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2 border-t border-soft-gray mt-4">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="btn-outline px-6"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-gold px-8 disabled:opacity-70"
                  >
                    {isSubmitting ? 'Đang lưu...' : editingProduct ? 'Cập nhật' : 'Thêm mới'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete confirm modal */}
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
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white p-8 max-w-sm w-full text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={22} className="text-red-500" />
              </div>
              <h3 className="font-serif text-lg text-dark-text mb-2">Xóa sản phẩm?</h3>
              <p className="font-sans text-sm text-muted-gray mb-6">
                Bạn có chắc muốn xóa <strong>"{deleteTarget.name}"</strong>?
                Thao tác này không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="btn-outline flex-1"
                >
                  Hủy
                </button>
                <button
                  onClick={() => deleteMutation.mutate(deleteTarget.id)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 bg-red-500 text-white py-2 px-4 font-sans text-sm tracking-wider hover:bg-red-600 transition-colors disabled:opacity-70"
                >
                  {deleteMutation.isPending ? 'Đang xóa...' : 'XÓA'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
