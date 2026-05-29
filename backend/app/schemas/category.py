from pydantic import BaseModel
from typing import Optional
from uuid import UUID


class CategoryCreate(BaseModel):
    """Schema xác thực dữ liệu khi tạo mới hoặc cập nhật danh mục sản phẩm."""
    name: str  # Tên danh mục (ví dụ: "Sữa rửa mặt")
    slug: str  # Đường dẫn URL thân thiện của danh mục
    image_url: Optional[str] = None  # URL hình ảnh đại diện danh mục (không bắt buộc)


class CategoryOut(BaseModel):
    """Schema định dạng dữ liệu danh mục trả về cho Client."""
    id: UUID
    name: str
    slug: str
    image_url: Optional[str]

    # Cấu hình Pydantic để tương thích với cơ chế ORM SQLAlchemy
    model_config = {"from_attributes": True}

