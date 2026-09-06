const path = require('path');
const { loadSource, extractBetween } = require('./lib/test-helpers');

const itineraryJs = loadSource(path.join('js', 'itinerary.js'));
const fixture = JSON.parse(loadSource(path.join('backups', '2026_June_July_Europe_Thailand.json')));

const snippet = extractBetween(itineraryJs, 'function getTripTimelineYear', 'function buildCityNav');

// Create test dataset with 100x journeys to simulate larger trips / repeated lookups
const journeys = [];
for (let i = 0; i < 100; i++) {
  fixture.journeys.forEach((j, idx) => {
    journeys.push({
      ...j,
      id: j.id + '_' + i,
      fromCityId: j.fromCityId || ('city-' + idx),
      toCityId: j.toCityId || ('city-' + (idx + 1))
    });
  });
}
const appData = fixture.itinerary;

const findLegForJourneyCityFn = new Function('appData', 'journeys', `
  ${snippet}
  return findLegForJourneyCity;
`)(appData, journeys);

function runBenchmark() {
  const citiesToTest = ['city-london', 'city-verona', 'city-zurich', 'city-brisbane', 'city-taipei', 'city-london', 'city-verona', 'non-existent'];
  const cityNames = ['London', 'Verona', 'Zurich', 'Brisbane', 'Taipei', 'London', 'Verona', 'NonExistent'];

  const iterations = 5000;
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    const cId = citiesToTest[i % citiesToTest.length];
    const cName = cityNames[i % cityNames.length];
    findLegForJourneyCityFn(cId, cName);
  }
  const end = performance.now();
  const elapsed = end - start;
  console.log(`Benchmark completed (${iterations} calls): ${elapsed.toFixed(2)} ms`);
  return elapsed;
}

if (require.main === module) {
  runBenchmark();
}

module.exports = { runBenchmark };
