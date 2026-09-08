const fs = require('fs');
const path = require('path');

// Load sample fixture data
const fixtureData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'backups', '2026_June_July_Europe_Thailand.json'), 'utf8'));

// Minimal browser-like global environment
global.window = {
  addEventListener: () => {}
};
global.appData = fixtureData.itinerary || fixtureData.appData || [];
global.journeys = fixtureData.journeys || [];
global.citiesData = [];

// Helper functions needed by itinerary.js
global.cleanCityNavLabel = (str) => String(str || '').replace(/[^\w\s-]/g, '').trim();

// Load itinerary.js
const itineraryJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'itinerary.js'), 'utf8');
eval(itineraryJs);

function runBenchmark(iterations = 20000) {
  const testCases = [
    { cityId: 'city-london', cityName: 'London' },
    { cityId: 'city-verona', cityName: 'Verona' },
    { cityId: 'city-zurich', cityName: 'Zurich' },
    { cityId: 'city-taipei', cityName: 'Taipei' },
    { cityId: 'city-bangkok', cityName: 'Bangkok' },
    { cityId: 'city-nonexistent', cityName: 'Nonexistent' }
  ];

  // Warmup
  for (let i = 0; i < 500; i++) {
    for (const tc of testCases) {
      findLegForJourneyCity(tc.cityId, tc.cityName);
    }
  }

  const start = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) {
    for (const tc of testCases) {
      findLegForJourneyCity(tc.cityId, tc.cityName);
    }
  }
  const end = process.hrtime.bigint();
  const durationMs = Number(end - start) / 1e6;
  const totalCalls = iterations * testCases.length;
  const opsPerSec = (totalCalls / (durationMs / 1000)).toFixed(2);

  console.log(`Executed ${totalCalls} calls in ${durationMs.toFixed(2)} ms (${opsPerSec} ops/sec)`);
  return { durationMs, opsPerSec, totalCalls };
}

if (require.main === module) {
  runBenchmark();
}

module.exports = { runBenchmark };
