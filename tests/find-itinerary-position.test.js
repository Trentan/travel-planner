const path = require('path');
const { performance } = require('perf_hooks');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function runFindItineraryPositionTests() {
  console.log('Running findItineraryPositionForDate unit & benchmark tests...');

  const itineraryJs = loadSource(path.join('js', 'itinerary.js'));
  const win = { addEventListener: () => {} };
  win.window = win;
  const vmContext = createVmContext({
    window: win,
    addEventListener: () => {},
    appData: [],
    journeys: [],
    stays: [],
    citiesData: []
  });
  vmContext.window = vmContext;
  runScriptInContext(itineraryJs, vmContext, 'js/itinerary.js');

  const findItineraryPositionForDate = vmContext.findItineraryPositionForDate;
  assert(typeof findItineraryPositionForDate === 'function', 'findItineraryPositionForDate should be exported on context');

  // 1. Edge cases with invalid inputs
  assert(findItineraryPositionForDate(null, '2026-06-11') === null, 'Should return null for null legs');
  assert(findItineraryPositionForDate(undefined, '2026-06-11') === null, 'Should return null for undefined legs');
  assert(findItineraryPositionForDate('not an array', '2026-06-11') === null, 'Should return null for non-array legs');
  assert(findItineraryPositionForDate([], '2026-06-11') === null, 'Should return null for empty legs array');
  assert(findItineraryPositionForDate([{ days: [] }], '') === null, 'Should return null for empty dateValue');
  assert(findItineraryPositionForDate([{ days: [] }], null) === null, 'Should return null for null dateValue');

  // 2. Simple single match
  const simpleItinerary = [
    {
      id: 'leg-1',
      days: [
        { day: 'Mon', date: '2026-06-01' },
        { day: 'Tue', date: '2026-06-02' }
      ]
    },
    {
      id: 'leg-2',
      days: [
        { day: 'Wed', date: '2026-06-03' }
      ]
    }
  ];

  const pos1 = findItineraryPositionForDate(simpleItinerary, '2026-06-02');
  assert(pos1 !== null, 'Match should be found for 2026-06-02');
  assert(pos1.legIndex === 0, 'Match legIndex should be 0');
  assert(pos1.dayIndex === 1, 'Match dayIndex should be 1');
  assert(pos1.dayKey === 'Tue-2026-06-02', 'dayKey should be Tue-2026-06-02');

  const pos2 = findItineraryPositionForDate(simpleItinerary, '2026-06-03');
  assert(pos2 !== null, 'Match should be found for 2026-06-03');
  assert(pos2.legIndex === 1, 'Match legIndex should be 1');
  assert(pos2.dayIndex === 0, 'Match dayIndex should be 0');

  assert(findItineraryPositionForDate(simpleItinerary, '2026-06-10') === null, 'Should return null for date not in itinerary');

  // 3. Duplicated travel date match (shared departure/arrival date)
  // Arrival legs follow departure legs on shared travel dates, so the later match must be returned.
  const duplicatedItinerary = [
    {
      id: 'vienna',
      days: [
        { day: 'Thu', date: '2026-06-11', from: 'Vienna', to: 'Bratislava' }
      ]
    },
    {
      id: 'bratislava',
      days: [
        { day: 'Thu', date: '2026-06-11', from: 'Vienna', to: 'Bratislava' },
        { day: 'Fri', date: '2026-06-12', from: 'Bratislava', to: 'Bratislava' }
      ]
    }
  ];

  const posDuplicated = findItineraryPositionForDate(duplicatedItinerary, '2026-06-11');
  assert(posDuplicated !== null, 'Match should be found for duplicated travel date');
  assert(posDuplicated.leg.id === 'bratislava', 'Should prefer arrival leg (bratislava) on duplicated travel dates');
  assert(posDuplicated.legIndex === 1, 'Leg index should be 1');
  assert(posDuplicated.dayIndex === 0, 'Day index should be 0');

  // 4. Performance benchmark verification
  // Define forward function inside the same vmContext so execution environment is identical
  runScriptInContext(`
    function forwardFindItineraryPositionForDate(legs, dateValue) {
      if (!Array.isArray(legs) || !dateValue) return null;
      const normalizeFn = typeof normalizeTripDateValue === 'function' ? normalizeTripDateValue : null;
      const targetDate = normalizeFn ? normalizeFn(String(dateValue)) : String(dateValue);
      if (!targetDate) return null;

      let match = null;
      legs.forEach((leg, legIndex) => {
        (leg.days || []).forEach((day, dayIndex) => {
          const dayDate = normalizeFn ? normalizeFn(day.date || '') : String(day.date || '');
          if (dayDate === targetDate) {
            match = { leg, legIndex, day, dayIndex, dayKey: day.day + '-' + day.date };
          }
        });
      });
      return match;
    }
  `, vmContext, 'forward-test');

  const forwardFindItineraryPositionForDate = vmContext.forwardFindItineraryPositionForDate;

  // Generate 50 legs with 10 days each (500 total days)
  const benchLegs = [];
  let currentDate = new Date('2026-01-01');
  for (let l = 0; l < 50; l++) {
    const days = [];
    for (let d = 0; d < 10; d++) {
      days.push({
        day: 'Day',
        date: currentDate.toISOString().slice(0, 10)
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    benchLegs.push({ id: `leg-${l}`, days });
  }

  // Target date near the end of the 500-day itinerary
  const targetDate = benchLegs[45].days[5].date;

  // Verify both methods return identical results
  const fwdResult = forwardFindItineraryPositionForDate(benchLegs, targetDate);
  const bwdResult = findItineraryPositionForDate(benchLegs, targetDate);
  assert(JSON.stringify(fwdResult) === JSON.stringify(bwdResult), 'Backward search must yield identical result to forward search');

  const iterations = 50000;

  const startFwd = performance.now();
  for (let i = 0; i < iterations; i++) {
    forwardFindItineraryPositionForDate(benchLegs, targetDate);
  }
  const timeFwd = performance.now() - startFwd;

  const startBwd = performance.now();
  for (let i = 0; i < iterations; i++) {
    findItineraryPositionForDate(benchLegs, targetDate);
  }
  const timeBwd = performance.now() - startBwd;

  const speedup = ((timeFwd - timeBwd) / timeFwd) * 100;
  console.log(`  Forward loop time:  ${timeFwd.toFixed(2)} ms`);
  console.log(`  Backward loop time: ${timeBwd.toFixed(2)} ms`);
  console.log(`  Performance boost:  ${speedup.toFixed(2)}% faster (${(timeFwd / timeBwd).toFixed(2)}x)`);

  console.log('✅ findItineraryPositionForDate unit & benchmark tests passed cleanly!');
}

if (require.main === module) {
  runFindItineraryPositionTests();
}

module.exports = { runFindItineraryPositionTests };
