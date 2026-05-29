from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import hash_password, verify_password
from typing import Optional


def get_by_email(db: Session, email: str) -> Optional[User]:
    """Tìm kiếm người dùng bằng địa chỉ Email (phục vụ đăng ký/đăng nhập)."""
    return db.query(User).filter(User.email == email).first()


def get_by_id(db: Session, user_id) -> Optional[User]:
    """Tìm kiếm người dùng bằng ID duy nhất."""
    return db.query(User).filter(User.id == user_id).first()


def get_all(db: Session, skip: int = 0, limit: int = 50):
    """Lấy danh sách người dùng cho trang quản trị Admin, có phân trang."""
    return db.query(User).offset(skip).limit(limit).all()


def create(db: Session, data: UserCreate) -> User:
    """
    Đăng ký tài khoản người dùng mới.
    Mật khẩu đầu vào sẽ tự động được băm bằng thuật toán hash_password (bcrypt) để bảo mật.
    """
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        phone=data.phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update(db: Session, user: User, data: UserUpdate) -> User:
    """
    Cập nhật thông tin cá nhân của người dùng.
    Nếu người dùng đổi mật khẩu mới, mật khẩu mới đó cũng sẽ được băm lại trước khi lưu.
    """
    if data.full_name is not None:
        user.full_name = data.full_name
    if data.phone is not None:
        user.phone = data.phone
    if data.password is not None:
        user.password_hash = hash_password(data.password)
    db.commit()
    db.refresh(user)
    return user


def authenticate(db: Session, email: str, password: str) -> Optional[User]:
    """
    Xác thực thông tin đăng nhập của người dùng.
    Tìm kiếm theo email, sau đó so khớp mật khẩu truyền lên với password_hash được băm lưu trong DB.
    """
    user = get_by_email(db, email)
    if not user or not verify_password(password, user.password_hash):
        return None
    return user


def toggle_active(db: Session, user: User) -> User:
    """Khóa hoặc mở khóa (kích hoạt/hủy kích hoạt) tài khoản người dùng (dành cho Admin)."""
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return user

