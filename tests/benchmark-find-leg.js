const fs = require('fs');
const path = require('path');
const { extractBetween, loadSource } = require('./lib/test-helpers');

const itineraryJs = loadSource(path.join('js', 'itinerary.js'));
const fixture = JSON.parse(loadSource(path.join('backups', '2026_June_July_Europe_Thailand.json')));

const timelineScoreFunc = extractBetween(itineraryJs, 'function getTimelineScore', 'function sameTimelineDay');
const sameDayFunc = extractBetween(itineraryJs, 'function sameTimelineDay', 'let _journeyLegCache =');

const setupBaselineCode = `
var journeys = ${JSON.stringify(fixture.journeys)};
var appData = ${JSON.stringify(fixture.itinerary)};
function getTripTimelineYear() { return 2026; }
${timelineScoreFunc}
${sameDayFunc}
function findLegForJourneyCity(cityId, cityName) {
  if (!Array.isArray(journeys)) return null;

  const matchingJourneys = journeys
      .filter(j =>
          j.fromCityId === cityId ||
          j.toCityId === cityId ||
          (cityName && (j.fromLocation === cityName || j.toLocation === cityName))
      )
      .sort((a, b) => {
        const aScore = getTimelineScore(a.arrivalDate || a.departureDate || a.dayDate, a.arrivalTime || a.departureTime, Number.MAX_SAFE_INTEGER);
        const bScore = getTimelineScore(b.arrivalDate || b.departureDate || b.dayDate, b.arrivalTime || b.departureTime, Number.MAX_SAFE_INTEGER);
        return aScore - bScore;
      });

  for (const journey of matchingJourneys) {
    if (journey.legId) {
      const directLeg = appData.find(leg => leg.id === journey.legId);
      if (directLeg) return directLeg;
    }

    const targetDate = journey.toCityId === cityId || journey.toLocation === cityName
        ? (journey.arrivalDate || journey.dayDate || journey.departureDate)
        : (journey.departureDate || journey.dayDate || journey.arrivalDate);

    const dateMatchedLeg = appData.find(leg =>
        (leg.days || []).some(day => sameTimelineDay(day.date, targetDate))
    );
    if (dateMatchedLeg) return dateMatchedLeg;
  }

  return null;
}
`;

const setupOptimizedCode = `
var window = { currentCityFilter: 'all', addEventListener: () => {}, removeEventListener: () => {} };
var document = { getElementById: () => ({ querySelector: () => ({ appendChild: () => {} }), appendChild: () => {} }) };
var journeys = ${JSON.stringify(fixture.journeys)};
var appData = ${JSON.stringify(fixture.itinerary)};
function getTripTimelineYear() { return 2026; }
${itineraryJs}
`;

const contextBaseline = new Function(setupBaselineCode + `return { findLegForJourneyCity, journeys, appData };`)();
const contextOptimized = new Function(setupOptimizedCode + `return { findLegForJourneyCity, journeys, appData };`)();

// Add numeric 0 city ID to fixture journeys to test falsy 0 ID handling
contextBaseline.journeys.push({ id: 'j_zero', fromCityId: 0, toCityId: 'city-london', legId: 'zurich' });
contextOptimized.journeys.push({ id: 'j_zero', fromCityId: 0, toCityId: 'city-london', legId: 'zurich' });

const testCases = [
  ['city-london', 'London'],
  ['city-verona', 'Verona'],
  ['city-zurich', 'Zurich'],
  ['city-bangkok', 'Bangkok'],
  ['city-taipei', 'Taipei'],
  ['city-vienna', 'Vienna'],
  ['city-brisbane', 'Brisbane'],
  [0, 'ZeroCity'],
  ['unknown-id', 'NonExistentCity']
];

console.log('--- Correctness Check ---');
for (const [cId, cName] of testCases) {
  const baseRes = contextBaseline.findLegForJourneyCity(cId, cName);
  const optRes = contextOptimized.findLegForJourneyCity(cId, cName);
  if (baseRes?.id !== optRes?.id) {
    console.error(`Mismatch for (${cId}, ${cName}): baseline=${baseRes?.id}, optimized=${optRes?.id}`);
    process.exit(1);
  }
}
console.log('Correctness check passed! Baseline and Optimized `js/itinerary.js` produce identical outputs (including numeric 0 IDs).');

console.log('\n--- Standard Fixture Benchmark (16 journeys, 17 legs) ---');
const iterations = 100000;

const startBase = process.hrtime.bigint();
for (let i = 0; i < iterations; i++) {
  const caseItem = testCases[i % testCases.length];
  contextBaseline.findLegForJourneyCity(caseItem[0], caseItem[1]);
}
const endBase = process.hrtime.bigint();
const baseMs = Number(endBase - startBase) / 1e6;

const startOpt = process.hrtime.bigint();
for (let i = 0; i < iterations; i++) {
  const caseItem = testCases[i % testCases.length];
  contextOptimized.findLegForJourneyCity(caseItem[0], caseItem[1]);
}
const endOpt = process.hrtime.bigint();
const optMs = Number(endOpt - startOpt) / 1e6;

console.log(`Baseline (${iterations} iterations): ${baseMs.toFixed(2)} ms (${(iterations / (baseMs / 1000)).toFixed(0)} ops/sec)`);
console.log(`Optimized (${iterations} iterations): ${optMs.toFixed(2)} ms (${(iterations / (optMs / 1000)).toFixed(0)} ops/sec)`);
console.log(`Speedup: ${(baseMs / optMs).toFixed(2)}x faster (${((1 - optMs / baseMs) * 100).toFixed(2)}% reduction in time)`);
