const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { startStaticServer } = require('./lib/static-server');

const root = path.resolve(__dirname, '..');
const fixturePath = path.join(root, 'backups', '2026_June_July_Europe_Thailand.json');

async function importFixture(page) {
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  await page.evaluate(async data => {
    localStorage.clear();
    const file = new File([JSON.stringify(data)], '2026_June_July_Europe_Thailand.json', { type: 'application/json' });
    await window.importJSON({ target: { files: [file], value: '' } });
  }, fixture);
  await page.waitForTimeout(250);
}

async function loadApp(page, baseUrl) {
  const consoleErrors = [];
  const shouldIgnoreError = message =>
    String(message || '').includes('Failed to load resource: net::ERR_NAME_NOT_RESOLVED')
    || String(message || '').includes('Failed to load resource: the server responded with a status of 404 (Not Found)');
  page.on('pageerror', error => {
    const text = error?.message || '';
    if (!shouldIgnoreError(text)) consoleErrors.push(text);
  });
  page.on('console', message => {
    if (message.type() === 'error') {
      const text = message.text();
      if (!shouldIgnoreError(text)) consoleErrors.push(text);
    }
  });
  page.on('dialog', dialog => dialog.accept().catch(() => {}));
  await page.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => typeof window.importJSON === 'function' && typeof window.buildExportPayload === 'function');
  await importFixture(page);
  assert.deepStrictEqual(consoleErrors, [], `Unexpected console/page errors: ${consoleErrors.join(' | ')}`);
}

async function seedTimelineScenario(page) {
  await page.evaluate(() => {
    window.currentLegIndex = 0;
    window.isEditMode = true;
    const leg = appData[0];
    const day = leg.days[0];
    const dayDate = day.date;

    day.activityItems = [
      {
        text: 'Exploratory scheduled gallery',
        time: '2 hr',
        cost: '32',
        done: false,
        startDate: dayDate,
        startTime: '09:30',
        endDate: dayDate,
        endTime: '11:30'
      },
      {
        text: 'Exploratory anytime walk',
        time: '1 hr',
        cost: '0',
        done: false,
        startDate: dayDate,
        startTime: '',
        endDate: dayDate,
        endTime: ''
      }
    ];

    leg.suggestedActivities = [
      {
        title: 'Exploratory scheduled gallery',
        category: 'sight',
        estTime: '2 hr',
        estCost: '32',
        assignedDayIdx: 0,
        assignedDate: dayDate,
        startDate: dayDate,
        startTime: '09:30',
        endDate: dayDate,
        endTime: '11:30'
      },
      {
        title: 'Exploratory unassigned food stop',
        category: 'food',
        estTime: '1 hr',
        estCost: '20',
        assignedDayIdx: null,
        assignedDate: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: ''
      }
    ];

    journeys = [{
      id: 'explore-journey-1',
      journeyId: 'explore-journey-1',
      legId: leg.id,
      transportType: 'train',
      journeyName: 'Exploratory transfer',
      provider: 'Rail Test',
      fromLocation: day.from,
      toLocation: day.to,
      departureDate: dayDate,
      departureTime: '14:00',
      arrivalDate: dayDate,
      arrivalTime: '15:00',
      startDate: dayDate,
      startTime: '14:00',
      endDate: dayDate,
      endTime: '15:00',
      status: 'planned',
      done: false
    }];
    window.journeys = journeys;

    stays = [{
      id: 'explore-stay-1',
      city: day.to,
      propertyName: 'Exploratory Hotel',
      provider: 'Hotel Test',
      checkIn: dayDate,
      checkInTime: '16:00',
      checkOut: dayDate,
      checkOutTime: '18:00',
      startDate: dayDate,
      startTime: '16:00',
      endDate: dayDate,
      endTime: '18:00',
      status: 'booked',
      done: false
    }];
    window.stays = stays;

    if (typeof window.setItineraryDayViewMode === 'function') window.setItineraryDayViewMode('timeline');
    if (!window.isEditMode && typeof window.toggleEditMode === 'function') {
      window.toggleEditMode();
    }
    document.body.classList.remove('read-only-mode');
    window.isCompactView = false;
    document.body.classList.remove('compact-view-mode');
    if (typeof window.buildNav === 'function') window.buildNav();
    if (typeof window.buildItinerary === 'function') window.buildItinerary();
    const firstCard = document.querySelector('.day-card');
    if (firstCard) firstCard.classList.add('open');
  });
  await page.waitForSelector(':is(.day-card.open, .compact-day-slide.open) .daily-timeline-time', { state: 'visible' });
}

