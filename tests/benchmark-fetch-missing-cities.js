const fs = require('fs');
const path = require('path');

async function runBenchmark() {
  const utilsCode = fs.readFileSync(path.join(__dirname, '../js/utils.js'), 'utf8');
  const dataCode = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');

  const makeMockElement = () => ({
    disabled: false,
    textContent: '',
    innerText: 'Trip Title',
    cloneNode: () => makeMockElement(),
    parentNode: { replaceChild: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {},
    setAttribute: () => {},
    appendChild: () => {},
    querySelectorAll: () => [],
    querySelector: () => null,
    style: {},
    remove: () => {}
  });

  const documentMock = {
    getElementById: () => makeMockElement(),
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => makeMockElement(),
    body: { addEventListener: () => {}, appendChild: () => {}, insertBefore: () => {}, firstChild: null },
    addEventListener: () => {}
  };

  const windowMock = {
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    indexedDB: null,
    document: documentMock,
    addEventListener: () => {},
    journeys: [],
    stays: [],
    saveData: () => {},
    populateCityList: () => {},
    buildJourneyMap: () => {},
    alert: () => {}
  };

  const mockFetch = async (url) => {
    // Mock Nominatim API response
    await new Promise(r => setTimeout(r, 20));
    const cleanUrl = decodeURIComponent(url);
    if (cleanUrl.includes('unknown')) {
      return { json: async () => [] };
    }
    return {
      json: async () => [{
        lat: '12.3456',
        lon: '65.4321',
        address: { country_code: 'us', country: 'United States' },
        display_name: 'Mock Online Result'
      }]
    };
  };

  const combinedCode = `
    const document = window.document;
    const fetch = ${mockFetch.toString()};
    ${utilsCode}
    ${dataCode}
    return {
      fetchAllMissingCityLocations,
      citiesData,
      cityHasStoredCoords
    };
  `;

  const evalFn = new Function('window', 'localStorage', combinedCode);
  const engine = evalFn(windowMock, windowMock.localStorage);

  // Setup test citiesData with missing coords
  // Mix of cities:
  // 1-5: Exact ALL_CITIES matches ("Tokyo", "Paris", "London", "Sydney", "Bangkok")
  // 6-10: Local DB matches via alias/country or formatting ("Vienna", "muenchen", "roma", "nyc", "Praha")
  // 11: Custom city requiring online search ("Custom Online Town")
  const missingCitiesList = [
    { id: 'c1', name: 'Tokyo', countryCode: 'JP' },
    { id: 'c2', name: 'Paris', countryCode: 'FR' },
    { id: 'c3', name: 'London', countryCode: 'GB' },
    { id: 'c4', name: 'Sydney', countryCode: 'AU' },
    { id: 'c5', name: 'Bangkok', countryCode: 'TH' },
    { id: 'c6', name: 'Vienna', country: 'Austria' },
    { id: 'c7', name: 'muenchen', countryCode: 'DE' },
    { id: 'c8', name: 'roma', countryCode: 'IT' },
    { id: 'c9', name: 'NYC', countryCode: 'US' },
    { id: 'c10', name: 'Praha', countryCode: 'CZ' },
    { id: 'c11', name: 'Custom Online Town', countryCode: 'US' }
  ];

  engine.citiesData.length = 0;
  missingCitiesList.forEach(c => engine.citiesData.push(JSON.parse(JSON.stringify(c))));

  console.log(`Testing fetchAllMissingCityLocations baseline with ${missingCitiesList.length} missing cities...`);

  const startTime = process.hrtime.bigint();
  await engine.fetchAllMissingCityLocations();
  const endTime = process.hrtime.bigint();

  const durationMs = Number(endTime - startTime) / 1e6;
  console.log(`Baseline Duration: ${durationMs.toFixed(2)} ms`);

  const resolvedCount = engine.citiesData.filter(c => engine.cityHasStoredCoords(c)).length;
  console.log(`Resolved: ${resolvedCount}/${missingCitiesList.length} cities`);

  return { durationMs, resolvedCount };
}

runBenchmark().catch(console.error);
