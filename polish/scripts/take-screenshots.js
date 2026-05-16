const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const BASE_URL = process.env.TRAVEL_PLANNER_URL || 'http://localhost:3000';
const ROOT = path.resolve(__dirname, '..', '..');
const BACKUP_PATH = path.join(ROOT, 'backups', '2026_June_July_Europe_Thailand.json');
const OUT_DIR = path.join(ROOT, 'polish', 'screenshots', 'before');
const MEASUREMENTS_PATH = path.join(ROOT, 'polish', 'screenshots', 'before', 'audit-measurements.json');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function assertServerRunning() {
  try {
    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (error) {
    console.error(`Dev server is not running at ${BASE_URL}. Start it with: npx serve . --listen 3000`);
    console.error(error.message);
    process.exit(1);
  }
}

async function loadRealData(page) {
  const backup = JSON.parse(fs.readFileSync(BACKUP_PATH, 'utf8'));
  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
  await page.evaluate(data => {
    localStorage.clear();
    localStorage.setItem('travelApp_meta_template', JSON.stringify(data.meta || {}));
    localStorage.setItem('travelApp_v2026_template', JSON.stringify(data.itinerary || []));
    localStorage.setItem('travelApp_packing_v3', JSON.stringify(data.packing || []));
    localStorage.setItem('travelApp_leavehome_v3', JSON.stringify(data.leaveHome || []));
    localStorage.setItem('travelApp_stays_v1', JSON.stringify(data.stays || []));
    localStorage.setItem('travelApp_cities_v1', JSON.stringify(data.cities || []));
    localStorage.setItem('travelApp_journeys_v1', JSON.stringify(data.journeys || []));
    localStorage.setItem('travelApp_userCities_v1', JSON.stringify(data.userCities || []));
    localStorage.setItem('travelApp_userCountries_v1', JSON.stringify(data.userCountries || []));
    localStorage.setItem('travelApp_filename_v2026', '2026_June_July_Europe_Thailand.json');
    localStorage.setItem('travelApp_uiSettings_v1', JSON.stringify({
      isCompactView: false,
      isEditMode: true,
      isFunMode: false
    }));
  }, backup);
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('.app-tab-btn[data-tab="itinerary"]', { timeout: 10000 });
  await sleep(300);
}

async function setViewport(page, options) {
  await page.setViewport(options);
  await sleep(300);
}

async function clickTab(page, tab) {
  await page.click(`.app-tab-btn[data-tab="${tab}"]`);
  await sleep(500);
}

async function screenshot(page, name, options = {}) {
  const filePath = path.join(OUT_DIR, name);
  await page.screenshot({ path: filePath, ...options });
}

async function screenshotSelector(page, name, selector, extra = {}) {
  const handle = await page.$(selector);
  if (!handle) throw new Error(`Selector not found for ${name}: ${selector}`);
  await handle.screenshot({ path: path.join(OUT_DIR, name), ...extra });
}

async function screenshotUnion(page, name, selectors) {
  const boxes = [];
  for (const selector of selectors) {
    const box = await page.$eval(selector, el => {
      const rect = el.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }).catch(() => null);
    if (box) boxes.push(box);
  }
  if (!boxes.length) throw new Error(`No selectors found for ${name}: ${selectors.join(', ')}`);

  const left = Math.min(...boxes.map(b => b.x));
  const top = Math.min(...boxes.map(b => b.y));
  const right = Math.max(...boxes.map(b => b.x + b.width));
  const bottom = Math.max(...boxes.map(b => b.y + b.height));
  await screenshot(page, name, {
    clip: {
      x: Math.max(0, left),
      y: Math.max(0, top),
      width: Math.ceil(right - left),
      height: Math.ceil(bottom - top)
    }
  });
}

async function expandFirstDay(page) {
  await clickTab(page, 'itinerary');
  await page.evaluate(() => {
    const first = document.querySelector('.day-card');
    if (first) first.classList.add('open');
    document.querySelectorAll('.leg').forEach(leg => leg.classList.remove('collapsed'));
  });
  await sleep(300);
}

async function openJourneyModal(page) {
  await clickTab(page, 'transport');
  const opened = await page.evaluate(() => {
    if (!Array.isArray(window.journeys) || window.journeys.length === 0 || typeof window.editJourney !== 'function') {
      return false;
    }
    const first = window.journeys[0];
    window.editJourney(first.journeyId || first.id);
    return true;
  });
  if (!opened) {
    await page.evaluate(() => {
      if (typeof window.openAddJourneyModal === 'function') window.openAddJourneyModal();
    });
  }
  await page.waitForSelector('#journey-modal', { visible: true, timeout: 5000 });
  await sleep(300);
}

async function openAIModal(page) {
  await page.evaluate(() => {
    if (typeof window.openAIDialog === 'function') window.openAIDialog();
  });
  await page.waitForSelector('#ai-modal', { visible: true, timeout: 5000 });
  await sleep(300);
}

async function closeModals(page) {
  await page.evaluate(() => {
    ['journey-modal', 'ai-modal', 'mobileMenuSheet'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (id === 'mobileMenuSheet') {
        el.classList.remove('open');
        document.body.classList.remove('mobile-menu-open');
      } else {
        el.style.display = 'none';
      }
    });
  });
  await sleep(200);
}

