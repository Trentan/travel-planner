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
      classList: { add() {}, remove() {} },
      _innerHTML: '',
      get innerHTML() { return this._innerHTML; },
      set innerHTML(val) { this._innerHTML = val; },
      _innerText: '',
      get innerText() { return this._innerText; },
      set innerText(val) { this._innerText = val; }
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

function runFormatHumanFilenameTests() {
  console.log('Running formatHumanFilename unit tests...');

  const document = createSimpleDom();
  const localStorageMap = new Map();

  const mockLocalStorage = {
    getItem(key) { return localStorageMap.get(key) || null; },
    setItem(key, value) { localStorageMap.set(key, String(value)); },
    removeItem(key) { localStorageMap.delete(key); }
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
  assert(typeof formatHumanFilename === 'function', 'formatHumanFilename should be exported on window');

  // 1. Direct title property on tripRecord
  assert(
    formatHumanFilename({ title: 'Europe Summer 2026' }) === 'Europe_Summer_2026.json',
    'Should sanitize direct tripRecord.title'
  );

  // 2. Nested data.title property
  assert(
    formatHumanFilename({ data: { title: 'Japan Trip 2025' } }) === 'Japan_Trip_2025.json',
    'Should sanitize nested tripRecord.data.title'
  );

  // 3. Deeply nested data.meta.title property
  assert(
    formatHumanFilename({ data: { meta: { title: 'Road Trip USA' } } }) === 'Road_Trip_USA.json',
    'Should sanitize deeply nested tripRecord.data.meta.title'
  );

  // 4. Precedence order: tripRecord.title > tripRecord.data.title > tripRecord.data.meta.title
  assert(
    formatHumanFilename({
      title: 'Primary Title',
      data: { title: 'Secondary Title', meta: { title: 'Tertiary Title' } }
    }) === 'Primary_Title.json',
    'tripRecord.title should take precedence over data.title and data.meta.title'
  );

  assert(
    formatHumanFilename({
      data: { title: 'Secondary Title', meta: { title: 'Tertiary Title' } }
    }) === 'Secondary_Title.json',
    'tripRecord.data.title should take precedence over data.meta.title when title is missing'
  );

  // 5. Fallback default title when no title is provided
  assert(
    formatHumanFilename({}) === 'My_Trip.json',
    'Should fallback to My_Trip.json when object is empty'
  );

  assert(
    formatHumanFilename({ title: '' }) === 'My_Trip.json',
    'Should fallback to My_Trip.json when title is empty string'
  );

  // 6. Special character sanitization
  assert(
    formatHumanFilename({ title: 'Summer / Vacation: 2026! (Draft) & <Notes>' }) === 'Summer_Vacation_2026_Draft_Notes.json',
    'Should remove special characters / : ! ( ) & < >'
  );

  // 7. Whitespace trimming and collapsing
  assert(
    formatHumanFilename({ title: '   Tokyo    and   Kyoto   ' }) === 'Tokyo_and_Kyoto.json',
    'Should trim leading/trailing spaces and collapse multiple spaces into a single underscore'
  );

  // 8. Hyphens and underscores preservation
  assert(
    formatHumanFilename({ title: 'My-Trip_2026-v1_final' }) === 'My-Trip_2026-v1_final.json',
    'Should preserve hyphens and underscores in titles'
  );

  // 9. Edge case: purely special characters result in cleanName being empty, falling back to 'Trip.json'
  assert(
    formatHumanFilename({ title: '!!!' }) === 'Trip.json',
    'Should fallback to Trip.json when title consists only of stripped special characters'
  );

  assert(
    formatHumanFilename({ title: ' @#$%^&*() ' }) === 'Trip.json',
    'Should fallback to Trip.json when title consists only of special characters and spaces'
  );

  console.log('✅ ALL formatHumanFilename UNIT TESTS PASSED CLEANLY!');
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
