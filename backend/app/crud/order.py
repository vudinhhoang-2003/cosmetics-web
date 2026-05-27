from sqlalchemy.orm import Session
from app.models.order import Order, OrderItem
from app.models.cart import CartItem
from app.schemas.order import OrderCreate
from typing import List, Optional
import uuid


def create_from_cart(db: Session, user_id, data: OrderCreate) -> Order:
    cart_items = db.query(CartItem).filter(CartItem.user_id == user_id).all()
    if not cart_items:
        return None

    total = 0.0
    for item in cart_items:
        price = float(item.product.sale_price or item.product.price)
        total += price * item.quantity

    order = Order(
        user_id=user_id,
        total_price=total,
        shipping_address=data.shipping_address,
        payment_method=data.payment_method,
    )
    db.add(order)
    db.flush()

    for ci in cart_items:
        price = float(ci.product.sale_price or ci.product.price)
        oi = OrderItem(
            order_id=order.id,
            product_id=ci.product_id,
            quantity=ci.quantity,
            price_at_purchase=price,
        )
        db.add(oi)
        # Decrease stock
        ci.product.stock = max(0, ci.product.stock - ci.quantity)

    db.query(CartItem).filter(CartItem.user_id == user_id).delete()
    db.commit()
    db.refresh(order)
    return order


def get_user_orders(db: Session, user_id, skip: int = 0, limit: int = 20) -> List[Order]:
    return db.query(Order).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).offset(skip).limit(limit).all()


def get_by_id(db: Session, order_id, user_id=None) -> Optional[Order]:
    q = db.query(Order).filter(Order.id == order_id)
    if user_id:
        q = q.filter(Order.user_id == user_id)
    return q.first()


def update_status(db: Session, order: Order, status: str) -> Order:
    order.status = status
    db.commit()
    db.refresh(order)
    return order


def get_all(db: Session, skip: int = 0, limit: int = 50, status: Optional[str] = None) -> List[Order]:
    q = db.query(Order)
    if status:
        q = q.filter(Order.status == status)
    return q.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
