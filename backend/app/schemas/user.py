from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime


class UserCreate(BaseModel):
    """Schema xác thực thông tin đăng ký người dùng mới."""
    email: EmailStr  # Phải là định dạng Email hợp lệ
    password: str
    full_name: Optional[str] = None
    phone: Optional[str] = None


class UserUpdate(BaseModel):
    """Schema cập nhật thông tin cá nhân (các trường đều tùy chọn)."""
    full_name: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None


class UserOut(BaseModel):
    """Schema định dạng thông tin người dùng gửi về Client (không chứa mật khẩu hash)."""
    id: UUID
    email: str
    full_name: Optional[str]
    phone: Optional[str]
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserLogin(BaseModel):
    """Schema xác thực thông tin yêu cầu đăng nhập."""
    email: EmailStr
    password: str


class Token(BaseModel):
    """Schema chứa cặp Access Token, Refresh Token kèm theo thông tin tài khoản vừa đăng nhập thành công."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut

