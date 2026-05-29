from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
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
    """
    API tạo đơn đặt hàng mới từ giỏ hàng.
    - Gọi crud_order.create_from_cart để trích xuất các sản phẩm được chọn, trừ số lượng tồn kho (stock) và tính tổng tiền.
    - Nếu phương thức thanh toán là 'online', hệ thống sẽ giao tiếp với PayOS để tạo link thanh toán (checkoutUrl) kèm URL callback khi thành công/hủy thanh toán.
    """
    try:
        order = crud_order.create_from_cart(db, current_user.id, data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    if not order:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    out = OrderOut.model_validate(order)
    
    # Tích hợp cổng thanh toán trực tuyến PayOS nếu phương thức thanh toán là online
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
    """API lấy lịch sử toàn bộ đơn hàng của người dùng hiện tại (phân trang)."""
    return crud_order.get_user_orders(db, current_user.id, skip, limit)


@router.get("/{order_id}", response_model=OrderOut)
def get_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """API xem chi tiết một đơn hàng của người dùng hiện tại."""
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
    """
    API cập nhật trạng thái đơn hàng (chờ xác nhận, đã duyệt, đang giao, đã giao, đã hủy).
    - Yêu cầu quyền quản trị viên (Admin).
    - Không được phép chuyển trạng thái của một đơn hàng đã hủy.
    """
    order = crud_order.get_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.status == "cancelled" and data.status != "cancelled":
        raise HTTPException(status_code=400, detail="Cannot change status of a cancelled order")
        
    valid_statuses = ["pending", "confirmed", "shipping", "delivered", "cancelled"]
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Use: {valid_statuses}")
    return crud_order.update_status(db, order, data.status)


@router.post("/cancel-payment")
def cancel_payment(
    order_id: Optional[str] = None,
    order_code: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    API hủy bỏ thanh toán online (gọi khi khách hàng ấn Hủy trên giao diện PayOS hoặc trang chờ thanh toán).
    - Tìm đơn hàng theo ID hoặc theo mã order_code.
    - Xóa đơn hàng chưa thanh toán này và tự động hoàn trả số lượng hàng tồn kho (stock) của các sản phẩm tương ứng.
    """
    if not order_id and not order_code:
        raise HTTPException(status_code=400, detail="Either order_id or order_code must be provided")
    
    if order_id:
        order = crud_order.get_by_id(db, order_id, current_user.id)
    else:
        # Tìm đơn hàng qua mã order_code và ID người dùng
        from app.models.order import Order
        order = db.query(Order).filter(Order.order_code == order_code, Order.user_id == current_user.id).first()
        
    if not order:
        return {"status": "ok", "message": "Order not found or already deleted"}
        
    if order.status not in ["pending"]:
        raise HTTPException(status_code=400, detail="Only pending orders can be deleted")
        
    crud_order.delete(db, order)
    return {"status": "ok", "message": "Order deleted and stock restored"}


@router.post("/{order_id}/cancel", response_model=OrderOut)
def cancel_order(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    API khách hàng tự yêu cầu hủy đơn hàng.
    - Chỉ cho phép hủy khi trạng thái đơn hàng vẫn là chờ duyệt (pending).
    - Tự động hoàn lại hàng tồn kho (thực hiện bên trong crud_order.update_status).
    """
    order = crud_order.get_by_id(db, order_id, current_user.id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status not in ["pending"]:
        raise HTTPException(status_code=400, detail="Only pending orders can be cancelled")
    return crud_order.update_status(db, order, "cancelled")

