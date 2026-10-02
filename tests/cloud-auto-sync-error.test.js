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

async function runCloudAutoSyncErrorTests() {
  console.log('--- Running autoSyncActiveTripToCloud Error Path Tests ---');

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

  const sampleTrip = {
    id: 'trip_default',
    title: 'Tokyo & Kyoto 2026',
    subtitle: 'Japan Tour',
    data: { meta: { title: 'Tokyo & Kyoto 2026' } }
  };

  let uploadCalls = [];
  let simulatedUploadError = null;

  const mockUploadTripToGoogleDrive = async (trip, isSilent) => {
    uploadCalls.push({ trip, isSilent });
    if (simulatedUploadError) {
      throw simulatedUploadError;
    }
    return true;
  };

  const context = createVmContext({
    URL,
    document,
    localStorage: mockLocalStorage,
    location: { hostname: 'localhost', origin: 'http://localhost:3000', href: 'http://localhost:3000/', protocol: 'http:' },
    addEventListener() {},
    getAllTripsFromIndexedDB: async () => [sampleTrip],
    getActiveTripId: () => 'trip_default',
    uploadTripToGoogleDrive: mockUploadTripToGoogleDrive,
    saveTripToIndexedDB: async () => {},
    renderHeaderTripSwitcher: () => {},
    renderTripGalleryGrid: () => {},
    showToast: () => {},
    __cloudAutoSyncDelayMs: 25
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

  // Override uploadTripToGoogleDrive on context.window to point to our mock
  context.uploadTripToGoogleDrive = mockUploadTripToGoogleDrive;

  // Test Case 1: Disconnected state - autoSyncActiveTripToCloud should exit early
  console.log('1. Testing disconnected state...');
  uploadCalls = [];
  mockLocalStorage.setItem('travelApp_gdrive_connected', 'false');
  mockLocalStorage.setItem('travelApp_gdrive_approved', 'false');
  context.autoSyncActiveTripToCloud();
  await new Promise(resolve => setTimeout(resolve, 50));
  assert(uploadCalls.length === 0, 'Should not attempt upload when Google Drive is disconnected');
  console.log('✓ Test 1 Passed: Disconnected state exits early');

  // Restore connected state
  mockLocalStorage.setItem('travelApp_gdrive_connected', 'true');
  mockLocalStorage.setItem('travelApp_gdrive_approved', 'true');

  // Test Case 2: Happy Path - autoSyncActiveTripToCloud triggers debounced upload
  console.log('2. Testing happy path debounced auto-sync...');
  uploadCalls = [];
  simulatedUploadError = null;
  context.autoSyncActiveTripToCloud();
  // Ensure debounced timer hasn't fired prematurely (before delay)
  assert(uploadCalls.length === 0, 'Upload should be debounced and not execute synchronously');
  await new Promise(resolve => setTimeout(resolve, 50));
  assert(uploadCalls.length === 1, 'Upload should execute after debounce timeout');
  assert(uploadCalls[0].trip.id === 'trip_default', 'Should upload active trip document');
  assert(uploadCalls[0].isSilent === true, 'Auto-sync upload should be silent');
  console.log('✓ Test 2 Passed: Debounced auto-sync uploads active trip');

  // Test Case 3: Error Path - uploadTripToGoogleDrive throws an error
  console.log('3. Testing error handling when upload fails or throws...');
  uploadCalls = [];
  simulatedUploadError = new Error('Network timeout during background auto-sync');

  // Track unhandled rejections in Node process if any
  let unhandledRejectionCaught = false;
  const rejectionHandler = () => {
    unhandledRejectionCaught = true;
  };
  process.on('unhandledRejection', rejectionHandler);

  context.autoSyncActiveTripToCloud();
  await new Promise(resolve => setTimeout(resolve, 50));

  process.removeListener('unhandledRejection', rejectionHandler);

  assert(uploadCalls.length === 1, 'Upload function should have been called');
  assert(!unhandledRejectionCaught, 'Error in uploadTripToGoogleDrive should be handled without unhandled promise rejection');
  console.log('✓ Test 3 Passed: Error path in cloud storage auto-sync handled gracefully');

  console.log('✅ ALL CLOUD AUTO-SYNC ERROR HANDLING TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  runCloudAutoSyncErrorTests()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ TEST FAILED:', err);
      process.exit(1);
    });
}

module.exports = { runCloudAutoSyncErrorTests };
