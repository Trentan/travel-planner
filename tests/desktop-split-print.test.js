const fs = require('fs');
const path = require('path');
const { assert } = require('./lib/test-helpers');

function runDesktopSplitPrintUnitTests() {
  console.log('Running Desktop Split-Pane & Print Productivity unit test suite...');

  // 1. Verify CSS build has @media print and split rules
  const cssPath = path.join(__dirname, '..', 'dist', 'tailwind.css');
  assert(fs.existsSync(cssPath), 'dist/tailwind.css must exist');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  assert(cssContent.includes('@media print'), 'dist/tailwind.css must contain @media print block');
  assert(cssContent.includes('.print-trip-header'), 'dist/tailwind.css must style .print-trip-header');
  assert(cssContent.includes('page-break-inside:avoid') || cssContent.includes('break-inside:avoid'), 'dist/tailwind.css must avoid mid-card page breaks');
  assert(cssContent.includes('page-break-before:always') || cssContent.includes('break-before:page'), 'dist/tailwind.css must enforce page breaks between major legs');
  assert(cssContent.includes('.desktop-split-shell'), 'dist/tailwind.css must include .desktop-split-shell styles');
  assert(cssContent.includes('.desktop-split-right'), 'dist/tailwind.css must include .desktop-split-right styles');
  assert(cssContent.includes('.split-active-item'), 'dist/tailwind.css must include .split-active-item highlight style');
  assert(cssContent.includes('.is-full-itinerary'), 'dist/tailwind.css must include .is-full-itinerary toggle style');

  console.log('✔ dist/tailwind.css print and split-pane CSS rules verified');

  // 2. DOM & Functionality tests in simulated environment
  const origDocument = global.document;
  const origWindow = global.window;
  const origLocalStorage = global.localStorage;
  const origAppData = global.appData;
  const origStaysData = global.staysData;
  const origCitiesData = global.citiesData;

  const mockLocalStorage = {};
  try {
    global.localStorage = {
      getItem: key => mockLocalStorage[key] || null,
      setItem: (key, val) => { mockLocalStorage[key] = String(val); },
      removeItem: key => { delete mockLocalStorage[key]; }
    };

    // Mock DOM elements
    const elements = new Map();
  function createMockElement(id, tagName = 'div', classes = '') {
    const el = {
      id,
      tagName: tagName.toUpperCase(),
      classList: {
        classes: new Set(classes.split(' ').filter(Boolean)),
        add(c) { this.classes.add(c); },
        remove(c) { this.classes.delete(c); },
        contains(c) { return this.classes.has(c); },
        toggle(c) { if (this.contains(c)) this.remove(c); else this.add(c); }
      },
      attributes: {},
      setAttribute(k, v) { this.attributes[k] = String(v); },
      getAttribute(k) { return this.attributes[k] || null; },
      textContent: '',
      innerHTML: '',
      hidden: false,
      dataset: {},
      querySelector() { return null; },
      querySelectorAll() { return []; },
      addEventListener() {}
    };
    elements.set(id, el);
    return el;
  }

  createMockElement('desktopSplitShell', 'div', 'desktop-split-shell');
  createMockElement('desktopSplitToggleBtn', 'button', 'action-btn desktop-split-btn is-active');
  createMockElement('desktopFullWidthToggleBtn', 'button', 'action-btn desktop-full-btn');
  createMockElement('splitDrawerContent', 'div', 'desktop-split-drawer-content');
  createMockElement('splitDrawerPlaceholder', 'div', 'desktop-split-drawer-placeholder');
  createMockElement('printTripTitle', 'h1');
  createMockElement('printTripSubtitle', 'p');
  createMockElement('printTripIcon', 'span');
  createMockElement('printTripDates', 'span');
  createMockElement('printTripDuration', 'span');
  createMockElement('printTripDestinations', 'span');
  createMockElement('printTripStaysCount', 'span');
  createMockElement('printAccomTableBody', 'tbody');
  createMockElement('currentTripTitle', 'span');
  elements.get('currentTripTitle').textContent = 'European Adventure 2026';
  createMockElement('currentTripIcon', 'span');
  elements.get('currentTripIcon').textContent = '🗼';

  global.document = {
    body: createMockElement('body', 'body'),
    getElementById: id => elements.get(id) || null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {}
  };
  global.citiesData = [];
  global.window = {
    innerWidth: 1200,
    addEventListener: () => {},
    print: () => { global.window.__printed = true; },
    setTimeout: (fn) => fn()
  };

  // Load js/ui.js into global scope
  const uiJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'ui.js'), 'utf8');
  (0, eval)(uiJs);

  // Test toggleDesktopSplitMode
  assert(typeof global.window.getDesktopSplitMode === 'function', 'getDesktopSplitMode should be defined');
  assert(typeof global.window.toggleDesktopSplitMode === 'function', 'toggleDesktopSplitMode should be defined');

  global.window.toggleDesktopSplitMode('full-itinerary');
  assert(elements.get('desktopSplitShell').classList.contains('is-full-itinerary'), 'Shell should have is-full-itinerary class');
  assert(elements.get('desktopFullWidthToggleBtn').classList.contains('is-active'), 'Full btn should be active');
  assert(!elements.get('desktopSplitToggleBtn').classList.contains('is-active'), 'Split btn should not be active');
  assert(global.window.getDesktopSplitMode() === 'full-itinerary', 'Stored mode should be full-itinerary');

  global.window.toggleDesktopSplitMode('split');
  assert(!elements.get('desktopSplitShell').classList.contains('is-full-itinerary'), 'Shell should remove is-full-itinerary class');
  assert(elements.get('desktopSplitToggleBtn').classList.contains('is-active'), 'Split btn should be active');
  assert(global.window.getDesktopSplitMode() === 'split', 'Stored mode should be split');

  console.log('✔ Desktop split-pane toggle state verified');

  // Test renderSplitDrawerContent
  assert(typeof global.window.renderSplitDrawerContent === 'function', 'renderSplitDrawerContent should be defined');
  global.window.renderSplitDrawerContent({
    type: 'activity',
    title: 'Eiffel Tower Summit Tour',
    location: 'Champ de Mars, 5 Av. Anatole France, 75007 Paris',
    time: '2 hrs',
    cost: '45.00',
    notes: 'Arrive 15 mins early at security gate 2'
  });

  const drawerContent = elements.get('splitDrawerContent');
  assert(!drawerContent.hidden, 'Drawer content should not be hidden');
  assert(drawerContent.innerHTML.includes('Eiffel Tower Summit Tour'), 'Drawer should render item title');
  assert(drawerContent.innerHTML.includes('Champ de Mars'), 'Drawer should render location');
  assert(drawerContent.innerHTML.includes('Google Maps'), 'Drawer should provide Google Maps link');

  global.window.clearSplitDrawer();
  assert(drawerContent.hidden, 'Drawer content should be hidden after clear');
  assert(!elements.get('splitDrawerPlaceholder').hidden, 'Placeholder should be visible after clear');

  console.log('✔ Split detail drawer content rendering and clear verified');

  // Test renderSplitDrawerForDay (Milestone 6 Day-in-view split drawer)
  assert(typeof global.window.renderSplitDrawerForDay === 'function', 'renderSplitDrawerForDay should be defined');
  assert(typeof global.window.restoreSplitDayOverview === 'function', 'restoreSplitDayOverview should be defined');

  const testDayData = {
    legIndex: 0,
    dayIndex: 0,
    dayNumber: 1,
    dayName: 'Mon',
    date: '2026-06-01',
    from: 'London',
    to: 'Paris',
    journeys: [
      { journeyName: 'Eurostar 9014', departureTime: '08:30', toLocation: 'Paris Nord' }
    ],
    stays: [
      { name: 'Hotel Le Marais', location: 'Paris', bookingRef: 'BK-7890' }
    ],
    activities: [
      { title: 'Louvre Museum Tour', location: 'Louvre, Paris', time: '3 hrs', cost: '25.00' }
    ]
  };

  global.window.renderSplitDrawerForDay(testDayData);
  assert(!drawerContent.hidden, 'Drawer content should be visible for day overview');
  assert(drawerContent.innerHTML.includes('split-drawer-day-card'), 'Drawer should render day card');
  assert(drawerContent.innerHTML.includes('Day 1'), 'Drawer should render Day 1 indicator');
  assert(drawerContent.innerHTML.includes('London → Paris'), 'Drawer should render travel route');
  assert(drawerContent.innerHTML.includes('Eurostar 9014'), 'Drawer should list journeys');
  assert(drawerContent.innerHTML.includes('Hotel Le Marais'), 'Drawer should list stays');
  assert(drawerContent.innerHTML.includes('Louvre Museum Tour'), 'Drawer should list activities');

  // Verify item inspection and day overview restoration
  global.window.__activeSplitDayData = testDayData;
  global.window.renderSplitDrawerContent({
    type: 'stay',
    title: 'Hotel Le Marais',
    location: 'Paris'
  });
  assert(drawerContent.innerHTML.includes('← Day Overview'), 'Item drawer should include ← Day Overview button');

  global.window.restoreSplitDayOverview();
  assert(drawerContent.innerHTML.includes('split-drawer-day-card'), 'Drawer should return to day card on restore');
  console.log('✔ Desktop split day-in-view drawer card and restore overview verified');

  // Load js/map.js and test activity coordinate generation & split day map rendering
  const mapJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'map.js'), 'utf8');
  (0, eval)(mapJs);

  assert(typeof global.window.getDeterministicActivityCoords === 'function', 'getDeterministicActivityCoords should be defined');
  const baseCoords = { lat: 48.8566, lng: 2.3522 }; // Paris
  const actCoords1 = global.window.getDeterministicActivityCoords(baseCoords, { title: 'Louvre Museum' }, 0, 3);
  const actCoords2 = global.window.getDeterministicActivityCoords(baseCoords, { title: 'Eiffel Tower' }, 1, 3);
  assert(actCoords1 && typeof actCoords1.lat === 'number', 'actCoords1 must produce numeric lat');
  assert(actCoords2 && typeof actCoords2.lat === 'number', 'actCoords2 must produce numeric lat');
  assert(actCoords1.lat !== actCoords2.lat || actCoords1.lng !== actCoords2.lng, 'Activities must have distinct coordinates');

  console.log('✔ Activity coordinate distribution verified');

  // Test populatePrintTripHeader & printItinerary
  global.appData = [
    {
      label: 'Paris',
      colour: '#3b82f6',
      days: [
        { date: '2026-06-01', day: 'Mon', from: 'London', to: 'Paris' },
        { date: '2026-06-02', day: 'Tue', from: 'Paris', to: 'Paris' }
      ]
    },
    {
      label: 'Rome',
      colour: '#ef4444',
      days: [
        { date: '2026-06-03', day: 'Wed', from: 'Paris', to: 'Rome' }
      ]
    }
  ];
  global.staysData = [
    {
      id: 'stay-1',
      name: 'Hotel Le Marais',
      city: 'Paris',
      checkIn: '2026-06-01',
      checkOut: '2026-06-03',
      bookingRef: 'BK-7890',
      location: '12 Rue des Francs-Bourgeois'
    }
  ];

  assert(typeof global.window.populatePrintTripHeader === 'function', 'populatePrintTripHeader should be defined');
  global.window.populatePrintTripHeader();

  assert(elements.get('printTripTitle').textContent === 'European Adventure 2026', 'Print title should match trip title');
  assert(elements.get('printTripIcon').textContent === '🗼', 'Print icon should match trip icon');
  assert(elements.get('printTripDates').textContent.includes('2026-06-01'), 'Print dates should compute min date');
  assert(elements.get('printTripDates').textContent.includes('2026-06-03'), 'Print dates should compute max date');
  assert(elements.get('printTripDuration').textContent.includes('3 Days'), 'Print duration should compute 3 Days');
  assert(elements.get('printTripDuration').textContent.includes('2 Nights'), 'Print duration should compute 2 Nights');
  assert(elements.get('printAccomTableBody').innerHTML.includes('Hotel Le Marais'), 'Print accommodation table should include hotel');
  assert(elements.get('printAccomTableBody').innerHTML.includes('BK-7890'), 'Print accommodation table should include booking ref');

  assert(typeof global.window.printItinerary === 'function', 'printItinerary should be defined');
  global.window.__printed = false;
  global.window.printItinerary();
  assert(global.window.__printed === true, 'printItinerary should invoke window.print()');

    console.log('✔ Print itinerary header compilation and window.print() trigger verified');
    console.log('✅ ALL DESKTOP SPLIT-PANE & PRINT PRODUCTIVITY TESTS PASSED CLEANLY!\n');
  } finally {
    global.document = origDocument;
    global.window = origWindow;
    global.localStorage = origLocalStorage;
    global.appData = origAppData;
    global.staysData = origStaysData;
    global.citiesData = origCitiesData;
  }
}

module.exports = {
  runDesktopSplitPrintUnitTests
};

if (require.main === module) {
  runDesktopSplitPrintUnitTests();
}
