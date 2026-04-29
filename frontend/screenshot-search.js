const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('PAGE ERROR:', msg.text());
  });
  page.on('pageerror', (err) => console.log('PAGE EXCEPTION:', err.message));

  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const input = page.locator('input[placeholder*="Search"]').first();

  // 1. Single-letter / 2-char input
  await input.fill('a');
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/search-1-onechar.png' });

  await input.fill('ab');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/search-2-twochar.png' });

  // 2. Rapid typing — does debounce work or do we hammer backend?
  await input.fill('');
  await input.type('Vladim', { delay: 60 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: '/tmp/search-3-vladim.png' });

  // 3. After picking, dropdown stays open?
  const items = page.locator('[cmdk-item]');
  const count = await items.count();
  console.log('items for Vladim:', count);
  if (count > 0) {
    await items.first().click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: '/tmp/search-4-after-pick.png' });
  }

  // 4. Click input again — does dropdown reappear?
  await input.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/search-5-refocus.png' });

  // 5. No-match query
  await input.fill('xqzwvbnm');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: '/tmp/search-6-nomatch.png' });

  // 6. Keyboard: clear with Esc
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/search-7-after-esc.png' });

  // 7. Keyboard: arrow + enter
  await input.fill('Iran');
  await page.waitForTimeout(2500);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(200);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(200);
  await page.screenshot({ path: '/tmp/search-8-arrow-nav.png' });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/search-9-enter.png' });

  await browser.close();
})();
