from sqlalchemy.orm import Session
from app.models.category import Category
from app.schemas.category import CategoryCreate
from typing import List, Optional


def get_all(db: Session) -> List[Category]:
    """Lấy danh sách tất cả các danh mục sản phẩm hiện có trên hệ thống."""
    return db.query(Category).all()


def get_by_slug(db: Session, slug: str) -> Optional[Category]:
    """Tìm một danh mục cụ thể bằng đường dẫn thân thiện (slug) dùng cho hiển thị trang danh mục."""
    return db.query(Category).filter(Category.slug == slug).first()


def get_by_id(db: Session, cat_id) -> Optional[Category]:
    """Tìm một danh mục sản phẩm bằng ID duy nhất của nó."""
    return db.query(Category).filter(Category.id == cat_id).first()


def create(db: Session, data: CategoryCreate) -> Category:
    """Tạo mới một danh mục sản phẩm từ dữ liệu đã qua xác thực (CategoryCreate)."""
    cat = Category(**data.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


def update(db: Session, cat: Category, data: dict) -> Category:
    """
    Cập nhật thông tin của danh mục hiện tại.
    Duyệt qua dict dữ liệu thay đổi và ghi đè các giá trị khác None.
    """
    for k, v in data.items():
        if v is not None:
            setattr(cat, k, v)
    db.commit()
    db.refresh(cat)
    return cat


def delete(db: Session, cat: Category) -> None:
    """Xóa bỏ danh mục sản phẩm khỏi cơ sở dữ liệu."""
    db.delete(cat)
    db.commit()

