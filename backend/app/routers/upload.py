import os
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.core.deps import require_admin
from app.core.config import settings
from app.models.user import User

router = APIRouter(tags=["upload"])

# Danh sách các định dạng hình ảnh được phép tải lên hệ thống
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    _: User = Depends(require_admin),
):
    """
    API tải lên hình ảnh sản phẩm/danh mục (chỉ dành cho Admin).
    - Kiểm tra loại tệp (content_type) phải thuộc danh sách hình ảnh hợp lệ.
    - Kiểm tra kích thước tệp tối đa (max 5MB).
    - Sinh tên tệp ngẫu nhiên bằng UUID để tránh bị trùng lặp/ghi đè.
    - Lưu hình ảnh vào thư mục cấu hình và trả về đường dẫn tĩnh URL.
    """
    # Kiểm tra định dạng tệp
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP, GIF allowed")

    # Đọc nội dung tệp để kiểm tra dung lượng
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")

    # Lấy phần mở rộng (extension) của file, mặc định là jpg nếu không tìm thấy
    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"

    # Tạo thư mục tải lên nếu chưa tồn tại
    upload_dir = settings.UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)
    filepath = os.path.join(upload_dir, filename)

    # Ghi file vào ổ đĩa
    with open(filepath, "wb") as f:
        f.write(content)

    # Trả về URL đường dẫn tương đối phục vụ hiển thị trên Frontend
    return {"url": f"/uploads/{filename}", "filename": filename}

