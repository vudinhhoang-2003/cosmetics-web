from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.schemas.user import UserOut, UserUpdate
from app.crud import user as crud_user
from app.core.security import verify_password, hash_password
from app.models.user import User
from pydantic import BaseModel

router = APIRouter(tags=["users"])


class PasswordChange(BaseModel):
    """Schema chứa dữ liệu yêu cầu đổi mật khẩu."""
    current_password: str  # Mật khẩu hiện tại
    new_password: str      # Mật khẩu mới mong muốn


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """API lấy thông tin cá nhân của người dùng hiện tại (yêu cầu gửi JWT token ở Authorization header)."""
    return current_user


@router.put("/me", response_model=UserOut)
def update_me(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """API cập nhật thông tin cá nhân (họ tên, số điện thoại) của người dùng hiện tại."""
    return crud_user.update(db, current_user, data)


@router.put("/me/password", response_model=UserOut)
def change_password(
    data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    API đổi mật khẩu tài khoản người dùng hiện tại.
    - Kiểm tra mật khẩu hiện tại có chính xác không.
    - Mã hóa mật khẩu mới và lưu vào cơ sở dữ liệu.
    """
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.password_hash = hash_password(data.new_password)
    db.commit()
    db.refresh(current_user)
    return current_user

