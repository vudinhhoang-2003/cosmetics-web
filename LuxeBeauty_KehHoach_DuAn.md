  
**✦  LUXE BEAUTY  ✦**

**KẾ HOẠCH XÂY DỰNG**

WEB BÁN MỸ PHẨM CAO CẤP

────────────────────────────────────

*FastAPI  ·  React  ·  PostgreSQL  ·  Docker*

Phiên bản 1.0  |  Tháng 5 / 2026

# **1\. TỔNG QUAN DỰ ÁN**

Dự án xây dựng một nền tảng thương mại điện tử bán mỹ phẩm cao cấp với giao diện sang trọng, tinh tế, tập trung vào trải nghiệm người dùng đẳng cấp. Hệ thống được xây dựng theo kiến trúc microservices, container hoá hoàn toàn bằng Docker.

### **Mục tiêu dự án**

* Xây dựng nền tảng bán mỹ phẩm trực tuyến chuyên nghiệp

* Giao diện luxury, sang trọng, nâng cao giá trị thương hiệu

* Hệ thống quản trị đơn giản, dễ vận hành cho admin

* Kiến trúc mở rộng được, dễ bảo trì và deploy

### **Tech Stack**

| Layer | Công nghệ | Mục đích |
| ----- | ----- | ----- |
| Frontend | React 18 \+ Vite \+ TypeScript | Giao diện người dùng SPA |
| Styling | Tailwind CSS \+ Framer Motion | Thiết kế & animation |
| Backend | Python 3.12 \+ FastAPI | REST API, business logic |
| ORM | SQLAlchemy 2.0 \+ Alembic | Tương tác database & migration |
| Database | PostgreSQL 16 | Lưu trữ dữ liệu chính |
| Auth | JWT (python-jose) \+ bcrypt | Xác thực & phân quyền |
| Storage | Cloudinary / Local uploads | Lưu trữ ảnh sản phẩm |
| Container | Docker \+ Docker Compose | Đóng gói & triển khai |
| Reverse Proxy | Nginx | Routing & SSL termination |

# **2\. KIẾN TRÚC HỆ THỐNG**

## **2.1. Tổng quan kiến trúc**

Hệ thống theo mô hình Client–Server với 4 lớp tách biệt: Client Layer, Frontend (React SPA), Backend API (FastAPI), và Data Layer (PostgreSQL \+ File Storage). Toàn bộ chạy trong Docker network.

### **Cấu trúc thư mục dự án**

cosmetics-shop/

├── docker-compose.yml

├── .env

├── nginx/

│   └── nginx.conf

├── frontend/

│   ├── Dockerfile

│   ├── public/

│   └── src/

│       ├── pages/       \# Home, Products, Detail, Cart, Checkout, Admin

│       ├── components/  \# Navbar, Footer, ProductCard, Modal, ...

│       ├── store/       \# Zustand state management

│       ├── api/         \# axios instances \+ endpoints

│       ├── hooks/       \# custom React hooks

│       └── types/       \# TypeScript interfaces

└── backend/

    ├── Dockerfile

    └── app/

        ├── main.py

        ├── models/      \# SQLAlchemy models

        ├── schemas/     \# Pydantic v2 schemas

        ├── routers/     \# products, orders, users, auth, admin

        ├── core/        \# config, security, dependencies

        └── crud/        \# CRUD operations

## **2.2. Docker Compose Services**

| Service | Image / Build | Port | Vai trò |
| ----- | ----- | ----- | ----- |
| db | postgres:16-alpine | 5432 | Database PostgreSQL |
| backend | python:3.12-slim build | 8000 | FastAPI application |
| frontend | node:20-alpine build | 5173/80 | React \+ Vite build |
| nginx | nginx:alpine | 80 / 443 | Reverse proxy & static |

### **docker-compose.yml (rút gọn)**

version: '3.9'

