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
      extractCitiesFromItinerary,
      ALL_CITIES,
      citiesData,
      appData,
      stays,
      journeys
    };
  `;

  const evalFn = new Function('window', 'localStorage', combinedCode);
  const engine = evalFn(windowMock, windowMock.localStorage);

  // Setup sample stays with cityIds that require slug matching (e.g., hyphenated or non-exact name match)
  const cityIds = [
    'city-cluj-napoca',
    'city-ho-chi-minh-city',
    'city-rio-de-janeiro',
    'city-tel-aviv',
    'city-sharm-el-sheikh',
    'city-san-francisco',
    'city-new-york',
    'city-unknown-destination-123',
    'city-another-unknown-place'
  ];

  engine.stays.length = 0;
  cityIds.forEach((id, i) => {
    engine.stays.push({ cityId: id, checkIn: '2026-06-01' });
  });

  const ITERATIONS = 10000;

  console.log(`Running extractCitiesFromItinerary benchmark (${ITERATIONS} iterations)...`);

  const start = process.hrtime.bigint();
  for (let i = 0; i < ITERATIONS; i++) {
    engine.extractCitiesFromItinerary();
  }
  const end = process.hrtime.bigint();
  const durationMs = Number(end - start) / 1e6;

  console.log(`extractCitiesFromItinerary (${ITERATIONS} calls): ${durationMs.toFixed(2)} ms`);
  console.log(`Average per call: ${(durationMs / ITERATIONS).toFixed(4)} ms`);
}

runBenchmark().catch(console.error);
