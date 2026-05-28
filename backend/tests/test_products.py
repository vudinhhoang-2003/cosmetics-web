"""Tests for /api/products endpoints."""
import pytest


PRODUCTS_URL = "/api/products"

PRODUCT_PAYLOAD = {
    "name": "Son Đỏ Test",
    "slug": "son-do-test",
    "description": "Mô tả",
    "price": 500000,
    "stock": 10,
    "images": ["https://example.com/img.jpg"],
    "brand": "TestBrand",
    "is_active": True,
}


class TestListProducts:
    def test_list_empty(self, client):
        r = client.get(PRODUCTS_URL)
        assert r.status_code == 200
        data = r.json()
        assert data["items"] == []
        assert data["total"] == 0

    def test_list_with_products(self, client, product):
        r = client.get(PRODUCTS_URL)
        assert r.status_code == 200
        data = r.json()
        assert data["total"] == 1
        assert data["items"][0]["slug"] == product["slug"]

    def test_list_filter_by_category(self, client, product, category):
        r = client.get(PRODUCTS_URL, params={"category": category["slug"]})
        assert r.status_code == 200
        assert r.json()["total"] == 1

    def test_list_filter_by_category_no_match(self, client, product):
        r = client.get(PRODUCTS_URL, params={"category": "nonexistent"})
        assert r.status_code == 200
        assert r.json()["total"] == 0

    def test_list_search(self, client, product):
        r = client.get(PRODUCTS_URL, params={"search": "Son"})
        assert r.status_code == 200
        assert r.json()["total"] == 1

    def test_list_search_no_match(self, client, product):
        r = client.get(PRODUCTS_URL, params={"search": "zzz_no_match"})
        assert r.status_code == 200
        assert r.json()["total"] == 0

    def test_list_price_filter(self, client, product):
        r = client.get(PRODUCTS_URL, params={"min_price": 100000, "max_price": 600000})
        assert r.status_code == 200
        assert r.json()["total"] == 1

    def test_list_price_filter_exclude(self, client, product):
        r = client.get(PRODUCTS_URL, params={"min_price": 600001})
        assert r.status_code == 200
        assert r.json()["total"] == 0

    def test_list_sort_price_asc(self, client, product):
        r = client.get(PRODUCTS_URL, params={"sort": "price_asc"})
        assert r.status_code == 200

    def test_list_pagination(self, client, product):
        r = client.get(PRODUCTS_URL, params={"skip": 0, "limit": 5})
        assert r.status_code == 200
        assert r.json()["limit"] == 5


class TestGetProduct:
    def test_get_by_slug_success(self, client, product):
        r = client.get(f"{PRODUCTS_URL}/{product['slug']}")
        assert r.status_code == 200
        data = r.json()
        assert data["slug"] == product["slug"]
        assert data["name"] == product["name"]
        assert "avg_rating" in data
        assert "review_count" in data

    def test_get_by_slug_not_found(self, client):
        r = client.get(f"{PRODUCTS_URL}/slug-khong-ton-tai")
        assert r.status_code == 404


class TestCreateProduct:
    def test_create_as_admin(self, client, auth_admin, category):
        payload = {**PRODUCT_PAYLOAD, "category_id": category["id"]}
        r = client.post(PRODUCTS_URL, json=payload, headers=auth_admin)
        assert r.status_code == 201
        data = r.json()
        assert data["name"] == payload["name"]
        assert data["slug"] == payload["slug"]

    def test_create_as_user_forbidden(self, client, auth_user, category):
        payload = {**PRODUCT_PAYLOAD, "category_id": category["id"]}
        r = client.post(PRODUCTS_URL, json=payload, headers=auth_user)
        assert r.status_code == 403

    def test_create_unauthenticated(self, client, category):
        payload = {**PRODUCT_PAYLOAD, "category_id": category["id"]}
        r = client.post(PRODUCTS_URL, json=payload)
        assert r.status_code == 403  # HTTPBearer returns 403 when no credentials

    def test_create_missing_required_fields(self, client, auth_admin):
        r = client.post(PRODUCTS_URL, json={"name": "only name"}, headers=auth_admin)
        assert r.status_code == 422

    def test_create_negative_stock_rejected(self, client, auth_admin, category):
        payload = {**PRODUCT_PAYLOAD, "category_id": category["id"], "stock": -1}
        r = client.post(PRODUCTS_URL, json=payload, headers=auth_admin)
        assert r.status_code == 422


