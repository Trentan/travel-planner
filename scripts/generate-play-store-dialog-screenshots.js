const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { startStaticServer } = require('../tests/lib/static-server');

async function capturePlayStoreDialogScreenshots() {
  const rootDir = path.join(__dirname, '..');
  const outDir = path.join(rootDir, 'docs', 'play-store');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const { server, baseUrl } = await startStaticServer(rootDir);
  console.log(`[Server] running at ${baseUrl}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1080, height: 2400 },
    deviceScaleFactor: 1,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
  });

  const page = await context.newPage();

  try {
    // 1. Capture Trip Start Wizard Dialog
    console.log('[Capture] Navigating to app...');
    await page.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      if (typeof openCreateNewTripWizard === 'function') {
        openCreateNewTripWizard();
      } else {
        const modal = document.getElementById('trip-start-modal');
        if (modal) modal.style.display = 'flex';
      }
    });
    await page.waitForTimeout(800);
    const wizardPath = path.join(outDir, 'screenshot-6-trip-wizard.png');
    await page.screenshot({ path: wizardPath, fullPage: false });
    console.log(`[Capture] Saved ${wizardPath}`);

    // 2. Capture Manage Cities Dialog
    await page.evaluate(() => {
      const startModal = document.getElementById('trip-start-modal');
      if (startModal) startModal.style.display = 'none';
      if (typeof openCityDialog === 'function') {
        openCityDialog();
      } else {
        const modal = document.getElementById('city-modal');
        if (modal) modal.style.display = 'flex';
      }
    });
    await page.waitForTimeout(800);
    const citiesPath = path.join(outDir, 'screenshot-7-manage-cities.png');
    await page.screenshot({ path: citiesPath, fullPage: false });
    console.log(`[Capture] Saved ${citiesPath}`);

    // 3. Capture AI Builder Dialog
    await page.evaluate(() => {
      const cityModal = document.getElementById('city-modal');
      if (cityModal) cityModal.style.display = 'none';
      if (typeof openAIDialog === 'function') {
        openAIDialog();
      } else {
        const modal = document.getElementById('ai-modal');
        if (modal) modal.style.display = 'flex';
      }
    });
    await page.waitForTimeout(800);
    const aiPath = path.join(outDir, 'screenshot-8-ai-builder.png');
    await page.screenshot({ path: aiPath, fullPage: false });
    console.log(`[Capture] Saved ${aiPath}`);

  } catch (err) {
    console.error('[Error] Screenshot capture failed:', err);
  } finally {
    await browser.close();
    server.close();
    console.log('[Server] Closed static server');
  }
}

capturePlayStoreDialogScreenshots();
