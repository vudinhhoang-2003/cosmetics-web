from sqlalchemy.orm import Session, joinedload
from app.models.order import Order, OrderItem
from app.models.cart import CartItem
from app.schemas.order import OrderCreate
from typing import List, Optional
import uuid


# Tạo đơn hàng mới từ giỏ hàng (Hỗ trợ thanh toán toàn bộ hoặc chọn lọc một số sản phẩm)
def create_from_cart(db: Session, user_id, data: OrderCreate) -> Order:
    # 1. Truy vấn giỏ hàng của user
    query = db.query(CartItem).filter(CartItem.user_id == user_id)
    # Nếu client truyền lên danh sách ID sản phẩm cụ thể (cart_item_ids), chỉ lọc thanh toán những sản phẩm đó
    if data.cart_item_ids:
        query = query.filter(CartItem.id.in_(data.cart_item_ids))
    cart_items = query.all()
    
    if not cart_items:
        return None

    # 2. Tính tổng tiền tạm tính (subtotal) và kiểm tra tồn kho, trạng thái sản phẩm
    subtotal = 0.0
    for item in cart_items:
        if not item.product or not item.product.is_active:
            raise ValueError("Sản phẩm không khả dụng hoặc đã bị ẩn")
        if item.product.stock < item.quantity:
            raise ValueError("Số lượng hàng trong kho không đủ")
        price = float(item.product.sale_price or item.product.price)
        subtotal += price * item.quantity

    # 3. Tính phí vận chuyển (shipping_fee): Đơn hàng dưới 500k phí 30k, từ 500k trở lên được FREE SHIP
    shipping_fee = 0.0 if subtotal >= 500000 else 30000
    total = subtotal + shipping_fee

    # 4. Tạo mã đơn hàng duy nhất (order_code) gồm 9 chữ số ngẫu nhiên dựa trên timestamp
    import time
    order_code = int(time.time() * 1000) % 1000000000

    # 5. Lưu thông tin đơn hàng chính vào database
    order = Order(
        user_id=user_id,
        total_price=total,
        shipping_address=data.shipping_address,
        payment_method=data.payment_method,
        order_code=order_code,
    )
    db.add(order)
    db.flush() # Lấy ID của đơn hàng vừa tạo để liên kết với OrderItem

    # 6. Chuyển các sản phẩm trong giỏ hàng thành chi tiết đơn hàng (OrderItem) và trừ tồn kho
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

    # 7. Xoá các sản phẩm đã thanh toán ra khỏi giỏ hàng của user
    if data.cart_item_ids:
        db.query(CartItem).filter(
            CartItem.user_id == user_id,
            CartItem.id.in_(data.cart_item_ids)
        ).delete(synchronize_session=False)
    else:
        db.query(CartItem).filter(CartItem.user_id == user_id).delete()
        
    db.commit()
    db.refresh(order)
    return order


# Lấy danh sách đơn hàng của một user (được sắp xếp theo thời gian mới nhất lên đầu)
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


# Tìm đơn hàng cụ thể theo ID
def get_by_id(db: Session, order_id, user_id=None) -> Optional[Order]:
    q = db.query(Order).options(joinedload(Order.items).joinedload(OrderItem.product)).filter(Order.id == order_id)
    if user_id:
        q = q.filter(Order.user_id == user_id)
    return q.first()


# Cập nhật trạng thái đơn hàng (Có logic hoàn trả tồn kho nếu đơn hàng bị hủy)
def update_status(db: Session, order: Order, status: str) -> Order:
    # Nếu đơn hàng chuyển sang trạng thái "cancelled" (Đã hủy), tự động cộng trả lại số lượng tồn kho cho sản phẩm
    if status == "cancelled" and order.status != "cancelled":
        for item in order.items:
            if item.product:
                item.product.stock += item.quantity
    order.status = status
    db.commit()
    db.refresh(order)
    return order


# Lấy danh sách tất cả đơn hàng cho trang quản trị Admin (Hỗ trợ lọc theo trạng thái và tìm kiếm nâng cao)
def get_all(db: Session, skip: int = 0, limit: int = 50, status: Optional[str] = None, search: Optional[str] = None) -> List[Order]:
    q = db.query(Order).options(joinedload(Order.items).joinedload(OrderItem.product))
    # Lọc theo trạng thái đơn hàng (pending, confirmed, shipping, delivered, cancelled)
    if status:
        q = q.filter(Order.status == status)
    # Lọc tìm kiếm theo mã đơn (order_code), ID đơn hàng, tên người nhận hoặc số điện thoại người nhận
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


# Xóa hoàn toàn đơn hàng (Sử dụng cho các đơn hàng online chưa thanh toán bị hủy, giúp hoàn kho lập tức)
def delete(db: Session, order: Order) -> None:
    # Hoàn trả lại tồn kho sản phẩm trước khi xóa đơn hàng khỏi database
    for item in order.items:
        if item.product:
            item.product.stock += item.quantity
    db.delete(order)
    db.commit()
