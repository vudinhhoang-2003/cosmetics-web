import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Trash2, X, Tag } from 'lucide-react'
import toast from 'react-hot-toast'
import { categoryApi, uploadApi } from '../../api/endpoints'
import type { Category } from '../../types'

interface CategoryForm {
  name: string
  slug: string
  image_url: string
}

export default function AdminCategories() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const toastId = toast.loading('Đang tải ảnh lên...')
    try {
      const response = await uploadApi.image(file)
      setValue('image_url', response.data.url)
      toast.success('Tải ảnh lên thành công', { id: toastId })
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Không thể tải ảnh lên'
      toast.error(errMsg, { id: toastId })
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.list().then((r) => r.data),
  })
  const categories: Category[] = categoriesData || []

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoryForm>()

  const openAdd = () => {
    setEditingCategory(null)
    reset({ name: '', slug: '', image_url: '' })
    setModalOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditingCategory(cat)
    reset({ name: cat.name, slug: cat.slug, image_url: cat.image_url || '' })
    setModalOpen(true)
  }

  const createMutation = useMutation({
    mutationFn: (data: CategoryForm) =>
      categoryApi.create({ name: data.name, slug: data.slug, image_url: data.image_url || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Thêm danh mục thành công')
      setModalOpen(false)
    },
    onError: () => toast.error('Không thể thêm danh mục'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryForm }) =>
      categoryApi.update(id, { name: data.name, slug: data.slug, image_url: data.image_url || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Cập nhật danh mục thành công')
      setModalOpen(false)
    },
    onError: () => toast.error('Không thể cập nhật danh mục'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Đã xóa danh mục')
      setDeleteTarget(null)
    },
    onError: () => toast.error('Không thể xóa danh mục'),
  })

  const onSubmit = (data: CategoryForm) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data })
    } else {
      createMutation.mutate(data)
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
          <h1 className="font-serif text-2xl text-dark-text">Quản Lý Danh Mục</h1>
          <p className="font-sans text-sm text-muted-gray mt-0.5">{categories.length} danh mục</p>
        </div>
        <button onClick={openAdd} className="btn-gold flex items-center gap-2 px-5">
          <Plus size={16} /> Thêm danh mục
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-soft-gray overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="py-16 text-center">
            <Tag size={36} className="text-soft-gray mx-auto mb-3" />
            <p className="font-sans text-muted-gray">Chưa có danh mục nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full font-sans text-sm">
              <thead>
                <tr className="bg-beige border-b border-soft-gray">
                  <th className="px-5 py-3 text-left text-xs text-muted-gray uppercase tracking-wider font-medium">
                    Hình ảnh
                  </th>
                  <th className="px-5 py-3 text-left text-xs text-muted-gray uppercase tracking-wider font-medium">
                    Tên danh mục
                  </th>
                  <th className="px-5 py-3 text-left text-xs text-muted-gray uppercase tracking-wider font-medium">
                    Slug
                  </th>
                  <th className="px-5 py-3 text-center text-xs text-muted-gray uppercase tracking-wider font-medium">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soft-gray">
                {categories.map((cat) => (
                  <motion.tr
                    key={cat.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-beige/30 transition-colors"
                  >
                    <td className="px-5 py-4">
                      {cat.image_url ? (
                        <img
                          src={cat.image_url}
                          alt={cat.name}
                          className="w-12 h-12 object-cover bg-beige rounded-sm"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-soft-gray flex items-center justify-center rounded-sm">
                          <Tag size={16} className="text-muted-gray" />
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-dark-text">{cat.name}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs text-muted-gray bg-soft-gray/50 px-2 py-1 rounded">
                        {cat.slug}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => openEdit(cat)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Sửa"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(cat)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Xóa"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
              className="relative bg-white w-full max-w-md"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-soft-gray">
                <h2 className="font-serif text-lg text-dark-text">
                  {editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}
                </h2>
                <button onClick={() => setModalOpen(false)}>
                  <X size={18} className="text-muted-gray hover:text-dark-text" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="font-sans text-xs text-muted-gray mb-1.5 block uppercase tracking-wider">
                    Tên danh mục *
                  </label>
                  <input
                    {...register('name', { required: 'Bắt buộc' })}
                    onBlur={generateSlug}
                    className="input-field w-full"
                    placeholder="Son môi"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                  )}
                </div>

                {/* Slug */}
                <div>
                  <label className="font-sans text-xs text-muted-gray mb-1.5 block uppercase tracking-wider">
                    Slug *
                  </label>
                  <input
                    {...register('slug', { required: 'Bắt buộc' })}
                    className="input-field w-full font-mono text-sm"
                    placeholder="son-moi"
                  />
                  {errors.slug && (
                    <p className="text-red-500 text-xs mt-1">{errors.slug.message}</p>
                  )}
                </div>

                {/* Image URL */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-sans text-xs text-muted-gray block uppercase tracking-wider">
                      URL hình ảnh
                    </label>
                    <label className="text-xs text-gold hover:text-gold-dark cursor-pointer font-sans flex items-center gap-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                      <span>Tải ảnh lên</span>
                    </label>
                  </div>
                  <input
                    {...register('image_url')}
                    className="input-field w-full"
                    placeholder="https://example.com/image.jpg"
                  />
                  {/* Preview */}
                  {watch('image_url') && (
                    <img
                      src={watch('image_url')}
                      alt="Preview"
                      className="mt-2 w-24 h-24 object-cover bg-beige rounded-sm border border-soft-gray"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-soft-gray mt-2">
                  <button type="button" onClick={() => setModalOpen(false)} className="btn-outline px-6">
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-gold px-8 disabled:opacity-70"
                  >
                    {isSubmitting ? 'Đang lưu...' : editingCategory ? 'Cập nhật' : 'Thêm mới'}
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
              <h3 className="font-serif text-lg text-dark-text mb-2">Xóa danh mục?</h3>
              <p className="font-sans text-sm text-muted-gray mb-6">
                Bạn có chắc muốn xóa danh mục <strong>"{deleteTarget.name}"</strong>?
                Các sản phẩm thuộc danh mục này sẽ không còn được phân loại.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteTarget(null)} className="btn-outline flex-1">
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
