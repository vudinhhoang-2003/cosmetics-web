"""Tests for /api/categories endpoints."""
import pytest


CATEGORIES_URL = "/api/categories"

CAT_PAYLOAD = {"name": "Son Môi", "slug": "son-moi", "image_url": "https://example.com/img.jpg"}


class TestListCategories:
    def test_list_empty(self, client):
        r = client.get(CATEGORIES_URL)
        assert r.status_code == 200
        assert r.json() == []

    def test_list_with_data(self, client, category):
        r = client.get(CATEGORIES_URL)
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 1
        assert data[0]["slug"] == "son-moi"

    def test_list_no_auth_required(self, client, category):
        """Public endpoint — no auth needed."""
        r = client.get(CATEGORIES_URL)
        assert r.status_code == 200


class TestCreateCategory:
    def test_create_as_admin(self, client, auth_admin):
        r = client.post(CATEGORIES_URL, json=CAT_PAYLOAD, headers=auth_admin)
        assert r.status_code == 201
        data = r.json()
        assert data["name"] == CAT_PAYLOAD["name"]
        assert data["slug"] == CAT_PAYLOAD["slug"]
        assert "id" in data

    def test_create_duplicate_slug(self, client, auth_admin):
        client.post(CATEGORIES_URL, json=CAT_PAYLOAD, headers=auth_admin)
        r = client.post(CATEGORIES_URL, json=CAT_PAYLOAD, headers=auth_admin)
        assert r.status_code == 400

    def test_create_as_user_forbidden(self, client, auth_user):
        r = client.post(CATEGORIES_URL, json=CAT_PAYLOAD, headers=auth_user)
        assert r.status_code == 403

    def test_create_unauthenticated(self, client):
        r = client.post(CATEGORIES_URL, json=CAT_PAYLOAD)
        assert r.status_code == 403

    def test_create_without_image(self, client, auth_admin):
        r = client.post(CATEGORIES_URL, json={"name": "Nước Hoa", "slug": "nuoc-hoa"}, headers=auth_admin)
        assert r.status_code == 201
        assert r.json()["image_url"] is None


class TestUpdateCategory:
    def test_update_as_admin(self, client, auth_admin, category):
        r = client.put(
            f"{CATEGORIES_URL}/{category['id']}",
            json={"name": "Son Updated", "slug": "son-moi", "image_url": None},
            headers=auth_admin,
        )
        assert r.status_code == 200
        assert r.json()["name"] == "Son Updated"

    def test_update_not_found(self, client, auth_admin):
        r = client.put(
            f"{CATEGORIES_URL}/00000000-0000-0000-0000-000000000000",
            json=CAT_PAYLOAD,
            headers=auth_admin,
        )
        assert r.status_code == 404

    def test_update_as_user_forbidden(self, client, auth_user, category):
        r = client.put(
            f"{CATEGORIES_URL}/{category['id']}",
            json=CAT_PAYLOAD,
            headers=auth_user,
        )
        assert r.status_code == 403


class TestDeleteCategory:
    def test_delete_as_admin(self, client, auth_admin, category):
        r = client.delete(f"{CATEGORIES_URL}/{category['id']}", headers=auth_admin)
        assert r.status_code == 204
        assert client.get(CATEGORIES_URL).json() == []

    def test_delete_not_found(self, client, auth_admin):
        r = client.delete(
            f"{CATEGORIES_URL}/00000000-0000-0000-0000-000000000000",
            headers=auth_admin,
        )
        assert r.status_code == 404

    def test_delete_as_user_forbidden(self, client, auth_user, category):
        r = client.delete(f"{CATEGORIES_URL}/{category['id']}", headers=auth_user)
        assert r.status_code == 403
