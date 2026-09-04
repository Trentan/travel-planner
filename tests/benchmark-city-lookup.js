const fs = require('fs');
const vm = require('vm');
const path = require('path');

const codePath = path.resolve(__dirname, '../js/data.js');
const code = fs.readFileSync(codePath, 'utf8') + '\n; ALL_CITIES;';

const sandbox = {
  console,
  window: { addEventListener: () => {} },
  document: { querySelector: () => null, getElementById: () => null, addEventListener: () => {} },
  localStorage: { getItem: () => null, setItem: () => {} },
  setInterval: () => {},
  setTimeout: () => {}
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

const ALL_CITIES = vm.runInContext(code, sandbox);

function runComparison(routeSize = 500, iterations = 200) {
  const sampleCities = ['London', 'Paris', 'Tokyo', 'New York', 'Sydney', 'Rome', 'Berlin', 'Madrid', 'NonExistentCity', 'Vienna', 'Bangkok'];
  const route = [];
  for (let i = 0; i < routeSize; i++) {
    route.push({
      city: sampleCities[i % sampleCities.length],
      nights: 2,
      countryCode: i % 2 === 0 ? 'GB' : 'FR'
    });
  }

  const tripStartAnswers = {
    city: 'London',
    nights: 3,
    transport: 'flight',
    cityCountryCode: 'GB',
    stops: route,
    date: '2026-06-01',
    interests: ['food', 'culture'],
    pacing: 'balanced',
    origin: 'London'
  };

  const fullRoute = [{ city: tripStartAnswers.city, nights: tripStartAnswers.nights, transport: tripStartAnswers.transport }]
    .concat(tripStartAnswers.stops.filter(stop => stop.city.trim()));

  // 1. Baseline (Old Array.find approach)
  const startBaseline = performance.now();
  for (let iter = 0; iter < iterations; iter++) {
    const citiesDataBaseline = fullRoute.map((stop, index) => {
      const cityNameTrimmed = stop.city.trim();
      const explicitCountryCode = index === 0 ? (tripStartAnswers.cityCountryCode || '') : (stop.countryCode || '');

      let dbMatch = null;
      if (explicitCountryCode) {
        dbMatch = ALL_CITIES.find(c => c.name.toLowerCase() === cityNameTrimmed.toLowerCase() && c.countryCode === explicitCountryCode);
      }
      if (!dbMatch) {
        dbMatch = ALL_CITIES.find(c => c.name.toLowerCase() === cityNameTrimmed.toLowerCase());
      }
      return dbMatch;
    });
  }
  const timeBaseline = performance.now() - startBaseline;

  // 2. Optimized (Map approach)
  const startOptimized = performance.now();
  for (let iter = 0; iter < iterations; iter++) {
    const cityByExactKey = new Map();
    const cityByName = new Map();
    if (typeof ALL_CITIES !== 'undefined' && Array.isArray(ALL_CITIES)) {
      for (let i = 0; i < ALL_CITIES.length; i++) {
        const c = ALL_CITIES[i];
        if (!c || !c.name) continue;
        const lowerName = c.name.toLowerCase();
        if (c.countryCode) {
          const exactKey = `${lowerName}|${c.countryCode}`;
          if (!cityByExactKey.has(exactKey)) {
            cityByExactKey.set(exactKey, c);
          }
        }
        if (!cityByName.has(lowerName)) {
          cityByName.set(lowerName, c);
        }
      }
    }

    const citiesDataOptimized = fullRoute.map((stop, index) => {
      const cityNameTrimmed = stop.city.trim();
      const cityNameLower = cityNameTrimmed.toLowerCase();
      const explicitCountryCode = index === 0 ? (tripStartAnswers.cityCountryCode || '') : (stop.countryCode || '');

      let dbMatch = null;
      if (explicitCountryCode) {
        dbMatch = cityByExactKey.get(`${cityNameLower}|${explicitCountryCode}`) || null;
      }
      if (!dbMatch) {
        dbMatch = cityByName.get(cityNameLower) || null;
      }
      return dbMatch;
    });
  }
  const timeOptimized = performance.now() - startOptimized;

  return {
    timeBaseline,
    timeOptimized,
    speedupRatio: timeBaseline / timeOptimized
  };
}

if (require.main === module) {
  console.log('Running benchmark comparison...');
  const res = runComparison(500, 200);
  console.log(`Baseline time (Old Array.find): ${res.timeBaseline.toFixed(2)} ms`);
  console.log(`Optimized time (New Map lookup): ${res.timeOptimized.toFixed(2)} ms`);
  console.log(`Speedup: ${res.speedupRatio.toFixed(2)}x faster`);
}

module.exports = { runComparison };
