const path = require('path');
const { chromium } = require('playwright');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(`file://${path.resolve(__dirname, '../index.html')}`);
  await page.waitForSelector('#mainTitle');

  // Add journey London to Bangkok and enable Dual Timezone
  await page.evaluate(() => {
    window.journeys = window.journeys || [];
    window.journeys.push({
      id: 'tz_ui_verify_1',
      journeyId: 'tz_ui_verify_1',
      journeyName: 'London → Bangkok',
      legId: 'city-london-start',
      dayDate: '2026-06-15',
      departureDate: '2026-06-15',
      departureTime: '10:00',
      arrivalDate: '2026-06-16',
      arrivalTime: '06:00',
      fromLocation: 'London',
      toLocation: 'Bangkok',
      transportType: 'flight',
      provider: 'British Airways',
      routeCode: 'BA009',
      status: 'confirmed',
      cost: '850'
    });
    if (typeof setDualTimeEnabled === 'function') setDualTimeEnabled(true);
    if (typeof buildTransportTab === 'function') buildTransportTab();
    if (typeof buildItinerary === 'function') buildItinerary();
  });

  // Switch to Transport tab
  await page.click('[data-tab="transport"]');
  await page.waitForSelector('.transport-data-table-shell');

  await page.screenshot({ path: '/home/jules/verification/verification.png', fullPage: false });
  await browser.close();
  console.log('Screenshot captured successfully');
}

run().catch(console.error);
