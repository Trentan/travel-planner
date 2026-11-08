const path = require('path');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function runFrictionlessPersistenceTests() {
  console.log('Running Frictionless IndexedDB Auto-Persistence & Onboarding Tests (Issue #633)...');

  const localStorageData = new Map();
  const elements = new Map();

  const mockLocalStorage = {
    getItem: (key) => localStorageData.has(key) ? localStorageData.get(key) : null,
    setItem: (key, val) => localStorageData.set(key, String(val)),
    removeItem: (key) => localStorageData.delete(key),
    clear: () => localStorageData.clear()
  };

  let setupModalDisplayed = false;
  let tripStartContentHtml = '';

  const createMockElement = (id) => ({
    id,
    style: {},
    innerText: '',
    innerHTML: '',
    value: '',
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    closest: () => ({}),
    cloneNode: function() { return createMockElement(this.id); },
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

  const context = createVmContext({
    addEventListener: () => {},
    removeEventListener: () => {},
    window: {
      isSecureContext: true,
      addEventListener: () => {},
      removeEventListener: () => {},
      indexedDB: {
        open: () => ({
          onsuccess: () => {},
          onerror: () => {},
          onupgradeneeded: () => {}
        })
      }
    },
    document: {
      getElementById: (id) => {
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
        if (id === 'trip-start-content') {
          return {
            id,
            style: {},
            get innerHTML() { return tripStartContentHtml; },
            set innerHTML(val) { tripStartContentHtml = val; },
            classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false }
          };
        }
        if (!elements.has(id)) {
          elements.set(id, createMockElement(id));
        }
        return elements.get(id);
      },
      createElement: () => ({
        style: {},
        classList: { add: () => {}, remove: () => {}, toggle: () => {} },
        appendChild: () => {}
      }),
      addEventListener: () => {}
    },
    localStorage: mockLocalStorage,
    showToast: () => {}
  });

  context.window = context;

  // Load scripts into context
  const utilsSource = loadSource(path.join('js', 'utils.js'));
  runScriptInContext(utilsSource, context, 'js/utils.js');

  const storageSource = loadSource(path.join('js', 'storage-db.js'));
  const matcherSource = loadSource(path.join('js', 'city-matcher.js'));
  runScriptInContext(storageSource, context, 'js/storage-db.js');
  runScriptInContext(matcherSource, context, 'js/city-matcher.js');

  const dataSource = loadSource(path.join('js', 'data.js'));
  const onboardingSource = loadSource(path.join('js', 'trip-onboarding.js'));
  runScriptInContext(dataSource, context, 'js/data.js');
  runScriptInContext(onboardingSource, context, 'js/trip-onboarding.js');

  // -------------------------------------------------------------
  // Test 1: First-time user 'build' choice advances without file-setup-modal
  // -------------------------------------------------------------
  console.log('  1. Testing chooseTripStart("build") without blocking file-setup-modal...');
  localStorageData.clear();
  setupModalDisplayed = false;

  context.chooseTripStart('build');

  assert(setupModalDisplayed === false, 'First-time user choosing "build" must not be blocked by file-setup-modal');
  assert(context.tripStartStep === 'choose_path', 'Trip start step should advance directly to choose_path');
  console.log('  ✔ chooseTripStart("build") advances cleanly to choose_path with no modal block');

  // -------------------------------------------------------------
  // Test 2: Progressive 3-option Quick Starter rendering
  // -------------------------------------------------------------
  console.log('  2. Testing renderTripStartPathChoice() progressive 3-card layout...');
  context.tripStartStep = 'choose_path';
  context.renderTripStart();

  assert(tripStartContentHtml.includes('City & Dates Only'), 'Quick-starter should feature Path A: City & Dates Only');
  assert(tripStartContentHtml.includes('Import Existing Flights'), 'Quick-starter should feature Path B: Import Existing Flights');
  assert(tripStartContentHtml.includes('Start Blank Trip'), 'Quick-starter should feature Path C: Start Blank Trip');
  assert(tripStartContentHtml.includes('startBlankTrip()'), 'Quick-starter Path C must hook to startBlankTrip()');
  console.log('  ✔ Progressive quick-starter renders Explorer, Transport First, and Instant Canvas cards');

  // -------------------------------------------------------------
  // Test 3: startBlankTrip initializes clean active trip and auto-saves
  // -------------------------------------------------------------
  console.log('  3. Testing startBlankTrip() immediate initialization & persistence...');
  let savedDataInvoked = false;
  context.saveData = async () => {
    savedDataInvoked = true;
    return true;
  };

  context.startBlankTrip();

  const activeTripId = typeof context.getActiveTripId === 'function' ? context.getActiveTripId() : null;
  assert(activeTripId && activeTripId.startsWith('trip_'), 'startBlankTrip must generate a valid trip ID');
  assert(savedDataInvoked === true, 'startBlankTrip must trigger immediate persistence save');
  assert(setupModalDisplayed === false, 'startBlankTrip must not trigger file-setup-modal');
  assert(localStorageData.get('travelApp_file_setup_seen') === 'true', 'travelApp_file_setup_seen should be set to true');
  console.log(`  ✔ startBlankTrip initialized ID "${activeTripId}" and triggered auto-save without file prompts`);

  // -------------------------------------------------------------
  // Test 4: Verify destructive actions in index.html are demoted into advanced details
  // -------------------------------------------------------------
  console.log('  4. Testing desktop and mobile menus for demoted destructive jargon...');
  const fs = require('fs');
  const indexHtml = fs.readFileSync('index.html', 'utf8');

  assert(indexHtml.includes('desktop-menu-advanced'), 'Desktop actions menu must include collapsible advanced details');
  assert(indexHtml.includes('mobile-menu-advanced'), 'Mobile menu must include collapsible advanced details');

  // Check that Factory Reset is inside advanced diagnostics in desktop menu
  const desktopAdvancedMatch = indexHtml.match(/class="desktop-menu-advanced[^"]*"[\s\S]*?<\/div>/);
  assert(desktopAdvancedMatch && desktopAdvancedMatch[0].includes('promptFactoryReset()'), 'Factory Reset must be tucked inside desktop-menu-advanced');

  // Check that Factory Reset is inside details in mobile menu
  const mobileAdvancedMatch = indexHtml.match(/<details class="mobile-menu-advanced[^"]*">([\s\S]*?)<\/details>/);
  assert(mobileAdvancedMatch && mobileAdvancedMatch[1].includes('promptFactoryReset()'), 'Factory Reset must be tucked inside mobile-menu-advanced');
  console.log('  ✔ Destructive actions (Factory Reset / Hard Restart) safely demoted into advanced diagnostics');

  console.log('✅ ALL FRICTIONLESS INDEXEDDB PERSISTENCE TESTS PASSED CLEANLY!\n');
}

if (require.main === module) {
  try {
    runFrictionlessPersistenceTests();
  } catch (err) {
    console.error('❌ Frictionless persistence tests failed:', err);
    process.exit(1);
  }
}

module.exports = { runFrictionlessPersistenceTests };
