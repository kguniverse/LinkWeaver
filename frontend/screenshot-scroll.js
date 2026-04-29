const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const input = page.locator('input[placeholder*="Search"]').first();

  // Pick Putin — has 30 connections, longest list
  await input.fill('Vladimir Putin');
  await page.waitForTimeout(2500);
  const items = page.locator('[cmdk-item]');
  await items.first().click();
  await page.waitForTimeout(3500);
  await page.screenshot({ path: '/tmp/scroll-1-top.png' });
  console.log('snap top');

  // Find the scroll viewport in the right panel and scroll it
  // Radix ScrollArea Viewport has data-slot="scroll-area-viewport"
  const viewport = page.locator('[data-slot="scroll-area-viewport"]').last();
  const box = await viewport.boundingBox();
  console.log('viewport box:', box);

  await viewport.evaluate((el) => { el.scrollTop = 400; });
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/scroll-2-mid.png' });
  console.log('snap mid');

  await viewport.evaluate((el) => { el.scrollTop = 9999; });
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/scroll-3-bottom.png' });
  console.log('snap bottom');

  // Also try wheel scroll over the panel
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(400);
    await page.screenshot({ path: '/tmp/scroll-4-wheel.png' });
    console.log('snap after wheel');
  }

  await browser.close();
})();
