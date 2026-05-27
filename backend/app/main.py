from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.core.database import engine, Base
from app.routers import auth, products, categories, orders, users, admin, upload

# Create tables on startup (alembic handles migrations in production)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Luxe Beauty API",
    version="1.0.0",
    description="API for Luxe Beauty - Premium Cosmetics E-Commerce",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000", "http://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads
uploads_dir = settings.UPLOAD_DIR
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

app.include_router(auth.router,       prefix="/api/auth")
app.include_router(products.router,   prefix="/api/products")
app.include_router(categories.router, prefix="/api/categories")
app.include_router(orders.router,     prefix="/api/orders")
app.include_router(users.router,      prefix="/api/users")
app.include_router(admin.router,      prefix="/api/admin")
app.include_router(upload.router,     prefix="/api/upload")


@app.get("/api/health")
def health():
    return {"status": "ok", "version": "1.0.0"}
