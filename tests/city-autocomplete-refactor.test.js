const assert = require('assert');
const fs = require('fs');

function runCityAutocompleteRefactorTests() {
  const prevWindow = global.window;
  const prevDocument = global.document;
  const prevLocalStorage = global.localStorage;
  const prevNavigator = global.navigator;

  try {
    const fakeEl = {
      addEventListener: () => {},
      style: {},
      value: '',
      cloneNode: function() { return this; },
      parentNode: { replaceChild: () => {} }
    };

    const fakeDocument = {
      getElementById: (id) => fakeEl,
      addEventListener: () => {}
    };

    if (prevWindow) {
      global.window = prevWindow;
    } else {
      global.window = global;
    }
    global.window.addEventListener = global.window.addEventListener || (() => {});
    global.window.location = global.window.location || { search: '', hash: '', pathname: '/' };
    global.window.BroadcastChannel = undefined;
    global.document = fakeDocument;
    if (!global.localStorage) {
      global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
    }
    if (!global.navigator) {
      global.navigator = { webdriver: true };
    }

    const code = fs.readFileSync('js/data.js', 'utf8');
    eval(code);

    // Test extracted local candidates search
    assert.strictEqual(typeof _gatherLocalCityCandidates, 'function');
    const candidates = _gatherLocalCityCandidates('tok');
    assert(Array.isArray(candidates));
    assert(candidates.some(c => c.name.toLowerCase().includes('tokyo')));

    // Test candidate selection helper
    const elements = {
      nameInput: { value: '' },
      countrySelect: { value: '' },
      countryInput: { value: '' },
      codeDisplay: { style: {} },
      codeInfo: { textContent: '' },
      hideDropdown: () => {}
    };
    _selectCityAutocompleteCandidate({ name: 'Tokyo', countryCode: 'JP', countryName: 'Japan' }, elements);
    assert.strictEqual(elements.nameInput.value, 'Tokyo');
    assert.strictEqual(elements.countrySelect.value, 'JP');
    assert.strictEqual(elements.countryInput.value, 'Japan');

    console.log('city-autocomplete-refactor tests passed!');
  } finally {
    global.window = prevWindow;
    global.document = prevDocument;
    global.localStorage = prevLocalStorage;
    global.navigator = prevNavigator;
  }
}

if (require.main === module) {
  runCityAutocompleteRefactorTests();
}

module.exports = { runCityAutocompleteRefactorTests };
