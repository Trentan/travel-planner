const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock browser environment
const store = {};
global.localStorage = {
  getItem: (key) => store[key] || null,
  setItem: (key, val) => { store[key] = String(val); },
  removeItem: (key) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};

global.window = global;
global.window.addEventListener = () => {};

const elements = {};
function createMockElement(id, initialProps = {}) {
  const el = {
    id,
    value: '',
    style: {},
    classList: {
      classes: new Set(),
      add(c) { this.classes.add(c); },
      remove(c) { this.classes.delete(c); },
      contains(c) { return this.classes.has(c); }
    },
    checked: true,
    disabled: false,
    innerHTML: '',
    textContent: '',
    innerText: '',
    addEventListener() {},
    querySelectorAll() { return []; },
    ...initialProps
  };
  elements[id] = el;
  return el;
}

createMockElement('trip-start-modal');
createMockElement('trip-start-content');
createMockElement('file-setup-modal');
createMockElement('mainTitle');
createMockElement('mainSubtitle');

const prevDoc = global.document;

function getMockOrExistingElem(id) {
  if (elements[id]) return elements[id];
  if (prevDoc && typeof prevDoc.getElementById === 'function') {
    return prevDoc.getElementById(id);
  }
  return null;
}

global.document = {
  body: prevDoc?.body || {
    classList: { contains: () => false },
    insertBefore: () => {},
    appendChild: () => {}
  },
  getElementById(id) {
    return getMockOrExistingElem(id);
  },
  createElement(tag) {
    if (prevDoc && typeof prevDoc.createElement === 'function') {
      return prevDoc.createElement(tag);
    }
    return createMockElement('el-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6));
  },
  querySelector(sel) {
    if (sel && sel.startsWith('#')) {
      const el = getMockOrExistingElem(sel.slice(1));
      if (el) return el;
    }
    if (prevDoc && typeof prevDoc.querySelector === 'function') {
      return prevDoc.querySelector(sel);
    }
    return null;
  },
  querySelectorAll(sel) {
    if (prevDoc && typeof prevDoc.querySelectorAll === 'function') {
      return prevDoc.querySelectorAll(sel);
    }
    return [];
  },
  addEventListener(evt, handler) {
    if (prevDoc && typeof prevDoc.addEventListener === 'function') {
      return prevDoc.addEventListener(evt, handler);
    }
  }
};

global.showToast = () => {};
global.saveData = () => Promise.resolve();
global.buildNav = () => {};
global.buildItinerary = () => {};
global.buildCityNav = () => {};
global.buildTransportTab = () => {};
global.buildAccomTab = () => {};
global.buildTabs = () => {};
global.isFSASupported = () => false;
global.exportJSON = () => {};
global.hasActiveFileHandle = () => false;

// Load booking-intake.js and data.js into runtime
require('../js/booking-intake');
require('../js/data');

async function runDualPathWizardSuite() {
  console.log('Running Dual-Path Wizard & Flight Intake Test Suite (Issue #215)...');

  // Test 1: Multi-segment flight confirmation parsing
  console.log('  1. Testing multi-segment flight confirmation parser...');
  const multiSegmentText = `
Flight 1: QF1 from Sydney to London
Departure: 2026-06-01 14:00
Arrival: 2026-06-02 06:30
PNR: QF123

Flight 2: BA304 from London to Paris
Departure: 2026-06-06 09:15
Arrival: 2026-06-06 11:30
PNR: BA456

Flight 3: AF218 from Paris to Sydney
Departure: 2026-06-15 18:30
Arrival: 2026-06-16 20:45
PNR: AF789
  `;

  const parsedItems = window.parseBookingConfirmationText(multiSegmentText);
  assert.strictEqual(parsedItems.length, 3, 'Should parse all 3 flight segments');
  assert.strictEqual(parsedItems[0].fromLocation, 'Sydney', 'Segment 1 fromLocation should be Sydney');
  assert.strictEqual(parsedItems[0].toLocation, 'London', 'Segment 1 toLocation should be London');
  assert.strictEqual(parsedItems[0].departureDate, '2026-06-01', 'Segment 1 departureDate should be 2026-06-01');
  assert.strictEqual(parsedItems[0].arrivalDate, '2026-06-02', 'Segment 1 arrivalDate should be 2026-06-02');
  assert.strictEqual(parsedItems[0].routeCode, 'QF1', 'Segment 1 routeCode should be QF1');
  assert.strictEqual(parsedItems[0].bookingReference, 'QF123', 'Segment 1 PNR should be QF123');

  assert.strictEqual(parsedItems[1].fromLocation, 'London', 'Segment 2 fromLocation should be London');
  assert.strictEqual(parsedItems[1].toLocation, 'Paris', 'Segment 2 toLocation should be Paris');
  assert.strictEqual(parsedItems[1].departureDate, '2026-06-06', 'Segment 2 departureDate should be 2026-06-06');
  assert.strictEqual(parsedItems[1].routeCode, 'BA304', 'Segment 2 routeCode should be BA304');

  assert.strictEqual(parsedItems[2].fromLocation, 'Paris', 'Segment 3 fromLocation should be Paris');
  assert.strictEqual(parsedItems[2].toLocation, 'Sydney', 'Segment 3 toLocation should be Sydney');
  assert.strictEqual(parsedItems[2].departureDate, '2026-06-15', 'Segment 3 departureDate should be 2026-06-15');

  // Test 2: Step 0 Path choice rendering
  console.log('  2. Testing Step 0 Choose Your Planning Path fork rendering...');
  window.tripStartStep = 'choose_path';
  window.renderTripStart();
  const contentHtml = elements['trip-start-content'].innerHTML;

  assert(contentHtml.includes('trip-builder-step-0'), 'Should have class trip-builder-step-0');
  assert(contentHtml.includes('data-step="0"'), 'Should have data-step="0" attribute');
  assert(contentHtml.includes('City & Dates Only'), 'Should display Path A: City & Dates Only');
  assert(contentHtml.includes('Import Existing Flights'), 'Should display Path B: Import Existing Flights');
  assert(contentHtml.includes('selectTripStartPath(\'cities\')'), 'Should wire up cities path selection');
  assert(contentHtml.includes('selectTripStartPath(\'flights\')'), 'Should wire up flights path selection');

  // Test 3: Path A navigation transition
  console.log('  3. Testing Path A selection transition to step 1...');
  window.selectTripStartPath('cities');
  assert.strictEqual(window.tripStartAnswers.planningPath, 'cities', 'planningPath should be cities');
  assert.strictEqual(window.tripStartStep, 1, 'tripStartStep should advance to 1');
  assert(elements['trip-start-content'].innerHTML.includes('tripStartName'), 'Step 1 should render trip name input');

  // Test 4: Back navigation from Step 1 returns to Step 0 fork
  console.log('  4. Testing Back navigation from Path A Step 1...');
  window.previousTripStartStep();
  assert.strictEqual(window.tripStartStep, 'choose_path', 'Going back from step 1 should return to choose_path');

  // Test 5: Path B selection transition to flight_import
  console.log('  5. Testing Path B selection transition to flight_import...');
  window.selectTripStartPath('flights');
  assert.strictEqual(window.tripStartAnswers.planningPath, 'flights', 'planningPath should be flights');
  assert.strictEqual(window.tripStartStep, 'flight_import', 'tripStartStep should be flight_import');
  assert(elements['trip-start-content'].innerHTML.includes('tripStartFlightRaw'), 'Should render flight raw textarea');
  assert(elements['trip-start-content'].innerHTML.includes('extractTripStartFlights'), 'Should offer extraction action');

  // Test 6: Back navigation from Path B flight_import returns to Step 0 fork
  console.log('  6. Testing Back navigation from Path B flight_import...');
  window.previousTripStartStep();
  assert.strictEqual(window.tripStartStep, 'choose_path', 'Going back from flight_import should return to choose_path');

  // Test 7: Path B End-to-end trip creation from multi-city flights
  console.log('  7. Testing Path B trip creation and leg calculation from confirmed bookings...');
  window.selectTripStartPath('flights');
  window.tripStartAnswers.flightRawText = multiSegmentText;
  window.tripStartAnswers.name = 'Grand European Tour 2026';
  window.tripStartAnswers.origin = 'Sydney';
  window.extractTripStartFlights();

  assert.strictEqual(window.tripStartAnswers.extractedBookings.length, 3, 'Should have 3 extracted bookings');

  await window.createTripFromFlightBookings();

  // Verify constructed data structures
  assert.strictEqual(elements['mainTitle'].innerText, 'Grand European Tour 2026', 'Trip title should be set');
  assert(elements['mainSubtitle'].innerText.includes('3 confirmed flights'), 'Subtitle should report confirmed flight count');

  // Verify citiesData
  assert.strictEqual(window.citiesData.length, 2, 'Should create 2 destination cities (London and Paris)');
  assert.strictEqual(window.citiesData[0].name, 'London', 'First destination city should be London');
  assert.strictEqual(window.citiesData[1].name, 'Paris', 'Second destination city should be Paris');
  assert(window.citiesData[0].countryCode, 'London should have countryCode');
  assert(window.citiesData[1].countryCode, 'Paris should have countryCode');

  // Verify appData legs & stay nights
  // London: arrives 2026-06-02, departs 2026-06-06 -> 4 nights
  // Paris: arrives 2026-06-06, departs 2026-06-15 -> 9 nights
  // Legs: Start leg + London leg + Paris leg + Return leg = 4 legs
  assert.strictEqual(window.appData.length, 4, 'Should create 4 itinerary legs (Start + London + Paris + Return)');
  const londonLeg = window.appData.find(leg => leg.label === 'London');
  const parisLeg = window.appData.find(leg => leg.label === 'Paris');
  assert(londonLeg, 'Should have London leg');
  assert(parisLeg, 'Should have Paris leg');
  assert.strictEqual(londonLeg.days.length, 4, 'London should have 4 days (June 2-5)');
  assert.strictEqual(parisLeg.days.length, 9, 'Paris should have 9 days (June 6-14)');

  // Verify journeys
  assert.strictEqual(window.journeys.length, 3, 'Should create 3 journeys matching extracted flights');
  assert.strictEqual(window.journeys[0].fromLocation, 'Sydney');
  assert.strictEqual(window.journeys[0].toLocation, 'London');
  assert.strictEqual(window.journeys[0].routeCode, 'QF1');
  assert.strictEqual(window.journeys[0].status, 'confirmed');

  assert.strictEqual(window.journeys[1].fromLocation, 'London');
  assert.strictEqual(window.journeys[1].toLocation, 'Paris');
  assert.strictEqual(window.journeys[1].routeCode, 'BA304');

  assert.strictEqual(window.journeys[2].fromLocation, 'Paris');
  assert.strictEqual(window.journeys[2].toLocation, 'Sydney');
  assert.strictEqual(window.journeys[2].routeCode, 'AF218');

  // Verify stays
  assert.strictEqual(window.stays.length, 2, 'Should create 2 stays for London and Paris');
  assert.strictEqual(window.stays[0].cityName, 'London');
  assert.strictEqual(window.stays[0].nights, 4);
  assert.strictEqual(window.stays[1].cityName, 'Paris');
  assert.strictEqual(window.stays[1].nights, 9);

  // Test 8: openCreateNewTripWizard entry point
  console.log('  8. Testing openCreateNewTripWizard opens Step 0 fork...');
  window.openCreateNewTripWizard();
  assert.strictEqual(window.tripStartStep, 'choose_path', 'openCreateNewTripWizard should open directly to choose_path');

  console.log('✅ ALL DUAL-PATH WIZARD TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  runDualPathWizardSuite().catch(err => {
    console.error('❌ Dual-path wizard suite failed:', err);
    process.exitCode = 1;
  });
}

module.exports = { runDualPathWizardSuite };
