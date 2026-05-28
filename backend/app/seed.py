"""Seed sample data into the database."""
import os
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User
from app.models.category import Category
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.models.review import Review


def seed():
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            print("Database already seeded. Skipping.")
            return

        print("Seeding database...")

        # ── Users ─────────────────────────────────────────────────────────────
        admin = User(
            email="admin@luxebeauty.vn",
            password_hash=hash_password("Admin@2026"),
            full_name="Admin LuxeBeauty",
            role="admin",
        )
        db.add(admin)

        customer = User(
            email="customer@example.com",
            password_hash=hash_password("Customer@2026"),
            full_name="Nguyễn Thị Lan",
            phone="0901234567",
            role="customer",
        )
        db.add(customer)

        customer2 = User(
            email="minh@example.com",
            password_hash=hash_password("Customer@2026"),
            full_name="Trần Văn Minh",
            phone="0912345678",
            role="customer",
        )
        db.add(customer2)
        db.flush()

        # ── Categories ────────────────────────────────────────────────────────
        categories_data = [
            {"name": "Son Môi",         "slug": "son-moi",         "image_url": "https://images.unsplash.com/photo-1586495777744-4e6232bf2f8f?w=600"},
            {"name": "Kem Dưỡng Da",    "slug": "kem-duong-da",    "image_url": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600"},
            {"name": "Nước Hoa",        "slug": "nuoc-hoa",        "image_url": "https://images.unsplash.com/photo-1541643600914-78b084683702?w=600"},
            {"name": "Phấn Trang Điểm", "slug": "phan-trang-diem", "image_url": "https://images.unsplash.com/photo-1583241475880-083f84372725?w=600"},
            {"name": "Mascara & Mắt",   "slug": "mascara-mat",     "image_url": "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600"},
            {"name": "Chăm Sóc Da",     "slug": "cham-soc-da",     "image_url": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600"},
        ]

        cats = {}
        for c in categories_data:
            cat = Category(**c)
            db.add(cat)
            db.flush()
            cats[c["slug"]] = cat

        # ── Products ──────────────────────────────────────────────────────────
        products_data = [
            # Son Môi — 8 sản phẩm (index 0-7)
            {
                "name": "Son Dior Rouge 999 Matte",
                "slug": "son-dior-rouge-999-matte",
                "description": "Son lì đỏ quyến rũ cổ điển từ Dior, màu sắc bền lâu suốt 12 giờ. Chất son mịn, không khô môi, mang lại vẻ đẹp sang trọng và tự tin.",
                "price": 1250000, "sale_price": 1050000, "stock": 45,
                "images": ["https://images.unsplash.com/photo-1586495777744-4e6232bf2f8f?w=600",
                           "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600"],
                "brand": "Dior", "category_slug": "son-moi",
            },
            {
                "name": "Son Chanel Rouge Allure N°52",
                "slug": "son-chanel-rouge-allure-52",
                "description": "Son lì Chanel với màu hồng nude thanh lịch, phù hợp mọi tông da. Công thức dưỡng ẩm giúp môi mềm mại suốt cả ngày.",
                "price": 1380000, "stock": 30,
                "images": ["https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600",
                           "https://images.unsplash.com/photo-1586495777744-4e6232bf2f8f?w=600"],
                "brand": "Chanel", "category_slug": "son-moi",
            },
            {
                "name": "Son MAC Ruby Woo",
                "slug": "son-mac-ruby-woo",
                "description": "Son lì đỏ tươi MAC Ruby Woo — bestseller toàn cầu. Màu sắc tươi sáng, bền màu đến 8 giờ, lý tưởng cho mọi dịp.",
                "price": 650000, "stock": 80,
                "images": ["https://images.unsplash.com/photo-1586495777744-4e6232bf2f8f?w=600"],
                "brand": "MAC", "category_slug": "son-moi",
            },
            {
                "name": "Son YSL Rouge Pur Couture N°1",
                "slug": "son-ysl-rouge-pur-couture-1",
                "description": "Son bóng cao cấp Yves Saint Laurent, màu đỏ thuần khiết biểu tượng. Chất son dưỡng ẩm, mang lại vẻ đẹp quyến rũ và sang trọng.",
                "price": 1450000, "sale_price": 1250000, "stock": 25,
                "images": ["https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600"],
                "brand": "YSL", "category_slug": "son-moi",
            },
            {
                "name": "Son Charlotte Tilbury Pillow Talk",
                "slug": "son-charlotte-tilbury-pillow-talk",
                "description": "Son nude hồng huyền thoại từ Charlotte Tilbury, màu sắc universal phù hợp mọi tông da. Chất kem mịn, bền màu và dưỡng ẩm.",
                "price": 1150000, "stock": 55,
                "images": ["https://images.unsplash.com/photo-1586495777744-4e6232bf2f8f?w=600"],
                "brand": "Charlotte Tilbury", "category_slug": "son-moi",
            },
            {
                "name": "Son Givenchy Le Rouge 306",
                "slug": "son-givenchy-le-rouge-306",
                "description": "Son lì Givenchy với sắc đỏ cam thời thượng, chất son mịn như nhung. Hương thơm nhẹ nhàng từ hoa violet trắng đặc trưng của thương hiệu.",
                "price": 1320000, "sale_price": 1120000, "stock": 20,
                "images": ["https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600"],
                "brand": "Givenchy", "category_slug": "son-moi",
            },
            {
                "name": "Son Lancôme L'Absolu Rouge 132",
                "slug": "son-lancome-labsolu-rouge-132",
                "description": "Son lì Lancôme với màu hồng berry sang trọng, công thức hyaluronic acid giữ ẩm môi suốt 12 giờ. Chất son mịn, không lem.",
                "price": 980000, "stock": 40,
                "images": ["https://images.unsplash.com/photo-1586495777744-4e6232bf2f8f?w=600"],
                "brand": "Lancôme", "category_slug": "son-moi",
            },
            {
                "name": "Son Guerlain Rouge G N°214",
                "slug": "son-guerlain-rouge-g-214",
                "description": "Son Guerlain với vỏ hộp đính đá Swarovski sang trọng. Màu hồng đào nhẹ nhàng, chất son bán lì, dưỡng ẩm tối ưu.",
                "price": 1580000, "stock": 15,
                "images": ["https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600"],
                "brand": "Guerlain", "category_slug": "son-moi",
            },

            # Kem Dưỡng Da — 6 sản phẩm (index 8-13)
            {
                "name": "Kem Dưỡng Ẩm La Mer Crème",
                "slug": "kem-duong-am-la-mer-creme",
                "description": "Kem dưỡng ẩm cao cấp từ La Mer với công nghệ Miracle Broth™ độc quyền. Phục hồi và trẻ hoá da, giảm nếp nhăn sau 4 tuần sử dụng đều đặn.",
                "price": 4500000, "sale_price": 3900000, "stock": 20,
                "images": ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600"],
                "brand": "La Mer", "category_slug": "kem-duong-da",
            },
            {
                "name": "Kem Mắt Estée Lauder Advanced Night Repair",
                "slug": "kem-mat-estee-lauder-advanced-night-repair",
                "description": "Kem dưỡng mắt phục hồi ban đêm từ Estée Lauder, giảm quầng thâm và nếp nhăn hiệu quả. Công thức ChronoluxCB™ kích hoạt tái tạo da theo nhịp sinh học.",
                "price": 1850000, "stock": 35,
                "images": ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600"],
                "brand": "Estée Lauder", "category_slug": "kem-duong-da",
            },
            {
                "name": "Serum Vitamin C SK-II Pitera",
                "slug": "serum-vitamin-c-sk-ii-pitera",
                "description": "Serum làm sáng da với 90% Pitera và Vitamin C nguyên chất từ SK-II. Giảm thâm nám, đều màu da và tăng cường độ ẩm sau 4 tuần.",
                "price": 2800000, "sale_price": 2350000, "stock": 25,
                "images": ["https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600"],
                "brand": "SK-II", "category_slug": "kem-duong-da",
            },
            {
                "name": "Kem Dưỡng Sulwhasoo Concentrated Ginseng",
                "slug": "kem-duong-sulwhasoo-concentrated-ginseng",
                "description": "Kem dưỡng nhân sâm Hàn Quốc từ Sulwhasoo, chiết xuất nhân sâm 6 năm tuổi giúp trẻ hoá và làm dày da. Hương thảo mộc đặc trưng, kết cấu mịn nhung.",
                "price": 3200000, "stock": 18,
                "images": ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600"],
                "brand": "Sulwhasoo", "category_slug": "kem-duong-da",
            },
            {
                "name": "Serum Retinol Sisley Paris Sisleÿa",
                "slug": "serum-retinol-sisley-paris-sisleya",
                "description": "Serum chống lão hoá cao cấp từ Sisley Paris, kết hợp Retinol và chiết xuất thực vật quý hiếm. Làm mờ nếp nhăn, tăng độ đàn hồi sau 8 tuần.",
                "price": 5800000, "sale_price": 5200000, "stock": 10,
                "images": ["https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600"],
                "brand": "Sisley Paris", "category_slug": "kem-duong-da",
            },
            {
                "name": "Kem Dưỡng Clé de Peau Beauté La Crème",
                "slug": "kem-duong-cle-de-peau-beaute-la-creme",
                "description": "Kem dưỡng đỉnh cao từ Clé de Peau Beauté, công nghệ Skin-Empowering Illuminator giúp da sáng rạng ngời. Mùi hương độc quyền từ hoa iris và hoa hồng.",
                "price": 7500000, "stock": 8,
                "images": ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600"],
                "brand": "Clé de Peau Beauté", "category_slug": "kem-duong-da",
            },

            # Nước Hoa — 6 sản phẩm (index 14-19)
            {
                "name": "Nước Hoa Chanel N°5 EDP",
                "slug": "nuoc-hoa-chanel-n5-edp",
                "description": "Huyền thoại nước hoa thế giới — Chanel N°5. Hương hoa aldehyde kinh điển, sang trọng vĩnh cửu với nốt hương ylang-ylang, hoa hồng và xạ hương.",
                "price": 3200000, "stock": 15,
                "images": ["https://images.unsplash.com/photo-1541643600914-78b084683702?w=600"],
                "brand": "Chanel", "category_slug": "nuoc-hoa",
            },
            {
                "name": "Nước Hoa Dior Sauvage EDP",
                "slug": "nuoc-hoa-dior-sauvage-edp",
                "description": "Nước hoa nam tính từ Dior với hương bergamot Calabria và ambroxan gỗ hoang dã. Mạnh mẽ, cuốn hút và để lại dư hương lâu bền.",
                "price": 2900000, "stock": 18,
                "images": ["https://images.unsplash.com/photo-1541643600914-78b084683702?w=600"],
                "brand": "Dior", "category_slug": "nuoc-hoa",
            },
            {
                "name": "Nước Hoa Tom Ford Black Orchid",
                "slug": "nuoc-hoa-tom-ford-black-orchid",
                "description": "Nước hoa unisex huyền bí từ Tom Ford, hương lan đen quyến rũ với nốt hương truffle, ylang-ylang và patchouli đất. Biểu tượng của sự sang trọng.",
                "price": 4800000, "sale_price": 4200000, "stock": 12,
                "images": ["https://images.unsplash.com/photo-1541643600914-78b084683702?w=600"],
                "brand": "Tom Ford", "category_slug": "nuoc-hoa",
            },
            {
                "name": "Nước Hoa Guerlain Mon Guerlain EDP",
                "slug": "nuoc-hoa-guerlain-mon-guerlain-edp",
                "description": "Nước hoa nữ từ Guerlain với hương oải hương Provence và vani Madagascar tự nhiên. Nhẹ nhàng, lãng mạn và tinh tế — lý tưởng cho phụ nữ hiện đại.",
                "price": 2650000, "stock": 22,
                "images": ["https://images.unsplash.com/photo-1541643600914-78b084683702?w=600"],
                "brand": "Guerlain", "category_slug": "nuoc-hoa",
            },
            {
                "name": "Nước Hoa Lancôme La Vie Est Belle",
                "slug": "nuoc-hoa-lancome-la-vie-est-belle",
                "description": "Nước hoa biểu tượng của Lancôme với hương hoa iris, hoa hồng và jasmine Sambac tinh khiết. Tươi mới, hạnh phúc và đầy nữ tính.",
                "price": 2450000, "sale_price": 2150000, "stock": 28,
                "images": ["https://images.unsplash.com/photo-1541643600914-78b084683702?w=600"],
                "brand": "Lancôme", "category_slug": "nuoc-hoa",
            },
            {
                "name": "Nước Hoa YSL Libre Intense EDP",
                "slug": "nuoc-hoa-ysl-libre-intense-edp",
                "description": "Nước hoa Libre Intense từ YSL, phiên bản mạnh mẽ hơn với hương oải hương Maroc và hoa cam bergamot. Biểu tượng của tự do và sức mạnh nữ tính.",
                "price": 3100000, "stock": 16,
                "images": ["https://images.unsplash.com/photo-1541643600914-78b084683702?w=600"],
                "brand": "YSL", "category_slug": "nuoc-hoa",
            },

            # Phấn Trang Điểm — 5 sản phẩm (index 20-24)
            {
                "name": "Phấn Phủ Dior Forever Cushion",
                "slug": "phan-phu-dior-forever-cushion",
                "description": "Phấn nước Dior Forever kiểm soát dầu 24h, lớp nền mịn màng không tạo vệt. SPF 35 PA+++ bảo vệ da khỏi tia UV, phù hợp khí hậu nhiệt đới.",
                "price": 1680000, "sale_price": 1450000, "stock": 60,
                "images": ["https://images.unsplash.com/photo-1583241475880-083f84372725?w=600"],
                "brand": "Dior", "category_slug": "phan-trang-diem",
            },
            {
                "name": "Kem Nền Chanel Les Beiges Foundation",
                "slug": "kem-nen-chanel-les-beiges-foundation",
                "description": "Kem nền tự nhiên từ Chanel với công thức Camellia Water giúp da ẩm mướt, lớp phủ mỏng nhẹ như da thật. Che phủ vừa phải, tự nhiên và sang trọng.",
                "price": 1950000, "stock": 35,
                "images": ["https://images.unsplash.com/photo-1583241475880-083f84372725?w=600"],
                "brand": "Chanel", "category_slug": "phan-trang-diem",
            },
            {
                "name": "Phấn Má Hồng NARS Orgasm",
                "slug": "phan-ma-hong-nars-orgasm",
                "description": "Phấn má hồng bestseller toàn cầu từ NARS với màu đào ánh vàng. Tạo hiệu ứng gò má tự nhiên, rạng rỡ và quyến rũ cho mọi tông da.",
                "price": 780000, "stock": 50,
                "images": ["https://images.unsplash.com/photo-1583241475880-083f84372725?w=600"],
                "brand": "NARS", "category_slug": "phan-trang-diem",
            },
            {
                "name": "Phấn Highlight Charlotte Tilbury Bar of Gold",
                "slug": "phan-highlight-charlotte-tilbury-bar-of-gold",
                "description": "Phấn highlight vàng ánh từ Charlotte Tilbury, tạo hiệu ứng da rạng rỡ như tắm nắng. Dạng bột mịn dễ tán, bền màu cả ngày.",
                "price": 920000, "sale_price": 820000, "stock": 40,
                "images": ["https://images.unsplash.com/photo-1583241475880-083f84372725?w=600"],
                "brand": "Charlotte Tilbury", "category_slug": "phan-trang-diem",
            },
            {
                "name": "Phấn Mắt Urban Decay Naked Palette",
                "slug": "phan-mat-urban-decay-naked-palette",
                "description": "Bảng màu mắt 12 ô huyền thoại từ Urban Decay với tông nude nâu đa dạng. Từ ánh mờ nhẹ nhàng đến ánh kim rực rỡ, phù hợp mọi phong cách.",
                "price": 1350000, "stock": 30,
                "images": ["https://images.unsplash.com/photo-1583241475880-083f84372725?w=600"],
                "brand": "Urban Decay", "category_slug": "phan-trang-diem",
            },

            # Mascara & Mắt — 3 sản phẩm (index 25-27)
            {
                "name": "Mascara Lancôme Hypnôse",
                "slug": "mascara-lancome-hypnose",
                "description": "Mascara kéo dài mi volumizing từ Lancôme, công thức không thấm nước. Ánh nhìn hút hồn, mi dài và cong vút từ sáng đến tối.",
                "price": 750000, "stock": 40,
                "images": ["https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600"],
                "brand": "Lancôme", "category_slug": "mascara-mat",
            },
            {
                "name": "Kẻ Mắt Chanel Stylo Yeux",
                "slug": "ke-mat-chanel-stylo-yeux",
                "description": "Bút kẻ mắt Chanel Stylo Yeux với đầu kẻ mịn, màu đen sâu lâu trôi. Chống thấm nước, không bị lem và dễ tạo đường kẻ sắc nét hay smoky mềm mại.",
                "price": 680000, "sale_price": 580000, "stock": 55,
                "images": ["https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600"],
                "brand": "Chanel", "category_slug": "mascara-mat",
            },
            {
                "name": "Dầu Dưỡng Mi Talika Lipocils Expert",
                "slug": "dau-duong-mi-talika-lipocils-expert",
                "description": "Serum dưỡng mi chuyên sâu từ Talika, kích thích mọc mi tự nhiên. Sau 28 ngày mi dài hơn 40%, dày hơn 53%. Không cần thuốc kê đơn.",
                "price": 1200000, "stock": 25,
                "images": ["https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600"],
                "brand": "Talika", "category_slug": "mascara-mat",
            },

            # Chăm Sóc Da — 4 sản phẩm (index 28-31)
            {
                "name": "Tẩy Trang Bioderma Sensibio H2O",
                "slug": "tay-trang-bioderma-sensibio-h2o",
                "description": "Nước tẩy trang micellar nổi tiếng từ Bioderma, phù hợp da nhạy cảm. Làm sạch sâu, không gây kích ứng, không cần rửa lại — được da liễu khuyên dùng.",
                "price": 380000, "sale_price": 320000, "stock": 100,
                "images": ["https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600"],
                "brand": "Bioderma", "category_slug": "cham-soc-da",
            },
            {
                "name": "Kem Chống Nắng Shiseido Anessa SPF50+",
                "slug": "kem-chong-nang-shiseido-anessa-spf50",
                "description": "Kem chống nắng cao cấp từ Shiseido Anessa, SPF50+ PA++++. Công nghệ Auto Booster tự tăng cường khi tiếp xúc mồ hôi hay nước. Không nhờn, không trắng da.",
                "price": 650000, "stock": 75,
                "images": ["https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600"],
                "brand": "Shiseido", "category_slug": "cham-soc-da",
            },
            {
                "name": "Mặt Nạ Innisfree Jeju Volcanic",
                "slug": "mat-na-innisfree-jeju-volcanic",
                "description": "Mặt nạ đất sét núi lửa Jeju từ Innisfree, hút bã nhờn và bụi bẩn sâu trong lỗ chân lông. Da mịn màng, thông thoáng ngay sau lần dùng đầu tiên.",
                "price": 220000, "sale_price": 185000, "stock": 150,
                "images": ["https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600"],
                "brand": "Innisfree", "category_slug": "cham-soc-da",
            },
            {
                "name": "Toner Klairs Supple Preparation Unscented",
                "slug": "toner-klairs-supple-preparation-unscented",
                "description": "Toner cân bằng da không mùi từ Klairs, an toàn cho da siêu nhạy cảm. pH 5.5, công thức 11 thành phần dưỡng ẩm và làm dịu da sau làm sạch.",
                "price": 420000, "stock": 90,
                "images": ["https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600"],
                "brand": "Klairs", "category_slug": "cham-soc-da",
            },
        ]

        products = []
        for pd in products_data:
            cat_slug = pd.pop("category_slug")
            p = Product(**pd, category_id=cats[cat_slug].id)
            db.add(p)
            db.flush()
            products.append(p)

        # ── Orders ────────────────────────────────────────────────────────────
        # Địa chỉ giao hàng mẫu
        addr_lan = {
            "full_name": "Nguyễn Thị Lan",
            "phone": "0901234567",
            "address": "123 Nguyễn Huệ",
            "district": "Quận 1",
            "city": "TP. Hồ Chí Minh",
        }
        addr_minh = {
            "full_name": "Trần Văn Minh",
            "phone": "0912345678",
            "address": "45 Lý Thường Kiệt",
            "district": "Hoàn Kiếm",
            "city": "Hà Nội",
        }

        now = datetime.utcnow()

        orders_data = [
            # customer — Lan
            {
                "user_id": customer.id,
                "status": "delivered",
                "shipping_address": addr_lan,
                "payment_method": "cod",
                "created_at": now - timedelta(days=30),
                "items": [
                    (0, 1),   # Son Dior, qty 1
                    (8, 1),   # Kem La Mer, qty 1
                ],
            },
            {
                "user_id": customer.id,
                "status": "delivered",
                "shipping_address": addr_lan,
                "payment_method": "bank_transfer",
                "created_at": now - timedelta(days=20),
                "items": [
                    (14, 1),  # Chanel N5, qty 1
                    (2,  2),  # Son MAC, qty 2
                ],
            },
            {
                "user_id": customer.id,
                "status": "delivered",
                "shipping_address": addr_lan,
                "payment_method": "cod",
                "created_at": now - timedelta(days=14),
                "items": [
                    (20, 1),  # Phấn Dior Cushion, qty 1
                    (25, 1),  # Mascara Lancôme, qty 1
                ],
            },
            {
                "user_id": customer.id,
                "status": "shipping",
                "shipping_address": addr_lan,
                "payment_method": "bank_transfer",
                "created_at": now - timedelta(days=3),
                "items": [
                    (10, 1),  # Serum SK-II, qty 1
                ],
            },
            {
                "user_id": customer.id,
                "status": "confirmed",
                "shipping_address": addr_lan,
                "payment_method": "cod",
                "created_at": now - timedelta(days=1),
                "items": [
                    (4,  1),  # Son Charlotte Tilbury, qty 1
                    (28, 2),  # Tẩy trang Bioderma, qty 2
                ],
            },
            {
                "user_id": customer.id,
                "status": "pending",
                "shipping_address": addr_lan,
                "payment_method": "cod",
                "created_at": now - timedelta(hours=6),
                "items": [
                    (31, 1),  # Toner Klairs, qty 1
                ],
            },
            {
                "user_id": customer.id,
                "status": "cancelled",
                "shipping_address": addr_lan,
                "payment_method": "bank_transfer",
                "created_at": now - timedelta(days=10),
                "items": [
                    (3, 1),   # Son YSL, qty 1
                ],
            },

            # customer2 — Minh
            {
                "user_id": customer2.id,
                "status": "delivered",
                "shipping_address": addr_minh,
                "payment_method": "bank_transfer",
                "created_at": now - timedelta(days=25),
                "items": [
                    (16, 1),  # Nước hoa Tom Ford, qty 1
                    (11, 1),  # Sulwhasoo, qty 1
                ],
            },
            {
                "user_id": customer2.id,
                "status": "delivered",
                "shipping_address": addr_minh,
                "payment_method": "cod",
                "created_at": now - timedelta(days=15),
                "items": [
                    (15, 1),  # Dior Sauvage, qty 1
                    (29, 2),  # Kem chống nắng Shiseido, qty 2
                ],
            },
            {
                "user_id": customer2.id,
                "status": "shipping",
                "shipping_address": addr_minh,
                "payment_method": "bank_transfer",
                "created_at": now - timedelta(days=2),
                "items": [
                    (22, 1),  # NARS blush, qty 1
                    (26, 1),  # Kẻ mắt Chanel, qty 1
                ],
            },
            {
                "user_id": customer2.id,
                "status": "pending",
                "shipping_address": addr_minh,
                "payment_method": "cod",
                "created_at": now - timedelta(hours=2),
                "items": [
                    (19, 1),  # YSL Libre, qty 1
                ],
            },
        ]

        for od in orders_data:
            items_spec = od.pop("items")
            total = sum(
                int(products[idx].sale_price or products[idx].price) * qty
                for idx, qty in items_spec
            )
            order = Order(total_price=total, **od)
            db.add(order)
            db.flush()

            for prod_idx, qty in items_spec:
                p = products[prod_idx]
                db.add(OrderItem(
                    order_id=order.id,
                    product_id=p.id,
                    quantity=qty,
                    price_at_purchase=p.sale_price or p.price,
                ))

        db.flush()

        # ── Reviews ───────────────────────────────────────────────────────────
        # (prod_idx, user, rating, comment)
        reviews_data = [
            # Son Môi
            (0,  customer,  5, "Sản phẩm tuyệt vời! Son mịn, bền màu và không khô môi. Rất xứng đáng với giá tiền."),
            (0,  customer2, 5, "Đóng gói sang trọng, mùi hương dễ chịu. Son lên màu chuẩn, bền cả ngày."),
            (1,  customer,  4, "Son đẹp, màu chuẩn nhưng hơi chảy khi trời nóng. Vẫn rất recommend!"),
            (2,  customer,  5, "MAC Ruby Woo là huyền thoại! Màu đỏ đẹp nhất tôi từng dùng."),
            (2,  customer2, 5, "Mua lần thứ 3 rồi, không bao giờ thất vọng. Màu đỏ chuẩn không cần chỉnh."),
            (3,  customer2, 4, "Son YSL đẹp, màu lên chuẩn. Bao bì sang trọng, thích hợp làm quà tặng."),
            (4,  customer,  5, "Pillow Talk là màu son phải có trong bộ sưu tập. Hợp mọi tông da!"),
            (5,  customer2, 4, "Givenchy chất lượng tốt, màu đẹp. Hơi đắt nhưng xứng đáng."),
            (6,  customer,  4, "Lancôme son đẹp, dưỡng ẩm tốt. Màu berry rất sang."),
            (7,  customer2, 5, "Guerlain hộp đẹp như vật trang trí. Son lên màu cực kỳ sang chảnh."),

            # Kem Dưỡng Da
            (8,  customer,  5, "La Mer xứng đáng với danh tiếng. Da mình thay đổi hẳn sau 2 tuần dùng."),
            (9,  customer,  4, "Kem mắt rất tốt, giảm quầng thâm rõ rệt. Hơi đắt nhưng chất lượng tương xứng."),
            (10, customer,  5, "Serum SK-II làm da sáng lên trông thấy. Sẽ mua lại lần 3!"),
            (10, customer2, 5, "Dùng 1 tháng thấy da đều màu và sáng hơn rõ ràng. Rất ấn tượng."),
            (11, customer2, 4, "Sulwhasoo mùi thơm rất dễ chịu, chất kem mịn. Da căng và ẩm sau khi dùng."),
            (12, customer,  5, "Sisley đắt nhưng hiệu quả thật sự, nếp nhăn mờ hẳn sau 1 tháng."),
            (13, customer2, 5, "Clé de Peau xứng danh kem dưỡng cao cấp nhất. Da sáng và mịn khác hẳn."),

            # Nước Hoa
            (14, customer,  5, "Chanel N5 là mùi hương định nghĩa sự sang trọng. Vĩnh cửu và không bao giờ lỗi thời."),
            (15, customer2, 5, "Dior Sauvage mạnh mẽ và cuốn hút. Bạn bè cứ hỏi xài nước hoa gì!"),
            (15, customer,  4, "Mùi rất đàn ông, lưu hương lâu. Thích hợp cho buổi tối và sự kiện quan trọng."),
            (16, customer2, 5, "Tom Ford Black Orchid huyền bí và quyến rũ. Không đụng hàng, mùi rất riêng."),
            (17, customer,  4, "Mon Guerlain ngọt nhẹ, thơm lâu. Phù hợp đi làm hàng ngày."),
            (18, customer2, 5, "La Vie Est Belle mùi hương hạnh phúc thật sự. Rất nữ tính và tươi sáng."),
            (19, customer,  4, "YSL Libre Intense mạnh hơn bản thường, lưu hương cả ngày. Rất ưng!"),

            # Phấn Trang Điểm
            (20, customer,  4, "Phấn nước Dior che phủ tốt, bền màu. Hơi nặng một chút so với da dầu."),
            (20, customer2, 5, "Cushion Dior đỉnh nhất tôi từng dùng. SPF35 rất tiện khi ra đường."),
            (21, customer,  4, "Chanel foundation tự nhiên, mỏng nhẹ. Phù hợp da khô hơn da dầu."),
            (22, customer2, 5, "NARS Orgasm là phấn má định nghĩa gương mặt rạng rỡ. Màu rất đẹp!"),
            (23, customer,  5, "Charlotte Tilbury highlight lung linh, không bị quá lố. Tán rất dễ."),
            (24, customer,  5, "Naked Palette là đầu tư xứng đáng. Dùng được cả ngày lẫn tối, nhiều tone màu đẹp."),
            (24, customer2, 4, "12 màu dùng được hết, không có màu thừa. Rất đáng mua."),

            # Mascara & Mắt
            (25, customer,  5, "Mascara Lancôme mi dài và cong, không lem. Dùng cả ngày không cần touch up."),
            (25, customer2, 4, "Mi dài và dày hơn rõ rệt. Tẩy trang dễ, không gây hại mi."),
            (26, customer,  5, "Kẻ mắt Chanel nét và đen sâu. Không bị nhoè dù trời nóng hay mồ hôi."),
            (27, customer2, 4, "Talika dùng 3 tuần thấy mi mọc dày hơn. Sẽ dùng hết lọ để xem full effect."),

            # Chăm Sóc Da
            (28, customer,  5, "Bioderma tẩy trang sạch hoàn toàn, kể cả mascara không thấm nước. Da không bị khô."),
            (28, customer2, 5, "Bình dân nhưng hiệu quả tuyệt vời. Mình dùng 5 năm nay không đổi sang brand khác."),
            (29, customer2, 5, "Shiseido Anessa không nhờn, không trắng da. Bảo vệ tốt cả ngày dưới trời nắng."),
            (30, customer,  4, "Innisfree mặt nạ làm sạch lỗ chân lông hiệu quả, giá lại rẻ. Rất recommend!"),
            (31, customer,  5, "Klairs toner nhẹ, thấm nhanh và không mùi. Da căng ẩm ngay sau khi dùng."),
            (31, customer2, 4, "Toner da nhạy cảm tốt nhất tôi từng dùng. Không kích ứng, cấp ẩm tốt."),
        ]

        for prod_idx, user, rating, comment in reviews_data:
            db.add(Review(
                product_id=products[prod_idx].id,
                user_id=user.id,
                rating=rating,
                comment=comment,
            ))

        db.commit()

        # Thống kê
        total_revenue = sum(
            int(products[idx].sale_price or products[idx].price) * qty
            for od in orders_data
            for idx, qty in od.get("items", [])
            if od.get("status") in ("delivered", "confirmed", "shipping")
        ) if False else "N/A"

        print("✓ Database seeded successfully!")
        print(f"  {len(products_data)} products  |  {len(categories_data)} categories")
        print(f"  {len(orders_data)} orders  |  {len(reviews_data)} reviews  |  3 users")
        print()
        print("  Accounts:")
        print("    Admin:     admin@luxebeauty.vn     / Admin@2026")
        print("    Customer:  customer@example.com    / Customer@2026")
        print("    Customer2: minh@example.com        / Customer@2026")

    except Exception as e:
        db.rollback()
        print(f"✗ Error seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
