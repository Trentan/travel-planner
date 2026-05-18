const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const BASE_URL = process.env.TRAVEL_PLANNER_URL || 'http://localhost:3000';
const ROOT = path.resolve(__dirname, '..', '..');
const BACKUP_PATH = path.join(ROOT, 'backups', '2026_June_July_Europe_Thailand.json');
const OUT_DIR_BEFORE = path.join(ROOT, 'polish', 'screenshots', 'before');
const OUT_DIR_AFTER = path.join(ROOT, 'polish', 'screenshots', 'after');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const args = process.argv.slice(2);
const targetWI = args.find(a => a.startsWith('--wi='))?.split('=')[1];
const targetMode = args.find(a => a.startsWith('--mode='))?.split('=')[1];
const mockupPath = args.find(a => a.startsWith('--mockup='))?.split('=')[1];
const isAfter = args.includes('--after');

const MODES = {
  DDE: { width: 1440, height: 900, compact: false, isMobile: false, prefix: 'dde' },
  DCO: { width: 1440, height: 900, compact: true, isMobile: false, prefix: 'dco' },
  MDE: { width: 390, height: 844, compact: false, isMobile: true, prefix: 'mde', dsf: 3 },
  MCO: { width: 390, height: 844, compact: true, isMobile: true, prefix: 'mco', dsf: 3 }
};

async function loadRealData(page, compact = false) {
  const backup = JSON.parse(fs.readFileSync(BACKUP_PATH, 'utf8'));
  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
  await page.evaluate((data, isCompact) => {
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
      isCompactView: isCompact,
      isEditMode: true,
      isFunMode: false
    }));
  }, backup, compact);
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(2000);
}

async function captureScreenshot(page, filename, options = {}) {
  let outDir = OUT_DIR_BEFORE;
  let finalName = filename;

  if (isAfter) {
    outDir = OUT_DIR_AFTER;
    if (targetWI) {
      finalName = `${targetWI}-after.png`;
    }
  }

  const filePath = path.join(outDir, finalName);
  
  if (fs.existsSync(filePath) && !targetWI && !isAfter) {
    console.log(`Skipping ${finalName} (already exists)`);
    return;
  }
  
  if (options.selector) {
    try {
      await page.waitForSelector(options.selector, { visible: true, timeout: 5000 });
    } catch (e) {
      console.warn(`Warning: Selector ${options.selector} not visible for ${finalName}`);
      return;
    }
  }

  try {
    if (options.selector && !options.fullPage) {
      const el = await page.$(options.selector);
      if (el) {
        await el.screenshot({ path: filePath });
        console.log(`Captured ${finalName}`);
      }
    } else {
      await page.screenshot({ path: filePath, fullPage: options.fullPage });
      console.log(`Captured ${finalName}`);
    }
  } catch (e) {
    console.error(`Failed ${finalName}: ${e.message}`);
  }
}

async function captureUnion(page, filename, selectors) {
  if (isAfter && targetWI) {
    await captureScreenshot(page, filename);
    return;
  }

  const filePath = path.join(OUT_DIR_BEFORE, filename);
  if (fs.existsSync(filePath) && !targetWI) {
    console.log(`Skipping ${filename} (already exists)`);
    return;
  }

  const rect = await page.evaluate((selList) => {
    const boxes = selList.map(s => document.querySelector(s)).filter(el => el).map(el => {
      const r = el.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height };
    });
    if (boxes.length === 0) return null;
    const x = Math.min(...boxes.map(b => b.x));
    const y = Math.min(...boxes.map(b => b.y));
    const right = Math.max(...boxes.map(b => b.x + b.w));
    const bottom = Math.max(...boxes.map(b => b.y + b.h));
    return { x, y, width: right - x, height: bottom - y };
  }, selectors);

  if (rect && rect.width > 0 && rect.height > 0) {
    await page.screenshot({ path: filePath, clip: rect });
    console.log(`Captured ${filename}`);
  } else {
    console.error(`Error: Invalid rect for ${filename}`);
  }
}

async function openJourneyModal(page) {
  await page.evaluate(() => {
    if (typeof window.openAddJourneyModal === 'function') {
      window.openAddJourneyModal();
    } else if (window.journeys?.length > 0 && typeof window.editJourney === 'function') {
      window.editJourney(window.journeys[0].id);
    }
  });
  await sleep(1500);
}

