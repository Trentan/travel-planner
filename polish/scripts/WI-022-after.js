const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const BASE_URL = process.env.TRAVEL_PLANNER_URL || 'http://localhost:3000';
const ROOT = path.resolve(__dirname, '..', '..');
const BACKUP_PATH = path.join(ROOT, 'backups', '2026_June_July_Europe_Thailand.json');
const OUT_DIR = path.join(ROOT, 'polish', 'screenshots', 'after');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1440, height: 1200 }
  });
  const page = await browser.newPage();
  page.on('dialog', dialog => dialog.accept().catch(() => {}));

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
      isEditMode: false,
      isFunMode: false
    }));
  }, backup);
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(500);

  // Switch to packing tab
  await page.click('.app-tab-btn[data-tab="packing"]');
  await sleep(500);

  // Scroll to see both guides and first area
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  await sleep(300);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const filePath = path.join(OUT_DIR, 'WI-022-after.png');
  await page.screenshot({ path: filePath, fullPage: true });

  console.log(`Screenshot saved to ${filePath}`);
  await browser.close();
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
