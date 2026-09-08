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
    alert: () => {},
    addEventListener: () => {},
    journeys: [],
    stays: []
  };

  const origSetTimeout = global.setTimeout;
  const origFetch = global.fetch;

  global.setTimeout = (fn) => setImmediate(fn);
  global.fetch = async () => ({ json: async () => [] });

  try {
    const combinedCode = `
      const document = window.document;
      const alert = window.alert;
      ${utilsCode}
      ${dataCode}
      return {
        fetchAllMissingCityLocations,
        resolveCityLocation,
        citiesData,
        ALL_CITIES
      };
    `;

    const evalFn = new Function('window', 'localStorage', combinedCode);
    const engine = evalFn(windowMock, windowMock.localStorage);

    // Populate citiesData with 1,000 cities to resolve (matching cities in ALL_CITIES + some non-matching)
    const sampleCityNames = engine.ALL_CITIES.map(c => c.name);
    const citiesToTest = [];

    for (let i = 0; i < 1000; i++) {
      const cityName = sampleCityNames[i % sampleCityNames.length];
      citiesToTest.push({
        id: `city-${i}`,
        name: cityName,
        country: ''
      });
    }

    const iterations = 200;
    const start = performance.now();

    for (let iter = 0; iter < iterations; iter++) {
      engine.citiesData.length = 0;
      for (let i = 0; i < citiesToTest.length; i++) {
        engine.citiesData.push({ ...citiesToTest[i] });
      }
      await engine.fetchAllMissingCityLocations();
    }

    const duration = performance.now() - start;
    const avgTimePerRun = duration / iterations;
    console.log(`[Baseline Benchmark] ${iterations} runs over 1,000 missing cities: total ${duration.toFixed(2)} ms (avg ${avgTimePerRun.toFixed(2)} ms/run)`);
    return { duration, avgTimePerRun };
  } finally {
    global.setTimeout = origSetTimeout;
    global.fetch = origFetch;
  }
}

if (require.main === module) {
  runBenchmark().catch(err => {
    console.error(err);
    process.exitCode = 1;
  });
}

module.exports = { runBenchmark };
