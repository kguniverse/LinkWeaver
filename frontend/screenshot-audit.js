const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(`CONSOLE: ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => errors.push(`PAGE EXC: ${err.message}`));
  page.on('requestfailed', (req) => {
    if (!req.url().includes('favicon')) errors.push(`REQ FAIL: ${req.url()} - ${req.failure().errorText}`);
  });

  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const input = page.locator('input[placeholder*="Search"]').first();

  async function snap(name, note) {
    await page.screenshot({ path: `/tmp/audit-${name}.png` });
    console.log(`[${name}] ${note}`);
  }

  async function pickFirst() {
    const items = page.locator('[cmdk-item]');
    if ((await items.count()) === 0) return false;
    await items.first().click();
    await page.waitForTimeout(3500);
    return true;
  }

  // === 1. Heavy entity (many connections) ===
  await input.fill('Khamenei');
  await page.waitForTimeout(2500);
  await snap('01-list-khamenei', 'list for Khamenei');
  await pickFirst();
  await snap('02-graph-khamenei', 'graph for top khamenei result');

  // === 2. Click multiple connections in DisplayPanel ===
  let connLis = page.locator('div.space-y-5 ul li');
  let connCount = await connLis.count();
  console.log('khamenei connections:', connCount);
  if (connCount >= 3) {
    await connLis.nth(2).click();
    await page.waitForTimeout(800);
    await snap('03-conn-3-clicked', '3rd connection clicked — focus moves');
  }

  // === 3. Try Back twice quickly ===
  const backBtn = page.locator('button[title="Back"]');
  if (await backBtn.isEnabled().catch(() => false)) {
    await backBtn.click();
    await page.waitForTimeout(500);
    await snap('04-back-1', 'after back 1');
    if (await backBtn.isEnabled().catch(() => false)) {
      await backBtn.click();
      await page.waitForTimeout(500);
      await snap('05-back-2', 'after back 2');
    }
  }

  // === 4. Pick something with very long name ===
  await input.fill('');
  await page.waitForTimeout(200);
  await input.fill('Ministry');
  await page.waitForTimeout(2500);
  await snap('06-list-long', 'results for Ministry — likely long names');
  await pickFirst();
  await snap('07-graph-long', 'long-name graph render');

  // === 5. Person who is just a PEP, no sanction (informational only) ===
  await input.fill('');
  await input.fill('Olaf Scholz');
  await page.waitForTimeout(2500);
  await snap('08-list-pep', 'PEP-only person');
  await pickFirst();
  await snap('09-graph-pep', 'PEP person graph');

  // === 6. Single character query (edge case) ===
  await input.fill('');
  await input.fill('a');
  await page.waitForTimeout(800);
  await snap('10-1char', 'single char — should say min 3');

  // === 7. Special chars / no-match ===
  await input.fill('');
  await input.fill('!@#$%^');
  await page.waitForTimeout(2500);
  await snap('11-special', 'special chars');

  // === 8. Resize panel (ResizablePanelGroup) — try shrinking left panel ===
  // Get the resize handle and drag
  const handles = page.locator('[role="separator"]');
  const handleCount = await handles.count();
  console.log('resize handles:', handleCount);
  if (handleCount > 0) {
    const box = await handles.first().boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x - 100, box.y + box.height / 2, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(500);
      await snap('12-shrunk-left', 'left panel shrunk');
    }
  }

  // === 9. Many connections — Putin has many ===
  await input.fill('');
  await input.fill('Vladimir Putin');
  await page.waitForTimeout(2500);
  await pickFirst();
  await snap('13-putin', 'Putin graph (many sources, few connections)');

  // === 10. Double-click on a graph node — this is the killer feature ===
  // Cytoscape uses canvas. Use cy.dblclick by getting Cytoscape via window
  await page.evaluate(() => {
    // Try to expose cy or grab a node and trigger dblclick programmatically
    // The cy instance is held in graphStore via setCyInstance
  });

  // === 11. Long search session — does the back stack overflow? ===
  for (const q of ['Iran', 'Bank', 'China', 'Korea', 'Cuba']) {
    await input.fill('');
    await input.fill(q);
    await page.waitForTimeout(2200);
    if (!(await pickFirst())) break;
  }
  await snap('14-long-history', 'after navigating through 5 entities');

  // Press back 5 times
  for (let i = 0; i < 6; i++) {
    if (!(await backBtn.isEnabled().catch(() => false))) break;
    await backBtn.click();
    await page.waitForTimeout(400);
  }
  await snap('15-back-all-the-way', 'backed all the way');

  // === 12. Forward ===
  const fwdBtn = page.locator('button[title="Forward"]');
  for (let i = 0; i < 6; i++) {
    if (!(await fwdBtn.isEnabled().catch(() => false))) break;
    await fwdBtn.click();
    await page.waitForTimeout(400);
  }
  await snap('16-forward-all-the-way', 'forwarded all the way');

  // === 13. Reload mid-state ===
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await snap('17-after-reload', 'after page reload — fresh state?');

  // === Errors summary ===
  if (errors.length) {
    console.log('\n=== ERRORS DETECTED ===');
    errors.forEach((e) => console.log(' -', e));
  } else {
    console.log('\n(no console/page errors)');
  }

  await browser.close();
})();
