const path = require('path');
const { loadSource } = require('./lib/test-helpers');

const itineraryJs = loadSource(path.join('js', 'itinerary.js'));
const fixture = JSON.parse(loadSource(path.join('backups', '2026_June_July_Europe_Thailand.json')));

// Unoptimized legacy version for benchmark comparison
function findLegForJourneyCityLegacy(cityId, cityName, journeys, appData, getTimelineScore, sameTimelineDay) {
  if (!Array.isArray(journeys) || journeys.length === 0) return null;
  if (!Array.isArray(appData) || appData.length === 0) return null;

  const matching = [];
  const jLen = journeys.length;
  for (let i = 0; i < jLen; i++) {
    const j = journeys[i];
    if (!j) continue;
    if (
      j.fromCityId === cityId ||
      j.toCityId === cityId ||
      (cityName && (j.fromLocation === cityName || j.toLocation === cityName))
    ) {
      const score = getTimelineScore(
        j.arrivalDate || j.departureDate || j.dayDate,
        j.arrivalTime || j.departureTime,
        Number.MAX_SAFE_INTEGER
      );
      matching.push({ journey: j, score });
    }
  }

  const mLen = matching.length;
  if (mLen === 0) return null;

  if (mLen > 1) {
    matching.sort((a, b) => a.score - b.score);
  }

  const aLen = appData.length;
  for (let i = 0; i < mLen; i++) {
    const journey = matching[i].journey;

    if (journey.legId) {
      for (let l = 0; l < aLen; l++) {
        const leg = appData[l];
        if (leg && leg.id === journey.legId) return leg;
      }
    }

    const targetDate = (journey.toCityId === cityId || journey.toLocation === cityName)
        ? (journey.arrivalDate || journey.dayDate || journey.departureDate)
        : (journey.departureDate || journey.dayDate || journey.arrivalDate);

    if (targetDate) {
      for (let l = 0; l < aLen; l++) {
        const leg = appData[l];
        if (leg && leg.days) {
          const days = leg.days;
          const dLen = days.length;
          for (let d = 0; d < dLen; d++) {
            const day = days[d];
            if (day && sameTimelineDay(day.date, targetDate)) return leg;
          }
        }
      }
    }
  }

  return null;
}

const codeToEval = `
var window = { addEventListener() {} };
var isEditMode = false;
var stays = [];
var citiesData = [];
${itineraryJs}

return { findLegForJourneyCity, sameTimelineDay, getTimelineScore };
`;

function createEnvironment(appData, journeys) {
  const context = new Function('appData', 'journeys', codeToEval);
  return context(appData, journeys);
}

