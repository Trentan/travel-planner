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
    elements
  };
}

function runCloudStorageXssTests() {
  console.log('Running Google Drive Profile XSS prevention tests...');

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

  const context = createVmContext({
    URL,
    document,
    localStorage: mockLocalStorage,
    location: { hostname: 'localhost', origin: 'http://localhost:3000', href: 'http://localhost:3000/', protocol: 'http:' },
    addEventListener() {},
    getAllTripsFromIndexedDB: async () => [],
    saveTripToIndexedDB: async () => {},
    renderHeaderTripSwitcher: () => {},
    renderTripGalleryGrid: () => {},
    showToast: () => {}
  });
  context.window = context;

  const cloudStorageSource = loadSource(path.join('js', 'cloud-storage.js'));
  runScriptInContext(cloudStorageSource, context, 'js/cloud-storage.js');

  // Test Case 1: Active profile with malicious img onerror in picture URL
  context.__mockGoogleDriveAPI = true;
  mockLocalStorage.setItem('travelApp_gdrive_connected', 'true');
  context.setUserProfile({
    name: '<script>alert("xss-name")</script>',
    email: 'user@example.com"><script>alert("xss-email")</script>',
    picture: 'https://example.com/avatar.png" onerror="alert(1)'
  });

  context.updateCloudSyncModalState();

  const profileCard = document.getElementById('gdriveProfileCard');
  const cardHtml = profileCard.innerHTML;

  assert(!cardHtml.includes('<script>'), 'Profile card HTML must not contain raw <script> tags');
  assert(!cardHtml.includes('onerror="alert(1)"'), 'Profile picture attribute must escape double quotes to prevent breaking out');
  assert(cardHtml.includes('&quot; onerror=&quot;alert(1)'), 'Profile picture URL quotes must be HTML entity escaped');
  assert(cardHtml.includes('&lt;script&gt;alert(&quot;xss-name&quot;)&lt;/script&gt;'), 'Profile name must be HTML entity escaped');
  assert(cardHtml.includes('user@example.com&quot;&gt;&lt;script&gt;'), 'Profile email must be HTML entity escaped');

  // Test Case 2: Malicious javascript: URI in profile picture
  context.setUserProfile({
    name: 'Safe User',
    email: 'safe@example.com',
    picture: 'javascript:alert("xss-uri")'
  });

  context.updateCloudSyncModalState();
  const cardHtml2 = profileCard.innerHTML;

  assert(!cardHtml2.includes('javascript:alert'), 'Profile card HTML must reject javascript: URIs for img src');
  assert(cardHtml2.includes('S'), 'Profile card should fall back to initial character when picture URI is unsafe');

  // Test Case 3: Malicious file name and ID in cloud files listing
  const fileListContainer = document.getElementById('gdriveFileListContainer');
  const mockCloudFiles = [
    {
      id: "file'123\";alert('xss-id');",
      name: "Trip'<script>alert('xss-file')</script>.json",
      size: 1024,
      modifiedTime: new Date().toISOString()
    }
  ];

  context.updateCloudSyncModalState(mockCloudFiles);

  const fileListHtml = fileListContainer.innerHTML;
  assert(!fileListHtml.includes("<script>alert('xss-file')</script>"), 'Cloud file list must escape HTML tags in file names');
  assert(!fileListHtml.includes("onclick=\"window.loadTripFromGoogleDrive('file'"), 'Cloud file list onclick must not use raw single-quoted string interpolation');
  assert(fileListHtml.includes('onclick="window.loadTripFromGoogleDrive(&quot;'), 'Cloud file list onclick arguments must be safely encoded with escapeJsParam');

  console.log('✅ ALL GOOGLE DRIVE PROFILE XSS TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runCloudStorageXssTests();
  } catch (err) {
    console.error('❌ XSS TEST FAILED:', err.message);
    process.exit(1);
  }
}

module.exports = { runCloudStorageXssTests };
