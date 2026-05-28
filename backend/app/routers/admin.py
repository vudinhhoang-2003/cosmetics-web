from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, time
from app.core.database import get_db
from app.core.deps import require_admin
from app.models.user import User
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.schemas.user import UserOut
from app.schemas.order import OrderOut
from app.schemas.product import ProductList
from app.crud import user as crud_user
from app.crud import order as crud_order
from app.crud import product as crud_product

router = APIRouter(tags=["admin"])


@router.get("/stats")
def get_stats(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    now = datetime.utcnow()
    today_start = datetime.combine(now.date(), time.min)
    today_end = datetime.combine(now.date(), time.max)
    month_start = datetime(now.year, now.month, 1)
    revenue_statuses = ["delivered"]
    active_order_statuses = ["confirmed", "shipping"]
    fulfilled_statuses = revenue_statuses + active_order_statuses

    total_revenue = db.query(func.sum(Order.total_price)).filter(
        Order.status.in_(revenue_statuses)
    ).scalar() or 0

    in_progress_revenue = db.query(func.sum(Order.total_price)).filter(
        Order.status.in_(active_order_statuses)
    ).scalar() or 0

    today_revenue = db.query(func.sum(Order.total_price)).filter(
        Order.status.in_(revenue_statuses),
        Order.created_at >= today_start,
        Order.created_at <= today_end,
    ).scalar() or 0

    month_revenue = db.query(func.sum(Order.total_price)).filter(
        Order.status.in_(revenue_statuses),
        Order.created_at >= month_start,
    ).scalar() or 0

    total_orders = db.query(func.count(Order.id)).scalar()
    total_products = db.query(func.count(Product.id)).filter(Product.is_active == True).scalar()
    total_users = db.query(func.count(User.id)).filter(User.role == "customer").scalar()

    pending_orders = db.query(func.count(Order.id)).filter(Order.status == "pending").scalar()
    confirmed_orders = db.query(func.count(Order.id)).filter(Order.status == "confirmed").scalar()
    shipping_orders = db.query(func.count(Order.id)).filter(Order.status == "shipping").scalar()
    delivered_orders = db.query(func.count(Order.id)).filter(Order.status == "delivered").scalar()
    cancelled_orders = db.query(func.count(Order.id)).filter(Order.status == "cancelled").scalar()
    today_orders = db.query(func.count(Order.id)).filter(
        Order.created_at >= today_start,
        Order.created_at <= today_end,
    ).scalar()
    low_stock_products = db.query(func.count(Product.id)).filter(
        Product.is_active == True,
        Product.stock <= 10,
    ).scalar()

    top_products = (
        db.query(Product.name, func.sum(OrderItem.quantity).label("total_sold"))
        .join(OrderItem, OrderItem.product_id == Product.id)
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Order.status.in_(fulfilled_statuses))
        .group_by(Product.id)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(5)
        .all()
    )

    low_stock_items = (
        db.query(Product.name, Product.stock)
        .filter(Product.is_active == True, Product.stock <= 10)
        .order_by(Product.stock.asc(), Product.name.asc())
        .limit(5)
        .all()
    )

    return {
        "total_revenue": float(total_revenue),
        "in_progress_revenue": float(in_progress_revenue),
        "today_revenue": float(today_revenue),
        "month_revenue": float(month_revenue),
        "total_orders": total_orders,
        "total_products": total_products,
        "total_users": total_users,
        "pending_orders": pending_orders,
        "confirmed_orders": confirmed_orders,
        "shipping_orders": shipping_orders,
        "delivered_orders": delivered_orders,
        "cancelled_orders": cancelled_orders,
        "today_orders": today_orders,
        "low_stock_products": low_stock_products,
        "top_products": [{"name": p.name, "total_sold": int(p.total_sold)} for p in top_products],
        "low_stock_items": [{"name": p.name, "stock": p.stock} for p in low_stock_items],
    }


@router.get("/products", response_model=ProductList)
def admin_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    sort: Optional[str] = None,
    brand: Optional[str] = None,
    in_stock: Optional[bool] = None,
    sale_only: Optional[bool] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return crud_product.get_multi_admin(
        db,
        skip,
        limit,
        category,
        min_price,
        max_price,
        search,
        sort,
        brand,
        in_stock,
        sale_only,
    )


@router.get("/orders", response_model=List[OrderOut])
def admin_orders(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return crud_order.get_all(db, skip, limit, status)


@router.get("/users", response_model=List[UserOut])
def admin_users(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return crud_user.get_all(db, skip, limit)


@router.put("/users/{user_id}/toggle-active", response_model=UserOut)
def toggle_user(
    user_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    from fastapi import HTTPException
    user = crud_user.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return crud_user.toggle_active(db, user)
