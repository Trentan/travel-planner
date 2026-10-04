const fs = require('fs');
const path = require('path');
const { assert } = require('./lib/test-helpers');

console.log('Running Issue #430 & #429 Test Suite (City names, flags, & route codes)...');

const utilsCode = fs.readFileSync(path.join(__dirname, '../js/utils.js'), 'utf8');
const timezoneCode = fs.readFileSync(path.join(__dirname, '../js/timezone.js'), 'utf8');
const dataCode = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
const transportCode = fs.readFileSync(path.join(__dirname, '../js/transport.js'), 'utf8');

const elements = new Map();
const getOrCreateMockEl = (id) => {
  if (!elements.has(id)) {
    const el = {
      id,
      value: '',
      innerText: '',
      textContent: '',
      innerHTML: '',
      style: {},
      classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => false },
      querySelectorAll: () => [],
      querySelector: () => null,
      addEventListener: () => {},
      appendChild: () => {},
      setAttribute: () => {},
      dataset: {},
      cloneNode: function() { return { ...this, addEventListener: () => {} }; },
      parentNode: { replaceChild: () => {} }
    };
    elements.set(id, el);
  }
  return elements.get(id);
};

const documentMock = {
  getElementById: (id) => getOrCreateMockEl(id),
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: (tag) => {
    const el = {
      tagName: tag,
      value: '',
      innerText: '',
      textContent: '',
      style: {},
      classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => false },
      innerHTML: '',
      querySelectorAll: () => [],
      querySelector: () => null,
      addEventListener: () => {},
      appendChild: () => {},
      setAttribute: () => {},
      dataset: {},
      cloneNode: function() { return { ...el, addEventListener: () => {} }; },
      parentNode: { replaceChild: () => {} }
    };
    return el;
  },
  body: { addEventListener: () => {}, appendChild: () => {} },
  addEventListener: () => {}
};

const windowMock = {
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  indexedDB: null,
  document: documentMock,
  addEventListener: () => {},
  confirm: () => true,
  alert: () => {},
  journeys: [],
  stays: [],
  appData: [],
  citiesData: []
};

const combinedCode = `
  const document = window.document;
  const confirm = window.confirm;
  const alert = window.alert;
  var isEditMode = false;
  window.isEditMode = false;
  ${utilsCode}
  ${timezoneCode}
  ${dataCode}
  ${transportCode}
  return {
    ALL_CITIES,
    CITY_DATABASE,
    EXTENDED_CITY_DATABASE,
    ALL_CITIES_BY_NAME_MAP,
    ALL_CITIES_BY_CODE_MAP,
    CITY_ALIASES,
    COUNTRY_FLAGS,
    CITY_TO_CODE,
    COUNTRY_TO_CODE,
    getCityFlag,
    getCityFlagHTML,
    getCountryFlag,
    getCountryFlagEmoji,
    getCityIataCode,
    getCityIcaoCode,
    getLocationCodeText,
    getLocationCodeNameText,
    buildRouteCodeChain,
    citiesData
  };
`;

const evalFn = new Function('window', 'localStorage', combinedCode);
const scope = evalFn(windowMock, windowMock.localStorage);

// ==========================================
// 1. Issue #430: Denpasar City Name in ALL_CITIES & Aliases
// ==========================================
console.log('1. Testing Denpasar entries in ALL_CITIES & CITY_ALIASES...');
const dpsInAll = scope.ALL_CITIES.find(c => c && c.code === 'DPS');
assert(dpsInAll, 'DPS entry must exist in ALL_CITIES');
assert(dpsInAll.name === 'Denpasar', `DPS city name must be "Denpasar", got "${dpsInAll.name}"`);
assert(dpsInAll.icaoCode === 'WADD', `DPS icaoCode must be "WADD", got "${dpsInAll.icaoCode}"`);
assert(dpsInAll.countryCode === 'ID', `DPS countryCode must be "ID", got "${dpsInAll.countryCode}"`);

