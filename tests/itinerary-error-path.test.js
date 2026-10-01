const fs = require('fs');
const path = require('path');
const { assert, createVmContext, runScriptInContext, loadSource } = require('./lib/test-helpers');

async function runItineraryErrorPathTests() {
  console.log('Running itinerary generation error path unit tests...');

  let toastMessage = null;
  let toastType = null;
  let consoleErrorLogged = null;

  const itineraryContainer = {
    id: 'itinerary',
    innerHTML: '',
    appendChild: function() {},
    querySelectorAll: function() { return []; },
    querySelector: function() { return null; }
  };

  const context = createVmContext({
    window: {
      innerWidth: 1024,
      isCompactView: true,
      addEventListener: () => {},
      matchMedia: () => ({ matches: false, addEventListener: () => {} })
    },
    document: {
      getElementById: (id) => (id === 'itinerary' ? itineraryContainer : null),
      querySelectorAll: () => [],
      querySelector: () => null,
      createElement: () => ({ appendChild: () => {}, querySelectorAll: () => [], querySelector: () => null }),
      body: { classList: { contains: () => false, toggle: () => {} } },
      addEventListener: () => {}
    },
    appData: [{ id: 'leg-1', label: 'Tokyo', days: [{ date: '2026-06-01', from: 'Tokyo', to: 'Tokyo' }] }],
    stays: [],
    journeys: [],
    citiesData: [],
    isEditMode: false,
    formatCurrency: (val) => `$${val}`,
    getDayJourneys: () => [],
    cleanCityNavLabel: (lbl) => String(lbl || '').trim(),
    getCityFlag: () => '📍',
    getTransportIcon: () => '✈️',
    renderStatusBadge: () => '',
    getDayTotal: () => '$0',
    getMapSearchUrl: () => '#',
    formatTripDateForDisplay: (d) => d,
    renderMobileSurfaceCard: (opts) => `${opts?.title || ''} ${opts?.primaryAction || ''}`,
    showToast: (msg, type) => {
      toastMessage = msg;
      toastType = type;
    },
    console: {
      log: () => {},
      warn: () => {},
      error: (err) => {
        consoleErrorLogged = err;
      }
    },
    escapeHtmlText: (str) => String(str || '')
  });

  context.window.window = context.window;
  context.window.document = context.document;

  const itineraryCode = loadSource('js/itinerary.js');
  runScriptInContext(itineraryCode, context, 'js/itinerary.js');

  const { generateItinerary, showError } = context;

  assert(typeof generateItinerary === 'function', 'generateItinerary should be defined');
  assert(typeof showError === 'function', 'showError should be defined');

  // Test 1: Direct showError UI rendering & toast dispatch
  showError('Custom error message test');
  assert(itineraryContainer.innerHTML.includes('itinerary-error-state'), 'showError should insert .itinerary-error-state class in container');
  assert(itineraryContainer.innerHTML.includes('Custom error message test'), 'showError should include message in container HTML');
  assert(toastMessage === 'Custom error message test', 'showError should call showToast with message');
  assert(toastType === 'error', 'showError should pass "error" type to showToast');

  // Test 2: generateItinerary happy path
  itineraryContainer.innerHTML = '';
  toastMessage = null;
  toastType = null;
  consoleErrorLogged = null;

  await generateItinerary();
  assert(!itineraryContainer.innerHTML.includes('itinerary-error-state'), 'Happy path generateItinerary should not render error state');

  // Test 3: generateItinerary failure / error path
  itineraryContainer.innerHTML = '';
  toastMessage = null;
  toastType = null;
  consoleErrorLogged = null;

  // Mock buildItinerary in VM context to throw an error
  const simulatedError = new Error('Simulated failure during itinerary build');
  context.buildItinerary = () => {
    throw simulatedError;
  };

  let caughtErr = null;
  try {
    await context.generateItinerary();
  } catch (err) {
    caughtErr = err;
  }

  assert(caughtErr === simulatedError, 'generateItinerary should rethrow the caught generation error');
  assert(itineraryContainer.innerHTML.includes('itinerary-error-state'), 'Error path should render .itinerary-error-state UI alert');
  assert(itineraryContainer.innerHTML.includes('Failed to generate itinerary'), 'Error container should display "Failed to generate itinerary"');
  assert(toastMessage === 'Failed to generate itinerary', 'showToast should be called with "Failed to generate itinerary"');
  assert(toastType === 'error', 'showToast error type should be "error"');
  assert(consoleErrorLogged === simulatedError, 'console.error should log the simulated error');

  console.log('✅ ALL itinerary generation error path tests passed successfully!\n');
}

if (require.main === module) {
  runItineraryErrorPathTests().catch(err => {
    console.error(err.stack || err.message);
    process.exitCode = 1;
  });
}

module.exports = { runItineraryErrorPathTests };
