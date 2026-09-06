const path = require('path');
const { performance } = require('perf_hooks');
const { loadSource, extractBetween } = require('./lib/test-helpers');

const itineraryJs = loadSource(path.join('js', 'itinerary.js'));
const fixture = JSON.parse(loadSource(path.join('backups', '2026_June_July_Europe_Thailand.json')));

// Extract necessary functions from itinerary.js
const itineraryFunctionsBlock = extractBetween(
  itineraryJs,
  'function normalizeDate(',
  '// Active city filter'
);

const setupVm = (appData, journeys) => {
  const code = `
var window = { getLegTotalCost: null };
${itineraryFunctionsBlock}

function benchmark(queries, iterations) {
  const start = performance.now();
  let matches = 0;
  for (let i = 0; i < iterations; i++) {
    for (const q of queries) {
      const res = findLegForJourneyCity(q.cityId, q.cityName);
      if (res) matches++;
    }
  }
  const end = performance.now();
  return { timeMs: end - start, matches };
}
`;
  return new Function('appData', 'journeys', 'performance', `${code} return benchmark;`)(appData, journeys, performance);
};

// Build scaled dataset to benchmark performance under load
function createScaledDataset(scaleFactor = 10) {
  const scaledJourneys = [];
  const scaledAppData = [];

  for (let s = 0; s < scaleFactor; s++) {
    fixture.journeys.forEach((j, i) => {
      scaledJourneys.push({
        ...j,
        id: `${j.id}_s${s}`,
        journeyId: j.journeyId ? `${j.journeyId}_s${s}` : undefined,
        fromCityId: j.fromCityId ? `${j.fromCityId}_s${s}` : undefined,
        toCityId: j.toCityId ? `${j.toCityId}_s${s}` : undefined,
        legId: j.legId ? `${j.legId}_s${s}` : undefined,
      });
    });

    fixture.itinerary.forEach((leg, i) => {
      scaledAppData.push({
        ...leg,
        id: `${leg.id}_s${s}`,
        days: (leg.days || []).map(d => ({ ...d }))
      });
    });
  }

  return { scaledJourneys, scaledAppData };
}

function runBenchmark() {
  const { scaledJourneys, scaledAppData } = createScaledDataset(20);
  const benchFn = setupVm(scaledAppData, scaledJourneys);

  const queries = [
    { cityId: 'city-london_s5', cityName: 'London' },
    { cityId: 'city-verona_s10', cityName: 'Verona' },
    { cityId: 'city-bangkok_s15', cityName: 'Bangkok' },
    { cityId: 'city-zurich_s3', cityName: 'Zurich' },
    { cityId: 'nonexistent', cityName: 'Nonexistent' },
  ];

  // Warmup
  benchFn(queries, 10);

  // Measure
  const iterations = 500;
  const result = benchFn(queries, iterations);
  const totalCalls = queries.length * iterations;
  console.log(`Total calls: ${totalCalls}`);
  console.log(`Time taken: ${result.timeMs.toFixed(2)} ms`);
  console.log(`Ops/sec: ${((totalCalls / result.timeMs) * 1000).toFixed(0)}`);
  console.log(`Matches found: ${result.matches}`);
}

runBenchmark();
