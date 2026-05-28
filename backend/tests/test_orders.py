"""Tests for /api/orders endpoints."""
import pytest


ORDERS_URL = "/api/orders"
CART_URL = "/api/cart"


def _add_to_cart(client, auth_user, product):
    client.post(CART_URL, json={"product_id": product["id"], "quantity": 2}, headers=auth_user)


SHIPPING = {
    "full_name": "Test User",
    "phone": "0901234567",
    "address": "123 Test St",
    "city": "HCM",
    "district": "Q1",
    "ward": "P1",
}


class TestCreateOrder:
    def test_create_from_cart(self, client, auth_user, product):
        _add_to_cart(client, auth_user, product)
        r = client.post(ORDERS_URL, json={"shipping_address": SHIPPING}, headers=auth_user)
        assert r.status_code == 201
        data = r.json()
        assert data["status"] == "pending"
        assert len(data["items"]) == 1
        assert data["total_price"] == product["price"] * 2

    def test_create_empty_cart(self, client, auth_user):
        r = client.post(ORDERS_URL, json={"shipping_address": SHIPPING}, headers=auth_user)
        assert r.status_code == 400

    def test_create_clears_cart(self, client, auth_user, product):
        _add_to_cart(client, auth_user, product)
        client.post(ORDERS_URL, json={"shipping_address": SHIPPING}, headers=auth_user)
        r = client.get(CART_URL, headers=auth_user)
        assert r.json()["items"] == []

    def test_create_unauthenticated(self, client):
        r = client.post(ORDERS_URL, json={"shipping_address": SHIPPING})
        assert r.status_code == 403


class TestListOrders:
    def test_list_own_orders(self, client, auth_user, product):
        _add_to_cart(client, auth_user, product)
        client.post(ORDERS_URL, json={"shipping_address": SHIPPING}, headers=auth_user)
        r = client.get(ORDERS_URL, headers=auth_user)
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 1

    def test_list_unauthenticated(self, client):
        r = client.get(ORDERS_URL)
        assert r.status_code == 403


class TestGetOrder:
    def test_get_own_order(self, client, auth_user, product):
        _add_to_cart(client, auth_user, product)
        order = client.post(ORDERS_URL, json={"shipping_address": SHIPPING}, headers=auth_user).json()
        r = client.get(f"{ORDERS_URL}/{order['id']}", headers=auth_user)
        assert r.status_code == 200
        assert r.json()["id"] == order["id"]

    def test_get_not_found(self, client, auth_user):
        r = client.get(f"{ORDERS_URL}/00000000-0000-0000-0000-000000000000", headers=auth_user)
        assert r.status_code == 404

    def test_get_other_user_order_forbidden(self, client, auth_user, auth_admin, product):
        _add_to_cart(client, auth_user, product)
        order = client.post(ORDERS_URL, json={"shipping_address": SHIPPING}, headers=auth_user).json()
        r = client.get(f"{ORDERS_URL}/{order['id']}", headers=auth_admin)
        assert r.status_code == 404


class TestAdminUpdateOrderStatus:
    def test_update_status_as_admin(self, client, auth_user, auth_admin, product):
        _add_to_cart(client, auth_user, product)
        order = client.post(ORDERS_URL, json={"shipping_address": SHIPPING}, headers=auth_user).json()
        r = client.put(
            f"{ORDERS_URL}/{order['id']}/status",
            json={"status": "confirmed"},
            headers=auth_admin,
        )
        assert r.status_code == 200
        assert r.json()["status"] == "confirmed"

    def test_update_invalid_status(self, client, auth_user, auth_admin, product):
        _add_to_cart(client, auth_user, product)
        order = client.post(ORDERS_URL, json={"shipping_address": SHIPPING}, headers=auth_user).json()
        r = client.put(
            f"{ORDERS_URL}/{order['id']}/status",
            json={"status": "invalid_status"},
            headers=auth_admin,
        )
        assert r.status_code == 400

    def test_update_status_as_user_forbidden(self, client, auth_user, product):
        _add_to_cart(client, auth_user, product)
        order = client.post(ORDERS_URL, json={"shipping_address": SHIPPING}, headers=auth_user).json()
        r = client.put(
            f"{ORDERS_URL}/{order['id']}/status",
            json={"status": "confirmed"},
            headers=auth_user,
        )
        assert r.status_code == 403
