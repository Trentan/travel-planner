const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function createMockLocalStorage() {
  const store = {};
  return {
    getItem(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem(k, v) { store[k] = String(v); },
    removeItem(k) { delete store[k]; },
    clear() { Object.keys(store).forEach(k => delete store[k]); },
    _dump() { return { ...store }; }
  };
}

function createDOMContext() {
  const mockLocalStorage = createMockLocalStorage();
  const elements = {};

  function getOrCreateElement(id) {
    if (!elements[id]) {
      elements[id] = {
        id,
        style: {},
        classList: {
          classes: new Set(),
          add(c) { this.classes.add(c); },
          remove(c) { this.classes.delete(c); },
          contains(c) { return this.classes.has(c); }
        },
        innerText: '',
        innerHTML: '',
        title: '',
        disabled: false,
        hidden: false
      };
    }
    return elements[id];
  }

  ['headerCloudSyncStatusPill', 'cloudSyncStatusPill', 'mobileCloudSyncStatusPill',
   'cloudSyncModal', 'gdriveConnectBtn', 'gdriveDisconnectBtn',
   'gdriveModalStatusText', 'gdriveProfileCard', 'gdriveFolderLinkContainer',
   'gdriveFileListContainer', 'gdriveActiveClientIdLabel'].forEach(id => getOrCreateElement(id));

  const domContext = {
    console,
    Date,
    parseInt,
    JSON,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    localStorage: mockLocalStorage,
    window: null,
    document: {
      getElementById(id) {
        return getOrCreateElement(id);
      },
      createElement(tag) {
        return {
          tagName: tag,
          style: {},
          classList: { add() {}, remove() {} },
          addEventListener() {},
          click() {}
        };
      },
      head: { appendChild() {} }
    },
    location: {
      hostname: 'localhost',
      origin: 'http://localhost:3000',
      pathname: '/',
      search: '',
      hash: ''
    },
    addEventListener() {}
  };

  domContext.window = domContext;
  return { domContext, mockLocalStorage, elements };
}

function loadCloudStorage(context) {
  const utilsCode = fs.readFileSync(path.resolve(__dirname, '../js/utils.js'), 'utf8');
  const code = fs.readFileSync(path.resolve(__dirname, '../js/cloud-storage.js'), 'utf8');
  vm.createContext(context);
  vm.runInContext(utilsCode, context);
  vm.runInContext(code, context);
}

function runCloudStorageClientIdTests() {
  console.log('--- Running Google OAuth Client ID Security & Dynamic Resolution Tests ---');

  // 1. Verify no hardcoded Client IDs exist in source code
  console.log('1. Verifying absence of hardcoded Client IDs in js/cloud-storage.js...');
  const cloudStorageSource = fs.readFileSync(path.resolve(__dirname, '../js/cloud-storage.js'), 'utf8');
  assert.strictEqual(cloudStorageSource.includes('253620621116-u76e3v3e2qv6ffq9b58re4l4bbqs1e3g'), false, 'PROD_CLIENT_ID must not be hardcoded in js/cloud-storage.js');
  assert.strictEqual(cloudStorageSource.includes('253620621116-cq4mtef5e2nvt0kc7pbcs4t1rdblg7q5'), false, 'LOCAL_CLIENT_ID must not be hardcoded in js/cloud-storage.js');
  console.log('✅ Source code contains no hardcoded Google Client IDs!');

  // 2. Verify localStorage custom override
  console.log('2. Testing custom Client ID override via localStorage...');
  {
    const { domContext, mockLocalStorage } = createDOMContext();
    mockLocalStorage.setItem('travelApp_gdrive_client_id', 'custom-client-id-123.apps.googleusercontent.com');
    loadCloudStorage(domContext);

    assert.strictEqual(domContext.getGoogleClientId(), 'custom-client-id-123.apps.googleusercontent.com', 'Should return custom client ID from localStorage');
  }

  // 3. Verify window.GOOGLE_CLIENT_ID resolution
  console.log('3. Testing dynamic resolution from window.GOOGLE_CLIENT_ID...');
  {
    const { domContext } = createDOMContext();
    domContext.GOOGLE_CLIENT_ID = 'window-client-id-456.apps.googleusercontent.com';
    loadCloudStorage(domContext);

    assert.strictEqual(domContext.getGoogleClientId(), 'window-client-id-456.apps.googleusercontent.com', 'Should resolve client ID from window.GOOGLE_CLIENT_ID');
  }

  // 4. Verify window.APP_CONFIG resolution
  console.log('4. Testing dynamic resolution from window.APP_CONFIG...');
  {
    const { domContext } = createDOMContext();
    domContext.APP_CONFIG = { GOOGLE_CLIENT_ID: 'app-config-client-id-789.apps.googleusercontent.com' };
    loadCloudStorage(domContext);

    assert.strictEqual(domContext.getGoogleClientId(), 'app-config-client-id-789.apps.googleusercontent.com', 'Should resolve client ID from window.APP_CONFIG');
  }

  // 5. Verify process.env.GOOGLE_CLIENT_ID resolution
  console.log('5. Testing dynamic resolution from process.env...');
  {
    const { domContext } = createDOMContext();
    domContext.process = { env: { GOOGLE_CLIENT_ID: 'process-env-client-id-999.apps.googleusercontent.com' } };
    loadCloudStorage(domContext);

    assert.strictEqual(domContext.getGoogleClientId(), 'process-env-client-id-999.apps.googleusercontent.com', 'Should resolve client ID from process.env');
  }

  // 6. Verify setGoogleClientId helper
  console.log('6. Testing setGoogleClientId helper function...');
  {
    const { domContext, mockLocalStorage } = createDOMContext();
    loadCloudStorage(domContext);

    domContext.setGoogleClientId('  new-saved-id.apps.googleusercontent.com  ');
    assert.strictEqual(mockLocalStorage.getItem('travelApp_gdrive_client_id'), 'new-saved-id.apps.googleusercontent.com');
    assert.strictEqual(domContext.getGoogleClientId(), 'new-saved-id.apps.googleusercontent.com');

    domContext.setGoogleClientId('');
    assert.strictEqual(mockLocalStorage.getItem('travelApp_gdrive_client_id'), null);
  }

  console.log('🎉 ALL GOOGLE OAUTH CLIENT ID SECURITY TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runCloudStorageClientIdTests();
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

module.exports = { runCloudStorageClientIdTests };
