const fs = require('fs');
const path = require('path');

function runBenchmark() {
  const itineraryJs = fs.readFileSync(path.join('js', 'itinerary.js'), 'utf8');
  const backup = JSON.parse(fs.readFileSync('backups/2026_June_July_Europe_Thailand.json', 'utf8'));

  // Create scaled dataset (10x size) for stress testing
  const scaledJourneys = [];
  const scaledItinerary = [];
  for (let i = 0; i < 10; i++) {
    backup.journeys.forEach((j, idx) => {
      scaledJourneys.push({ ...j, id: `j_${i}_${idx}`, fromCityId: `city_${i}_${j.fromCityId}`, toCityId: `city_${i}_${j.toCityId}` });
    });
    backup.itinerary.forEach((leg, idx) => {
      scaledItinerary.push({ ...leg, id: `leg_${i}_${idx}` });
    });
  }

  const cityNavBlock = itineraryJs.slice(
    itineraryJs.indexOf('const CITY_NAV_SKIP_NAMES'),
    itineraryJs.indexOf('// Active city filter')
  );

  const fn = new Function(
    'appData',
    'journeys',
    'citiesData',
    `
    ${cityNavBlock}
    return { findLegForJourneyCity };
    `
  );

  const { findLegForJourneyCity } = fn(scaledItinerary, scaledJourneys, backup.cities);

  const testQueries = [
    ['city-london', 'London'],
    ['city-verona', 'Verona'],
    ['city-bangkok', 'Bangkok'],
    ['city-vienna', 'Vienna'],
    ['city-zurich', 'Zurich'],
    ['city-brisbane', 'Brisbane'],
    ['city-taipei', 'Taipei']
  ];

  // Warmup
  for (let i = 0; i < 50; i++) {
    for (const [id, name] of testQueries) {
      findLegForJourneyCity(id, name);
    }
  }

  const iterations = 5000;
  const start = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) {
    for (const [id, name] of testQueries) {
      findLegForJourneyCity(id, name);
    }
  }
  const end = process.hrtime.bigint();
  const durationMs = Number(end - start) / 1e6;

  console.log(`Benchmark completed: ${iterations * testQueries.length} findLegForJourneyCity calls took ${durationMs.toFixed(2)} ms`);
  return durationMs;
}

if (require.main === module) {
  runBenchmark();
}

module.exports = { runBenchmark };
