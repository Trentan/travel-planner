const {
  assert,
  bootstrapApp,
  createBrowserHarness,
  loadAppScripts
} = require('./lib/browser-harness');

function getDownloadContent(download) {
  if (download?.content) return download.content;
  const uri = String(download?.href || '');
  const commaIndex = uri.indexOf(',');
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

async function testInitialCurrentDaySelection() {
  const app = createBrowserHarness({ mobile: true });
  const RealDate = Date;
  app.context.Date = class FixedDate extends RealDate {
    constructor(...args) {
      super(...(args.length ? args : ['2026-06-11T12:00:00+10:00']));
    }

    static now() {
      return new RealDate('2026-06-11T12:00:00+10:00').getTime();
    }
  };

  app.localStorage.setItem('travelApp_v2026_template', JSON.stringify([
    {
      id: 'vienna',
      label: 'Vienna',
      colour: '#ef4444',
      days: [{ day: 'Thu', date: '2026-06-11', from: 'Vienna', to: 'Bratislava', activityItems: [] }]
    },
    {
      id: 'bratislava',
      label: 'Bratislava',
      colour: '#3b82f6',
      days: [
        { day: 'Thu', date: '2026-06-11', from: 'Vienna', to: 'Bratislava', activityItems: [] },
        { day: 'Fri', date: '2026-06-12', from: 'Bratislava', to: 'Bratislava', activityItems: [] }
      ]
    }
  ]));
  app.localStorage.setItem('travelApp_cities_v1', JSON.stringify([
    { id: 'city-vienna', name: 'Vienna', colour: '#ef4444' },
    { id: 'city-bratislava', name: 'Bratislava', colour: '#3b82f6' }
  ]));

  loadAppScripts(app);
  bootstrapApp(app);
  await app.context.appInitPromise;
  await settle(app);

  assertBootClean(app, 'Initial current-day selection');
  assert(
    app.context.__mobilePagerState['compact-city-swipe'] === 1,
    'Initial current-day selection: should select the arrival city on a duplicated travel date'
  );
  assert(
    app.context.__mobilePagerState['compact-day-bratislava'] === 0,
    'Initial current-day selection: should select today within the current city'
  );
  assert(
    app.context.currentCityFilter === 'city-bratislava',
    'Initial current-day selection: should set the shared city filter to today'
  );
  assert(
    app.document.querySelector('.city-nav-btn.active')?.dataset.city === 'city-bratislava',
    'Initial current-day selection: default app load should visibly select today city'
  );
  assert(
    (app.document.querySelector('.city-nav-btn.active')?.innerHTML || '').includes('Today · Thu · 11 Jun'),
    'Initial current-day selection: mobile city nav should show today day and date'
  );

  const initialTarget = app.context.initializeItineraryPositionForToday(new RealDate('2026-06-12T12:00:00+10:00'));
  assert(
    initialTarget?.leg?.id === 'bratislava' && initialTarget?.dayIndex === 0,
    'Initial current-day selection: later rebuilds should not replace the startup position'
  );

  const workoutEquipment = state(app.context).packing
    .find(area => String(area.areaName || '').includes('Carry-on Packed Bag'))
    .categories.find(category => category.title === 'Workout Equipment');
  const essentials = state(app.context).packing
    .find(area => String(area.areaName || '').includes('Personal Item Bag'))
    .categories.find(category => category.title === 'Essentials');
  assert(
    workoutEquipment.items.some(item => item.text === 'Mobile strap for running'),
    'Initial current-day selection: Workout Equipment should include the running phone strap'
  );
  assert(
    !essentials.items.some(item => item.text === 'Mobile strap for running'),
    'Initial current-day selection: Personal Item Essentials should not include the running phone strap'
  );

  let transportFilter = '';
  let accomFilter = '';
  const originalBuildTransportTab = app.context.buildTransportTab;
  const originalBuildAccomTab = app.context.buildAccomTab;
  app.context.buildTransportTab = filter => {
    transportFilter = filter;
    return originalBuildTransportTab(filter);
  };
  app.context.buildAccomTab = filter => {
    accomFilter = filter;
    return originalBuildAccomTab(filter);
  };
  const getTabButton = tabId => Array.from(app.document.querySelectorAll('.app-tab-btn'))
    .find(button => button.dataset.tab === tabId);

  app.context.currentCityFilter = 'all';
  app.context.__mobilePagerState['compact-city-swipe'] = 0;
  app.context.switchTab('transport', getTabButton('transport'));
  assert(
    transportFilter === 'city-bratislava' && app.context.currentCityFilter === 'city-bratislava',
    'Current-day tab switching: Transport should reapply today city filter'
  );

  app.context.currentCityFilter = 'all';
  app.context.switchTab('accom', getTabButton('accom'));
  assert(
    accomFilter === 'city-bratislava' && app.context.currentCityFilter === 'city-bratislava',
    'Current-day tab switching: Accommodation should reapply today city filter'
  );

  app.context.currentCityFilter = 'all';
  app.context.__mobilePagerState['compact-city-swipe'] = 0;
  app.context.switchTab('itinerary', getTabButton('itinerary'));
  assert(
    app.context.currentCityFilter === 'city-bratislava' &&
      app.context.__mobilePagerState['compact-city-swipe'] === 1,
    'Current-day tab switching: Itinerary should reapply today city and day position'
  );

  app.context.applyCurrentTripPositionForTab(
    'transport',
    new RealDate('2030-01-01T12:00:00+10:00')
  );
  assert(
    transportFilter === 'all' && app.context.currentCityFilter === 'all',
    'Current-day tab switching: dates outside the trip should use the All fallback'
  );
}

function assertBootClean(harness, label) {
  assert(harness.errors.length === 0, `${label}: unexpected console errors: ${JSON.stringify(harness.errors)}`);
}

function state(context) {
  return context.getCurrentAppData();
}

function installSaveCallTracker(context) {
  const calls = [];
  const originalSaveData = context.saveData;
  context.saveData = function trackedSaveData(...args) {
    calls.push(args);
    return originalSaveData.apply(this, args);
  };

  return {
    calls,
    expectSave(label, action) {
      const before = calls.length;
      const result = action();
      assert(calls.length > before, `${label}: should call saveData()`);
      return result;
    }
  };
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
  assert(app.document.getElementById('mainTitle').contentEditable === false, 'Mobile smoke: header title should not be editable');
  app.context.toggleEditMode();
  assert(app.document.getElementById('mainTitle').contentEditable === false, 'Mobile smoke: header title should stay locked after toggling edit mode');

  app.context.buildItinerary();
  app.context.buildTransportTab();
  app.context.buildAccomTab();
  app.context.buildBudgetTab();
  app.context.buildPackingTab();
  app.document.getElementById('tab-map').classList.add('active');
  app.context.buildJourneyMap();
  await settle(app);

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
  app.document.getElementById('stayLocation').value = '12 Station Road';
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
  app.document.getElementById('stayLocation').value = '14 Station Road';
  app.document.getElementById('stayTotalCost').value = '650';
  context.saveStayFromModal();
  assert(state(context).stays.find(stay => stay.id === stayId).propertyName === 'Hotel Edited', 'CRUD smoke: stay edit should persist');
  assert(state(context).stays.find(stay => stay.id === stayId).location === '14 Station Road', 'CRUD smoke: stay location should persist');
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
  if (!context.isEditMode) context.toggleEditMode();

  const targetLegIdx = state(context).itinerary.findIndex(leg => Array.isArray(leg.days) && leg.days.length > 0);
  assert(targetLegIdx >= 0, 'Drag/drop smoke: should find a leg with day cards');

  context.addActivity(targetLegIdx);
  app.document.getElementById('activityCategory').value = 'fitness';
  app.document.getElementById('activityTitle').value = 'Morning run';
  app.document.getElementById('activityLocation').value = 'Park';
  app.document.getElementById('activityTime').value = '1 hr';
  app.document.getElementById('activityCost').value = '0';
  app.document.getElementById('saveActivityBtn').click();
  await settle(app);
  const activityIdx = state(context).itinerary[targetLegIdx].suggestedActivities.findIndex(activity => String(activity.title || '').includes('Morning run'));
  assert(activityIdx >= 0, 'Drag/drop smoke: saved activity should be findable');

  const transfer = {
    payload: '',
    setData(_, value) { this.payload = value; },
    getData() { return this.payload; }
  };
  context.handleDragStart({ preventDefault() {}, dataTransfer: transfer }, targetLegIdx, 'activity', activityIdx);
  context.handleDrop({ preventDefault() {}, currentTarget: { classList: { remove() {} } }, dataTransfer: transfer }, targetLegIdx, 0);

  assert(Number(state(context).itinerary[targetLegIdx].suggestedActivities[activityIdx].assignedDayIdx) === 0, 'Drag/drop smoke: dragged activity should be assigned');
  const assignedActivity = state(context).itinerary[targetLegIdx].suggestedActivities[activityIdx];
  assert(String(assignedActivity.title || '').includes('Morning run'), 'Drag/drop smoke: assigned activity should preserve title');
}

async function testTouchAssignSmoke() {
  const app = await createBootedApp();
  const { context } = app;
  assertBootClean(app, 'Touch assign smoke');

  const targetLegIdx = state(context).itinerary.findIndex(leg => Array.isArray(leg.days) && leg.days.length > 0);
  assert(targetLegIdx >= 0, 'Touch assign smoke: should find a leg with day cards');

  context.addActivity(targetLegIdx);
  app.document.getElementById('activityCategory').value = 'sight';
  app.document.getElementById('activityTitle').value = 'Sunset pier walk';
  app.document.getElementById('activityLocation').value = 'Harbour';
  app.document.getElementById('activityTime').value = '90 min';
  app.document.getElementById('activityCost').value = '12';
  app.document.getElementById('saveActivityBtn').click();
  await settle(app);
  context.buildItinerary();
  await settle(app);
  const activityIdx = state(context).itinerary[targetLegIdx].suggestedActivities.findIndex(activity => String(activity.title || '').includes('Sunset pier walk'));
  assert(activityIdx >= 0, 'Touch assign smoke: saved activity should be findable');

  context.openActivityAssignModal(targetLegIdx, activityIdx);
  await settle(app);
  assert(app.document.getElementById('activity-assign-modal'), 'Touch assign smoke: tapping Assign should open the picker modal');

  const assigned = context.assignSuggestedActivityToDay(targetLegIdx, activityIdx, targetLegIdx, 0);
  assert(assigned === true, 'Touch assign smoke: helper should assign the activity to a day');
  await settle(app);
  assert(state(context).itinerary[targetLegIdx].suggestedActivities[activityIdx].assignedDayIdx === 0, 'Touch assign smoke: day button should assign the activity');
  assert(state(context).itinerary[targetLegIdx].days[0].activityItems.some(item => String(item.text || '').includes('Sunset pier walk')), 'Touch assign smoke: assigned activity should land in the day list');
  assert(
    state(context).itinerary[targetLegIdx].days[0].activityItems.every(item => !String(item.text || '').startsWith(context.getActivityEmoji('sight'))),
    'Touch assign smoke: assigned activity text should not store a category emoji prefix'
  );
  assert(
    context.getSuggestedActivityDayText({ title: '🎧 Hauptmarkt walk', category: 'sight' }) === '🎧 Hauptmarkt walk',
    'Touch assign smoke: authored emoji should stay in editable activity text'
  );

  context.openActivityAssignModal(targetLegIdx, activityIdx);
  await settle(app);
  app.document.getElementById('activityAssignClearBtn').click();
  await settle(app);
  assert(state(context).itinerary[targetLegIdx].suggestedActivities[activityIdx].assignedDayIdx === null, 'Touch assign smoke: remove button should clear the assignment');
  assert(!state(context).itinerary[targetLegIdx].days[0].activityItems.some(item => String(item.text || '').includes('Sunset pier walk')), 'Touch assign smoke: remove button should remove the day item');
}

async function testItineraryEditPersistence() {
  const app = await createBootedApp();
  const { context } = app;
  assertBootClean(app, 'Itinerary persistence');

  context.addLeg();
  await settle(app);

  const legIdx = state(context).itinerary.findIndex(leg =>
    Array.isArray(leg.days) && leg.days.length > 0
    && Array.isArray(leg.cityFood)
    && Array.isArray(leg.cityRun)
    && Array.isArray(leg.suggestedSights)
    && Array.isArray(leg.legTips)
  );
  const dayIdx = 0;
  assert(legIdx >= 0, 'Itinerary persistence: should find a leg with a day');
  const activityLegIdx = state(context).itinerary.findIndex(leg =>
    Array.isArray(leg.days) && leg.days.length > 0 && Array.isArray(leg.suggestedActivities)
  );
  assert(activityLegIdx >= 0, 'Itinerary persistence: should find a leg with suggested activities');

  if ((state(context).itinerary[legIdx].cityFood || []).length === 0) {
    context.addFood(legIdx);
    app.document.getElementById('foodName').value = 'Persistence snack';
    app.document.getElementById('foodCost').value = '8';
    app.document.getElementById('saveFoodBtn').click();
    await settle(app);
  }

  if ((state(context).itinerary[legIdx].days[dayIdx].activityItems || []).length === 0) {
    context.addDayItem(legIdx, dayIdx, 'activityItems');
    await settle(app);
  }

  const day = state(context).itinerary[legIdx].days[dayIdx];
  context.journeys = [];
  context.window.journeys = context.journeys;
  context.stays = [{
    id: 'stay-persistence',
    cityId: 'city-london',
    propertyName: 'Persistence Hotel',
    checkIn: day.date,
    checkOut: day.date,
    nights: 1,
    status: 'booked',
    totalCost: '200',
    done: false
  }];
  context.window.stays = context.stays;

  const tracker = installSaveCallTracker(context);
  const event = checked => ({ target: { checked }, stopPropagation() {}, preventDefault() {} });

  tracker.expectSave('Leg label edit', () => context.updateData(legIdx, 'label', 'Persistence Leg'));
  tracker.expectSave('Day description edit', () => context.updateDayData(legIdx, dayIdx, 'desc', 'Persistence day description'));

  tracker.expectSave('Food modal add', () => {
    context.addFood(legIdx);
    app.document.getElementById('foodName').value = 'Persistence dessert';
    app.document.getElementById('foodCost').value = '11';
    app.document.getElementById('saveFoodBtn').click();
  });
  const foodIdx = state(context).itinerary[legIdx].cityFood.length - 1;
  tracker.expectSave('Food text edit', () => context.updateFoodText(legIdx, foodIdx, 'Persistence dessert edited'));
  tracker.expectSave('Food checkbox', () => context.toggleFoodCompleted(event(true), legIdx, 0));
  tracker.expectSave('Food delete', () => context.deleteFood(legIdx, foodIdx));

  tracker.expectSave('Run add', () => context.addRun(legIdx));
  let runIdx = state(context).itinerary[legIdx].cityRun.length - 1;
  tracker.expectSave('Run title edit', () => context.updateRunPool(legIdx, runIdx, 'title', 'Persistence run'));
  tracker.expectSave('Run time edit', () => context.updateRunPool(legIdx, runIdx, 'estTime', '45 min'));
  tracker.expectSave('Run delete', () => context.deleteRun(legIdx, runIdx));

  tracker.expectSave('Sight add', () => context.addSight(legIdx));
  let sightIdx = state(context).itinerary[legIdx].suggestedSights.length - 1;
  tracker.expectSave('Sight title edit', () => context.updateSightPool(legIdx, sightIdx, 'title', 'Persistence sight'));
  tracker.expectSave('Sight cost edit', () => context.updateSightPool(legIdx, sightIdx, 'estCost', '9'));
  tracker.expectSave('Sight delete', () => context.deleteSight(legIdx, sightIdx));

  tracker.expectSave('Tip add', () => context.addLegTip(legIdx));
  const tipIdx = state(context).itinerary[legIdx].legTips.length - 1;
  tracker.expectSave('Tip edit', () => context.updateLegTip(legIdx, tipIdx, 'Persistence tip'));
  tracker.expectSave('Tip delete', () => context.deleteLegTip(legIdx, tipIdx));

  state(context).itinerary[legIdx].days[dayIdx].completed = true;
  context.buildItinerary();
  assert(
    app.document.querySelector('.day-checkbox') === null,
    'Itinerary UI: whole-day completion checkbox should not render even when old completed data exists'
  );
  tracker.expectSave('Activity checkbox', () => context.toggleActivityCompleted(event(true), legIdx, dayIdx, 0));
  tracker.expectSave('Activity text edit', () => context.updateDayItemText(legIdx, dayIdx, 'activityItems', 0, 'Persistence museum'));
  tracker.expectSave('Activity cost edit', () => context.updateDayItemCost(legIdx, dayIdx, 'activityItems', 0, '18'));
  tracker.expectSave('Activity duration edit', () => context.updateDayItemTime(legIdx, dayIdx, 'activityItems', 0, '2 hr'));
  tracker.expectSave('Activity start time edit', () => context.updateDayItemScheduleTime(legIdx, dayIdx, 'activityItems', 0, 'startTime', '10:00'));
  tracker.expectSave('Activity schedule mode edit', () => context.setDayItemScheduleMode(legIdx, dayIdx, 'activityItems', 0, 'anytime'));
  tracker.expectSave('Activity add', () => context.addDayItem(legIdx, dayIdx, 'activityItems'));
  const addedIdx = state(context).itinerary[legIdx].days[dayIdx].activityItems.length - 1;
  tracker.expectSave('Activity delete', () => context.deleteDayItem(legIdx, dayIdx, 'activityItems', addedIdx));
  tracker.expectSave('Suggested activity modal add', () => {
    context.addActivity(activityLegIdx);
    app.document.getElementById('activityCategory').value = 'event';
    app.document.getElementById('activityTitle').value = 'Persistence suggested';
    app.document.getElementById('activityLocation').value = 'Gallery';
    app.document.getElementById('activityExternalLink').value = 'https://example.com/invite';
    app.document.getElementById('activityTime').value = '1 hr';
    app.document.getElementById('activityCost').value = '12';
    app.document.getElementById('saveActivityBtn').click();
  });
  let activityIdx = state(context).itinerary[activityLegIdx].suggestedActivities.findIndex(activity => String(activity.title || '').includes('Persistence suggested'));
  assert(activityIdx >= 0, 'Itinerary persistence: suggested activity should be added');
  assert(state(context).itinerary[activityLegIdx].suggestedActivities[activityIdx].category === 'event', 'Itinerary persistence: event activity type should save');
  assert(state(context).itinerary[activityLegIdx].suggestedActivities[activityIdx].externalLink === 'https://example.com/invite', 'Itinerary persistence: activity external link should save');
  tracker.expectSave('Suggested activity modal edit', () => {
    context.openEditActivityModal(activityLegIdx, activityIdx);
    app.document.getElementById('activityTitle').value = 'Persistence suggested edited';
    app.document.getElementById('saveActivityBtn').click();
  });
  activityIdx = state(context).itinerary[activityLegIdx].suggestedActivities.findIndex(activity => String(activity.title || '').includes('Persistence suggested edited'));
  tracker.expectSave('Suggested activity drag/drop assignment', () => {
    if (!context.isEditMode) context.toggleEditMode();
    const transfer = {
      payload: '',
      setData(_, value) { this.payload = value; },
      getData() { return this.payload; }
    };
    context.handleDragStart({ preventDefault() {}, dataTransfer: transfer }, activityLegIdx, 'activity', activityIdx);
    context.handleDrop({ preventDefault() {}, currentTarget: { classList: { remove() {} } }, dataTransfer: transfer }, activityLegIdx, 0);
  });
  const assignedActivityItemIdx = state(context).itinerary[activityLegIdx].days[0].activityItems.findIndex(item =>
    String(item.text || '').includes('Persistence suggested edited')
  );
  assert(assignedActivityItemIdx >= 0, 'Itinerary persistence: dragged suggested activity should be on the day');
  tracker.expectSave('Assigned suggested activity checkbox', () => (
    context.toggleActivityCompleted(event(true), activityLegIdx, 0, assignedActivityItemIdx)
  ));
  tracker.expectSave('Day activity modal edit', () => {
    context.openEditDayActivityModal(activityLegIdx, 0, assignedActivityItemIdx);
    app.document.getElementById('activityTitle').value = 'Persistence suggested edited via day';
    app.document.getElementById('saveActivityBtn').click();
  });
  const updatedDayActivity = state(context).itinerary[activityLegIdx].days[0].activityItems[assignedActivityItemIdx];
  assert(
    String(updatedDayActivity?.text || '').includes('Persistence suggested edited via day'),
    'Itinerary persistence: day activity should be updated via modal edit'
  );
  activityIdx = state(context).itinerary[activityLegIdx].suggestedActivities.findIndex(activity =>
    String(activity.title || '').includes('Persistence suggested edited via day')
  );
  const assignedExport = context.buildExportPayload();
  const exportedPoolActivity = assignedExport.itinerary[activityLegIdx].suggestedActivities.find(activity =>
    String(activity.title || '').includes('Persistence suggested edited')
  );
  const exportedDayActivity = assignedExport.itinerary[activityLegIdx].days[0].activityItems.find(item =>
    String(item.text || '').includes('Persistence suggested edited')
  );
  assert(exportedDayActivity?.done === true, 'Itinerary persistence: exported day activity should include done=true');
  assert(exportedPoolActivity?.done === true, 'Itinerary persistence: exported suggested activity should include done=true');
  assert(exportedPoolActivity?.category === 'event', 'Itinerary persistence: exported suggested activity should keep event category');
  assert(exportedPoolActivity?.externalLink === 'https://example.com/invite', 'Itinerary persistence: exported suggested activity should include external link');
  assert(exportedDayActivity?.externalLink === 'https://example.com/invite', 'Itinerary persistence: exported day activity should include external link');
  tracker.expectSave('Suggested activity assignment clear', () => {
    context.openActivityAssignModal(activityLegIdx, activityIdx);
    app.document.getElementById('activityAssignClearBtn').click();
  });
  tracker.expectSave('Suggested activity delete', () => context.deleteActivity(activityLegIdx, activityIdx));

  tracker.expectSave('Transport day item add', () => context.addDayItem(legIdx, dayIdx, 'transportItems'));
  const transportIdx = state(context).itinerary[legIdx].days[dayIdx].transportItems.length - 1;
  tracker.expectSave('Transport day item text edit', () => context.updateDayItemText(legIdx, dayIdx, 'transportItems', transportIdx, 'Persistence shuttle'));
  tracker.expectSave('Transport day item cost edit', () => context.updateDayItemCost(legIdx, dayIdx, 'transportItems', transportIdx, '22'));
  tracker.expectSave('Transport booking status edit', () => context.toggleBookingStatus(event(false), legIdx, dayIdx, 'transportItems', transportIdx));
  tracker.expectSave('Transport booking ref edit', () => context.updateBookingRef(legIdx, dayIdx, 'transportItems', transportIdx, 'TRANS-1'));
  tracker.expectSave('Transport day item delete', () => context.deleteDayItem(legIdx, dayIdx, 'transportItems', transportIdx));

  tracker.expectSave('Accommodation day item add', () => context.addDayItem(legIdx, dayIdx, 'accomItems'));
  const accomIdx = state(context).itinerary[legIdx].days[dayIdx].accomItems.length - 1;
  tracker.expectSave('Accommodation day item text edit', () => context.updateDayItemText(legIdx, dayIdx, 'accomItems', accomIdx, 'Persistence inn'));
  tracker.expectSave('Accommodation day item cost edit', () => context.updateDayItemCost(legIdx, dayIdx, 'accomItems', accomIdx, '120'));
  tracker.expectSave('Accommodation booking status edit', () => context.toggleBookingStatus(event(false), legIdx, dayIdx, 'accomItems', accomIdx));
  tracker.expectSave('Accommodation booking ref edit', () => context.updateBookingRef(legIdx, dayIdx, 'accomItems', accomIdx, 'ACCOM-1'));
  tracker.expectSave('Accommodation day item delete', () => context.deleteDayItem(legIdx, dayIdx, 'accomItems', accomIdx));

  const journey = tracker.expectSave('Journey create from itinerary transport', () => context.createJourneyFromTransportItem(
    { text: 'Persistence train', cost: '33', status: 'confirmed', bookingRef: 'PERSIST-1' },
    state(context).itinerary[legIdx].id,
    day.date,
    day.from,
    day.to
  ));
  tracker.expectSave('Journey status edit', () => context.updateJourneyStatus(journey.id, 'confirmed'));
  tracker.expectSave('Journey booking ref edit', () => context.updateJourneyBookingRef(journey.id, 'PERSIST-2'));
  tracker.expectSave('Journey cost edit', () => context.updateJourneyCost(journey.id, '44'));
  tracker.expectSave('Journey checkbox', () => context.toggleJourneyCompleted(event(true), journey.id));
  tracker.expectSave('Journey delete', () => context.deleteJourney(journey.id));

  tracker.expectSave('Stay checkbox', () => context.toggleStayCompleted(event(true), 'stay-persistence'));
  tracker.expectSave('Stay status edit', () => context.toggleStayStatus(event(false), 'stay-persistence'));
  tracker.expectSave('Stay field edit', () => context.updateStayField('stay-persistence', 'totalCost', '225'));
  tracker.expectSave('Stay delete', () => context.deleteStay('stay-persistence'));

  tracker.expectSave('Leg add', () => context.addLeg());
  const addedLegIdx = state(context).itinerary.findIndex(leg => String(leg.label || '').includes('New City'));
  assert(addedLegIdx >= 0, 'Itinerary persistence: added leg should be findable');
  const adjustableLegIdx = state(context).itinerary.findIndex(leg => /^\d{4}-\d{2}-\d{2}$/.test(String(leg.days?.[0]?.date || '')));
  assert(adjustableLegIdx >= 0, 'Itinerary persistence: adjustable dated leg should be findable');
  tracker.expectSave('Leg day add', () => context.adjustLegDays(adjustableLegIdx, 1));
  tracker.expectSave('Leg day remove', () => context.adjustLegDays(adjustableLegIdx, -1));
  tracker.expectSave('Leg delete', () => context.deleteLeg(addedLegIdx));

  await settle(app);
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
  console.log('Compact view: Skipping test, compact mode is now viewport-driven.');
}

async function testExportImport() {
  const app = await createBootedApp();
  const { context } = app;
  assertBootClean(app, 'Export/import');

  app.document.getElementById('mainTitle').innerText = 'Export Test';
  app.document.getElementById('mainSubtitle').innerText = 'Automated';
  context.updateDayData(0, 0, 'desc', 'Changed for export');
  context.addDayItem(0, 0, 'activityItems');
  const activityIdx = state(context).itinerary[0].days[0].activityItems.length - 1;
  context.updateDayItemText(0, 0, 'activityItems', activityIdx, 'Export checked activity');
  context.toggleActivityCompleted({ target: { checked: true }, stopPropagation() {} }, 0, 0, activityIdx);
  context.journeys.push({
    id: 'journey_export_sub_locations',
    journeyId: 'journey_export_sub_locations',
    journeyName: 'Export sub-location journey',
    legId: state(context).itinerary[0].id,
    dayDate: '2026-01-04',
    fromLocation: 'London',
    toLocation: 'Paris',
    fromCityId: 'london',
    toCityId: 'paris',
    departureDate: '2026-01-04',
    departureTime: '09:15',
    arrivalDate: '2026-01-04',
    arrivalTime: '12:30',
    transportType: 'train',
    provider: 'Eurostar',
    routeCode: 'ES 9004',
    bookingReference: 'SUBLOC-99',
    status: 'booked',
    cost: '120',
    segmentOrder: 1,
    fromAddress: 'St Pancras Platform 9',
    toAddress: 'Gare du Nord Hall 2'
  });
  context.stays.push({
    id: 'stay_export_location',
    cityId: state(context).cities[0].id,
    propertyName: 'Export Location Hotel',
    location: '88 Riverside Lane',
    checkIn: '2026-01-04',
    checkOut: '2026-01-06',
    nights: 2,
    status: 'booked',
    provider: 'Direct',
    bookingRef: 'STAYLOC-99',
    totalCost: '300',
    notes: ''
  });
  await context.exportJSON();
  const exported = JSON.parse(getDownloadContent(app.document.lastDownload));
  assert(app.document.lastDownload.download.endsWith('.json'), 'Export: download should be JSON');
  assert(app.document.lastDownload.href.startsWith('blob:'), 'Export: download should use a blob URL');
  assert(app.document.lastDownload.href.length < 100, 'Export: download URL should not contain the trip payload');
  assert(exported.meta.title === 'Export Test', 'Export: should include current title');
  assert(exported.itinerary[0].days[0].desc === 'Changed for export', 'Export: should include updated itinerary data');
  const exportedJourney = exported.journeys.find(journey => journey.bookingReference === 'SUBLOC-99');
  assert(exportedJourney?.fromAddress === 'St Pancras Platform 9', 'Export: journey should include fromAddress');
  assert(exportedJourney?.toAddress === 'Gare du Nord Hall 2', 'Export: journey should include toAddress');
  const exportedStay = exported.stays.find(stay => stay.bookingRef === 'STAYLOC-99');
  assert(exportedStay?.location === '88 Riverside Lane', 'Export: stay should include location');
  assert(
    exported.itinerary[0].days[0].activityItems.some(item => item.text === 'Export checked activity' && item.done === true),
    'Export: checked activity should include done=true in JSON'
  );

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
  const importedJourney = state(context).journeys.find(journey => journey.bookingReference === 'SUBLOC-99');
  assert(importedJourney?.fromAddress === 'St Pancras Platform 9', 'Import: journey should preserve fromAddress');
  assert(importedJourney?.toAddress === 'Gare du Nord Hall 2', 'Import: journey should preserve toAddress');
  const importedStay = state(context).stays.find(stay => stay.bookingRef === 'STAYLOC-99');
  assert(importedStay?.location === '88 Riverside Lane', 'Import: stay should preserve location');
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
  const exported = JSON.parse(getDownloadContent(app.document.lastDownload));

  assert(app.document.lastDownload.download.endsWith('_share.json'), 'Share export: download should use the share suffix');
  assert(app.document.lastDownload.href.startsWith('blob:'), 'Share export: download should use a blob URL');
  assert(exported.meta.redactions.costs === true, 'Share export: export should record cost redaction');
  assert(exported.meta.redactions.bookingRefs === true, 'Share export: export should record booking ref redaction');
  assert(exported.itinerary[0].days[0].activityItems[0].cost === '', 'Share export: itinerary item cost should be hidden');
  assert(exported.journeys[0].bookingReference === '', 'Share export: booking reference should be hidden');
}

async function testLargeFileDownload() {
  const app = await createBootedApp();
  assertBootClean(app, 'Large file download');

  const largeContent = 'large-export-content\n'.repeat(15000);
  app.context.downloadTextFile(largeContent, 'large-export.txt');

  assert(app.document.lastDownload.download === 'large-export.txt', 'Large export: should preserve the filename');
  assert(app.document.lastDownload.href.startsWith('blob:'), 'Large export: should use a blob URL');
  assert(app.document.lastDownload.href.length < 100, 'Large export: URL should remain short');
  assert(getDownloadContent(app.document.lastDownload) === largeContent, 'Large export: blob should contain the complete file');

  const objectUrl = app.document.lastDownload.href;
  await settle(app);
  assert(app.revokedObjectUrls.includes(objectUrl), 'Large export: object URL should be revoked after download');
}

async function testTimelineDayMapsRoute() {
  const app = await createBootedApp();
  const { context } = app;
  assertBootClean(app, 'Timeline day maps route');

  const trip = state(context);
  const firstLeg = trip.itinerary[0];
  firstLeg.label = 'Paris';
  const firstDay = firstLeg.days[0];
  firstLeg.days[1] = {
    ...(firstLeg.days[1] || firstDay),
    day: 'Tuesday',
    date: '2031-01-05',
    from: 'Paris',
    to: 'Paris',
    desc: 'Paris in-town day',
    activityItems: [
      { text: 'Walking loop — Latin Quarter → Notre Dame', startTime: '08:00' },
      { text: 'Morning coffee — Cafe de Flore', startTime: '09:00' },
      { text: 'Museum visit', location: 'Musee d Orsay', startTime: '11:00' }
    ]
  };
  firstDay.date = '2031-01-04';
  firstDay.from = 'London';
  firstDay.to = 'Paris';
  if (!trip.cities.some(city => city.id === 'city-paris')) {
    trip.cities.push({ id: 'city-paris', name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 });
  }
  trip.cities
    .filter(city => city.id === 'city-paris' || city.name === 'Paris')
    .forEach(city => {
      city.country = 'France';
      city.countryCode = 'FR';
    });
  firstDay.activityItems = [
    { text: 'Museum visit', location: 'Louvre Museum', startTime: '14:00' },
    { text: 'Dinner — Rue Cler', startTime: '19:00' }
  ];
  trip.journeys.push({
    id: 'journey_timeline_maps',
    journeyId: 'journey_timeline_maps',
    legId: firstLeg.id,
    dayDate: '2031-01-04',
    fromLocation: 'London',
    toLocation: 'Paris',
    departureDate: '2031-01-04',
    departureTime: '09:15',
    arrivalDate: '2031-01-04',
    arrivalTime: '12:30',
    transportType: 'train',
    fromAddress: 'St Pancras International',
    toAddress: 'Gare du Nord'
  });
  trip.stays.push({
    id: 'stay_timeline_maps',
    cityId: 'city-paris',
    propertyName: 'Paris Hotel',
    location: '',
    checkIn: '2031-01-04',
    checkOut: '2031-01-06'
  });

  context.importJSON({
    target: {
      files: [{
        name: 'timeline-day-maps.json',
        text: async () => JSON.stringify(trip)
      }],
      value: ''
    }
  });
  await settle(app);

  const route = context.getDailyTimelineMapRoute(0, 0);
  assert(route.url.includes('https://www.google.com/maps/dir/'), 'Timeline day maps route: should build directions URL');
  assert(!route.url.includes('St%20Pancras%20International'), 'Timeline day maps route: should exclude pre-arrival transport departure station');
  assert(route.url.includes('Gare%20du%20Nord'), 'Timeline day maps route: should include transport arrival station');
  assert(route.url.includes('Louvre%20Museum%20(Paris)'), 'Timeline day maps route: should include activity location from the timeline');
  assert(route.url.includes('Rue%20Cler'), 'Timeline day maps route: should infer activity location from title suffix');
  assert(route.url.includes('Paris%20Hotel'), 'Timeline day maps route: should fall back to accommodation name when no location is entered');
  assert(route.stops[0].includes('Gare du Nord'), 'Timeline day maps route: arrival day should start from the arrival transport point');

  const inTownRoute = context.getDailyTimelineMapRoute(0, 1);
  assert(inTownRoute.stops[0] === 'Paris Hotel', 'Timeline day maps route: in-town day should start from accommodation');
  assert(inTownRoute.stops[inTownRoute.stops.length - 1] === 'Paris Hotel', 'Timeline day maps route: in-town day should end at accommodation');
  assert(inTownRoute.url.includes('Latin%20Quarter'), 'Timeline day maps route: in-town day should keep activity title fallbacks with arrows');
  assert(inTownRoute.url.includes('Cafe%20de%20Flore'), 'Timeline day maps route: in-town day should include inferred activity title location');

  const importedTrip = state(context);
  const timelineHtml = context.renderDailyTimeline(importedTrip.itinerary[0], 0, importedTrip.itinerary[0].days[0], 0);
  assert(timelineHtml.includes('View day in Maps'), 'Timeline day maps route: timeline should render the map action');
  context.openDailyTimelineInMaps(0, 0);
  assert(app.openedUrls[0]?.url.includes('google.com/maps/dir'), 'Timeline day maps route: action should open Google Maps');
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

  const importedPayload = state(reload.context);
  reload.context.importJSON({
    target: {
      files: [{
        name: 'readonly-import.json',
        text: async () => JSON.stringify(importedPayload)
      }],
      value: ''
    }
  });
  await settle(reload);
  assert(reload.context.isJsonWriteWarningActive() === true, 'File save/load: plain JSON import should mark file as not writable');
  assert(
    reload.document.getElementById('jsonWriteWarning').innerHTML.includes('JSON file not connected'),
    'File save/load: read-only JSON warning should be visible'
  );
  reload.context.updateDayData(0, 0, 'desc', 'Readonly import local edit');
  await reload.context.saveData(true);
  assert(
    reload.document.getElementById('saveStatus').textContent.includes('JSON file not updated'),
    'File save/load: disconnected save status should warn JSON was not updated'
  );
  await reload.context.exportJSON();
  await settle(reload);
  assert(reload.context.isJsonWriteWarningActive() === false, 'File save/load: exporting JSON should clear read-only warning');

  const fileBacked = await createBootedApp({ supportFileSystemAccess: true });
  fileBacked.setImportedFileContent(JSON.stringify(state(fileBacked.context)));
  await fileBacked.context.openExistingTripFile();
  await settle(fileBacked);
  assert(fileBacked.context.hasActiveFileHandle() === true, 'File save/load: Open File should connect a writable file handle when supported');
  assert(fileBacked.context.isJsonWriteWarningActive() === false, 'File save/load: writable file import should not show read-only warning');
  assert(await fileBacked.context.saveData(false) === true, 'File save/load: writable file handle should save to JSON file');

  const backupApp = await createBootedApp({ sharedLocalStorage });
  sharedLocalStorage.setItem('travelApp_editCount', '9');
  backupApp.context.loadBackupTracking();
  backupApp.context.trackUserEdit();
  backupApp.context.checkBackupReminder();
  await settle(backupApp);
  assert(backupApp.document.querySelector('#backup-reminder'), 'File save/load: backup reminder should appear after enough edits');
}

async function run() {
  await testInitialCurrentDaySelection();
  await testDesktopSmoke();
  await testMobileSmoke();
  await testCrudSmoke();
  await testDragDropSmoke();
  await testTouchAssignSmoke();
  await testItineraryEditPersistence();
  await testModeToggles();
  await testCompactView();
  await testExportImport();
  await testTimelineDayMapsRoute();
  await testShareExport();
  await testLargeFileDownload();
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
