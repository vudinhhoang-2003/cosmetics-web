import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Trash2, X, Tag, ImagePlus } from 'lucide-react'
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
  } = useForm<CategoryForm>({
    defaultValues: {
      name: '',
      slug: '',
      image_url: '',
    }
  })

  const watchName = watch('name') || ''

  // Auto-generate slug from name when name is updated
  const generateSlug = () => {
    const slug = watchName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
    setValue('slug', slug)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const toastId = toast.loading('Đang tải ảnh lên...')
    try {
      const response = await uploadApi.image(file)
      setValue('image_url', response.data.url)
      toast.success('Tải ảnh danh mục thành công', { id: toastId })
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Không thể tải ảnh lên'
      toast.error(errMsg, { id: toastId })
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

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
    onError: () => toast.error('Không thể xóa danh mục. Có thể vẫn còn sản phẩm thuộc danh mục này.'),
  })

  const onSubmit = (data: CategoryForm) => {
    const payload = {
      name: data.name.trim(),
      slug: data.slug.trim(),
      image_url: data.image_url.trim(),
    }
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl text-dark-text">Quản Lý Danh Mục</h1>
          <p className="font-sans text-sm text-muted-gray mt-1">
            Quản lý các nhóm sản phẩm (son môi, phấn mắt, má hồng...) của thương hiệu.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="btn-gold flex items-center justify-center gap-2 px-5 py-2.5 self-start sm:self-auto font-sans text-xs tracking-wider uppercase font-semibold transition-all duration-200"
        >
          <Plus size={16} /> Thêm danh mục mới
        </button>
      </div>

      {/* Overview stats badge */}
      <div className="bg-white border border-soft-gray p-4 shadow-sm inline-flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gold/10 text-gold flex items-center justify-center">
          <Tag size={18} />
        </div>
        <div>
          <p className="font-sans text-[10px] text-muted-gray uppercase tracking-wider">Tổng số danh mục</p>
          <p className="font-sans text-xl font-bold text-dark-text mt-0.5">{categories.length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-soft-gray overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="py-20 text-center">
            <Tag size={44} className="text-soft-gray mx-auto mb-3" />
            <p className="font-serif text-lg text-dark-text">Chưa có danh mục nào</p>
            <p className="font-sans text-xs text-muted-gray mt-1">Nhấp chọn nút thêm ở trên để tạo danh mục đầu tiên.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full font-sans text-sm">
              <thead>
                <tr className="bg-beige border-b border-soft-gray">
                  <th className="w-24 px-6 py-3.5 text-left text-xs text-muted-gray uppercase tracking-luxury font-bold">
                    Hình ảnh
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs text-muted-gray uppercase tracking-luxury font-bold">
                    Tên danh mục
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs text-muted-gray uppercase tracking-luxury font-bold">
                    Đường dẫn (Slug)
                  </th>
                  <th className="w-32 px-6 py-3.5 text-center text-xs text-muted-gray uppercase tracking-luxury font-bold">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soft-gray">
                {categories.map((cat) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-beige/25 transition-colors"
                  >
                    <td className="px-6 py-4">
                      {cat.image_url ? (
                        <div className="w-12 h-12 border border-soft-gray/60 p-0.5 bg-white shadow-sm shrink-0">
                          <img
                            src={cat.image_url}
                            alt={cat.name}
                            className="w-full h-full object-cover rounded-none"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-beige border border-soft-gray/30 flex items-center justify-center rounded-none shrink-0">
                          <Tag size={16} className="text-gold/55" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-dark-text">{cat.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-gold bg-gold/5 px-2.5 py-1 border border-gold/10 font-medium">
                        {cat.slug}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => openEdit(cat)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all"
                          title="Chỉnh sửa danh mục"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(cat)}
                          className="p-1.5 text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
                          title="Xóa danh mục"
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
              className="absolute inset-0 bg-obsidian/60 backdrop-blur-md"
              onClick={() => setModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.2 }}
              className="relative bg-[#FAF6F0] w-full max-w-md border border-gold/15 shadow-2xl rounded-none"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-8 py-5 border-b border-gold/10 sticky top-0 bg-[#FAF6F0]/90 backdrop-blur-md z-10">
                <div>
                  <h2 className="font-serif text-xl text-navy font-semibold tracking-wide">
                    {editingCategory ? 'Sửa Danh Mục' : 'Thêm Danh Mục'}
                  </h2>
                  <p className="font-sans text-[9px] text-muted-gray uppercase tracking-wider mt-1">
                    Cập nhật thông tin phân loại sản phẩm.
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 -mr-2 text-muted-gray hover:text-dark-text transition-colors border border-soft-gray/30 rounded-full hover:bg-beige/40"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-5">
                {/* Tên danh mục */}
                <div>
                  <label className="font-sans text-[10px] text-muted-gray mb-1.5 block uppercase tracking-luxury font-bold">
                    Tên danh mục *
                  </label>
                  <input
                    {...register('name', { required: 'Vui lòng nhập tên danh mục' })}
                    onBlur={generateSlug}
                    className="input-field w-full font-sans text-sm focus:border-gold"
                    placeholder="Ví dụ: Son môi, Phấn má..."
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1 font-sans">{errors.name.message}</p>
                  )}
                </div>

                {/* Đường dẫn Slug */}
                <div>
                  <label className="font-sans text-[10px] text-muted-gray mb-1.5 block uppercase tracking-luxury font-bold">
                    Đường dẫn (Slug) *
                  </label>
                  <input
                    {...register('slug', { required: 'Vui lòng nhập đường dẫn slug' })}
                    className="input-field w-full font-mono text-xs focus:border-gold"
                    placeholder="son-moi"
                  />
                  {errors.slug && (
                    <p className="text-red-500 text-xs mt-1 font-sans">{errors.slug.message}</p>
                  )}
                </div>

                {/* Hình ảnh danh mục */}
                <div>
                  <label className="font-sans text-[10px] text-muted-gray mb-3.5 block uppercase tracking-luxury font-bold">
                    Hình ảnh đại diện
                  </label>

                  {/* Hidden input to keep react-hook-form value */}
                  <input type="hidden" {...register('image_url')} />

                  <div className="flex items-center gap-4">
                    {watch('image_url') ? (
                      <div className="relative w-28 h-28 border border-gold/15 bg-white p-1 shadow-sm shrink-0">
                        <img
                          src={watch('image_url')}
                          alt="Category Preview"
                          className="w-full h-full object-cover rounded-none"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                        {/* Remove image button */}
                        <button
                          type="button"
                          onClick={() => setValue('image_url', '')}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors border border-white"
                          title="Xóa hình ảnh"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      /* Luxury Upload Area card */
                      <label className={`w-28 h-28 border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-200 bg-white/50 shrink-0 ${
                        uploading
                          ? 'border-gold/50 text-gold/50 cursor-not-allowed bg-gold/5'
                          : 'border-soft-gray text-muted-gray hover:border-gold hover:text-gold hover:bg-white'
                      }`}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                        {uploading ? (
                          <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin mb-1.5" />
                        ) : (
                          <ImagePlus size={20} className="mb-1.5 text-muted-gray/80" />
                        )}
                        <span className="text-[10px] uppercase font-sans tracking-wider font-semibold">Tải ảnh lên</span>
                      </label>
                    )}
                    <div className="text-xs text-muted-gray leading-relaxed font-sans max-w-xs">
                      Hình ảnh đại diện sẽ được hiển thị ở trang chủ và danh sách lọc. Định dạng JPG, PNG, WEBP (khuyên dùng kích thước vuông).
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gold/10 mt-6">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="btn-outline px-5 py-2 font-sans text-xs tracking-wider uppercase font-semibold"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-gold px-8 py-2 font-sans text-xs tracking-wider uppercase font-semibold disabled:opacity-75"
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
              className="absolute inset-0 bg-obsidian/60 backdrop-blur-md"
              onClick={() => setDeleteTarget(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-[#FAF6F0] border border-gold/15 p-8 max-w-md w-full text-center shadow-2xl rounded-none"
            >
              <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200/50 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={20} className="text-red-500" />
              </div>
              <h3 className="font-serif text-xl text-dark-text mb-2 font-semibold">Xóa Danh Mục?</h3>
              <p className="font-sans text-sm text-muted-gray mb-6 leading-relaxed">
                Bạn có chắc chắn muốn xóa danh mục <strong>"{deleteTarget.name}"</strong>?<br />
                Các sản phẩm thuộc danh mục này sẽ không còn được phân loại. Tác vụ này không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="btn-outline flex-1 py-2 font-sans text-xs tracking-wider uppercase font-semibold bg-white"
                >
                  Hủy
                </button>
                <button
                  onClick={() => deleteMutation.mutate(deleteTarget.id)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 bg-red-500 text-white py-2 px-4 font-sans text-xs tracking-wider uppercase font-semibold hover:bg-red-600 transition-colors disabled:opacity-75 shadow-sm"
                >
                  {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa Vĩnh Viễn'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
