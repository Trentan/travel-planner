const path = require('path');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function runParse24HourTo12HourPartsTests() {
  console.log('Running parse24HourTo12HourParts unit tests...');

  const documentMock = {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {}
  };

  const context = createVmContext({
    document: documentMock,
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    location: { hostname: 'localhost', origin: 'http://localhost:3000', href: 'http://localhost:3000/' },
    addEventListener() {},
    appData: [],
    saveData() {},
    buildItinerary() {},
    buildNav() {}
  });
  context.window = context;

  const crudSource = loadSource(path.join('js', 'crud.js'));
  runScriptInContext(crudSource, context, 'js/crud.js');

  const parse24HourTo12HourParts = context.window.parse24HourTo12HourParts;
  const get24HourTimeFrom12HourParts = context.window.get24HourTimeFrom12HourParts;

  assert(typeof parse24HourTo12HourParts === 'function', 'parse24HourTo12HourParts should be exported on window');
  assert(typeof get24HourTimeFrom12HourParts === 'function', 'get24HourTimeFrom12HourParts should be exported on window');

  // 1. Falsy and empty inputs
  assert(JSON.stringify(parse24HourTo12HourParts(null)) === JSON.stringify({ hour: '12', minute: '00', ampm: 'AM' }), 'null should return default 12:00 AM');
  assert(JSON.stringify(parse24HourTo12HourParts(undefined)) === JSON.stringify({ hour: '12', minute: '00', ampm: 'AM' }), 'undefined should return default 12:00 AM');
  assert(JSON.stringify(parse24HourTo12HourParts('')) === JSON.stringify({ hour: '12', minute: '00', ampm: 'AM' }), 'Empty string should return default 12:00 AM');

  // 2. Midnight boundary (00:00 -> 12:00 AM)
  assert(JSON.stringify(parse24HourTo12HourParts('00:00')) === JSON.stringify({ hour: '12', minute: '00', ampm: 'AM' }), '00:00 should return 12:00 AM');
  assert(JSON.stringify(parse24HourTo12HourParts('0:00')) === JSON.stringify({ hour: '12', minute: '00', ampm: 'AM' }), '0:00 should return 12:00 AM');

  // 3. Morning hours (01:00 to 11:59)
  assert(JSON.stringify(parse24HourTo12HourParts('01:15')) === JSON.stringify({ hour: '01', minute: '15', ampm: 'AM' }), '01:15 should return 01:15 AM');
  assert(JSON.stringify(parse24HourTo12HourParts('09:30')) === JSON.stringify({ hour: '09', minute: '30', ampm: 'AM' }), '09:30 should return 09:30 AM');
  assert(JSON.stringify(parse24HourTo12HourParts('11:45')) === JSON.stringify({ hour: '11', minute: '45', ampm: 'AM' }), '11:45 should return 11:45 AM');

  // 4. Noon boundary (12:00 -> 12:00 PM)
  assert(JSON.stringify(parse24HourTo12HourParts('12:00')) === JSON.stringify({ hour: '12', minute: '00', ampm: 'PM' }), '12:00 should return 12:00 PM');
  assert(JSON.stringify(parse24HourTo12HourParts('12:30')) === JSON.stringify({ hour: '12', minute: '30', ampm: 'PM' }), '12:30 should return 12:30 PM');

  // 5. Afternoon & Evening hours (13:00 to 23:59)
  assert(JSON.stringify(parse24HourTo12HourParts('13:00')) === JSON.stringify({ hour: '01', minute: '00', ampm: 'PM' }), '13:00 should return 01:00 PM');
  assert(JSON.stringify(parse24HourTo12HourParts('15:45')) === JSON.stringify({ hour: '03', minute: '45', ampm: 'PM' }), '15:45 should return 03:45 PM');
  assert(JSON.stringify(parse24HourTo12HourParts('23:15')) === JSON.stringify({ hour: '11', minute: '15', ampm: 'PM' }), '23:15 should return 11:15 PM');

  // 6. Minute rounding to nearest 15-minute intervals
  assert(JSON.stringify(parse24HourTo12HourParts('14:02')) === JSON.stringify({ hour: '02', minute: '00', ampm: 'PM' }), '14:02 should round to 00 mins');
  assert(JSON.stringify(parse24HourTo12HourParts('14:08')) === JSON.stringify({ hour: '02', minute: '15', ampm: 'PM' }), '14:08 should round to 15 mins');
  assert(JSON.stringify(parse24HourTo12HourParts('14:22')) === JSON.stringify({ hour: '02', minute: '15', ampm: 'PM' }), '14:22 should round to 15 mins');
  assert(JSON.stringify(parse24HourTo12HourParts('14:23')) === JSON.stringify({ hour: '02', minute: '30', ampm: 'PM' }), '14:23 should round to 30 mins');
  assert(JSON.stringify(parse24HourTo12HourParts('14:37')) === JSON.stringify({ hour: '02', minute: '30', ampm: 'PM' }), '14:37 should round to 30 mins');
  assert(JSON.stringify(parse24HourTo12HourParts('14:38')) === JSON.stringify({ hour: '02', minute: '45', ampm: 'PM' }), '14:38 should round to 45 mins');

  // 7. Clamping minutes >= 60 to 45 mins
  assert(JSON.stringify(parse24HourTo12HourParts('14:53')) === JSON.stringify({ hour: '02', minute: '45', ampm: 'PM' }), '14:53 rounds to 60 which clamps to 45 mins');
  assert(JSON.stringify(parse24HourTo12HourParts('14:59')) === JSON.stringify({ hour: '02', minute: '45', ampm: 'PM' }), '14:59 rounds to 60 which clamps to 45 mins');

  // 8. Missing minute part
  assert(JSON.stringify(parse24HourTo12HourParts('14')) === JSON.stringify({ hour: '02', minute: '00', ampm: 'PM' }), 'Missing minute part defaults to 00');

  // 9. get24HourTimeFrom12HourParts companion function tests
  assert(get24HourTimeFrom12HourParts('', '00', 'AM') === '', 'Missing hour should return empty string');
  assert(get24HourTimeFrom12HourParts('12', '', 'AM') === '', 'Missing minute should return empty string');
  assert(get24HourTimeFrom12HourParts('12', '00', '') === '', 'Missing ampm should return empty string');
  assert(get24HourTimeFrom12HourParts('12', '00', 'AM') === '00:00', '12:00 AM should return 00:00');
  assert(get24HourTimeFrom12HourParts('01', '15', 'AM') === '01:15', '01:15 AM should return 01:15');
  assert(get24HourTimeFrom12HourParts('12', '00', 'PM') === '12:00', '12:00 PM should return 12:00');
  assert(get24HourTimeFrom12HourParts('02', '30', 'PM') === '14:30', '02:30 PM should return 14:30');
  assert(get24HourTimeFrom12HourParts('11', '45', 'PM') === '23:45', '11:45 PM should return 23:45');

  console.log('✅ ALL parse24HourTo12HourParts UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runParse24HourTo12HourPartsTests();
  } catch (err) {
    console.error('❌ parse24HourTo12HourParts TEST FAILED:', err.message);
    process.exit(1);
  }
}

module.exports = { runParse24HourTo12HourPartsTests };
