const {
  assert,
  bootstrapApp,
  createBrowserHarness,
  loadAppScripts
} = require('./lib/browser-harness');

function decodeDownloadUri(uri) {
  const commaIndex = String(uri || '').indexOf(',');
  return commaIndex === -1 ? '' : decodeURIComponent(uri.slice(commaIndex + 1));
}

async function settle(harness) {
  harness.flushTimers();
  await Promise.resolve();
  await Promise.resolve();
}

async function createBootedApp(options = {}) {
  const harness = createBrowserHarness(options);
  loadAppScripts(harness);
  bootstrapApp(harness);
  if (harness.context.appInitPromise && typeof harness.context.appInitPromise.then === 'function') {
    await harness.context.appInitPromise;
  }
  return harness;
}

function assertBootClean(harness, label) {
  assert(harness.errors.length === 0, `${label}: unexpected console errors: ${JSON.stringify(harness.errors)}`);
}

function state(context) {
  return context.getCurrentAppData();
}

async function testDesktopSmoke() {
  const app = await createBootedApp();
  assertBootClean(app, 'Desktop smoke');
  assert(app.document.getElementById('cityNav').children.length > 0, 'Desktop smoke: city nav should render buttons');
  assert(app.document.getElementById('itinerary').children.length > 0, 'Desktop smoke: itinerary should render legs');
  app.context.buildPackingTab();
  assert(state(app.context).packing.some(area => String(area.areaName || '').includes('Trip Notes')), 'Desktop smoke: packing should include trip notes');
  assert(app.document.getElementById('transport-table-container').innerHTML.length >= 0, 'Desktop smoke: transport container should exist');
  assert(app.document.getElementById('accom-table-container').innerHTML.length >= 0, 'Desktop smoke: accom container should exist');
  assert(app.document.getElementById('budget-table-container').innerHTML.length >= 0, 'Desktop smoke: budget container should exist');
  assert(app.document.getElementById('packing-areas-container').innerHTML.length >= 0, 'Desktop smoke: packing container should exist');
}

async function testMobileSmoke() {
  const app = await createBootedApp({ mobile: true });
  assertBootClean(app, 'Mobile smoke');
  assert(app.context.isCompactView === true, 'Mobile smoke: compact view should default on mobile');
  assert(app.document.body.classList.contains('mobile-app-mode'), 'Mobile smoke: body should have mobile app mode');
  assert(app.document.body.classList.contains('compact-view-mode'), 'Mobile smoke: body should have compact mode');

  app.context.buildItinerary();
  app.context.buildTransportTab();
  app.context.buildAccomTab();
  app.context.buildBudgetTab();
  app.context.buildPackingTab();
  app.context.buildJourneyMap();

  assert(app.document.getElementById('itinerary').children.length > 0, 'Mobile smoke: itinerary should render');
  assert(app.document.getElementById('transport-table-container').innerHTML.length > 0, 'Mobile smoke: transport should render');
  assert(app.document.getElementById('accom-table-container').innerHTML.length > 0, 'Mobile smoke: accom should render');
  assert(app.document.getElementById('budget-table-container').innerHTML.length > 0, 'Mobile smoke: budget should render');
  assert(app.document.getElementById('packing-areas-container').innerHTML.length > 0, 'Mobile smoke: packing should render');
  assert(app.document.getElementById('journey-map-view').innerHTML.length > 0, 'Mobile smoke: map should render');
}

