const { performance } = require('perf_hooks');
const path = require('path');
const fs = require('fs');

// Load js/data.js in simulated environment or isolate the lookup pattern
const dataJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'data.js'), 'utf8');

// Extract ALL_CITIES from js/data.js
const extendedCityMatch = dataJs.match(/const EXTENDED_CITY_DATABASE = \[([\s\S]*?)\];/);
const cityDatabaseMatch = dataJs.match(/const CITY_DATABASE = \[([\s\S]*?)\];/);

const EXTENDED_CITY_DATABASE = new Function(`return [${extendedCityMatch[1]}];`)();
const CITY_DATABASE = new Function(`return [${cityDatabaseMatch[1]}];`)();
const ALL_CITIES = [...CITY_DATABASE, ...EXTENDED_CITY_DATABASE];

function runBaselineBenchmark(iterations = 1000) {
  // Create simulated missingCities
  const sampleCityNames = [
    'Tokyo', 'Bratislava', 'Vienna', 'Nuremberg', 'UnknownCity1',
    'London', 'Paris', 'Innsbruck', 'Bolzano', 'UnknownCity2'
  ];

  const missingCities = [];
  for (let i = 0; i < iterations; i++) {
    missingCities.push({ name: sampleCityNames[i % sampleCityNames.length] });
  }

  const start = performance.now();

  let localCoordsCount = 0;
  for (let i = 0; i < missingCities.length; i++) {
    const city = missingCities[i];
    const hadLocalCoords = !!ALL_CITIES.find(c =>
      c.name.toLowerCase() === city.name.toLowerCase() &&
      c.lat !== undefined &&
      c.lng !== undefined
    );
    if (hadLocalCoords) localCoordsCount++;
  }

  const end = performance.now();
  return { timeMs: end - start, localCoordsCount, iterations };
}

function runOptimizedBenchmark(iterations = 1000) {
  const sampleCityNames = [
    'Tokyo', 'Bratislava', 'Vienna', 'Nuremberg', 'UnknownCity1',
    'London', 'Paris', 'Innsbruck', 'Bolzano', 'UnknownCity2'
  ];

  const missingCities = [];
  for (let i = 0; i < iterations; i++) {
    missingCities.push({ name: sampleCityNames[i % sampleCityNames.length] });
  }

  const start = performance.now();

  // Precomputed Set O(1) lookups
  const localCoordsCityNames = new Set(
    ALL_CITIES
      .filter(c => c.lat !== undefined && c.lng !== undefined)
      .map(c => c.name.toLowerCase())
  );

  let localCoordsCount = 0;
  for (let i = 0; i < missingCities.length; i++) {
    const city = missingCities[i];
    const hadLocalCoords = localCoordsCityNames.has(city.name.toLowerCase());
    if (hadLocalCoords) localCoordsCount++;
  }

  const end = performance.now();
  return { timeMs: end - start, localCoordsCount, iterations };
}

if (require.main === module) {
  console.log(`ALL_CITIES dataset size: ${ALL_CITIES.length} cities`);
  const iterations = 5000;

  // Warmup
  runBaselineBenchmark(100);
  runOptimizedBenchmark(100);

  const baseline = runBaselineBenchmark(iterations);
  console.log(`Baseline execution time (${iterations} iterations): ${baseline.timeMs.toFixed(3)} ms`);

  const optimized = runOptimizedBenchmark(iterations);
  console.log(`Optimized execution time (${iterations} iterations): ${optimized.timeMs.toFixed(3)} ms`);

  const speedup = (baseline.timeMs / optimized.timeMs).toFixed(2);
  console.log(`Speedup factor: ${speedup}x`);
}

module.exports = { runBaselineBenchmark, runOptimizedBenchmark, ALL_CITIES };