async function assertNoTimelineColumnOverlap(page) {
  // Cross-platform font/rendering jitter (especially Linux CI) can shift
  // absolute x positions by a noticeable amount, so use a generous tolerance
  // while still ensuring the timeline reads left-to-right.
  const tolerancePx = 24;
  const rows = await page.locator(':is(.day-card.open, .compact-day-slide.open) .daily-timeline-item').evaluateAll(items => items.map(item => {
    const time = item.querySelector('.daily-timeline-time')?.getBoundingClientRect();
    const marker = item.querySelector('.daily-timeline-marker')?.getBoundingClientRect();
    const content = item.querySelector('.daily-timeline-content')?.getBoundingClientRect();
    return time && marker && content
      ? { timeRight: time.right, markerLeft: marker.left, markerRight: marker.right, contentLeft: content.left }
      : null;
  }).filter(Boolean));

  assert(rows.length > 0, 'Timeline should have measurable rows');
  rows.forEach((row, index) => {
    assert(row.timeRight <= row.contentLeft + tolerancePx, `Timeline row ${index} time column should stay left of content`);
    assert(row.markerLeft <= row.contentLeft + tolerancePx, `Timeline row ${index} marker should stay left of content`);
  });
}

async function exerciseTimeline(page, { mobile = false } = {}) {
  await seedTimelineScenario(page);

  assert(await page.locator('#itineraryTimelineModeBtn[aria-pressed="true"]').count() === 1, 'Timeline mode should be active');
  assert(await page.locator(':is(.day-card.open, .compact-day-slide.open) .timeline-section-label', { hasText: 'Scheduled' }).count() > 0, 'Scheduled section should render');
  assert(await page.locator(':is(.day-card.open, .compact-day-slide.open) .timeline-anytime-label', { hasText: 'Anytime' }).count() > 0, 'Anytime section should render');
  await assertNoTimelineColumnOverlap(page);

  await page.evaluate(() => {
    if (typeof window.openDayItemScheduleDialog === 'function') {
      window.openDayItemScheduleDialog(0, 0, 'activityItems', 0);
    }
  });
  await page.waitForSelector('#activity-assign-modal', { state: 'visible' });
  assert(await page.locator('#activity-assign-modal input[value="anytime"]').count() === 1, 'Unified dialog should expose Anytime');
  assert(await page.locator('#activity-assign-modal input[value="suggested"]').count() === 1, 'Unified dialog should expose Suggested');
  assert(await page.locator('#activity-assign-modal input[value="scheduled"]').count() === 1, 'Unified dialog should expose Fixed time');
  assert(await page.locator('#activity-assign-modal .activity-assign-day').count() > 0, 'Unified dialog should expose day picker');

  if (mobile) {
    const modalBox = await page.locator('#activity-assign-modal .modal-content').boundingBox();
    const innerWidth = await page.evaluate(() => window.innerWidth);
    assert(modalBox && modalBox.x >= 0 && modalBox.width <= Math.max(390, innerWidth), 'Mobile schedule modal should fit viewport width');
  }

  await page.locator('#activity-assign-modal input[value="scheduled"]').check();
  await page.locator('#activityAssignStartTime').fill('10:15');
  await page.locator('#activity-assign-modal .activity-assign-day.is-current').click();
  await page.waitForSelector('#activity-assign-modal', { state: 'detached' });
  await page.waitForFunction(() => document.querySelectorAll('.daily-timeline-item.is-schedule-focus').length === 1);

  await page.locator(':is(.day-card.open, .compact-day-slide.open) .daily-timeline-item-activity .activity-checkbox').first().check();
  await page.locator(':is(.day-card.open, .compact-day-slide.open) .daily-timeline-item-transport .transport-checkbox').first().check();
  await page.locator(':is(.day-card.open, .compact-day-slide.open) .daily-timeline-item-stay .stay-checkbox').first().check();

  const payload = await page.evaluate(() => buildExportPayload());
  const day = payload.itinerary[0].days[0];
  const scheduled = day.activityItems.find(item => item.text === 'Exploratory scheduled gallery');
  assert(scheduled, 'Exported JSON should include scheduled activity');
  assert.strictEqual(scheduled.startDate, day.date, 'Scheduled activity should export startDate');
  assert.strictEqual(scheduled.startTime, '10:15', 'Scheduled activity should export updated startTime');
  assert.strictEqual(scheduled.endDate, day.date, 'Scheduled activity should export endDate');
  assert.strictEqual(scheduled.endTime, '12:15', 'Scheduled activity should export duration-derived endTime');
  assert.strictEqual(scheduled.done, true, 'Checked activity should export done=true');
  assert.strictEqual(payload.journeys[0].done, true, 'Checked journey should export done=true');
  assert.strictEqual(payload.journeys[0].startDate, day.date, 'Journey should export plotting startDate');
  assert.strictEqual(payload.journeys[0].endTime, '15:00', 'Journey should export plotting endTime');
  assert.strictEqual(payload.stays[0].done, true, 'Checked stay should export done=true');
  assert.strictEqual(payload.stays[0].startDate, day.date, 'Stay should export plotting startDate');
  assert.strictEqual(payload.stays[0].endTime, '18:00', 'Stay should export plotting endTime');

  await page.evaluate(async data => {
    const file = new File([JSON.stringify(data)], 'roundtrip.json', { type: 'application/json' });
    await window.importJSON({ target: { files: [file], value: '' } });
    window.currentLegIndex = 0;
    if (!window.isEditMode && typeof window.toggleEditMode === 'function') {
      window.toggleEditMode();
    }
    if (typeof window.setItineraryDayViewMode === 'function') window.setItineraryDayViewMode('timeline');
    if (typeof window.buildItinerary === 'function') window.buildItinerary();
    document.querySelector('.day-card')?.classList.add('open');
  }, payload);
  await page.waitForSelector(':is(.day-card.open, .compact-day-slide.open) .daily-timeline-time', { state: 'visible' });
  const roundTrip = await page.evaluate(() => {
    const payload = buildExportPayload();
    const item = payload.itinerary[0].days[0].activityItems.find(candidate => candidate.text === 'Exploratory scheduled gallery');
    return item ? { startDate: item.startDate, startTime: item.startTime, endDate: item.endDate, endTime: item.endTime, done: item.done } : null;
  });
  assert.deepStrictEqual(roundTrip, {
    startDate: payload.itinerary[0].days[0].date,
    startTime: '10:15',
    endDate: payload.itinerary[0].days[0].date,
    endTime: '12:15',
    done: true
  }, 'Round-tripped JSON should preserve activity schedule and completion');

  await page.locator('#itineraryGroupedModeBtn').click();
  await page.waitForFunction(() => window.itineraryDayViewMode === 'grouped');
  assert(await page.locator('.day-view-panel-grouped').count() > 0, 'Grouped view should still render after roundtrip');
  await page.locator('#itineraryTimelineModeBtn').click();
  await page.waitForFunction(() => window.itineraryDayViewMode === 'timeline');
}

async function run() {
  const server = await startStaticServer(root, 0);
  const browser = await chromium.launch();
  try {
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await loadApp(desktop, server.baseUrl);
    await exerciseTimeline(desktop);
    await desktop.close();

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
    await loadApp(mobile, server.baseUrl);
    await exerciseTimeline(mobile, { mobile: true });
    await mobile.close();

    console.log('Itinerary exploratory UX regression passed');
  } finally {
    await browser.close();
    await server.close();
  }
}

if (require.main === module) {
  run().catch(error => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}

module.exports = { run };