async function openAIModal(page) {
  await page.evaluate(() => {
    if (typeof window.openAIDialog === 'function') window.openAIDialog();
  });
  await sleep(1500);
}

async function run() {
  if (!fs.existsSync(OUT_DIR_BEFORE)) fs.mkdirSync(OUT_DIR_BEFORE, { recursive: true });
  if (!fs.existsSync(OUT_DIR_AFTER)) fs.mkdirSync(OUT_DIR_AFTER, { recursive: true });

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  if (mockupPath) {
    const absolutePath = path.isAbsolute(mockupPath) ? mockupPath : path.join(process.cwd(), mockupPath);
    await page.goto(`file://${absolutePath}`, { waitUntil: 'networkidle0' });
    const outPath = path.join(OUT_DIR_AFTER, `${targetWI || 'mockup'}-proposal.png`);
    await page.screenshot({ path: outPath, fullPage: true });
    console.log(`Captured mockup to ${outPath}`);
    await browser.close();
    return;
  }

  for (const [modeId, config] of Object.entries(MODES)) {
    if (targetMode && targetMode !== modeId) continue;
    console.log(`\n--- Mode: ${modeId} ---`);
    await page.setViewport({ width: config.width, height: config.height, deviceScaleFactor: config.dsf || 1, isMobile: config.isMobile, hasTouch: config.isMobile });
    await loadRealData(page, config.compact);
    const p = config.prefix;

    if (modeId === 'DDE') {
      if (targetWI === 'WI-009') {
        await page.click('.app-tab-btn[data-tab="map"]'); await sleep(1000);
        await captureScreenshot(page, `dde-09-map.png`, { selector: '#journey-map-view' });
        continue;
      }
      // Add more specific WI targeting here if needed
      if (!targetWI) {
        await captureScreenshot(page, `${p}-01-home.png`, { fullPage: true });
        await captureScreenshot(page, `${p}-02-menu-bar.png`, { selector: '.app-menu-bar' });
        await captureScreenshot(page, `${p}-03-header.png`, { selector: 'header' });
        await captureUnion(page, `${p}-04-tabs.png`, ['.app-tabs-nav', '.city-nav']);
        await page.evaluate(() => { const f = document.querySelector('.day-card'); if (f) f.classList.add('open'); });
        await captureScreenshot(page, `${p}-05-itinerary.png`, { selector: '.tab-pane.active' });
        await page.click('.app-tab-btn[data-tab="transport"]'); await sleep(500);
        await captureScreenshot(page, `${p}-06-transport.png`, { selector: '#tab-transport' });
        await page.click('.app-tab-btn[data-tab="budget"]'); await sleep(500);
        await captureScreenshot(page, `${p}-07-budget.png`, { selector: '#tab-budget' });
        await page.click('.app-tab-btn[data-tab="packing"]'); await sleep(500);
        await captureScreenshot(page, `${p}-08-packing.png`, { selector: '#tab-packing' });
        await page.click('.app-tab-btn[data-tab="map"]'); await sleep(500);
        await captureScreenshot(page, `${p}-09-map.png`, { selector: '#tab-map' });
        await openJourneyModal(page);
        await captureScreenshot(page, `${p}-10-journey-modal.png`, { selector: '#journey-modal .modal-content' });
        await page.evaluate(() => { const m = document.getElementById('journey-modal'); if (m) m.style.display='none'; });
        await openAIModal(page);
        await captureScreenshot(page, `${p}-11-ai-builder.png`, { selector: '#ai-modal .modal-content' });
        await page.evaluate(() => { const m = document.getElementById('ai-modal'); if (m) m.style.display='none'; });
        await page.click('.app-tab-btn[data-tab="accom"]'); await sleep(500);
        await captureScreenshot(page, `${p}-12-accom.png`, { selector: '#tab-accom' });
      }
    }
    // ... rest of modes ...
    if (modeId === 'MDE' && !targetWI) {
        // Standard MDE capture
    }
  }
  await browser.close();
}

run().catch(error => { console.error(error); process.exit(1); });
