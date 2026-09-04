const path = require('path');
const vm = require('vm');
const { performance } = require('perf_hooks');
const {
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function runBenchmark(iterations = 1) {
  const dataJs = loadSource(path.join('js', 'data.js'));

  const localStorageStore = new Map();
  const localStorageMock = {
    getItem: key => localStorageStore.get(key) || null,
    setItem: (key, val) => localStorageStore.set(key, String(val)),
    removeItem: key => localStorageStore.delete(key),
    clear: () => localStorageStore.clear()
  };

  // Suppress verbose migration console.log statements during benchmark
  const noopConsole = {
    log: () => {},
    warn: () => {},
    error: () => {}
  };

  const context = createVmContext({
    window: {
      addEventListener: () => {}
    },
    document: {
      getElementById: () => null,
      querySelectorAll: () => [],
      body: { appendChild: () => {} }
    },
    localStorage: localStorageMock,
    indexedDB: null,
    location: { origin: 'http://localhost', pathname: '/' },
    alert: () => {},
    confirm: () => true,
    addEventListener: () => {},
    console: noopConsole
  });
  context.window = context;

  runScriptInContext(dataJs, context, 'js/data.js');

  const testCityNames = [
    'Tokyo', 'Paris', 'Brisbane', 'Vienna', 'Bratislava', 'New York',
    'London', 'Berlin', 'Rome', 'Sydney', 'Prague', 'Munich', 'Zurich',
    'Bangkok', 'NonExistentCityA', 'NonExistentCityB', 'Barcelona', 'Madrid'
  ];

  const COUNT = 5000;
  const citiesToMigrate = [];
  for (let i = 0; i < COUNT; i++) {
    const cityName = testCityNames[i % testCityNames.length] + (i > 1000 ? ` ${i}` : '');
    citiesToMigrate.push({
      id: `city-${i}`,
      name: cityName
      // missing code and countryCode so they need migration
    });
  }

  vm.runInNewContext('citiesData = ' + JSON.stringify(citiesToMigrate), context);

  const start = performance.now();
  context.migrateCitiesToISOFormat();
  const end = performance.now();

  const durationMs = end - start;
  const migratedCount = vm.runInNewContext('citiesData.filter(c => c.colour).length', context);

  console.log(`[Benchmark] Migrated ${COUNT} cities in ${durationMs.toFixed(2)} ms (Migrated count: ${migratedCount})`);

  return durationMs;
}

if (require.main === module) {
  runBenchmark();
}

module.exports = { runBenchmark };
