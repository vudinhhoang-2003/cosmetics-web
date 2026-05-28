from sqlalchemy.orm import Session, joinedload
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
        if not item.product or not item.product.is_active:
            raise ValueError("Product not available")
        if item.product.stock < item.quantity:
            raise ValueError("Insufficient stock")
        price = float(item.product.sale_price or item.product.price)
        total += price * item.quantity

    import time
    order_code = int(time.time() * 1000) % 1000000000

    order = Order(
        user_id=user_id,
        total_price=total,
        shipping_address=data.shipping_address,
        payment_method=data.payment_method,
        order_code=order_code,
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
        ci.product.stock -= ci.quantity

    db.query(CartItem).filter(CartItem.user_id == user_id).delete()
    db.commit()
    db.refresh(order)
    return order


def get_user_orders(db: Session, user_id, skip: int = 0, limit: int = 20) -> List[Order]:
    return (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.user_id == user_id)
        .order_by(Order.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_by_id(db: Session, order_id, user_id=None) -> Optional[Order]:
    q = db.query(Order).options(joinedload(Order.items).joinedload(OrderItem.product)).filter(Order.id == order_id)
    if user_id:
        q = q.filter(Order.user_id == user_id)
    return q.first()


def update_status(db: Session, order: Order, status: str) -> Order:
    if status == "cancelled" and order.status != "cancelled":
        for item in order.items:
            if item.product:
                item.product.stock += item.quantity
    order.status = status
    db.commit()
    db.refresh(order)
    return order


def get_all(db: Session, skip: int = 0, limit: int = 50, status: Optional[str] = None, search: Optional[str] = None) -> List[Order]:
    q = db.query(Order).options(joinedload(Order.items).joinedload(OrderItem.product))
    if status:
        q = q.filter(Order.status == status)
    if search:
        search_filter = f"%{search}%"
        from sqlalchemy import cast, String
        q = q.filter(
            cast(Order.order_code, String).ilike(search_filter) |
            cast(Order.id, String).ilike(search_filter) |
            Order.shipping_address['full_name'].astext.ilike(search_filter) |
            Order.shipping_address['phone'].astext.ilike(search_filter)
        )
    return q.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()


def delete(db: Session, order: Order) -> None:
    for item in order.items:
        if item.product:
            item.product.stock += item.quantity
    db.delete(order)
    db.commit()