services:

  db:

    image: postgres:16-alpine

    environment:

      POSTGRES\_DB: luxe\_beauty

      POSTGRES\_USER: ${DB\_USER}

      POSTGRES\_PASSWORD: ${DB\_PASS}

    volumes:

      \- pgdata:/var/lib/postgresql/data

  backend:

    build: ./backend

    depends\_on: \[db\]

    environment:

      DATABASE\_URL: postgresql://${DB\_USER}:${DB\_PASS}@db/luxe\_beauty

      SECRET\_KEY: ${SECRET\_KEY}

  frontend:

    build: ./frontend

    depends\_on: \[backend\]

  nginx:

    image: nginx:alpine

    ports: \['80:80'\]

    depends\_on: \[frontend, backend\]

volumes:

  pgdata:

# **3\. THIẾT KẾ DATABASE**

## **3.1. Entity Relationship**

Cơ sở dữ liệu PostgreSQL gồm 7 bảng chính, liên kết qua khoá ngoại. Sử dụng UUID làm primary key để đảm bảo tính duy nhất khi scale.

| Bảng | Mô tả | Quan hệ chính |
| ----- | ----- | ----- |
| users | Tài khoản người dùng & admin | 1–N orders, 1–N reviews |
| categories | Danh mục sản phẩm (má hồng, son...) | 1–N products |
| products | Thông tin sản phẩm đầy đủ | N–1 categories, 1–N order\_items |
| cart\_items | Giỏ hàng tạm thời | N–1 users, N–1 products |
| orders | Đơn hàng đã đặt | N–1 users, 1–N order\_items |
| order\_items | Dòng chi tiết trong đơn hàng | N–1 orders, N–1 products |
| reviews | Đánh giá sản phẩm | N–1 users, N–1 products |

## **3.2. SQL Schema**

\-- users

CREATE TABLE users (

  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

  email VARCHAR(255) UNIQUE NOT NULL,

  password\_hash VARCHAR(255) NOT NULL,

  full\_name VARCHAR(255),

  phone VARCHAR(20),

  role VARCHAR(20) DEFAULT 'customer',  \-- customer | admin

  is\_active BOOLEAN DEFAULT TRUE,

  created\_at TIMESTAMP DEFAULT NOW()

);

\-- categories

CREATE TABLE categories (

  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

  name VARCHAR(100) NOT NULL,

  slug VARCHAR(100) UNIQUE NOT NULL,

  image\_url TEXT

);

\-- products

CREATE TABLE products (

  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

  name VARCHAR(255) NOT NULL,

  slug VARCHAR(255) UNIQUE NOT NULL,

  description TEXT,

  price NUMERIC(12,2) NOT NULL,

  sale\_price NUMERIC(12,2),

  stock INTEGER DEFAULT 0,

  images TEXT\[\],         \-- mảng URL ảnh

  category\_id UUID REFERENCES categories(id),

  brand VARCHAR(100),

  is\_active BOOLEAN DEFAULT TRUE,

  created\_at TIMESTAMP DEFAULT NOW()

);

\-- cart\_items

CREATE TABLE cart\_items (

  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

  user\_id UUID REFERENCES users(id) ON DELETE CASCADE,

  product\_id UUID REFERENCES products(id),

  quantity INTEGER DEFAULT 1

);

\-- orders

CREATE TABLE orders (

  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

  user\_id UUID REFERENCES users(id),

  status VARCHAR(30) DEFAULT 'pending',

  total\_price NUMERIC(12,2) NOT NULL,

  shipping\_address JSONB,

  payment\_method VARCHAR(30),

  created\_at TIMESTAMP DEFAULT NOW()

);

\-- order\_items

CREATE TABLE order\_items (

  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

  order\_id UUID REFERENCES orders(id) ON DELETE CASCADE,

  product\_id UUID REFERENCES products(id),

  quantity INTEGER NOT NULL,

  price\_at\_purchase NUMERIC(12,2) NOT NULL

);

\-- reviews

CREATE TABLE reviews (

  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

  user\_id UUID REFERENCES users(id),

  product\_id UUID REFERENCES products(id),

  rating INTEGER CHECK (rating BETWEEN 1 AND 5),

  comment TEXT,

  created\_at TIMESTAMP DEFAULT NOW()

);

# **4\. BACKEND — FastAPI**

## **4.1. Danh sách API Endpoints**

