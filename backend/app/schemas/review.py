from pydantic import BaseModel, field_validator
from typing import Optional
from uuid import UUID
from datetime import datetime


class ReviewCreate(BaseModel):
    """Schema xác thực dữ liệu khi người dùng gửi đánh giá sản phẩm."""
    rating: int  # Điểm đánh giá (số sao)
    comment: Optional[str] = None  # Nội dung bình luận chi tiết

    @field_validator("rating")
    @classmethod
    def rating_range(cls, v: int) -> int:
        """Đảm bảo số sao đánh giá hợp lệ nằm trong khoảng từ 1 đến 5 sao."""
        if not 1 <= v <= 5:
            raise ValueError("Rating must be between 1 and 5")
        return v


class ReviewOut(BaseModel):
    """Schema định dạng dữ liệu đánh giá trả về cho Frontend hiển thị."""
    id: UUID
    user_id: UUID
    product_id: UUID
    rating: int
    comment: Optional[str]
    created_at: datetime
    user_name: Optional[str] = None  # Họ tên người đánh giá (được map thủ công từ User Model)

    model_config = {"from_attributes": True}

