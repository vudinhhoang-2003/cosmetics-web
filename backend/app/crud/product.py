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
    """
    Truy vấn danh sách sản phẩm hiển thị ngoài trang chủ / trang cửa hàng của khách hàng.
    Chỉ lấy các sản phẩm đang hoạt động (is_active == True).
    Hỗ trợ đầy đủ bộ lọc:
    - category: Lọc theo đường dẫn danh mục (slug).
    - min_price, max_price: Lọc theo khoảng giá.
    - search: Tìm kiếm gần đúng theo tên, thương hiệu, mô tả.
    - brand: Lọc theo danh sách thương hiệu (ngăn cách bởi dấu phẩy).
    - in_stock: Chỉ lấy sản phẩm còn hàng (stock > 0).
    - sale_only: Chỉ lấy sản phẩm đang giảm giá (có sale_price).
    Hỗ trợ sắp xếp (sort): popular (được đánh giá nhiều nhất), price_asc/desc (giá tăng/giảm), hoặc mới nhất.
    """
    q = db.query(Product).filter(Product.is_active == True)

    # Lọc danh mục sản phẩm qua slug
    if category:
        from app.models.category import Category
        q = q.join(Category).filter(Category.slug == category)
    # Lọc theo khoảng giá tối thiểu
    if min_price is not None:
        q = q.filter(Product.price >= min_price)
    # Lọc theo khoảng giá tối đa
    if max_price is not None:
        q = q.filter(Product.price <= max_price)
    # Tìm kiếm theo từ khóa (không phân biệt hoa thường)
    if search:
        q = q.filter(or_(
            Product.name.ilike(f"%{search}%"),
            Product.brand.ilike(f"%{search}%"),
            Product.description.ilike(f"%{search}%"),
        ))
    # Lọc theo hãng
    if brand:
        brands = [b.strip() for b in brand.split(",") if b.strip()]
        if brands:
            q = q.filter(Product.brand.in_(brands))
    # Chỉ lấy hàng có sẵn trong kho
    if in_stock:
        q = q.filter(Product.stock > 0)
    # Chỉ lấy các sản phẩm đang giảm giá
    if sale_only:
        q = q.filter(Product.sale_price.isnot(None))

    # Xử lý sắp xếp kết quả
    if sort == "popular":
        # Sắp xếp theo số lượng đánh giá giảm dần
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

    # Tính toán thêm đánh giá trung bình và số lượt đánh giá cho từng sản phẩm trả về
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
    """
    Tương tự như get_multi nhưng dùng cho trang quản trị Admin.
    Bao gồm cả các sản phẩm đã ẩn (is_active == False) để Admin quản lý và khôi phục khi cần.
    """
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
    """Tìm một sản phẩm đang hoạt động bằng slug phục vụ cho trang chi tiết sản phẩm."""
    return db.query(Product).filter(Product.slug == slug, Product.is_active == True).first()


def get_by_id(db: Session, product_id) -> Optional[Product]:
    """Tìm sản phẩm bằng ID duy nhất (bao gồm cả sản phẩm bị ẩn)."""
    return db.query(Product).filter(Product.id == product_id).first()


def create(db: Session, data: ProductCreate) -> Product:
    """Tạo mới một sản phẩm từ dữ liệu đầu vào đã xác thực."""
    product = Product(**data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update(db: Session, product: Product, data: ProductUpdate) -> Product:
    """Cập nhật các trường thông tin của sản phẩm (chỉ cập nhật những trường được truyền lên)."""
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(product, k, v)
    db.commit()
    db.refresh(product)
    return product


def delete(db: Session, product: Product) -> None:
    """
    Thực hiện xóa mềm (Soft delete) sản phẩm bằng cách gán is_active = False.
    Điều này giúp giữ vững tính toàn vẹn dữ liệu cho các đơn hàng cũ đã mua sản phẩm này.
    """
    product.is_active = False
    db.commit()


def get_all_admin(db: Session, skip: int = 0, limit: int = 50) -> List[Product]:
    """Lấy danh sách sản phẩm nhanh cho trang quản trị Admin, sắp xếp theo thời gian tạo mới nhất."""
    return db.query(Product).order_by(Product.created_at.desc()).offset(skip).limit(limit).all()

