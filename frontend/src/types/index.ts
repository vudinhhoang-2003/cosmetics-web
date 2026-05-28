export interface Category {
  id: string
  name: string
  slug: string
  image_url?: string
}

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

export interface ProductList {
  items: Product[]
  total: number
  skip: number
  limit: number
}

export interface User {
  id: string
  email: string
  full_name?: string
  phone?: string
  role: 'customer' | 'admin'
  is_active: boolean
  created_at: string
}

export interface Token {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}

export interface CartItem {
  id: string
  product_id: string
  quantity: number
  product: Product
}

export interface Cart {
  items: CartItem[]
  total: number
}

export interface OrderItem {
  id: string
  product_id: string
  quantity: number
  price_at_purchase: number
  product_name?: string
}

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

export interface ShippingAddress {
  full_name: string
  phone: string
  address: string
  district: string
  city: string
  note?: string
}

export interface Review {
  id: string
  user_id: string
  product_id: string
  rating: number
  comment?: string
  created_at: string
  user_name?: string
}

export interface AdminStats {
  total_revenue: number
  total_orders: number
  total_products: number
  total_users: number
  pending_orders: number
  top_products: { name: string; total_sold: number }[]
}
