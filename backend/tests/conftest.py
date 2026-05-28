"""
Shared fixtures for all tests.
Uses a separate PostgreSQL database (luxe_beauty_test) to avoid touching production data.
"""
import re
import pytest
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.core.config import settings
from app.core.security import hash_password, create_access_token
from app.models.user import User
from app.models.category import Category
from app.models.product import Product

# ── Test DB setup ──────────────────────────────────────────────────────────────

# Derive test DB URL from app settings (replace db name with luxe_beauty_test)
TEST_DATABASE_URL = re.sub(r"/[^/]+$", "/luxe_beauty_test", settings.DATABASE_URL)

test_engine = create_engine(TEST_DATABASE_URL, pool_pre_ping=True)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def _create_test_db_if_missing():
    m = re.match(r"postgresql://([^:]+):([^@]+)@([^/:]+)(?::(\d+))?/", settings.DATABASE_URL)
    user, password, host, port = m.group(1), m.group(2), m.group(3), int(m.group(4) or 5432)
    conn = psycopg2.connect(host=host, port=port, user=user, password=password, dbname="postgres")
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM pg_database WHERE datname = 'luxe_beauty_test'")
    if not cur.fetchone():
        cur.execute("CREATE DATABASE luxe_beauty_test")
    cur.close()
    conn.close()


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    _create_test_db_if_missing()
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(autouse=True)
def clean_tables():
    """Truncate all tables before each test for isolation."""
    db = TestingSessionLocal()
    try:
        db.execute(text(
            "TRUNCATE TABLE reviews, order_items, orders, cart_items, products, categories, users CASCADE"
        ))
        db.commit()
    finally:
        db.close()
    yield


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client():
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ── Helper: seed users directly ───────────────────────────────────────────────

def _insert_user(email, password, full_name, role="customer", phone=None):
    db = TestingSessionLocal()
    try:
        u = User(
            email=email,
            password_hash=hash_password(password),
            full_name=full_name,
            phone=phone,
            role=role,
            is_active=True,
        )
        db.add(u)
        db.commit()
        db.refresh(u)
        return u
    finally:
        db.close()


@pytest.fixture
def admin_user():
    return _insert_user("admin@test.com", "Admin@123", "Test Admin", role="admin")


@pytest.fixture
def regular_user():
    return _insert_user("user@test.com", "User@123", "Test User", role="customer")


@pytest.fixture
def admin_token(admin_user):
    return create_access_token({"sub": str(admin_user.id)})


@pytest.fixture
def user_token(regular_user):
    return create_access_token({"sub": str(regular_user.id)})


@pytest.fixture
def auth_admin(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def auth_user(user_token):
    return {"Authorization": f"Bearer {user_token}"}


# ── Shared resource fixtures ───────────────────────────────────────────────────

@pytest.fixture
def category(client, auth_admin):
    r = client.post("/api/categories", json={
        "name": "Son Môi", "slug": "son-moi",
        "image_url": "https://example.com/img.jpg"
    }, headers=auth_admin)
    assert r.status_code == 201
    return r.json()


@pytest.fixture
def product(client, auth_admin, category):
    r = client.post("/api/products", json={
        "name": "Son Test",
        "slug": "son-test",
        "description": "Mô tả",
        "price": 500000,
        "stock": 10,
        "images": ["https://example.com/img.jpg"],
        "category_id": category["id"],
        "brand": "TestBrand",
        "is_active": True,
    }, headers=auth_admin)
    assert r.status_code == 201
    return r.json()
