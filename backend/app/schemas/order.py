from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from uuid import UUID
from decimal import Decimal
from datetime import datetime


class OrderItemOut(BaseModel):
    id: UUID
    product_id: UUID
    quantity: int
    price_at_purchase: Decimal
    product_name: Optional[str] = None

    model_config = {"from_attributes": True}


class OrderCreate(BaseModel):
    shipping_address: Dict[str, Any]
    payment_method: str = "cod"


class OrderStatusUpdate(BaseModel):
    status: str


class OrderOut(BaseModel):
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