function runBenchmark() {
  const env = createEnvironment(fixture.itinerary, fixture.journeys);

  const testCases = [
    { cityId: 'city-london', cityName: 'London' },
    { cityId: 'city-zurich', cityName: 'Zurich' },
    { cityId: 'city-taipei', cityName: 'Taipei' },
    { cityId: 'city-vienna', cityName: 'Vienna' },
    { cityId: 'city-verona', cityName: 'Verona' },
    { cityId: 'city-nonexistent', cityName: 'NonExistent' },
    { cityId: 'city-bangkok', cityName: 'Bangkok' }
  ];

  // Verify correctness first
  console.log('--- Correctness check ---');
  for (const tc of testCases) {
    const legOrig = findLegForJourneyCityLegacy(tc.cityId, tc.cityName, fixture.journeys, fixture.itinerary, env.getTimelineScore, env.sameTimelineDay);
    const legOpt = env.findLegForJourneyCity(tc.cityId, tc.cityName);
    const origId = legOrig ? legOrig.id : 'null';
    const optId = legOpt ? legOpt.id : 'null';
    const match = origId === optId;
    console.log(`${tc.cityId} / ${tc.cityName} => Legacy: ${origId}, Optimized: ${optId} [${match ? 'MATCH' : 'MISMATCH!'}]`);
    if (!match) {
      throw new Error(`Mismatch for ${tc.cityId} / ${tc.cityName}`);
    }
  }

  // Generate larger dataset
  const largeJourneys = [];
  const largeAppData = [];
  const cities = ['London', 'Paris', 'Zurich', 'Vienna', 'Taipei', 'Bangkok', 'Tokyo', 'Sydney', 'Rome', 'Berlin'];

  for (let i = 0; i < 200; i++) {
    const fromCity = cities[i % cities.length];
    const toCity = cities[(i + 1) % cities.length];
    const legId = `leg-${i}`;
    const dayDate = `${(i % 28) + 1} Jun`;
    largeAppData.push({
      id: legId,
      label: toCity,
      days: [{ date: dayDate, from: fromCity, to: toCity }]
    });
    largeJourneys.push({
      id: `j-${i}`,
      fromCityId: `city-${fromCity.toLowerCase()}`,
      toCityId: `city-${toCity.toLowerCase()}`,
      fromLocation: fromCity,
      toLocation: toCity,
      departureDate: dayDate,
      legId: (i % 3 === 0) ? legId : undefined
    });
  }

  const envLarge = createEnvironment(largeAppData, largeJourneys);

  const largeTestCases = cities.map(c => ({ cityId: `city-${c.toLowerCase()}`, cityName: c }));

  // Check correctness on large dataset
  for (const tc of largeTestCases) {
    const legOrig = findLegForJourneyCityLegacy(tc.cityId, tc.cityName, largeJourneys, largeAppData, envLarge.getTimelineScore, envLarge.sameTimelineDay);
    const legOpt = envLarge.findLegForJourneyCity(tc.cityId, tc.cityName);
    const origId = legOrig ? legOrig.id : 'null';
    const optId = legOpt ? legOpt.id : 'null';
    if (origId !== optId) {
      throw new Error(`Mismatch in large dataset for ${tc.cityId}: Legacy=${origId}, Opt=${optId}`);
    }
  }

  // Benchmark iterations
  const iterations = 50000;

  console.log('\n--- Benchmarking small dataset (16 journeys, 17 legs) ---');
  const startSmallOrig = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) {
    const tc = testCases[i % testCases.length];
    findLegForJourneyCityLegacy(tc.cityId, tc.cityName, fixture.journeys, fixture.itinerary, env.getTimelineScore, env.sameTimelineDay);
  }
  const endSmallOrig = process.hrtime.bigint();
  const timeSmallOrigMs = Number(endSmallOrig - startSmallOrig) / 1e6;

  const startSmallOpt = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) {
    const tc = testCases[i % testCases.length];
    env.findLegForJourneyCity(tc.cityId, tc.cityName);
  }
  const endSmallOpt = process.hrtime.bigint();
  const timeSmallOptMs = Number(endSmallOpt - startSmallOpt) / 1e6;

  console.log(`Legacy:    ${timeSmallOrigMs.toFixed(2)} ms (${(iterations / (timeSmallOrigMs / 1000)).toFixed(0)} ops/sec)`);
  console.log(`Optimized: ${timeSmallOptMs.toFixed(2)} ms (${(iterations / (timeSmallOptMs / 1000)).toFixed(0)} ops/sec)`);
  console.log(`Speedup:   ${(timeSmallOrigMs / timeSmallOptMs).toFixed(2)}x`);

  console.log('\n--- Benchmarking large dataset (200 journeys, 200 legs) ---');
  const startLargeOrig = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) {
    const tc = largeTestCases[i % largeTestCases.length];
    findLegForJourneyCityLegacy(tc.cityId, tc.cityName, largeJourneys, largeAppData, envLarge.getTimelineScore, envLarge.sameTimelineDay);
  }
  const endLargeOrig = process.hrtime.bigint();
  const timeLargeOrigMs = Number(endLargeOrig - startLargeOrig) / 1e6;

  const startLargeOpt = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) {
    const tc = largeTestCases[i % largeTestCases.length];
    envLarge.findLegForJourneyCity(tc.cityId, tc.cityName);
  }
  const endLargeOpt = process.hrtime.bigint();
  const timeLargeOptMs = Number(endLargeOpt - startLargeOpt) / 1e6;

  console.log(`Legacy:    ${timeLargeOrigMs.toFixed(2)} ms (${(iterations / (timeLargeOrigMs / 1000)).toFixed(0)} ops/sec)`);
  console.log(`Optimized: ${timeLargeOptMs.toFixed(2)} ms (${(iterations / (timeLargeOptMs / 1000)).toFixed(0)} ops/sec)`);
  console.log(`Speedup:   ${(timeLargeOrigMs / timeLargeOptMs).toFixed(2)}x`);
}

runBenchmark();
