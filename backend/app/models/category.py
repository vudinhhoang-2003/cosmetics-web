import uuid
from sqlalchemy import Column, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Category(Base):
    """
    Model Category đại diện cho các danh mục mỹ phẩm (ví dụ: Nước hoa, Chăm sóc da, Trang điểm,...).
    Giúp phân loại sản phẩm và hiển thị dạng menu hoặc bộ lọc trên Frontend.
    """
    __tablename__ = "categories"

    # ID của danh mục dưới dạng UUID
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Tên danh mục (ví dụ: "Nước hoa cao cấp")
    name = Column(String(100), nullable=False)
    
    # Đường dẫn thân thiện (slug) dùng cho URL, được đánh chỉ mục (index) và là duy nhất
    slug = Column(String(100), unique=True, nullable=False, index=True)
    
    # Đường dẫn hình ảnh minh họa danh mục
    image_url = Column(Text)

    # Quan hệ một-nhiều với bảng Product (một danh mục chứa nhiều sản phẩm)
    products = relationship("Product", back_populates="category")