assert(scope.CITY_ALIASES['denpasar'] === 'Denpasar', 'CITY_ALIASES["denpasar"] must map to "Denpasar"');
assert(scope.CITY_ALIASES['denpasar bali'] === 'Denpasar', 'CITY_ALIASES["denpasar bali"] must map to "Denpasar"');
assert(scope.CITY_ALIASES['dps'] === 'Denpasar', 'CITY_ALIASES["dps"] must map to "Denpasar"');
assert(scope.CITY_ALIASES['bali'] === 'Denpasar', 'CITY_ALIASES["bali"] must map to "Denpasar"');

// ==========================================
// 2. Issue #430: Flag mappings in COUNTRY_FLAGS & CITY_TO_CODE
// ==========================================
console.log('2. Testing flag tables in COUNTRY_FLAGS & CITY_TO_CODE...');
assert(scope.COUNTRY_FLAGS['Indonesia'] === '🇮🇩', 'COUNTRY_FLAGS["Indonesia"] must be 🇮🇩');
assert(scope.COUNTRY_FLAGS['Denpasar'] === '🇮🇩', 'COUNTRY_FLAGS["Denpasar"] must be 🇮🇩');
assert(scope.COUNTRY_FLAGS['Denpasar Bali'] === '🇮🇩', 'COUNTRY_FLAGS["Denpasar Bali"] must be 🇮🇩');

assert(scope.CITY_TO_CODE['indonesia'] === 'id', 'CITY_TO_CODE["indonesia"] must be "id"');
assert(scope.CITY_TO_CODE['denpasar'] === 'id', 'CITY_TO_CODE["denpasar"] must be "id"');
assert(scope.CITY_TO_CODE['denpasarbali'] === 'id', 'CITY_TO_CODE["denpasarbali"] must be "id"');

// ==========================================
// 3. Issue #430: getCountryFlag & dynamic emoji fallback
// ==========================================
console.log('3. Testing getCountryFlag & getCountryFlagEmoji dynamic fallback...');
assert(scope.getCountryFlag('ID') === '🇮🇩', `Expected 🇮🇩 for ID, got ${scope.getCountryFlag('ID')}`);
assert(scope.getCountryFlag('AU') === '🇦🇺', `Expected 🇦🇺 for AU, got ${scope.getCountryFlag('AU')}`);
// Test an ISO code not explicitly in COUNTRY_DATA table (e.g. IS for Iceland)
assert(scope.getCountryFlag('IS') === '🇮🇸', `Expected 🇮🇸 for IS via dynamic fallback, got ${scope.getCountryFlag('IS')}`);

// ==========================================
// 4. Issue #430: getCityFlag resolution hierarchy
// ==========================================
console.log('4. Testing getCityFlag resolution hierarchy...');
// Direct table match
assert(scope.getCityFlag('Denpasar') === '🇮🇩', `Expected 🇮🇩 for Denpasar, got ${scope.getCityFlag('Denpasar')}`);
assert(scope.getCityFlag('Denpasar Bali') === '🇮🇩', `Expected 🇮🇩 for Denpasar Bali, got ${scope.getCityFlag('Denpasar Bali')}`);

// Lookup via ALL_CITIES / database match
assert(scope.getCityFlag('Taipei') === '🇹🇼', `Expected 🇹🇼 for Taipei, got ${scope.getCityFlag('Taipei')}`);
assert(scope.getCityFlag('Vienna') === '🇦🇹', `Expected 🇦🇹 for Vienna, got ${scope.getCityFlag('Vienna')}`);

// City in citiesData with countryCode only
scope.citiesData.push({ id: 'city-test-1', name: 'TestCityID', countryCode: 'ID' });
assert(scope.getCityFlag('TestCityID') === '🇮🇩', `Expected 🇮🇩 for city with countryCode ID, got ${scope.getCityFlag('TestCityID')}`);

// City in citiesData with country name only
scope.citiesData.push({ id: 'city-test-2', name: 'TestCityName', country: 'Indonesia' });
assert(scope.getCityFlag('TestCityName') === '🇮🇩', `Expected 🇮🇩 for city with country Indonesia, got ${scope.getCityFlag('TestCityName')}`);

