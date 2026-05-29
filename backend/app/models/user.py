import uuid
from sqlalchemy import Column, String, Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):
    """
    Model User đại diện cho tài khoản người dùng trong hệ thống Luxe Beauty.
    Phân cấp vai trò qua trường 'role' (admin quản trị hệ thống, customer khách hàng mua sắm).
    """
    __tablename__ = "users"

    # ID định danh duy nhất của người dùng dưới dạng UUID
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Địa chỉ Email dùng để đăng nhập, có ràng buộc index và duy nhất
    email = Column(String(255), unique=True, nullable=False, index=True)
    
    # Mật khẩu đã được mã hóa bằng bcrypt bảo mật thông tin người dùng
    password_hash = Column(String(255), nullable=False)
    
    # Họ tên đầy đủ của người dùng
    full_name = Column(String(255))
    
    # Số điện thoại liên hệ
    phone = Column(String(20))
    
    # Phân quyền người dùng: "admin" (quản lý hệ thống) hoặc "customer" (khách hàng mặc định)
    role = Column(String(20), default="customer")
    
    # Trạng thái tài khoản (bị khóa hoặc đang hoạt động)
    is_active = Column(Boolean, default=True)
    
    # Thời gian đăng ký tài khoản thành công
    created_at = Column(DateTime, server_default=func.now())

    # Các quan hệ SQLAlchemy đến các thực thể con trong cơ sở dữ liệu
    orders = relationship("Order", back_populates="user")
    cart_items = relationship("CartItem", back_populates="user", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="user")

