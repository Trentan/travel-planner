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
  const itineraryCode = fs.readFileSync(path.join(__dirname, '../js/itinerary.js'), 'utf8');
  const mapCode = fs.readFileSync(path.join(__dirname, '../js/map.js'), 'utf8');

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
    ${crudCode}
    ${transportCode}
    ${itineraryCode}
    ${mapCode}
    return {
      getCityIataCode,
      getCityIcaoCode,
      getCityAirportCodesDisplay,
      rebuildItineraryAndDataMappings,
      setHomeCity,
      getHomeLocation,
      _populateAddLegCityDropdowns,
      _populateJourneyCityDropdowns,
      cleanCityNavLabel,
      normalizeTripLegsData,
      getCityCoords,
      getDeterministicActivityCoords,
      syncAllLegDays,
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

  // 7. Test cleanCityNavLabel strips trip lifecycle indicators
  assert(scope.cleanCityNavLabel('Denpasar Bali (Trip Start)') === 'Denpasar Bali', 'cleanCityNavLabel should strip (Trip Start)');
  assert(scope.cleanCityNavLabel('Brisbane (Trip Finish)') === 'Brisbane', 'cleanCityNavLabel should strip (Trip Finish)');
  assert(scope.cleanCityNavLabel('Sydney (Trip End)') === 'Sydney', 'cleanCityNavLabel should strip (Trip End)');

  // 8. Test normalizeTripLegsData cleans day routing & infers missing location from title
  const rawLegs = [
    {
      id: 'leg-1',
      label: 'Denpasar Bali (Trip Start)',
      city: 'Denpasar Bali (Trip Start)',
      days: [
        {
          dayNum: 1,
          date: '2026-06-01',
          from: 'Denpasar Bali (Trip Start)',
          to: 'Denpasar Bali (Trip Start)',
          activities: [
            {
              id: 'act-1',
              time: '14:00',
              title: 'Check-in and massage at Spring Spa',
              notes: 'Relax after flight',
              location: ''
            },
            {
              id: 'act-2',
              time: '19:00',
              title: 'Dinner - Crate Cafe',
              notes: 'Healthy dinner bowl',
              location: ''
            }
          ]
        }
      ]
    }
  ];

  const normalized = scope.normalizeTripLegsData(rawLegs);
  const day1 = normalized[0].days[0];
  assert(day1.from === 'Denpasar Bali', `day.from should be stripped of (Trip Start), got: ${day1.from}`);
  assert(day1.to === 'Denpasar Bali', `day.to should be stripped of (Trip Start), got: ${day1.to}`);
  assert(day1.activities[0].location === 'Spring Spa', `Inferred location from "at Spring Spa", got: ${day1.activities[0].location}`);
  assert(day1.activities[1].location === 'Crate Cafe', `Inferred location from "Dinner - Crate Cafe", got: ${day1.activities[1].location}`);

  // 9. Test getCityCoords strips (Trip Start) safely
  const coords = scope.getCityCoords('Denpasar Bali (Trip Start)');
  assert(coords && typeof coords.lat === 'number' && typeof coords.lng === 'number', 'getCityCoords should resolve for Denpasar Bali (Trip Start)');

  // 10. Test getDeterministicActivityCoords resolves coords when act.location is empty but title has venue
  const actCoords = scope.getDeterministicActivityCoords(
    { title: 'Sunset dinner at Mason' },
    'Denpasar Bali (Trip Start)'
  );
  assert(actCoords && typeof actCoords.lat === 'number' && typeof actCoords.lng === 'number', 'Deterministic coords should resolve using title venue fallback');

  // 11. Test syncAllLegDays preserves intra-trip city separation
  scope.tripData = {
    trip: {
      name: 'Bali Multi-Hub',
      homeCity: 'Brisbane',
      legs: [
        {
          id: 'leg-start',
          label: 'Denpasar Bali (Trip Start)',
          city: 'Denpasar Bali',
          legType: 'start',
          startDate: '2026-06-01',
          endDate: '2026-06-03',
          days: [
            { dayNum: 1, date: '2026-06-01', from: 'Brisbane', to: 'Canggu', activities: [] },
            { dayNum: 2, date: '2026-06-02', from: 'Canggu', to: 'Canggu', activities: [] },
            { dayNum: 3, date: '2026-06-03', from: 'Canggu', to: 'Ubud', activities: [] }
          ]
        }
      ]
    }
  };
  scope.syncAllLegDays();
  const syncedDays = scope.tripData.trip.legs[0].days;
  assert(syncedDays[0].to === 'Canggu', `Day 1 destination preserved, got: ${syncedDays[0].to}`);
  assert(syncedDays[1].from === 'Canggu', `Day 2 origin preserved, got: ${syncedDays[1].from}`);
  assert(syncedDays[1].to === 'Canggu', `Day 2 destination preserved, got: ${syncedDays[1].to}`);
  assert(syncedDays[2].from === 'Canggu', `Day 3 origin preserved, got: ${syncedDays[2].from}`);
  assert(syncedDays[2].to === 'Ubud', `Day 3 destination preserved, got: ${syncedDays[2].to}`);

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
