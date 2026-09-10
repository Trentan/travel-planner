const fs = require('fs');
const path = require('path');
const { assert, createVmContext, runScriptInContext } = require('./lib/test-helpers');

async function runCompactFoodQuestTitleTests() {
  console.log('Running getCompactFoodQuestTitle unit tests...');

  const itineraryCode = fs.readFileSync(path.join(__dirname, '../js/itinerary.js'), 'utf8');

  const documentMock = {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {}
  };

  const windowMock = {
    document: documentMock,
    addEventListener: () => {},
    removeEventListener: () => {}
  };

  const context = createVmContext({
    document: documentMock,
    window: windowMock,
    appData: [],
    journeys: [],
    stays: [],
    isEditMode: false
  });

  runScriptInContext(itineraryCode, context, 'js/itinerary.js');
  const getCompactFoodQuestTitle = context.getCompactFoodQuestTitle;

  assert(typeof getCompactFoodQuestTitle === 'function', 'getCompactFoodQuestTitle should be defined as a function');

  // 1. Basic inputs
  assert(
    getCompactFoodQuestTitle('Tokyo') === 'Tokyo - Food Quest',
    'Standard city name should format correctly'
  );
  assert(
    getCompactFoodQuestTitle('Paris (France)') === 'Paris (France) - Food Quest',
    'Labels with parentheses should retain parentheses'
  );
  assert(
    getCompactFoodQuestTitle('Food & Drinks') === 'Food & Drinks - Food Quest',
    'Labels with ampersands should retain ampersands'
  );
  assert(
    getCompactFoodQuestTitle('Ramen, Sushi, Tempura') === 'Ramen, Sushi, Tempura - Food Quest',
    'Labels with commas should retain commas'
  );

  // 2. Falsy and empty values
  assert(
    getCompactFoodQuestTitle('') === 'Food - Food Quest',
    'Empty string should fallback to Food - Food Quest'
  );
  assert(
    getCompactFoodQuestTitle(null) === 'Food - Food Quest',
    'null should fallback to Food - Food Quest'
  );
  assert(
    getCompactFoodQuestTitle(undefined) === 'Food - Food Quest',
    'undefined should fallback to Food - Food Quest'
  );
  assert(
    getCompactFoodQuestTitle('   ') === 'Food - Food Quest',
    'Whitespace-only string should fallback to Food - Food Quest'
  );

  // 3. Emoji removal (flags, pictographs, symbols)
  assert(
    getCompactFoodQuestTitle('🇯🇵 Tokyo 🍜') === 'Tokyo - Food Quest',
    'Flags and food emojis should be removed'
  );
  assert(
    getCompactFoodQuestTitle('🍕 Pizza & Pasta 🇮🇹') === 'Pizza & Pasta - Food Quest',
    'Emojis at beginning and end should be stripped'
  );
  assert(
    getCompactFoodQuestTitle('✨ Stars ⭐️') === 'Stars - Food Quest',
    'Symbol emojis should be stripped'
  );

  // 4. Arrow and hyphen suffix stripping
  assert(
    getCompactFoodQuestTitle('Bangkok → Chiang Mai') === 'Bangkok - Food Quest',
    '→ arrow suffix should be stripped'
  );
  assert(
    getCompactFoodQuestTitle('Kyoto > Osaka') === 'Kyoto - Food Quest',
    '> arrow suffix should be stripped'
  );
  assert(
    getCompactFoodQuestTitle('Rome - Florence') === 'Rome - Food Quest',
    'Hyphen suffix should be stripped'
  );

  // 5. Special character sanitization and whitespace collapsing
  assert(
    getCompactFoodQuestTitle('Seoul!!!') === 'Seoul - Food Quest',
    'Exclamation marks should be sanitized out'
  );
  assert(
    getCompactFoodQuestTitle('  Osaka   Street   Food  ') === 'Osaka Street Food - Food Quest',
    'Excess whitespace should be collapsed and trimmed'
  );

  // 6. Non-word/Emoji only inputs falling back to Food
  assert(
    getCompactFoodQuestTitle('🍣🍜🍱') === 'Food - Food Quest',
    'Emoji-only string should fallback to Food - Food Quest'
  );
  assert(
    getCompactFoodQuestTitle('!!! @@@ ###') === 'Food - Food Quest',
    'Special-character-only string should fallback to Food - Food Quest'
  );

  console.log('✅ ALL getCompactFoodQuestTitle UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  runCompactFoodQuestTitleTests().catch(error => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}

module.exports = { runCompactFoodQuestTitleTests };
