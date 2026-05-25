const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = process.cwd();
const outDir = path.join(root, 'polish', 'screenshots', 'before');

const shots = [
  { mode:'dde', name:'dde-01-home.png', tab:'itinerary', full:true },
  { mode:'dde', name:'dde-02-menu-bar.png', selector:'.app-menu-bar' },
  { mode:'dde', name:'dde-03-header.png', selector:'header' },
  { mode:'dde', name:'dde-04-tabs.png', selector:'.app-tabs-nav' },
  { mode:'dde', name:'dde-05-itinerary.png', tab:'itinerary', selector:'#tab-itinerary' },
  { mode:'dde', name:'dde-06-transport.png', tab:'transport', selector:'#tab-transport' },
  { mode:'dde', name:'dde-07-accom.png', tab:'accom', selector:'#tab-accom' },
  { mode:'dde', name:'dde-08-budget.png', tab:'budget', selector:'#tab-budget' },
  { mode:'dde', name:'dde-09-packing.png', tab:'packing', selector:'#tab-packing' },
  { mode:'dde', name:'dde-10-map.png', tab:'map', selector:'#tab-map' },
  { mode:'dde', name:'dde-11-journey-modal.png', tab:'itinerary', click:'button[onclick*="openAddLegDialog"]', modal:'#add-leg-modal .modal-content' },
  { mode:'dde', name:'dde-12-ai-builder.png', tab:'itinerary', click:'button[onclick*="openAIDialog"]', modal:'#ai-modal .modal-content' },

  { mode:'mde', name:'mde-01-home.png', tab:'itinerary', full:true },
  { mode:'mde', name:'mde-02-header.png', selector:'.app-menu-bar' },
  { mode:'mde', name:'mde-03-tabs.png', selector:'.app-tabs-nav' },
  { mode:'mde', name:'mde-04-menu-open.png', click:'.mobile-menu-btn', selector:'#mobileMenuSheet .mobile-menu-sheet-panel' },
  { mode:'mde', name:'mde-05-itinerary.png', tab:'itinerary', selector:'#tab-itinerary' },
  { mode:'mde', name:'mde-06-transport.png', tab:'transport', selector:'#tab-transport' },
  { mode:'mde', name:'mde-07-accom.png', tab:'accom', selector:'#tab-accom' },
  { mode:'mde', name:'mde-08-budget.png', tab:'budget', selector:'#tab-budget' },
  { mode:'mde', name:'mde-09-packing.png', tab:'packing', selector:'#tab-packing' },
  { mode:'mde', name:'mde-10-map.png', tab:'map', selector:'#tab-map' },
  { mode:'mde', name:'mde-11-journey-modal-top.png', tab:'itinerary', click:'button[onclick*="openAddLegDialog"]', modal:'#add-leg-modal .modal-content' },
  { mode:'mde', name:'mde-12-ai-builder.png', tab:'itinerary', click:'button[onclick*="openAIDialog"]', modal:'#ai-modal .modal-content' },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  let created = 0, skipped = 0;
  const failed = [];

  async function setupPage(mode) {
    const context = await browser.newContext({
      viewport: mode === 'dde' ? { width: 1440, height: 900 } : { width: 390, height: 844 },
      deviceScaleFactor: mode === 'mde' ? 3 : 1,
      isMobile: mode === 'mde',
      hasTouch: mode === 'mde'
    });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:3000/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    return { context, page };
  }

  let activeMode = null;
  let context = null;
  let page = null;

  for (const s of shots) {
    const file = path.join(outDir, s.name);
    if (fs.existsSync(file)) { skipped++; continue; }

    if (activeMode !== s.mode) {
      if (context) await context.close();
      ({ context, page } = await setupPage(s.mode));
      activeMode = s.mode;
    }

    try {
      if (s.tab) {
        const sel = `.app-tab-btn[data-tab="${s.tab}"]`;
        if (await page.locator(sel).count()) {
          await page.locator(sel).first().click();
          await page.waitForTimeout(500);
        }
      }

      if (s.click) {
        if (await page.locator(s.click).count()) {
          await page.locator(s.click).first().scrollIntoViewIfNeeded().catch(() => {});
          await page.locator(s.click).first().click({ force: true });
          await page.waitForTimeout(600);
        }
      }

      if (s.full) {
        await page.screenshot({ path: file, fullPage: true });
      } else if (s.modal) {
        const loc = page.locator(s.modal).first();
        if (await loc.count()) {
          await loc.screenshot({ path: file });
        } else {
          await page.screenshot({ path: file, fullPage: false });
        }
        await page.keyboard.press('Escape').catch(() => {});
        await page.waitForTimeout(200);
      } else if (s.selector) {
        const loc = page.locator(s.selector).first();
        if (await loc.count()) {
          await loc.screenshot({ path: file });
        } else {
          await page.screenshot({ path: file, fullPage: false });
        }
      } else {
        await page.screenshot({ path: file, fullPage: false });
      }
      created++;
    } catch (err) {
      failed.push({ name: s.name, error: String(err.message || err) });
    }
  }

  if (context) await context.close();
  await browser.close();
  console.log(JSON.stringify({ created, skipped, failed, outDir }, null, 2));
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
