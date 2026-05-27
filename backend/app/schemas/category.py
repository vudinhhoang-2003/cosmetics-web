from pydantic import BaseModel
from typing import Optional
from uuid import UUID


class CategoryCreate(BaseModel):
    name: str
    slug: str
    image_url: Optional[str] = None


class CategoryOut(BaseModel):
    id: UUID
    name: str
    slug: str
    image_url: Optional[str]

    model_config = {"from_attributes": True}