| Method | Endpoint | Mô tả | Auth |
| ----- | ----- | ----- | ----- |
| POST | /api/auth/register | Đăng ký tài khoản | — |
| POST | /api/auth/login | Đăng nhập, trả JWT | — |
| POST | /api/auth/refresh | Refresh access token | Token |
| GET | /api/products | Danh sách sản phẩm (filter) | — |
| GET | /api/products/{slug} | Chi tiết sản phẩm | — |
| POST | /api/products | Tạo sản phẩm mới | Admin |
| PUT | /api/products/{id} | Cập nhật sản phẩm | Admin |
| DEL | /api/products/{id} | Xoá sản phẩm | Admin |
| GET | /api/categories | Danh sách danh mục | — |
| POST | /api/categories | Tạo danh mục | Admin |
| GET | /api/cart | Xem giỏ hàng | User |
| POST | /api/cart | Thêm vào giỏ hàng | User |
| PUT | /api/cart/{item\_id} | Cập nhật số lượng | User |
| DEL | /api/cart/{item\_id} | Xoá khỏi giỏ hàng | User |
| POST | /api/orders | Tạo đơn hàng | User |
| GET | /api/orders | Lịch sử đơn hàng cá nhân | User |
| GET | /api/orders/{id} | Chi tiết đơn hàng | User |
| PUT | /api/orders/{id}/status | Cập nhật trạng thái | Admin |
| GET | /api/users/me | Thông tin cá nhân | User |
| PUT | /api/users/me | Cập nhật thông tin | User |
| GET | /api/admin/stats | Thống kê dashboard | Admin |
| POST | /api/products/{id}/reviews | Đánh giá sản phẩm | User |

## **4.2. Cấu trúc Backend**

### **main.py**

from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware

from app.routers import products, orders, users, auth, admin, categories

app \= FastAPI(title='Luxe Beauty API', version='1.0.0')

app.add\_middleware(CORSMiddleware,

    allow\_origins=\['http://localhost:5173'\],

    allow\_credentials=True,

    allow\_methods=\['\*'\], allow\_headers=\['\*'\])

app.include\_router(auth.router,       prefix='/api/auth')

app.include\_router(products.router,   prefix='/api/products')

app.include\_router(categories.router, prefix='/api/categories')

app.include\_router(orders.router,     prefix='/api/orders')

app.include\_router(users.router,      prefix='/api/users')

app.include\_router(admin.router,      prefix='/api/admin')

### **Ví dụ: Router sản phẩm**

from fastapi import APIRouter, Depends, Query

from sqlalchemy.orm import Session

from app.core.deps import get\_db, get\_current\_user, require\_admin

from app import crud, schemas

router \= APIRouter()

@router.get('/', response\_model=schemas.ProductList)

def list\_products(

    skip: int \= 0, limit: int \= 20,

    category: str | None \= None,

    min\_price: float | None \= None,

    max\_price: float | None \= None,

    search: str | None \= None,

    db: Session \= Depends(get\_db)

):

    return crud.product.get\_multi(db, skip, limit, category, min\_price, max\_price, search)

@router.post('/', response\_model=schemas.Product, dependencies=\[Depends(require\_admin)\])

def create\_product(product: schemas.ProductCreate, db: Session \= Depends(get\_db)):

    return crud.product.create(db, product)

# **5\. FRONTEND — React**

## **5.1. Cấu trúc trang**

| Trang | Route | Tính năng chính |
| ----- | ----- | ----- |
| Trang chủ | / | Hero banner, sản phẩm nổi bật, danh mục |
| Danh sách SP | /products | Grid sản phẩm, filter, search, phân trang |
| Chi tiết SP | /products/:slug | Ảnh, mô tả, giá, chọn số lượng, đánh giá |
| Giỏ hàng | /cart | Danh sách item, cập nhật, tổng tiền |
| Thanh toán | /checkout | Form địa chỉ, phương thức thanh toán |
| Đặt hàng thành công | /order/success | Xác nhận, mã đơn hàng |
| Tài khoản | /account | Thông tin, lịch sử đơn hàng, wishlist |
| Đăng nhập | /login | Form đăng nhập, redirect |
| Đăng ký | /register | Form tạo tài khoản |
| Admin Dashboard | /admin | Thống kê doanh thu, đơn hàng |
| Quản lý SP | /admin/products | CRUD sản phẩm, upload ảnh |
| Quản lý đơn hàng | /admin/orders | Danh sách, cập nhật trạng thái |

