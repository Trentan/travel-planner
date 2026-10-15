const path = require('path');
const { assert, createVmContext, loadSource, runScriptInContext } = require('./lib/test-helpers');

function runGet24HourTimeFrom12HourPartsTests() {
  console.log('Running get24HourTimeFrom12HourParts unit tests...');

  const documentMock = {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {}
  };

  const context = createVmContext({
    document: documentMock,
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    appData: []
  });
  context.window = context;

  const crudSource = loadSource(path.join('js', 'crud.js'));
  runScriptInContext(crudSource, context, 'js/crud.js');

  const get24HourTimeFrom12HourParts = context.window.get24HourTimeFrom12HourParts;
  assert(
    typeof get24HourTimeFrom12HourParts === 'function',
    'get24HourTimeFrom12HourParts should be exported on window'
  );

  // 1. Missing or falsy arguments
  assert(get24HourTimeFrom12HourParts('', '30', 'AM') === '', 'empty hour should return empty string');
  assert(get24HourTimeFrom12HourParts('10', '', 'AM') === '', 'empty minute should return empty string');
  assert(get24HourTimeFrom12HourParts('10', '30', '') === '', 'empty ampm should return empty string');
  assert(get24HourTimeFrom12HourParts(null, '30', 'AM') === '', 'null hour should return empty string');
  assert(get24HourTimeFrom12HourParts('10', null, 'AM') === '', 'null minute should return empty string');
  assert(get24HourTimeFrom12HourParts('10', '30', null) === '', 'null ampm should return empty string');
  assert(get24HourTimeFrom12HourParts(undefined, undefined, undefined) === '', 'undefined inputs should return empty string');

  // 2. Standard AM times
  assert(get24HourTimeFrom12HourParts('01', '15', 'AM') === '01:15', '01:15 AM -> 01:15');
  assert(get24HourTimeFrom12HourParts('09', '30', 'AM') === '09:30', '09:30 AM -> 09:30');
  assert(get24HourTimeFrom12HourParts('11', '45', 'AM') === '11:45', '11:45 AM -> 11:45');

  // 3. 12 AM Midnight edge case
  assert(get24HourTimeFrom12HourParts('12', '00', 'AM') === '00:00', '12:00 AM -> 00:00');
  assert(get24HourTimeFrom12HourParts('12', '30', 'AM') === '00:30', '12:30 AM -> 00:30');

  // 4. Standard PM times
  assert(get24HourTimeFrom12HourParts('01', '15', 'PM') === '13:15', '01:15 PM -> 13:15');
  assert(get24HourTimeFrom12HourParts('05', '00', 'PM') === '17:00', '05:00 PM -> 17:00');
  assert(get24HourTimeFrom12HourParts('11', '59', 'PM') === '23:59', '11:59 PM -> 23:59');

  // 5. 12 PM Noon edge case
  assert(get24HourTimeFrom12HourParts('12', '00', 'PM') === '12:00', '12:00 PM -> 12:00');
  assert(get24HourTimeFrom12HourParts('12', '45', 'PM') === '12:45', '12:45 PM -> 12:45');

  // 6. Number inputs and unpadded hour strings
  assert(get24HourTimeFrom12HourParts(9, '15', 'AM') === '09:15', 'number hour 9 -> 09:15');
  assert(get24HourTimeFrom12HourParts('9', '00', 'AM') === '09:00', 'unpadded hour string "9" -> 09:00');
  assert(get24HourTimeFrom12HourParts(2, '30', 'PM') === '14:30', 'number hour 2 PM -> 14:30');

  console.log('✅ ALL get24HourTimeFrom12HourParts UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runGet24HourTimeFrom12HourPartsTests();
  } catch (err) {
    console.error('❌ get24HourTimeFrom12HourParts TEST FAILED:', err.message);
    process.exit(1);
  }
}

module.exports = { runGet24HourTimeFrom12HourPartsTests };
