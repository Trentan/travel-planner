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
    'mobileCloudSyncStatusPill',
    'gdriveOriginMismatchNotice'
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

function runCloudStorageInitErrorTests() {
  console.log('--- Running Cloud Storage Initialization Error Path Tests ---');

  const utilsSource = loadSource(path.join('js', 'utils.js'));
  const cloudStorageSource = loadSource(path.join('js', 'cloud-storage.js'));

  // Test Case 1: localStorage.getItem throwing an Error during module initialization
  console.log('1. Testing initialization when localStorage.getItem throws an exception...');
  {
    const document = createSimpleDom();
    const throwingLocalStorage = {
      getItem(key) {
        throw new Error('SecurityError: Access to localStorage is denied in restricted context');
      },
      setItem(key, value) {},
      removeItem(key) {}
    };

    const context = createVmContext({
      URL,
      document,
      localStorage: throwingLocalStorage,
      location: { hostname: 'localhost', origin: 'http://localhost:3000', href: 'http://localhost:3000/', protocol: 'http:' },
      addEventListener() {}
    });
    context.window = context;

    runScriptInContext(utilsSource, context, 'js/utils.js');

    let initError = null;
    try {
      runScriptInContext(cloudStorageSource, context, 'js/cloud-storage.js');
    } catch (err) {
      initError = err;
    }

    assert(initError === null, 'Module initialization should catch storage errors cleanly without crashing');
    assert(typeof context.getUserProfile === 'function', 'getUserProfile function should be exposed on window');
    assert(context.getUserProfile() === null, 'userProfile should default to null when storage throws during initialization');
    assert(context.isNativePlatform() === false, 'isNativePlatform should safely return false for default web context');
    console.log('✓ Test 1 Passed: Module handles throwing localStorage cleanly on init');
  }

  // Test Case 2: Corrupted JSON in travelApp_user_profile storage key
  console.log('2. Testing initialization when user profile JSON is corrupt...');
  {
    const document = createSimpleDom();
    const store = new Map();
    store.set('travelApp_gdrive_token', 'valid_token_xyz');
    store.set('travelApp_gdrive_token_expiry', '1700000000000');
    store.set('travelApp_user_profile', '{invalid_json_payload: ...');

    const mockLocalStorage = {
      getItem(key) {
        return store.get(key) || null;
      },
      setItem(key, val) {
        store.set(key, String(val));
      },
      removeItem(key) {
        store.delete(key);
      }
    };

    const context = createVmContext({
      URL,
      document,
      localStorage: mockLocalStorage,
      location: { hostname: 'localhost', origin: 'http://localhost:3000', href: 'http://localhost:3000/', protocol: 'http:' },
      addEventListener() {}
    });
    context.window = context;

    runScriptInContext(utilsSource, context, 'js/utils.js');

    let initError = null;
    try {
      runScriptInContext(cloudStorageSource, context, 'js/cloud-storage.js');
    } catch (err) {
      initError = err;
    }

    assert(initError === null, 'Module initialization should catch JSON parse errors cleanly');
    assert(context.getUserProfile() === null, 'userProfile should fall back to null when JSON.parse fails');
    console.log('✓ Test 2 Passed: Corrupted user profile JSON handled gracefully');
  }

  // Test Case 3: Purging fake mock tokens when not in automated test mode
  console.log('3. Testing purging fake mock tokens during initialization...');
  {
    const document = createSimpleDom();
    const store = new Map();
    store.set('travelApp_gdrive_token', 'token_fake_abc');
    store.set('travelApp_gdrive_token_expiry', '1700000000000');
    store.set('travelApp_gdrive_connected', 'true');
    store.set('travelApp_user_profile', JSON.stringify({ name: 'Fake User', email: 'account@google.com' }));

    const mockLocalStorage = {
      getItem(key) {
        return store.get(key) || null;
      },
      setItem(key, val) {
        store.set(key, String(val));
      },
      removeItem(key) {
        store.delete(key);
      }
    };

    const context = createVmContext({
      URL,
      document,
      localStorage: mockLocalStorage,
      location: { hostname: 'localhost', origin: 'http://localhost:3000', href: 'http://localhost:3000/', protocol: 'http:' },
      addEventListener() {}
    });
    context.window = context;

    runScriptInContext(utilsSource, context, 'js/utils.js');
    runScriptInContext(cloudStorageSource, context, 'js/cloud-storage.js');

    assert(store.get('travelApp_gdrive_token') === undefined, 'Fake mock token should be purged from localStorage');
    assert(store.get('travelApp_gdrive_connected') === undefined, 'Connected status should be purged from localStorage');
    assert(context.getUserProfile() === null, 'userProfile should be reset to null after purging fake token');
    console.log('✓ Test 3 Passed: Fake mock tokens purged as expected');
  }

  console.log('✅ ALL CLOUD STORAGE INITIALIZATION ERROR PATH TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runCloudStorageInitErrorTests();
  } catch (err) {
    console.error('❌ TEST FAILED:', err);
    process.exit(1);
  }
}

module.exports = { runCloudStorageInitErrorTests };
