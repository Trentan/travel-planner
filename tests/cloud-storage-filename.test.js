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

  return {
    getElementById(id) {
      if (!elements[id]) {
        elements[id] = makeElement(id);
      }
      return elements[id];
    }
  };
}

function runCloudStorageFilenameTests() {
  console.log('Running formatHumanFilename unit tests...');

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

  const formatHumanFilename = context.formatHumanFilename;
  assert(typeof formatHumanFilename === 'function', 'formatHumanFilename must be exported on window');

  // Test 1: Title field precedence (title > data.title > data.meta.title)
  assert(
    formatHumanFilename({ title: 'Top Title', data: { title: 'Data Title', meta: { title: 'Meta Title' } } }) === 'Top_Title.json',
    'Should prioritize top-level title'
  );

  assert(
    formatHumanFilename({ data: { title: 'Data Title', meta: { title: 'Meta Title' } } }) === 'Data_Title.json',
    'Should fallback to data.title when top-level title is missing'
  );

  assert(
    formatHumanFilename({ data: { meta: { title: 'Meta Title' } } }) === 'Meta_Title.json',
    'Should fallback to data.meta.title when top-level title and data.title are missing'
  );

  // Test 2: Fallback when no title is provided
  assert(
    formatHumanFilename({}) === 'My_Trip.json',
    'Should default to "My Trip" (sanitized to "My_Trip.json") when no title is present'
  );

  assert(
    formatHumanFilename({ title: '' }) === 'My_Trip.json',
    'Should default to "My Trip" when title is empty string'
  );

  // Test 3: Title with special characters sanitization
  assert(
    formatHumanFilename({ title: 'Europe: Summer 2026! (v1.0)' }) === 'Europe_Summer_2026_v10.json',
    'Should strip non-alphanumeric/non-dash/non-underscore characters'
  );

  // Test 4: Preserves hyphens and underscores
  assert(
    formatHumanFilename({ title: 'my-trip_2026' }) === 'my-trip_2026.json',
    'Should preserve hyphens and underscores'
  );

  // Test 5: Whitespace handling and multiple space collapsing
  assert(
    formatHumanFilename({ title: '   Tokyo   &   Kyoto   ' }) === 'Tokyo_Kyoto.json',
    'Should trim whitespace, remove special chars, and collapse multiple spaces to single underscore'
  );

  // Test 6: Fallback when sanitization removes all characters
  assert(
    formatHumanFilename({ title: '!@#$%^&*()' }) === 'Trip.json',
    'Should fallback to "Trip.json" if cleanName is empty after sanitization'
  );

  console.log('✅ ALL formatHumanFilename TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runCloudStorageFilenameTests();
  } catch (err) {
    console.error('❌ formatHumanFilename TEST FAILED:', err.message);
    process.exit(1);
  }
}

module.exports = { runCloudStorageFilenameTests };
