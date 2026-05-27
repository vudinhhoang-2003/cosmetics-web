from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.core.database import get_db
from app.core.deps import require_admin
from app.models.user import User
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.schemas.user import UserOut
from app.schemas.order import OrderOut
from app.crud import user as crud_user
from app.crud import order as crud_order

router = APIRouter(tags=["admin"])


@router.get("/stats")
def get_stats(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    total_revenue = db.query(func.sum(Order.total_price)).filter(
        Order.status.in_(["delivered", "confirmed", "shipping"])
    ).scalar() or 0

    total_orders = db.query(func.count(Order.id)).scalar()
    total_products = db.query(func.count(Product.id)).filter(Product.is_active == True).scalar()
    total_users = db.query(func.count(User.id)).filter(User.role == "customer").scalar()

    pending_orders = db.query(func.count(Order.id)).filter(Order.status == "pending").scalar()

    top_products = (
        db.query(Product.name, func.sum(OrderItem.quantity).label("total_sold"))
        .join(OrderItem, OrderItem.product_id == Product.id)
        .group_by(Product.id)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(5)
        .all()
    )

    return {
        "total_revenue": float(total_revenue),
        "total_orders": total_orders,
        "total_products": total_products,
        "total_users": total_users,
        "pending_orders": pending_orders,
        "top_products": [{"name": p.name, "total_sold": int(p.total_sold)} for p in top_products],
    }


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
