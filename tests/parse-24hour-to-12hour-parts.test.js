const path = require('path');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function runParse24HourTo12HourPartsTests() {
  console.log('Running parse24HourTo12HourParts unit tests...');

  const context = createVmContext({
    window: {},
    document: { getElementById: () => null, querySelectorAll: () => [] }
  });
  context.window = context;

  const crudSource = loadSource(path.join('js', 'crud.js'));
  runScriptInContext(crudSource, context, 'js/crud.js');

  const parse24HourTo12HourParts = context.window.parse24HourTo12HourParts;
  assert(typeof parse24HourTo12HourParts === 'function', 'parse24HourTo12HourParts should be exported on window');

  // 1. Falsy and empty inputs
  let res = parse24HourTo12HourParts('');
  assert(res.hour === '12' && res.minute === '00' && res.ampm === 'AM', 'Empty string should return default 12:00 AM');

  res = parse24HourTo12HourParts(null);
  assert(res.hour === '12' && res.minute === '00' && res.ampm === 'AM', 'null should return default 12:00 AM');

  res = parse24HourTo12HourParts(undefined);
  assert(res.hour === '12' && res.minute === '00' && res.ampm === 'AM', 'undefined should return default 12:00 AM');

  // 2. Standard AM times
  res = parse24HourTo12HourParts('00:00');
  assert(res.hour === '12' && res.minute === '00' && res.ampm === 'AM', '00:00 should map to 12:00 AM');

  res = parse24HourTo12HourParts('01:15');
  assert(res.hour === '01' && res.minute === '15' && res.ampm === 'AM', '01:15 should map to 01:15 AM');

  res = parse24HourTo12HourParts('09:30');
  assert(res.hour === '09' && res.minute === '30' && res.ampm === 'AM', '09:30 should map to 09:30 AM');

  res = parse24HourTo12HourParts('11:45');
  assert(res.hour === '11' && res.minute === '45' && res.ampm === 'AM', '11:45 should map to 11:45 AM');

  // 3. Standard PM times
  res = parse24HourTo12HourParts('12:00');
  assert(res.hour === '12' && res.minute === '00' && res.ampm === 'PM', '12:00 should map to 12:00 PM');

  res = parse24HourTo12HourParts('12:30');
  assert(res.hour === '12' && res.minute === '30' && res.ampm === 'PM', '12:30 should map to 12:30 PM');

  res = parse24HourTo12HourParts('13:00');
  assert(res.hour === '01' && res.minute === '00' && res.ampm === 'PM', '13:00 should map to 01:00 PM');

  res = parse24HourTo12HourParts('15:15');
  assert(res.hour === '03' && res.minute === '15' && res.ampm === 'PM', '15:15 should map to 03:15 PM');

  res = parse24HourTo12HourParts('23:45');
  assert(res.hour === '11' && res.minute === '45' && res.ampm === 'PM', '23:45 should map to 11:45 PM');

  // 4. Single-digit hour inputs
  res = parse24HourTo12HourParts('9:00');
  assert(res.hour === '09' && res.minute === '00' && res.ampm === 'AM', '9:00 should format hour as "09" AM');

  res = parse24HourTo12HourParts('0:15');
  assert(res.hour === '12' && res.minute === '15' && res.ampm === 'AM', '0:15 should format hour as "12" AM');

  // 5. Minute rounding (15-minute increments)
  res = parse24HourTo12HourParts('10:07');
  assert(res.minute === '00', '10:07 minute should round down to 00');

  res = parse24HourTo12HourParts('10:08');
  assert(res.minute === '15', '10:08 minute should round up to 15');

  res = parse24HourTo12HourParts('10:22');
  assert(res.minute === '15', '10:22 minute should round down to 15');

  res = parse24HourTo12HourParts('10:23');
  assert(res.minute === '30', '10:23 minute should round up to 30');

  res = parse24HourTo12HourParts('10:37');
  assert(res.minute === '35' || res.minute === '30' || res.minute === '45', 'Checking minute rounding boundaries');
  // Specifically: 37/15 = 2.466 -> Math.round = 2 -> 2*15 = 30
  assert(res.minute === '30', '10:37 minute should round down to 30');

  res = parse24HourTo12HourParts('10:38');
  assert(res.minute === '45', '10:38 minute should round up to 45');

  res = parse24HourTo12HourParts('10:52');
  assert(res.minute === '45', '10:52 minute should round to 45');

  res = parse24HourTo12HourParts('10:58');
  assert(res.minute === '45', '10:58 minute should cap at 45 (minNum >= 60 case)');

  // 6. Missing or invalid minute part
  res = parse24HourTo12HourParts('14');
  assert(res.hour === '02' && res.minute === '00' && res.ampm === 'PM', 'Time without colon "14" should fallback minute to 00');

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
