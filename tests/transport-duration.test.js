const fs = require('fs');
const path = require('path');
const { assert } = require('./lib/test-helpers');

async function run() {
  console.log('Running calculateJourneyDuration test suite...');
  const transportCode = fs.readFileSync(path.join(__dirname, '../js/transport.js'), 'utf8');

  const documentMock = {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {}
  };

  const windowMock = {
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    indexedDB: null,
    document: documentMock,
    addEventListener: () => {},
    journeys: []
  };

  const combinedCode = `
    const document = window.document;
    ${transportCode}
    return { calculateJourneyDuration };
  `;

  const evalFn = new Function('window', 'localStorage', combinedCode);
  const { calculateJourneyDuration } = evalFn(windowMock, windowMock.localStorage);

  // 1. Edge cases: null, undefined, empty array
  assert(calculateJourneyDuration(null) === null, 'null segments should return null');
  assert(calculateJourneyDuration(undefined) === null, 'undefined segments should return null');
  assert(calculateJourneyDuration([]) === null, 'empty segments array should return null');

  // 2. Missing dates
  assert(
    calculateJourneyDuration([{ departureTime: '10:00', arrivalDate: '2026-06-15', arrivalTime: '15:00' }]) === null,
    'missing departure date should return null'
  );
  assert(
    calculateJourneyDuration([{ departureDate: '2026-06-15', departureTime: '10:00', arrivalTime: '15:00' }]) === null,
    'missing arrival date should return null'
  );

  // 3. Invalid date strings
  assert(
    calculateJourneyDuration([{ departureDate: '2026-99-99', arrivalDate: '2026-06-15' }]) === null,
    'invalid ISO departure date resulting in NaN timestamp should return null'
  );
  assert(
    calculateJourneyDuration([{ departureDate: '2026-06-15', arrivalDate: '2026-99-99' }]) === null,
    'invalid ISO arrival date resulting in NaN timestamp should return null'
  );

  // 4. Single segment - ISO dates (YYYY-MM-DD)
  assert(
    calculateJourneyDuration([
      { departureDate: '2026-06-15', departureTime: '08:00', arrivalDate: '2026-06-15', arrivalTime: '14:00' }
    ]) === 6,
    'same day 08:00 to 14:00 should return 6 hours'
  );

  assert(
    calculateJourneyDuration([
      { departureDate: '2026-06-15', departureTime: '08:30', arrivalDate: '2026-06-15', arrivalTime: '14:00' }
    ]) === 5,
    '5.5 hours duration (08:30 to 14:00) should be floored to 5 hours'
  );

  assert(
    calculateJourneyDuration([
      { departureDate: '2026-06-15', departureTime: '10:00', arrivalDate: '2026-06-15', arrivalTime: '10:00' }
    ]) === 0,
    'same departure and arrival date and time should return 0 hours'
  );

  assert(
    calculateJourneyDuration([
      { departureDate: '2026-06-15', departureTime: '22:00', arrivalDate: '2026-06-16', arrivalTime: '06:00' }
    ]) === 8,
    'overnight flight 22:00 to 06:00 next day should return 8 hours'
  );

  // 5. Single segment - Legacy dates ("15 Jun") & dayDate fallback
  assert(
    calculateJourneyDuration([
      { departureDate: '15 Jun', departureTime: '08:00', arrivalDate: '15 Jun', arrivalTime: '14:00' }
    ]) === 6,
    'legacy date format "15 Jun" 08:00 to 14:00 should return 6 hours'
  );

  assert(
    calculateJourneyDuration([
      { dayDate: '2026-06-15', departureTime: '10:00', arrivalDate: '2026-06-15', arrivalTime: '15:00' }
    ]) === 5,
    'dayDate fallback when departureDate is omitted should return 5 hours'
  );

  // 6. Overnight / next day time wrap-around when arrival date is recorded as departure date
  assert(
    calculateJourneyDuration([
      { departureDate: '2026-06-15', departureTime: '23:00', arrivalDate: '2026-06-15', arrivalTime: '02:00' }
    ]) === 3,
    'departure 23:00, arrival 02:00 on same date should wrap +24h and return 3 hours'
  );

  // 7. Multi-segment journeys
  const multiSeg = [
    { departureDate: '2026-06-15', departureTime: '06:00', arrivalDate: '2026-06-15', arrivalTime: '10:00' },
    { departureDate: '2026-06-15', departureTime: '12:00', arrivalDate: '2026-06-15', arrivalTime: '18:00' },
    { departureDate: '2026-06-15', departureTime: '20:00', arrivalDate: '2026-06-16', arrivalTime: '08:00' }
  ];
  assert(
    calculateJourneyDuration(multiSeg) === 26,
    'multi-segment journey from 2026-06-15 06:00 to 2026-06-16 08:00 should return 26 hours'
  );

  // 8. Omitted / Falsy Times
  assert(
    calculateJourneyDuration([
      { departureDate: '2026-06-15', arrivalDate: '2026-06-16', arrivalTime: '12:00' }
    ]) === 36,
    'omitted departure time should default to 00:00 (36 hours total)'
  );

  assert(
    calculateJourneyDuration([
      { departureDate: '2026-06-15', departureTime: '12:00', arrivalDate: '2026-06-16' }
    ]) === 12,
    'omitted arrival time should default to 00:00 (12 hours total)'
  );

  console.log('✅ ALL CALCULATE JOURNEY DURATION UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  run().catch(error => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}

module.exports = { run };
