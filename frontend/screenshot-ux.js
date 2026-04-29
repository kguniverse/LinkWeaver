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

  // 1. Empty state — should now show ⌘K hint in graph empty state and kbd in search
  await page.screenshot({ path: '/tmp/ux-1-empty.png' });
  console.log('snap 1: empty (⌘K hints)');

  // 2. Search and pick HIT to render graph
  await page.locator('input[placeholder*="Search"]').first().fill('Harbin Institute');
  await page.waitForTimeout(2500);
  const items = page.locator('[cmdk-item]');
  if ((await items.count()) > 0) {
    await items.first().click();
    await page.waitForTimeout(4000);
  }
  await page.screenshot({ path: '/tmp/ux-2-graph-with-hint.png' });
  console.log('snap 2: graph with interaction hint banner');

  // 3. Hover a non-center node to trigger tooltip
  const nodes = await page.locator('canvas').all();
  // Cytoscape uses canvas — we can't easily click specific nodes via Playwright on canvas.
  // Instead simulate hover at the centroid + offset where neighbor nodes typically sit.
  // The concentric layout puts center at viewport center; neighbors orbit around.
  const graphBox = await page.locator('.h-full > .h-full').first().boundingBox();
  // Hover slightly above center where a neighbor likely sits (concentric, startAngle -PI/2)
  if (graphBox) {
    const centerX = graphBox.x + graphBox.width / 2;
    const centerY = graphBox.y + graphBox.height / 2;
    await page.mouse.move(centerX, centerY - 130, { steps: 5 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/ux-3-hover-tooltip.png' });
    console.log('snap 3: hover tooltip');
  }

  // 4. Click first neighbor in DisplayPanel connection list
  const connectionItems = page.locator('ul li').filter({ hasText: /Person|Organization|Director|Owner|Member|associate|family/i });
  // Just grab first li in DisplayPanel ul (connections list)
  const allConnLis = page.locator('div.space-y-5 ul li');
  const connCount = await allConnLis.count();
  console.log('connection items:', connCount);
  if (connCount > 0) {
    await allConnLis.first().click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: '/tmp/ux-4-clicked-connection.png' });
    console.log('snap 4: after clicking a connection (focus moved, graph node selected, "Expand" CTA visible)');
  }

  // 5. Click "Expand network around this entity"
  const expandBtn = page.locator('button', { hasText: 'Expand network' });
  if (await expandBtn.count() > 0) {
    await expandBtn.first().click();
    await page.waitForTimeout(4000);
    await page.screenshot({ path: '/tmp/ux-5-expanded.png' });
    console.log('snap 5: graph expanded around the neighbor');
  }

  // 6. Click Back arrow
  const backBtn = page.locator('button[title="Back"]');
  if (await backBtn.count() > 0 && await backBtn.first().isEnabled()) {
    await backBtn.first().click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: '/tmp/ux-6-back.png' });
    console.log('snap 6: navigated back');
  } else {
    console.log('back button not enabled?');
  }

  // 7. Cmd+K to focus search
  await page.keyboard.press('Meta+K');
  await page.waitForTimeout(300);
  await page.keyboard.type('Putin', { delay: 30 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: '/tmp/ux-7-cmdk-search.png' });
  console.log('snap 7: cmd+k focused, typed Putin');

  await browser.close();
})();
