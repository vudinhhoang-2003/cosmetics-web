import uuid
from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class CartItem(Base):
    """
    Model CartItem đại diện cho một sản phẩm nằm trong giỏ hàng của người dùng.
    Liên kết trực tiếp tới bảng 'users' và bảng 'products'.
    """
    __tablename__ = "cart_items"

    # ID định danh duy nhất của mục giỏ hàng dưới dạng UUID
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # ID của người dùng sở hữu giỏ hàng này. Xóa tài khoản sẽ tự động xóa giỏ hàng (CASCADE)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    
    # ID của sản phẩm được thêm vào giỏ hàng
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"))
    
    # Số lượng sản phẩm muốn mua, mặc định là 1
    quantity = Column(Integer, default=1)

    # Mối quan hệ SQLAlchemy với User và Product để dễ dàng truy vấn chéo
    user = relationship("User", back_populates="cart_items")
    product = relationship("Product", back_populates="cart_items")

