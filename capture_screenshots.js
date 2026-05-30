const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const BASE = 'http://localhost';

const PAGES = [
  { name: '01_homepage',          url: '/',                            wait: 2500 },
  { name: '02_products_list',     url: '/products',                    wait: 2500 },
  { name: '03_product_detail',    url: '/products',                    wait: 2500, action: 'clickFirstProduct' },
  { name: '04_login',             url: '/login',                       wait: 1500 },
  { name: '05_register',          url: '/register',                    wait: 1500 },
  { name: '06_cart_empty',        url: '/cart',                        wait: 1500 },
  { name: '07_admin_login',       url: '/admin/login',                 wait: 1500 },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  for (const p of PAGES) {
    try {
      console.log(`📸 ${p.name} → ${p.url}`);
      await page.goto(BASE + p.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(p.wait);

      if (p.action === 'clickFirstProduct') {
        try {
          // Click product card
          const link = await page.$('a[href*="/products/"]');
          if (link) {
            await link.click();
            await page.waitForLoadState('networkidle', { timeout: 15000 });
            await page.waitForTimeout(2500);
          }
        } catch (e) {
          console.log('  ⚠ Click failed:', e.message);
        }
      }

      const out = path.join(SCREENSHOT_DIR, `${p.name}.png`);
      await page.screenshot({ path: out, fullPage: false });
      console.log(`  ✓ saved ${out}`);
    } catch (err) {
      console.log(`  ✗ ${p.name} failed:`, err.message);
    }
  }

  // ─── ADMIN LOGIN & DASHBOARD ───────────────────────────
  try {
    console.log('🔐 Logging in as admin...');
    await page.goto(BASE + '/admin/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    // Try common email/password fields
    const emailField = await page.$('input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="Email" i]');
    const passField = await page.$('input[type="password"], input[name="password"]');

    if (emailField && passField) {
      await emailField.fill('admin@luxebeauty.vn');
      await passField.fill('Admin@2026');
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        await page.waitForTimeout(3500);

        // Try admin pages
        const adminPages = [
          { name: '08_admin_dashboard', url: '/admin' },
          { name: '09_admin_products',  url: '/admin/products' },
          { name: '10_admin_orders',    url: '/admin/orders' },
          { name: '11_admin_categories',url: '/admin/categories' },
          { name: '12_admin_users',     url: '/admin/users' },
        ];
        for (const ap of adminPages) {
          try {
            console.log(`📸 ${ap.name} → ${ap.url}`);
            await page.goto(BASE + ap.url, { waitUntil: 'networkidle', timeout: 30000 });
            await page.waitForTimeout(2500);
            const out = path.join(SCREENSHOT_DIR, `${ap.name}.png`);
            await page.screenshot({ path: out, fullPage: false });
            console.log(`  ✓ saved ${out}`);
          } catch (e) { console.log(`  ✗ ${ap.name}:`, e.message); }
        }
      }
    } else {
      console.log('  ⚠ Login form not found');
    }
  } catch (e) {
    console.log('Admin section error:', e.message);
  }

  await browser.close();
  console.log('\n✅ Done. Files saved to:', SCREENSHOT_DIR);
  fs.readdirSync(SCREENSHOT_DIR).forEach(f => {
    const stat = fs.statSync(path.join(SCREENSHOT_DIR, f));
    console.log(`   ${f} - ${(stat.size/1024).toFixed(0)} KB`);
  });
})();
