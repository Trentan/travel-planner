const path = require('path');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function createTestingContext() {
  const localStorageData = new Map();
  let elements = new Map();

  const mockLocalStorage = {
    getItem: (key) => localStorageData.has(key) ? localStorageData.get(key) : null,
    setItem: (key, val) => localStorageData.set(key, String(val)),
    removeItem: (key) => localStorageData.delete(key),
    clear: () => localStorageData.clear()
  };

  const context = createVmContext({
    window: {
      isSecureContext: true,
      showOpenFilePicker: () => {},
      addEventListener: () => {},
      removeEventListener: () => {}
    },
    document: {
      getElementById: (id) => {
        if (!elements.has(id)) {
          elements.set(id, {
            id,
            style: {},
            innerText: '',
            innerHTML: '',
            value: '',
            classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
            closest: () => ({}),
            cloneNode: function() { return { ...this }; },
            parentNode: { replaceChild: () => {} },
            addEventListener: () => {},
            removeEventListener: () => {},
            scrollIntoView: () => {},
            remove: function() { elements.delete(this.id); },
            setAttribute: () => {},
            removeAttribute: () => {},
            dataset: { fallback: '' },
            textContent: ''
          });
        }
        return elements.get(id);
      },
      createElement: () => ({
        style: {},
        classList: { add: () => {}, remove: () => {}, toggle: () => {} },
        appendChild: () => {},
        addEventListener: () => {}
      }),
      body: {
        appendChild: () => {},
        classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
        style: {}
      },
      querySelectorAll: () => [],
      querySelector: () => ({
        scrollIntoView: () => {},
        getBoundingClientRect: () => ({ top: 0, left: 0, bottom: 0, right: 0 }),
        classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
        style: {},
        getAttribute: () => 'itinerary'
      }),
      addEventListener: () => {},
      removeEventListener: () => {}
    },
    localStorage: mockLocalStorage,
    DEFAULT_TRIP_DATA: {
      meta: { title: 'Default Template', subtitle: '' },
      itinerary: [],
      journeys: [],
      stays: []
    },
    DEFAULT_PACKING: [],
    DEFAULT_LEAVE_HOME: [],
    DEFAULT_HOTEL_CHECKOUT: [],
    ALL_CITIES: [],
    COUNTRY_DATA: [],
    mergeChecklistWithDefaults: (data) => data || [],
    extractCitiesFromItinerary: () => [],
    ensureDefaultPackingAreas: (data) => data || [],
    titleData: { title: 'Default Template', subtitle: '' },
    appData: [],
    journeys: [],
    stays: [],
    citiesData: [],
    alert: () => {},
    updateLegTip: () => {},
    deleteLegTip: () => {},
    addLeg: () => {},
    deleteLeg: () => {},
    console: {
      log: () => {},
      warn: () => {},
      error: () => {}
    }
  });

  context.window.localStorage = mockLocalStorage;

  return { context, localStorageData, elements };
}