async function testCrudSmoke() {
  const app = await createBootedApp();
  const { context } = app;
  assertBootClean(app, 'CRUD smoke');

  const originalLegCount = state(context).itinerary.length;
  context.addLeg();
  assert(state(context).itinerary.length === originalLegCount + 1, 'CRUD smoke: addLeg should add a leg');
  const testLegIdx = state(context).itinerary.findIndex(leg =>
    Array.isArray(leg.cityRun) && Array.isArray(leg.cityFood) && Array.isArray(leg.legTips)
  );
  assert(testLegIdx >= 0, 'CRUD smoke: new leg should be discoverable');

  context.addFood(testLegIdx);
  app.document.getElementById('foodName').value = 'Sushi bar';
  app.document.getElementById('foodCost').value = '42';
  app.document.getElementById('saveFoodBtn').click();
  await settle(app);
  assert(state(context).itinerary[testLegIdx].cityFood.some(item => item.text === 'Sushi bar'), 'CRUD smoke: addFood should add a food item');
  context.updateFoodText(testLegIdx, 0, 'Updated dish');
  assert(state(context).itinerary[testLegIdx].cityFood[0].text === 'Updated dish', 'CRUD smoke: updateFoodText should edit food');
  context.deleteFood(testLegIdx, 0);
  assert(!state(context).itinerary[testLegIdx].cityFood.some(item => item.text === 'Updated dish'), 'CRUD smoke: deleteFood should remove food');

  context.addRun(testLegIdx);
  context.updateRunPool(testLegIdx, 0, 'title', 'Morning loop');
  assert(state(context).itinerary[testLegIdx].cityRun[0].title === 'Morning loop', 'CRUD smoke: addRun/updateRunPool should edit run');
  context.deleteRun(testLegIdx, 0);
  assert(!state(context).itinerary[testLegIdx].cityRun.some(item => item.title === 'Morning loop'), 'CRUD smoke: deleteRun should remove run');

  context.addSight(testLegIdx);
  context.updateSightPool(testLegIdx, 0, 'title', 'Museum stop');
  assert(state(context).itinerary[testLegIdx].suggestedSights[0].title === 'Museum stop', 'CRUD smoke: addSight/updateSightPool should edit sight');
  context.deleteSight(testLegIdx, 0);
  assert(state(context).itinerary[testLegIdx].suggestedSights.length === 0, 'CRUD smoke: deleteSight should remove sight');

  context.addLegTip(testLegIdx);
  context.updateLegTip(testLegIdx, 0, 'Pack snacks');
  assert(state(context).itinerary[testLegIdx].legTips[0] === 'Pack snacks', 'CRUD smoke: addLegTip/updateLegTip should edit tips');
  context.deleteLegTip(testLegIdx, 0);
  assert(!state(context).itinerary[testLegIdx].legTips.some(item => item === 'Pack snacks'), 'CRUD smoke: deleteLegTip should remove tip');

  context.addDayItem(testLegIdx, 0, 'activityItems');
  context.updateDayItemText(testLegIdx, 0, 'activityItems', 0, 'Walk the city');
  context.updateDayItemCost(testLegIdx, 0, 'activityItems', 0, '15');
  assert(state(context).itinerary[testLegIdx].days[0].activityItems[0].text === 'Walk the city', 'CRUD smoke: updateDayItemText should edit day item');
  assert(state(context).itinerary[testLegIdx].days[0].activityItems[0].cost === '15', 'CRUD smoke: updateDayItemCost should edit day item cost');
  context.deleteDayItem(testLegIdx, 0, 'activityItems', 0);
  assert(!state(context).itinerary[testLegIdx].days[0].activityItems.some(item => item.text === 'Walk the city'), 'CRUD smoke: deleteDayItem should remove day item');

  const targetLegIdx = state(context).itinerary.findIndex(leg => leg.id === 'leg-1' || leg.days?.[0]?.date === '2026-01-01');
  assert(targetLegIdx >= 0, 'CRUD smoke: should find the original start leg');

  context.addLeg();
  const newlyAddedLegIdx = state(context).itinerary.findIndex(leg => leg.label === '📍 New City' || leg.days?.[0]?.date === 'DD Mon');
  assert(newlyAddedLegIdx >= 0, 'CRUD smoke: should find the temporary leg used for conflict testing');
  context.updateDayData(newlyAddedLegIdx, 0, 'date', '2026-01-02');
  context.updateDayData(newlyAddedLegIdx, 0, 'day', 'Tue');

  const legZeroStartLength = state(context).itinerary[targetLegIdx].days.length;
  let conflictWarning = '';
  const originalConfirm = context.confirm;
  context.confirm = message => {
    conflictWarning = message;
    return true;
  };
  context.adjustLegDays(targetLegIdx, 1);
  context.confirm = originalConfirm;
  assert(
    state(context).itinerary[targetLegIdx].days.length === legZeroStartLength + 1,
    'CRUD smoke: adjustLegDays should add a day to the leg'
  );
  assert(
    state(context).itinerary[targetLegIdx].days[1].date === '2026-01-02',
    'CRUD smoke: added day should advance to the next calendar date'
  );
  assert(
    state(context).itinerary[targetLegIdx].days[1].day === 'Fri',
    'CRUD smoke: added day should refresh the weekday label'
  );
  assert(
    conflictWarning.includes('overlap'),
    'CRUD smoke: adding an overlapping day should warn before proceeding'
  );
  context.adjustLegDays(targetLegIdx, -1);
  assert(
    state(context).itinerary[targetLegIdx].days.length === legZeroStartLength,
    'CRUD smoke: adjustLegDays should remove the last day from the leg'
  );

  const packingOriginal = state(context).packing[0].categories[0].items[0].done;
  context.togglePackingItem({ target: { checked: !packingOriginal } }, 0, 0, 0);
  await settle(app);
  assert(
    state(context).packing[0].categories[0].items[0].done === !packingOriginal,
    'CRUD smoke: packing edit should apply before undo'
  );

  const undoResult = await context.undoTripChange();
  await settle(app);
  assert(undoResult === true, 'CRUD smoke: undoTripChange should succeed');
  assert(
    state(context).packing[0].categories[0].items[0].done === packingOriginal,
    'CRUD smoke: undoTripChange should restore the previous packing state'
  );

  const redoResult = await context.redoTripChange();
  await settle(app);
  assert(redoResult === true, 'CRUD smoke: redoTripChange should succeed');
  assert(
    state(context).packing[0].categories[0].items[0].done === !packingOriginal,
    'CRUD smoke: redoTripChange should restore the forward packing state'
  );

  await context.undoTripChange();
  await settle(app);
  assert(
    state(context).packing[0].categories[0].items[0].done === packingOriginal,
    'CRUD smoke: final undo should leave packing where it started'
  );

  const city = context.addOrUpdateCity('Tokyo');
  const journey = context.createJourneyFromTransportItem(
    { text: 'Flight to Tokyo', cost: '300', status: 'confirmed', bookingRef: 'ABC123' },
    state(context).itinerary[0].id,
    state(context).itinerary[0].days[0].date,
    state(context).itinerary[0].days[0].from,
    'Tokyo'
  );
  context.updateJourneyCost(journey.id, '350');
  context.updateJourneyBookingRef(journey.id, 'REF-1');
  context.toggleJourneyStatus(journey.id);
  assert(state(context).journeys.find(j => j.id === journey.id).cost === '350', 'CRUD smoke: journey should update');
  context.deleteJourney(journey.id);
  assert(!state(context).journeys.find(j => j.id === journey.id), 'CRUD smoke: journey should delete');

  context.openAddStayModal();
  app.document.getElementById('stayCitySelect').value = city.id;
  app.document.getElementById('stayPropertyName').value = 'Hotel Example';
  app.document.getElementById('stayCheckIn').value = '2026-06-01';
  app.document.getElementById('stayCheckOut').value = '2026-06-04';
  app.document.getElementById('stayNights').value = '3';
  app.document.getElementById('stayStatus').value = 'booked';
  app.document.getElementById('stayProvider').value = 'Booking.com';
  app.document.getElementById('stayBookingRef').value = 'STAY-1';
  app.document.getElementById('stayTotalCost').value = '600';
  app.document.getElementById('stayNotes').value = 'Near station';
  context.saveStayFromModal();
  const stayId = state(context).stays.find(stay => stay.propertyName === 'Hotel Example').id;
  context.openEditStayModal(stayId);
  app.document.getElementById('stayPropertyName').value = 'Hotel Edited';
  app.document.getElementById('stayTotalCost').value = '650';
  context.saveStayFromModal();
  assert(state(context).stays.find(stay => stay.id === stayId).propertyName === 'Hotel Edited', 'CRUD smoke: stay edit should persist');
  context.toggleStayStatus({ stopPropagation() {} }, stayId);
  assert(state(context).stays.find(stay => stay.id === stayId).status !== 'booked', 'CRUD smoke: stay status should toggle');
  context.deleteStay(stayId);
  assert(!state(context).stays.find(stay => stay.id === stayId), 'CRUD smoke: stay should delete');

  context.addLeaveHomeItem();
  const leaveHomeIdx = state(context).leaveHome.length - 1;
  context.updateLeaveHomeItem(leaveHomeIdx, 'Pack charger');
  context.toggleLeaveHomeItem({ target: { checked: true } }, leaveHomeIdx);
  assert(state(context).leaveHome.some(item => item.text === 'Pack charger' && item.done), 'CRUD smoke: leave-home item should toggle');
  context.deleteLeaveHomeItem(leaveHomeIdx);
  assert(!state(context).leaveHome.some(item => item.text === 'Pack charger'), 'CRUD smoke: leave-home item should delete');

  context.addPackingItem(0, 0);
  const packIdx = state(context).packing[0].categories[0].items.length - 1;
  context.updatePackingItem(0, 0, packIdx, 'Camera');
  context.togglePackingItem({ target: { checked: true } }, 0, 0, packIdx);
  assert(state(context).packing[0].categories[0].items.some(item => item.text === 'Camera' && item.done), 'CRUD smoke: packing item should toggle');
  context.deletePackingItem(0, 0, packIdx);
  assert(!state(context).packing[0].categories[0].items.some(item => item.text === 'Camera'), 'CRUD smoke: packing item should delete');
}