// Fallback for unknown city
assert(scope.getCityFlag('UnknownCityNonexistent') === '📍', 'Unknown city should fallback to 📍');

// ==========================================
// 5. Issue #429: getLocationCodeText 3-char IATA code resolution
// ==========================================
console.log('5. Testing getLocationCodeText IATA resolution...');

// Explicit parentheses code
assert(scope.getLocationCodeText('Brisbane (BNE)') === 'BNE', 'Parentheses code Brisbane (BNE) -> BNE');
assert(scope.getLocationCodeText('(BNE)') === 'BNE', 'Parentheses code (BNE) -> BNE');
assert(scope.getLocationCodeText('Denpasar (DPS / WADD)') === 'DPS', 'Parentheses combo Denpasar (DPS / WADD) -> DPS');
assert(scope.getLocationCodeText('Home (Brisbane - BNE)') === 'BNE', 'Parentheses Home (Brisbane - BNE) -> BNE');

// Direct 3-letter IATA code
assert(scope.getLocationCodeText('BNE') === 'BNE', 'Direct code BNE -> BNE');
assert(scope.getLocationCodeText('VIE') === 'VIE', 'Direct code VIE -> VIE');
assert(scope.getLocationCodeText('DPS') === 'DPS', 'Direct code DPS -> DPS');
assert(scope.getLocationCodeText('TPE') === 'TPE', 'Direct code TPE -> TPE');

// Global city name matching (previously failed on Taipei because only CITY_DATABASE was checked)
assert(scope.getLocationCodeText('Taipei') === 'TPE', `Expected TPE for Taipei, got ${scope.getLocationCodeText('Taipei')}`);
assert(scope.getLocationCodeText('Vienna') === 'VIE', `Expected VIE for Vienna, got ${scope.getLocationCodeText('Vienna')}`);
assert(scope.getLocationCodeText('Brisbane') === 'BNE', `Expected BNE for Brisbane, got ${scope.getLocationCodeText('Brisbane')}`);
assert(scope.getLocationCodeText('Denpasar') === 'DPS', `Expected DPS for Denpasar, got ${scope.getLocationCodeText('Denpasar')}`);
assert(scope.getLocationCodeText('Denpasar Bali') === 'DPS', `Expected DPS for Denpasar Bali, got ${scope.getLocationCodeText('Denpasar Bali')}`);
assert(scope.getLocationCodeText('Bali') === 'DPS', `Expected DPS for Bali, got ${scope.getLocationCodeText('Bali')}`);

// Trip city in citiesData
scope.citiesData.push({ id: 'city-trip-1', name: 'MyCustomTripCity', code: 'MCC' });
assert(scope.getLocationCodeText('MyCustomTripCity') === 'MCC', 'Trip city code MCC resolved');

// Fallback for uncatalogued city
assert(scope.getLocationCodeText('Unknownland') === 'UNK', `Fallback for Unknownland -> UNK, got ${scope.getLocationCodeText('Unknownland')}`);
assert(scope.getLocationCodeText('') === '---', 'Empty location returns ---');
assert(scope.getLocationCodeText(null) === '---', 'Null location returns ---');

// ==========================================
// 6. Issue #429: buildRouteCodeChain 3-char IATA ports
// ==========================================
console.log('6. Testing buildRouteCodeChain...');
const segments1 = [
  { fromLocation: 'Brisbane (BNE)', toLocation: 'Taipei' },
  { fromLocation: 'Taipei', toLocation: 'Vienna' }
];
const chain1 = scope.buildRouteCodeChain(segments1);
assert(chain1 === 'BNE → TPE → VIE', `Expected "BNE → TPE → VIE", got "${chain1}"`);

const segments2 = [
  { fromLocation: 'Denpasar', toLocation: 'Brisbane' }
];
const chain2 = scope.buildRouteCodeChain(segments2);
assert(chain2 === 'DPS → BNE', `Expected "DPS → BNE", got "${chain2}"`);

console.log('✅ ALL ISSUE #430 & #429 TESTS PASSED CLEANLY!');
