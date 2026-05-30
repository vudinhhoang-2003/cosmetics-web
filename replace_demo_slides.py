"""Replace mockup demo slides (20, 21, 22) with real screenshots."""
import re

FILE = r"f:\DOANTHUE\Son\Website_Cosmetics\LuxeBeauty_Slides.html"

with open(FILE, encoding="utf-8") as f:
    html = f.read()

# ── Inject CSS for real-demo cards ──────────────────────────────
new_css = """
/* ===== REAL DEMO (screenshots) ===== */
.real-demo-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
  flex: 1;
  min-height: 0;
}
.real-demo-card {
  background: var(--gray-50);
  border-radius: 16px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.real-demo-title {
  font-size: 16px;
  font-weight: 800;
  margin-bottom: 12px;
  color: var(--dark);
}
.real-screenshot {
  flex: 1;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid var(--gray-300);
  background: white;
  min-height: 0;
  position: relative;
}
.real-screenshot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
  display: block;
}
.real-features {
  list-style: none;
  margin-top: 12px;
  font-size: 13px;
  color: var(--gray-700);
}
.real-features li {
  padding: 4px 0;
  line-height: 1.4;
}
.real-features li::before {
  content: "✓ ";
  color: var(--pink);
  font-weight: 700;
}
"""
# Insert CSS before closing </style>
html = html.replace("</style>", new_css + "\n</style>", 1)

# ── Replacement HTML for slides 20-22 ───────────────────────────
new_block = '''<!-- ═══════════════ SLIDE 20: DEMO HOMEPAGE & PRODUCTS (REAL) ═══════════════ -->
<div class="slide">
  <div class="slide-header">
    <div class="slide-title">Demo: Trang chủ &amp; Danh sách sản phẩm</div>
    <div class="chapter-badge">CHƯƠNG 5 — DEMO (1/3)</div>
  </div>
  <div class="slide-body">
    <div class="real-demo-grid">
      <div class="real-demo-card">
        <div class="real-demo-title">🏠 Homepage — "L\\'Art de la Beauté"</div>
        <div class="real-screenshot">
          <img src="screenshots/01_homepage.png" alt="Homepage LuxeBeauty">
        </div>
        <ul class="real-features">
          <li>Hero banner phong cách tạp chí thời trang cao cấp</li>
          <li>Typography Playfair Display + Cormorant Garamond</li>
          <li>Tone màu nude / champagne sang trọng</li>
          <li>Navigation: Son môi · Chăm sóc da · Nước hoa</li>
        </ul>
      </div>
      <div class="real-demo-card">
        <div class="real-demo-title">📦 Danh sách sản phẩm</div>
        <div class="real-screenshot">
          <img src="screenshots/02_products_list.png" alt="Products List">
        </div>
        <ul class="real-features">
          <li>Sidebar lọc: danh mục, khoảng giá, thương hiệu</li>
          <li>Grid 3 cột với 9+ thương hiệu (Chanel, Dior, MAC...)</li>
          <li>Search bar realtime + sort 4 tiêu chí</li>
          <li>Layout responsive trên mọi kích thước màn hình</li>
        </ul>
      </div>
    </div>
  </div>
  <div class="slide-number">20 / 30</div>
</div>

<!-- ═══════════════ SLIDE 21: DEMO PRODUCT DETAIL & CART (REAL) ═══════════════ -->
<div class="slide">
  <div class="slide-header">
    <div class="slide-title">Demo: Chi tiết sản phẩm &amp; Giỏ hàng</div>
    <div class="chapter-badge">CHƯƠNG 5 — DEMO (2/3)</div>
  </div>
  <div class="slide-body">
    <div class="real-demo-grid">
      <div class="real-demo-card">
        <div class="real-demo-title">🔍 Chi tiết sản phẩm Chanel Rouge Allure</div>
        <div class="real-screenshot">
          <img src="screenshots/03_product_detail.png" alt="Product Detail">
        </div>
        <ul class="real-features">
          <li>Image gallery với thumbnail navigation rõ ràng</li>
          <li>Hiển thị rating sao + số lượng đánh giá</li>
          <li>Giá khuyến mãi 1.380.000₫ vs giá gốc, badge "Còn hàng"</li>
          <li>Bộ chọn số lượng + nút "Thêm vào giỏ" gold accent</li>
        </ul>
      </div>
      <div class="real-demo-card">
        <div class="real-demo-title">🛒 Giỏ hàng đầy đủ</div>
        <div class="real-screenshot">
          <img src="screenshots/06_cart_with_items.png" alt="Cart with items">
        </div>
        <ul class="real-features">
          <li>Bảng hiển thị sản phẩm đã thêm</li>
          <li>Cập nhật số lượng + xoá sản phẩm dễ dàng</li>
          <li>Tính tổng tiền realtime, đồng bộ với server</li>
          <li>Nút "Tiến hành thanh toán" nổi bật</li>
        </ul>
      </div>
    </div>
  </div>
  <div class="slide-number">21 / 30</div>
</div>

<!-- ═══════════════ SLIDE 22: DEMO CHECKOUT & AUTH (REAL) ═══════════════ -->
<div class="slide">
  <div class="slide-header">
    <div class="slide-title">Demo: Thanh toán &amp; Xác thực</div>
    <div class="chapter-badge">CHƯƠNG 5 — DEMO (3/3)</div>
  </div>
  <div class="slide-body">
    <div class="real-demo-grid">
      <div class="real-demo-card">
        <div class="real-demo-title">💳 Trang Checkout</div>
        <div class="real-screenshot">
          <img src="screenshots/06b_checkout.png" alt="Checkout">
        </div>
        <ul class="real-features">
          <li>Form địa chỉ giao hàng đầy đủ</li>
          <li>Validation realtime với React Hook Form</li>
          <li>Lựa chọn phương thức: PayOS QR Code / COD</li>
          <li>Tóm tắt đơn hàng cố định, tổng tiền rõ ràng</li>
        </ul>
      </div>
      <div class="real-demo-card">
        <div class="real-demo-title">🔐 Đăng nhập / Đăng ký</div>
        <div class="real-screenshot">
          <img src="screenshots/04_login.png" alt="Login">
        </div>
        <ul class="real-features">
          <li>Form xác thực gọn gàng, sang trọng</li>
          <li>JWT Authentication: Access + Refresh Token</li>
          <li>Phân quyền customer / admin tách bạch</li>
          <li>Bcrypt password hashing — bảo mật cao</li>
        </ul>
      </div>
    </div>
  </div>
  <div class="slide-number">22 / 30</div>
</div>'''

# Find slide 20 start and slide 23 start
m20 = re.search(r'<!-- ═+ SLIDE 20:.*?═+ -->', html)
m23 = re.search(r'<!-- ═+ SLIDE 23:.*?═+ -->', html)

assert m20 and m23, "Could not locate slide 20 or 23 markers"

before = html[:m20.start()]
after  = html[m23.start():]
html_new = before + new_block + "\n\n" + after

with open(FILE, "w", encoding="utf-8") as f:
    f.write(html_new)

print("✅ Replaced slides 20-22 with real screenshots")
print(f"   File size: {len(html_new):,} chars")
