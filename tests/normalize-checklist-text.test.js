const path = require('path');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function runNormalizeChecklistTextTests() {
  console.log('Running normalizeChecklistText unit tests...');

  const context = createVmContext({
    window: {},
    document: { getElementById: () => null, querySelectorAll: () => [] }
  });
  context.window = context;

  const utilsSource = loadSource(path.join('js', 'utils.js'));
  runScriptInContext(utilsSource, context, 'js/utils.js');

  const normalizeChecklistText = context.window.normalizeChecklistText;

  assert(typeof normalizeChecklistText === 'function', 'normalizeChecklistText should be exported on window');

  // 1. Falsy, null, undefined, empty, and whitespace-only inputs
  assert(normalizeChecklistText(null) === '', 'null input should return empty string');
  assert(normalizeChecklistText(undefined) === '', 'undefined input should return empty string');
  assert(normalizeChecklistText('') === '', 'empty string input should return empty string');
  assert(normalizeChecklistText('   ') === '', 'whitespace string should return empty string');
  assert(normalizeChecklistText('\t\n\r  ') === '', 'whitespace with tabs/newlines should return empty string');
  assert(normalizeChecklistText(0) === '', '0 input (falsy) should return empty string');
  assert(normalizeChecklistText(false) === '', 'false input (falsy) should return empty string');

  // 2. Trimming and lowercasing
  assert(normalizeChecklistText('Check all power outlets') === 'check all power outlets', 'lowercase string should remain unchanged');
  assert(normalizeChecklistText('  Check ALL Power Outlets  ') === 'check all power outlets', 'should trim and convert to lower case');
  assert(normalizeChecklistText('RETURN ROOM KEYS') === 'return room keys', 'all uppercase should convert to lower case');

  // 3. Collapsing multiple internal whitespaces, tabs, and newlines
  assert(normalizeChecklistText('Check    drawers   and   closets') === 'check drawers and closets', 'should collapse multiple spaces into single space');
  assert(normalizeChecklistText('  Check\tthe\tbathroom  ') === 'check the bathroom', 'should collapse tab characters into single space');
  assert(normalizeChecklistText('Check\nall\r\nlights') === 'check all lights', 'should collapse newlines into single space');
  assert(normalizeChecklistText('  Empty \n \t  fridge  \r  and   pantry  ') === 'empty fridge and pantry', 'should collapse mixed whitespace into single spaces');

  // 4. Truthy non-string primitive inputs (numbers, booleans)
  assert(normalizeChecklistText(12345) === '12345', 'Number 12345 should convert to "12345"');
  assert(normalizeChecklistText(true) === 'true', 'Boolean true should convert to "true"');

  // 5. Special characters, punctuation, non-ASCII accents, and emojis
  assert(normalizeChecklistText('  Lock ALL doors & windows!  ') === 'lock all doors & windows!', 'punctuation and symbols should be preserved');
  assert(normalizeChecklistText('  Pássports & Hôtel keys  ') === 'pássports & hôtel keys', 'non-ASCII characters and accents should be preserved');
  assert(normalizeChecklistText('  🧳  Pack   Carry-on   Bag  ') === '🧳 pack carry-on bag', 'emojis and hyphens should be preserved with normalized spaces');

  console.log('✅ ALL normalizeChecklistText UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runNormalizeChecklistTextTests();
  } catch (err) {
    console.error('❌ normalizeChecklistText TEST FAILED:', err.message);
    process.exit(1);
  }
}

module.exports = { runNormalizeChecklistTextTests };
