from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from app.schemas.product import ProductOut


class CartItemCreate(BaseModel):
    product_id: UUID
    quantity: int = Field(default=1, ge=1)


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=0)


class CartItemOut(BaseModel):
    id: UUID
    product_id: UUID
    quantity: int
    product: Optional[ProductOut]

    model_config = {"from_attributes": True}


class CartOut(BaseModel):
    items: List[CartItemOut]
    total: float
