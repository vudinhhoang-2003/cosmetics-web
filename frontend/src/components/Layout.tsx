import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-[62px] md:pt-[74px]">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
