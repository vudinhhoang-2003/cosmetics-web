from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from datetime import datetime
from app.schemas.category import CategoryOut


class ProductCreate(BaseModel):
    """Schema xác thực dữ liệu đầu vào khi thêm mới sản phẩm."""
    name: str  # Tên sản phẩm
    slug: str  # Đường dẫn SEO duy nhất
    description: Optional[str] = None  # Mô tả chi tiết (không bắt buộc)
    price: Decimal = Field(..., ge=0)  # Giá gốc, phải lớn hơn hoặc bằng 0
    sale_price: Optional[Decimal] = Field(default=None, ge=0)  # Giá khuyến mãi (nếu có), phải >= 0
    stock: int = Field(default=0, ge=0)  # Số lượng tồn kho, mặc định là 0 và không được âm
    images: List[str] = []  # Danh sách URL ảnh sản phẩm
    category_id: Optional[UUID] = None  # ID của danh mục sản phẩm liên kết
    brand: Optional[str] = None  # Tên hãng/thương hiệu sản phẩm
    is_active: bool = True  # Trạng thái kích hoạt bán hàng


class ProductUpdate(BaseModel):
    """Schema xác thực dữ liệu khi cập nhật thông tin sản phẩm (các trường đều là tùy chọn)."""
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = Field(default=None, ge=0)
    sale_price: Optional[Decimal] = Field(default=None, ge=0)
    stock: Optional[int] = Field(default=None, ge=0)
    images: Optional[List[str]] = None
    category_id: Optional[UUID] = None
    brand: Optional[str] = None
    is_active: Optional[bool] = None


class ProductOut(BaseModel):
    """Schema định dạng dữ liệu chi tiết sản phẩm trả về cho Frontend (bao gồm các thuộc tính tổng hợp như avg_rating và review_count)."""
    id: UUID
    name: str
    slug: str
    description: Optional[str]
    price: Decimal
    sale_price: Optional[Decimal]
    stock: int
    images: List[str]
    category_id: Optional[UUID]
    category: Optional[CategoryOut]  # Danh mục sản phẩm đầy đủ thông tin kèm theo
    brand: Optional[str]
    is_active: bool
    created_at: datetime
    avg_rating: Optional[float] = None  # Điểm đánh giá trung bình từ reviews
    review_count: Optional[int] = 0  # Số lượng lượt review của sản phẩm

    model_config = {"from_attributes": True}


class ProductList(BaseModel):
    """Schema bọc danh sách sản phẩm cùng các thông tin phân trang (total, skip, limit) để hiển thị lưới sản phẩm ngoài Frontend."""
    items: List[ProductOut]
    total: int
    skip: int
    limit: int

