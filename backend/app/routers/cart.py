from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.schemas.cart import CartItemCreate, CartItemUpdate, CartItemOut, CartOut
from app.crud import cart as crud_cart
from app.crud import product as crud_product
from app.models.user import User

router = APIRouter(tags=["cart"])


@router.get("/", response_model=CartOut)
def get_cart(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    items = crud_cart.get_user_cart(db, current_user.id)
    total = crud_cart.calculate_total(items)
    return CartOut(items=[CartItemOut.model_validate(i) for i in items], total=total)


@router.post("/", response_model=CartItemOut, status_code=201)
def add_to_cart(
    data: CartItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    p = crud_product.get_by_id(db, data.product_id)
    if not p or not p.is_active:
        raise HTTPException(status_code=404, detail="Product not found")
    if p.stock < data.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    item = crud_cart.add_item(db, current_user.id, data.product_id, data.quantity)
    return CartItemOut.model_validate(item)


@router.put("/{item_id}", response_model=CartItemOut)
def update_cart_item(
    item_id: str,
    data: CartItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = crud_cart.get_item(db, item_id, current_user.id)
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    if data.quantity <= 0:
        crud_cart.remove_item(db, item)
        return {"message": "Item removed"}
    return CartItemOut.model_validate(crud_cart.update_quantity(db, item, data.quantity))


@router.delete("/{item_id}", status_code=204)
def remove_from_cart(
    item_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = crud_cart.get_item(db, item_id, current_user.id)
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    crud_cart.remove_item(db, item)