async function captureMeasurements(page) {
  return page.evaluate(() => {
    const selectors = [
      '.app-menu-bar',
      '.app-tabs-nav',
      '.city-nav-list',
      '.app-tab-btn[data-tab="accom"]',
      '.mobile-menu-btn',
      '.modal-close',
      '.action-btn',
      '.city-nav-btn',
      '#expandAll',
      '.budget-kpi-grid',
      '.transport-type-group',
      '#journey-modal .modal-content',
      '#tab-map'
    ];
    const result = {};
    selectors.forEach(selector => {
      const el = document.querySelector(selector);
      if (!el) {
        result[selector] = null;
        return;
      }
      const rect = el.getBoundingClientRect();
      result[selector] = {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        scrollWidth: el.scrollWidth,
        scrollHeight: el.scrollHeight,
        clientWidth: el.clientWidth,
        clientHeight: el.clientHeight,
        overflowX: getComputedStyle(el).overflowX,
        overflowY: getComputedStyle(el).overflowY
      };
    });
    return result;
  });
}

async function run() {
  await assertServerRunning();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: null
  });
  const page = await browser.newPage();
  page.on('dialog', dialog => dialog.accept().catch(() => {}));

  const failures = [];
  const safe = async (name, fn) => {
    try {
      await fn();
      console.log(`captured ${name}`);
    } catch (error) {
      failures.push({ name, error: error.message });
      console.error(`failed ${name}: ${error.message}`);
    }
  };

  await setViewport(page, { width: 1440, height: 900, deviceScaleFactor: 1 });
  await loadRealData(page);

  await safe('desktop-01-home.png', () => screenshot(page, 'desktop-01-home.png', { fullPage: true }));
  await safe('desktop-02-menu-bar.png', () => screenshot(page, 'desktop-02-menu-bar.png', { clip: { x: 0, y: 0, width: 1440, height: 60 } }));
  await safe('desktop-03-header.png', () => screenshotSelector(page, 'desktop-03-header.png', 'header'));
  await safe('desktop-04-tabs.png', () => screenshotUnion(page, 'desktop-04-tabs.png', ['.app-tabs-nav', '.city-nav']));
  await safe('desktop-05-itinerary.png', async () => {
    await expandFirstDay(page);
    await screenshotSelector(page, 'desktop-05-itinerary.png', '.tab-pane.active');
  });
  await safe('desktop-06-transport.png', async () => {
    await clickTab(page, 'transport');
    await screenshotSelector(page, 'desktop-06-transport.png', '#tab-transport');
  });
  await safe('desktop-07-budget.png', async () => {
    await clickTab(page, 'budget');
    await screenshotSelector(page, 'desktop-07-budget.png', '#tab-budget');
  });
  await safe('desktop-08-packing.png', async () => {
    await clickTab(page, 'packing');
    await screenshotSelector(page, 'desktop-08-packing.png', '#tab-packing');
  });
  await safe('desktop-09-map.png', async () => {
    await clickTab(page, 'map');
    await screenshotSelector(page, 'desktop-09-map.png', '#tab-map');
  });
  await safe('desktop-10-journey-modal.png', async () => {
    await openJourneyModal(page);
    await screenshotSelector(page, 'desktop-10-journey-modal.png', '#journey-modal .modal-content');
    await closeModals(page);
  });
  await safe('desktop-11-ai-builder.png', async () => {
    await openAIModal(page);
    await screenshotSelector(page, 'desktop-11-ai-builder.png', '#ai-modal .modal-content');
    await closeModals(page);
  });
  await safe('desktop-12-mobile-menu.png', async () => {
    await setViewport(page, { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    await page.click('.mobile-menu-btn');
    await sleep(300);
    await screenshotSelector(page, 'desktop-12-mobile-menu.png', '#mobileMenuSheet .mobile-menu-sheet-panel');
    await closeModals(page);
  });

  await setViewport(page, { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await loadRealData(page);
  await safe('mobile-01-home.png', () => screenshot(page, 'mobile-01-home.png'));
  await safe('mobile-02-header.png', () => screenshot(page, 'mobile-02-header.png', { clip: { x: 0, y: 0, width: 390, height: 100 } }));
  await safe('mobile-03-tabs.png', () => screenshotUnion(page, 'mobile-03-tabs.png', ['.app-tabs-nav', '.city-nav']));
  await safe('mobile-04-menu-open.png', async () => {
    await page.click('.mobile-menu-btn');
    await sleep(300);
    await screenshotSelector(page, 'mobile-04-menu-open.png', '#mobileMenuSheet .mobile-menu-sheet-panel');
    await closeModals(page);
  });
  await safe('mobile-05-itinerary.png', async () => {
    await expandFirstDay(page);
    await screenshotSelector(page, 'mobile-05-itinerary.png', '.tab-pane.active');
  });
  await safe('mobile-06-transport.png', async () => {
    await clickTab(page, 'transport');
    await screenshotSelector(page, 'mobile-06-transport.png', '#tab-transport');
  });
  await safe('mobile-07-budget.png', async () => {
    await clickTab(page, 'budget');
    await screenshotSelector(page, 'mobile-07-budget.png', '#tab-budget');
  });
  await safe('mobile-08-journey-modal-top.png', async () => {
    await openJourneyModal(page);
    await screenshotSelector(page, 'mobile-08-journey-modal-top.png', '#journey-modal .modal-content');
  });
  await safe('mobile-09-journey-modal-bottom.png', async () => {
    await page.$eval('#journey-modal .modal-content', el => { el.scrollTop = el.scrollHeight; });
    await sleep(200);
    await screenshotSelector(page, 'mobile-09-journey-modal-bottom.png', '#journey-modal .modal-content');
    await closeModals(page);
  });
  await safe('mobile-10-ai-builder.png', async () => {
    await openAIModal(page);
    await screenshotSelector(page, 'mobile-10-ai-builder.png', '#ai-modal .modal-content');
    await closeModals(page);
  });
  await safe('mobile-11-city-nav-overflow.png', async () => {
    await clickTab(page, 'itinerary');
    await screenshotSelector(page, 'mobile-11-city-nav-overflow.png', '.city-nav');
  });

  await clickTab(page, 'budget');
  const mobileMeasurements = await captureMeasurements(page);
  await setViewport(page, { width: 1440, height: 900, deviceScaleFactor: 1 });
  await sleep(300);
  const desktopMeasurements = await captureMeasurements(page);
  fs.writeFileSync(MEASUREMENTS_PATH, JSON.stringify({ desktop: desktopMeasurements, mobile: mobileMeasurements, failures }, null, 2));

  await browser.close();

  if (failures.length) {
    console.error(`Screenshot run completed with ${failures.length} failure(s). See ${MEASUREMENTS_PATH}`);
    process.exitCode = 1;
  } else {
    console.log(`Screenshot run completed. Files saved to ${OUT_DIR}`);
  }
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
