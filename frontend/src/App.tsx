import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore, useAdminAuthStore } from './store/authStore'
import { useCartStore } from './store/cartStore'
import { cartApi } from './api/endpoints'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'

// Các trang dành cho Khách hàng
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderSuccessPage from './pages/OrderSuccessPage'
import AccountPage from './pages/AccountPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CheckoutSuccessPage from './pages/CheckoutSuccessPage'
import CheckoutCancelPage from './pages/CheckoutCancelPage'
import CheckoutMockPaymentPage from './pages/CheckoutMockPaymentPage'

// Các trang quản lý dành cho Admin
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminOrders from './pages/admin/AdminOrders'
import AdminCategories from './pages/admin/AdminCategories'
import AdminUsers from './pages/admin/AdminUsers'

// Thành phần phụ hỗ trợ đồng bộ giỏ hàng từ server ngay khi đăng nhập thành công
function CartSyncer() {
  const { isAuthenticated } = useAuthStore()
  const { setItems } = useCartStore()

  useEffect(() => {
    if (isAuthenticated) {
      cartApi.get()
        .then((r) => setItems(r.data.items))
        .catch(() => {}) // Bỏ qua lỗi nếu fetch thất bại (ví dụ token chưa sẵn sàng)
    }
  }, [isAuthenticated])

  return null
}

// Bộ bọc bảo vệ định tuyến dành cho Khách hàng (yêu cầu đăng nhập trước khi truy cập)
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

// Bộ bọc bảo vệ định tuyến dành cho Admin (yêu cầu quyền quản trị viên)
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin } = useAdminAuthStore()
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />
  if (!isAdmin()) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <>
      {/* Kích hoạt tự động đồng bộ giỏ hàng */}
      <CartSyncer />
      
      {/* Thiết lập cấu hình định tuyến cho toàn bộ ứng dụng */}
      <Routes>
        {/* Nhóm các định tuyến dành cho Khách hàng được hiển thị dưới dạng Layout (Navbar & Footer) */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:slug" element={<ProductDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Các trang yêu cầu đăng nhập tài khoản khách hàng */}
          <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
          <Route
            path="/checkout"
            element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>}
          />
          <Route
            path="/order/success"
            element={<ProtectedRoute><OrderSuccessPage /></ProtectedRoute>}
          />
          <Route
            path="/checkout/success"
            element={<ProtectedRoute><CheckoutSuccessPage /></ProtectedRoute>}
          />
          <Route
            path="/checkout/cancel"
            element={<ProtectedRoute><CheckoutCancelPage /></ProtectedRoute>}
          />
          <Route
            path="/checkout/mock-payment"
            element={<ProtectedRoute><CheckoutMockPaymentPage /></ProtectedRoute>}
          />
          <Route
            path="/account"
            element={<ProtectedRoute><AccountPage /></ProtectedRoute>}
          />
        </Route>

        {/* Định tuyến đăng nhập Admin */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        
        {/* Nhóm định tuyến quản trị hệ thống Admin (yêu cầu quyền Admin và bọc trong AdminLayout) */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>
      </Routes>
    </>
  )
}


