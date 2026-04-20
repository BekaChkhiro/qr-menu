// Playwright smoke test for qr-menu features.
// Captures screenshots + console errors. Continues past failures to surface as much as possible.

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';
const EMAIL = 'playwright-test@local.dev';
const PASSWORD = 'TestPass123!';
const SHOTS_DIR = '/tmp/qr-menu-tests/screenshots';

const results = [];
const consoleErrors = [];
const networkErrors = [];

function record(step, status, note = '') {
  results.push({ step, status, note });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'WARN' ? '⚠️' : 'ℹ️';
  console.log(`${icon} [${step}] ${status}${note ? ` — ${note}` : ''}`);
}

async function shot(page, name) {
  try {
    await page.screenshot({ path: `${SHOTS_DIR}/${name}.png`, fullPage: false });
  } catch (err) {
    console.log(`(screenshot fail: ${name})`);
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
  });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push({ url: page.url(), text: msg.text() });
    }
  });

  page.on('response', (res) => {
    if (res.status() >= 400) {
      const url = res.url();
      // Ignore 307s which are expected (auth redirects)
      if (res.status() !== 307) {
        networkErrors.push({ status: res.status(), url });
      }
    }
  });

  // ── 1. Login ──
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await shot(page, '01-login-page');
    await page.fill('input[type="email"], input[name="email"]', EMAIL);
    await page.fill('input[type="password"], input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/, { timeout: 15000 });
    record('Login', 'PASS', `redirected to ${new URL(page.url()).pathname}`);
    await shot(page, '02-after-login');
  } catch (err) {
    record('Login', 'FAIL', err.message);
    await shot(page, '01-login-failed');
    await browser.close();
    dumpResults();
    process.exit(1);
  }

  // ── 2. Menus list ──
  try {
    await page.goto(`${BASE_URL}/admin/menus`, { waitUntil: 'networkidle' });
    await shot(page, '03-menus-list');
    const menuCards = await page.locator('a[href*="/admin/menus/"]').all();
    record('Menus list page', 'PASS', `${menuCards.length} anchor elements found`);
  } catch (err) {
    record('Menus list page', 'FAIL', err.message);
  }

  // ── 3. Find or create test menu ──
  let testMenuHref = null;
  try {
    // Look for an existing test menu
    const links = await page.locator('a[href*="/admin/menus/"]').evaluateAll((els) =>
      els.map((e) => e.getAttribute('href')).filter(Boolean)
    );
    const detailLink = links.find((h) => /\/admin\/menus\/[^/]+$/.test(h) && !h.endsWith('/new'));
    if (detailLink) {
      testMenuHref = detailLink;
      record('Find existing menu', 'PASS', testMenuHref);
    } else {
      // Create one
      await page.goto(`${BASE_URL}/admin/menus/new`, { waitUntil: 'networkidle' });
      await page.fill('input[name="name"]', 'Playwright Test Menu');
      // Wait for slug auto-generation
      await page.waitForFunction(
        () => {
          const slug = document.querySelector('input[name="slug"]');
          return slug && slug.value && slug.value.length >= 3;
        },
        { timeout: 5000 }
      );
      await shot(page, '03b-new-menu-filled');
      await page.click('button[type="submit"]');
      // Wait for URL that is /admin/menus/<id> but NOT /new
      await page.waitForURL(
        (url) =>
          /\/admin\/menus\/[^/]+$/.test(url.pathname) && !url.pathname.endsWith('/new'),
        { timeout: 15000 }
      );
      testMenuHref = new URL(page.url()).pathname;
      record('Create menu', 'PASS', testMenuHref);
    }
  } catch (err) {
    record('Find/Create menu', 'FAIL', err.message);
  }

  if (!testMenuHref) {
    await browser.close();
    dumpResults();
    process.exit(1);
  }

  // ── 4. Open menu detail ──
  try {
    await page.goto(`${BASE_URL}${testMenuHref}`, { waitUntil: 'networkidle' });
    await shot(page, '04-menu-detail');
    record('Menu detail page', 'PASS');
  } catch (err) {
    record('Menu detail page', 'FAIL', err.message);
  }

  // ── 5. Settings tab presence ──
  try {
    const settingsTab = page.locator('button[role="tab"]', { hasText: /Settings/i });
    const count = await settingsTab.count();
    if (count > 0) {
      await settingsTab.first().click();
      await page.waitForTimeout(600);
      await shot(page, '05-settings-tab');
      record('Settings tab', 'PASS');
    } else {
      record('Settings tab', 'FAIL', 'Settings tab not found');
    }
  } catch (err) {
    record('Settings tab', 'FAIL', err.message);
  }

  // ── 6. Settings sections presence ──
  const sectionsToVerify = [
    { id: 'branding', label: 'ბრენდინგი' },
    { id: 'typography', label: 'ფონტი' },
    { id: 'languages', label: 'ენები' },
    { id: 'display', label: 'ჩვენების' },
    { id: 'layout', label: 'Layout' },
    { id: 'header', label: 'Wifi' },
  ];
  for (const s of sectionsToVerify) {
    try {
      const section = page.locator('button', { hasText: s.label }).first();
      const visible = await section.isVisible();
      record(`Settings section: ${s.id}`, visible ? 'PASS' : 'FAIL', visible ? '' : 'not visible');
    } catch (err) {
      record(`Settings section: ${s.id}`, 'FAIL', err.message);
    }
  }

  // ── 7. Expand Layout section and check ALL new enums ──
  try {
    await page.locator('button', { hasText: 'Layout' }).first().click();
    await page.waitForTimeout(300);
    await shot(page, '06-layout-section');

    // Menu Layout select
    const layoutLabels = ['Linear', 'Categories First'];
    for (const l of layoutLabels) {
      const found = (await page.locator('text=' + l).count()) > 0;
      record(`Layout option: ${l}`, found ? 'PASS' : 'WARN', found ? '' : 'text not found');
    }

    // Split toggle + card style + touch effect present
    const splitLabel = await page.locator('text=Foods / Drinks split').count();
    const cardLabel = await page.locator('text=Product card style').count();
    const touchLabel = await page.locator('text=Touch effect').count();
    record('Split by type control', splitLabel > 0 ? 'PASS' : 'FAIL');
    record('Card style control', cardLabel > 0 ? 'PASS' : 'FAIL');
    record('Touch effect control', touchLabel > 0 ? 'PASS' : 'FAIL');
  } catch (err) {
    record('Layout section contents', 'FAIL', err.message);
  }

  // ── 8. Categories tab + create/duplicate ──
  try {
    await page.locator('button[role="tab"]', { hasText: /Categories|კატეგორ/ }).first().click();
    await page.waitForTimeout(400);
    await shot(page, '07-categories-tab');
    record('Categories tab', 'PASS');

    // Click Add Category button
    const addBtn = page.getByRole('button', { name: /Add|დამატე/i }).first();
    if ((await addBtn.count()) > 0) {
      await addBtn.click();
      await page.waitForTimeout(600);
      await shot(page, '08-category-dialog');

      // Check type selector presence
      const typeLabel = await page.locator('text=/ტიპი|type/i').count();
      record('Category form: type selector', typeLabel > 0 ? 'PASS' : 'FAIL');

      // Check brand + icon fields
      const brandLabel = await page.locator('text=/ბრენდი|brand/i').count();
      const iconLabel = await page.locator('text=/ხატულა|icon/i').count();
      record('Category form: brand label', brandLabel > 0 ? 'PASS' : 'FAIL');
      record('Category form: icon upload', iconLabel > 0 ? 'PASS' : 'FAIL');

      // Close dialog
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
  } catch (err) {
    record('Categories tab', 'FAIL', err.message);
  }

  // ── 9. Expand first category, check duplicate icon + products list ──
  try {
    // Expand a category (chevron)
    const chevron = page.locator('button[aria-label*="expand" i], button[aria-label*="collapse" i]').first();
    if ((await chevron.count()) > 0) {
      await chevron.click();
      await page.waitForTimeout(400);
    }

    const duplicateIcons = await page.locator('button[aria-label*="Duplicate" i]').count();
    record(
      'Duplicate buttons present',
      duplicateIcons > 0 ? 'PASS' : 'WARN',
      `count=${duplicateIcons}`
    );

    await shot(page, '09-categories-expanded');
  } catch (err) {
    record('Duplicate button check', 'FAIL', err.message);
  }

  // ── 10. Open Add Product dialog ──
  try {
    const addProductBtn = page.getByRole('button', { name: /Add product|პროდუქტი დაამატე|პროდუქტის დამატება|Add$/i }).first();
    if ((await addProductBtn.count()) > 0) {
      await addProductBtn.click();
      await page.waitForTimeout(700);
      await shot(page, '10-product-dialog');

      const checks = [
        { label: 'ribbons', re: /ribbons|ნიშნულები/i },
        { label: 'discount (old price)', re: /ძველი ფასი|discount/i },
        { label: 'vegan checkbox', re: /ვეგანური|vegan/i },
        { label: 'vegetarian checkbox', re: /ვეგეტარიანული|vegetarian/i },
        { label: 'nutrition collapsible', re: /კვებითი|nutrition/i },
        { label: 'calories input', re: /kcal|კალორიები/i },
      ];

      for (const c of checks) {
        const found = (await page.locator('text=' + c.re.source.replace(/[\\\/]/g, '')).count()) > 0
          || (await page.locator(`text=${c.re}`).count()) > 0;
        record(`Product form: ${c.label}`, found ? 'PASS' : 'WARN');
      }

      // Close dialog
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    } else {
      record('Add Product button', 'WARN', 'no add product button visible (may need to expand a category first)');
    }
  } catch (err) {
    record('Product dialog', 'FAIL', err.message);
  }

  // ── 11. QR Code Dialog ──
  try {
    const qrBtn = page.getByRole('button', { name: /QR|ქრ/i }).first();
    if ((await qrBtn.count()) > 0) {
      await qrBtn.click();
      await page.waitForTimeout(800);
      await shot(page, '11-qr-dialog');

      const hasDesignTab = (await page.locator('button[role="tab"]', { hasText: /design/i }).count()) > 0;
      const hasTemplatesTab = (await page.locator('button[role="tab"]', { hasText: /templates/i }).count()) > 0;
      const hasExportTab = (await page.locator('button[role="tab"]', { hasText: /export/i }).count()) > 0;
      const hasSaveToMenu = (await page.locator('text=/save to menu/i').count()) > 0;

      record('QR: Design tab', hasDesignTab ? 'PASS' : 'FAIL');
      record('QR: Templates tab', hasTemplatesTab ? 'PASS' : 'FAIL');
      record('QR: Export tab', hasExportTab ? 'PASS' : 'FAIL');
      record('QR: Save to menu button', hasSaveToMenu ? 'PASS' : 'FAIL');

      // Click Templates tab
      if (hasTemplatesTab) {
        await page.locator('button[role="tab"]', { hasText: /templates/i }).click();
        await page.waitForTimeout(400);
        await shot(page, '12-qr-templates');
      }

      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    } else {
      record('QR button', 'FAIL', 'not found');
    }
  } catch (err) {
    record('QR dialog', 'FAIL', err.message);
  }

  // ── 11.5: Create category + product via API, then verify rendering ──
  const menuId = testMenuHref.split('/').pop();
  let createdCategoryId = null;

  // Use page fetch (carries session cookies)
  try {
    const catResp = await page.evaluate(async (mid) => {
      const r = await fetch(`/api/menus/${mid}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameKa: 'ცხელი საჭმელი',
          nameEn: 'Hot Foods',
          nameRu: 'Горячая еда',
          type: 'FOOD',
          brandLabel: 'Test Kitchen',
        }),
      });
      return { ok: r.ok, status: r.status, data: await r.json().catch(() => null) };
    }, menuId);

    if (catResp.ok && catResp.data?.data?.id) {
      createdCategoryId = catResp.data.data.id;
      record('API create category (with type=FOOD)', 'PASS', `id=${createdCategoryId}`);
    } else {
      record('API create category', 'FAIL', `status=${catResp.status}`);
    }
  } catch (err) {
    record('API create category', 'FAIL', err.message);
  }

  if (createdCategoryId) {
    try {
      const prodResp = await page.evaluate(
        async ({ mid, cid }) => {
          const r = await fetch(`/api/menus/${mid}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              categoryId: cid,
              nameKa: 'ხინკალი',
              nameEn: 'Khinkali',
              price: 18.5,
              oldPrice: 22.0,
              ribbons: ['POPULAR', 'CHEF_CHOICE'],
              allergens: ['GLUTEN', 'DAIRY'],
              isVegetarian: true,
              calories: 320,
              protein: 15,
              fats: 10,
              carbs: 40,
              fiber: 3,
              descriptionKa: 'გემრიელი ხინკალი თავადური რეცეპტით',
              isAvailable: true,
            }),
          });
          return { ok: r.ok, status: r.status, data: await r.json().catch(() => null) };
        },
        { mid: menuId, cid: createdCategoryId }
      );

      if (prodResp.ok) {
        record(
          'API create product (full fields)',
          'PASS',
          'ribbons + allergens + discount + nutrition'
        );
      } else {
        record(
          'API create product',
          'FAIL',
          `status=${prodResp.status} body=${JSON.stringify(prodResp.data).slice(0, 200)}`
        );
      }
    } catch (err) {
      record('API create product', 'FAIL', err.message);
    }
  }

  // ── 11.7: Publish menu ──
  try {
    const pubResp = await page.evaluate(async (mid) => {
      const r = await fetch(`/api/menus/${mid}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publish: true }),
      });
      return { ok: r.ok, status: r.status };
    }, menuId);
    record('Publish menu', pubResp.ok ? 'PASS' : 'FAIL', `status=${pubResp.status}`);
  } catch (err) {
    record('Publish menu', 'FAIL', err.message);
  }

  // ── 12. Public menu (if published) ──
  try {
    // Extract slug from menu URL
    const slugFromUrl = testMenuHref.split('/').pop();

    // Try to read menu info via the detail page
    const slugEl = await page.locator('p:has-text("/"):below(h1)').first().textContent().catch(() => null);
    // Fallback: go via menu slug
    const publicUrl = `${BASE_URL}/m/${slugEl ? slugEl.replace(/^\//, '') : slugFromUrl}`;
    const publishedPage = await context.newPage();
    const resp = await publishedPage.goto(publicUrl, { waitUntil: 'networkidle' });
    await publishedPage.waitForTimeout(1500);

    if (resp && resp.status() === 200) {
      await publishedPage.screenshot({ path: `${SHOTS_DIR}/13-public-menu.png`, fullPage: true });
      record('Public menu renders', 'PASS', `HTTP 200 @ ${publicUrl}`);

      const hasInfoWidget = (await publishedPage.locator('[aria-label="Menu info"]').count()) > 0;
      const hasCarousel = (await publishedPage.locator('section[aria-label*="promo" i]').count()) > 0;
      const hasFeatured = (await publishedPage.locator('text=/Most Ordered|ხშირად შეკვეთილი|Часто/i').count()) > 0;
      const hasCategoryNav = (await publishedPage.locator('nav[aria-label="Menu categories"]').count()) > 0;

      record('Public: Info widget', hasInfoWidget ? 'PASS' : 'INFO', hasInfoWidget ? '' : 'widget hidden (no info set)');
      record('Public: Promotions carousel', hasCarousel ? 'PASS' : 'INFO', hasCarousel ? '' : 'no active promos');
      record('Public: Featured carousel', hasFeatured ? 'PASS' : 'INFO', hasFeatured ? '' : 'no ribbons=POPULAR/CHEF/DAILY products');
      record('Public: Category nav', hasCategoryNav ? 'PASS' : 'WARN', hasCategoryNav ? '' : 'maybe menu empty');

      // Product-specific checks
      const hasKhinkali = (await publishedPage.locator('text=ხინკალი').count()) > 0;
      const hasOldPriceStrike = (await publishedPage.locator('.line-through').count()) > 0;
      const hasDiscountBadge = (await publishedPage.locator('text=/-\\d+%/').count()) > 0;
      const hasBrand = (await publishedPage.locator('text=Test Kitchen').count()) > 0;
      const hasCurrencySymbol =
        (await publishedPage.locator('text=/\\d+\\.\\d+\\s*₾/').count()) > 0;

      record('Public: Product rendered', hasKhinkali ? 'PASS' : 'WARN');
      record('Public: Old price strikethrough', hasOldPriceStrike ? 'PASS' : 'WARN');
      record('Public: Discount % badge', hasDiscountBadge ? 'PASS' : 'WARN');
      record('Public: Brand label on category', hasBrand ? 'PASS' : 'WARN');
      record('Public: ₾ currency symbol', hasCurrencySymbol ? 'PASS' : 'WARN');

      // Take a final full-page screenshot
      await publishedPage.screenshot({
        path: `${SHOTS_DIR}/14-public-menu-full.png`,
        fullPage: true,
      });
    } else {
      record('Public menu renders', 'WARN', `HTTP ${resp?.status() || 'no response'} — menu may be unpublished`);
    }
  } catch (err) {
    record('Public menu', 'FAIL', err.message);
  }

  await browser.close();
  dumpResults();
}

function dumpResults() {
  console.log('\n\n════════ SUMMARY ════════');
  const pass = results.filter((r) => r.status === 'PASS').length;
  const fail = results.filter((r) => r.status === 'FAIL').length;
  const warn = results.filter((r) => r.status === 'WARN').length;
  console.log(`✅ PASS: ${pass}   ❌ FAIL: ${fail}   ⚠️ WARN: ${warn}`);

  if (fail > 0) {
    console.log('\n── FAILURES ──');
    results.filter((r) => r.status === 'FAIL').forEach((r) => {
      console.log(`  ❌ ${r.step}${r.note ? `: ${r.note}` : ''}`);
    });
  }

  if (consoleErrors.length > 0) {
    console.log(`\n── CONSOLE ERRORS (${consoleErrors.length}) ──`);
    consoleErrors.slice(0, 15).forEach((e, i) => {
      console.log(`  ${i + 1}. [${new URL(e.url).pathname}] ${e.text.slice(0, 200)}`);
    });
  }

  if (networkErrors.length > 0) {
    console.log(`\n── NETWORK ERRORS (${networkErrors.length}) ──`);
    networkErrors.slice(0, 15).forEach((e, i) => {
      console.log(`  ${i + 1}. HTTP ${e.status}: ${e.url}`);
    });
  }

  console.log(`\n📸 Screenshots: ${SHOTS_DIR}/`);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
