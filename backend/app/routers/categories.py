from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.deps import require_admin
from app.schemas.category import CategoryCreate, CategoryOut
from app.crud import category as crud_cat
from app.models.user import User

router = APIRouter(tags=["categories"])


@router.get("/", response_model=List[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    """API công khai lấy danh sách tất cả danh mục sản phẩm."""
    return crud_cat.get_all(db)


@router.post("/", response_model=CategoryOut, status_code=201)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """
    API tạo mới danh mục sản phẩm.
    - Yêu cầu quyền quản trị viên (Admin).
    - Đảm bảo slug của danh mục là độc nhất vô nhị.
    """
    if crud_cat.get_by_slug(db, data.slug):
        raise HTTPException(status_code=400, detail="Slug already exists")
    return crud_cat.create(db, data)


@router.put("/{cat_id}", response_model=CategoryOut)
def update_category(
    cat_id: str,
    data: CategoryCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """
    API cập nhật thông tin danh mục sản phẩm.
    - Yêu cầu quyền Admin.
    """
    cat = crud_cat.get_by_id(db, cat_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return crud_cat.update(db, cat, data.model_dump(exclude_none=True))


@router.delete("/{cat_id}", status_code=204)
def delete_category(
    cat_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    """
    API xóa bỏ danh mục sản phẩm khỏi hệ thống.
    - Yêu cầu quyền Admin.
    """
    cat = crud_cat.get_by_id(db, cat_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    crud_cat.delete(db, cat)

