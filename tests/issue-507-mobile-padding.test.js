const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { assert } = require('./lib/test-helpers');
const { startStaticServer } = require('./lib/static-server');

async function runIssue507MobilePaddingTests() {
  console.log('Running Issue #507 mobile horizontal padding tests...');

  const rootDir = path.resolve(__dirname, '..');
  const responsiveCss = fs.readFileSync(path.join(rootDir, 'src/css/responsive-core.css'), 'utf8');

  // 1. Source CSS assertions: no 0.1rem or 0.15rem horizontal padding/margin on content containers
  assert(
    !/(padding-left|padding-right):\s*0\.1(5)?rem\s*!important/.test(responsiveCss),
    'Expected src/css/responsive-core.css to have no 0.1rem or 0.15rem horizontal padding on mobile content containers'
  );
  assert(
    !/(margin-left|margin-right):\s*0\.1rem\s*!important/.test(responsiveCss),
    'Expected src/css/responsive-core.css to have no 0.1rem horizontal margin on .day-card'
  );

  // 2. Live Playwright verification on MOBILE (390x844) and DESKTOP (1440x900)
  const server = await startStaticServer(rootDir);
  const browser = await chromium.launch({ headless: true });
  const backupPath = path.join(rootDir, 'backups', '2026_June_July_Europe_Thailand.json');

  try {
    // Mobile viewport check (390x844)
    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(`${server.baseUrl}/index.html`, { waitUntil: 'networkidle' });
    await mobilePage.evaluate(() => {
      window.confirm = () => true;
      window.alert = () => {};
    });
    await mobilePage.locator('#importFile').setInputFiles(backupPath);
    await mobilePage.waitForTimeout(600);

    const mobileMetrics = await mobilePage.evaluate(() => {
      const main = document.querySelector('main');
      const tabsContent = document.querySelector('.app-tabs-content');
      const timelineShell = document.querySelector('.daily-timeline-shell');
      return {
        mainPadLeft: main ? parseFloat(getComputedStyle(main).paddingLeft) : 0,
        mainPadRight: main ? parseFloat(getComputedStyle(main).paddingRight) : 0,
        tabsPadLeft: tabsContent ? parseFloat(getComputedStyle(tabsContent).paddingLeft) : 0,
        tabsPadRight: tabsContent ? parseFloat(getComputedStyle(tabsContent).paddingRight) : 0,
        timelinePadLeft: timelineShell ? parseFloat(getComputedStyle(timelineShell).paddingLeft) : null,
        overflow: document.documentElement.scrollWidth > window.innerWidth
      };
    });

    assert(
      mobileMetrics.mainPadLeft >= 7.5 && mobileMetrics.mainPadRight >= 7.5,
      `MOBILE: Expected main horizontal padding >= 0.5rem (8px), got ${mobileMetrics.mainPadLeft}px / ${mobileMetrics.mainPadRight}px`
    );
    assert(
      mobileMetrics.tabsPadLeft >= 5.2 && mobileMetrics.tabsPadRight >= 5.2,
      `MOBILE: Expected .app-tabs-content horizontal padding >= 0.35rem (5.6px), got ${mobileMetrics.tabsPadLeft}px / ${mobileMetrics.tabsPadRight}px`
    );
    if (mobileMetrics.timelinePadLeft !== null) {
      assert(
        mobileMetrics.timelinePadLeft >= 5.2,
        `MOBILE: Expected .daily-timeline-shell horizontal padding >= 0.35rem (5.6px), got ${mobileMetrics.timelinePadLeft}px`
      );
    }
    assert(!mobileMetrics.overflow, 'MOBILE: Expected no horizontal scroll overflow after increasing safe-zone padding');
    await mobileContext.close();

    // Desktop viewport sanity check (1440x900)
    const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const desktopPage = await desktopContext.newPage();
    await desktopPage.goto(`${server.baseUrl}/index.html`, { waitUntil: 'networkidle' });
    const desktopOverflow = await desktopPage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert(!desktopOverflow, 'DESKTOP: Expected no horizontal scroll overflow');
    await desktopContext.close();
  } finally {
    await browser.close();
    await server.close();
  }

  console.log('Issue #507 mobile horizontal padding tests passed!');
}

if (require.main === module) {
  runIssue507MobilePaddingTests().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { runIssue507MobilePaddingTests };
