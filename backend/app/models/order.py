import uuid
from typing import Optional
from sqlalchemy import Column, String, Integer, Numeric, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base


class Order(Base):
    """
    Model Order lưu trữ thông tin tổng quan của một đơn đặt hàng.
    Bao gồm thông tin người mua, trạng thái, tổng giá trị, địa chỉ giao nhận (JSONB) và mã đơn hàng PayOS.
    """
    __tablename__ = "orders"

    # ID định danh duy nhất dưới dạng UUID
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # ID người mua, liên kết với bảng users
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    # Trạng thái đơn hàng: pending, confirmed, shipping, delivered, cancelled
    status = Column(String(30), default="pending")
    
    # Tổng số tiền của đơn hàng, định dạng số thập phân tối đa 12 chữ số và 2 chữ số sau dấu phẩy
    total_price = Column(Numeric(12, 2), nullable=False)
    
    # Địa chỉ giao hàng được lưu dưới dạng JSONB (chứa full_name, phone, city, district, ward, address_detail)
    shipping_address = Column(JSONB)
    
    # Phương thức thanh toán: "cod" (tiền mặt khi nhận hàng) hoặc "online" (PayOS)
    payment_method = Column(String(30))
    
    # Mã đơn hàng duy nhất dùng để giao tiếp thanh toán với PayOS
    order_code = Column(Integer, unique=True, nullable=True)
    
    # Thời gian tạo đơn hàng, tự động lấy thời gian hiện tại từ cơ sở dữ liệu
    created_at = Column(DateTime, server_default=func.now())

    # Mối quan hệ với User và danh sách các mặt hàng chi tiết trong đơn hàng OrderItem
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    """
    Model OrderItem đại diện cho một sản phẩm cụ thể nằm trong đơn đặt hàng.
    Lưu trữ số lượng mua và đơn giá tại thời điểm đặt hàng đề phòng trường hợp giá sản phẩm thay đổi sau này.
    """
    __tablename__ = "order_items"

    # ID chi tiết đơn hàng
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Liên kết với bảng orders, tự động xóa chi tiết đơn nếu đơn hàng bị xóa (ondelete CASCADE)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"))
    
    # Liên kết với bảng sản phẩm products
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"))
    
    # Số lượng sản phẩm mua
    quantity = Column(Integer, nullable=False)
    
    # Đơn giá sản phẩm tại thời điểm mua (không ảnh hưởng nếu sau này Admin đổi giá sản phẩm)
    price_at_purchase = Column(Numeric(12, 2), nullable=False)

    # Các quan hệ SQLAlchemy kết nối với Order và Product
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")

    @property
    def product_name(self) -> str:
        """Thuộc tính động lấy tên sản phẩm nhanh chóng từ quan hệ Product"""
        return self.product.name if self.product else "Sản phẩm"

    @property
    def image_url(self) -> Optional[str]:
        """Thuộc tính động trả về link ảnh đầu tiên của sản phẩm dùng cho hóa đơn/giỏ hàng"""
        return self.product.images[0] if self.product and self.product.images else None

