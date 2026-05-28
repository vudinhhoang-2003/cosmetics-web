from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.models.product import Product
from app.models.review import Review
from app.schemas.product import ProductCreate, ProductUpdate, ProductList, ProductOut
from typing import Optional, List
import uuid


def get_multi(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    sort: Optional[str] = None,
    brand: Optional[str] = None,
    in_stock: Optional[bool] = None,
    sale_only: Optional[bool] = None,
) -> ProductList:
    q = db.query(Product).filter(Product.is_active == True)

    if category:
        from app.models.category import Category
        q = q.join(Category).filter(Category.slug == category)
    if min_price is not None:
        q = q.filter(Product.price >= min_price)
    if max_price is not None:
        q = q.filter(Product.price <= max_price)
    if search:
        q = q.filter(or_(
            Product.name.ilike(f"%{search}%"),
            Product.brand.ilike(f"%{search}%"),
            Product.description.ilike(f"%{search}%"),
        ))
    if brand:
        brands = [b.strip() for b in brand.split(",") if b.strip()]
        if brands:
            q = q.filter(Product.brand.in_(brands))
    if in_stock:
        q = q.filter(Product.stock > 0)
    if sale_only:
        q = q.filter(Product.sale_price.isnot(None))

    if sort == "popular":
        q = (
            q.outerjoin(Review, Review.product_id == Product.id)
            .group_by(Product.id)
            .order_by(func.count(Review.id).desc(), Product.created_at.desc())
        )
    elif sort == "price_asc":
        q = q.order_by(Product.price.asc())
    elif sort == "price_desc":
        q = q.order_by(Product.price.desc())
    else:
        q = q.order_by(Product.created_at.desc())

    total = q.count()
    products = q.offset(skip).limit(limit).all()

    items = []
    for p in products:
        avg = db.query(func.avg(Review.rating)).filter(Review.product_id == p.id).scalar()
        count = db.query(func.count(Review.id)).filter(Review.product_id == p.id).scalar()
        item = ProductOut.model_validate(p)
        item.avg_rating = round(float(avg), 1) if avg else None
        item.review_count = count or 0
        items.append(item)

    return ProductList(items=items, total=total, skip=skip, limit=limit)


def get_multi_admin(
    db: Session,
    skip: int = 0,
    limit: int = 20,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    sort: Optional[str] = None,
    brand: Optional[str] = None,
    in_stock: Optional[bool] = None,
    sale_only: Optional[bool] = None,
) -> ProductList:
    q = db.query(Product)

    if category:
        from app.models.category import Category
        q = q.join(Category).filter(Category.slug == category)
    if min_price is not None:
        q = q.filter(Product.price >= min_price)
    if max_price is not None:
        q = q.filter(Product.price <= max_price)
    if search:
        q = q.filter(or_(
            Product.name.ilike(f"%{search}%"),
            Product.brand.ilike(f"%{search}%"),
            Product.description.ilike(f"%{search}%"),
        ))
    if brand:
        brands = [b.strip() for b in brand.split(",") if b.strip()]
        if brands:
            q = q.filter(Product.brand.in_(brands))
    if in_stock:
        q = q.filter(Product.stock > 0)
    if sale_only:
        q = q.filter(Product.sale_price.isnot(None))

    if sort == "popular":
        q = (
            q.outerjoin(Review, Review.product_id == Product.id)
            .group_by(Product.id)
            .order_by(func.count(Review.id).desc(), Product.created_at.desc())
        )
    elif sort == "price_asc":
        q = q.order_by(Product.price.asc())
    elif sort == "price_desc":
        q = q.order_by(Product.price.desc())
    else:
        q = q.order_by(Product.created_at.desc())

    total = q.count()
    products = q.offset(skip).limit(limit).all()

    items = []
    for p in products:
        avg = db.query(func.avg(Review.rating)).filter(Review.product_id == p.id).scalar()
        count = db.query(func.count(Review.id)).filter(Review.product_id == p.id).scalar()
        item = ProductOut.model_validate(p)
        item.avg_rating = round(float(avg), 1) if avg else None
        item.review_count = count or 0
        items.append(item)

    return ProductList(items=items, total=total, skip=skip, limit=limit)


def get_by_slug(db: Session, slug: str) -> Optional[Product]:
    return db.query(Product).filter(Product.slug == slug, Product.is_active == True).first()


def get_by_id(db: Session, product_id) -> Optional[Product]:
    return db.query(Product).filter(Product.id == product_id).first()


def create(db: Session, data: ProductCreate) -> Product:
    product = Product(**data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update(db: Session, product: Product, data: ProductUpdate) -> Product:
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(product, k, v)
    db.commit()
    db.refresh(product)
    return product


def delete(db: Session, product: Product) -> None:
    product.is_active = False
    db.commit()


def get_all_admin(db: Session, skip: int = 0, limit: int = 50) -> List[Product]:
    return db.query(Product).order_by(Product.created_at.desc()).offset(skip).limit(limit).all()
