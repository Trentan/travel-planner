const assert = require('assert');
const fs = require('fs');

function runCityAutocompleteRefactorTests() {
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

  global.window = {
    addEventListener: () => {},
    location: { search: '', hash: '', pathname: '/' }
  };
  global.document = fakeDocument;
  global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

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
}

if (require.main === module) {
  runCityAutocompleteRefactorTests();
}

module.exports = { runCityAutocompleteRefactorTests };
