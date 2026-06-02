const fs = require('fs');
const path = require('path');
const { chromium, devices } = require('playwright');
const { assert } = require('./lib/test-helpers');
const { startStaticServer } = require('./lib/static-server');

function parseCliFlags(argv) {
  const flags = {
    headed: false,
    slowMo: 0
  };

  for (const arg of argv) {
    if (arg === '--headed') {
      flags.headed = true;
    } else if (arg.startsWith('--slowmo=')) {
      const value = Number(arg.slice('--slowmo='.length));
      if (Number.isFinite(value) && value >= 0) flags.slowMo = value;
    }
  }

  if (process.env.PLAYWRIGHT_HEADED === '1') flags.headed = true;
  if (process.env.PLAYWRIGHT_SLOWMO) {
    const value = Number(process.env.PLAYWRIGHT_SLOWMO);
    if (Number.isFinite(value) && value >= 0) flags.slowMo = value;
  }

  return flags;
}

function createReporter() {
  const entries = [];
  return {
    add(scope, name, detail = '') {
      entries.push({ scope, name, detail });
      const suffix = detail ? ` - ${detail}` : '';
      console.log(`[${scope}] ${name}${suffix}`);
    },
    fail(scope, name, error) {
      entries.push({ scope, name, error });
      console.error(`[${scope}] ${name} FAILED`);
      console.error(error.stack || error.message || String(error));
    },
    summarize() {
      const passed = entries.filter(entry => !entry.error).length;
      const failed = entries.filter(entry => entry.error).length;
      console.log('');
      console.log('Browser coverage summary');
      entries.filter(entry => !entry.error).forEach(entry => {
        console.log(`- ${entry.scope}: ${entry.name}${entry.detail ? ` (${entry.detail})` : ''}`);
      });
      if (failed > 0) {
        console.log(`Failed checks: ${failed}`);
      } else {
        console.log(`Passed checks: ${passed}`);
      }
      return { passed, failed };
    }
  };
}

async function humanPause(page, ms = 400) {
  await page.waitForTimeout(ms);
}

async function selectOptionByIndex(locator, index) {
  await locator.selectOption({ index });
}

async function clickVisibleButton(page, namePattern) {
  const button = page.getByRole('button', { name: namePattern }).first();
  await button.click();
  await humanPause(page, 300);
  return button;
}

async function waitForAppReady(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => typeof window.getCurrentAppData === 'function');
  await page.waitForFunction(() => document.querySelectorAll('#cityNav .city-nav-btn').length > 0);
}

async function collectConsoleErrors(page) {
  const errors = [];
  const shouldIgnoreError = message =>
    String(message || '').includes('Failed to load resource: net::ERR_NAME_NOT_RESOLVED');
  page.on('pageerror', error => {
    const text = error?.message || '';
    if (!shouldIgnoreError(text)) errors.push(text);
  });
  page.on('console', message => {
    if (message.type() === 'error') {
      const text = message.text();
      if (!shouldIgnoreError(text)) errors.push(text);
    }
  });
  return errors;
}

async function openApp(baseUrl, options = {}) {
  const browser = await chromium.launch({
    headless: !options.headed,
    slowMo: options.slowMo || 0,
    args: options.headed ? ['--start-maximized'] : []
  });
  const contextOptions = { ...(options.contextOptions || {}) };
  if (options.headed && !contextOptions.viewport) {
    contextOptions.viewport = null;
  }
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  const errors = await collectConsoleErrors(page);
  await page.goto(`${baseUrl}/index.html`, { waitUntil: 'networkidle' });
  await waitForAppReady(page);
  return { browser, context, page, errors };
}

