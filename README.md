# ✦ LUXE BEAUTY ✦
### Web Bán Mỹ Phẩm Cao Cấp

> FastAPI · React 18 · PostgreSQL · Docker

---

## Khởi chạy nhanh (Development)

```bash
# 1. Clone và vào thư mục
cd luxe-beauty

# 2. Tạo file .env từ mẫu và cập nhật thông tin
cp .env.example .env

# 3. Khởi chạy toàn bộ với Docker
docker compose up --build -d

# 4. Chạy database migration (lần đầu)
docker compose exec backend alembic upgrade head

# 5. Seed dữ liệu mẫu
docker compose exec backend python -m app.seed
```

**Truy cập:**
- 🌐 Website: http://localhost
- 📖 API Docs: http://localhost/api/docs
- 🔧 Admin: http://localhost/admin

**Tài khoản mẫu:**
- Admin: `admin@luxebeauty.vn` / `Admin@2026`
- Customer: `customer@example.com` / `Customer@2026`

---

## Phát triển cục bộ (không Docker)

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Cấu trúc dự án

```
├── docker-compose.yml
├── .env
├── nginx/nginx.conf
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic v2 schemas
│   │   ├── routers/       # API endpoints
│   │   ├── crud/          # Database operations
│   │   ├── core/          # Config, security, deps
│   │   └── seed.py        # Sample data
│   └── requirements.txt
└── frontend/
    └── src/
        ├── pages/         # 12 trang + 5 admin pages
        ├── components/    # Navbar, Footer, ProductCard...
        ├── store/         # Zustand (auth, cart)
        ├── api/           # Axios + API endpoints
        └── types/         # TypeScript interfaces
```

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS + Framer Motion |
| State | Zustand + React Query |
| Backend | Python 3.12 + FastAPI |
| Database | PostgreSQL 16 + SQLAlchemy |
| Auth | JWT + bcrypt |
| Container | Docker + Docker Compose |
| Proxy | Nginx |
