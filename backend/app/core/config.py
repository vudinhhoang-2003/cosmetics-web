from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """
    Lớp Settings quản lý toàn bộ các biến môi trường và cấu hình hệ thống.
    Sử dụng thư viện pydantic-settings để tự động nạp và kiểm tra dữ liệu từ file .env.
    """
    DATABASE_URL: str = "postgresql://luxe_user:password@db/luxe_beauty"  # URL kết nối cơ sở dữ liệu PostgreSQL
    SECRET_KEY: str = "changethis"  # Khóa bảo mật dùng để ký (sign) JWT Token
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # Thời gian hết hạn của Access Token (phút)
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7  # Thời gian hết hạn của Refresh Token (ngày)
    
    # Cấu hình lưu trữ hình ảnh Cloudinary (nếu sử dụng làm cloud storage)
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    
    FRONTEND_URL: str = "http://localhost:5173"  # Địa chỉ ứng dụng Frontend (dùng cho CORS và Redirect URL)
    DEBUG: bool = True  # Bật/tắt chế độ debug lỗi của server
    UPLOAD_DIR: str = "uploads"  # Thư mục lưu trữ hình ảnh tải lên cục bộ
    MAX_FILE_SIZE: int = 5 * 1024 * 1024  # Dung lượng tệp tải lên tối đa (5MB)
    
    # Cấu hình tích hợp cổng thanh toán trực tuyến PayOS
    PAYOS_CLIENT_ID: str = ""
    PAYOS_API_KEY: str = ""
    PAYOS_CHECKSUM_KEY: str = ""

    class Config:
        env_file = ".env"  # Định nghĩa file chứa biến môi trường mặc định


@lru_cache()
def get_settings() -> Settings:
    """
    Sử dụng lru_cache để ghi nhớ (cache) cấu hình sau lần tải đầu tiên,
    tránh việc đọc file .env nhiều lần gây ảnh hưởng hiệu năng hệ thống.
    """
    return Settings()


# Biến settings được import và dùng chung trong toàn bộ backend
settings = get_settings()