async function testDragDropSmoke() {
  const app = await createBootedApp();
  const { context } = app;
  assertBootClean(app, 'Drag/drop smoke');

  context.addActivity(0);
  app.document.getElementById('activityCategory').value = 'fitness';
  app.document.getElementById('activityTitle').value = 'Morning run';
  app.document.getElementById('activityLocation').value = 'Park';
  app.document.getElementById('activityTime').value = '1 hr';
  app.document.getElementById('activityCost').value = '0';
  app.document.getElementById('saveActivityBtn').click();
  await settle(app);

  const transfer = {
    payload: '',
    setData(_, value) { this.payload = value; },
    getData() { return this.payload; }
  };
  context.handleDragStart({ preventDefault() {}, dataTransfer: transfer }, 0, 'activity', 0);
  context.handleDrop({ preventDefault() {}, currentTarget: { classList: { remove() {} } }, dataTransfer: transfer }, 0, 0);

  assert(state(context).itinerary[0].suggestedActivities[0].assignedDayIdx === 0, 'Drag/drop smoke: dragged activity should be assigned');
  assert(state(context).itinerary[0].days[0].activityItems.some(item => item.text.includes('Morning run')), 'Drag/drop smoke: dropped activity should land on day card');
}

async function testModeToggles() {
  const app = await createBootedApp();
  const { context } = app;
  assertBootClean(app, 'Mode toggles');

  const funBefore = context.isFunMode;
  context.toggleMode();
  assert(context.isFunMode !== funBefore, 'Mode toggles: fun mode should flip');
  assert(app.document.body.classList.contains('fun-mode') === context.isFunMode, 'Mode toggles: body class should match fun mode');

  const editBefore = context.isEditMode;
  context.toggleEditMode();
  assert(context.isEditMode !== editBefore, 'Mode toggles: edit mode should flip');
  assert(app.document.body.classList.contains('read-only-mode') === !context.isEditMode, 'Mode toggles: body class should match read only mode');
  assert(app.document.getElementById('mainTitle').contentEditable === context.isEditMode, 'Mode toggles: title editability should follow edit mode');
}

