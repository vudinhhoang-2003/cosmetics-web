const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  const capture = async (name, url, opts = {}) => {
    try {
      console.log(`📸 ${name} → ${url}`);
      await page.goto('http://localhost' + url, { waitUntil: 'networkidle', timeout: 30000 });
      // Wait longer for skeletons / API calls
      await page.waitForTimeout(opts.wait || 5000);
      // Try waiting for products to actually load
      if (opts.waitFor) {
        try {
          await page.waitForSelector(opts.waitFor, { timeout: 10000 });
          await page.waitForTimeout(1500);
        } catch (e) { /* ignore */ }
      }
      const out = path.join(SCREENSHOT_DIR, `${name}.png`);
      await page.screenshot({ path: out, fullPage: opts.fullPage || false });
      console.log(`  ✓ ${(fs.statSync(out).size/1024).toFixed(0)} KB`);
    } catch (e) {
      console.log(`  ✗ ${name}:`, e.message);
    }
  };

  // ─── Public pages ────────────────────────────────────────
  await capture('01_homepage', '/', { wait: 4000 });
  await capture('02_products_list', '/products', { wait: 8000, waitFor: 'a[href*="/products/"]' });

  // Click first product
  try {
    const link = await page.$('a[href*="/products/"]');
    if (link) {
      const href = await link.getAttribute('href');
      console.log('🔗 Click product:', href);
      await page.goto('http://localhost' + href, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(5000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_product_detail.png') });
      console.log('  ✓ saved 03_product_detail.png');
    }
  } catch (e) { console.log('product detail error:', e.message); }

  await capture('04_login', '/login', { wait: 2500 });
  await capture('05_register', '/register', { wait: 2500 });
  await capture('06_cart_empty', '/cart', { wait: 2500 });

  // ─── Customer login + cart with item ────────────────────
  try {
    console.log('🔐 Customer login...');
    await page.goto('http://localhost/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const inputs = await page.$$('input');
    if (inputs.length >= 2) {
      await inputs[0].fill('customer@example.com');
      await inputs[1].fill('Customer@2026');
      const btn = await page.$('button[type="submit"], button:has-text("Đăng nhập")');
      if (btn) {
        await btn.click();
        await page.waitForTimeout(3500);
        console.log('  ✓ logged in as customer');

        // Add product to cart, then view cart
        await page.goto('http://localhost/products', { waitUntil: 'networkidle' });
        await page.waitForTimeout(5000);
        const productLink = await page.$('a[href*="/products/"]');
        if (productLink) {
          await productLink.click();
          await page.waitForTimeout(4000);
          // Click Add to cart
          const addBtns = await page.$$('button');
          for (const b of addBtns) {
            const t = await b.innerText().catch(()=>'');
            if (/giỏ|cart|thêm/i.test(t)) {
              await b.click();
              await page.waitForTimeout(1500);
              console.log('  ✓ added to cart');
              break;
            }
          }
          await capture('06_cart_with_items', '/cart', { wait: 3500 });
          await capture('06b_checkout', '/checkout', { wait: 3500 });
        }
      }
    }
  } catch (e) { console.log('Customer flow error:', e.message); }

  // ─── Admin login & dashboard ────────────────────────────
  await capture('07_admin_login', '/admin/login', { wait: 2500 });
  try {
    console.log('🔐 Admin login...');
    await page.goto('http://localhost/admin/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    const inputs = await page.$$('input');
    if (inputs.length >= 2) {
      await inputs[0].fill('admin@luxebeauty.vn');
      await inputs[1].fill('Admin@2026');
      const btn = await page.$('button[type="submit"]');
      if (btn) {
        await btn.click();
        await page.waitForTimeout(4500);
        console.log('  ✓ admin logged in');

        await capture('08_admin_dashboard',  '/admin',            { wait: 5000 });
        await capture('09_admin_products',   '/admin/products',   { wait: 5000 });
        await capture('10_admin_orders',     '/admin/orders',     { wait: 5000 });
        await capture('11_admin_categories', '/admin/categories', { wait: 5000 });
        await capture('12_admin_users',      '/admin/users',      { wait: 5000 });
      }
    }
  } catch (e) { console.log('Admin error:', e.message); }

  await browser.close();
  console.log('\n✅ Done. Files in', SCREENSHOT_DIR);
  fs.readdirSync(SCREENSHOT_DIR).sort().forEach(f => {
    const stat = fs.statSync(path.join(SCREENSHOT_DIR, f));
    console.log(`  ${f.padEnd(35)} ${(stat.size/1024).toFixed(0)} KB`);
  });
})();
