from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.schemas.user import UserCreate, UserLogin, Token, UserOut
from app.crud import user as crud_user

router = APIRouter(tags=["auth"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(data: UserCreate, db: Session = Depends(get_db)):
    """
    API đăng ký tài khoản khách hàng mới.
    - Kiểm tra xem Email đã tồn tại trong DB chưa.
    - Tạo người dùng mới và băm mật khẩu.
    - Cấp phát cặp đôi JWT Access Token và Refresh Token ngay lập tức.
    """
    if crud_user.get_by_email(db, data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = crud_user.create(db, data)
    access = create_access_token({"sub": str(new_user.id)})
    refresh = create_refresh_token({"sub": str(new_user.id)})
    return Token(access_token=access, refresh_token=refresh, user=UserOut.model_validate(new_user))


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """
    API đăng nhập cho khách hàng và Admin.
    - So khớp email và mật khẩu trong DB.
    - Kiểm tra xem tài khoản có đang hoạt động (active) hay không.
    - Cấp mới Access Token (hiệu lực ngắn) và Refresh Token (hiệu lực dài) để duy trì phiên đăng nhập.
    """
    u = crud_user.authenticate(db, data.email, data.password)
    if not u:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not u.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")
    access = create_access_token({"sub": str(u.id)})
    refresh = create_refresh_token({"sub": str(u.id)})
    return Token(access_token=access, refresh_token=refresh, user=UserOut.model_validate(u))


@router.post("/refresh", response_model=dict)
def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    """
    API làm mới Access Token mà không cần người dùng nhập lại mật khẩu.
    - Xác thực chữ ký và thời hạn của Refresh Token.
    - Trả về Access Token mới nếu Refresh Token hợp lệ.
    """
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = crud_user.get_by_id(db, payload["sub"])
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")
    new_access = create_access_token({"sub": str(user.id)})
    return {"access_token": new_access, "token_type": "bearer"}

