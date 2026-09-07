const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { assert } = require('./lib/test-helpers');
const { startStaticServer } = require('./lib/static-server');

async function testManifestStructure(rootDir) {
  const manifestPath = path.join(rootDir, 'manifest.json');
  assert(fs.existsSync(manifestPath), 'manifest.json must exist');

  const manifestContent = fs.readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestContent);

  assert(Array.isArray(manifest.shortcuts), 'manifest.json must contain shortcuts array');
  assert(manifest.shortcuts.length >= 2, 'manifest.json shortcuts array must contain at least 2 items');

  const todayShortcut = manifest.shortcuts.find(s => s.short_name === 'Today' || s.name.includes("Today's Itinerary"));
  assert(todayShortcut, "Today's Itinerary shortcut must exist");
  assert(todayShortcut.url.includes('shortcut=today'), "Today's shortcut URL must include ?shortcut=today");
  assert(todayShortcut.url.includes('#itinerary'), "Today's shortcut URL must include #itinerary");
  assert(Array.isArray(todayShortcut.icons) && todayShortcut.icons.length > 0, "Today's shortcut must have icons");

  const transportShortcut = manifest.shortcuts.find(s => s.short_name === 'Transport' || s.name.includes('Transport Passes'));
  assert(transportShortcut, 'Transport Passes shortcut must exist');
  assert(transportShortcut.url.includes('shortcut=transport'), 'Transport shortcut URL must include ?shortcut=transport');
  assert(transportShortcut.url.includes('#transport'), 'Transport shortcut URL must include #transport');
  assert(Array.isArray(transportShortcut.icons) && transportShortcut.icons.length > 0, 'Transport shortcut must have icons');

  console.log('✔ manifest.json shortcuts validation passed');
}

async function testBrowserShortcutsAndOfflineBanner(rootDir) {
  const { server, baseUrl: origin } = await startStaticServer(rootDir);
  let browser = null;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true
    });

    // 1. Test ?shortcut=today#itinerary
    const page = await context.newPage();
    await page.goto(`${origin}/index.html?shortcut=today#itinerary`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => window.appInitPromise);
    await page.waitForTimeout(300);

    const activeTabToday = await page.getAttribute('.app-tab-btn.active', 'data-tab');
    assert(activeTabToday === 'itinerary', `Active tab for ?shortcut=today should be "itinerary", got "${activeTabToday}"`);

    const itineraryPaneVisible = await page.isVisible('#tab-itinerary');
    assert(itineraryPaneVisible, 'Itinerary tab pane should be visible when navigating via ?shortcut=today');

    // 2. Test ?shortcut=transport#transport
    const page2 = await context.newPage();
    await page2.goto(`${origin}/index.html?shortcut=transport#transport`, { waitUntil: 'domcontentloaded' });
    await page2.evaluate(() => window.appInitPromise);
    await page2.waitForTimeout(300);

    const activeTabTransport = await page2.getAttribute('.app-tab-btn.active', 'data-tab');
    assert(activeTabTransport === 'transport', `Active tab for ?shortcut=transport should be "transport", got "${activeTabTransport}"`);

    const transportPaneVisible = await page2.isVisible('#tab-transport');
    assert(transportPaneVisible, 'Transport tab pane should be visible when navigating via ?shortcut=transport');

    // 3. Test Offline Status Banner
    const page3 = await context.newPage();
    await page3.goto(`${origin}/index.html`, { waitUntil: 'domcontentloaded' });
    await page3.evaluate(() => window.appInitPromise);
    await page3.waitForTimeout(200);

    // Verify initially hidden when online
    let bannerDisplay = await page3.evaluate(() => {
      const banner = document.getElementById('offlineBanner');
      return banner ? window.getComputedStyle(banner).display : null;
    });
    assert(bannerDisplay === 'none', 'Offline banner should be hidden when online');

    // Simulate going offline
    await page3.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
      window.dispatchEvent(new Event('offline'));
    });
    await page3.waitForTimeout(200);

    bannerDisplay = await page3.evaluate(() => {
      const banner = document.getElementById('offlineBanner');
      return banner ? window.getComputedStyle(banner).display : null;
    });
    assert(bannerDisplay === 'flex', 'Offline banner should display flex when device goes offline');

    const bannerText = await page3.textContent('#offlineBanner');
    assert(bannerText.includes('Offline mode active') && bannerText.includes('Changes saved locally'),
      `Offline banner text should include "Offline mode active • Changes saved locally", got "${bannerText}"`);

    // Simulate coming back online
    await page3.evaluate(() => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      window.dispatchEvent(new Event('online'));
    });
    await page3.waitForTimeout(200);

    bannerDisplay = await page3.evaluate(() => {
      const banner = document.getElementById('offlineBanner');
      return banner ? window.getComputedStyle(banner).display : null;
    });
    assert(bannerDisplay === 'none', 'Offline banner should be hidden when device returns online');

    console.log('✔ Browser shortcut deep-linking and offline status banner tests passed');

  } finally {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
  }
}

async function run() {
  const rootDir = path.resolve(__dirname, '..');
  await testManifestStructure(rootDir);
  await testBrowserShortcutsAndOfflineBanner(rootDir);
  console.log('All PWA shortcuts & offline banner tests passed successfully');
}

if (require.main === module) {
  run().catch(err => {
    console.error('PWA shortcuts & offline banner test failed:', err);
    process.exit(1);
  });
}

module.exports = { run };
