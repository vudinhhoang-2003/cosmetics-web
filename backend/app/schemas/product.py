from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from datetime import datetime
from app.schemas.category import CategoryOut


class ProductCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    price: Decimal
    sale_price: Optional[Decimal] = None
    stock: int = 0
    images: List[str] = []
    category_id: Optional[UUID] = None
    brand: Optional[str] = None
    is_active: bool = True


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    sale_price: Optional[Decimal] = None
    stock: Optional[int] = None
    images: Optional[List[str]] = None
    category_id: Optional[UUID] = None
    brand: Optional[str] = None
    is_active: Optional[bool] = None


class ProductOut(BaseModel):
    id: UUID
    name: str
    slug: str
    description: Optional[str]
    price: Decimal
    sale_price: Optional[Decimal]
    stock: int
    images: List[str]
    category_id: Optional[UUID]
    category: Optional[CategoryOut]
    brand: Optional[str]
    is_active: bool
    created_at: datetime
    avg_rating: Optional[float] = None
    review_count: Optional[int] = 0

    model_config = {"from_attributes": True}


class ProductList(BaseModel):
    items: List[ProductOut]
    total: int
    skip: int
    limit: int
