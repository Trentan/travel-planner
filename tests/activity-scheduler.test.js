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
  const activityLooksLikeMeal = context.activityLooksLikeMeal;

  assert(typeof getComparisonString === 'function', 'getComparisonString should be exported as a function');
  assert(typeof getSuggestedActivityDayText === 'function', 'getSuggestedActivityDayText should be exported as a function');
  assert(typeof getSuggestedActivityMatchTexts === 'function', 'getSuggestedActivityMatchTexts should be exported as a function');
  assert(typeof activityLooksLikeMeal === 'function', 'activityLooksLikeMeal should be exported as a function');

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
  // 7. activityLooksLikeMeal tests
  // ==========================================
  const breakfastPattern = /\b(breakfast|coffee|cafe|bakery|brunch)\b/;
  const lunchPattern = /\b(lunch|restaurant|food|market)\b/;
  const dinnerPattern = /\b(dinner|supper|bar|drinks|night)\b/;

  // Title matching
  assert(activityLooksLikeMeal({ title: 'Morning Coffee' }, breakfastPattern) === true, 'Should match breakfast pattern on title');
  assert(activityLooksLikeMeal({ title: 'DINNER AT BISTRO' }, dinnerPattern) === true, 'Should match dinner pattern on uppercase title');

  // Text fallback matching when title is absent or empty
  assert(activityLooksLikeMeal({ text: 'Quick Lunch' }, lunchPattern) === true, 'Should match lunch pattern on text fallback');
  assert(activityLooksLikeMeal({ title: '', text: 'Croissant at Bakery' }, breakfastPattern) === true, 'Should fall back to text when title is empty');

  // Category matching
  assert(activityLooksLikeMeal({ title: 'Chez Paul', category: 'Restaurant' }, lunchPattern) === true, 'Should match meal pattern on category');
  assert(activityLooksLikeMeal({ text: 'Nightcap', category: 'Bar' }, dinnerPattern) === true, 'Should match meal pattern on category with text');

  // Non-matching activity
  assert(activityLooksLikeMeal({ title: 'Louvre Museum Visit', category: 'Sightseeing' }, lunchPattern) === false, 'Should return false for non-meal activity');
  assert(activityLooksLikeMeal({ title: 'Park Walk' }, breakfastPattern) === false, 'Should return false when title/category does not match pattern');

  // Null, undefined, empty object inputs
  assert(activityLooksLikeMeal(null, lunchPattern) === false, 'null activity should return false');
  assert(activityLooksLikeMeal(undefined, dinnerPattern) === false, 'undefined activity should return false');
  assert(activityLooksLikeMeal({}, breakfastPattern) === false, 'empty activity object should return false');

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
