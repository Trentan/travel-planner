const path = require('path');
const fs = require('fs');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const itineraryJs = fs.readFileSync(path.join(root, 'js', 'itinerary.js'), 'utf8');
const backupJson = JSON.parse(fs.readFileSync(path.join(root, 'backups', '2026_June_July_Europe_Thailand.json'), 'utf8'));

function createBenchmarkContext(appData, journeys, citiesData = []) {
  const windowObj = {
    journeys,
    appData,
    addEventListener: () => {},
    removeEventListener: () => {}
  };
  const docObj = {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => []
  };
  const context = {
    console,
    appData,
    journeys,
    window: windowObj,
    document: docObj,
    citiesData,
    setTimeout,
    clearTimeout,
    Date,
    Math,
    Array,
    Object,
    Number,
    String,
    RegExp
  };
  context.globalThis = context;
  vm.runInNewContext(itineraryJs, context);
  return context;
}

function generateScaledDataset(numLegs = 100, daysPerLeg = 5, journeysPerLeg = 10) {
  const appData = [];
  const journeys = [];
  const cities = [];

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 0; i < numLegs; i++) {
    const cityId = `city-${i}`;
    const cityName = `City_${i}`;
    cities.push({ id: cityId, name: cityName });

    const days = [];
    for (let d = 0; d < daysPerLeg; d++) {
      const dayNum = (i * daysPerLeg + d) % 28 + 1;
      const monthIdx = Math.floor((i * daysPerLeg + d) / 28) % 12;
      const dateStr = `${dayNum} ${monthNames[monthIdx]}`;
      days.push({
        day: `Day ${d + 1}`,
        date: dateStr,
        from: cityName,
        to: cityName,
        desc: `Exploring ${cityName}`
      });
    }

    const leg = {
      id: cityId,
      label: cityName,
      colour: '#3b82f6',
      days
    };
    appData.push(leg);

    for (let j = 0; j < journeysPerLeg; j++) {
      const destCityIdx = (i + j + 1) % numLegs;
      const destCityName = `City_${destCityIdx}`;
      const dayNum = (i * daysPerLeg) % 28 + 1;
      const monthIdx = Math.floor((i * daysPerLeg) / 28) % 12;
      const dateStr = `${dayNum} ${monthNames[monthIdx]}`;

      journeys.push({
        id: `j_${i}_${j}`,
        journeyId: `jid_${i}_${j}`,
        legId: (j % 2 === 0) ? cityId : null,
        fromCityId: cityId,
        toCityId: `city-${destCityIdx}`,
        fromLocation: cityName,
        toLocation: destCityName,
        departureDate: dateStr,
        departureTime: '10:00',
        arrivalDate: dateStr,
        arrivalTime: '14:00',
        transportType: 'train'
      });
    }
  }

  return { appData, journeys, cities };
}

function runBenchmark() {
  console.log('--- Benchmarking findLegForJourneyCity ---');

  // 1. Benchmark real fixture data
  const ctxReal = createBenchmarkContext(backupJson.itinerary, backupJson.journeys);
  const cityQueriesReal = [
    ['city-london', 'London'],
    ['city-verona', 'Verona'],
    ['city-zurich', 'Zurich'],
    ['city-bangkok', 'Bangkok'],
    ['city-vienna', 'Vienna'],
    ['city-unknown', 'UnknownCity']
  ];

  const iterationsReal = 50000;
  const startReal = process.hrtime.bigint();
  for (let i = 0; i < iterationsReal; i++) {
    const q = cityQueriesReal[i % cityQueriesReal.length];
    ctxReal.findLegForJourneyCity(q[0], q[1]);
  }
  const endReal = process.hrtime.bigint();
  const timeRealMs = Number(endReal - startReal) / 1e6;
  console.log(`Real Fixture Data (${iterationsReal} calls): ${timeRealMs.toFixed(2)} ms (${(timeRealMs / iterationsReal * 1000).toFixed(4)} μs/op)`);

  // 2. Benchmark scaled dataset
  const scaled = generateScaledDataset(100, 5, 10); // 100 legs, 500 days, 1000 journeys
  const ctxScaled = createBenchmarkContext(scaled.appData, scaled.journeys);
  const cityQueriesScaled = scaled.cities.map(c => [c.id, c.name]);
  cityQueriesScaled.push(['city-999', 'NonExistentCity']);

  const iterationsScaled = 500;
  const startScaled = process.hrtime.bigint();
  for (let i = 0; i < iterationsScaled; i++) {
    const q = cityQueriesScaled[i % cityQueriesScaled.length];
    ctxScaled.findLegForJourneyCity(q[0], q[1]);
  }
  const endScaled = process.hrtime.bigint();
  const timeScaledMs = Number(endScaled - startScaled) / 1e6;
  console.log(`Scaled Dataset (${iterationsScaled} calls, 1000 journeys, 100 legs): ${timeScaledMs.toFixed(2)} ms (${(timeScaledMs / iterationsScaled * 1000).toFixed(4)} μs/op)`);

  return { timeRealMs, timeScaledMs };
}

if (require.main === module) {
  runBenchmark();
}

module.exports = { runBenchmark };
