from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Khởi tạo engine kết nối cơ sở dữ liệu với chế độ pool_pre_ping để tự động khôi phục kết nối bị ngắt quãng
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

# Khởi tạo SessionLocal làm lớp tạo các phiên làm việc (Session) với cơ sở dữ liệu
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Lớp cơ sở (Base class) kế thừa cho toàn bộ các DB Model trong ứng dụng
Base = declarative_base()


def get_db():
    """
    Dependency helper cung cấp Database Session cho từng request API.
    Đảm bảo phiên kết nối cơ sở dữ liệu sẽ tự động đóng lại (close) sau khi request hoàn thành.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