async function run() {
  const { context, localStorageData, elements } = createTestingContext();
  
  // Load necessary sources
  const dataJs = loadSource(path.join('js', 'data.js'));
  const guideJs = loadSource(path.join('js', 'guide.js'));

  runScriptInContext(dataJs, context, 'js/data.js');
  runScriptInContext(guideJs, context, 'js/guide.js');

  // Test 1: File Connection Status and Active File Handle
  context.clearActiveFileHandle();
  assert(!context.hasActiveFileHandle(), 'Active file handle should be clear initially');
  assert(context.getActiveFileHandleName() === 'Default Template', 'Default template should be returned if no active file handle name');

  // Simulate setting file handle
  const dummyHandle = { name: 'TripToJapan.json' };
  context.setActiveFileHandle(dummyHandle);
  assert(context.hasActiveFileHandle(), 'Active file handle should be true');
  assert(context.getActiveFileHandleName() === 'TripToJapan.json', 'Should return the active file name');
  assert(localStorageData.get('travelApp_filename_v2026') === 'TripToJapan.json', 'localStorage should have filename updated');
  assert(localStorageData.get('travelApp_file_handle_name') === 'TripToJapan.json', 'localStorage should have file_handle_name updated');

  // Test 2: Corrupted Files / Empty state reload & emergency backup recovery
  // Simulate corrupt localStorage entries
  localStorageData.set('travelApp_v2026_template', '{corrupted_json_itinerary');
  localStorageData.set('travelApp_journeys_v1', '[{"id": "journey-1", "cost": "invalid_json"}'); // Invalid JSON formatting

  // Parse errors must be caught gracefully within initData
  let initError = null;
  try {
    await context.initData();
  } catch (err) {
    initError = err;
    console.error('Captured error in initData:', err);
  }
  assert(initError === null, 'initData should catch JSON parse errors internally and recover using defaults instead of throwing');

  // Verify that DEFAULT_TRIP_DATA is populated as a fallback when localStorage is corrupt
  assert(Array.isArray(context.journeys), 'journeys fallback should resolve to array on corrupt storage');
  assert(Array.isArray(context.appData), 'appData fallback should resolve to array on corrupt storage');

  // Testing reordered onboarding flow choice sequence...
  console.log('Testing reordered onboarding flow choice sequence...');
  let setupModalDisplayed = false;
  context.document.getElementById = (id) => {
    if (id === 'file-setup-modal') {
      return {
        id,
        style: {
          get display() { return setupModalDisplayed ? 'flex' : 'none'; },
          set display(val) { setupModalDisplayed = (val === 'flex'); }
        },
        dataset: { fallback: '' }
      };
    }
    // Fallback Mock elements
    if (!elements.has(id)) {
      elements.set(id, {
        id,
        style: {},
        classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
        setAttribute: () => {},
        removeAttribute: () => {},
        dataset: { fallback: '' }
      });
    }
    return elements.get(id);
  };

  // Mock setup flag not seen (return null) and no active handle
  localStorageData.delete('travelApp_file_setup_seen');
  context.clearActiveFileHandle();

  // Selecting 'build' should now redirect to show file-setup-modal
  await context.chooseTripStart('build');
  assert(setupModalDisplayed === true, 'chooseTripStart("build") should show the file-setup-modal if storage setup not seen yet');

  // Test 5: resync timeout threshold checking
  console.log('Testing resync appStateChange timeout threshold...');
  const appListeners = [];
  context.window.Capacitor = {
    Plugins: {
      App: {
        addListener: (name, cb) => {
          if (name === 'appStateChange') appListeners.push(cb);
        }
      }
    }
  };

  // Load ui.js context to evaluate appStateChange register hooks
  // Since js/ui.js wraps registration in DOMContentLoaded listener, mock and call it
  const documentListeners = [];
  context.document.addEventListener = (name, cb) => {
    if (name === 'DOMContentLoaded') documentListeners.push(cb);
  };

  const uiJs = loadSource(path.join('js', 'ui.js'));
  runScriptInContext(uiJs, context, 'js/ui.js');

  // Simulate active / inactive toggling
  let resyncModalDisplayed = false;
  context.document.getElementById = (id) => {
    if (id === 'resync-modal') {
      return {
        id,
        style: {
          get display() { return resyncModalDisplayed ? 'flex' : 'none'; },
          set display(val) { resyncModalDisplayed = (val === 'flex'); }
        },
        dataset: { fallback: '' }
      };
    }
    const existing = elements.get(id);
    if (existing) {
      if (!existing.dataset) existing.dataset = { fallback: '' };
      return existing;
    }
    return { style: {}, classList: { add: () => {}, remove: () => {}, toggle: () => {} }, dataset: { fallback: '' }, setAttribute: () => {}, removeAttribute: () => {} };
  };

  // Trigger DOMContentLoaded manually to set up listener registration
  let mockTime = 1700000000000;
  const originalNow = Date.now;
  Date.now = () => mockTime;
  context.Date = { now: () => mockTime };

  if (documentListeners.length > 0) {
    documentListeners.forEach(cb => cb());
  }

  // Verify listeners were added
  assert(appListeners.length > 0, 'Capacitor appStateChange listener should be registered');

  // Trigger active state change with a gap of 20 seconds (should NOT trigger resync modal)
  const listener = appListeners[0];

  listener({ isActive: false }); // Records lastSuspendedTime at mockTime
  
  mockTime += 20000; // Jump 20 seconds
  listener({ isActive: true });
  assert(resyncModalDisplayed === false, 'Resync modal should not trigger for idle duration under 15 minutes');

  // Trigger active state change with a gap of 16 minutes (should trigger resync modal)
  listener({ isActive: false }); // Records lastSuspendedTime at mockTime
  
  mockTime += 1000000; // Jump ~16.6 minutes (>15 minutes)
  listener({ isActive: true });
  assert(resyncModalDisplayed === true, 'Resync modal should trigger for idle duration exceeding 15 minutes');

  // Restore global Clock helper
  Date.now = originalNow;

  console.log('File I/O Robustness, onboarding choice priority, and resync timeout checks passed');
}

if (require.main === module) {
  run().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { run };
