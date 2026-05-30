# ✦ LUXE BEAUTY ✦
### Hệ Thống Web Bán Mỹ Phẩm Cao Cấp Luxury Style

> **FastAPI (Python)** · **React 18 (TypeScript)** · **PostgreSQL** · **Tailwind CSS** · **Docker** · **Nginx**

Luxe Beauty là dự án ứng dụng thương mại điện tử chuyên nghiệp bán mỹ phẩm cao cấp. Dự án được phát triển theo phong cách thiết kế Luxury (Tone màu kem beige, chữ vàng gold ấm áp, hiệu ứng kính mờ glassmorphism và chuyển động mượt mà bằng Framer Motion).

---

## 目录 / Table of Contents
1. [Yêu cầu hệ thống (Prerequisites)](#1-yêu-cầu-hệ-thống-prerequisites)
2. [Cấu hình biến môi trường (.env)](#2-cấu-hình-biến-môi-trường-env)
3. [Khởi chạy nhanh bằng Docker (Khuyên dùng)](#3-khởi-chạy-nhanh-bằng-docker-khuyên-dùng)
4. [Khởi chạy cục bộ (Không dùng Docker)](#4-khởi-chạy-cục-bộ-không-dùng-docker)
5. [Cơ sở dữ liệu & Migration (Alembic)](#5-cơ-sở-dữ-liệu--migration-alembic)
6. [Quản lý Giỏ hàng & Thanh toán (PayOS)](#6-quản-lý-giỏ-hàng--thanh-toán-payos)
7. [Cấu trúc dự án (Architecture)](#7-cấu-trúc-dự-án-architecture)
8. [Tài khoản thử nghiệm mẫu](#8-tài-khoản-thử-nghiệm-mẫu)

---

## 1. Yêu cầu hệ thống (Prerequisites)

Trước khi bắt đầu, hãy cài đặt các công cụ sau trên máy tính của bạn:
- **Git** (để clone dự án)
- **Docker** & **Docker Compose** (nếu chạy bằng container)
- **Node.js** (Phiên bản >= 18, nếu phát triển cục bộ phía Frontend)
- **Python** (Phiên bản >= 3.12, nếu phát triển cục bộ phía Backend)
- **PostgreSQL** (Phiên bản >= 16, nếu chạy database cục bộ)

---

## 2. Cấu hình biến môi trường (.env)

Sao chép file cấu hình mẫu ở thư mục gốc:
```bash
cp .env.example .env
```

Mở file `.env` và cập nhật các thông số quan trọng sau:

```ini
# --- DATABASE CONFIG ---
DB_NAME=luxe_beauty
DB_USER=luxe_user
DB_PASS=luxe_password_2026

# --- SECURITY ---
SECRET_KEY=create_your_own_secure_random_key_here
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# --- CLOUDINARY (Media storage) ---
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# --- PAYOS (Online Payment Gateway) ---
PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key

# --- URL CONFIG ---
FRONTEND_URL=http://localhost
DEBUG=True
```

> [!IMPORTANT]
> Cần nhập đúng cấu hình cổng thanh toán **PayOS** và **Cloudinary** để tính năng thanh toán trực tuyến (VietQR) và tải lên hình ảnh hoạt động chính xác.

---

## 3. Khởi chạy nhanh bằng Docker (Khuyên dùng)

Đây là cách nhanh nhất và ổn định nhất để chạy toàn bộ hệ thống (Frontend, Backend, Database và Reverse Proxy Nginx).

### Bước 1: Khởi động các Container
Từ thư mục gốc của dự án, chạy lệnh:
```bash
docker compose up --build -d
```
Lệnh này sẽ tải ảnh, build các dịch vụ và chạy ngầm (`-d`).

### Bước 2: Chạy Database Migration
Khởi tạo cấu trúc các bảng dữ liệu trong PostgreSQL:
```bash
docker compose exec backend alembic upgrade head
```

### Bước 3: Seed Dữ liệu mẫu (Có ép buộc ghi đè)
Nạp dữ liệu mẫu đầy đủ gồm 6 danh mục, 32 sản phẩm cao cấp, các đánh giá chất lượng cao và tài khoản mẫu:
```bash
# Lệnh seed cơ bản (bỏ qua nếu đã có dữ liệu)
docker compose exec backend python app/seed.py

# Lệnh seed cưỡng bức (xóa sạch toàn bộ dữ liệu cũ và seed lại từ đầu)
docker compose exec backend python app/seed.py --force
```

### Địa chỉ truy cập:
* **Trang chủ Client:** [http://localhost](http://localhost)
* **Trang quản trị (Admin):** [http://localhost/admin](http://localhost/admin)
* **Tài liệu API (Swagger UI):** [http://localhost/api/docs](http://localhost/api/docs)

---

## 4. Khởi chạy cục bộ (Không dùng Docker)

Nếu muốn phát triển hoặc debug riêng biệt từng dịch vụ trên máy của mình.

### A. Thiết lập Backend (FastAPI)
1. Di chuyển vào thư mục backend và tạo môi trường ảo:
   ```bash
   cd backend
   python -m venv venv
   ```
2. Kích hoạt môi trường ảo:
   * **Windows (PowerShell):** `.\venv\Scripts\Activate.ps1`
   * **macOS / Linux:** `source venv/bin/activate`
3. Cài đặt các thư viện cần thiết:
   ```bash
   pip install -r requirements.txt
   ```
4. Đảm bảo dịch vụ PostgreSQL đang chạy trên máy cục bộ của bạn, tạo database khớp với cấu hình trong `.env`.
5. Chạy migration và seed dữ liệu:
   ```bash
   alembic upgrade head
   python app/seed.py --force
   ```
6. Khởi chạy máy chủ phát triển Backend (Hot-reload mặc định):
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### B. Thiết lập Frontend (React 18 + Vite)
1. Di chuyển vào thư mục frontend:
   ```bash
   cd ../frontend
   ```
2. Cài đặt các gói phụ thuộc (dependencies):
   ```bash
   npm install
   ```
3. Khởi chạy dev server phía frontend:
   ```bash
   npm run dev
   ```
   *Mặc định Vite dev server chạy trên cổng: [http://localhost:5173](http://localhost:5173)*

4. **Đóng gói sản phẩm (Production Build):**
   Nếu muốn kiểm tra lỗi biên dịch TypeScript hoặc build bản phát hành:
   ```bash
   npm run build
   ```

---

## 5. Cơ sở dữ liệu & Migration (Alembic)

Dự án sử dụng thư viện **Alembic** để quản lý phiên bản cấu trúc cơ sở dữ liệu.

* **Khi bạn thay đổi Models (trong thư mục `backend/app/models`):**
  Tạo file migration mới tự động:
  ```bash
  docker compose exec backend alembic revision --autogenerate -m "ten_revision"
  ```
* **Cập nhật database lên phiên bản mới nhất:**
  ```bash
  docker compose exec backend alembic upgrade head
  ```
* **Quay lại phiên bản trước (Rollback):**
  ```bash
  docker compose exec backend alembic downgrade -1
  ```

---

## 6. Quản lý Giỏ hàng & Thanh toán (PayOS)

Dự án tích hợp cơ chế thanh toán online VietQR qua cổng **PayOS**:
- Khi khách hàng nhấn đặt hàng online, đơn hàng sẽ được tạo tạm thời dưới dạng **`pending` (Chờ xác nhận)** và giữ chỗ tồn kho cho sản phẩm.
- Khách hàng được chuyển hướng sang cổng thanh toán PayOS để quét mã VietQR.
- **Nếu thanh toán thành công:** PayOS kích hoạt Webhook gửi tín hiệu đến `/api/payment/webhook` chuyển trạng thái đơn thành **`confirmed` (Đã xác nhận)**.
- **Nếu khách hàng bấm hủy thanh toán:** Trình duyệt sẽ chuyển hướng về `/checkout/cancel`. Frontend tự động gọi API `cancel-payment` để **xóa hoàn toàn đơn hàng chưa đặt thành công khỏi hệ thống** và tự động **trả lại số lượng tồn kho** của sản phẩm ngay lập tức để tránh rác database.
- **Tính năng tự hủy đơn hàng:** Đối với các đơn hàng đã đặt thành công (COD hoặc online đã duyệt) đang ở trạng thái `pending`, khách hàng có thể bấm nút **"Hủy đơn hàng"** trong lịch sử mua hàng cá nhân. Đơn hàng sẽ chuyển thành trạng thái **`cancelled` (Đã hủy)** và khóa chỉnh sửa vĩnh viễn.

---

## 7. Cấu trúc dự án (Architecture)

```
├── docker-compose.yml       # Cấu hình container orchestrator
├── .env.example             # Mẫu cấu hình môi trường
├── nginx/                   # Cấu hình reverse proxy
│   └── nginx.conf
│
├── backend/                 # 🐍 FastAPI Backend Service
│   ├── alembic/             # Database migrations history
│   ├── app/
│   │   ├── main.py          # Điểm khởi chạy API
│   │   ├── core/            # Cấu hình, bảo mật, xác thực (JWT)
│   │   ├── models/          # Các model SQLAlchemy (User, Product, Order...)
│   │   ├── schemas/         # Schema Pydantic v2 quản lý dữ liệu vào/ra
│   │   ├── crud/            # Logic truy vấn DB (Create, Read, Update, Delete)
│   │   ├── routers/         # Các API routes (auth, products, orders, cart...)
│   │   └── seed.py          # Script nạp dữ liệu mẫu
│   └── requirements.txt     # Python dependencies
│
└── frontend/                # ⚛️ React Frontend Service
    ├── package.json
    ├── tailwind.config.js
    └── src/
        ├── App.tsx          # Router và bố cục chính
        ├── main.tsx         # Điểm khởi tạo ứng dụng
        ├── api/             # Cấu hình Axios Interceptor và endpoints
        ├── store/           # Zustand store (authStore, cartStore)
        ├── types/           # Định nghĩa các interface TypeScript
        ├── utils/           # Tiện ích format dữ liệu (giá tiền, thời gian...)
        ├── components/      # Component dùng chung (Navbar, Footer, ProductCard...)
        └── pages/           # Các trang ứng dụng (Products, Cart, AdminOrders...)
```

---

## 8. Tài khoản thử nghiệm mẫu

Sau khi chạy lệnh seed thành công, bạn có thể đăng nhập bằng các tài khoản sau:

| Loại tài khoản | Email đăng nhập | Mật khẩu mặc định | Ghi chú |
|----------------|-----------------|-------------------|---------|
| **Super Admin** | `admin@luxebeauty.vn` | `Admin@2026` | Toàn quyền trang Admin Dashboard |
| **Customer 1** | `customer@example.com` | `Customer@2026` | Tài khoản mua hàng (Nguyễn Thị Lan) |
| **Customer 2** | `minh@example.com` | `Customer@2026` | Tài khoản mua hàng (Trần Văn Minh) |

---
*Phát triển bởi đội ngũ thiết kế Luxe Beauty. Mọi thắc mắc vui lòng liên hệ bộ phận kỹ thuật.*
