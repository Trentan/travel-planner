const fs = require('fs');
const path = require('path');

async function runBenchmark() {
  const utilsCode = fs.readFileSync(path.join(__dirname, '../js/utils.js'), 'utf8');
  const dataCode = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');

  const documentMock = {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ setAttribute: () => {}, appendChild: () => {}, style: {}, addEventListener: () => {}, remove: () => {} }),
    body: { addEventListener: () => {}, appendChild: () => {}, insertBefore: () => {}, firstChild: null },
    addEventListener: () => {}
  };

  const windowMock = {
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    indexedDB: null,
    document: documentMock,
    addEventListener: () => {},
    journeys: [],
    stays: []
  };

  const combinedCode = `
    const document = window.document;
    ${utilsCode}
    ${dataCode}
    return {
      resolveCityLocation,
      getCityLocationDatabaseMatch,
      applyCityLocation,
      fetchAllMissingCityLocations,
      ALL_CITIES,
      citiesData
    };
  `;

  const evalFn = new Function('window', 'localStorage', combinedCode);
  const engine = evalFn(windowMock, windowMock.localStorage);

  const testCities = [
    { name: 'Tokyo', countryCode: 'JP' },
    { name: 'Vienna', country: 'Austria' },
    { name: 'Sydney' },
    { name: 'Munich', countryCode: 'DE' },
    { name: 'New York', countryCode: 'US' },
    { name: 'Paris', countryCode: 'FR' },
    { name: 'Bangkok', countryCode: 'TH' },
    { name: 'Rome', countryCode: 'IT' },
    { name: 'Barcelona', countryCode: 'ES' },
    { name: 'Prague', countryCode: 'CZ' },
    { name: 'London', countryCode: 'GB' },
    { name: 'San Francisco', countryCode: 'US' },
    { name: 'Cologne', countryCode: 'DE' },
    { name: 'Nuremberg', countryCode: 'DE' },
    { name: 'Bratislava', countryCode: 'SK' }
  ];

  const ITERATIONS = 100000;

  console.log(`Running benchmark with ${ITERATIONS} iterations...`);

  // 1. Benchmark resolveCityLocation
  const startResolve = process.hrtime.bigint();
  for (let i = 0; i < ITERATIONS; i++) {
    const city = testCities[i % testCities.length];
    await engine.resolveCityLocation(city);
  }
  const endResolve = process.hrtime.bigint();
  const resolveMs = Number(endResolve - startResolve) / 1e6;

  // 2. Benchmark getCityLocationDatabaseMatch
  const startMatch = process.hrtime.bigint();
  for (let i = 0; i < ITERATIONS; i++) {
    const city = testCities[i % testCities.length];
    engine.getCityLocationDatabaseMatch(city);
  }
  const endMatch = process.hrtime.bigint();
  const matchMs = Number(endMatch - startMatch) / 1e6;

  console.log(`resolveCityLocation (${ITERATIONS} calls): ${resolveMs.toFixed(2)} ms`);
  console.log(`getCityLocationDatabaseMatch (${ITERATIONS} calls): ${matchMs.toFixed(2)} ms`);
}

runBenchmark().catch(console.error);
