import hmac
import hashlib
import httpx
from typing import Optional, Dict, Any
from app.core.config import settings

class PayOSClient:
    def __init__(self):
        self.client_id = settings.PAYOS_CLIENT_ID
        self.api_key = settings.PAYOS_API_KEY
        self.checksum_key = settings.PAYOS_CHECKSUM_KEY
        self.is_configured = bool(self.client_id and self.api_key and self.checksum_key)
        self.base_url = "https://api-merchant.payos.vn"

    def sign_data(self, data: Dict[str, Any]) -> str:
        # Sort keys alphabetically and stringify
        sorted_keys = sorted(data.keys())
        elements = []
        for k in sorted_keys:
            v = data[k]
            if v is None or v == "":
                continue
            elements.append(f"{k}={v}")
        sign_str = "&".join(elements)
        
        # Calculate HMAC-SHA256 signature
        return hmac.new(
            self.checksum_key.encode("utf-8"),
            sign_str.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

    async def create_payment_link(self, order_code: int, amount: int, description: str, return_url: str, cancel_url: str) -> Optional[str]:
        if not self.is_configured:
            # Fallback to premium simulation mock checkout url!
            return f"{settings.FRONTEND_URL}/checkout/mock-payment?orderCode={order_code}&amount={amount}"

        payload = {
            "orderCode": order_code,
            "amount": amount,
            "description": description[:30],  # PayOS description is max 30 chars
            "cancelUrl": cancel_url,
            "returnUrl": return_url,
        }
        
        # Generate the signature
        payload["signature"] = self.sign_data(payload)

        headers = {
            "x-client-id": self.client_id,
            "x-api-key": self.api_key,
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient() as client:
            try:
                resp = await client.post(f"{self.base_url}/v2/payment-requests", json=payload, headers=headers)
                if resp.status_code == 200:
                    res_data = resp.json()
                    if res_data.get("code") == "00":
                        return res_data["data"]["checkoutUrl"]
            except Exception as e:
                print(f"PayOS create payment link error: {e}")
        return None

    def verify_webhook_data(self, webhook_body: Dict[str, Any]) -> bool:
        if not self.is_configured:
            # Simulation webhook verification!
            return True

        # PayOS webhook body has 'data' and 'signature'
        data = webhook_body.get("data")
        signature = webhook_body.get("signature")
        if not data or not signature:
            return False

        # Sort and sign webhook data to verify authenticity
        signed_signature = self.sign_data(data)
        return hmac.compare_digest(signed_signature, signature)

payos_client = PayOSClient()
