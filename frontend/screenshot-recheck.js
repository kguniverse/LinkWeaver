const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push(`PAGE EXC: ${err.message}`));

  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const input = page.locator('input[placeholder*="Search"]').first();

  async function pickFirst() {
    const items = page.locator('[cmdk-item]');
    if ((await items.count()) === 0) return false;
    await items.first().click();
    await page.waitForTimeout(3500);
    return true;
  }

  // Putin (heavy graph — should now show "30 of 47", no edge labels)
  await input.fill('Vladimir Putin');
  await page.waitForTimeout(2500);
  await pickFirst();
  await page.screenshot({ path: '/tmp/recheck-putin.png' });
  console.log('snap putin');

  // Khamenei (was 0 before, should now show family tree)
  await input.fill('Khamenei');
  await page.waitForTimeout(2500);
  await pickFirst();
  await page.screenshot({ path: '/tmp/recheck-khamenei.png' });
  console.log('snap khamenei');

  // After several picks → search input should stay empty (no caption echo)
  await input.fill('Tsinghua');
  await page.waitForTimeout(2500);
  await pickFirst();
  await page.screenshot({ path: '/tmp/recheck-after-picks.png' });
  console.log('snap after picks (input should be empty)');

  // Back navigation
  const backBtn = page.locator('button[title="Back"]');
  if (await backBtn.isEnabled().catch(() => false)) {
    await backBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: '/tmp/recheck-back.png' });
    console.log('snap back (input still empty, displayPanel updates)');
  }

  console.log('errors:', errors.length);
  errors.slice(0, 5).forEach(e => console.log(' -', e.slice(0, 200)));

  await browser.close();
})();
