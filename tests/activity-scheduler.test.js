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
  const timeValueToMinutes = context.timeValueToMinutes;

  assert(typeof getComparisonString === 'function', 'getComparisonString should be exported as a function');
  assert(typeof getSuggestedActivityDayText === 'function', 'getSuggestedActivityDayText should be exported as a function');
  assert(typeof getSuggestedActivityMatchTexts === 'function', 'getSuggestedActivityMatchTexts should be exported as a function');
  assert(typeof timeValueToMinutes === 'function', 'timeValueToMinutes should be exported as a function');

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
  // 7. timeValueToMinutes - Valid 24-hour time strings
  // ==========================================
  assert(timeValueToMinutes('00:00') === 0, '00:00 should return 0 minutes');
  assert(timeValueToMinutes('00:01') === 1, '00:01 should return 1 minute');
  assert(timeValueToMinutes('09:30') === 570, '09:30 should return 570 minutes');
  assert(timeValueToMinutes('12:00') === 720, '12:00 should return 720 minutes');
  assert(timeValueToMinutes('14:15') === 855, '14:15 should return 855 minutes');
  assert(timeValueToMinutes('23:59') === 1439, '23:59 should return 1439 minutes');

  // ==========================================
  // 8. timeValueToMinutes - Single digit hours & whitespace
  // ==========================================
  assert(timeValueToMinutes('0:00') === 0, '0:00 should return 0 minutes');
  assert(timeValueToMinutes('9:05') === 545, '9:05 should return 545 minutes');
  assert(timeValueToMinutes('1:30') === 90, '1:30 should return 90 minutes');
  assert(timeValueToMinutes('  14:15  ') === 855, 'Should trim surrounding whitespace');
  assert(timeValueToMinutes('\t08:00\n') === 480, 'Should trim tabs and newlines');

  // ==========================================
  // 9. timeValueToMinutes - Out of bounds hours or minutes
  // ==========================================
  assert(timeValueToMinutes('24:00') === null, '24:00 should return null (hours > 23)');
  assert(timeValueToMinutes('25:30') === null, '25:30 should return null (hours > 23)');
  assert(timeValueToMinutes('99:00') === null, '99:00 should return null (hours > 23)');
  assert(timeValueToMinutes('12:60') === null, '12:60 should return null (minutes > 59)');
  assert(timeValueToMinutes('09:99') === null, '09:99 should return null (minutes > 59)');

  // ==========================================
  // 10. timeValueToMinutes - Invalid time string formats
  // ==========================================
  assert(timeValueToMinutes('12') === null, '12 without minutes should return null');
  assert(timeValueToMinutes('12:3') === null, '12:3 single digit minute should return null');
  assert(timeValueToMinutes('12:345') === null, '12:345 three digit minute should return null');
  assert(timeValueToMinutes('abc') === null, 'Non-time string should return null');
  assert(timeValueToMinutes('12:3a') === null, 'Alphanumeric minute should return null');
  assert(timeValueToMinutes('12.34') === null, 'Period delimiter should return null');
  assert(timeValueToMinutes('12-34') === null, 'Hyphen delimiter should return null');
  assert(timeValueToMinutes('9:00 AM') === null, '12-hour AM/PM format should return null');
  assert(timeValueToMinutes('12:30 PM') === null, '12-hour AM/PM format should return null');

  // ==========================================
  // 11. timeValueToMinutes - Non-string / falsy / edge case inputs
  // ==========================================
  assert(timeValueToMinutes(null) === null, 'null input should return null');
  assert(timeValueToMinutes(undefined) === null, 'undefined input should return null');
  assert(timeValueToMinutes('') === null, 'Empty string should return null');
  assert(timeValueToMinutes('   ') === null, 'Whitespace-only string should return null');
  assert(timeValueToMinutes(false) === null, 'false input should return null');
  assert(timeValueToMinutes(0) === null, 'numeric 0 should return null');
  assert(timeValueToMinutes(NaN) === null, 'NaN should return null');
  assert(timeValueToMinutes({ toString: () => '10:15' }) === 615, 'Object with toString returning time string should work');

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
