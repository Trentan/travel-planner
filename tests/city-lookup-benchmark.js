const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// Read js/data.js and evaluate required databases
const jsData = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');

// Extract CITY_DATABASE & EXTENDED_CITY_DATABASE definition
const m1 = jsData.match(/const CITY_DATABASE = (\[[\s\S]*?\]);\n/);
const m2 = jsData.match(/const EXTENDED_CITY_DATABASE = (\[[\s\S]*?\]);\n/);

if (!m1 || !m2) {
  console.error('Could not extract city databases from js/data.js');
  process.exit(1);
}

const CITY_DATABASE = new Function('return ' + m1[1])();
const EXTENDED_CITY_DATABASE = new Function('return ' + m2[1])();
const ALL_CITIES = [...CITY_DATABASE, ...EXTENDED_CITY_DATABASE];

console.log(`Loaded ${ALL_CITIES.length} cities from ALL_CITIES database.`);

// Baseline refetch logic using ALL_CITIES.find()
function refetchBaseline(cityName, citiesData) {
  const city = citiesData.find(c => c.name.toLowerCase() === cityName.toLowerCase());
  if (!city) return null;
  const match = ALL_CITIES.find(c => c.name.toLowerCase() === cityName.toLowerCase());
  if (match) {
    if ('code' in city) delete city.code;
    city.countryCode = match.countryCode;
    city.lat = match.lat;
    city.lng = match.lng;
  }
  return match;
}

// Map-optimized refetch logic
const allCitiesMap = new Map();
ALL_CITIES.forEach(c => {
  if (c.name) {
    const key = c.name.toLowerCase();
    if (!allCitiesMap.has(key)) allCitiesMap.set(key, c);
  }
});

function refetchOptimized(cityName, citiesData) {
  const city = citiesData.find(c => c.name.toLowerCase() === cityName.toLowerCase());
  if (!city) return null;
  const match = allCitiesMap.get(cityName.toLowerCase());
  if (match) {
    if ('code' in city) delete city.code;
    city.countryCode = match.countryCode;
    city.lat = match.lat;
    city.lng = match.lng;
  }
  return match;
}

// Generate test data (500 cities)
const mockCitiesData = ALL_CITIES.map((c, i) => ({
  id: `city_${i}`,
  name: c.name,
  code: 'OLD_CODE'
}));

const ITERATIONS = 10000;

console.log(`\n--- Running Benchmark (${ITERATIONS} refetch operations across ${mockCitiesData.length} cities) ---`);

// Warmup
for (let i = 0; i < 100; i++) {
  const cityName = mockCitiesData[i % mockCitiesData.length].name;
  refetchBaseline(cityName, JSON.parse(JSON.stringify(mockCitiesData)));
  refetchOptimized(cityName, JSON.parse(JSON.stringify(mockCitiesData)));
}

// Benchmark Baseline
const dataBaseline = JSON.parse(JSON.stringify(mockCitiesData));
const startBaseline = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  const cityName = mockCitiesData[i % mockCitiesData.length].name;
  refetchBaseline(cityName, dataBaseline);
}
const endBaseline = performance.now();
const baselineMs = endBaseline - startBaseline;

// Benchmark Optimized
const dataOptimized = JSON.parse(JSON.stringify(mockCitiesData));
const startOptimized = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  const cityName = mockCitiesData[i % mockCitiesData.length].name;
  refetchOptimized(cityName, dataOptimized);
}
const endOptimized = performance.now();
const optimizedMs = endOptimized - startOptimized;

const speedup = ((baselineMs - optimizedMs) / baselineMs) * 100;
const factor = baselineMs / optimizedMs;

console.log(`Baseline (ALL_CITIES.find()): ${baselineMs.toFixed(2)} ms`);
console.log(`Optimized (allCitiesMap.get()): ${optimizedMs.toFixed(2)} ms`);
console.log(`Improvement: ${speedup.toFixed(2)}% faster (${factor.toFixed(2)}x speedup)`);
