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
  await page.waitForTimeout(1500);

  await page.screenshot({ path: '/tmp/lw-1-empty.png', fullPage: false });
  console.log('snap empty');

  await page.locator('input[placeholder*="Search"]').first().fill('Harbin Institute');
  await page.waitForTimeout(2500);

  await page.screenshot({ path: '/tmp/lw-2-search.png' });
  console.log('snap search');

  // cmdk uses [cmdk-item] data attr
  const items = page.locator('[cmdk-item]');
  const n = await items.count();
  console.log('items found:', n);
  if (n > 0) {
    await items.first().click();
    await page.waitForTimeout(4000);
    await page.screenshot({ path: '/tmp/lw-3-graph-hit.png' });
    console.log('snap graph');

    // also try Tsinghua (single node)
    await page.locator('input[placeholder*="Search"]').first().fill('Tsinghua');
    await page.waitForTimeout(2500);
    const items2 = page.locator('[cmdk-item]');
    if ((await items2.count()) > 0) {
      await items2.first().click();
      await page.waitForTimeout(3500);
      await page.screenshot({ path: '/tmp/lw-4-graph-tsinghua.png' });
      console.log('snap graph tsinghua');
    }

    // heavily connected: Putin
    await page.locator('input[placeholder*="Search"]').first().fill('Vladimir Putin');
    await page.waitForTimeout(2500);
    const items3 = page.locator('[cmdk-item]');
    console.log('putin items:', await items3.count());
    if ((await items3.count()) > 0) {
      await items3.first().click();
      await page.waitForTimeout(4500);
      await page.screenshot({ path: '/tmp/lw-5-graph-putin.png' });
      console.log('snap graph putin');
    }
  }

  await browser.close();
})();
