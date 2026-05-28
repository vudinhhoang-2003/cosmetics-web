"""Tests for /api/users endpoints."""
import pytest


USERS_URL = "/api/users"


class TestGetMe:
    def test_get_me(self, client, auth_user, regular_user):
        r = client.get(f"{USERS_URL}/me", headers=auth_user)
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == "user@test.com"
        assert "password_hash" not in data

    def test_get_me_unauthenticated(self, client):
        r = client.get(f"{USERS_URL}/me")
        assert r.status_code == 403


class TestUpdateProfile:
    def test_update_full_name(self, client, auth_user, regular_user):
        r = client.put(
            f"{USERS_URL}/me",
            json={"full_name": "Updated Name"},
            headers=auth_user,
        )
        assert r.status_code == 200
        assert r.json()["full_name"] == "Updated Name"

    def test_update_phone(self, client, auth_user, regular_user):
        r = client.put(
            f"{USERS_URL}/me",
            json={"phone": "0909999999"},
            headers=auth_user,
        )
        assert r.status_code == 200
        assert r.json()["phone"] == "0909999999"


class TestChangePassword:
    def test_change_password_success(self, client, auth_user, regular_user):
        r = client.put(
            f"{USERS_URL}/me/password",
            json={"current_password": "User@123", "new_password": "NewPass@456"},
            headers=auth_user,
        )
        assert r.status_code == 200

    def test_change_password_wrong_current(self, client, auth_user, regular_user):
        r = client.put(
            f"{USERS_URL}/me/password",
            json={"current_password": "WrongPass@123", "new_password": "NewPass@456"},
            headers=auth_user,
        )
        assert r.status_code == 400
