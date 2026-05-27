from sqlalchemy.orm import Session
from app.models.category import Category
from app.schemas.category import CategoryCreate
from typing import List, Optional


def get_all(db: Session) -> List[Category]:
    return db.query(Category).all()


def get_by_slug(db: Session, slug: str) -> Optional[Category]:
    return db.query(Category).filter(Category.slug == slug).first()


def get_by_id(db: Session, cat_id) -> Optional[Category]:
    return db.query(Category).filter(Category.id == cat_id).first()


def create(db: Session, data: CategoryCreate) -> Category:
    cat = Category(**data.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


def update(db: Session, cat: Category, data: dict) -> Category:
    for k, v in data.items():
        if v is not None:
            setattr(cat, k, v)
    db.commit()
    db.refresh(cat)
    return cat


def delete(db: Session, cat: Category) -> None:
    db.delete(cat)
    db.commit()
