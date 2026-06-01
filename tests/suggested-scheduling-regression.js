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
    if (window.isEditMode === false && typeof window.toggleEditMode === 'function') {
      window.toggleEditMode();
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
      const pool = appData[0].suggestedActivities.find(candidate => candidate.title === title);
      return item ? {
        startDate: item.startDate,
        startTime: item.startTime,
        endDate: item.endDate,
        endTime: item.endTime,
        poolStartDate: pool?.startDate,
        poolEndDate: pool?.endDate,
        poolAssignedDate: pool?.assignedDate
      } : null;
    }, targetActivity);

    assert.deepStrictEqual(assigned, {
      startDate: '2026-06-08',
      startTime: '09:45',
      endDate: '2026-06-08',
      endTime: '11:45',
      poolStartDate: '2026-06-08',
      poolEndDate: '2026-06-08',
      poolAssignedDate: '2026-06-08'
    });

    const scheduledHeading = page.locator('.timeline-section-label', { hasText: 'Scheduled' });
    assert((await scheduledHeading.count()) > 0, 'Timeline should label scheduled items');
    assert.strictEqual(
      await page.locator('.daily-timeline-card h4', { hasText: 'Day Timeline' }).count(),
      0,
      'Detailed timeline should not render the redundant Day Timeline heading'
    );

    await page.evaluate(() => window.setItineraryDayViewMode('grouped'));
    await page.evaluate(() => window.setDayItemScheduleMode(0, 0, 'activityItems', 0, 'anytime'));
    await page.waitForFunction(() => window.itineraryDayViewMode === 'grouped');
    assert.strictEqual(
      await page.locator('#itineraryGroupedModeBtn').getAttribute('aria-pressed'),
      'true',
      'Global grouped mode button should stay active after a schedule edit'
    );
    assert.strictEqual(
      await page.locator('.day-view-tabs').count(),
      0,
      'Timeline / Grouped selector should not render inside every day card'
    );
    assert.strictEqual(
      await page.locator('.day-planner-shell-grouped .day-view-panel-grouped').count() > 0,
      true,
      'Changing schedule mode should preserve the global grouped day view'
    );

    await page.evaluate(() => window.setItineraryDayViewMode('timeline'));
    const activeDayKey = await page.evaluate(() => {
      const activityCard = Array.from(document.querySelectorAll('.day-card'))
        .find(card => card.querySelector('.daily-timeline-time.is-clickable'));
      activityCard?.classList.add('open');
      return activityCard?.dataset.dayKey || '';
    });
    assert(activeDayKey, 'An open day should expose a stable day key');
    const visibleActivityScheduleButtons = page.locator('.day-card.open .daily-timeline-time.is-clickable');
    assert((await visibleActivityScheduleButtons.count()) > 0, 'An open day should expose visible activity schedule buttons');
    await visibleActivityScheduleButtons.nth(0).click();
    await page.waitForSelector('#activity-assign-modal', { state: 'visible' });
    assert.strictEqual(
      await page.locator('#activity-assign-modal input[name="activityAssignScheduleMode"][value="scheduled"]').count(),
      1,
      'Timeline time badge should open the unified activity assignment/schedule dialog'
    );
    assert.strictEqual(
      await page.locator('#activity-assign-modal input[name="activityAssignScheduleMode"][value="suggested"]').count(),
      1,
      'Unified schedule dialog should expose Suggested mode'
    );
    await page.locator('#activity-assign-modal input[name="activityAssignScheduleMode"][value="scheduled"]').check();
    await page.locator('#activityAssignStartTime').fill('10:15');
    await page.locator('#activity-assign-modal .activity-assign-day.is-current').click();
    await page.waitForSelector('#activity-assign-modal', { state: 'detached' });
    await page.waitForFunction(() => window.itineraryDayViewMode === 'timeline');
    assert.strictEqual(
      await page.locator('#itineraryTimelineModeBtn').getAttribute('aria-pressed'),
      'true',
      'Saving from the schedule dialog should preserve the global timeline day view'
    );
    assert.strictEqual(
      await page.evaluate(dayKey => document.querySelector(`.day-card[data-day-key="${dayKey}"]`)?.classList.contains('open') === true, activeDayKey),
      true,
      'Saving from the schedule dialog should keep the same day card open'
    );
    await page.waitForFunction(() => document.querySelectorAll('.daily-timeline-item.is-schedule-focus').length === 1);
    assert.strictEqual(
      await page.locator('.daily-timeline-item.is-schedule-focus').count(),
      1,
      'Moved timeline item should receive focus styling after the rebuild'
    );
    const exportedTimelineFields = await page.evaluate(() => {
      const payload = buildExportPayload();
      const day = payload.itinerary[0].days[0];
      const activity = day.activityItems.find(item => item.startTime === '10:15');
      const journey = payload.journeys[0];
      const stay = payload.stays[0];
      return {
        activity: activity ? {
          startDate: activity.startDate,
          startTime: activity.startTime,
          endDate: activity.endDate,
          endTime: activity.endTime
        } : null,
        journey: journey ? {
          startDate: journey.startDate,
          startTime: journey.startTime,
          endDate: journey.endDate,
          endTime: journey.endTime
        } : null,
        stay: stay ? {
          startDate: stay.startDate,
          startTime: stay.startTime,
          endDate: stay.endDate,
          endTime: stay.endTime
        } : null
      };
    });
    assert.deepStrictEqual(exportedTimelineFields.activity, {
      startDate: '2026-06-08',
      startTime: '10:15',
      endDate: '2026-06-08',
      endTime: '12:15'
    });
    assert(exportedTimelineFields.journey?.startDate, 'Exported journeys should include plotting startDate');
    assert('startTime' in exportedTimelineFields.journey, 'Exported journeys should include plotting startTime');
    assert(exportedTimelineFields.stay?.startDate, 'Exported stays should include plotting startDate');
    assert('startTime' in exportedTimelineFields.stay, 'Exported stays should include plotting startTime');

    const timelineCheckboxes = page.locator('.day-card.open .daily-timeline-item-activity .daily-timeline-checkbox.activity-checkbox');
    assert((await timelineCheckboxes.count()) > 0, 'An open timeline activity should expose a completion checkbox');
    await timelineCheckboxes.nth(0).check();
    await page.waitForFunction(dayKey => document.querySelector(`.day-card[data-day-key="${dayKey}"]`)?.classList.contains('open') === true, activeDayKey);
    assert.strictEqual(
      await page.locator('#itineraryTimelineModeBtn').getAttribute('aria-pressed'),
      'true',
      'Toggling an inline timeline activity should preserve the selected global timeline view'
    );

    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => {
      document.body.classList.add('mobile-app-mode');
      window.openActivityAssignModal(0, 0);
    });
    await page.waitForSelector('#activity-assign-modal', { state: 'visible' });
    await page.locator('#activity-assign-modal input[name="activityAssignScheduleMode"][value="suggested"]').check();
    const mobileSuggestedLayout = await page.evaluate(() => {
      const dayWrap = document.querySelector('.activity-assign-days-wrap')?.getBoundingClientRect();
      const firstDay = document.querySelector('.activity-assign-day')?.getBoundingClientRect();
      const footer = document.querySelector('.activity-assign-footer')?.getBoundingClientRect();
      const timeRow = document.querySelector('.activity-assign-time-row')?.getBoundingClientRect();
      return {
        scrollWidth: document.body.scrollWidth,
        viewportWidth: window.innerWidth,
        dayWrapTop: dayWrap?.top || 0,
        firstDayTop: firstDay?.top || 0,
        footerTop: footer?.top || 0,
        timeRowVisible: !!timeRow && timeRow.height > 1
      };
    });
    assert(mobileSuggestedLayout.scrollWidth <= mobileSuggestedLayout.viewportWidth, 'Mobile schedule dialog should not overflow horizontally');
    assert(mobileSuggestedLayout.dayWrapTop < mobileSuggestedLayout.footerTop, 'Mobile schedule dialog should expose the day picker before sticky actions');
    assert(mobileSuggestedLayout.firstDayTop < mobileSuggestedLayout.footerTop, 'Mobile schedule dialog should expose a suggested slot before sticky actions');
    assert.strictEqual(mobileSuggestedLayout.timeRowVisible, false, 'Mobile Suggested mode should hide fixed-time selects');
    await page.locator('#activity-assign-modal input[name="activityAssignScheduleMode"][value="scheduled"]').check();
    assert.strictEqual(
      await page.evaluate(() => {
        const row = document.querySelector('.activity-assign-time-row')?.getBoundingClientRect();
        return !!row && row.height > 1;
      }),
      true,
      'Mobile Fixed time mode should reveal start/end selects'
    );
    await page.locator('#activity-assign-modal .modal-close').click();
    await page.waitForSelector('#activity-assign-modal', { state: 'detached' });

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
