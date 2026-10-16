// tests/benchmark-get-city-by-name.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function setupSandbox() {
  const sandbox = {
    console,
    window: {
      addEventListener: () => {}
    },
    citiesData: []
  };
  vm.createContext(sandbox);

  const utilsCode = fs.readFileSync(path.join(__dirname, '..', 'js/utils.js'), 'utf8');
  const itineraryCode = fs.readFileSync(path.join(__dirname, '..', 'js/itinerary.js'), 'utf8');

  vm.runInContext(utilsCode, sandbox);
  vm.runInContext(itineraryCode, sandbox);

  return sandbox;
}

function generateCities(count = 100) {
  const baseCities = [
    { id: 'city-bali', name: 'Denpasar Bali', code: 'DPS', airportCode: 'DPS', country: 'Indonesia' },
    { id: 'city-taipei', name: 'Taipei', code: 'TPE', airportCode: 'TPE', country: 'Taiwan' },
    { id: 'city-paris', name: 'Paris', code: 'CDG', airportCode: 'CDG', country: 'France' },
    { id: 'city-london', name: 'London', code: 'LHR', airportCode: 'LHR', country: 'United Kingdom' },
    { id: 'city-tokyo', name: 'Tokyo', code: 'HND', airportCode: 'NRT', country: 'Japan' },
    { id: 'city-newyork', name: 'New York', code: 'JFK', airportCode: 'JFK', country: 'United States' },
    { id: 'city-sydney', name: 'Sydney', code: 'SYD', airportCode: 'SYD', country: 'Australia' },
    { id: 'city-singapore', name: 'Singapore', code: 'SIN', airportCode: 'SIN', country: 'Singapore' },
    { id: 'city-rome', name: 'Rome', code: 'FCO', airportCode: 'FCO', country: 'Italy' },
    { id: 'city-barcelona', name: 'Barcelona', code: 'BCN', airportCode: 'BCN', country: 'Spain' }
  ];

  const cities = [...baseCities];
  for (let i = baseCities.length; i < count; i++) {
    cities.push({
      id: `city-dummy-${i}`,
      name: `Dummy City ${i}`,
      code: `DM${i}`,
      airportCode: `D${i}`,
      country: `Country ${i % 20}`
    });
  }
  return cities;
}

function runBenchmark(iterations = 10000) {
  const sandbox = setupSandbox();
  sandbox.citiesData = generateCities(100);

  const testQueries = [
    'city-bali',                             // 1. ID match
    'city-dummy-85',                         // 1b. ID match near end
    'Denpasar Bali',                         // 2. Exact name match
    'Dummy City 90',                         // 2b. Exact name match near end
    'Denpasar (DPS)',                        // 3. Code in parens match
    'FCO',                                   // 3b. Code match
    'Barcelona',                             // 4. Substring match
    '🌴 Bali Wellness, Diving & Fitness',    // 5. Token match
    'NonExistentCityNameXYZ'                 // 6. Unmatched query (worst case)
  ];

  // Warmup
  for (let i = 0; i < 1000; i++) {
    for (const q of testQueries) {
      sandbox.getCityByName(q);
    }
  }

  const start = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) {
    for (const q of testQueries) {
      sandbox.getCityByName(q);
    }
  }
  const end = process.hrtime.bigint();

  const durationNs = Number(end - start);
  const durationMs = durationNs / 1000000;
  const totalCalls = iterations * testQueries.length;
  const opsPerSec = (totalCalls / (durationMs / 1000)).toFixed(0);

  console.log(`Executed ${totalCalls} calls in ${durationMs.toFixed(2)} ms (${opsPerSec} ops/sec)`);
  return { durationMs, opsPerSec, totalCalls };
}

if (require.main === module) {
  runBenchmark();
}

module.exports = { runBenchmark };
