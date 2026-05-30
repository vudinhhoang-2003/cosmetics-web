# File: backend/app/schemas/order.py
# Nhiệm vụ: Định nghĩa các Pydantic Schemas để kiểm định dữ liệu (validation) đầu vào và đầu ra cho đơn hàng (Order)

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from uuid import UUID
from decimal import Decimal
from datetime import datetime


class OrderItemOut(BaseModel):
    """Schema đầu ra cho từng mặt hàng trong đơn hàng."""
    id: UUID
    product_id: UUID
    quantity: int
    price_at_purchase: Decimal
    product_name: Optional[str] = None
    image_url: Optional[str] = None

    model_config = {"from_attributes": True}


class OrderCreate(BaseModel):
    """Schema đầu vào khi khách hàng tiến hành tạo đơn hàng mới."""
    shipping_address: Dict[str, Any]  # Địa chỉ giao hàng dạng dict chứa (tên, sđt, địa chỉ cụ thể)
    payment_method: str = "cod"        # Phương thức thanh toán (cod, payos, v.v.)
    cart_item_ids: Optional[List[UUID]] = None  # Danh sách ID các cart items được chọn để thanh toán


class OrderStatusUpdate(BaseModel):
    """Schema cập nhật trạng thái đơn hàng (dành cho Admin)."""
    status: str


class OrderOut(BaseModel):
    """Schema đầu ra chi tiết của đơn hàng."""
    id: UUID
    user_id: UUID
    status: str
    total_price: Decimal
    shipping_address: Optional[Dict[str, Any]]
    payment_method: Optional[str]
    order_code: Optional[int] = None
    payment_url: Optional[str] = None
    created_at: datetime
    items: List[OrderItemOut] = []

    model_config = {"from_attributes": True}

