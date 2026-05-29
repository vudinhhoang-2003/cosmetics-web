import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

// Khởi tạo QueryClient cho React Query để quản lý cache dữ liệu từ API
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Dữ liệu được coi là mới trong vòng 5 phút (tránh gọi API lặp lại liên tục)
      retry: 1, // Số lần tự động thử lại request nếu gặp lỗi mạng
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Cung cấp dữ liệu cache React Query cho toàn bộ dự án */}
    <QueryClientProvider client={queryClient}>
      {/* Định vị bộ điều hướng Router trong ứng dụng Single Page App */}
      <BrowserRouter>
        <App />
        {/* Bộ hiển thị thông báo Toast ở góc dưới bên phải màn hình, mang phong cách gold luxe */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              borderLeft: '4px solid #C9A96E', // Đường viền trái màu gold sang trọng
              borderRadius: '4px',
              fontFamily: 'Lato, sans-serif',
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)

