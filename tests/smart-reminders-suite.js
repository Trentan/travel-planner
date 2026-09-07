const path = require('path');
const { assert, createVmContext, loadSource, runScriptInContext } = require('./lib/test-helpers');

function run() {
  const uiJs = loadSource(path.join('js', 'ui.js'));
  const itineraryJs = loadSource(path.join('js', 'itinerary.js'));
  const utilsJs = loadSource(path.join('js', 'utils.js'));

  const storageMap = new Map();
  const localStorageMock = {
    getItem: key => storageMap.get(key) || null,
    setItem: (key, val) => storageMap.set(key, String(val)),
    removeItem: key => storageMap.delete(key)
  };

  const dummyElement = {
    addEventListener: () => {},
    setAttribute: () => {},
    getAttribute: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    style: {},
    dataset: {},
    classList: { toggle: () => {}, contains: () => false, add: () => {}, remove: () => {} },
    innerText: '',
    textContent: '',
    value: '',
    tagName: 'DIV'
  };

  const dummyDoc = {
    querySelectorAll: () => [],
    querySelector: () => null,
    getElementById: () => dummyElement,
    addEventListener: () => {},
    documentElement: dummyElement,
    body: dummyElement
  };

  const context = createVmContext({
    window: {
      addEventListener: () => {},
      matchMedia: () => ({ matches: false, addEventListener: () => {} }),
      scrollY: 0
    },
    document: dummyDoc,
    localStorage: localStorageMock,
    sessionStorage: localStorageMock,
    appData: [],
    journeys: [],
    stays: [],
    citiesData: [],
    startTutorial: () => {},
    updateLegTip: () => {},
    deleteLegTip: () => {},
    addLeg: () => {},
    saveData: () => {},
    trackUserEdit: () => {},
    buildTransportTab: () => {},
    buildAccomTab: () => {},
    buildBudgetTab: () => {},
    buildPackingTab: () => {},
    buildJourneyMap: () => {},
    buildGuideSteps: () => {},
    rebuildCurrentView: () => { rebuiltView = true; },
    formatCurrency: val => '$' + val,
    escapeHtmlText: str => str || '',
    cleanCityNavLabel: str => str || '',
    getCityByName: () => null,
    getDayJourneys: () => [],
    getDayTotal: () => '',
    renderStatusBadge: () => '',
    getTransportIcon: () => '✈️',
    isEditMode: true
  });
  context.window.window = context.window;
  context.window.document = dummyDoc;

  runScriptInContext(utilsJs, context, 'js/utils.js');
  runScriptInContext(uiJs, context, 'js/ui.js');
  runScriptInContext(itineraryJs, context, 'js/itinerary.js');

  context.applyUiSettings();

  // 1. Initial UI Settings
  assert(context.window.showTimelineReminders === true, 'Default showTimelineReminders should be true');
  assert(context.isReminderDismissed('test-key') === false, 'New reminder key should not be dismissed');

  // 2. Toggle Smart Reminders
  let rebuiltView = false;
  context.rebuildCurrentView = () => { rebuiltView = true; };
  context.toggleTimelineReminders(false);
  assert(context.window.showTimelineReminders === false, 'toggleTimelineReminders(false) should update setting to false');
  assert(rebuiltView === true, 'toggleTimelineReminders should trigger rebuildCurrentView');

  context.toggleTimelineReminders(true);
  assert(context.window.showTimelineReminders === true, 'toggleTimelineReminders(true) should update setting to true');

  // 3. Test Smart Reminders Generation on Day 1 (Trip Commencement)
  const sampleLegs = [
    {
      id: 'leg1',
      label: 'Vienna',
      days: [
        { day: 'Thu', date: '2026-06-11', from: 'Home', to: 'Vienna', activityItems: [] },
        { day: 'Fri', date: '2026-06-12', from: 'Vienna', to: 'Vienna', activityItems: [] }
      ]
    }
  ];
  context.appData = sampleLegs;

  const day1Items = context.buildDailyTimelineItems(sampleLegs[0], 0, sampleLegs[0].days[0], 0, new Map());
  const tripStartReminder = day1Items.find(i => i.type === 'smartReminder' && i.reminderType === 'tripStart');
  assert(tripStartReminder !== undefined, 'Day 1 should include tripStart smart reminder');
  assert(tripStartReminder.title.includes('Trip starts today! Double-check packing checklist'), 'tripStart reminder title should match prompt requirement');
  assert(tripStartReminder.actionTab === 'packing', 'tripStart reminder actionTab should be packing');

  // 4. Test Flight Departure Smart Reminder
  const flightJourneys = [
    { id: 'j1', transportType: 'flight', departureDate: '2026-06-11', departureTime: '09:00', fromLocation: 'Brisbane', toLocation: 'Vienna' }
  ];
  const journeysByJourneyIdMap = new Map();
  journeysByJourneyIdMap.set('j1', flightJourneys);
  context.getDayJourneys = (date) => date === '2026-06-11' ? flightJourneys : [];

  const flightDayItems = context.buildDailyTimelineItems(sampleLegs[0], 0, sampleLegs[0].days[0], 0, journeysByJourneyIdMap);
  const flightReminder = flightDayItems.find(i => i.type === 'smartReminder' && i.reminderType === 'flight');
  assert(flightReminder !== undefined, 'Flight departure day should include flight smart reminder');
  assert(flightReminder.title.includes('Flight departure: Ensure passports/visas are packed and arrive 3h prior'), 'flight reminder title should match prompt requirement');
  assert(flightReminder.actionTab === 'packing', 'flight reminder actionTab should link to packing');

  // 5. Test Hotel Checkout Smart Reminder
  context.getStayDisplayForDay = (date) => date === '2026-06-12' ? [
    { type: 'checkout', propertyName: 'Vienna Grand Hotel', startTime: '10:00' }
  ] : [];

  const checkoutDayItems = context.buildDailyTimelineItems(sampleLegs[0], 0, sampleLegs[0].days[1], 1, new Map());
  const checkoutReminder = checkoutDayItems.find(i => i.type === 'smartReminder' && i.reminderType === 'checkout');
  assert(checkoutReminder !== undefined, 'Hotel checkout day should include checkout smart reminder');
  assert(checkoutReminder.title.includes('Hotel Check-out: Verify checkout deadline and luggage storage options'), 'checkout reminder title should match prompt requirement');
  assert(checkoutReminder.actionTab === 'accom', 'checkout reminder actionTab should link to accom');

  // 6. Test Destination Arrival Smart Reminder
  const arrivalReminder = flightDayItems.find(i => i.type === 'smartReminder' && i.reminderType === 'arrival');
  assert(arrivalReminder !== undefined, 'Destination arrival day should include arrival smart reminder');
  assert(arrivalReminder.title.includes('Arriving in destination: Access offline maps and local transit passes'), 'arrival reminder title should match prompt requirement');
  assert(arrivalReminder.actionTab === 'map', 'arrival reminder actionTab should link to map');

  // 7. Test Reminder Dismissal
  const reminderKeyToDismiss = `reminder-tripStart-2026-06-11`;
  context.dismissTimelineReminder(reminderKeyToDismiss);
  assert(context.isReminderDismissed(reminderKeyToDismiss) === true, 'Dismissed reminder key should be registered');

  const day1ItemsAfterDismiss = context.buildDailyTimelineItems(sampleLegs[0], 0, sampleLegs[0].days[0], 0, new Map());
  const tripStartAfterDismiss = day1ItemsAfterDismiss.find(i => i.type === 'smartReminder' && i.reminderType === 'tripStart');
  assert(tripStartAfterDismiss === undefined, 'Dismissed smart reminder should no longer appear in timeline items');

  // 8. Test Timeline Row HTML Rendering
  const reminderHtml = context.renderDailyTimelineRow(tripStartReminder, false);
  assert(reminderHtml.includes('daily-timeline-smart-reminder'), 'Rendered HTML should contain daily-timeline-smart-reminder class');
  assert(reminderHtml.includes("switchTab('packing')"), 'Rendered HTML should contain direct action link switchTab');
  assert(reminderHtml.includes('dismissTimelineReminder'), 'Rendered HTML should contain dismissTimelineReminder button');

  console.log('Smart reminders test suite passed!');
}

if (require.main === module) {
  try {
    run();
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }
}

module.exports = { run };