async function testCompactView() {
  const app = await createBootedApp();
  const { context } = app;
  assertBootClean(app, 'Compact view');
  if (context.isCompactView) {
    context.toggleCompactView();
  }
  assert(
    app.document.getElementById('compactToggleLabel').textContent.includes('Detailed mode'),
    'Compact view: top-bar toggle should start in detailed mode'
  );

  context.toggleCompactView();
  assert(context.isCompactView === true, 'Compact view: should enable compact mode');
  assert(app.document.body.classList.contains('compact-view-mode'), 'Compact view: body class should toggle');
  assert(
    app.document.getElementById('compactToggleLabel').textContent.includes('Compact mode'),
    'Compact view: top-bar toggle should relabel to compact mode'
  );
  assert(
    context.stripCompactLeadingEmoji('🍽️ Try local noodles') === 'Try local noodles',
    'Compact view: leading emoji helper should remove duplicated prefixes'
  );
  context.buildItinerary();
  const itineraryEl = app.document.getElementById('itinerary');
  assert(itineraryEl.children.length > 0, 'Compact view: itinerary should still render checkboxes and cards');
  assert(
    itineraryEl.children[0].innerHTML.includes('Food Quest'),
    'Compact view: must eat items should still render in itinerary'
  );
  assert(
    !itineraryEl.innerHTML.includes('<strong>🚌</strong>'),
    'Compact view: transport section should not add a second emoji'
  );
  assert(
    !itineraryEl.innerHTML.includes('⏳'),
    'Compact view: transport rows should not use hourglass icons'
  );
  assert(
    !itineraryEl.textContent.includes('$'),
    'Compact view: costs should be hidden from the itinerary'
  );
  assert(
    context.renderCompactEmojiLine({
      emoji: '📍',
      text: 'Morning run',
      duration: '2 hrs'
    }).includes('[2 hrs]'),
    'Compact view: durations should render in muted brackets'
  );
  context.toggleCompactView();
  assert(context.isCompactView === false, 'Compact view: second toggle should disable compact mode');
}

