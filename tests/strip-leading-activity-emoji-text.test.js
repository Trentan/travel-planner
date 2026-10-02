const path = require('path');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function runStripLeadingActivityEmojiTextTests() {
  console.log('Running stripLeadingActivityEmojiText unit tests...');

  const context = createVmContext({
    window: {},
    document: { getElementById: () => null, querySelectorAll: () => [] }
  });
  context.window = context;

  const utilsSource = loadSource(path.join('js', 'utils.js'));
  runScriptInContext(utilsSource, context, 'js/utils.js');

  const stripLeadingActivityEmojiText = context.window.stripLeadingActivityEmojiText;
  assert(
    typeof stripLeadingActivityEmojiText === 'function',
    'stripLeadingActivityEmojiText should be exported on window'
  );

  // 1. Single activity category emojis with space
  assert(
    stripLeadingActivityEmojiText('🏛️ Louvre Museum') === 'Louvre Museum',
    'Should strip 🏛️ category emoji with space'
  );
  assert(
    stripLeadingActivityEmojiText('🏃 Morning Run') === 'Morning Run',
    'Should strip 🏃 category emoji with space'
  );
  assert(
    stripLeadingActivityEmojiText('🍽️ Dinner at Bistro') === 'Dinner at Bistro',
    'Should strip 🍽️ category emoji with space'
  );
  assert(
    stripLeadingActivityEmojiText('🎢 Theme Park Ride') === 'Theme Park Ride',
    'Should strip 🎢 category emoji with space'
  );
  assert(
    stripLeadingActivityEmojiText('🧘 Meditation Class') === 'Meditation Class',
    'Should strip 🧘 category emoji with space'
  );
  assert(
    stripLeadingActivityEmojiText('🚌 City Bus Tour') === 'City Bus Tour',
    'Should strip 🚌 category emoji with space'
  );
  assert(
    stripLeadingActivityEmojiText('🗓️ Concert Event') === 'Concert Event',
    'Should strip 🗓️ category emoji with space'
  );
  assert(
    stripLeadingActivityEmojiText('🎧 Audio Walk') === 'Audio Walk',
    'Should strip 🎧 category emoji with space'
  );
  assert(
    stripLeadingActivityEmojiText('📍 Central Station') === 'Central Station',
    'Should strip 📍 fallback pin emoji with space'
  );

  // 2. Single emoji without space following
  assert(
    stripLeadingActivityEmojiText('🏃Run') === 'Run',
    'Should strip leading emoji even if no space follows'
  );
  assert(
    stripLeadingActivityEmojiText('🏛️Louvre') === 'Louvre',
    'Should strip leading emoji with variation selector when directly adjacent to text'
  );

  // 3. Multiple consecutive leading emojis
  assert(
    stripLeadingActivityEmojiText('🏛️🏃 Louvre Run') === 'Louvre Run',
    'Should strip multiple consecutive leading emojis'
  );
  assert(
    stripLeadingActivityEmojiText('🏛️  🏃  Louvre Run') === 'Louvre Run',
    'Should strip multiple leading emojis separated by spaces'
  );

  // 4. Emojis with variation selectors (\uFE0F), ZWJ sequences, skin tones, status indicators, and flags
  assert(
    stripLeadingActivityEmojiText('🧘‍♀️ Evening Yoga') === 'Evening Yoga',
    'Should strip ZWJ female person in lotus position emoji'
  );
  assert(
    stripLeadingActivityEmojiText('🧘🏽‍♀️ Sunset Yoga') === 'Sunset Yoga',
    'Should strip ZWJ female person in lotus position with skin tone modifier'
  );
  assert(
    stripLeadingActivityEmojiText('🏃🏽‍♂️ Morning Jog') === 'Morning Jog',
    'Should strip ZWJ man running emoji with skin tone modifier'
  );
  assert(
    stripLeadingActivityEmojiText('🇫🇷 Eiffel Tower') === 'Eiffel Tower',
    'Should strip regional indicator country flag emoji'
  );
  assert(
    stripLeadingActivityEmojiText('🇯🇵 Tokyo Tower') === 'Tokyo Tower',
    'Should strip country flag emoji'
  );
  assert(
    stripLeadingActivityEmojiText('🏴󠁧󠁢󠁥󠁮󠁧󠁿 Big Ben') === 'Big Ben',
    'Should strip subdivision flag emoji'
  );
  assert(
    stripLeadingActivityEmojiText('✅ Done Task') === 'Done Task',
    'Should strip heavy checkmark emoji'
  );
  assert(
    stripLeadingActivityEmojiText('❌ Cancelled Booking') === 'Cancelled Booking',
    'Should strip cross mark emoji'
  );

  // 5. Punctuation or digits immediately following leading emoji
  assert(
    stripLeadingActivityEmojiText('🏛️: Louvre Museum') === ': Louvre Museum',
    'Should strip leading emoji leaving colon attached to text'
  );
  assert(
    stripLeadingActivityEmojiText('🏃- Morning Run') === '- Morning Run',
    'Should strip leading emoji leaving hyphen attached to text'
  );
  assert(
    stripLeadingActivityEmojiText('🍽️, Fine Dining') === ', Fine Dining',
    'Should strip leading emoji leaving comma attached to text'
  );
  assert(
    stripLeadingActivityEmojiText('🏛️123 Main St') === '123 Main St',
    'Should strip leading emoji leaving digits attached'
  );

  // 6. Non-standard whitespace (tabs, newlines, non-breaking spaces)
  assert(
    stripLeadingActivityEmojiText('\n\t  🏛️  Louvre Museum  \n') === 'Louvre Museum',
    'Should handle leading/trailing tabs and newlines around emoji and text'
  );
  assert(
    stripLeadingActivityEmojiText('🏛️\nLouvre Museum') === 'Louvre Museum',
    'Should strip leading emoji separated from text by newline'
  );
  assert(
    stripLeadingActivityEmojiText('\u00A0🏛️\u00A0Louvre Museum\u00A0') === 'Louvre Museum',
    'Should trim non-breaking space characters'
  );

  // 7. Non-leading emojis (in middle or end of string) or wrapped emojis must be preserved
  assert(
    stripLeadingActivityEmojiText('Visit 🏛️ Louvre') === 'Visit 🏛️ Louvre',
    'Should preserve emoji in middle of text'
  );
  assert(
    stripLeadingActivityEmojiText('Louvre Museum 🏛️') === 'Louvre Museum 🏛️',
    'Should preserve emoji at end of text'
  );
  assert(
    stripLeadingActivityEmojiText('Dinner 🍽️ and Drinks 🍷') === 'Dinner 🍽️ and Drinks 🍷',
    'Should preserve multiple emojis in middle/end of text'
  );
  assert(
    stripLeadingActivityEmojiText('(🏛️) Louvre') === '(🏛️) Louvre',
    'Should preserve emoji wrapped in parenthesis at start'
  );
  assert(
    stripLeadingActivityEmojiText('@🏛️ Louvre') === '@🏛️ Louvre',
    'Should preserve emoji preceded by symbol at start'
  );

  // 8. Edge cases: emoji-only, whitespace, plain text, and numbers/punctuation
  assert(
    stripLeadingActivityEmojiText('🏛️') === '',
    'Should return empty string when input contains only an emoji'
  );
  assert(
    stripLeadingActivityEmojiText('🏛️ 🏃 🍽️') === '',
    'Should return empty string when input contains only emojis and spaces'
  );
  assert(
    stripLeadingActivityEmojiText('Plain Text') === 'Plain Text',
    'Should return original plain text unchanged'
  );
  assert(
    stripLeadingActivityEmojiText('  🏛️ Louvre Museum  ') === 'Louvre Museum',
    'Should handle leading and trailing whitespace around emoji and text'
  );
  assert(
    stripLeadingActivityEmojiText('1. First Item') === '1. First Item',
    'Should not modify text starting with numbers/punctuation'
  );

  // 9. Falsy, non-string primitives, and objects
  assert(
    stripLeadingActivityEmojiText('') === '',
    'Should return empty string for empty input'
  );
  assert(
    stripLeadingActivityEmojiText('   ') === '',
    'Should return empty string for whitespace-only input'
  );
  assert(
    stripLeadingActivityEmojiText(null) === '',
    'Should return empty string for null input'
  );
  assert(
    stripLeadingActivityEmojiText(undefined) === '',
    'Should return empty string for undefined input'
  );
  assert(
    stripLeadingActivityEmojiText(false) === '',
    'Should return empty string for false input'
  );
  assert(
    stripLeadingActivityEmojiText(0) === '',
    'Should return empty string for 0 input'
  );
  assert(
    stripLeadingActivityEmojiText(true) === 'true',
    'Should stringify boolean true input'
  );
  assert(
    stripLeadingActivityEmojiText(100) === '100',
    'Should stringify positive number input'
  );
  assert(
    stripLeadingActivityEmojiText(-5.5) === '-5.5',
    'Should stringify negative float input'
  );
  assert(
    stripLeadingActivityEmojiText({ toString: () => '🏛️ Louvre' }) === 'Louvre',
    'Should stringify object with custom toString'
  );
  assert(
    stripLeadingActivityEmojiText(['🏛️ Louvre']) === 'Louvre',
    'Should stringify array input'
  );
  assert(
    stripLeadingActivityEmojiText(NaN) === '',
    'Should return empty string for NaN input'
  );

  console.log('✅ ALL stripLeadingActivityEmojiText UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runStripLeadingActivityEmojiTextTests();
  } catch (err) {
    console.error('❌ stripLeadingActivityEmojiText TEST FAILED:', err.message);
    process.exit(1);
  }
}

module.exports = { runStripLeadingActivityEmojiTextTests };
