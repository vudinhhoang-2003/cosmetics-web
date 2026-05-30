from datetime import datetime, timedelta
from typing import Optional
import bcrypt
from jose import JWTError, jwt
from app.core.config import settings

ALGORITHM = "HS256"


# Mã hóa mật khẩu thành dạng băm Bcrypt (sử dụng khi đăng ký / tạo người dùng mới)
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


# Xác minh mật khẩu nhập vào có trùng khớp với mật khẩu băm trong database hay không (sử dụng khi đăng nhập)
def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


# Tạo Token truy cập (Access Token) thời hạn ngắn (ví dụ: 60 phút) để xác thực người dùng trong mỗi request
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)


# Tạo Token làm mới (Refresh Token) thời hạn dài (ví dụ: 7 ngày) dùng để cấp lại Access Token mới khi hết hạn
def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)


# Giải mã JWT Token để lấy thông tin bên trong payload (sub, exp, type)
def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
