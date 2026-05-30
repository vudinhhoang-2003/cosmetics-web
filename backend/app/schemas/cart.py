from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from app.schemas.product import ProductOut


class CartItemCreate(BaseModel):
    """Schema đầu vào khi người dùng yêu cầu thêm sản phẩm vào giỏ hàng."""
    product_id: UUID  # ID của sản phẩm
    quantity: int = Field(default=1, ge=1)  # Số lượng thêm vào giỏ, mặc định là 1 và phải lớn hơn hoặc bằng 1


class CartItemUpdate(BaseModel):
    """Schema đầu vào khi người dùng thay đổi số lượng sản phẩm trong giỏ hàng."""
    quantity: int = Field(..., ge=0)  # Số lượng mới phải lớn hơn hoặc bằng 0 (nếu bằng 0 sẽ tự động xóa khỏi giỏ)


class CartItemOut(BaseModel):
    """Schema đầu ra trả về thông tin chi tiết của một mục trong giỏ hàng."""
    id: UUID
    product_id: UUID
    quantity: int
    product: Optional[ProductOut]  # Chứa chi tiết sản phẩm đi kèm (tên, giá, ảnh,...)

    # Bật cấu hình from_attributes để Pydantic tự động ánh xạ dữ liệu từ SQLAlchemy Model sang Schema
    model_config = {"from_attributes": True}


class CartOut(BaseModel):
    """Schema đầu ra trả về toàn bộ giỏ hàng và tổng số tiền thanh toán."""
    items: List[CartItemOut]
    total: float