async function testExportImport() {
  const app = await createBootedApp();
  const { context } = app;
  assertBootClean(app, 'Export/import');

  app.document.getElementById('mainTitle').innerText = 'Export Test';
  app.document.getElementById('mainSubtitle').innerText = 'Automated';
  context.updateDayData(0, 0, 'desc', 'Changed for export');
  await context.exportJSON();
  const exported = JSON.parse(decodeDownloadUri(app.document.lastDownload.href));
  assert(app.document.lastDownload.download.endsWith('.json'), 'Export: download should be JSON');
  assert(exported.meta.title === 'Export Test', 'Export: should include current title');
  assert(exported.itinerary[0].days[0].desc === 'Changed for export', 'Export: should include updated itinerary data');

  app.setImportedFileContent(JSON.stringify(exported));
  context.importJSON({
    target: {
      files: [{
        name: 'imported.json',
        text: async () => JSON.stringify(exported)
      }],
      value: ''
    }
  });
  await settle(app);
  assert(state(context).itinerary[0].days[0].desc === 'Changed for export', 'Import: should reload itinerary data');
  assert(state(context).meta.title === 'Export Test', 'Import: should reload title');
}

async function testShareExport() {
  const app = await createBootedApp();
  const { context } = app;
  assertBootClean(app, 'Share export');

  context.addDayItem(0, 0, 'activityItems');
  context.updateDayItemText(0, 0, 'activityItems', 0, 'Secret dinner');
  context.updateDayItemCost(0, 0, 'activityItems', 0, '88');
  const journey = context.createJourneyFromTransportItem(
    { text: 'Secret flight', cost: '900', status: 'booked', bookingRef: 'PNR-123' },
    state(context).itinerary[0].id,
    state(context).itinerary[0].days[0].date,
    state(context).itinerary[0].days[0].from,
    'Tokyo'
  );
  context.updateJourneyBookingRef(journey.id, 'PNR-123');
  context.updateJourneyCost(journey.id, '910');

  context.openShareExportDialog();
  app.document.getElementById('shareHideCosts').checked = true;
  app.document.getElementById('shareHideRefs').checked = true;
  app.document.getElementById('shareHideNotes').checked = false;

  await context.exportShareJSON();
  const exported = JSON.parse(decodeDownloadUri(app.document.lastDownload.href));

  assert(app.document.lastDownload.download.endsWith('_share.json'), 'Share export: download should use the share suffix');
  assert(exported.meta.redactions.costs === true, 'Share export: export should record cost redaction');
  assert(exported.meta.redactions.bookingRefs === true, 'Share export: export should record booking ref redaction');
  assert(exported.itinerary[0].days[0].activityItems[0].cost === '', 'Share export: itinerary item cost should be hidden');
  assert(exported.journeys[0].bookingReference === '', 'Share export: booking reference should be hidden');
}

async function testShareEmail() {
  const app = await createBootedApp();
  const { context } = app;
  assertBootClean(app, 'Share email');

  context.openShareExportDialog();
  app.document.getElementById('shareHideCosts').checked = true;
  app.document.getElementById('shareHideRefs').checked = true;
  app.document.getElementById('shareHideNotes').checked = true;

  await context.exportShareEmail();

  const downloadEntry = app.downloads.find(entry => entry.download && entry.download.endsWith('_share.json'));
  const mailtoEntry = [...app.downloads].reverse().find(entry => String(entry.href || '').startsWith('mailto:'));

  assert(downloadEntry, 'Share email: should still download a JSON attachment');
  assert(mailtoEntry, 'Share email: should open a mailto link');
  assert(String(mailtoEntry.href).startsWith('mailto:?'), 'Share email: should open a blank draft');

  const mailtoQuery = String(mailtoEntry.href).split('?')[1] || '';
  const mailtoText = decodeURIComponent(mailtoQuery.replace(/\+/g, '%20'));
  assert(mailtoText.includes('https://trentan.github.io/travel-planner/'), 'Share email: body should include the app link');
  assert(mailtoText.includes('attached JSON file'), 'Share email: body should mention the JSON attachment');
  assert(mailtoText.includes('subject='), 'Share email: should include a subject line');
}

