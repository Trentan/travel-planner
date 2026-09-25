const path = require('path');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function runGetActivityEmojiTests() {
  console.log('Running getActivityEmoji and getActivityLabel unit tests...');

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
    addEventListener() {}
  });
  context.window = context;

  const utilsSource = loadSource(path.join('js', 'utils.js'));
  runScriptInContext(utilsSource, context, 'js/utils.js');

  const getActivityEmoji = context.getActivityEmoji;
  const getActivityLabel = context.getActivityLabel;

  assert(typeof getActivityEmoji === 'function', 'getActivityEmoji should be available in context');
  assert(typeof getActivityLabel === 'function', 'getActivityLabel should be available in context');

  // 1. Known activity categories - getActivityEmoji
  assert(getActivityEmoji('fitness') === '🏃', 'fitness should return 🏃');
  assert(getActivityEmoji('sight') === '🏛️', 'sight should return 🏛️');
  assert(getActivityEmoji('attraction') === '🎢', 'attraction should return 🎢');
  assert(getActivityEmoji('wellness') === '🧘', 'wellness should return 🧘');
  assert(getActivityEmoji('food') === '🍽️', 'food should return 🍽️');
  assert(getActivityEmoji('tour') === '🚌', 'tour should return 🚌');
  assert(getActivityEmoji('event') === '🗓️', 'event should return 🗓️');
  assert(getActivityEmoji('audioTour') === '🎧', 'audioTour should return 🎧');

  // 2. Fallback / Unknown / Edge cases - getActivityEmoji
  assert(getActivityEmoji('unknownCategory') === '📍', 'Unknown category should return fallback emoji 📍');
  assert(getActivityEmoji('') === '📍', 'Empty string category should return fallback emoji 📍');
  assert(getActivityEmoji(null) === '📍', 'null category should return fallback emoji 📍');
  assert(getActivityEmoji(undefined) === '📍', 'undefined category should return fallback emoji 📍');
  assert(getActivityEmoji(123) === '📍', 'Numeric category should return fallback emoji 📍');
  assert(getActivityEmoji({}) === '📍', 'Object category should return fallback emoji 📍');

  // 3. Known activity categories - getActivityLabel
  assert(getActivityLabel('fitness') === 'Fitness', 'fitness should return "Fitness"');
  assert(getActivityLabel('sight') === 'Sights', 'sight should return "Sights"');
  assert(getActivityLabel('attraction') === 'Attractions', 'attraction should return "Attractions"');
  assert(getActivityLabel('wellness') === 'Wellness', 'wellness should return "Wellness"');
  assert(getActivityLabel('food') === 'Food', 'food should return "Food"');
  assert(getActivityLabel('tour') === 'Tour', 'tour should return "Tour"');
  assert(getActivityLabel('event') === 'Event', 'event should return "Event"');
  assert(getActivityLabel('audioTour') === 'Audio Tour', 'audioTour should return "Audio Tour"');

  // 4. Fallback / Unknown / Edge cases - getActivityLabel
  assert(getActivityLabel('unknownCategory') === 'Activity', 'Unknown category should return fallback label "Activity"');
  assert(getActivityLabel('') === 'Activity', 'Empty string category should return fallback label "Activity"');
  assert(getActivityLabel(null) === 'Activity', 'null category should return fallback label "Activity"');
  assert(getActivityLabel(undefined) === 'Activity', 'undefined category should return fallback label "Activity"');
  assert(getActivityLabel(123) === 'Activity', 'Numeric category should return fallback label "Activity"');
  assert(getActivityLabel({}) === 'Activity', 'Object category should return fallback label "Activity"');

  console.log('✅ ALL getActivityEmoji AND getActivityLabel UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runGetActivityEmojiTests();
  } catch (err) {
    console.error('❌ getActivityEmoji TEST FAILED:', err.message);
    process.exit(1);
  }
}

module.exports = { runGetActivityEmojiTests };
