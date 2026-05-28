from fastapi import APIRouter, Depends, Query, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional, List
from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut, ProductList
from app.schemas.review import ReviewCreate, ReviewOut
from app.crud import product as crud_product
from app.crud import review as crud_review
from app.models.user import User

router = APIRouter(tags=["products"])


@router.get("/", response_model=ProductList)
def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    sort: Optional[str] = None,
    brand: Optional[str] = None,
    in_stock: Optional[bool] = None,
    sale_only: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    return crud_product.get_multi(
        db,
        skip,
        limit,
        category,
        min_price,
        max_price,
        search,
        sort,
        brand,
        in_stock,
        sale_only,
    )


@router.get("/{slug}", response_model=ProductOut)
def get_product(slug: str, db: Session = Depends(get_db)):
    p = crud_product.get_by_slug(db, slug)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return p


@router.post("/", response_model=ProductOut, status_code=201)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return crud_product.create(db, product)


@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: str,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    p = crud_product.get_by_id(db, product_id)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return crud_product.update(db, p, data)


@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    p = crud_product.get_by_id(db, product_id)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    crud_product.delete(db, p)


@router.post("/{product_id}/reviews", response_model=ReviewOut, status_code=201)
def create_review(
    product_id: str,
    data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    p = crud_product.get_by_id(db, product_id)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    existing = crud_review.get_user_review(db, current_user.id, product_id)
    if existing:
        raise HTTPException(status_code=400, detail="You already reviewed this product")
    review = crud_review.create(db, current_user.id, product_id, data)
    out = ReviewOut.model_validate(review)
    out.user_name = current_user.full_name
    return out


@router.get("/{product_id}/reviews", response_model=List[ReviewOut])
def get_reviews(product_id: str, db: Session = Depends(get_db)):
    reviews = crud_review.get_product_reviews(db, product_id)
    result = []
    for r in reviews:
        out = ReviewOut.model_validate(r)
        out.user_name = r.user.full_name if r.user else None
        result.append(out)
    return result
