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
  const code = fs.readFileSync(path.resolve(__dirname, '../js/cloud-storage.js'), 'utf8');
  vm.createContext(context);
  vm.runInContext(code, context);
}

async function runGoogleAuthRenewalTests() {
  console.log('--- Running Google Auth Approval & Token Renewal Test Suite ---');

  // 1. Test Persistent Approval Detection
  console.log('1. Testing persistent approval memory...');
  {
    const { domContext, mockLocalStorage } = createDOMContext();
    loadCloudStorage(domContext);

    assert.strictEqual(domContext.isGoogleDriveApproved(), false, 'Should be unapproved initially');
    assert.strictEqual(domContext.needsTokenRenewal(), false, 'Should not need renewal initially');

    mockLocalStorage.setItem('travelApp_gdrive_approved', 'true');
    assert.strictEqual(domContext.isGoogleDriveApproved(), true, 'Should detect approval from travelApp_gdrive_approved');

    mockLocalStorage.clear();
    mockLocalStorage.setItem('travelApp_gdrive_connected', 'true');
    assert.strictEqual(domContext.isGoogleDriveApproved(), true, 'Should detect approval from travelApp_gdrive_connected');
  }

  // 2. Test Token Expiry & needsTokenRenewal()
  console.log('2. Testing token expiry and renewal requirement flags...');
  {
    const { domContext, mockLocalStorage } = createDOMContext();
    mockLocalStorage.setItem('travelApp_gdrive_approved', 'true');
    mockLocalStorage.setItem('travelApp_gdrive_token', 'ya29.sample_valid_token');
    mockLocalStorage.setItem('travelApp_gdrive_token_expiry', String(Date.now() + 3600000));
    loadCloudStorage(domContext);

    assert.strictEqual(domContext.isAccessTokenValid(), true, 'Token with future expiry should be valid');
    assert.strictEqual(domContext.needsTokenRenewal(), false, 'Valid token should not need renewal');

    const expiredContext = createDOMContext();
    expiredContext.mockLocalStorage.setItem('travelApp_gdrive_approved', 'true');
    expiredContext.mockLocalStorage.setItem('travelApp_gdrive_token', 'ya29.sample_expired_token');
    expiredContext.mockLocalStorage.setItem('travelApp_gdrive_token_expiry', String(Date.now() - 5000));
    loadCloudStorage(expiredContext.domContext);

    assert.strictEqual(expiredContext.domContext.isGoogleDriveApproved(), true, 'Approval must be remembered across expiry');
    assert.strictEqual(expiredContext.domContext.isAccessTokenValid(), false, 'Expired token must report invalid');
    assert.strictEqual(expiredContext.domContext.needsTokenRenewal(), true, 'Should require token renewal when expired');
  }

  // 3. Test Native Android Silent Refresh
  console.log('3. Testing Native Android silent background token renewal...');
  {
    const { domContext, mockLocalStorage } = createDOMContext();
    mockLocalStorage.setItem('travelApp_gdrive_approved', 'true');
    mockLocalStorage.setItem('travelApp_gdrive_token', 'ya29.expired');
    mockLocalStorage.setItem('travelApp_gdrive_token_expiry', String(Date.now() - 10000));

    let refreshCalled = false;
    let signInCalled = false;

    domContext.isCapacitorNative = true;
    domContext.Capacitor = {
      isNativePlatform: () => true,
      getPlatform: () => 'android',
      Plugins: {
        GoogleAuth: {
          refresh: async () => {
            refreshCalled = true;
            return {
              accessToken: 'ya29.new_silent_native_token_999',
              expires_in: 3600,
              email: 'traveler@gmail.com',
              displayName: 'Silent Traveler'
            };
          },
          signIn: async () => {
            signInCalled = true;
            return null;
          }
        }
      }
    };

    loadCloudStorage(domContext);

    const token = await domContext.ensureValidAccessToken();
    assert.strictEqual(refreshCalled, true, 'nativeAuthPlugin.refresh() MUST be called in background');
    assert.strictEqual(signInCalled, false, 'nativeAuthPlugin.signIn() MUST NOT be called in background');
    assert.strictEqual(token, 'ya29.new_silent_native_token_999', 'Should return silently renewed token');
    assert.strictEqual(mockLocalStorage.getItem('travelApp_gdrive_token'), 'ya29.new_silent_native_token_999', 'localStorage should store new token');
    assert.strictEqual(domContext.isAccessTokenValid(), true, 'Token must now be valid');

    const profile = domContext.getUserProfile();
    assert.strictEqual(profile.email, 'traveler@gmail.com', 'User profile should be updated from refresh');
    console.log('✅ Native Android silent background token renewal verified!');
  }

  // 4. Test UI and Modal States when Token Expired vs Valid
  console.log('4. Testing UI Status Pill and Modal States...');
  {
    const { domContext, mockLocalStorage, elements } = createDOMContext();
    mockLocalStorage.setItem('travelApp_gdrive_approved', 'true');
    mockLocalStorage.setItem('travelApp_gdrive_token', 'ya29.expired');
    mockLocalStorage.setItem('travelApp_gdrive_token_expiry', String(Date.now() - 1000));
    mockLocalStorage.setItem('travelApp_user_profile', JSON.stringify({ name: 'Explorer', email: 'explorer@example.com' }));

    loadCloudStorage(domContext);
    domContext.updateCloudSyncStatusPill();
    domContext.updateCloudSyncModalState();

    const headerPill = elements.headerCloudSyncStatusPill;
    assert.strictEqual(headerPill.innerText, '⚡ Resume Sync', 'Pill text should be "⚡ Resume Sync" when renewal is needed');
    assert.ok(headerPill.className.includes('warning'), 'Pill should have warning class');

    const connectBtn = elements.gdriveConnectBtn;
    assert.strictEqual(connectBtn.style.display, 'inline-flex', 'Connect/Resume button must be VISIBLE when expired (no lockout)');
    assert.ok(connectBtn.innerHTML.includes('Resume Cloud Sync'), 'Button should say "Resume Cloud Sync"');

    const disconnectBtn = elements.gdriveDisconnectBtn;
    assert.strictEqual(disconnectBtn.style.display, 'inline-flex', 'Disconnect button should be visible');

    const profileCard = elements.gdriveProfileCard;
    assert.strictEqual(profileCard.style.display, 'flex', 'Profile card should be visible with user info');
    assert.ok(profileCard.innerHTML.includes('Approval Remembered'), 'Profile card should indicate remembered approval');
    console.log('✅ UI Status Pill and Modal states verified!');
  }

  // 5. Test Disconnect Google Drive
  console.log('5. Testing disconnectGoogleDrive() cleanup...');
  {
    const { domContext, mockLocalStorage, elements } = createDOMContext();
    mockLocalStorage.setItem('travelApp_gdrive_approved', 'true');
    mockLocalStorage.setItem('travelApp_gdrive_connected', 'true');
    mockLocalStorage.setItem('travelApp_gdrive_token', 'ya29.token');
    mockLocalStorage.setItem('travelApp_user_profile', JSON.stringify({ email: 'test@example.com' }));

    loadCloudStorage(domContext);
    domContext.disconnectGoogleDrive();

    assert.strictEqual(mockLocalStorage.getItem('travelApp_gdrive_approved'), null, 'Approval must be cleared on disconnect');
    assert.strictEqual(mockLocalStorage.getItem('travelApp_gdrive_connected'), null, 'Connected must be cleared on disconnect');
    assert.strictEqual(mockLocalStorage.getItem('travelApp_gdrive_token'), null, 'Token must be cleared on disconnect');
    assert.strictEqual(domContext.getUserProfile(), null, 'User profile must be cleared on disconnect');

    const headerPill = elements.headerCloudSyncStatusPill;
    assert.strictEqual(headerPill.innerText, '⚡ Local', 'Pill text should be "⚡ Local" after disconnect');
    assert.ok(headerPill.className.includes('disconnected'), 'Pill should have disconnected class');
    console.log('✅ disconnectGoogleDrive() cleanup verified!');
  }

  console.log('🎉 ALL GOOGLE AUTH RENEWAL & PERSISTENT APPROVAL TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  runGoogleAuthRenewalTests().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  });
}

module.exports = { runGoogleAuthRenewalTests };