class TestUpdateProduct:
    def test_update_as_admin(self, client, auth_admin, product):
        r = client.put(f"{PRODUCTS_URL}/{product['id']}", json={"stock": 99}, headers=auth_admin)
        assert r.status_code == 200
        assert r.json()["stock"] == 99

    def test_update_negative_stock_rejected(self, client, auth_admin, product):
        r = client.put(f"{PRODUCTS_URL}/{product['id']}", json={"stock": -1}, headers=auth_admin)
        assert r.status_code == 422

    def test_update_not_found(self, client, auth_admin):
        r = client.put(
            f"{PRODUCTS_URL}/00000000-0000-0000-0000-000000000000",
            json={"stock": 5},
            headers=auth_admin,
        )
        assert r.status_code == 404

    def test_update_as_user_forbidden(self, client, auth_user, product):
        r = client.put(f"{PRODUCTS_URL}/{product['id']}", json={"stock": 5}, headers=auth_user)
        assert r.status_code == 403


class TestDeleteProduct:
    def test_delete_as_admin(self, client, auth_admin, product):
        r = client.delete(f"{PRODUCTS_URL}/{product['id']}", headers=auth_admin)
        assert r.status_code == 204
        # Should be soft-deleted (inactive), not appear in list
        r2 = client.get(PRODUCTS_URL)
        assert r2.json()["total"] == 0

    def test_delete_not_found(self, client, auth_admin):
        r = client.delete(
            f"{PRODUCTS_URL}/00000000-0000-0000-0000-000000000000",
            headers=auth_admin,
        )
        assert r.status_code == 404

    def test_delete_as_user_forbidden(self, client, auth_user, product):
        r = client.delete(f"{PRODUCTS_URL}/{product['id']}", headers=auth_user)
        assert r.status_code == 403


class TestProductReviews:
    def test_list_reviews_empty(self, client, product):
        r = client.get(f"{PRODUCTS_URL}/{product['id']}/reviews")
        assert r.status_code == 200
        assert r.json() == []

    def test_create_review_success(self, client, auth_user, product):
        r = client.post(
            f"{PRODUCTS_URL}/{product['id']}/reviews",
            json={"rating": 5, "comment": "Tuyệt vời!"},
            headers=auth_user,
        )
        assert r.status_code == 201
        data = r.json()
        assert data["rating"] == 5
        assert data["comment"] == "Tuyệt vời!"

    def test_create_review_duplicate(self, client, auth_user, product):
        """User cannot review same product twice."""
        client.post(
            f"{PRODUCTS_URL}/{product['id']}/reviews",
            json={"rating": 5},
            headers=auth_user,
        )
        r = client.post(
            f"{PRODUCTS_URL}/{product['id']}/reviews",
            json={"rating": 4},
            headers=auth_user,
        )
        assert r.status_code == 400

    def test_create_review_invalid_rating(self, client, auth_user, product):
        r = client.post(
            f"{PRODUCTS_URL}/{product['id']}/reviews",
            json={"rating": 6},
            headers=auth_user,
        )
        assert r.status_code == 422

    def test_create_review_unauthenticated(self, client, product):
        r = client.post(
            f"{PRODUCTS_URL}/{product['id']}/reviews",
            json={"rating": 5},
        )
        assert r.status_code == 403

    def test_reviews_appear_in_product(self, client, auth_user, product):
        """avg_rating and review_count are computed correctly."""
        client.post(
            f"{PRODUCTS_URL}/{product['id']}/reviews",
            json={"rating": 4, "comment": "Tốt"},
            headers=auth_user,
        )
        r = client.get(f"{PRODUCTS_URL}/{product['slug']}")
        data = r.json()
        assert data["avg_rating"] == 4.0
        assert data["review_count"] == 1
