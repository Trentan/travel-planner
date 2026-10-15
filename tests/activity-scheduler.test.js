const path = require('path');
const { assert, createVmContext, loadSource, runScriptInContext } = require('./lib/test-helpers');

function runActivitySchedulerTests() {
  console.log('Running activity-scheduler unit tests...');

  const context = createVmContext({});
  const schedulerCode = loadSource(path.join('js', 'activity-scheduler.js'));
  runScriptInContext(schedulerCode, context, 'js/activity-scheduler.js');

  const getComparisonString = context.getComparisonString;
  const getSuggestedActivityDayText = context.getSuggestedActivityDayText;
  const getSuggestedActivityMatchTexts = context.getSuggestedActivityMatchTexts;
  const minutesToTimeValue = context.minutesToTimeValue;

  assert(typeof getComparisonString === 'function', 'getComparisonString should be exported as a function');
  assert(typeof getSuggestedActivityDayText === 'function', 'getSuggestedActivityDayText should be exported as a function');
  assert(typeof getSuggestedActivityMatchTexts === 'function', 'getSuggestedActivityMatchTexts should be exported as a function');
  assert(typeof minutesToTimeValue === 'function', 'minutesToTimeValue should be exported as a function');

  // ==========================================
  // 1. getComparisonString - Basic normalization
  // ==========================================
  assert(getComparisonString('Hello World') === 'helloworld', 'Should lowercase and remove spaces');
  assert(getComparisonString('  Tokyo - Station  ') === 'tokyostation', 'Should strip whitespace and hyphens');
  assert(getComparisonString('Louvre Museum (Paris)') === 'louvremuseumparis', 'Should remove parentheses');
  assert(getComparisonString('Coffee & Tea / Cake!') === 'coffeeteacake', 'Should remove punctuation and special symbols');
  assert(getComparisonString('123 Main St.#4') === '123mainst4', 'Should preserve alphanumeric characters including numbers');

  // ==========================================
  // 2. getComparisonString - Emoji removal
  // ==========================================
  assert(getComparisonString('🏛️ Louvre Museum') === 'louvremuseum', 'Should strip museum emoji and variation selector');
  assert(getComparisonString('🏃 Morning Jog') === 'morningjog', 'Should strip runner emoji');
  assert(getComparisonString('🍽️ Dinner at Bistro') === 'dinneratbistro', 'Should strip food emoji');
  assert(getComparisonString('🧘 Sunset Yoga') === 'sunsetyoga', 'Should strip lotus/yoga emoji');
  assert(getComparisonString('🇫🇷 Eiffel Tower') === 'eiffeltower', 'Should strip regional indicator country flag emoji');
  assert(getComparisonString('🇯🇵 Tokyo Tower') === 'tokyotower', 'Should strip flag emoji');
  assert(getComparisonString('🧘‍♀️ Yoga Class') === 'yogaclass', 'Should strip ZWJ female lotus emoji');
  assert(getComparisonString('🏃🏽‍♂️ Jogging') === 'jogging', 'Should strip ZWJ runner with skin tone modifier');
  assert(getComparisonString('✅ Done Task') === 'donetask', 'Should strip checkmark emoji');
  assert(getComparisonString('❌ Cancelled') === 'cancelled', 'Should strip cross mark emoji');

  // ==========================================
  // 3. getComparisonString - Mixed & Edge cases
  // ==========================================
  assert(getComparisonString('🏛️  🏃  Louvre Run!') === 'louvrerun', 'Should handle multiple emojis with spaces and punctuation');
  assert(getComparisonString('🏛️') === '', 'Emoji-only string should return empty string');
  assert(getComparisonString('!@#$%^&*()_+-=[]{}|;:\'",.<>/?') === '', 'Punctuation-only string should return empty string');
  assert(getComparisonString('') === '', 'Empty string should return empty string');
  assert(getComparisonString('   ') === '', 'Whitespace-only string should return empty string');

  // ==========================================
  // 4. getComparisonString - Non-string / falsy inputs
  // ==========================================
  assert(getComparisonString(null) === '', 'null input should return empty string');
  assert(getComparisonString(undefined) === '', 'undefined input should return empty string');
  assert(getComparisonString(false) === '', 'false input should return empty string');
  assert(getComparisonString(0) === '', 'falsy numeric 0 should return empty string');
  assert(getComparisonString(123) === '123', 'number 123 should return string "123"');
  assert(getComparisonString(true) === 'true', 'boolean true should return string "true"');
  assert(getComparisonString({ toString: () => '🏛️ Paris' }) === 'paris', 'object with custom toString should be processed');

  // ==========================================
  // 5. getSuggestedActivityDayText tests
  // ==========================================
  assert(getSuggestedActivityDayText({ title: ' Visit Louvre ' }) === 'Visit Louvre', 'Should trim title property');
  assert(getSuggestedActivityDayText({ title: '' }) === '', 'Empty title should return empty string');
  assert(getSuggestedActivityDayText(null) === '', 'null activity should return empty string');
  assert(getSuggestedActivityDayText(undefined) === '', 'undefined activity should return empty string');
  assert(getSuggestedActivityDayText({}) === '', 'Empty object activity should return empty string');

  // ==========================================
  // 6. getSuggestedActivityMatchTexts tests
  // ==========================================
  assert(
    JSON.stringify(getSuggestedActivityMatchTexts({ title: 'Eiffel Tower' })) === JSON.stringify(['Eiffel Tower']),
    'Should return unique array containing trimmed title'
  );
  assert(
    JSON.stringify(getSuggestedActivityMatchTexts(null)) === JSON.stringify([]),
    'null activity should return empty array'
  );
  assert(
    JSON.stringify(getSuggestedActivityMatchTexts({ title: '   ' })) === JSON.stringify([]),
    'Whitespace title activity should return empty array'
  );

  // ==========================================
  // 7. minutesToTimeValue - Standard conversions
  // ==========================================
  assert(minutesToTimeValue(0) === '00:00', '0 minutes should return "00:00"');
  assert(minutesToTimeValue(5) === '00:05', '5 minutes should return "00:05"');
  assert(minutesToTimeValue(90) === '01:30', '90 minutes should return "01:30"');
  assert(minutesToTimeValue(540) === '09:00', '540 minutes should return "09:00"');
  assert(minutesToTimeValue(755) === '12:35', '755 minutes should return "12:35"');
  assert(minutesToTimeValue(1439) === '23:59', '1439 minutes should return "23:59"');

  // ==========================================
  // 8. minutesToTimeValue - Rounding & numeric strings
  // ==========================================
  assert(minutesToTimeValue(90.4) === '01:30', '90.4 minutes should round down to "01:30"');
  assert(minutesToTimeValue(90.6) === '01:31', '90.6 minutes should round up to "01:31"');
  assert(minutesToTimeValue('90') === '01:30', 'String "90" should convert to "01:30"');
  assert(minutesToTimeValue(' 540 ') === '09:00', 'String with whitespace " 540 " should convert to "09:00"');

  // ==========================================
  // 9. minutesToTimeValue - Clamping (<0 and >=1440)
  // ==========================================
  assert(minutesToTimeValue(-10) === '00:00', 'Negative minutes should clamp to "00:00"');
  assert(minutesToTimeValue(1440) === '23:59', '1440 minutes (24h) should clamp to "23:59"');
  assert(minutesToTimeValue(2000) === '23:59', 'Minutes exceeding 1439 should clamp to "23:59"');

  // ==========================================
  // 10. minutesToTimeValue - Invalid and non-finite inputs
  // ==========================================
  assert(minutesToTimeValue(null) === '00:00', 'null should convert to 0 and return "00:00"');
  assert(minutesToTimeValue(undefined) === '', 'undefined should return empty string');
  assert(minutesToTimeValue(NaN) === '', 'NaN should return empty string');
  assert(minutesToTimeValue(Infinity) === '', 'Infinity should return empty string');
  assert(minutesToTimeValue(-Infinity) === '', '-Infinity should return empty string');
  assert(minutesToTimeValue('invalid') === '', 'Non-numeric string should return empty string');
  assert(minutesToTimeValue({}) === '', 'Object should return empty string');

  console.log('✅ ALL activity-scheduler UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runActivitySchedulerTests();
  } catch (err) {
    console.error(err.stack || err.message);
    process.exitCode = 1;
  }
}

module.exports = { runActivitySchedulerTests };
