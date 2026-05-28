"""Tests for /api/admin endpoints."""
import pytest


ADMIN_URL = "/api/admin"


class TestAdminStats:
    def test_stats_as_admin(self, client, auth_admin):
        r = client.get(f"{ADMIN_URL}/stats", headers=auth_admin)
        assert r.status_code == 200
        data = r.json()
        assert "total_revenue" in data
        assert "total_orders" in data
        assert "total_products" in data
        assert "total_users" in data

    def test_stats_as_user_forbidden(self, client, auth_user):
        r = client.get(f"{ADMIN_URL}/stats", headers=auth_user)
        assert r.status_code == 403

    def test_stats_unauthenticated(self, client):
        r = client.get(f"{ADMIN_URL}/stats")
        assert r.status_code == 403


class TestAdminOrders:
    def test_list_all_orders(self, client, auth_admin):
        r = client.get(f"{ADMIN_URL}/orders", headers=auth_admin)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_filter_orders_by_status(self, client, auth_admin):
        r = client.get(f"{ADMIN_URL}/orders", params={"status": "pending"}, headers=auth_admin)
        assert r.status_code == 200

    def test_list_orders_as_user_forbidden(self, client, auth_user):
        r = client.get(f"{ADMIN_URL}/orders", headers=auth_user)
        assert r.status_code == 403


class TestAdminUsers:
    def test_list_users(self, client, auth_admin, regular_user):
        r = client.get(f"{ADMIN_URL}/users", headers=auth_admin)
        assert r.status_code == 200
        data = r.json()
        assert any(u["email"] == "user@test.com" for u in data)

    def test_toggle_user_active(self, client, auth_admin, regular_user):
        r = client.put(
            f"{ADMIN_URL}/users/{regular_user.id}/toggle-active",
            headers=auth_admin,
        )
        assert r.status_code == 200
        assert r.json()["is_active"] is False

    def test_list_users_as_user_forbidden(self, client, auth_user):
        r = client.get(f"{ADMIN_URL}/users", headers=auth_user)
        assert r.status_code == 403
