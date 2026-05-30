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

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('  [browser err]:', msg.text().slice(0, 120));
  });
  page.on('pageerror', err => console.log('  [page err]:', err.message.slice(0, 120)));

  const capture = async (name, opts = {}) => {
    await page.waitForTimeout(opts.wait || 6000);
    const out = path.join(SCREENSHOT_DIR, `${name}.png`);
    await page.screenshot({ path: out });
    console.log(`  ✓ ${name}.png (${(fs.statSync(out).size/1024).toFixed(0)} KB)`);
  };

  console.log('🌐 Open admin login...');
  await page.goto('http://localhost/admin/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(8000); // give React time to mount
  await capture('07_admin_login');

  console.log('🔐 Try login...');
  // Find inputs more permissively
  const allInputs = await page.$$('input');
  console.log('  inputs found:', allInputs.length);

  if (allInputs.length >= 2) {
    await allInputs[0].fill('admin@luxebeauty.vn');
    await allInputs[1].fill('Admin@2026');

    // Find any button
    const buttons = await page.$$('button');
    console.log('  buttons found:', buttons.length);
    let submitted = false;
    for (const btn of buttons) {
      const txt = await btn.innerText().catch(()=>'');
      const type = await btn.getAttribute('type').catch(()=>'');
      if (type === 'submit' || /đăng nhập|login|signin/i.test(txt)) {
        console.log('  click button:', txt || type);
        await btn.click();
        submitted = true;
        break;
      }
    }
    if (!submitted && buttons.length > 0) {
      await buttons[buttons.length - 1].click();
      console.log('  clicked last button as fallback');
    }

    await page.waitForTimeout(6000);
    console.log('  current URL:', page.url());

    const adminPages = [
      ['08_admin_dashboard',  '/admin'],
      ['09_admin_products',   '/admin/products'],
      ['10_admin_orders',     '/admin/orders'],
      ['11_admin_categories', '/admin/categories'],
      ['12_admin_users',      '/admin/users'],
    ];
    for (const [name, url] of adminPages) {
      console.log(`📸 ${name} → ${url}`);
      await page.goto('http://localhost' + url, { waitUntil: 'domcontentloaded' });
      await capture(name, { wait: 7000 });
    }
  }

  await browser.close();
  console.log('\n✅ Done');
  fs.readdirSync(SCREENSHOT_DIR).sort().forEach(f => {
    const stat = fs.statSync(path.join(SCREENSHOT_DIR, f));
    console.log(`  ${f.padEnd(35)} ${(stat.size/1024).toFixed(0)} KB`);
  });
})();
