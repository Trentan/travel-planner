const { chromium } = require('playwright');
const { startStaticServer } = require('../tests/lib/static-server');
const path = require('path');
const fs = require('fs');

async function run() {
  console.log('Starting static server...');
  const server = await startStaticServer(path.resolve(__dirname, '..'));
  console.log(`Server started at ${server.baseUrl}`);

  console.log('Launching browser with iPhone 12 viewport...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  });
  const page = await context.newPage();

  console.log('Going to page...');
  await page.goto(`${server.baseUrl}/index.html`, { waitUntil: 'networkidle' });

  console.log('Enabling Dark Mode and Compact View Mode on mobile...');
  await page.evaluate(() => {
    applyTheme('dark');
    if (!document.body.classList.contains('compact-view-mode')) {
      document.body.classList.add('compact-view-mode');
      if (typeof syncModeToggleButtons === 'function') syncModeToggleButtons();
    }
    syncResponsiveUi();
  });

  await page.waitForTimeout(400);

  console.log('Clicking the Taipei swipe chip to load Taipei leg...');
  // Click Taipei chip (slide index 1)
  await page.click('button.mobile-swipe-chip[data-slide-index="1"]');
  await page.waitForTimeout(400);

  console.log('Clicking the "Activities" chip to expand the suggested list...');
  await page.click('button.compact-mobile-info-chip:has-text("Activities")');
  await page.waitForTimeout(400);

  console.log('Collecting computed styles...');
  const results = await page.evaluate(() => {
    function getDetails(el) {
      if (!el) return 'NOT FOUND';
      const comp = window.getComputedStyle(el);
      return {
        tagName: el.tagName,
        className: el.className,
        background: comp.background,
        backgroundColor: comp.backgroundColor,
        color: comp.color,
        border: comp.border,
        borderColor: comp.borderColor,
        boxShadow: comp.boxShadow
      };
    }

    const activitiesPanel = document.querySelector('.compact-mobile-info-panel-activities');
    const suggestedActivityItem = document.querySelector('.compact-suggested-activity-item');
    const activityActionBtn = document.querySelector('.compact-activity-action-btn');

    return {
      activitiesPanel: getDetails(activitiesPanel),
      panelHtml: activitiesPanel ? activitiesPanel.outerHTML : 'NOT FOUND',
      suggestedActivityItem: getDetails(suggestedActivityItem),
      activityActionBtn: getDetails(activityActionBtn)
    };
  });

  console.log('Panel HTML and details:');
  console.log(JSON.stringify(results, null, 2));

  await browser.close();
  await server.close();
}

run().catch(console.error);
