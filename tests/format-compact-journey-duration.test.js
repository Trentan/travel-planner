const fs = require('fs');
const path = require('path');
const { assert } = require('./lib/test-helpers');

async function run() {
  console.log('Running formatCompactJourneyDuration test suite...');
  const itineraryCode = fs.readFileSync(path.join(__dirname, '../js/itinerary.js'), 'utf8');

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
    journeys: [],
    appData: [],
    stays: []
  };

  const combinedCode = `
    const document = window.document;
    ${itineraryCode}
    return { parseCompactDateTime, formatCompactJourneyDuration };
  `;

  const evalFn = new Function('window', 'localStorage', combinedCode);
  const { formatCompactJourneyDuration } = evalFn(windowMock, windowMock.localStorage);

  // 1. Invalid / Empty inputs
  assert(formatCompactJourneyDuration(null) === '', 'null segments should return empty string');
  assert(formatCompactJourneyDuration(undefined) === '', 'undefined segments should return empty string');
  assert(formatCompactJourneyDuration([]) === '', 'empty array should return empty string');
  assert(formatCompactJourneyDuration('not an array') === '', 'string input should return empty string');
  assert(formatCompactJourneyDuration({ length: 1 }) === '', 'object input should return empty string');

  // 2. Missing dates or unparseable date strings
  assert(
    formatCompactJourneyDuration([{}]) === '',
    'segment with no date attributes should return empty string'
  );
  assert(
    formatCompactJourneyDuration([{ departureDate: 'invalid-date-xyz', arrivalDate: 'invalid-date-xyz' }]) === '',
    'unparseable date string should return empty string'
  );
  assert(
    formatCompactJourneyDuration([{ departureDate: '', arrivalDate: '' }]) === '',
    'empty string dates should return empty string'
  );

  // 3. Same-day durations
  assert(
    formatCompactJourneyDuration([
      { departureDate: '2026-06-15', departureTime: '10:00', arrivalDate: '2026-06-15', arrivalTime: '10:45' }
    ]) === '45m',
    '45 minute duration should return "45m"'
  );

  assert(
    formatCompactJourneyDuration([
      { departureDate: '2026-06-15', departureTime: '08:00', arrivalDate: '2026-06-15', arrivalTime: '13:00' }
    ]) === '5h',
    '5 exact hours should return "5h"'
  );

  assert(
    formatCompactJourneyDuration([
      { departureDate: '2026-06-15', departureTime: '09:15', arrivalDate: '2026-06-15', arrivalTime: '11:45' }
    ]) === '2h30m',
    '2 hours 30 minutes should return "2h30m"'
  );

  assert(
    formatCompactJourneyDuration([
      { departureDate: '2026-06-15', departureTime: '09:00', arrivalDate: '2026-06-15', arrivalTime: '10:05' }
    ]) === '1h05m',
    '1 hour 5 minutes should format minutes with leading zero "1h05m"'
  );

  assert(
    formatCompactJourneyDuration([
      { departureDate: '2026-06-15', departureTime: '10:00', arrivalDate: '2026-06-15', arrivalTime: '10:00' }
    ]) === '',
    '0 duration should return empty string'
  );

  // 4. Time wrap-around on same recorded date (arrival time before departure time)
  assert(
    formatCompactJourneyDuration([
      { departureDate: '2026-06-15', departureTime: '23:00', arrivalDate: '2026-06-15', arrivalTime: '02:30' }
    ]) === '3h30m',
    'negative diffMinutes wrapped by +24h should return "3h30m"'
  );

  // 5. Overnight & Multi-day journeys across distinct dates
  assert(
    formatCompactJourneyDuration([
      { departureDate: '2026-06-15', departureTime: '22:00', arrivalDate: '2026-06-16', arrivalTime: '02:30' }
    ]) === '4h30m',
    'overnight flight from 22:00 to 02:30 next day should return "4h30m"'
  );

  assert(
    formatCompactJourneyDuration([
      { departureDate: '2026-06-15', departureTime: '10:00', arrivalDate: '2026-06-17', arrivalTime: '12:00' }
    ]) === '50h',
    'multi-day journey from 2026-06-15 10:00 to 2026-06-17 12:00 should return "50h"'
  );

  // 6. Property fallbacks (dayDate, arrivalDate fallbacks)
  assert(
    formatCompactJourneyDuration([
      { dayDate: '2026-06-15', departureTime: '08:00', arrivalTime: '10:00' }
    ]) === '2h',
    'dayDate fallback for both depDate and arrDate should return "2h"'
  );

  assert(
    formatCompactJourneyDuration([
      { departureDate: '2026-06-15', departureTime: '08:00', arrivalTime: '10:30' }
    ]) === '2h30m',
    'arrDate fallback to departureDate when arrivalDate is missing should return "2h30m"'
  );

  // 7. Multi-segment journeys
  const multiSeg = [
    { departureDate: '2026-06-15', departureTime: '06:00', arrivalDate: '2026-06-15', arrivalTime: '10:00' },
    { departureDate: '2026-06-15', departureTime: '12:00', arrivalDate: '2026-06-15', arrivalTime: '15:00' },
    { departureDate: '2026-06-15', departureTime: '17:00', arrivalDate: '2026-06-15', arrivalTime: '21:15' }
  ];
  assert(
    formatCompactJourneyDuration(multiSeg) === '15h15m',
    'multi-segment journey taking first departure 06:00 and last arrival 21:15 should return "15h15m"'
  );

  // 8. Legacy date strings ("15 Jun")
  assert(
    formatCompactJourneyDuration([
      { departureDate: '15 Jun', departureTime: '08:00', arrivalDate: '15 Jun', arrivalTime: '14:30' }
    ]) === '6h30m',
    'legacy date string "15 Jun" should parse and return "6h30m"'
  );

  // 9. Default time string fallback ('00:00') when time strings are omitted
  assert(
    formatCompactJourneyDuration([
      { departureDate: '2026-06-15', arrivalDate: '2026-06-16' }
    ]) === '24h',
    'omitted times defaulting to 00:00 over 1 day span should return "24h"'
  );

  console.log('✅ ALL FORMAT COMPACT JOURNEY DURATION UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  run().catch(error => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}

module.exports = { run };