async function runDesktopChecks(baseUrl, reporter, launchOptions = {}) {
  const { browser, context, page, errors } = await openApp(baseUrl, launchOptions);
  try {
    reporter.add('desktop', 'boot', 'index.html loaded in Chromium');
    assert(errors.length === 0, `Desktop page errors: ${errors.join(' | ')}`);
    assert(await page.locator('#cityNav .city-nav-btn').count() > 0, 'Desktop: city nav should render');
    assert(await page.locator('#itinerary .leg').count() > 0, 'Desktop: itinerary should render');

    await page.locator('.app-tab-btn[data-tab="itinerary"]').click();
    await humanPause(page, 350);

    for (const tabId of ['transport', 'accom', 'budget', 'packing']) {
      await page.locator(`.app-tab-btn[data-tab="${tabId}"]`).click();
      await humanPause(page, 250);
    }
    assert(await page.locator('#transport-table-container').textContent(), 'Desktop: transport tab should render');
    assert(await page.locator('#accom-table-container').textContent(), 'Desktop: accommodation tab should render');
    assert((await page.locator('#transport-table-container thead').innerText()).includes('Booking Ref'), 'Desktop: transport table should show booking ref column');
    await page.evaluate(() => {
      const target = (window.journeys || [])[0];
      if (!target || typeof window.editJourney !== 'function') throw new Error('No journey available to edit');
      window.editJourney(target.journeyId || target.id);
    });
    await page.waitForSelector('#journey-modal', { state: 'visible' });
    assert(await page.locator('#journey-modal .journey-form-card > .journey-form-group-panel').count() === 2, 'Desktop: journey modal should use two main form panels');
    const journeyLabels = await page.locator('#journey-modal .journey-form-group-panel label').allTextContents();
    for (const label of ['Departure Date', 'Departure Time', 'Arrival Date', 'Arrival Time', 'Notes']) {
      assert(journeyLabels.includes(label), `Desktop: journey modal should show ${label}`);
    }
    await page.locator('#journeyToCity').selectOption('__add_new_city__');
    await page.waitForSelector('#city-modal', { state: 'visible' });
    const modalStack = await page.evaluate(() => ({
      city: Number(getComputedStyle(document.querySelector('#city-modal')).zIndex),
      journey: Number(getComputedStyle(document.querySelector('#journey-modal')).zIndex)
    }));
    assert(modalStack.city > modalStack.journey, 'Desktop: add-city dialog should stack above journey modal');
    await page.locator('#city-modal .modal-close').click();
    await page.waitForSelector('#city-modal', { state: 'hidden' });
    await page.locator('#journey-modal .modal-close').click();
    await page.waitForSelector('#journey-modal', { state: 'hidden' });
    reporter.add('desktop', 'edit journey dialog layout', 'two panels with explicit date/time labels');
    await page.setViewportSize({ width: 900, height: 850 });
    for (const tableTabId of ['transport', 'accom']) {
      await page.locator(`.app-tab-btn[data-tab="${tableTabId}"]`).click();
      await humanPause(page, 250);
      const tableMetrics = await page.evaluate((tabId) => {
        const shell = document.querySelector(`#tab-${tabId} .travel-data-table-shell`);
        const actionCell = document.querySelector(`#tab-${tabId} .travel-data-table tbody tr td:last-child`);
        if (!shell || !actionCell) return null;
        const shellRect = shell.getBoundingClientRect();
        const actionRect = actionCell.getBoundingClientRect();
        return { actionRight: actionRect.right, shellRight: shellRect.right };
      }, tableTabId);
      assert(tableMetrics && tableMetrics.actionRight <= tableMetrics.shellRight + 1, `Desktop: ${tableTabId} action buttons should remain visible at narrow desktop width`);
    }
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.locator('.app-tab-btn[data-tab="accom"]').click();
    await humanPause(page, 250);
    const accomHead = await page.locator('#accom-table-container thead').innerText();
    assert(accomHead.toLowerCase().includes('provider'), 'Desktop: accommodation table should show provider column');
    assert(accomHead.toLowerCase().includes('booking ref'), 'Desktop: accommodation table should show booking ref column');
    assert(await page.locator('#budget-kpi-container').textContent(), 'Desktop: budget tab should render');
    assert(await page.locator('#packing-areas-container').textContent(), 'Desktop: packing tab should render');

    await page.locator('.app-tab-btn[data-tab="itinerary"]').click();
    await humanPause(page, 350);

    const legEditorBtn = page.locator('button:has-text("Manage Legs"), button:has-text("Leg Editor"), button:has-text("+ Add Trip Leg")').first();
    await legEditorBtn.click();
    await page.waitForSelector('#add-leg-modal', { state: 'visible' });
    await humanPause(page, 400);
    await page.locator('#legTypeSelect').selectOption('city');
    await humanPause(page, 250);
    await page.locator('#existingCitySelect').selectOption({ index: 1 });
    await page.locator('#newLegStartDate').fill('15 Jun');
    await page.locator('#newLegEndDate').fill('18 Jun');
    await page.locator('#legDialogSaveBtn, button:has-text("Add Leg"), button:has-text("Update Leg")').first().click();
    await page.waitForSelector('#add-leg-modal', { state: 'hidden' });
    await humanPause(page, 500);
    reporter.add('desktop', 'add trip leg', 'opened modal, filled fields, saved leg');

    await page.locator('.app-tab-btn[data-tab="accom"]').click();
    await humanPause(page, 350);
    await page.evaluate(() => {
      if (document.body.classList.contains('read-only-mode') && typeof toggleEditMode === 'function') {
        toggleEditMode();
      }
    });
    await page.waitForFunction(() => !document.body.classList.contains('read-only-mode'));
    await page.locator('#tab-accom .action-btn:has-text("+ Add Stay")').click();
    await page.waitForSelector('#stay-modal', { state: 'visible' });
    await humanPause(page, 400);
    await page.locator('#stayPropertyName').fill('Harbour View Inn');
    await selectOptionByIndex(page.locator('#stayCitySelect'), 1);
    await page.locator('#stayCheckIn').fill('2026-06-01');
    await page.locator('#stayCheckOut').fill('2026-06-04');
    await page.locator('#stayNights').click().catch(() => {});
    await page.locator('#stayStatus').selectOption('booked');
    await page.locator('#stayProvider').fill('Booking.com');
    await page.locator('#stayBookingRef').fill('STAY-UI-1');
    await page.locator('#stayTotalCost').fill('600');
    await page.locator('#stayNotes').fill('Visible headed test stay');
    await page.locator('#stay-modal button:has-text("Save Stay")').click();
    await page.waitForSelector('#stay-modal', { state: 'hidden' });
    await humanPause(page, 500);
    assert(await page.getByText('Harbour View Inn', { exact: false }).count() > 0, 'Desktop: stay should appear after saving from modal');
    reporter.add('desktop', 'add stay', 'opened modal, filled fields, saved stay');

    await page.locator('.app-tab-btn[data-tab="itinerary"]').click();
    await humanPause(page, 350);
    await page.evaluate(() => {
      if (document.body.classList.contains('read-only-mode') && typeof toggleEditMode === 'function') {
        toggleEditMode();
      }
    });
    await page.waitForFunction(() => !document.body.classList.contains('read-only-mode'));
    await page.locator('#tab-itinerary button:has-text("+ Add Activity")').first().click();
    await page.locator('#activityTitle').waitFor({ state: 'visible' });
    await humanPause(page, 350);
    await page.locator('#activityCategory').selectOption('sight');
    await page.locator('#activityTitle').fill('Watch the skyline');
    await page.locator('#activityLocation').fill('Riverside');
    await page.locator('#activityTime').fill('2 hr');
    await page.locator('#activityCost').fill('25');
    await page.locator('#saveActivityBtn').click();
    await page.locator('#activityTitle').waitFor({ state: 'hidden' });
    await humanPause(page, 500);
    assert(await page.getByText('Watch the skyline', { exact: false }).count() > 0, 'Desktop: activity should appear after saving from modal');

    const activityLeg = page.locator('#itinerary .leg').filter({ hasText: 'Watch the skyline' }).first();
    if (await activityLeg.evaluate(el => el.classList.contains('collapsed'))) {
      await activityLeg.locator('.leg-header').click();
      await humanPause(page, 350);
    }
    const draggableSight = page.locator('#itinerary .draggable-sight').filter({ hasText: 'Watch the skyline' }).first();
    const targetDayCard = page.locator('#itinerary .day-card').first();
    if (!(await targetDayCard.evaluate(el => el.classList.contains('open')))) {
      await targetDayCard.locator('.day-bar').click();
      await humanPause(page, 350);
    }
    const dropZone = targetDayCard.locator('.drop-zone').first();
    await draggableSight.scrollIntoViewIfNeeded();
    await dropZone.scrollIntoViewIfNeeded();
    await humanPause(page, 350);
    await draggableSight.dragTo(dropZone);
    await humanPause(page, 600);
    reporter.add('desktop', 'drag drop', 'dragged a sight into a day card');



    await page.locator('#desktopActionsMenu > summary').click();
    await humanPause(page, 250);
    await page.getByRole('button', { name: /Export AI Summary/i }).click();
    const summaryText = await page.evaluate(() => {
      const state = getCurrentAppData();
      return state.meta.title;
    });
    assert(summaryText, 'Desktop: state should still be queryable after export');
    reporter.add('desktop', 'state access', 'getCurrentAppData is callable');

    await page.evaluate(() => openBookingIntakeDialog());
    await page.waitForSelector('#booking-intake-modal', { state: 'visible' });
    await page.locator('#bookingIntakeText').fill(`
      FlyAway confirmation
      Booking reference: UI93A1
      Flight FA204
      From Testville to Demo City
      Departure: 20 Jun 2026 08:30
      Arrival: 20 Jun 2026 10:45

      Hotel: Demo City Rooms
      Check-in: 20 Jun 2026
      Check-out: 22 Jun 2026
      City: Demo City
    `);
    await page.getByRole('button', { name: /Extract & Review/i }).click();
    await page.waitForFunction(() => document.querySelectorAll('.booking-intake-card').length >= 2);
    await page.getByRole('button', { name: /Merge selected/i }).click();
    await page.waitForFunction(() => (window.journeys || []).some(j => j.bookingReference === 'UI93A1'));
    const intakeMerged = await page.evaluate(() => ({
      journeys: (window.journeys || []).filter(j => j.bookingReference === 'UI93A1').length,
      stays: (window.stays || []).filter(stay => stay.bookingRef === 'UI93A1').length
    }));
    assert(intakeMerged.journeys === 1, 'Desktop: booking intake should merge extracted journey');
    assert(intakeMerged.stays === 1, 'Desktop: booking intake should merge extracted stay');
    await page.evaluate(() => closeBookingIntakeDialog());
    reporter.add('desktop', 'booking intake', 'extracted and merged pasted confirmation');

    const downloadPromise = page.waitForEvent('download');
    await page.locator('#desktopActionsMenu > summary').click();
    await humanPause(page, 250);
    await page.getByRole('button', { name: /Export AI Summary/i }).click();
    const download = await downloadPromise;
    const downloadPath = await download.path();
    const summaryFile = downloadPath ? fs.readFileSync(downloadPath, 'utf8') : '';
    assert(summaryFile.includes('AI ITINERARY SUMMARY'), 'Desktop: summary export should contain expected heading');
    reporter.add('desktop', 'export summary', 'downloaded AI summary text');

    await page.evaluate(async () => {
      const data = getCurrentAppData();
      data.meta.title = 'Desktop Import Test';
      const file = new File([JSON.stringify(data)], 'import.json', { type: 'application/json' });
      await importJSON({ target: { files: [file], value: '' } });
    });
    await page.waitForFunction(() => document.getElementById('mainTitle').innerText.includes('Desktop Import Test'));
    reporter.add('desktop', 'import json', 'importJSON accepted browser File');

    const swCount = await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length);
    assert(swCount >= 0, 'Desktop: service worker registration query should succeed');
    reporter.add('desktop', 'service worker', `registrations=${swCount}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

async function runMobileChecks(baseUrl, reporter, launchOptions = {}) {
  const { browser, context, page, errors } = await openApp(baseUrl, {
    ...launchOptions,
    contextOptions: {
      ...devices['iPhone 12'],
      locale: 'en-AU'
    }
  });
  try {
    reporter.add('mobile', 'boot', 'iPhone 12 emulation');
    assert(errors.length === 0, `Mobile page errors: ${errors.join(' | ')}`);
    assert(await page.locator('body.mobile-app-mode').count() === 1, 'Mobile: body should be in mobile mode');
    assert(await page.locator('body.compact-view-mode').count() === 1, 'Mobile: compact view should be enabled');

    for (const tabId of ['transport', 'accom', 'budget', 'packing']) {
      await page.locator(`.app-tab-btn[data-tab="${tabId}"]`).click();
      await humanPause(page, 250);
    }

    await page.evaluate(() => toggleMobileMenu());
    await page.waitForFunction(() => document.body.classList.contains('mobile-menu-open'));
    await humanPause(page, 400);
    assert(await page.getByRole('button', { name: /Import Booking/i }).count() > 0, 'Mobile: booking intake entry should be available from menu');
    reporter.add('mobile', 'menu sheet', 'mobile menu opened');

    await page.evaluate(() => {
      if (window.isEditMode && typeof toggleEditMode === 'function') {
        toggleEditMode();
      }
    });
    await page.waitForFunction(() => window.isEditMode === false || document.body.classList.contains('read-only-mode'));
    await humanPause(page, 350);
    reporter.add('mobile', 'read-only toggle', 'read-only mode toggled');

    await page.evaluate(() => {
      if (document.body.classList.contains('mobile-menu-open') && typeof toggleMobileMenu === 'function') {
        toggleMobileMenu();
      }
    });
    await page.waitForFunction(() => !document.body.classList.contains('mobile-menu-open'));
    await humanPause(page, 250);

    await page.locator('.app-tab-btn[data-tab="itinerary"]').click();
    await page.evaluate(() => {
      if (!window.isEditMode && typeof toggleEditMode === 'function') {
        toggleEditMode();
      }
    });
    await page.waitForFunction(() => window.isEditMode === true);
    await humanPause(page, 350);
    assert(await page.locator('#tab-itinerary .mobile-panel-add-btn').count() === 0, 'Mobile: add actions should stay hidden until a section is expanded');
    await page.locator('#tab-itinerary .compact-mobile-info-chip[title="Activities"]').first().click();
    await page.waitForSelector('#tab-itinerary .mobile-panel-add-btn:has-text("+ Add Activity")', { state: 'visible' });
    assert(await page.locator('#tab-itinerary .mobile-panel-add-btn').count() === 1, 'Mobile: only expanded section should show its add action');
    await page.locator('#tab-itinerary .mobile-panel-add-btn:has-text("+ Add Activity")').first().click();
    await page.waitForSelector('#activity-assign-modal', { state: 'visible' });
    await page.locator('#activity-assign-modal .modal-close').click();
    await page.waitForSelector('#activity-assign-modal', { state: 'detached' });
    await page.locator('#tab-itinerary .compact-mobile-info-chip[title="Food quests"]').first().click();
    await page.waitForSelector('#tab-itinerary .mobile-panel-add-btn:has-text("+ Add Food")', { state: 'visible' });
    await page.locator('#tab-itinerary .mobile-panel-add-btn:has-text("+ Add Food")').first().click();
    await page.waitForSelector('.modal-overlay #foodName', { state: 'visible' });
    await page.locator('.modal-overlay:has(#foodName) .modal-close').click();
    await page.waitForSelector('.modal-overlay #foodName', { state: 'detached' });
    await page.locator('#tab-itinerary .compact-mobile-info-chip[title="Tips"]').first().click();
    await page.waitForSelector('#tab-itinerary .mobile-panel-add-btn:has-text("+ Add Tip")', { state: 'visible' });
    reporter.add('mobile', 'itinerary add actions', 'section-level add actions appear only when expanded');

    await page.locator('.app-tab-btn[data-tab="accom"]').click();
    await humanPause(page, 350);
    await page.locator('#tab-accom .action-btn:has-text("+ Add Stay")').click();
    await page.waitForSelector('#stay-modal', { state: 'visible' });
    await humanPause(page, 350);
    await page.locator('#stayPropertyName').fill('Mobile Watch Hotel');
    await selectOptionByIndex(page.locator('#stayCitySelect'), 1);
    await page.locator('#stayCheckIn').fill('2026-06-10');
    await page.locator('#stayCheckOut').fill('2026-06-12');
    await page.locator('#stayProvider').fill('Airbnb');
    await page.locator('#stayTotalCost').fill('250');
    await page.locator('#stay-modal button:has-text("Save Stay")').click();
    await page.waitForSelector('#stay-modal', { state: 'hidden' });
    await humanPause(page, 500);
    assert(await page.getByText('Mobile Watch Hotel', { exact: false }).count() > 0, 'Mobile: stay should appear after saving from modal');
    reporter.add('mobile', 'add stay', 'opened mobile modal, filled fields, saved stay');

    await page.evaluate(() => openShareExportDialog());
    await page.waitForFunction(() => document.getElementById('share-export-modal').style.display === 'flex');
    await humanPause(page, 400);
    reporter.add('mobile', 'share export', 'share modal opened');

    await page.evaluate(() => closeShareExportDialog());
    await page.waitForFunction(() => document.getElementById('share-export-modal').style.display === 'none');

    await page.evaluate(() => toggleMobileMenu());
    await page.waitForFunction(() => document.body.classList.contains('mobile-menu-open'));
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Export AI Summary/i }).click();
    const download = await downloadPromise;
    const downloadPath = await download.path();
    const summaryFile = downloadPath ? fs.readFileSync(downloadPath, 'utf8') : '';
    assert(summaryFile.includes('AI ITINERARY SUMMARY'), 'Mobile: summary export should contain expected heading');
    reporter.add('mobile', 'export summary', 'downloaded AI summary text');
  } finally {
    await context.close();
    await browser.close();
  }
}

async function run() {
  const reporter = createReporter();
  const cliFlags = parseCliFlags(process.argv.slice(2));
  const launchOptions = {
    ...cliFlags,
    slowMo: cliFlags.slowMo || (cliFlags.headed ? 400 : 0)
  };
  const server = await startStaticServer(path.resolve(__dirname, '..'));
  try {
    reporter.add('server', 'start', server.baseUrl);
    reporter.add('browser', 'mode', launchOptions.headed ? 'headed Chromium' : 'headless Chromium');
    if (launchOptions.slowMo > 0) {
      reporter.add('browser', 'slowmo', `${launchOptions.slowMo}ms`);
    }
    await runDesktopChecks(server.baseUrl, reporter, launchOptions);
    await runMobileChecks(server.baseUrl, reporter, launchOptions);
    reporter.summarize();
    console.log('Browser suite passed');
  } finally {
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
