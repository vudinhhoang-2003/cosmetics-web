import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout() {
  /**
   * Layout chung dành cho giao diện khách hàng.
   * - Navbar cố định ở đầu trang.
   * - main dùng để hiển thị nội dung các trang con (HomePage, ProductsPage, CartPage,...) thông qua <Outlet />.
   * - Footer ở chân trang.
   */
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {/* pt-[] dùng để chừa khoảng trống cho Navbar cố định ở phía trên */}
      <main className="flex-1 pt-[62px] md:pt-[74px]">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

