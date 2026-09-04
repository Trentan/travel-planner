const path = require('path');
const vm = require('vm');
const { performance } = require('perf_hooks');
const {
  createVmContext,
  loadSource
} = require('./lib/test-helpers');

function setupEnvironment() {
  const dataJs = loadSource(path.join('js', 'data.js'));

  const context = createVmContext({
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    },
    indexedDB: null,
    document: {
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: () => ({ style: {}, appendChild: () => {}, innerHTML: '', innerText: '' }),
      body: { appendChild: () => {}, insertBefore: () => {} }
    },
    window: {
      addEventListener: () => {}
    },
    addEventListener: () => {},
    alert: () => {},
    saveData: () => {},
    populateCityList: () => {},
    showToast: () => {},
    buildNav: () => {},
    buildItinerary: () => {},
    buildJourneyMap: () => {},
    triggerOnlineSearch: async () => {}
  });
  context.window = context;

  vm.runInNewContext(dataJs, context, { filename: 'js/data.js' });
  context.triggerOnlineSearch = async () => {};
  context.window.triggerOnlineSearch = async () => {};
  return context;
}

async function runBenchmark() {
  const context = setupEnvironment();

  // Create a large dataset of cities
  const allCities = vm.runInNewContext('ALL_CITIES', context);
  const citiesData = [];
  const NUM_CITIES = 5000;

  for (let i = 0; i < NUM_CITIES; i++) {
    const dbCity = allCities[i % allCities.length];
    // Create city with missing metadata so it triggers repairs
    citiesData.push({
      id: `city-${i}`,
      name: dbCity.name,
      code: '',
      countryCode: '',
      country: ''
    });
  }

  // Set citiesData inside the VM context
  context.citiesData = citiesData;
  vm.runInNewContext('citiesData = ' + JSON.stringify(citiesData), context);

  // Warmup
  await vm.runInNewContext('repairAllCityMetadata()', context);

  // Benchmark
  const ITERATIONS = 10;
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    // Reset city metadata before each run
    vm.runInNewContext(`
      for (const c of citiesData) {
        c.code = '';
        c.countryCode = '';
        c.country = '';
        delete c.lat;
        delete c.lng;
      }
    `, context);
    await vm.runInNewContext('repairAllCityMetadata()', context);
  }
  const duration = performance.now() - start;
  const avgTime = duration / ITERATIONS;

  console.log(`Benchmark completed: ${ITERATIONS} iterations with ${NUM_CITIES} cities.`);
  console.log(`Total time: ${duration.toFixed(2)} ms`);
  console.log(`Average time per repairAllCityMetadata call: ${avgTime.toFixed(2)} ms`);

  return avgTime;
}

if (require.main === module) {
  runBenchmark().catch(console.error);
}

module.exports = { runBenchmark };
