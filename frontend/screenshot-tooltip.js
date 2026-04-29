const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const input = page.locator('input[placeholder*="Search"]').first();

  await input.fill('Vladimir Putin');
  await page.waitForTimeout(2500);
  await page.locator('[cmdk-item]').first().click();
  await page.waitForTimeout(4000);

  // Use the exposed cy instance to find nodes nearest to each edge of the viewport
  const corners = await page.evaluate(() => {
    const cy = window.__cy;
    if (!cy) return null;
    const container = cy.container();
    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    const findNearest = (targetX, targetY) => {
      let best = null, bestDist = Infinity;
      cy.nodes().forEach((n) => {
        const p = n.renderedPosition();
        const d = Math.hypot(p.x - targetX, p.y - targetY);
        if (d < bestDist) { bestDist = d; best = { id: n.id(), x: p.x, y: p.y, label: n.data('label') }; }
      });
      return best ? { ...best, screenX: rect.left + best.x, screenY: rect.top + best.y, w, h } : null;
    };

    return {
      tl: findNearest(w * 0.15, h * 0.15),
      tr: findNearest(w * 0.85, h * 0.15),
      bl: findNearest(w * 0.15, h * 0.85),
      br: findNearest(w * 0.85, h * 0.85),
    };
  });

  console.log('corners:', corners);

  for (const [where, n] of Object.entries(corners)) {
    if (!n) continue;
    await page.mouse.move(n.screenX, n.screenY);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `/tmp/tt-${where}.png` });
    console.log(`hover ${where} (node "${n.label?.slice(0, 30)}", pos ${n.x.toFixed(0)},${n.y.toFixed(0)} of ${n.w.toFixed(0)}x${n.h.toFixed(0)})`);
    await page.mouse.move(0, 0);
    await page.waitForTimeout(200);
  }

  await browser.close();
})();
