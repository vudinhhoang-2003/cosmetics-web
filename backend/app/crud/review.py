from sqlalchemy.orm import Session
from app.models.review import Review
from app.schemas.review import ReviewCreate
from typing import List, Optional


def get_product_reviews(db: Session, product_id) -> List[Review]:
    return db.query(Review).filter(Review.product_id == product_id).order_by(Review.created_at.desc()).all()


def get_user_review(db: Session, user_id, product_id) -> Optional[Review]:
    return db.query(Review).filter(Review.user_id == user_id, Review.product_id == product_id).first()


def create(db: Session, user_id, product_id, data: ReviewCreate) -> Review:
    review = Review(user_id=user_id, product_id=product_id, **data.model_dump())
    db.add(review)
    db.commit()
    db.refresh(review)
    return review
