"""Tests for /api/auth endpoints."""
import pytest


REGISTER_URL = "/api/auth/register"
LOGIN_URL = "/api/auth/login"
REFRESH_URL = "/api/auth/refresh"

VALID_USER = {"email": "new@test.com", "password": "Pass@123", "full_name": "New User"}


class TestRegister:
    def test_register_success(self, client):
        r = client.post(REGISTER_URL, json=VALID_USER)
        assert r.status_code == 201
        data = r.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["email"] == VALID_USER["email"]
        assert data["user"]["role"] == "customer"

    def test_register_duplicate_email(self, client):
        client.post(REGISTER_URL, json=VALID_USER)
        r = client.post(REGISTER_URL, json=VALID_USER)
        assert r.status_code == 400
        assert "already registered" in r.json()["detail"]

    def test_register_invalid_email(self, client):
        r = client.post(REGISTER_URL, json={**VALID_USER, "email": "not-an-email"})
        assert r.status_code == 422

    def test_register_missing_password(self, client):
        r = client.post(REGISTER_URL, json={"email": "a@b.com"})
        assert r.status_code == 422


class TestLogin:
    def test_login_success(self, client, regular_user):
        r = client.post(LOGIN_URL, json={"email": "user@test.com", "password": "User@123"})
        assert r.status_code == 200
        data = r.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client, regular_user):
        r = client.post(LOGIN_URL, json={"email": "user@test.com", "password": "Wrong@123"})
        assert r.status_code == 401

    def test_login_nonexistent_email(self, client):
        r = client.post(LOGIN_URL, json={"email": "nobody@test.com", "password": "Pass@123"})
        assert r.status_code == 401

    def test_login_inactive_user(self, client, regular_user):
        from tests.conftest import TestingSessionLocal
        from app.models.user import User
        db = TestingSessionLocal()
        try:
            u = db.query(User).filter(User.email == "user@test.com").first()
            u.is_active = False
            db.commit()
        finally:
            db.close()
        r = client.post(LOGIN_URL, json={"email": "user@test.com", "password": "User@123"})
        assert r.status_code == 403


class TestRefreshToken:
    def test_refresh_success(self, client, regular_user):
        login = client.post(LOGIN_URL, json={"email": "user@test.com", "password": "User@123"})
        refresh_token = login.json()["refresh_token"]
        r = client.post(REFRESH_URL, params={"refresh_token": refresh_token})
        assert r.status_code == 200
        assert "access_token" in r.json()

    def test_refresh_invalid_token(self, client):
        r = client.post(REFRESH_URL, params={"refresh_token": "invalid.token.here"})
        assert r.status_code == 401

    def test_refresh_with_access_token(self, client, regular_user):
        """Access token must not be accepted as refresh token."""
        from app.core.security import create_access_token
        token = create_access_token({"sub": str(regular_user.id)})
        r = client.post(REFRESH_URL, params={"refresh_token": token})
        assert r.status_code == 401
