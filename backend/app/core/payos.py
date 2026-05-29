import hmac
import hashlib
import httpx
from typing import Optional, Dict, Any
from app.core.config import settings

class PayOSClient:
    """
    PayOSClient cung cấp dịch vụ tương tác với cổng thanh toán PayOS của Việt Nam.
    Tự động chuyển sang chế độ giả lập (Mock Checkout) nếu chưa điền API keys ở file .env.
    """
    def __init__(self):
        self.client_id = settings.PAYOS_CLIENT_ID
        self.api_key = settings.PAYOS_API_KEY
        self.checksum_key = settings.PAYOS_CHECKSUM_KEY
        # Kiểm tra xem hệ thống đã cấu hình đầy đủ API Key hay chưa
        self.is_configured = bool(self.client_id and self.api_key and self.checksum_key)
        self.base_url = "https://api-merchant.payos.vn"

    def sign_data(self, data: Dict[str, Any]) -> str:
        """
        Tạo mã chữ ký (HMAC-SHA256 signature) từ dữ liệu gửi đi.
        Sắp xếp các key theo bảng chữ cái alphabet, bỏ qua giá trị rỗng/None,
        nối lại dưới dạng query string "key1=value1&key2=value2" rồi băm SHA256 với checksum_key.
        """
        # Sắp xếp các khóa theo thứ tự bảng chữ cái
        sorted_keys = sorted(data.keys())
        elements = []
        for k in sorted_keys:
            v = data[k]
            if v is None or v == "":
                continue
            elements.append(f"{k}={v}")
        sign_str = "&".join(elements)
        
        # Tính toán chữ ký HMAC-SHA256
        return hmac.new(
            self.checksum_key.encode("utf-8"),
            sign_str.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

    async def create_payment_link(self, order_code: int, amount: int, description: str, return_url: str, cancel_url: str) -> Optional[str]:
        """
        Tạo link thanh toán trực tuyến qua cổng PayOS.
        Nếu chưa cấu hình PayOS Keys, hàm sẽ tự động trả về một Link thanh toán giả lập (Mock Payment) để demo.
        """
        if not self.is_configured:
            # Fallback: Trả về link giả lập thanh toán cao cấp trên Frontend
            return f"{settings.FRONTEND_URL}/checkout/mock-payment?orderCode={order_code}&amount={amount}"

        payload = {
            "orderCode": order_code,
            "amount": amount,
            "description": description[:30],  # Mô tả giao dịch trên PayOS bị giới hạn tối đa 30 ký tự
            "cancelUrl": cancel_url,
            "returnUrl": return_url,
        }
        
        # Ký số cho payload trước khi gửi lên API PayOS
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
        """
        Xác thực tính hợp lệ của dữ liệu phản hồi (Webhook) từ cổng PayOS gửi về server của mình.
        Đảm bảo request thực sự đến từ PayOS chứ không phải hacker giả mạo.
        """
        if not self.is_configured:
            # Chế độ giả lập: Tự động cho qua
            return True

        # Trích xuất dữ liệu 'data' và chữ ký 'signature' từ webhook payload
        data = webhook_body.get("data")
        signature = webhook_body.get("signature")
        if not data or not signature:
            return False

        # So sánh chữ ký tự tạo từ data và chữ ký PayOS đính kèm trong webhook
        signed_signature = self.sign_data(data)
        return hmac.compare_digest(signed_signature, signature)

# Instance payos_client dùng chung toàn hệ thống
payos_client = PayOSClient()

