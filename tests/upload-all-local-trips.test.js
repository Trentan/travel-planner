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
      }
    };
  }

  const ids = [
    'cloudSyncModal',
    'gdriveProfileCard',
    'gdriveFolderLinkContainer',
    'gdriveFileListContainer',
    'gdriveModalStatusText',
    'gdriveConnectBtn',
    'gdriveDisconnectBtn',
    'gdriveActiveClientIdLabel',
    'headerCloudSyncStatusPill',
    'cloudSyncStatusPill',
    'mobileCloudSyncStatusPill'
  ];

  for (const id of ids) {
    elements[id] = makeElement(id);
  }

  return {
    getElementById(id) {
      if (!elements[id]) {
        elements[id] = makeElement(id);
      }
      return elements[id];
    },
    querySelector() {
      return null;
    },
    elements
  };
}

async function runUploadAllLocalTripsBenchmarkAndTest() {
  console.log('--- Running uploadAllLocalTripsToDrive Benchmark & Test Suite ---');

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

  const DELAY_PER_UPLOAD = 20; // 20ms simulated network delay per trip upload
  const TRIP_COUNT = 10;
  const mockTrips = Array.from({ length: TRIP_COUNT }, (_, i) => ({
    id: `trip_${i + 1}`,
    title: `Trip ${i + 1}`
  }));

  let uploadedCount = 0;

  const mockFetch = async (url, options) => {
    await new Promise(resolve => setTimeout(resolve, DELAY_PER_UPLOAD));
    uploadedCount++;
    return {
      ok: true,
      status: 200,
      json: async () => ({ id: `gdrive_file_${uploadedCount}`, files: [{ id: 'folder_123' }] })
    };
  };

  const context = createVmContext({
    URL,
    document,
    fetch: mockFetch,
    localStorage: mockLocalStorage,
    location: { hostname: 'localhost', origin: 'http://localhost:3000', href: 'http://localhost:3000/', protocol: 'http:' },
    addEventListener() {},
    getAllTripsFromIndexedDB: async () => mockTrips,
    saveTripToIndexedDB: async () => {},
    renderHeaderTripSwitcher: () => {},
    renderTripGalleryGrid: () => {},
    showToast: () => {}
  });
  context.window = context;

  // Set up valid auth tokens and folder
  mockLocalStorage.setItem('travelApp_gdrive_connected', 'true');
  mockLocalStorage.setItem('travelApp_gdrive_approved', 'true');
  mockLocalStorage.setItem('travelApp_gdrive_token', 'valid_oauth_token_abc');
  mockLocalStorage.setItem('travelApp_gdrive_token_expiry', String(Date.now() + 3600000));
  mockLocalStorage.setItem('travelApp_gdrive_folder_id', 'folder_123');

  const utilsSource = loadSource(path.join('js', 'utils.js'));
  runScriptInContext(utilsSource, context, 'js/utils.js');

  const cloudStorageSource = loadSource(path.join('js', 'cloud-storage.js'));
  runScriptInContext(cloudStorageSource, context, 'js/cloud-storage.js');

  console.log(`1. Benchmark: Uploading ${TRIP_COUNT} trips with simulated ${DELAY_PER_UPLOAD}ms network delay each...`);
  uploadedCount = 0;
  const start = Date.now();
  await context.uploadAllLocalTripsToDrive();
  const elapsed = Date.now() - start;

  console.log(`   Time taken: ${elapsed}ms`);
  console.log(`   Fetch calls count: ${uploadedCount}`);

  // Sequential execution takes at least TRIP_COUNT * DELAY_PER_UPLOAD (10 * 20 = 200ms)
  const expectedSequentialMinTime = TRIP_COUNT * DELAY_PER_UPLOAD;
  console.log(`   Sequential minimum expected time: ${expectedSequentialMinTime}ms`);

  console.log('✅ uploadAllLocalTripsToDrive benchmark and test setup verified!');
  return { elapsed, expectedSequentialMinTime };
}

if (require.main === module) {
  runUploadAllLocalTripsBenchmarkAndTest()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ TEST FAILED:', err);
      process.exit(1);
    });
}

module.exports = { runUploadAllLocalTripsBenchmarkAndTest };
