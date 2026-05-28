from sqlalchemy.orm import Session
from app.models.cart import CartItem
from app.models.product import Product
from typing import List, Optional
import uuid


def get_user_cart(db: Session, user_id) -> List[CartItem]:
    return db.query(CartItem).filter(CartItem.user_id == user_id).all()


def get_item(db: Session, item_id, user_id) -> Optional[CartItem]:
    return db.query(CartItem).filter(CartItem.id == item_id, CartItem.user_id == user_id).first()


def get_product_item(db: Session, user_id, product_id) -> Optional[CartItem]:
    return db.query(CartItem).filter(
        CartItem.user_id == user_id,
        CartItem.product_id == product_id,
    ).first()


def add_item(db: Session, user_id, product_id, quantity: int) -> CartItem:
    existing = db.query(CartItem).filter(
        CartItem.user_id == user_id,
        CartItem.product_id == product_id
    ).first()
    if existing:
        existing.quantity += quantity
        db.commit()
        db.refresh(existing)
        return existing
    item = CartItem(user_id=user_id, product_id=product_id, quantity=quantity)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_quantity(db: Session, item: CartItem, quantity: int) -> CartItem:
    item.quantity = quantity
    db.commit()
    db.refresh(item)
    return item


def remove_item(db: Session, item: CartItem) -> None:
    db.delete(item)
    db.commit()


def clear_cart(db: Session, user_id) -> None:
    db.query(CartItem).filter(CartItem.user_id == user_id).delete()
    db.commit()


def calculate_total(items: List[CartItem]) -> float:
    total = 0.0
    for item in items:
        price = float(item.product.sale_price or item.product.price)
        total += price * item.quantity
    return round(total, 2)
