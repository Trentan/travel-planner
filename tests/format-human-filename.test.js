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

function runFormatHumanFilenameTests() {
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
    addEventListener() {}
  });
  context.window = context;

  const cloudStorageSource = loadSource(path.join('js', 'cloud-storage.js'));
  runScriptInContext(cloudStorageSource, context, 'js/cloud-storage.js');

  const formatHumanFilename = context.window.formatHumanFilename;
  assert(typeof formatHumanFilename === 'function', 'window.formatHumanFilename should be a function');

  // Test Case 1: Standard top-level title property
  const res1 = formatHumanFilename({ title: 'Europe Summer 2026' });
  assert(res1 === 'Europe_Summer_2026.json', `Expected 'Europe_Summer_2026.json', got '${res1}'`);

  // Test Case 2: Fallback to tripRecord.data.title when top-level title is missing
  const res2 = formatHumanFilename({ data: { title: 'Japan Trip 2025' } });
  assert(res2 === 'Japan_Trip_2025.json', `Expected 'Japan_Trip_2025.json', got '${res2}'`);

  // Test Case 3: Fallback to tripRecord.data.meta.title when top-level and data.title are missing
  const res3 = formatHumanFilename({ data: { meta: { title: 'Alpine Adventure' } } });
  assert(res3 === 'Alpine_Adventure.json', `Expected 'Alpine_Adventure.json', got '${res3}'`);

  // Test Case 4: Top-level title priority over nested titles
  const res4 = formatHumanFilename({
    title: 'Top Title',
    data: { title: 'Data Title', meta: { title: 'Meta Title' } }
  });
  assert(res4 === 'Top_Title.json', `Expected 'Top_Title.json', got '${res4}'`);

  // Test Case 5: Default fallback 'My Trip' when record has no title properties
  const res5 = formatHumanFilename({});
  assert(res5 === 'My_Trip.json', `Expected 'My_Trip.json', got '${res5}'`);

  // Test Case 6: Special characters sanitization
  const res6 = formatHumanFilename({ title: 'Paris & London @ 2026! #1 (Trip)' });
  assert(res6 === 'Paris_London_2026_1_Trip.json', `Expected 'Paris_London_2026_1_Trip.json', got '${res6}'`);

  // Test Case 7: Preservation of alphanumeric, underscores, hyphens
  const res7 = formatHumanFilename({ title: 'My_Trip-2026_v1.0' });
  assert(res7 === 'My_Trip-2026_v10.json', `Expected 'My_Trip-2026_v10.json', got '${res7}'`);

  // Test Case 8: Multiple whitespaces, leading/trailing spaces
  const res8 = formatHumanFilename({ title: '   Tokyo   and   Kyoto   ' });
  assert(res8 === 'Tokyo_and_Kyoto.json', `Expected 'Tokyo_and_Kyoto.json', got '${res8}'`);

  // Test Case 9: Special characters resulting in empty cleanName falls back to 'Trip.json'
  const res9 = formatHumanFilename({ title: '!!! @@@ $$$ %%%' });
  assert(res9 === 'Trip.json', `Expected 'Trip.json', got '${res9}'`);

  // Test Case 10: Empty string title uses default fallback 'My_Trip.json'
  const res10 = formatHumanFilename({ title: '' });
  assert(res10 === 'My_Trip.json', `Expected 'My_Trip.json', got '${res10}'`);

  console.log('✅ ALL formatHumanFilename TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runFormatHumanFilenameTests();
  } catch (err) {
    console.error('❌ formatHumanFilename TEST FAILED:', err.message);
    process.exit(1);
  }
}

module.exports = { runFormatHumanFilenameTests };
