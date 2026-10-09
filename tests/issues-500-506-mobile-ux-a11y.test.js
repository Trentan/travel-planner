const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { assert } = require('./lib/test-helpers');
const { startStaticServer } = require('./lib/static-server');

async function runIssues500To506Tests() {
  console.log('Running Issues #500, #502, #503, #504, #505, #506 tests...');

  const rootDir = path.resolve(__dirname, '..');
  const cssFiles = [
    'src/tailwind.css',
    'src/css/theme-tokens.css',
    'src/css/components.css',
    'src/css/shell.css',
    'src/css/responsive-core.css',
    'src/css/mobile-features.css',
    'src/css/trip-library.css',
    'src/css/split-pane.css',
    'src/css/print.css'
  ];

  // --- Issue #502: Zero `transition: all` in CSS & prefers-reduced-motion present ---
  for (const relPath of cssFiles) {
    const content = fs.readFileSync(path.join(rootDir, relPath), 'utf8');
    assert(
      !/transition:\s*all\b/.test(content),
      `Issue #502: Expected no 'transition: all' in ${relPath}`
    );
  }
  const combinedCss = cssFiles.map(f => fs.readFileSync(path.join(rootDir, f), 'utf8')).join('\n');
  assert(
    /@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/.test(combinedCss),
    'Issue #502: Expected @media (prefers-reduced-motion: reduce) block in CSS'
  );

  // --- Issue #500: HTML accessibility checks ---
  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  assert(
    !/<label\s+for="newCityName"\s*>\s*<\/label>/.test(indexHtml),
    'Issue #500: Expected <label for="newCityName"> to not be empty'
  );
  const modalCloseMatches = indexHtml.match(/<button[^>]*class="[^"]*modal-close[^"]*"[^>]*>/g) || [];
  assert(modalCloseMatches.length > 0, 'Issue #500: Expected modal-close buttons in index.html');
  for (const tag of modalCloseMatches) {
    assert(
      /aria-label="[^"]+"/.test(tag),
      `Issue #500: Expected modal-close button to have aria-label: ${tag}`
    );
  }
  assert(
    /id="saveStatus"[^>]*aria-live="polite"/.test(indexHtml) ||
    /aria-live="polite"[^>]*id="saveStatus"/.test(indexHtml),
    'Issue #500: Expected #saveStatus to have aria-live="polite"'
  );

  // --- Browser checks across MOBILE (390x844) and narrow phone (375x667) ---
  const server = await startStaticServer(rootDir);
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, route => route.abort());
    const page = await context.newPage();
    await page.goto(`${server.baseUrl}/index.html`, { waitUntil: 'domcontentloaded' });

    // Issue #505: 44x44px touch target minimum on mobile
    const touchMetrics = await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.innerHTML = `
        <button class="readonly-banner-dismiss-btn" type="button">×</button>
        <button class="pwa-prompt-close-btn" type="button">×</button>
        <button class="add-btn" type="button">+ Add</button>
        <button class="city-nav-btn" type="button"><span>City</span></button>
        <button class="trip-start-quiet" type="button">Quiet</button>
        <button class="trip-start-back" type="button">Back</button>
        <a class="transport-alert-action-btn" href="#">Action</a>
        <div class="trip-start-stop-row"><button type="button">×</button></div>
      `;
      document.body.appendChild(probe);

      const measure = (sel) => {
        const el = probe.querySelector(sel);
        const cs = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          height: Math.max(rect.height, parseFloat(cs.minHeight) || 0),
          width: Math.max(rect.width, parseFloat(cs.minWidth) || 0)
        };
      };

      const res = {
        dismissBtn: measure('.readonly-banner-dismiss-btn'),
        pwaCloseBtn: measure('.pwa-prompt-close-btn'),
        addBtn: measure('.add-btn'),
        cityNavBtn: measure('.city-nav-btn'),
        quietBtn: measure('.trip-start-quiet'),
        backBtn: measure('.trip-start-back'),
        alertActionBtn: measure('.transport-alert-action-btn'),
        stopRowDeleteBtn: measure('.trip-start-stop-row button')
      };
      probe.remove();
      return res;
    });

    assert(touchMetrics.dismissBtn.height >= 44 && touchMetrics.dismissBtn.width >= 44, `Issue #505: .readonly-banner-dismiss-btn must be >=44x44px, got ${JSON.stringify(touchMetrics.dismissBtn)}`);
    assert(touchMetrics.pwaCloseBtn.height >= 44 && touchMetrics.pwaCloseBtn.width >= 44, `Issue #505: .pwa-prompt-close-btn must be >=44x44px, got ${JSON.stringify(touchMetrics.pwaCloseBtn)}`);
    assert(touchMetrics.addBtn.height >= 44, `Issue #505: .add-btn height must be >=44px on mobile, got ${touchMetrics.addBtn.height}`);
    assert(touchMetrics.cityNavBtn.height >= 44, `Issue #505: .city-nav-btn height must be >=44px on mobile, got ${touchMetrics.cityNavBtn.height}`);
    assert(touchMetrics.quietBtn.height >= 44, `Issue #505: .trip-start-quiet height must be >=44px, got ${touchMetrics.quietBtn.height}`);
    assert(touchMetrics.backBtn.height >= 44, `Issue #505: .trip-start-back height must be >=44px, got ${touchMetrics.backBtn.height}`);
    assert(touchMetrics.alertActionBtn.height >= 44, `Issue #505: .transport-alert-action-btn height must be >=44px, got ${touchMetrics.alertActionBtn.height}`);
    assert(touchMetrics.stopRowDeleteBtn.height >= 44 && touchMetrics.stopRowDeleteBtn.width >= 44, `Issue #506: .trip-start-stop-row delete button must be >=44x44px, got ${JSON.stringify(touchMetrics.stopRowDeleteBtn)}`);

    // Issue #504: Minimum font sizes on mobile (>=12px / 0.75rem for content & badges, >=11px for tab labels)
    const fontMetrics = await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.innerHTML = `
        <div class="day-name">Mon</div>
        <div class="day-desc">Desc</div>
        <div class="day-chevron">⌄</div>
        <div class="detail-block"><h4>Header</h4></div>
        <button class="add-btn">+ Add</button>
        <span class="status-badge">Confirmed</span>
        <span class="city-live-search-badge-source">IATA</span>
        <span class="audio-tour-chip">Audio</span>
      `;
      document.body.appendChild(probe);
      const size = (sel) => parseFloat(getComputedStyle(probe.querySelector(sel)).fontSize);
      const tabLabel = document.querySelector('.app-tab-btn .tab-label');
      const res = {
        tabLabel: tabLabel ? parseFloat(getComputedStyle(tabLabel).fontSize) : 0,
        dayName: size('.day-name'),
        dayDesc: size('.day-desc'),
        dayChevron: size('.day-chevron'),
        detailH4: size('.detail-block h4'),
        addBtn: size('.add-btn'),
        statusBadge: size('.status-badge'),
        badgeSource: size('.city-live-search-badge-source'),
        audioChip: size('.audio-tour-chip')
      };
      probe.remove();
      return res;
    });

    assert(fontMetrics.tabLabel >= 10, `Issue #504/#503: .tab-label font-size must be >=10px on mobile, got ${fontMetrics.tabLabel}px`);
    for (const [key, val] of Object.entries(fontMetrics)) {
      if (key === 'tabLabel') continue;
      assert(val >= 12, `Issue #504: Expected ${key} font-size >= 12px (0.75rem) on mobile, got ${val}px`);
    }

    // Mobile Flow Overhaul (#503 evolution): 5 primary bottom nav tabs visible at once on 390px with zero label truncation + 2 quick-switch tabs in More menu
    const navMetrics = await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('.app-tabs-list > *'));
      const fullyVisibleInViewport = tabs.filter(btn => {
        const r = btn.getBoundingClientRect();
        return r.width > 0 && r.left >= -1 && r.right <= window.innerWidth + 1;
      });
      const truncatedLabels = fullyVisibleInViewport.filter(btn => {
        const lbl = btn.querySelector('.tab-label');
        return lbl && lbl.scrollWidth > lbl.clientWidth + 1;
      });
      const quickTabsCount = document.querySelectorAll('#mobileMenuSheet .mobile-quick-tab-btn').length;
      return {
        visibleCount: fullyVisibleInViewport.length,
        truncatedCount: truncatedLabels.length,
        quickTabsCount
      };
    });

    assert(
      navMetrics.visibleCount === 5 && navMetrics.quickTabsCount === 2,
      `Mobile bottom bar: Expected 5 primary tab items visible at once on 390px viewport and 2 quick-switch tabs in More sheet, got ${navMetrics.visibleCount} and ${navMetrics.quickTabsCount}`
    );
    assert(
      navMetrics.truncatedCount === 0,
      `Issue #503: Expected 0 truncated tab labels on 390px viewport, got ${navMetrics.truncatedCount}`
    );

    await context.close();
  } finally {
    await browser.close();
    await server.close();
  }

  console.log('Issues #500, #502, #503, #504, #505, #506 tests passed!');
}

if (require.main === module) {
  runIssues500To506Tests().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { runIssues500To506Tests };
