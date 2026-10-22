const fs = require('fs');
const path = require('path');
const assert = require('assert');

function runExtractCitiesUserCitiesTests() {
  console.log('--- Running extractCitiesFromItinerary userCities Unit & Benchmark Tests ---');

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
      setUserCities: (uc) => { userCities = uc; },
      getUserCities: () => userCities,
      setAppData: (ad) => { appData = ad; },
      setStays: (st) => { stays = st; },
      setJourneys: (j) => { journeys = j; },
      setCitiesData: (cd) => { citiesData = cd; }
    };
  `;

  const evalFn = new Function('window', 'localStorage', combinedCode);
  const app = evalFn(windowMock, windowMock.localStorage);

  // Test 1: Empty userCities handling
  app.setUserCities([]);
  app.setAppData([
    {
      days: [
        { from: 'Tokyo', to: 'Kyoto', date: '2026-06-01' }
      ]
    }
  ]);
  app.setStays([]);
  app.setJourneys([]);

  let cities = app.extractCitiesFromItinerary();
  assert.strictEqual(cities.length, 2, 'Should extract Tokyo and Kyoto');
  assert.strictEqual(cities[0].name, 'Tokyo');
  assert.strictEqual(cities[1].name, 'Kyoto');
  console.log('✓ Empty userCities extraction test passed');

  // Test 2: Extraction from userCities matching by name & cityId
  app.setUserCities([
    { code: 'UC1', name: 'Custom Osaka', countryCode: 'JP' },
    { code: 'UC2', name: 'Custom Sapporo', countryCode: 'JP' }
  ]);
  app.setStays([
    { cityId: 'city-custom-osaka', checkIn: '2026-06-05' }
  ]);
  app.setAppData([
    {
      days: [
        {
          from: 'Tokyo',
          to: 'Tokyo',
          date: '2026-06-01',
          activityItems: [
            { cityId: 'city-custom-sapporo' }
          ]
        }
      ]
    }
  ]);

  cities = app.extractCitiesFromItinerary();
  const cityNames = cities.map(c => c.name);
  assert(cityNames.includes('Tokyo'), 'Should include Tokyo');
  assert(cityNames.includes('Custom Osaka'), 'Should include Custom Osaka matched from userCities via stay cityId');
  assert(cityNames.includes('Custom Sapporo'), 'Should include Custom Sapporo matched from userCities via activity cityId');
  console.log('✓ userCities extraction by name and cityId passed');

  // Benchmark Test: Scalability with 300 user cities and multi-leg itinerary items
  const largeUserCities = [];
  for (let i = 0; i < 300; i++) {
    largeUserCities.push({ code: `UC${i}`, name: `User Destination ${i}`, countryCode: 'JP' });
  }
  app.setUserCities(largeUserCities);

  const benchmarkLegs = [];
  for (let l = 0; l < 10; l++) {
    const days = [];
    for (let d = 0; d < 5; d++) {
      const activityItems = [];
      for (let a = 0; a < 5; a++) {
        const idx = (l * 25 + d * 5 + a) % 300;
        activityItems.push({ cityId: `city-user-destination-${idx}` });
      }
      days.push({ from: 'Tokyo', to: 'Tokyo', date: '2026-06-01', activityItems });
    }
    benchmarkLegs.push({ days });
  }
  app.setAppData(benchmarkLegs);

  const benchmarkStays = [];
  for (let s = 0; s < 50; s++) {
    benchmarkStays.push({ cityId: `city-user-destination-${s % 300}`, checkIn: '2026-06-01' });
  }
  app.setStays(benchmarkStays);

  // Warmup
  for (let i = 0; i < 5; i++) {
    app.extractCitiesFromItinerary();
  }

  const ITERATIONS = 100;
  const startTime = process.hrtime.bigint();
  for (let i = 0; i < ITERATIONS; i++) {
    app.extractCitiesFromItinerary();
  }
  const endTime = process.hrtime.bigint();
  const elapsedMs = Number(endTime - startTime) / 1e6;
  const avgMs = elapsedMs / ITERATIONS;

  console.log(`Benchmark: ${ITERATIONS} calls with 300 userCities took ${elapsedMs.toFixed(2)} ms (${avgMs.toFixed(3)} ms/call)`);
  assert(avgMs < 10, `Execution per call should be fast (< 10ms, got ${avgMs.toFixed(3)}ms)`);

  console.log('✅ ALL extractCitiesFromItinerary userCities UNIT & BENCHMARK TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  runExtractCitiesUserCitiesTests();
}

module.exports = { runExtractCitiesUserCitiesTests };