async function testShareEmailDraft() {
  const app = await createBootedApp();
  const { context } = app;
  assertBootClean(app, 'Share email draft');

  context.openShareExportDialog();
  app.document.getElementById('shareHideCosts').checked = true;
  app.document.getElementById('shareHideRefs').checked = true;
  app.document.getElementById('shareHideNotes').checked = false;
  context.refreshShareEmailDraft();

  const draft = app.document.getElementById('shareEmailDraft').value;
  assert(draft.includes('Subject: Travel Planner itinerary:'), 'Share email draft: should include a subject line');
  assert(draft.includes('https://trentan.github.io/travel-planner/'), 'Share email draft: should include the app link');
  assert(draft.includes('attached JSON file'), 'Share email draft: should mention the attachment');

  await context.copyShareEmailDraft();
  assert(app.context.navigator.lastClipboardText === draft, 'Share email draft: copy should write the draft to clipboard');
}

async function testBudgetUpdates() {
  const app = await createBootedApp();
  const { context } = app;
  assertBootClean(app, 'Budget updates');

  context.buildBudgetTab();
  const before = app.document.getElementById('budget-kpi-container').innerHTML;
  context.addDayItem(0, 0, 'activityItems');
  context.updateDayItemCost(0, 0, 'activityItems', 0, '99');
  context.buildBudgetTab();
  const after = app.document.getElementById('budget-kpi-container').innerHTML;
  assert(before !== after, 'Budget updates: budget totals should change');
  assert(after.includes('$'), 'Budget updates: totals should render currency');
}

async function testPackingPersistence() {
  const sharedLocalStorage = createBrowserHarness().localStorage;
  const first = await createBootedApp({ sharedLocalStorage });
  const firstContext = first.context;
  assertBootClean(first, 'Packing persistence first load');

  firstContext.togglePackingItem({ target: { checked: true } }, 0, 0, 0);
  firstContext.toggleLeaveHomeItem({ target: { checked: true } }, 1);
  await firstContext.saveData(false);
  await settle(first);

  const second = await createBootedApp({ sharedLocalStorage });
  assertBootClean(second, 'Packing persistence reload');
  assert(state(second.context).packing[0].categories[0].items[0].done === true, 'Packing persistence: packing checkbox should persist');
  assert(state(second.context).leaveHome[1].done === true, 'Packing persistence: leave-home checkbox should persist');
}

async function testServiceWorkerRegistration() {
  const app = await createBootedApp();
  assertBootClean(app, 'Service worker');
  assert(app.serviceWorkerRegistrations.length === 1, 'Service worker: should register once');
  assert(app.serviceWorkerRegistrations[0].scriptURL === './sw.js', 'Service worker: should register sw.js');
}

async function testFileSaveLoadAndBackup() {
  const sharedLocalStorage = createBrowserHarness().localStorage;
  const first = await createBootedApp({ sharedLocalStorage });
  const firstContext = first.context;
  assertBootClean(first, 'File save/load first');

  first.document.getElementById('mainTitle').innerText = 'Local Save Test';
  await firstContext.saveData(false);
  await settle(first);
  assert(JSON.parse(sharedLocalStorage.getItem('travelApp_meta_template')).title === 'Local Save Test', 'File save/load: should persist to localStorage');

  const reload = await createBootedApp({ sharedLocalStorage });
  assertBootClean(reload, 'File save/load reload');
  assert(state(reload.context).meta.title === 'Local Save Test', 'File save/load: should restore from localStorage');

  reload.context.openTripFile();
  assert(reload.document.getElementById('importFile').selected === true || reload.document.lastClickedElement?.id === 'importFile', 'File save/load: openTripFile should click import input in fallback mode');
  reload.context.openExistingTripFile();
  assert(reload.document.getElementById('importFile').selected === true || reload.document.lastClickedElement?.id === 'importFile', 'File save/load: openExistingTripFile should click import input in fallback mode');

  sharedLocalStorage.setItem('travelApp_editCount', '9');
  reload.context.loadBackupTracking();
  reload.context.trackUserEdit();
  reload.context.checkBackupReminder();
  await settle(reload);
  assert(reload.document.querySelector('#backup-reminder'), 'File save/load: backup reminder should appear after enough edits');
}

async function run() {
  await testDesktopSmoke();
  await testMobileSmoke();
  await testCrudSmoke();
  await testDragDropSmoke();
  await testModeToggles();
  await testCompactView();
  await testExportImport();
  await testShareExport();
  await testShareEmail();
  await testShareEmailDraft();
  await testBudgetUpdates();
  await testPackingPersistence();
  await testServiceWorkerRegistration();
  await testFileSaveLoadAndBackup();
  console.log('Item 15 automated suite passed');
}

if (require.main === module) {
  run().catch(error => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}

module.exports = { run };
