const path = require('path');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function createSimpleDom() {
  const elements = {};

  function makeElement(id) {
    return {
      id,
      style: {},
      hidden: false,
      children: [],
      classList: {
        add() {},
        remove() {}
      },
      _innerHTML: '',
      get innerHTML() {
        return this._innerHTML;
      },
      set innerHTML(val) {
        this._innerHTML = val;
      },
      _innerText: '',
      get innerText() {
        return this._innerText;
      },
      set innerText(val) {
        this._innerText = val;
      },
      appendChild(child) {
        this.children.push(child);
      }
    };
  }

  return {
    getElementById(id) {
      if (!elements[id]) {
        elements[id] = makeElement(id);
      }
      return elements[id];
    },
    createElement(tag) {
      return makeElement(`el_${Math.random()}`);
    },
    elements
  };
}

async function runTripLibraryGDriveSyncTests() {
  console.log('Running Trip Library & Google Drive Sync hardening tests (Issue #421)...');

  const document = createSimpleDom();
  const localStorageMap = new Map();

  const mockLocalStorage = {
    getItem(key) {
      return localStorageMap.get(key) || null;
    },
    setItem(key, value) {
      localStorageMap.set(key, String(value));
    },
    removeItem(key) {
      localStorageMap.delete(key);
    }
  };

  let mockTrips = [
    {
      id: 'trip_europe_2026',
      title: 'Europe Summer 2026',
      subtitle: 'London, Paris, Verona',
      data: {
        meta: { title: 'Europe Summer 2026', subtitle: 'London, Paris, Verona' },
        itinerary: [{ id: 'leg_1' }, { id: 'leg_2' }, { id: 'leg_3' }],
        stays: [{ id: 'stay_1' }, { id: 'stay_2' }]
      }
    }
  ];

  let driveSyncCalled = false;
  let driveSyncSilent = null;

  const context = createVmContext({
    document,
    localStorage: mockLocalStorage,
    window: {
      location: { origin: 'http://localhost:3000', hostname: 'localhost' },
      isGoogleDriveConnected: () => true,
      getUserProfile: () => ({ name: 'Test Traveler', email: 'test@example.com', picture: 'https://example.com/pic.jpg' }),
      getGoogleDriveFolderUrl: () => 'https://drive.google.com/drive/folders/test123',
      getGDriveFileMap: () => ({ trip_europe_2026: 'gdrive_file_1' }),
      getActiveTripId: () => 'trip_europe_2026',
      getAllTripsFromIndexedDB: async () => mockTrips,
      syncAllTripsFromGoogleDrive: async (isSilent) => {
        driveSyncCalled = true;
        driveSyncSilent = isSilent;
        return [];
      }
    },
    console
  });

  const tripLibrarySource = loadSource(path.join('js', 'trip-library.js'));
  runScriptInContext(tripLibrarySource, context, 'js/trip-library.js');

  // Test 1: Normal gallery render correctly counts legs and stays using itinerary / stays arrays
  await context.window.renderTripGalleryGrid();
  const grid = document.getElementById('tripGalleryGrid');
  assert(grid.children.length === 1, 'Should render 1 trip card');
  const cardHtml = grid.children[0].innerHTML;
  assert(cardHtml.includes('3 legs'), `Expected '3 legs' from itinerary, got: ${cardHtml}`);
  assert(cardHtml.includes('2 stays'), `Expected '2 stays' from stays, got: ${cardHtml}`);
  console.log('✓ Test 1 Passed: Leg count and stay count accurately calculated from itinerary schema');

  // Test 2: Error boundary fallback when getAllTripsFromIndexedDB throws
  context.window.getAllTripsFromIndexedDB = async () => {
    throw new Error('Simulated IndexedDB connection failure');
  };
  await context.window.renderTripGalleryGrid();
  assert(grid.innerHTML.includes('Unable to Load Trips'), 'Grid should display error boundary fallback on failure');
  assert(grid.innerHTML.includes('Simulated IndexedDB connection failure'), 'Grid should show error message');
  assert(grid.innerHTML.includes('Retry'), 'Grid should have Retry button');
  console.log('✓ Test 2 Passed: Error boundary fallback prevents stuck "Loading trips..." state');

  // Test 3: openTripLibraryModal triggers background Google Drive sync
  driveSyncCalled = false;
  context.window.getAllTripsFromIndexedDB = async () => mockTrips;
  await context.window.openTripLibraryModal();
  assert(driveSyncCalled === true, 'openTripLibraryModal should trigger background Drive sync when connected');
  assert(driveSyncSilent === true, 'Background sync on modal open should be silent');
  console.log('✓ Test 3 Passed: openTripLibraryModal triggers background Drive sync');

  // Test 4: switchTripLibraryTab('cloud') triggers auto-fetch when cloud files empty
  driveSyncCalled = false;
  context.window.__gdriveCloudFiles = [];
  context.window.switchTripLibraryTab('cloud');
  assert(driveSyncCalled === true, 'switchTripLibraryTab("cloud") should trigger Drive sync when __gdriveCloudFiles is empty');
  assert(driveSyncSilent === false, 'Cloud tab auto-sync should show status pill (not silent)');
  console.log('✓ Test 4 Passed: Switching to Cloud tab triggers sync when no files cached');

  console.log('✅ ALL TRIP LIBRARY & GDRIVE SYNC TESTS PASSED CLEANLY!');
}

module.exports = { runTripLibraryGDriveSyncTests };
if (require.main === module) {
  runTripLibraryGDriveSyncTests().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
