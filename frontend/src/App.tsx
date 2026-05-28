import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore, useAdminAuthStore } from './store/authStore'
import { useCartStore } from './store/cartStore'
import { cartApi } from './api/endpoints'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'

// Customer pages
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

// Admin pages
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminOrders from './pages/admin/AdminOrders'
import AdminCategories from './pages/admin/AdminCategories'
import AdminUsers from './pages/admin/AdminUsers'

// Sync giỏ hàng từ server ngay khi đăng nhập để cập nhật số lượng trên icon Navbar
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin } = useAdminAuthStore()
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />
  if (!isAdmin()) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <>
      <CartSyncer />
      <Routes>
        {/* Customer routes */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:slug" element={<ProductDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
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

        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
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

