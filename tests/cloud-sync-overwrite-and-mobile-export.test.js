const path = require('path');
const nodeAssert = require('assert');
const {
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');
const assert = nodeAssert;

function createMockDom() {
  const elements = {};
  function makeEl(id) {
    return {
      id,
      style: {},
      hidden: false,
      disabled: false,
      value: '',
      _innerHTML: '',
      _innerText: '',
      get innerHTML() { return this._innerHTML; },
      set innerHTML(v) { this._innerHTML = v; },
      get innerText() { return this._innerText; },
      set innerText(v) { this._innerText = v; },
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
      setAttribute() {},
      removeAttribute() {},
      appendChild() {},
      remove() {},
      closest() { return null; },
      querySelector() { return null; }
    };
  }
  return {
    getElementById(id) {
      if (!elements[id]) elements[id] = makeEl(id);
      return elements[id];
    },
    createElement() { return makeEl('dyn'); },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    body: makeEl('body'),
    head: makeEl('head'),
    elements
  };
}

async function runCloudSyncOverwriteAndMobileExportTests() {
  console.log('--- Running Cloud Sync Overwrite & Mobile Export Regression Tests ---');

  // 1. Test syncAllTripsFromGoogleDrive reloads active trip & uploadLocalOnlyTripsToDrive skips untouched boot templates
  {
    const document = createMockDom();
    const localStorageMap = new Map();
    const mockLocalStorage = {
      getItem: (k) => (localStorageMap.has(k) ? localStorageMap.get(k) : null),
      setItem: (k, v) => localStorageMap.set(k, String(v)),
      removeItem: (k) => localStorageMap.delete(k)
    };

    mockLocalStorage.setItem('travelApp_gdrive_connected', 'true');
    mockLocalStorage.setItem('travelApp_gdrive_approved', 'true');
    mockLocalStorage.setItem('travelApp_gdrive_token', 'valid_real_token_xyz');
    mockLocalStorage.setItem('travelApp_gdrive_token_expiry', String(Date.now() + 3600000));
    mockLocalStorage.setItem('travelApp_gdrive_folder_id', 'folder_abc');

    const remoteModifiedTime = '2026-11-28T10:00:00.000Z';
    const localOldTime = '2026-11-27T10:00:00.000Z';

    const localTrips = [
      {
        id: 'trip_active_1',
        title: 'Europe 2026',
        updatedAt: localOldTime,
        data: { meta: { title: 'Europe 2026' }, itinerary: [{ cityName: 'Old Local' }] }
      },
      {
        id: 'trip_default',
        title: 'Default Template',
        updatedAt: '1970-01-01T00:00:00.000Z',
        data: { meta: { title: 'Default Template' }, itinerary: [] }
      },
      {
        id: 'trip_local_only',
        title: 'Japan Autumn',
        updatedAt: '2026-11-28T09:00:00.000Z',
        data: { meta: { title: 'Japan Autumn' }, itinerary: [{ cityName: 'Tokyo' }] }
      }
    ];

    const savedToIdb = [];
    const reloadedPayloads = [];
    const toasts = [];
    const uploadedFiles = [];

    const mockFetch = async (url, options = {}) => {
      if (url.includes('files?q=') && !options.method) {
        if (url.includes('Japan_Autumn.json')) {
          return { ok: true, status: 200, json: async () => ({ files: [] }) };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            files: [
              {
                id: 'gdrive_europe_1',
                name: 'Europe_2026.json',
                modifiedTime: remoteModifiedTime,
                size: '2048'
              }
            ]
          })
        };
      }
      if (url.includes('/files/gdrive_europe_1?alt=media')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: 'trip_active_1',
            title: 'Europe 2026',
            data: { meta: { title: 'Europe 2026' }, itinerary: [{ cityName: 'New Cloud Paris' }] }
          })
        };
      }
      if (options.method === 'POST' && url.includes('uploadType=multipart')) {
        uploadedFiles.push(options.body);
        return { ok: true, status: 200, json: async () => ({ id: 'gdrive_new_japan_1' }) };
      }
      if (options.method === 'PATCH') {
        throw new Error(`Unexpected PATCH overwrite to ${url}`);
      }
      return { ok: true, status: 200, json: async () => ({}) };
    };

    let autoSyncCalledDuringReload = false;

    const context = createVmContext({
      URL,
      document,
      fetch: mockFetch,
      localStorage: mockLocalStorage,
      location: { hostname: 'localhost', origin: 'http://localhost:3000', href: 'http://localhost:3000/', protocol: 'http:' },
      addEventListener() {},
      getActiveTripId: () => 'trip_active_1',
      getAllTripsFromIndexedDB: async () => localTrips,
      saveTripToIndexedDB: async (rec) => { savedToIdb.push(rec); },
      loadImportedPayload: async (data, name) => {
        if (!context.__suppressCloudAutoSync) autoSyncCalledDuringReload = true;
        reloadedPayloads.push({ data, name });
      },
      renderAll: () => {},
      renderHeaderTripSwitcher: () => {},
      renderTripGalleryGrid: () => {},
      showToast: (msg) => { toasts.push(msg); }
    });
    context.window = context;

    runScriptInContext(loadSource(path.join('js', 'utils.js')), context, 'js/utils.js');
    runScriptInContext(loadSource(path.join('js', 'cloud-storage.js')), context, 'js/cloud-storage.js');

    await context.syncAllTripsFromGoogleDrive(false);

    assert.strictEqual(savedToIdb.length, 1, 'Expected newer remote trip to be saved to IndexedDB');
    assert.strictEqual(savedToIdb[0].id, 'trip_active_1');
    assert.strictEqual(reloadedPayloads.length, 1, 'Expected active trip to reload into memory from newer Drive file');
    assert.strictEqual(reloadedPayloads[0].data.itinerary[0].cityName, 'New Cloud Paris');
    assert.strictEqual(autoSyncCalledDuringReload, false, 'Expected __suppressCloudAutoSync=true during remote reload');
    assert.ok(toasts.some(t => t.includes('Synced "Europe 2026" from Google Drive')), 'Expected sync toast notification');

    await context.uploadLocalOnlyTripsToDrive();
    assert.strictEqual(uploadedFiles.length, 1, 'Expected only genuinely local-only trip (Japan Autumn) to upload, skipping Default Template & Europe 2026');
    assert.ok(uploadedFiles[0].includes('Japan_Autumn.json'), 'Expected Japan_Autumn.json to be uploaded');
  }

  // 2. Test mobile openTripFile() exports instead of opening import picker, and AndroidNativeExport bridge is used
  {
    const document = createMockDom();
    let importInputClicked = false;
    document.getElementById('importFile').click = () => { importInputClicked = true; };

    const nativeSaved = [];
    const localStorageMap = new Map();
    const mockLocalStorage = {
      getItem: (k) => (localStorageMap.has(k) ? localStorageMap.get(k) : null),
      setItem: (k, v) => localStorageMap.set(k, String(v)),
      removeItem: (k) => localStorageMap.delete(k)
    };

    const context = createVmContext({
      document,
      localStorage: mockLocalStorage,
      addEventListener: () => {},
      navigator: { userAgent: 'Mozilla/5.0 (Linux; Android 14)', webdriver: false },
      isSecureContext: false, // FSA not supported on mobile WebView
      AndroidNativeExport: {
        saveFile: (filename, content, mimeType) => {
          nativeSaved.push({ filename, content, mimeType });
        },
        printPage: () => {}
      },
      saveData: async () => false,
      buildExportPayload: () => ({ meta: { title: 'Mobile Trip' }, itinerary: [] }),
      getCurrentAppData: () => ({ meta: { title: 'Mobile Trip' }, itinerary: [] }),
      loadImportedPayload: async () => {},
      calculateDjb2Hash: () => 0
    });
    context.window = context;

    runScriptInContext(loadSource(path.join('js', 'file-io.js')), context, 'js/file-io.js');
    context.window.saveData = async () => false;
    context.window.buildExportPayload = () => ({ meta: { title: 'Mobile Trip' }, itinerary: [] });
    context.window.getCurrentAppData = () => ({ meta: { title: 'Mobile Trip' }, itinerary: [] });
    context.window.loadImportedPayload = async () => {};

    context.openTripFile();
    // Wait a tick for async exportJSON()
    await new Promise(resolve => setTimeout(resolve, 20));

    assert.strictEqual(importInputClicked, false, 'openTripFile() must NOT open import picker on mobile when FSA is unsupported');
    assert.strictEqual(nativeSaved.length, 1, 'Expected exportJSON() to route through AndroidNativeExport.saveFile');
    assert.strictEqual(nativeSaved[0].mimeType, 'application/json');
    assert.ok(nativeSaved[0].content.includes('Mobile Trip'), 'Expected exported JSON content');
  }

  console.log('✅ Cloud sync overwrite & mobile export regression tests passed!');
}

if (require.main === module) {
  runCloudSyncOverwriteAndMobileExportTests()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ TEST FAILED:', err);
      process.exit(1);
    });
}

module.exports = { runCloudSyncOverwriteAndMobileExportTests };
