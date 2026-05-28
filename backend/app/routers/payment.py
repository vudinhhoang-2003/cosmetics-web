from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.payos import payos_client
from app.models.order import Order
import logging

router = APIRouter(tags=["payment"])

@router.post("/webhook")
async def payos_webhook(request: Request, db: Session = Depends(get_db)):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    # Verify webhook data authenticity
    if not payos_client.verify_webhook_data(body):
        raise HTTPException(status_code=400, detail="Invalid signature")

    data = body.get("data")
    if not data:
        return {"status": "ok", "message": "No data in body"}

    order_code = data.get("orderCode")
    if order_code:
        # Find order by order_code
        order = db.query(Order).filter(Order.order_code == order_code).first()
        if order:
            order.status = "confirmed"
            db.commit()
            logging.info(f"Order #{order_code} status updated to confirmed via PayOS Webhook.")
            return {"status": "ok", "message": f"Order #{order_code} confirmed"}

    return {"status": "ok", "message": "Webhook processed"}

@router.post("/simulate-success")
def simulate_success(order_code: int, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.order_code == order_code).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = "confirmed"
    db.commit()
    return {"status": "ok", "message": f"Order #{order_code} successfully simulated as confirmed"}
