const path = require('path');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function runParseCurrencyAmountTests() {
  console.log('Running parseCurrencyAmount unit tests...');

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

  const parseCurrencyAmount = context.window.parseCurrencyAmount;
  assert(typeof parseCurrencyAmount === 'function', 'parseCurrencyAmount should be exported on window');

  // 1. Standard numbers and numeric strings
  assert(parseCurrencyAmount(123) === 123, 'Direct number 123 should return 123');
  assert(parseCurrencyAmount(45.67) === 45.67, 'Direct float 45.67 should return 45.67');
  assert(parseCurrencyAmount(0) === 0, 'Direct number 0 should return 0');
  assert(parseCurrencyAmount('123') === 123, 'String "123" should return 123');
  assert(parseCurrencyAmount('45.67') === 45.67, 'String "45.67" should return 45.67');

  // 2. Formatted currency strings with symbols and commas
  assert(parseCurrencyAmount('$100') === 100, 'Currency "$100" should return 100');
  assert(parseCurrencyAmount('$1,234.56') === 1234.56, 'Formatted "$1,234.56" should return 1234.56');
  assert(parseCurrencyAmount('€50.25') === 50.25, 'Euro "€50.25" should return 50.25');
  assert(parseCurrencyAmount('£1,000') === 1000, 'Pound "£1,000" should return 1000');
  assert(parseCurrencyAmount('¥500') === 500, 'Yen "¥500" should return 500');
  assert(parseCurrencyAmount('  $100.50  ') === 100.5, 'String with leading/trailing whitespace should return 100.5');
  assert(parseCurrencyAmount('AUD 250.00') === 250, 'String "AUD 250.00" should return 250');
  assert(parseCurrencyAmount('100 USD') === 100, 'String "100 USD" should return 100');

  // 3. Negative values and signs
  assert(parseCurrencyAmount(-15.5) === -15.5, 'Negative float -15.5 should return -15.5');
  assert(parseCurrencyAmount('-50.25') === -50.25, 'Negative string "-50.25" should return -50.25');
  assert(parseCurrencyAmount('-$50.25') === -50.25, 'Negative currency "-$50.25" should return -50.25');
  assert(parseCurrencyAmount('-$1,200.50') === -1200.5, 'Negative formatted "-$1,200.50" should return -1200.5');

  // 4. Null, undefined, and empty values
  assert(parseCurrencyAmount(null) === 0, 'null input should return 0');
  assert(parseCurrencyAmount(undefined) === 0, 'undefined input should return 0');
  assert(parseCurrencyAmount('') === 0, 'Empty string should return 0');

  // 5. Invalid non-numeric inputs
  assert(parseCurrencyAmount('abc') === 0, 'Non-numeric string "abc" should return 0');
  assert(parseCurrencyAmount('$$$') === 0, 'Symbols-only string "$$$" should return 0');
  assert(parseCurrencyAmount('---') === 0, 'Dashes-only string "---" should return 0');
  assert(parseCurrencyAmount(NaN) === 0, 'NaN input should return 0');
  assert(parseCurrencyAmount(Infinity) === 0, 'Infinity input should return 0');
  assert(parseCurrencyAmount(-Infinity) === 0, '-Infinity input should return 0');

  // 6. Objects and edge cases
  assert(parseCurrencyAmount({}) === 0, 'Empty object should return 0');
  assert(parseCurrencyAmount([]) === 0, 'Empty array should return 0');
  assert(parseCurrencyAmount([100]) === 100, 'Array with single number [100] should return 100');

  console.log('✅ ALL parseCurrencyAmount UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runParseCurrencyAmountTests();
  } catch (err) {
    console.error('❌ parseCurrencyAmount TEST FAILED:', err.message);
    process.exit(1);
  }
}

module.exports = { runParseCurrencyAmountTests };
