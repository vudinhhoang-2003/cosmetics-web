from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.routers import auth, products, categories, orders, users, admin, upload, cart, payment

# Khởi tạo ứng dụng FastAPI với các thông tin cấu hình cơ bản cho Luxe Beauty API
app = FastAPI(
    title="Luxe Beauty API",
    version="1.0.0",
    description="API for Luxe Beauty - Premium Cosmetics E-Commerce",
    docs_url="/api/docs",  # Đường dẫn xem tài liệu API (Swagger UI)
    redoc_url="/api/redoc",  # Đường dẫn xem tài liệu API dạng Redoc
)

# Cấu hình CORS Middleware để cho phép Frontend kết nối tới Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000", "http://localhost"],
    allow_credentials=True,  # Cho phép gửi cookie và thông tin xác thực (credentials)
    allow_methods=["*"],  # Cho phép tất cả các phương thức HTTP (GET, POST, PUT, DELETE,...)
    allow_headers=["*"],  # Cho phép tất cả các HTTP Headers
)

# Cấu hình thư mục chứa các tệp tải lên (Static files cho ảnh sản phẩm, danh mục,...)
uploads_dir = settings.UPLOAD_DIR
os.makedirs(uploads_dir, exist_ok=True)
# Mount thư mục "/uploads" để người dùng có thể truy cập trực tiếp các ảnh tĩnh qua URL
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Đăng ký các API Router cho từng thực thể/module nghiệp vụ trong hệ thống
app.include_router(auth.router,       prefix="/api/auth")        # Module xác thực tài khoản
app.include_router(products.router,   prefix="/api/products")    # Module sản phẩm
app.include_router(categories.router, prefix="/api/categories")  # Module danh mục sản phẩm
app.include_router(cart.router,       prefix="/api/cart")        # Module giỏ hàng của người dùng
app.include_router(orders.router,     prefix="/api/orders")      # Module xử lý đơn đặt hàng
app.include_router(users.router,      prefix="/api/users")       # Module thông tin người dùng cá nhân
app.include_router(admin.router,      prefix="/api/admin")       # Module dành riêng cho quản trị viên (Admin)
app.include_router(upload.router,     prefix="/api/upload")      # Module tải lên hình ảnh
app.include_router(payment.router,    prefix="/api/payment")     # Module tích hợp thanh toán (PayOS webhook)


# Endpoint kiểm tra trạng thái hoạt động của server (Health Check)
@app.get("/api/health")
def health():
    return {"status": "ok", "version": "1.0.0"}

