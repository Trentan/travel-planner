const path = require('path');
const fs = require('fs');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function runCloudStorageClientIdTests() {
  console.log('Running Google Drive Client ID resolution tests...');

  // Verification 1: Confirm source code no longer contains hardcoded Google Client IDs
  const sourceCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'cloud-storage.js'), 'utf8');
  assert(!sourceCode.includes('253620621116-u76e3v3e2qv6ffq9b58re4l4bbqs1e3g.apps.googleusercontent.com'), 'Hardcoded PROD Client ID must not exist in js/cloud-storage.js');
  assert(!sourceCode.includes('253620621116-cq4mtef5e2nvt0kc7pbcs4t1rdblg7q5.apps.googleusercontent.com'), 'Hardcoded LOCAL Client ID must not exist in js/cloud-storage.js');

  // Verification 2: Check resolution behavior under various environments
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

  function setupContext(envVars = {}, windowVars = {}) {
    localStorageMap.clear();
    const context = createVmContext({
      URL,
      document: {
        getElementById() { return null; }
      },
      localStorage: mockLocalStorage,
      location: { hostname: 'trentan.github.io', origin: 'https://trentan.github.io', href: 'https://trentan.github.io/', protocol: 'https:' },
      addEventListener() {},
      process: { env: envVars },
      ...windowVars
    });
    context.window = context;

    const utilsSource = loadSource(path.join('js', 'utils.js'));
    runScriptInContext(utilsSource, context, 'js/utils.js');

    const cloudStorageSource = loadSource(path.join('js', 'cloud-storage.js'));
    runScriptInContext(cloudStorageSource, context, 'js/cloud-storage.js');

    return context;
  }

  // Test Case A: Priority 1 - Custom Client ID in localStorage overrides everything
  {
    const ctx = setupContext({ GOOGLE_CLIENT_ID_PROD: 'env-prod-id' }, { GOOGLE_CLIENT_ID_PROD: 'win-prod-id' });
    mockLocalStorage.setItem('travelApp_gdrive_client_id', 'custom-local-id.apps.googleusercontent.com');
    assert(ctx.getGoogleClientId() === 'custom-local-id.apps.googleusercontent.com', 'getGoogleClientId() should prefer custom localStorage entry');
  }

  // Test Case B: Priority 2 - Window/global injection or process.env configuration
  {
    const ctx = setupContext({ GOOGLE_CLIENT_ID_PROD: 'env-prod-id.apps.googleusercontent.com', GOOGLE_CLIENT_ID_LOCAL: 'env-local-id.apps.googleusercontent.com' });
    assert(ctx.getGoogleClientId() === 'env-prod-id.apps.googleusercontent.com', 'getGoogleClientId() should resolve PROD client ID from environment');

    ctx.location.hostname = 'localhost';
    assert(ctx.getGoogleClientId() === 'env-local-id.apps.googleusercontent.com', 'getGoogleClientId() should resolve LOCAL client ID on localhost from environment');
  }

  // Test Case C: Priority 3 - Safe fallback when no environment variables are set
  {
    const ctx = setupContext({}, {});
    assert(ctx.getGoogleClientId() === '', 'getGoogleClientId() should safely default to empty string when no client ID is configured');
  }

  console.log('✅ ALL GOOGLE DRIVE CLIENT ID RESOLUTION TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runCloudStorageClientIdTests();
  } catch (err) {
    console.error('❌ CLIENT ID TEST FAILED:', err.message);
    process.exit(1);
  }
}

module.exports = { runCloudStorageClientIdTests };
