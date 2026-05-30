from sqlalchemy.orm import Session
from app.models.review import Review
from app.schemas.review import ReviewCreate
from typing import List, Optional


def get_product_reviews(db: Session, product_id) -> List[Review]:
    """Lấy toàn bộ danh sách đánh giá của một sản phẩm, sắp xếp theo thời gian từ mới nhất đến cũ nhất."""
    return db.query(Review).filter(Review.product_id == product_id).order_by(Review.created_at.desc()).all()


def get_user_review(db: Session, user_id, product_id) -> Optional[Review]:
    """Tìm lượt đánh giá của một người dùng cụ thể đối với một sản phẩm (dùng để tránh spam đánh giá nhiều lần)."""
    return db.query(Review).filter(Review.user_id == user_id, Review.product_id == product_id).first()


def create(db: Session, user_id, product_id, data: ReviewCreate) -> Review:
    """Tạo lượt đánh giá mới (số sao và bình luận) từ khách hàng cho một sản phẩm."""
    review = Review(user_id=user_id, product_id=product_id, **data.model_dump())
    db.add(review)
    db.commit()
    db.refresh(review)
    return review

