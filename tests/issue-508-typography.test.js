const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { assert } = require('./lib/test-helpers');
const { startStaticServer } = require('./lib/static-server');

async function runIssue508TypographyTests(options = {}) {
  console.log('Running Issue #508 typography & tabular-nums tests...');

  const rootDir = path.resolve(__dirname, '..');
  const componentsCss = fs.readFileSync(path.join(rootDir, 'src/css/components.css'), 'utf8');
  const mobileFeaturesCss = fs.readFileSync(path.join(rootDir, 'src/css/mobile-features.css'), 'utf8');
  const shellCss = fs.readFileSync(path.join(rootDir, 'src/css/shell.css'), 'utf8');
  const distCss = fs.readFileSync(path.join(rootDir, 'dist/tailwind.css'), 'utf8');
  const combinedSourceCss = `${componentsCss}\n${mobileFeaturesCss}\n${shellCss}`;

  // 1. Source & compiled CSS assertions
  assert(
    /text-wrap:\s*balance/.test(combinedSourceCss),
    'Expected source CSS files to include text-wrap: balance for headings'
  );
  assert(
    /font-variant-numeric:\s*tabular-nums/.test(combinedSourceCss),
    'Expected source CSS files to include font-variant-numeric: tabular-nums for numeric data columns'
  );
  assert(
    /text-wrap:\s*balance/.test(distCss),
    'Expected compiled dist/tailwind.css to include text-wrap: balance'
  );
  assert(
    /tabular-nums/.test(distCss),
    'Expected compiled dist/tailwind.css to include tabular-nums'
  );

  // 2. Browser computed-style & layout verification across DESKTOP (1440x900) and MOBILE (390x844)
  const server = await startStaticServer(rootDir);
  const browser = await chromium.launch({ headless: true });
  const backupPath = path.join(rootDir, 'backups', '2026_June_July_Europe_Thailand.json');

  try {
    for (const mode of [
      { id: 'DESKTOP', width: 1440, height: 900 },
      { id: 'MOBILE', width: 390, height: 844 }
    ]) {
      const context = await browser.newContext({
        viewport: { width: mode.width, height: mode.height }
      });
      const page = await context.newPage();
      await page.goto(`${server.baseUrl}/index.html`, { waitUntil: 'networkidle' });
      await page.evaluate(() => {
        window.confirm = () => true;
        window.alert = () => {};
      });

      // Load realistic trip backup
      const fileInput = page.locator('#importFile');
      await fileInput.setInputFiles(backupPath);
      await page.waitForTimeout(600);

      // Verify no horizontal overflow on Itinerary tab
      const overflowItinerary = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      assert(!overflowItinerary, `${mode.id}: Horizontal overflow detected on Itinerary tab`);

      // Check heading text-wrap: balance on h1 and section headers / day headings
      const headingStyles = await page.evaluate(() => {
        const h1 = document.querySelector('header h1, #mainTitle');
        const sectionTitle = document.querySelector('.section-header-title');
        const dayHeading = document.querySelector('.day-cities, .compact-leg-label');
        const timelineTime = document.querySelector('.daily-timeline-time');
        return {
          h1Wrap: h1 ? getComputedStyle(h1).textWrap : null,
          sectionWrap: sectionTitle ? getComputedStyle(sectionTitle).textWrap : null,
          dayHeadingWrap: dayHeading ? getComputedStyle(dayHeading).textWrap : null,
          timelineNumeric: timelineTime ? getComputedStyle(timelineTime).fontVariantNumeric : null
        };
      });

      assert(
        headingStyles.h1Wrap && headingStyles.h1Wrap.includes('balance'),
        `${mode.id}: Expected header h1 text-wrap to include 'balance', got '${headingStyles.h1Wrap}'`
      );
      assert(
        headingStyles.sectionWrap && headingStyles.sectionWrap.includes('balance'),
        `${mode.id}: Expected .section-header-title text-wrap to include 'balance', got '${headingStyles.sectionWrap}'`
      );
      if (headingStyles.dayHeadingWrap !== null) {
        assert(
          headingStyles.dayHeadingWrap.includes('balance'),
          `${mode.id}: Expected day/leg heading text-wrap to include 'balance', got '${headingStyles.dayHeadingWrap}'`
        );
      }
      if (headingStyles.timelineNumeric !== null) {
        assert(
          headingStyles.timelineNumeric.includes('tabular-nums'),
          `${mode.id}: Expected .daily-timeline-time font-variant-numeric to include 'tabular-nums', got '${headingStyles.timelineNumeric}'`
        );
      }

      // Check Trip Summary table td tabular-nums
      await page.evaluate(() => {
        if (typeof window.openTripSummaryModal === 'function') {
          window.openTripSummaryModal();
        }
      });
      await page.waitForTimeout(200);
      const summaryTdNumeric = await page.evaluate(() => {
        const td = document.querySelector('.trip-summary-table td');
        return td ? getComputedStyle(td).fontVariantNumeric : null;
      });
      assert(
        summaryTdNumeric && summaryTdNumeric.includes('tabular-nums'),
        `${mode.id}: Expected .trip-summary-table td font-variant-numeric to include 'tabular-nums', got '${summaryTdNumeric}'`
      );
      await page.evaluate(() => {
        if (typeof window.closeTripSummaryModal === 'function') {
          window.closeTripSummaryModal();
        }
      });

      // Check Budget tab tabular-nums
      await page.evaluate(() => {
        if (typeof window.switchTab === 'function') {
          window.switchTab('budget');
        }
      });
      await page.waitForTimeout(250);
      const budgetNumeric = await page.evaluate((isMobile) => {
        const selector = isMobile
          ? '.budget-mobile-row-head strong, .budget-mobile-splits dd'
          : '.budget-desktop-table td';
        const el = document.querySelector(selector);
        return el ? getComputedStyle(el).fontVariantNumeric : null;
      }, mode.id === 'MOBILE');
      assert(
        budgetNumeric && budgetNumeric.includes('tabular-nums'),
        `${mode.id}: Expected budget numeric display to include 'tabular-nums', got '${budgetNumeric}'`
      );

      // Check Packing tab progress info tabular-nums
      await page.evaluate(() => {
        if (typeof window.switchTab === 'function') {
          window.switchTab('packing');
        }
      });
      await page.waitForTimeout(250);
      const packingNumeric = await page.evaluate(() => {
        const el = document.querySelector('.packing-area-progress-info');
        return el ? getComputedStyle(el).fontVariantNumeric : null;
      });
      assert(
        packingNumeric && packingNumeric.includes('tabular-nums'),
        `${mode.id}: Expected .packing-area-progress-info font-variant-numeric to include 'tabular-nums', got '${packingNumeric}'`
      );

      await context.close();
    }
  } finally {
    await browser.close();
    await server.close();
  }

  console.log('Issue #508 typography & tabular-nums tests passed!');
}

if (require.main === module) {
  runIssue508TypographyTests().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { runIssue508TypographyTests };
