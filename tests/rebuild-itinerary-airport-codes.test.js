const fs = require('fs');
const path = require('path');
const { assert } = require('./lib/test-helpers');

async function runRebuildAndAirportCodesTests() {
  console.log('Running rebuild itinerary and IATA/ICAO airport codes test suite...');

  const utilsCode = fs.readFileSync(path.join(__dirname, '../js/utils.js'), 'utf8');
  const timezoneCode = fs.readFileSync(path.join(__dirname, '../js/timezone.js'), 'utf8');
  const dataCode = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
  const crudCode = fs.readFileSync(path.join(__dirname, '../js/crud.js'), 'utf8');
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
        classList: { add: () => {}, remove: () => {}, contains: () => false },
        querySelectorAll: () => [],
        querySelector: () => null,
        addEventListener: () => {},
        appendChild: () => {},
        setAttribute: () => {},
        dataset: {},
        cloneNode: function() { return { ...el, addEventListener: () => {} }; },
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
        classList: { add: () => {}, remove: () => {}, contains: () => false },
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
    body: {
      addEventListener: () => {},
      appendChild: () => {},
      insertBefore: () => {}
    },
    addEventListener: () => {}
  };

  const windowMock = {
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    indexedDB: null,
    document: documentMock,
    addEventListener: () => {},
    journeys: [],
    stays: [],
    appData: [],
    citiesData: []
  };

  const combinedCode = `
    const document = window.document;
    var isEditMode = false;
    window.isEditMode = false;
    ${utilsCode}
    ${timezoneCode}
    ${dataCode}
    ${crudCode}
    ${transportCode}
    return {
      getCityIataCode,
      getCityIcaoCode,
      getCityAirportCodesDisplay,
      rebuildItineraryAndDataMappings,
      setHomeCity,
      getHomeLocation,
      _populateAddLegCityDropdowns,
      _populateJourneyCityDropdowns,
      citiesData,
      appData,
      titleData: typeof titleData !== 'undefined' ? titleData : {}
    };
  `;

  const evalFn = new Function('window', 'localStorage', combinedCode);
  const scope = evalFn(windowMock, windowMock.localStorage);

  // 1. Test IATA and ICAO airport code lookup
  const bneIata = scope.getCityIataCode('Brisbane');
  const bneIcao = scope.getCityIcaoCode('Brisbane');
  const bneDisplay = scope.getCityAirportCodesDisplay('Brisbane');
  assert(bneIata === 'BNE', `Expected BNE IATA for Brisbane, got: ${bneIata}`);
  assert(bneIcao === 'YBBN', `Expected YBBN ICAO for Brisbane, got: ${bneIcao}`);
  assert(bneDisplay === 'BNE / YBBN', `Expected BNE / YBBN display for Brisbane, got: ${bneDisplay}`);

  const dpsIata = scope.getCityIataCode('Bali');
  const dpsIcao = scope.getCityIcaoCode('Bali');
  const dpsDisplay = scope.getCityAirportCodesDisplay('Bali');
  assert(dpsIata === 'DPS', `Expected DPS IATA for Bali, got: ${dpsIata}`);
  assert(dpsIcao === 'WADD', `Expected WADD ICAO for Bali, got: ${dpsIcao}`);
  assert(dpsDisplay === 'DPS / WADD', `Expected DPS / WADD display for Bali, got: ${dpsDisplay}`);

  // 2. Test city without ICAO or IATA returns empty string gracefully
  assert(scope.getCityIataCode('NonexistentCityXYZ') === '', 'Non-existent city should return empty IATA string');
  assert(scope.getCityIcaoCode('NonexistentCityXYZ') === '', 'Non-existent city should return empty ICAO string');
  assert(scope.getCityAirportCodesDisplay('NonexistentCityXYZ') === '', 'Non-existent city should return empty display');

  // 3. Test city with user-specified custom IATA & ICAO codes
  scope.citiesData.push({
    id: 'city-custom',
    name: 'Custom City',
    code: 'CUS',
    icaoCode: 'XCUS',
    countryCode: 'AU',
    country: 'Australia'
  });
  assert(scope.getCityIataCode('Custom City') === 'CUS', 'Custom city IATA code should match');
  assert(scope.getCityIcaoCode('Custom City') === 'XCUS', 'Custom city ICAO code should match');
  assert(scope.getCityAirportCodesDisplay('Custom City') === 'CUS / XCUS', 'Custom city formatted display should match');

  // 4. Test rebuildItineraryAndDataMappings populates missing codes and does NOT wipe city.code
  scope.citiesData.push({
    id: 'city-rome',
    name: 'Rome',
    countryCode: 'IT',
    country: 'Italy'
  });
  scope.rebuildItineraryAndDataMappings({ showToast: false });
  const romeCity = scope.citiesData.find(c => c.name === 'Rome');
  assert(romeCity && romeCity.code === 'FCO', `rebuild should auto-populate FCO IATA for Rome, got: ${romeCity?.code}`);
  assert(romeCity && romeCity.icaoCode === 'LIRF', `rebuild should auto-populate LIRF ICAO for Rome, got: ${romeCity?.icaoCode}`);

  // 5. Test setHomeCity sets titleData.homeCity and rebuilds
  scope.citiesData.push({
    id: 'city-bne',
    name: 'Brisbane',
    countryCode: 'AU',
    country: 'Australia'
  });
  scope.setHomeCity('Brisbane');
  const home = scope.getHomeLocation();
  assert(home.departure === 'Brisbane', `Home location departure should be Brisbane, got: ${home.departure}`);
  assert(home.isExplicit === true, 'Home location should be explicit');

  // 6. Test dropdowns formatting with IATA + ICAO codes
  scope._populateJourneyCityDropdowns();
  const journeyFromEl = getOrCreateMockEl('journeyFromCity');
  assert(journeyFromEl.innerHTML.includes('Brisbane (BNE / YBBN)'), 'journeyFromCity should include Brisbane (BNE / YBBN)');
  assert(journeyFromEl.innerHTML.includes('Home (Brisbane'), 'journeyFromCity should display Home (Brisbane)');

  scope._populateAddLegCityDropdowns();
  const existingCityEl = getOrCreateMockEl('existingCitySelect');
  assert(existingCityEl.innerHTML.includes('Brisbane (BNE / YBBN)'), 'existingCitySelect should include Brisbane (BNE / YBBN)');
  assert(existingCityEl.innerHTML.includes('Home (Brisbane'), 'existingCitySelect should display Home (Brisbane)');

  console.log('✔ All rebuild itinerary and IATA/ICAO airport codes tests passed successfully!');
}

module.exports = { runRebuildAndAirportCodesTests };

if (require.main === module) {
  runRebuildAndAirportCodesTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err.stack || err.message);
      process.exit(1);
    });
}
