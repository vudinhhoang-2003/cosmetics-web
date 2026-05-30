// File: frontend/src/types/index.ts
// Nhiệm vụ: Khai báo toàn bộ các TypeScript Interfaces dùng chung cho hệ thống Frontend.

/** Đại diện cho Danh mục sản phẩm (Category) */
export interface Category {
  id: string
  name: string
  slug: string
  image_url?: string
}

/** Đại diện cho một Sản phẩm (Product) */
export interface Product {
  id: string
  name: string
  slug: string
  description?: string
  price: number
  sale_price?: number
  stock: number
  images: string[]
  category_id?: string
  category?: Category
  brand?: string
  is_active: boolean
  created_at: string
  avg_rating?: number
  review_count?: number
}

/** Danh sách sản phẩm trả về kèm thông tin phân trang */
export interface ProductList {
  items: Product[]
  total: number
  skip: number
  limit: number
}

/** Đại diện cho một tài khoản Người dùng (User) */
export interface User {
  id: string
  email: string
  full_name?: string
  phone?: string
  role: 'customer' | 'admin'
  is_active: boolean
  created_at: string
}

/** Token xác thực nhận được khi Đăng nhập / Đăng ký thành công */
export interface Token {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}

/** Mặt hàng nằm trong giỏ hàng (CartItem) */
export interface CartItem {
  id: string
  product_id: string
  quantity: number
  product: Product
}

/** Giỏ hàng của người dùng */
export interface Cart {
  items: CartItem[]
  total: number
}

/** Chi tiết từng mặt hàng đã mua trong đơn hàng */
export interface OrderItem {
  id: string
  product_id: string
  quantity: number
  price_at_purchase: number
  product_name?: string
  image_url?: string
}

/** Đơn đặt hàng (Order) */
export interface Order {
  id: string
  user_id: string
  status: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled'
  total_price: number
  shipping_address: ShippingAddress
  payment_method: string
  payment_url?: string
  order_code?: number
  created_at: string
  items: OrderItem[]
}

/** Thông tin địa chỉ nhận hàng của khách hàng */
export interface ShippingAddress {
  full_name: string
  phone: string
  address: string
  district: string
  city: string
  note?: string
}

/** Đánh giá sản phẩm (Review) */
export interface Review {
  id: string
  user_id: string
  product_id: string
  rating: number
  comment?: string
  created_at: string
  user_name?: string
}

/** Thống kê số liệu dành riêng cho Dashboard của Admin */
export interface AdminStats {
  total_revenue: number
  in_progress_revenue: number
  today_revenue: number
  month_revenue: number
  total_orders: number
  total_products: number
  total_users: number
  pending_orders: number
  confirmed_orders: number
  shipping_orders: number
  delivered_orders: number
  cancelled_orders: number
  today_orders: number
  low_stock_products: number
  top_products: { name: string; total_sold: number }[]
  low_stock_items: { name: string; stock: number }[]
}

