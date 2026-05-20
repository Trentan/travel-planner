const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { startStaticServer } = require('./lib/static-server');

const root = path.resolve(__dirname, '..');
const fixturePath = path.join(root, 'backups', '2026_June_July_Europe_Thailand.json');
const targetActivity = 'Gallery visit with suggested slot';

async function importFixture(page) {
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  await page.evaluate(async data => {
    localStorage.clear();
    const file = new File([JSON.stringify(data)], '2026_June_July_Europe_Thailand.json', { type: 'application/json' });
    await window.importJSON({ target: { files: [file], value: '' } });
  }, fixture);
  await page.waitForTimeout(250);
}

async function seedSchedulingScenario(page) {
  await page.evaluate(title => {
    const leg = appData[0];
    const day = leg.days[0];
    day.activityItems = [
      { text: 'Breakfast booking', time: '1 hr', cost: '20', done: false, startTime: '08:30', endTime: '09:30' },
      { text: 'Lunch hold', time: '1 hr', cost: '30', done: false, startTime: '12:00', endTime: '13:00' }
    ];
    leg.suggestedActivities = [{
      title,
      category: 'Culture',
      estTime: '2 hr',
      estCost: '32',
      assignedDayIdx: null,
      startTime: '',
      endTime: ''
    }];
    if (Array.isArray(journeys) && journeys[0]) {
      journeys[0].legId = leg.id;
      journeys[0].departureDate = day.date;
      journeys[0].dayDate = day.date;
      journeys[0].departureTime = '15:00';
      journeys[0].arrivalTime = '16:00';
      journeys[0].journeyName = 'Afternoon transfer';
    }
    saveData(false);
    buildItinerary();
  }, targetActivity);
  await page.waitForTimeout(250);
}

async function run() {
  const server = await startStaticServer(root, 0);
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 820 } });
    page.on('dialog', dialog => dialog.accept().catch(() => {}));
    await page.goto(`${server.baseUrl}/index.html`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => typeof window.importJSON === 'function' && typeof window.openActivityAssignModal === 'function');
    await importFixture(page);
    await seedSchedulingScenario(page);

    await page.evaluate(() => window.openActivityAssignModal(0, 0));
    await page.waitForSelector('#activity-assign-modal', { state: 'visible' });
    await page.locator('input[name="activityAssignScheduleMode"][value="suggested"]').check();

    const firstDay = page.locator('.activity-assign-day[data-day-index="0"]');
    assert.strictEqual(await firstDay.getAttribute('data-suggest-available'), 'true');
    assert.strictEqual(await firstDay.getAttribute('data-suggest-start'), '09:45');
    assert.strictEqual(await firstDay.getAttribute('data-suggest-end'), '11:45');

    await firstDay.click();
    await page.waitForSelector('#activity-assign-modal', { state: 'detached' });
    const assigned = await page.evaluate(title => {
      const item = appData[0].days[0].activityItems.find(candidate => String(candidate.text || '').includes(title));
      return item ? { startTime: item.startTime, endTime: item.endTime } : null;
    }, targetActivity);

    assert.deepStrictEqual(assigned, { startTime: '09:45', endTime: '11:45' });
    console.log('Suggested scheduling regression passed');
  } finally {
    await browser.close();
    await server.close();
  }
}

if (require.main === module) {
  run().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { run };
