"""Tests for /api/cart endpoints."""
import pytest


CART_URL = "/api/cart"


class TestGetCart:
    def test_get_cart_empty(self, client, auth_user):
        r = client.get(CART_URL, headers=auth_user)
        assert r.status_code == 200
        data = r.json()
        assert data["items"] == []
        assert data["total"] == 0

    def test_get_cart_unauthenticated(self, client):
        r = client.get(CART_URL)
        assert r.status_code == 403


class TestAddToCart:
    def test_add_item_success(self, client, auth_user, product):
        r = client.post(CART_URL, json={"product_id": product["id"], "quantity": 2}, headers=auth_user)
        assert r.status_code == 201
        data = r.json()
        assert data["quantity"] == 2
        assert data["product_id"] == product["id"]

    def test_add_nonexistent_product(self, client, auth_user):
        r = client.post(
            CART_URL,
            json={"product_id": "00000000-0000-0000-0000-000000000000", "quantity": 1},
            headers=auth_user,
        )
        assert r.status_code == 404

    def test_add_exceeds_stock(self, client, auth_user, product):
        r = client.post(
            CART_URL,
            json={"product_id": product["id"], "quantity": 999},
            headers=auth_user,
        )
        assert r.status_code == 400

    def test_add_unauthenticated(self, client, product):
        r = client.post(CART_URL, json={"product_id": product["id"], "quantity": 1})
        assert r.status_code == 403

    def test_cart_total_correct(self, client, auth_user, product):
        client.post(CART_URL, json={"product_id": product["id"], "quantity": 2}, headers=auth_user)
        r = client.get(CART_URL, headers=auth_user)
        data = r.json()
        assert len(data["items"]) == 1
        assert data["total"] == product["price"] * 2


class TestUpdateCartItem:
    def test_update_quantity(self, client, auth_user, product):
        add = client.post(CART_URL, json={"product_id": product["id"], "quantity": 1}, headers=auth_user)
        item_id = add.json()["id"]
        r = client.put(f"{CART_URL}/{item_id}", json={"quantity": 3}, headers=auth_user)
        assert r.status_code == 200
        assert r.json()["quantity"] == 3

    def test_update_quantity_zero_removes_item(self, client, auth_user, product):
        add = client.post(CART_URL, json={"product_id": product["id"], "quantity": 1}, headers=auth_user)
        item_id = add.json()["id"]
        client.put(f"{CART_URL}/{item_id}", json={"quantity": 0}, headers=auth_user)
        r = client.get(CART_URL, headers=auth_user)
        assert r.json()["items"] == []

    def test_update_not_found(self, client, auth_user):
        r = client.put(
            f"{CART_URL}/00000000-0000-0000-0000-000000000000",
            json={"quantity": 1},
            headers=auth_user,
        )
        assert r.status_code == 404


class TestDeleteCartItem:
    def test_delete_item(self, client, auth_user, product):
        add = client.post(CART_URL, json={"product_id": product["id"], "quantity": 1}, headers=auth_user)
        item_id = add.json()["id"]
        r = client.delete(f"{CART_URL}/{item_id}", headers=auth_user)
        assert r.status_code == 204
        assert client.get(CART_URL, headers=auth_user).json()["items"] == []

    def test_delete_not_found(self, client, auth_user):
        r = client.delete(
            f"{CART_URL}/00000000-0000-0000-0000-000000000000",
            headers=auth_user,
        )
        assert r.status_code == 404

    def test_delete_unauthenticated(self, client):
        r = client.delete(f"{CART_URL}/00000000-0000-0000-0000-000000000000")
        assert r.status_code == 403
