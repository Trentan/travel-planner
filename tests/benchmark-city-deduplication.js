const fs = require('fs');
const path = require('path');

function createBenchmarkHarness() {
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

  const evalFn = new Function('window', 'localStorage', `
    const document = window.document;
    ${dataCode}
    return {
      ALL_CITIES,
      userCities
    };
  `);

  return evalFn(windowMock, windowMock.localStorage);
}

function dedupeBaseline(combinedCities) {
  return combinedCities.filter((c, i, arr) =>
    arr.findIndex(t => t.name.toLowerCase() === c.name.toLowerCase()) === i
  );
}

function dedupeOptimizedMap(combinedCities) {
  const seen = new Map();
  for (let i = 0; i < combinedCities.length; i++) {
    const city = combinedCities[i];
    const key = city.name.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, city);
    }
  }
  return Array.from(seen.values());
}

function dedupeOptimizedSet(combinedCities) {
  const seen = new Set();
  const result = [];
  for (let i = 0; i < combinedCities.length; i++) {
    const city = combinedCities[i];
    const key = city.name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(city);
    }
  }
  return result;
}

function runBenchmark() {
  const env = createBenchmarkHarness();
  const ALL_CITIES = env.ALL_CITIES;

  // Create test userCities (say 500 user cities, some duplicates of ALL_CITIES, some new)
  const userCities = [];
  for (let i = 0; i < 500; i++) {
    userCities.push({
      code: `UC${i}`,
      name: i % 2 === 0 ? ALL_CITIES[i % ALL_CITIES.length].name : `Custom City ${i}`,
      countryCode: 'US'
    });
  }

  const combinedCities = [...ALL_CITIES, ...userCities];

  // Correctness check
  const baselineResult = dedupeBaseline(combinedCities);
  const mapResult = dedupeOptimizedMap(combinedCities);
  const setResult = dedupeOptimizedSet(combinedCities);

  console.log(`Input size: ${combinedCities.length} items`);
  console.log(`Baseline result count: ${baselineResult.length}`);
  console.log(`Map result count:      ${mapResult.length}`);
  console.log(`Set result count:      ${setResult.length}`);

  const isSameMap = baselineResult.length === mapResult.length &&
    baselineResult.every((c, i) => c.name.toLowerCase() === mapResult[i].name.toLowerCase());
  const isSameSet = baselineResult.length === setResult.length &&
    baselineResult.every((c, i) => c.name.toLowerCase() === setResult[i].name.toLowerCase());

  console.log(`Map output identical to baseline: ${isSameMap}`);
  console.log(`Set output identical to baseline: ${isSameSet}`);

  const ITERATIONS = 1000;

  // Warmup
  for (let i = 0; i < 100; i++) {
    dedupeBaseline(combinedCities);
    dedupeOptimizedMap(combinedCities);
    dedupeOptimizedSet(combinedCities);
  }

  // Baseline benchmark
  const startBaseline = process.hrtime.bigint();
  for (let i = 0; i < ITERATIONS; i++) {
    dedupeBaseline(combinedCities);
  }
  const endBaseline = process.hrtime.bigint();
  const baselineMs = Number(endBaseline - startBaseline) / 1e6;

  // Map benchmark
  const startMap = process.hrtime.bigint();
  for (let i = 0; i < ITERATIONS; i++) {
    dedupeOptimizedMap(combinedCities);
  }
  const endMap = process.hrtime.bigint();
  const mapMs = Number(endMap - startMap) / 1e6;

  // Set benchmark
  const startSet = process.hrtime.bigint();
  for (let i = 0; i < ITERATIONS; i++) {
    dedupeOptimizedSet(combinedCities);
  }
  const endSet = process.hrtime.bigint();
  const setMs = Number(endSet - startSet) / 1e6;

  console.log(`\n--- Benchmark Results (${ITERATIONS} iterations) ---`);
  console.log(`Baseline (filter + findIndex O(N^2)): ${baselineMs.toFixed(2)} ms (${(baselineMs / ITERATIONS).toFixed(4)} ms/op)`);
  console.log(`Optimized Map (O(N)):                  ${mapMs.toFixed(2)} ms (${(mapMs / ITERATIONS).toFixed(4)} ms/op)`);
  console.log(`Optimized Set (O(N)):                  ${setMs.toFixed(2)} ms (${(setMs / ITERATIONS).toFixed(4)} ms/op)`);

  const speedupMap = (baselineMs / mapMs).toFixed(2);
  const speedupSet = (baselineMs / setMs).toFixed(2);
  console.log(`Speedup (Map): ${speedupMap}x faster`);
  console.log(`Speedup (Set): ${speedupSet}x faster`);
}

runBenchmark();
