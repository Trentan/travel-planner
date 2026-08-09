const path = require('path');
const { chromium } = require('playwright');
const { assert } = require('./lib/test-helpers');
const { startStaticServer } = require('./lib/static-server');

async function run() {
  const rootDir = path.resolve(__dirname, '..');
  const { server, baseUrl: origin } = await startStaticServer(rootDir);
  let browser = null;

  try {
    // 1. Test iOS Mobile Safari PWA Prompt
    const iosUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
    browser = await chromium.launch({ headless: true });
    
    let context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: iosUA,
      isMobile: true,
      hasTouch: true
    });
    let page = await context.newPage();

    await page.goto(`${origin}/index.html`, { waitUntil: 'domcontentloaded' });
    
    // Wait for pwa prompt to initialize (init timer is 1200ms)
    await page.waitForSelector('#pwaPromptModal', { state: 'visible', timeout: 5000 });
    
    const iosTitle = await page.textContent('#pwaPromptModal .pwa-prompt-title');
    assert(iosTitle.includes('Add to Home Screen'), `iOS prompt title should contain "Add to Home Screen", got: "${iosTitle}"`);
    
    const stepsText = await page.textContent('#pwaPromptModal .pwa-prompt-steps');
    assert(stepsText.includes('Share') && stepsText.includes('Add to Home Screen'), 'iOS prompt should include step-by-step instructions');

    // Click "Got it!" dismissal
    await page.click('#pwaPromptModal .pwa-btn-primary');
    await page.waitForSelector('#pwaPromptModal', { state: 'hidden', timeout: 3000 });

    // Reload page and verify prompt remains suppressed
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1600);
    const hiddenCount = await page.locator('#pwaPromptModal').count();
    assert(hiddenCount === 0, 'Dismissed PWA prompt should not reappear after page reload');

    await context.close();

    // 2. Test Android Mobile Web Advisory
    const androidUA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
    context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: androidUA,
      isMobile: true,
      hasTouch: true
    });
    page = await context.newPage();

    await page.goto(`${origin}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#pwaPromptModal', { state: 'visible', timeout: 5000 });

    const androidTitle = await page.textContent('#pwaPromptModal .pwa-prompt-title');
    assert(androidTitle.includes('Get the Mobile App'), `Android prompt title should contain "Get the Mobile App", got: "${androidTitle}"`);

    const playBtnHref = await page.getAttribute('#pwaPromptModal .pwa-btn-play', 'href');
    assert(playBtnHref && playBtnHref.includes('play.google.com'), 'Android prompt should include Play Store URL');

    // 3. Test iOS Mobile Bottom Navigation Fixed Positioning & Accommodation Containment
    const navPos = await page.evaluate(() => {
      const el = document.querySelector('.app-tabs-nav');
      if (!el) return null;
      const style = window.getComputedStyle(el);
      return {
        position: style.position,
        bottom: style.bottom,
        zIndex: style.zIndex
      };
    });

    assert(navPos.position === 'fixed', 'Mobile tab nav should have position: fixed');
    assert(navPos.bottom === '0px', 'Mobile tab nav should be anchored at bottom: 0px');

    // Switch to Accommodation tab and verify layout containment
    await page.click('.app-tab-btn[data-tab="accom"]');
    await page.waitForTimeout(300);

    const accomContainment = await page.evaluate(() => {
      const tab = document.getElementById('tab-accom');
      if (!tab) return null;
      const style = window.getComputedStyle(tab);
      return {
        overflowAnchor: style.overflowAnchor,
        width: style.width
      };
    });

    assert(accomContainment.overflowAnchor === 'none', 'Accommodation tab should have overflow-anchor: none for stable scroll');

    console.log('iOS PWA Home Screen prompt, Android Play Store advisory, and bottom nav layout tests passed');

  } finally {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
  }
}

if (require.main === module) {
  run().catch(err => {
    console.error('iOS PWA Nav Verify test failed:', err);
    process.exit(1);
  });
}

module.exports = { run };
