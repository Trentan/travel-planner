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
    },
    localStorage: mockLocalStorage,
    calculateDjb2Hash: (str) => {
      let hash = 5381;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
      }
      return hash >>> 0;
    }
  });

  context.window.localStorage = mockLocalStorage;
  context.window.calculateDjb2Hash = (str) => {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return hash >>> 0;
  };
  context.calculateDjb2Hash = context.window.calculateDjb2Hash;

  return { context, localStorageData, elements };
}

async function run() {
  const { context, localStorageData, elements } = createTestingContext();
  
  // Load necessary sources
  const dataJs = loadSource(path.join('js', 'data.js'));
  const guideJs = loadSource(path.join('js', 'guide.js'));
  const cloudStorageJs = loadSource(path.join('js', 'cloud-storage.js'));

  runScriptInContext(dataJs, context, 'js/data.js');
  runScriptInContext(guideJs, context, 'js/guide.js');
  runScriptInContext(cloudStorageJs, context, 'js/cloud-storage.js');

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

  // Set up mock elements needed for renderTripStart to run successfully
  elements.set('trip-start-content', {
    id: 'trip-start-content',
    style: {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    innerHTML: ''
  });
  elements.set('trip-start-modal', {
    id: 'trip-start-modal',
    style: { display: 'none' },
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false }
  });

  // Selecting 'build' should now redirect to show file-setup-modal
  context.chooseTripStart('build');
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

  // Set up active file handle mock returning specific text file content
  let mockFileText = '{"itinerary":[]}';
  const mockFileHandle = {
    getFile: async () => ({
      text: async () => mockFileText
    })
  };
  context.window.getActiveFileHandle = () => mockFileHandle;
  context.getActiveFileHandle = context.window.getActiveFileHandle;

  // Set initial saved hash matching file text
  const initialHash = context.calculateDjb2Hash(mockFileText);
  localStorageData.set('travelApp_last_known_hash', String(initialHash));

  // Verify listeners were added
  assert(appListeners.length > 0, 'Capacitor appStateChange listener should be registered');

  // Trigger active state change with matching checksum (should NOT trigger resync modal)
  const listener = appListeners[0];
  listener({ isActive: false });
  await listener({ isActive: true });
  await new Promise(resolve => setTimeout(resolve, 50));
  assert(resyncModalDisplayed === false, 'Resync modal should not trigger if file checksum matches local hash');

  // Trigger active state change with modified checksum (should trigger resync modal)
  listener({ isActive: false });
  mockFileText = '{"itinerary":[{"label":"New destination"}]}'; // Modify file contents
  await listener({ isActive: true });
  await new Promise(resolve => setTimeout(resolve, 50));
  assert(resyncModalDisplayed === true, 'Resync modal should trigger if background file checksum has changed');

  // Restore global Clock helper
  Date.now = originalNow;

  // Test 6: formatHumanFilename unit tests
  console.log('Testing formatHumanFilename title sanitization and fallback logic...');
  const formatFn = context.window.formatHumanFilename;
  assert(typeof formatFn === 'function', 'formatHumanFilename should be exposed on window');

  // Case 1: Direct tripRecord.title
  assert(
    formatFn({ title: 'Europe Summer 2026' }) === 'Europe_Summer_2026.json',
    'Should sanitize tripRecord.title'
  );

  // Case 2: Fallback to tripRecord.data.title
  assert(
    formatFn({ data: { title: 'Japan Trip' } }) === 'Japan_Trip.json',
    'Should fallback to tripRecord.data.title'
  );

  // Case 3: Fallback to tripRecord.data.meta.title
  assert(
    formatFn({ data: { meta: { title: 'Backpacking Italy' } } }) === 'Backpacking_Italy.json',
    'Should fallback to tripRecord.data.meta.title'
  );

  // Case 4: Default fallback when title is missing or empty
  assert(
    formatFn({}) === 'My_Trip.json',
    'Should fallback to My_Trip.json for empty object'
  );
  assert(
    formatFn({ title: '' }) === 'My_Trip.json',
    'Should fallback to My_Trip.json for empty title string'
  );

  // Case 5: Special characters removal
  assert(
    formatFn({ title: 'Summer Vacay @ Paris (2026)!' }) === 'Summer_Vacay_Paris_2026.json',
    'Should remove special characters except spaces, hyphens, and underscores'
  );

  // Case 6: Whitespace collapse and trimming
  assert(
    formatFn({ title: '  Tokyo   &   Kyoto  ' }) === 'Tokyo_Kyoto.json',
    'Should collapse multiple spaces into single underscores and trim leading/trailing space'
  );

  // Case 7: Preservation of hyphens and underscores
  assert(
    formatFn({ title: 'My-Awesome_Trip 2026' }) === 'My-Awesome_Trip_2026.json',
    'Should preserve hyphens and underscores'
  );

  // Case 8: Title with only invalid special characters
  assert(
    formatFn({ title: '!!!' }) === 'Trip.json',
    'Should fallback to Trip.json when sanitization strips all characters'
  );

  console.log('File I/O Robustness, onboarding choice priority, background checksum resync, and formatHumanFilename checks passed');
}

if (require.main === module) {
  run().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { run };
