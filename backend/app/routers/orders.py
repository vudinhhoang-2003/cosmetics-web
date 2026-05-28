from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.schemas.order import OrderCreate, OrderOut, OrderStatusUpdate
from app.crud import order as crud_order
from app.models.user import User

router = APIRouter(tags=["orders"])


@router.post("/", response_model=OrderOut, status_code=201)
async def create_order(
    data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        order = crud_order.create_from_cart(db, current_user.id, data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    if not order:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    out = OrderOut.model_validate(order)
    
    if order.payment_method == "online":
        from app.core.payos import payos_client
        from app.core.config import settings
        
        return_url = f"{settings.FRONTEND_URL}/checkout/success?order_id={order.id}"
        cancel_url = f"{settings.FRONTEND_URL}/checkout/cancel?order_id={order.id}"
        
        payment_url = await payos_client.create_payment_link(
            order_code=order.order_code,
            amount=int(float(order.total_price)),
            description=f"Luxe #{order.order_code}",
            return_url=return_url,
            cancel_url=cancel_url
        )
        out.payment_url = payment_url
        
    return out


@router.get("/", response_model=List[OrderOut])
def my_orders(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return crud_order.get_user_orders(db, current_user.id, skip, limit)


@router.get("/{order_id}", response_model=OrderOut)
def get_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = crud_order.get_by_id(db, order_id, current_user.id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.put("/{order_id}/status", response_model=OrderOut)
def update_status(
    order_id: str,
    data: OrderStatusUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    order = crud_order.get_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    valid_statuses = ["pending", "confirmed", "shipping", "delivered", "cancelled"]
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Use: {valid_statuses}")
    return crud_order.update_status(db, order, data.status)
