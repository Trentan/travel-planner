const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

function runBenchmark() {
  const dataCode = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');

  // Extract COUNTRY_FLAGS, COUNTRY_TO_CODE, and getCityFlag implementation
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
    document: documentMock,
    addEventListener: () => {}
  };

  const evalCode = `
    const document = window.document;
    ${dataCode}
    return {
      getCityFlag,
      COUNTRY_FLAGS,
      COUNTRY_TO_CODE,
      FLAG_TO_COUNTRY_MAP
    };
  `;

  const evalFn = new Function('window', 'localStorage', evalCode);
  const context = evalFn(windowMock, windowMock.localStorage);

  const { getCityFlag, COUNTRY_FLAGS, COUNTRY_TO_CODE } = context;

  // Unoptimized implementation for comparison
  function getCityFlagOld(cityName) {
    if (!cityName) return '📍';
    let country = null;
    if (COUNTRY_FLAGS[cityName]) {
      const flag = COUNTRY_FLAGS[cityName];
      for (const [cName, cFlag] of Object.entries(COUNTRY_FLAGS)) {
        if (cFlag === flag && COUNTRY_TO_CODE[cName]) {
          country = cName;
          break;
        }
      }
      return flag;
    }
    return '📍';
  }

  const cities = Object.keys(COUNTRY_FLAGS);
  const ITERATIONS = 1000000;

  // Warmup
  for (let i = 0; i < 10000; i++) {
    getCityFlagOld(cities[i % cities.length]);
    getCityFlag(cities[i % cities.length]);
  }

  const startOld = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    getCityFlagOld(cities[i % cities.length]);
  }
  const endOld = performance.now();
  const timeOld = endOld - startOld;

  const startNew = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    getCityFlag(cities[i % cities.length]);
  }
  const endNew = performance.now();
  const timeNew = endNew - startNew;

  console.log(`--- getCityFlag Performance Benchmark (${ITERATIONS} calls) ---`);
  console.log(`Baseline (Object.entries loop): ${timeOld.toFixed(2)} ms`);
  console.log(`Optimized (FLAG_TO_COUNTRY_MAP): ${timeNew.toFixed(2)} ms`);
  console.log(`Speedup: ${(timeOld / timeNew).toFixed(2)}x faster`);
}

if (require.main === module) {
  runBenchmark();
}

module.exports = { runBenchmark };
