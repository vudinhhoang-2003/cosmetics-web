import uuid
from sqlalchemy import Column, String, Text, Numeric, Integer, Boolean, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from app.core.database import Base


class Product(Base):
    """
    Model Product đại diện cho thông tin chi tiết của một sản phẩm mỹ phẩm Luxe Beauty.
    Lưu trữ tên, mô tả, giá niêm yết, giá khuyến mãi, số lượng tồn kho (stock), ảnh, thương hiệu và trạng thái kích hoạt.
    """
    __tablename__ = "products"

    # ID sản phẩm duy nhất dưới dạng UUID
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Tên sản phẩm mỹ phẩm (ví dụ: "Nước hoa Chanel No.5")
    name = Column(String(255), nullable=False)
    
    # Đường dẫn thân thiện dùng cho SEO, được đánh chỉ mục và là duy nhất
    slug = Column(String(255), unique=True, nullable=False, index=True)
    
    # Mô tả chi tiết về công dụng, thành phần, cách dùng sản phẩm
    description = Column(Text)
    
    # Giá niêm yết (gốc) của sản phẩm
    price = Column(Numeric(12, 2), nullable=False)
    
    # Giá khuyến mãi (giá bán thực tế nếu có đợt giảm giá)
    sale_price = Column(Numeric(12, 2))
    
    # Số lượng sản phẩm còn lại trong kho hàng (stock)
    stock = Column(Integer, default=0)
    
    # Mảng danh sách các đường dẫn ảnh sản phẩm (lưu trữ trên server hoặc Cloudinary)
    images = Column(ARRAY(Text), default=[])
    
    # Danh mục sản phẩm (liên kết với bảng categories)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"))
    
    # Thương hiệu sản phẩm (ví dụ: "Chanel", "Dior",...)
    brand = Column(String(100))
    
    # Trạng thái kích hoạt (ẩn/hiển thị sản phẩm ở trang chủ khách hàng)
    is_active = Column(Boolean, default=True)
    
    # Thời gian sản phẩm được tạo/đưa lên hệ thống
    created_at = Column(DateTime, server_default=func.now())

    # Các mối quan hệ SQLAlchemy
    category = relationship("Category", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")
    cart_items = relationship("CartItem", back_populates="product")
    reviews = relationship("Review", back_populates="product")

