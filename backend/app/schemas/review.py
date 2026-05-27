from pydantic import BaseModel, field_validator
from typing import Optional
from uuid import UUID
from datetime import datetime


class ReviewCreate(BaseModel):
    rating: int
    comment: Optional[str] = None

    @field_validator("rating")
    @classmethod
    def rating_range(cls, v: int) -> int:
        if not 1 <= v <= 5:
            raise ValueError("Rating must be between 1 and 5")
        return v


class ReviewOut(BaseModel):
    id: UUID
    user_id: UUID
    product_id: UUID
    rating: int
    comment: Optional[str]
    created_at: datetime
    user_name: Optional[str] = None

    model_config = {"from_attributes": True}
