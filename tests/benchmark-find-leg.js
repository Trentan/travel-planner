const fs = require('fs');
const path = require('path');

global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  __itineraryResizeBound: true
};
global.document = {
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null,
  addEventListener: () => {}
};

global.citiesData = [];

const itineraryCode = fs.readFileSync(path.join(__dirname, '../js/itinerary.js'), 'utf8');
eval(itineraryCode);

function generateTestData(numLegs = 100, numJourneys = 1000) {
  const legs = [];
  const journeysList = [];

  const cities = ['city-london', 'city-paris', 'city-tokyo', 'city-ny', 'city-rome', 'city-sydney', 'city-vienna', 'city-berlin'];
  const cityNames = ['London', 'Paris', 'Tokyo', 'New York', 'Rome', 'Sydney', 'Vienna', 'Berlin'];

  let startDate = new Date('2026-01-01');

  for (let i = 0; i < numLegs; i++) {
    const legId = `leg-${i}`;
    const cityIdx = i % cities.length;
    const days = [];
    for (let d = 0; d < 7; d++) {
      const dStr = startDate.toISOString().split('T')[0];
      days.push({
        day: `Day ${d + 1}`,
        date: dStr,
        from: cityNames[cityIdx],
        to: cityNames[(cityIdx + 1) % cityNames.length]
      });
      startDate.setDate(startDate.getDate() + 1);
    }
    legs.push({
      id: legId,
      label: cityNames[cityIdx],
      days: days
    });
  }

  for (let j = 0; j < numJourneys; j++) {
    const fromIdx = j % cities.length;
    const toIdx = (j + 1) % cities.length;
    const legIdx = j % numLegs;
    const dayIdx = j % 7;
    const journeyDate = legs[legIdx].days[dayIdx].date;

    journeysList.push({
      id: `journey-${j}`,
      journeyId: `journey-${j}`,
      fromCityId: cities[fromIdx],
      toCityId: cities[toIdx],
      fromLocation: cityNames[fromIdx],
      toLocation: cityNames[toIdx],
      departureDate: journeyDate,
      arrivalDate: journeyDate,
      departureTime: '10:00',
      arrivalTime: '14:00',
      legId: j % 5 === 0 ? legs[legIdx].id : null
    });
  }

  return { legs, journeysList };
}

const { legs, journeysList } = generateTestData(100, 1000);
global.appData = legs;
global.journeys = journeysList;

function findLegForJourneyCityOriginal(cityId, cityName) {
  if (!Array.isArray(journeys) || journeys.length === 0) return null;
  if (!Array.isArray(appData) || appData.length === 0) return null;

  const matching = [];
  for (let i = 0; i < journeys.length; i++) {
    const j = journeys[i];
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

  if (matching.length === 0) return null;

  if (matching.length > 1) {
    matching.sort((a, b) => a.score - b.score);
  }

  for (let i = 0; i < matching.length; i++) {
    const journey = matching[i].journey;

    if (journey.legId) {
      const directLeg = appData.find(leg => leg && leg.id === journey.legId);
      if (directLeg) return directLeg;
    }

    const targetDate = (journey.toCityId === cityId || journey.toLocation === cityName)
        ? (journey.arrivalDate || journey.dayDate || journey.departureDate)
        : (journey.departureDate || journey.dayDate || journey.arrivalDate);

    if (targetDate) {
      const dateMatchedLeg = appData.find(leg =>
        (leg && leg.days) ? leg.days.some(day => day && sameTimelineDay(day.date, targetDate)) : false
      );
      if (dateMatchedLeg) return dateMatchedLeg;
    }
  }

  return null;
}

const testQueries = [
  ['city-london', 'London'],
  ['city-paris', 'Paris'],
  ['city-tokyo', 'Tokyo'],
  ['city-rome', 'Rome'],
  ['city-nonexistent', 'NonExistent']
];

// 1. Correctness / Equivalence check
for (const [cId, cName] of testQueries) {
  const origRes = findLegForJourneyCityOriginal(cId, cName);
  const currRes = findLegForJourneyCity(cId, cName);
  if ((origRes ? origRes.id : null) !== (currRes ? currRes.id : null)) {
    console.error(`Mismatch for query (${cId}, ${cName}): original=${origRes?.id}, current=${currRes?.id}`);
    process.exit(1);
  }
}
console.log('✅ Correctness and equivalence test passed!');

// 2. Performance benchmark
const ITERATIONS = 5000;

const startOriginal = process.hrtime.bigint();
for (let i = 0; i < ITERATIONS; i++) {
  const query = testQueries[i % testQueries.length];
  findLegForJourneyCityOriginal(query[0], query[1]);
}
const endOriginal = process.hrtime.bigint();
const timeOriginalMs = Number(endOriginal - startOriginal) / 1e6;

const startRefactored = process.hrtime.bigint();
for (let i = 0; i < ITERATIONS; i++) {
  const query = testQueries[i % testQueries.length];
  findLegForJourneyCity(query[0], query[1]);
}
const endRefactored = process.hrtime.bigint();
const timeRefactoredMs = Number(endRefactored - startRefactored) / 1e6;

console.log(`Original implementation time: ${timeOriginalMs.toFixed(2)} ms`);
console.log(`Refactored implementation time: ${timeRefactoredMs.toFixed(2)} ms`);