## **5.2. State Management — Zustand**

// store/cartStore.ts

import { create } from 'zustand'

import { persist } from 'zustand/middleware'

interface CartStore {

  items: CartItem\[\]

  addItem: (product: Product, qty: number) \=\> void

  removeItem: (id: string) \=\> void

  updateQty: (id: string, qty: number) \=\> void

  clearCart: () \=\> void

  total: () \=\> number

}

export const useCartStore \= create\<CartStore\>()(persist(

  (set, get) \=\> ({

    items: \[\],

    addItem: (product, qty) \=\> set(state \=\> ({

      items: \[...state.items, { product, qty, id: product.id }\]

    })),

    total: () \=\> get().items.reduce((s, i) \=\> s \+ i.product.price \* i.qty, 0),

    // ...

  }),

  { name: 'cart-storage' }

))

# **6\. THIẾT KẾ GIAO DIỆN — LUXURY STYLE**

## **6.1. Bộ màu sắc (Color Palette)**

| Tên màu | Hex Code | Ứng dụng |
| ----- | ----- | ----- |
| Cream White (nền) | \#FAFAF8 | Background chính, nền page |
| Gold Accent | \#C9A96E | Buttons, borders nổi bật, icons |
| Deep Navy (text/header) | \#1A1A2E | Heading, navbar, footer background |
| Warm Beige (surface) | \#FDF8F2 | Card background, section alternating |
| Soft Gray | \#E8E8E0 | Divider, border nhẹ, input background |
| Accent Brown | \#9B8860 | Sub-heading, label, secondary text |
| Pure White | \#FFFFFF | Card nổi, modal, overlay |
| Dark Text | \#2D2D2D | Body text, mô tả |
| Muted Gray | \#8B8B8B | Placeholder, metadata, caption |

## **6.2. Typography**

| Loại văn bản | Font | Size | Weight | Màu |
| ----- | ----- | ----- | ----- | ----- |
| Hero Heading | Playfair Display | 56–72px | 700 Bold | \#1A1A2E |
| Page Title (H1) | Playfair Display | 36–44px | 600 | \#1A1A2E |
| Section Title (H2) | Playfair Display | 28px | 600 | \#1A1A2E |
| Card Title (H3) | Lato / Inter | 18–20px | 600 | \#2D2D2D |
| Body Text | Lato / Inter | 15–16px | 400 Regular | \#2D2D2D |
| Label / Caption | Lato / Inter | 12–13px | 400 | \#8B8B8B |
| Button Text | Lato / Inter | 14px | 500 Medium | \#1A1A2E |
| Price | Lato / Inter | 20–24px | 700 Bold | \#C9A96E |

## **6.3. UI Components & Design Principles**

### **Nguyên tắc thiết kế**

* Whitespace tối đa — không nhồi nhét, tạo cảm giác cao cấp

* Ảnh sản phẩm lớn, full-bleed, chất lượng cao

* Button kiểu outlined (viền mỏng) — đặc trưng luxury brand

* Micro-animation tinh tế: hover scale, fade-in khi scroll

* Navbar trong suốt (glassmorphism nhẹ) khi scroll

* Màu vàng gold chỉ dùng làm accent, không lạm dụng

### **Các thành phần UI chính**

| Component | Mô tả thiết kế |
| ----- | ----- |
| Hero Banner | Full-width ảnh, text overlay kiểu editorial, CTA button outlined |
| Product Card | Ảnh vuông chiếm 70%, tên \+ giá nhỏ phía dưới, hover: scale 1.03 \+ shadow nhẹ |
| Navbar | Logo căn trái, menu căn giữa, icons giỏ \+ user căn phải, nền trắng/glass |
| Add to Cart Btn | Outlined, chữ navy, hover: fill navy — chữ trắng, transition 0.3s |
| Price Tag | Màu gold, font weight 700, sale price kèm giá gốc gạch ngang muted |
| Filter Sidebar | Tối giản, checkbox custom màu gold, range slider custom |
| Breadcrumb | Chữ nhỏ muted, separator '/' màu gold nhạt |
| Toast / Alert | Minimal, góc phải dưới, auto dismiss 3s, border-left gold |
| Modal / Drawer | Backdrop tối nhẹ 50%, card trắng, animation slide-in từ phải |
| Rating Stars | Icon star màu gold, click chọn rating khi review |

