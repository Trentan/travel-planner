const path = require('path');
const { extractBetween, loadSource } = require('./lib/test-helpers');

function createBenchmarkContext() {
  const itineraryJs = loadSource(path.join('js', 'itinerary.js'));

  const cityNavBlock = extractBetween(
    itineraryJs,
    'const CITY_NAV_SKIP_NAMES',
    '// Active city filter'
  );

  const contextFunc = new Function(
    'appData',
    'journeys',
    `
    var citiesData = [];
    ${cityNavBlock}
    return {
      findLegForJourneyCity,
      sameTimelineDay,
      getTimelineScore,
      getTripTimelineYear
    };
    `
  );

  return contextFunc;
}

function generateBenchmarkData() {
  const fixture = JSON.parse(loadSource(path.join('backups', '2026_June_July_Europe_Thailand.json')));

  // Synthetic dataset for scaling tests
  const synthLegs = [];
  const synthJourneys = [];
  const cities = ['city-london', 'city-paris', 'city-rome', 'city-berlin', 'city-tokyo', 'city-sydney', 'city-ny', 'city-bangkok', 'city-vienna', 'city-zurich'];
  const cityNames = ['London', 'Paris', 'Rome', 'Berlin', 'Tokyo', 'Sydney', 'New York', 'Bangkok', 'Vienna', 'Zurich'];

  for (let i = 0; i < 30; i++) {
    const legId = `leg-${i}`;
    const days = [];
    for (let d = 1; d <= 7; d++) {
      days.push({
        day: `Day ${d}`,
        date: `${(i * 7 + d) % 28 + 1} Jul`,
        from: cityNames[i % cityNames.length],
        to: cityNames[(i + 1) % cityNames.length]
      });
    }
    synthLegs.push({
      id: legId,
      label: cityNames[i % cityNames.length],
      days
    });
  }

  for (let j = 0; j < 100; j++) {
    synthJourneys.push({
      id: `j-${j}`,
      fromCityId: cities[j % cities.length],
      toCityId: cities[(j + 2) % cities.length],
      fromLocation: cityNames[j % cityNames.length],
      toLocation: cityNames[(j + 2) % cityNames.length],
      departureDate: `${(j * 3) % 28 + 1} Jul`,
      arrivalDate: `${(j * 3) % 28 + 1} Jul`,
      departureTime: '10:00',
      arrivalTime: '14:00',
      legId: j % 2 === 0 ? `leg-${j % 30}` : null
    });
  }

  return { fixture, synthLegs, synthJourneys };
}

function runBenchmark() {
  const contextBuilder = createBenchmarkContext();
  const { fixture, synthLegs, synthJourneys } = generateBenchmarkData();

  console.log('=== Benchmarking findLegForJourneyCity ===');

  // Test 1: Fixture dataset
  const fixtureCtx = contextBuilder(fixture.itinerary, fixture.journeys);
  const fixtureCities = [
    ['city-london', 'London'],
    ['city-verona', 'Verona'],
    ['city-bangkok', 'Bangkok'],
    ['city-zurich', 'Zurich'],
    ['city-vienna', 'Vienna'],
    ['nonexistent', 'NonExistent']
  ];

  const iterationsFixture = 5000;
  const startFixture = process.hrtime.bigint();
  for (let i = 0; i < iterationsFixture; i++) {
    for (const [id, name] of fixtureCities) {
      fixtureCtx.findLegForJourneyCity(id, name);
    }
  }
  const endFixture = process.hrtime.bigint();
  const durFixtureMs = Number(endFixture - startFixture) / 1e6;
  console.log(`Fixture Dataset (${iterationsFixture * fixtureCities.length} calls): ${durFixtureMs.toFixed(2)} ms`);

  // Test 2: Synthetic dataset (scaled up)
  const synthCtx = contextBuilder(synthLegs, synthJourneys);
  const synthQueries = [
    ['city-london', 'London'],
    ['city-paris', 'Paris'],
    ['city-rome', 'Rome'],
    ['city-tokyo', 'Tokyo'],
    ['city-nonexistent', 'NonExistent']
  ];

  const iterationsSynth = 5000;
  const startSynth = process.hrtime.bigint();
  for (let i = 0; i < iterationsSynth; i++) {
    for (const [id, name] of synthQueries) {
      synthCtx.findLegForJourneyCity(id, name);
    }
  }
  const endSynth = process.hrtime.bigint();
  const durSynthMs = Number(endSynth - startSynth) / 1e6;
  console.log(`Synthetic Dataset (${iterationsSynth * synthQueries.length} calls): ${durSynthMs.toFixed(2)} ms`);

  return { durFixtureMs, durSynthMs };
}

if (require.main === module) {
  runBenchmark();
}

module.exports = { runBenchmark, createBenchmarkContext, generateBenchmarkData };
