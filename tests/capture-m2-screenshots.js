const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { startStaticServer } = require('./lib/static-server');

async function captureMilestone2Screenshots() {
  const rootDir = path.join(__dirname, '..');
  const outputDir = path.join(rootDir, 'docs', 'github-issue-assets', 'issue-193');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const serverObj = await startStaticServer(rootDir);
  const baseUrl = serverObj.baseUrl;
  console.log(`[Server] Started at ${baseUrl}`);

  const browser = await chromium.launch({ headless: true });

  try {
    // ----------------------------------------------------
    // 🖥️ DESKTOP SUITE (1440 x 900)
    // ----------------------------------------------------
    console.log('[Desktop] Capturing Desktop Viewports (1440x900)...');
    const desktopCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const dPage = await desktopCtx.newPage();

    // 1. Load App & Force Show Onboarding Modal
    await dPage.goto(`${baseUrl}/index.html`, { waitUntil: 'domcontentloaded' });
    await dPage.evaluate(() => {
      window.tripStartStep = 0;
      const modal = document.getElementById('trip-start-modal');
      if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
      }
      if (typeof window.renderTripStart === 'function') window.renderTripStart();
    });
    await dPage.waitForTimeout(400);
    await dPage.screenshot({ path: path.join(outputDir, '01-desktop-onboarding-step1.png') });
    console.log('  Captured 01-desktop-onboarding-step1.png');

    // 2. Main App View
    await dPage.evaluate(() => {
      const modal = document.getElementById('trip-start-modal');
      if (modal) modal.style.display = 'none';
    });
    await dPage.waitForTimeout(400);
    await dPage.screenshot({ path: path.join(outputDir, '02-desktop-main-view.png') });
    console.log('  Captured 02-desktop-main-view.png');

    // 3. Manage Cities Modal (Desktop)
    await dPage.evaluate(() => {
      if (typeof window.openCityDialog === 'function') window.openCityDialog();
    });
    await dPage.waitForTimeout(400);
    await dPage.screenshot({ path: path.join(outputDir, '03-desktop-manage-cities-modal.png') });
    console.log('  Captured 03-desktop-manage-cities-modal.png');

    // Close cities modal
    await dPage.evaluate(() => {
      const modal = document.getElementById('city-modal');
      if (modal) modal.style.display = 'none';
    });

    // 4. AI Builder Modal (Desktop)
    await dPage.evaluate(() => {
      const modal = document.getElementById('ai-builder-modal');
      if (modal) modal.style.display = 'flex';
    });
    await dPage.waitForTimeout(400);
    await dPage.screenshot({ path: path.join(outputDir, '04-desktop-ai-builder-modal.png') });
    console.log('  Captured 04-desktop-ai-builder-modal.png');

    await desktopCtx.close();

    // ----------------------------------------------------
    // 📱 MOBILE SUITE (390 x 844)
    // ----------------------------------------------------
    console.log('[Mobile] Capturing Mobile Viewports (390x844)...');
    const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mPage = await mobileCtx.newPage();

    // 5. Mobile Main View
    await mPage.goto(`${baseUrl}/index.html`, { waitUntil: 'domcontentloaded' });
    await mPage.evaluate(() => {
      const modal = document.getElementById('trip-start-modal');
      if (modal) modal.style.display = 'none';
    });
    await mPage.waitForTimeout(400);
    await mPage.screenshot({ path: path.join(outputDir, '05-mobile-main-view.png') });
    console.log('  Captured 05-mobile-main-view.png');

    // 6. Mobile Drawer Menu & Desktop Advisory Notice
    await mPage.evaluate(() => {
      if (typeof window.toggleMobileMenu === 'function') window.toggleMobileMenu();
    });
    await mPage.waitForTimeout(400);
    await mPage.screenshot({ path: path.join(outputDir, '06-mobile-menu-drawer-advisory.png') });
    console.log('  Captured 06-mobile-menu-drawer-advisory.png');

    // 7. Mobile Cities Modal
    await mPage.evaluate(() => {
      if (typeof window.openCityDialog === 'function') window.openCityDialog();
    });
    await mPage.waitForTimeout(400);
    await mPage.screenshot({ path: path.join(outputDir, '07-mobile-cities-modal.png') });
    console.log('  Captured 07-mobile-cities-modal.png');

    await mobileCtx.close();

  } catch (err) {
    console.error('Error capturing screenshots:', err);
  } finally {
    await browser.close();
    await serverObj.close();
  }

  console.log(`\n✅ All screenshots saved to: ${outputDir}`);
}

captureMilestone2Screenshots();