# **7\. TÍNH NĂNG CHI TIẾT**

## **7.1. Module Khách hàng**

| Tính năng | Chi tiết | Ưu tiên |
| ----- | ----- | ----- |
| Trang chủ | Hero banner, sản phẩm nổi bật, danh mục có ảnh, banner quảng cáo | P1 |
| Danh sách sản phẩm | Grid 3 cột, filter danh mục \+ giá, search, sort (giá/mới/bán chạy) | P1 |
| Chi tiết sản phẩm | Ảnh carousel, tên/giá/mô tả, stock badge, nút add to cart/wishlist | P1 |
| Giỏ hàng | Thêm/xóa/cập nhật số lượng, tổng tiền realtime, button checkout | P1 |
| Checkout | Form địa chỉ (tỉnh/quận/phường), phương thức COD / ví điện tử | P1 |
| Xác nhận đơn hàng | Trang success với mã đơn, email xác nhận (tùy chọn) | P1 |
| Đăng ký / Đăng nhập | Form, validation, JWT token, remember me | P1 |
| Tài khoản cá nhân | Thông tin, đổi mật khẩu, danh sách đơn hàng với trạng thái | P2 |
| Wishlist | Lưu sản phẩm yêu thích, hiển thị trên trang account | P2 |
| Đánh giá sản phẩm | Star rating \+ comment, chỉ user đã mua mới được review | P2 |
| Tìm kiếm | Search bar với autocomplete, hiện kết quả theo keyword | P2 |

## **7.2. Module Admin**

| Tính năng | Chi tiết | Ưu tiên |
| ----- | ----- | ----- |
| Dashboard | Tổng doanh thu, số đơn hàng, sản phẩm bán chạy, biểu đồ doanh thu | P1 |
| Quản lý sản phẩm | Bảng danh sách, thêm/sửa/xóa, upload ảnh đa hình, toggle active | P1 |
| Quản lý đơn hàng | Danh sách đơn, filter theo trạng thái, cập nhật pending→shipping→done | P1 |
| Quản lý danh mục | CRUD danh mục, upload ảnh danh mục | P1 |
| Quản lý người dùng | Xem danh sách users, block/unblock tài khoản | P2 |
| Báo cáo | Doanh thu theo ngày/tháng, top sản phẩm bán chạy | P2 |

# **8\. LỘ TRÌNH THỰC HIỆN**

| Tuần | Giai đoạn | Việc cần làm | Kết quả |
| ----- | ----- | ----- | ----- |
| Tuần 1 | Setup & Infrastructure | Khởi tạo repo Git, cấu hình Docker Compose, tạo database schema, Alembic migrations, seed data mẫu | Docker chạy được, DB có dữ liệu mẫu |
| Tuần 2 | Core Backend APIs | Auth API (register/login/JWT), Products API (CRUD \+ filter), Categories API | Postman test pass toàn bộ endpoint cốt lõi |
| Tuần 3 | Extended Backend APIs | Cart API, Orders API (tạo đơn \+ lịch sử), Admin API (stats), Reviews API | Toàn bộ backend hoàn chỉnh, Swagger docs đầy đủ |
| Tuần 4 | Frontend Core UI | Setup React \+ Tailwind \+ Zustand, Trang chủ, Danh sách sản phẩm, Chi tiết sản phẩm | 3 trang chính render đúng, responsive |
| Tuần 5 | Frontend Extended \+ Admin | Giỏ hàng, Checkout, Auth pages, Admin Dashboard, Quản lý sản phẩm \+ đơn hàng | Luồng mua hàng hoàn chỉnh end-to-end |
| Tuần 6 | Polish & Deploy | Kết nối API thực, animation/transition, fix UI bugs, kiểm thử, viết README, deploy VPS | Sản phẩm hoàn chỉnh, chạy production |

