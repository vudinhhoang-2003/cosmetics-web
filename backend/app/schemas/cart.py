from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from app.schemas.product import ProductOut


class CartItemCreate(BaseModel):
    product_id: UUID
    quantity: int = 1


class CartItemUpdate(BaseModel):
    quantity: int


class CartItemOut(BaseModel):
    id: UUID
    product_id: UUID
    quantity: int
    product: Optional[ProductOut]

    model_config = {"from_attributes": True}


class CartOut(BaseModel):
    items: List[CartItemOut]
    total: float
