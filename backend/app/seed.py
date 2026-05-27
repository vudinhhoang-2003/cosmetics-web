"""Seed sample data into the database."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User
from app.models.category import Category
from app.models.product import Product


def seed():
    db = SessionLocal()
    try:
        # Skip if data exists
        if db.query(User).count() > 0:
            print("Database already seeded. Skipping.")
            return

        print("Seeding database...")

        # Admin user
        admin = User(
            email="admin@luxebeauty.vn",
            password_hash=hash_password("Admin@2026"),
            full_name="Admin LuxeBeauty",
            role="admin",
        )
        db.add(admin)

        # Sample customer
        customer = User(
            email="customer@example.com",
            password_hash=hash_password("Customer@2026"),
            full_name="Nguyễn Thị Lan",
            phone="0901234567",
            role="customer",
        )
        db.add(customer)

        # Categories
        categories_data = [
            {"name": "Son Môi", "slug": "son-moi", "image_url": "https://images.unsplash.com/photo-1586495777744-4e6232bf2f8f?w=400"},
            {"name": "Kem Dưỡng Da", "slug": "kem-duong-da", "image_url": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400"},
            {"name": "Nước Hoa", "slug": "nuoc-hoa", "image_url": "https://images.unsplash.com/photo-1541643600914-78b084683702?w=400"},
            {"name": "Phấn Trang Điểm", "slug": "phan-trang-diem", "image_url": "https://images.unsplash.com/photo-1583241475880-083f84372725?w=400"},
            {"name": "Mascara & Mắt", "slug": "mascara-mat", "image_url": "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400"},
            {"name": "Chăm Sóc Da", "slug": "cham-soc-da", "image_url": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400"},
        ]

        cats = {}
        for c in categories_data:
            cat = Category(**c)
            db.add(cat)
            db.flush()
            cats[c["slug"]] = cat

        # Products
        products_data = [
            {
                "name": "Son Dior Rouge 999 Matte",
                "slug": "son-dior-rouge-999-matte",
                "description": "Son lì đỏ quyến rũ cổ điển từ Dior, màu sắc bền lâu suốt 12 giờ. Chất son mịn, không khô môi.",
                "price": 1250000,
                "sale_price": 1050000,
                "stock": 45,
                "images": [
                    "https://images.unsplash.com/photo-1586495777744-4e6232bf2f8f?w=600",
                    "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600",
                ],
                "brand": "Dior",
                "category_slug": "son-moi",
            },
            {
                "name": "Son Chanel Rouge Allure N°52",
                "slug": "son-chanel-rouge-allure-52",
                "description": "Son lì Chanel với màu hồng nude thanh lịch, phù hợp mọi tông da.",
                "price": 1380000,
                "stock": 30,
                "images": ["https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600"],
                "brand": "Chanel",
                "category_slug": "son-moi",
            },
            {
                "name": "Kem Dưỡng Ẩm La Mer Crème",
                "slug": "kem-duong-am-la-mer-creme",
                "description": "Kem dưỡng ẩm cao cấp từ La Mer với công nghệ Miracle Broth™ độc quyền. Phục hồi và trẻ hoá da.",
                "price": 4500000,
                "sale_price": 3900000,
                "stock": 20,
                "images": ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600"],
                "brand": "La Mer",
                "category_slug": "kem-duong-da",
            },
            {
                "name": "Nước Hoa Chanel N°5 EDP",
                "slug": "nuoc-hoa-chanel-n5-edp",
                "description": "Huyền thoại nước hoa thế giới - Chanel N°5. Hương hoa aldehyde kinh điển, sang trọng vĩnh cửu.",
                "price": 3200000,
                "stock": 15,
                "images": ["https://images.unsplash.com/photo-1541643600914-78b084683702?w=600"],
                "brand": "Chanel",
                "category_slug": "nuoc-hoa",
            },
            {
                "name": "Phấn Phủ Dior Forever",
                "slug": "phan-phu-dior-forever",
                "description": "Phấn phủ Dior Forever kiểm soát dầu 24h, lớp nền mịn màng, không tạo vệt.",
                "price": 980000,
                "sale_price": 850000,
                "stock": 60,
                "images": ["https://images.unsplash.com/photo-1583241475880-083f84372725?w=600"],
                "brand": "Dior",
                "category_slug": "phan-trang-diem",
            },
            {
                "name": "Mascara Lancôme Hypnôse",
                "slug": "mascara-lancome-hypnose",
                "description": "Mascara kéo dài mi volumizing, công thức không thấm nước, ánh nhìn quyến rũ.",
                "price": 750000,
                "stock": 40,
                "images": ["https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600"],
                "brand": "Lancôme",
                "category_slug": "mascara-mat",
            },
            {
                "name": "Serum Vitamin C SK-II Pitera",
                "slug": "serum-vitamin-c-sk-ii-pitera",
                "description": "Serum làm sáng da với 90% Pitera và Vitamin C nguyên chất, giảm thâm nám hiệu quả.",
                "price": 2800000,
                "sale_price": 2350000,
                "stock": 25,
                "images": ["https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600"],
                "brand": "SK-II",
                "category_slug": "cham-soc-da",
            },
            {
                "name": "Nước Hoa Dior Sauvage EDP",
                "slug": "nuoc-hoa-dior-sauvage-edp",
                "description": "Nước hoa nam tính từ Dior, hương gỗ và bergamot hoang dã, mạnh mẽ và cuốn hút.",
                "price": 2900000,
                "stock": 18,
                "images": ["https://images.unsplash.com/photo-1541643600914-78b084683702?w=600"],
                "brand": "Dior",
                "category_slug": "nuoc-hoa",
            },
            {
                "name": "Kem Mắt Estée Lauder Advanced Night Repair",
                "slug": "kem-mat-estee-lauder-advanced-night-repair",
                "description": "Kem dưỡng mắt phục hồi ban đêm, giảm quầng thâm và nếp nhăn sau 4 tuần.",
                "price": 1850000,
                "stock": 35,
                "images": ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600"],
                "brand": "Estée Lauder",
                "category_slug": "cham-soc-da",
            },
            {
                "name": "Son MAC Ruby Woo",
                "slug": "son-mac-ruby-woo",
                "description": "Son lì đỏ tươi MAC Ruby Woo - bestseller toàn cầu, màu sắc tươi sáng, bền màu.",
                "price": 650000,
                "stock": 80,
                "images": ["https://images.unsplash.com/photo-1586495777744-4e6232bf2f8f?w=600"],
                "brand": "MAC",
                "category_slug": "son-moi",
            },
        ]

        for pd in products_data:
            cat_slug = pd.pop("category_slug")
            p = Product(**pd, category_id=cats[cat_slug].id)
            db.add(p)

        db.commit()
        print("✓ Database seeded successfully!")
        print("  Admin: admin@luxebeauty.vn / Admin@2026")
        print("  Customer: customer@example.com / Customer@2026")

    except Exception as e:
        db.rollback()
        print(f"Error seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
