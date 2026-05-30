import uuid
from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, func, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Review(Base):
    """
    Model Review lưu trữ đánh giá phản hồi từ khách hàng cho từng sản phẩm cụ thể.
    Có ràng buộc CheckConstraint đảm bảo số sao đánh giá luôn nằm trong khoảng từ 1 đến 5 sao.
    """
    __tablename__ = "reviews"
    __table_args__ = (CheckConstraint("rating BETWEEN 1 AND 5", name="rating_range"),)

    # ID định danh duy nhất của lượt đánh giá
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # ID của người viết đánh giá, liên kết với bảng users
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    # ID của sản phẩm được đánh giá, liên kết với bảng products
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"))
    
    # Số sao đánh giá từ 1 đến 5 (bắt buộc)
    rating = Column(Integer, nullable=False)
    
    # Nội dung bình luận/phản hồi chi tiết từ khách hàng
    comment = Column(Text)
    
    # Ngày giờ tạo đánh giá, tự động tạo trên server database
    created_at = Column(DateTime, server_default=func.now())

    # Các mối quan hệ để lấy nhanh tên người dùng hoặc tên sản phẩm tương ứng
    user = relationship("User", back_populates="reviews")
    product = relationship("Product", back_populates="reviews")