# **9\. BẢO MẬT & BEST PRACTICES**

## **9.1. Authentication & Authorization**

* JWT Access Token (thời hạn 30 phút) \+ Refresh Token (7 ngày)

* Mật khẩu hash bằng bcrypt với salt rounds \= 12

* Role-based access: customer vs admin — guard trên từng endpoint

* CORS chỉ cho phép origin của frontend

## **9.2. Bảo mật API**

* Rate limiting: giới hạn số request / phút trên endpoint nhạy cảm

* Input validation toàn bộ qua Pydantic v2

* SQL Injection: SQLAlchemy ORM tự xử lý parameterized queries

* File upload: kiểm tra MIME type, giới hạn dung lượng 5MB/ảnh

* Environment variables: không hardcode secrets trong code

## **9.3. File .env mẫu**

\# Database

DB\_USER=luxe\_user

DB\_PASS=your\_strong\_password

DB\_NAME=luxe\_beauty

\# JWT

SECRET\_KEY=your\_256bit\_secret\_key

ACCESS\_TOKEN\_EXPIRE\_MINUTES=30

REFRESH\_TOKEN\_EXPIRE\_DAYS=7

\# Cloudinary (file storage)

CLOUDINARY\_CLOUD\_NAME=your\_cloud

CLOUDINARY\_API\_KEY=your\_key

CLOUDINARY\_API\_SECRET=your\_secret

\# App

FRONTEND\_URL=http://localhost:5173

DEBUG=False

# **10\. HƯỚNG DẪN DEPLOY**

## **10.1. Development (Local)**

\# Clone project

git clone https://github.com/yourname/luxe-beauty.git

cd luxe-beauty

\# Tạo file .env

cp .env.example .env

\# Chỉnh sửa .env với thông tin thực

\# Khởi chạy toàn bộ

docker compose up \--build \-d

\# Chạy migration

docker compose exec backend alembic upgrade head

\# Seed dữ liệu mẫu

docker compose exec backend python \-m app.seed

\# Truy cập

\# Frontend:  http://localhost

\# API Docs:  http://localhost/api/docs

\# Admin:     http://localhost/admin

## **10.2. Production (VPS)**

* Dùng Docker Compose trên VPS (Ubuntu 22.04 LTS)

* Nginx làm reverse proxy \+ cấu hình SSL với Let's Encrypt (Certbot)

* Đặt DEBUG=False, cấu hình logging vào file

* Backup PostgreSQL tự động bằng pg\_dump \+ cron job hàng ngày

* Dùng GitHub Actions CI/CD để auto-deploy khi push vào main branch

# **PHỤ LỤC — CHECKLIST TRIỂN KHAI**

| Hạng mục | Chi tiết | Trạng thái |
| ----- | ----- | ----- |
| Docker Compose | Tất cả services khởi động không lỗi | ☐ |
| Database | Schema đã migrate, seed data có sẵn | ☐ |
| Auth API | Register/Login/JWT hoạt động đúng | ☐ |
| Products API | CRUD \+ filter \+ search hoạt động | ☐ |
| Cart & Orders | Luồng thêm giỏ → đặt hàng hoạt động end-to-end | ☐ |
| Admin Panel | Dashboard \+ CRUD sản phẩm \+ quản lý đơn | ☐ |
| Frontend UI | Responsive trên mobile/tablet/desktop | ☐ |
| Performance | First load \< 3s, ảnh được lazy load | ☐ |
| Security | CORS, rate limit, input validation đã cấu hình | ☐ |
| SSL/HTTPS | Chứng chỉ Let's Encrypt đã cài trên domain | ☐ |
| Backup | Cron job backup DB hàng ngày đã thiết lập | ☐ |
| Documentation | README, API docs (Swagger) đã hoàn chỉnh | ☐ |

────────────────────────────────────

*Tài liệu được soạn thảo cho dự án Luxe Beauty  ·  2026*

FastAPI · React · PostgreSQL · Docker