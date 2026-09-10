const path = require('path');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function runFormatCurrencyTests() {
  console.log('Running formatCurrency unit tests...');

  const context = createVmContext({
    window: {},
    document: { getElementById: () => null, querySelectorAll: () => [] }
  });
  context.window = context;

  const utilsSource = loadSource(path.join('js', 'utils.js'));
  runScriptInContext(utilsSource, context, 'js/utils.js');

  const formatCurrency = context.window.formatCurrency;
  assert(typeof formatCurrency === 'function', 'formatCurrency should be exported on window');

  // 1. Basic numbers
  assert(formatCurrency(100) === '$100', 'Should format integer with default options');
  assert(formatCurrency(123.45) === '$123.45', 'Should format float with default options');
  assert(formatCurrency(123.4) === '$123.40', 'Should format 1 decimal place float with 2 fraction digits by default');
  assert(formatCurrency(0) === '$0', 'Should format 0 as $0 by default');
  assert(formatCurrency(-50.25) === '$-50.25', 'Should format negative number');

  // 2. String inputs and unparsed amounts
  assert(formatCurrency('100') === '$100', 'Should parse string integer');
  assert(formatCurrency('123.45') === '$123.45', 'Should parse string float');
  assert(formatCurrency('$1,234.56') === '$1,234.56', 'Should handle pre-formatted currency string with commas');
  assert(formatCurrency('  $250.75  ') === '$250.75', 'Should handle whitespace around amount');
  assert(formatCurrency('') === '$0', 'Should treat empty string as 0');
  assert(formatCurrency('invalid') === '$0', 'Should treat invalid non-numeric string as 0');
  assert(formatCurrency(null) === '$0', 'Should treat null as 0');
  assert(formatCurrency(undefined) === '$0', 'Should treat undefined as 0');

  // 3. Option: showZero
  assert(formatCurrency(0, { showZero: true }) === '$0', 'Should return $0 when showZero is true');
  assert(formatCurrency(0, { showZero: false }) === '', 'Should return empty string when showZero is false and amount is 0');
  assert(formatCurrency('0.00', { showZero: false }) === '', 'Should return empty string when showZero is false for "0.00"');
  assert(formatCurrency(10, { showZero: false }) === '$10', 'Should return formatted value when showZero is false but amount is non-zero');

  // 4. Option: includeSymbol
  assert(formatCurrency(100, { includeSymbol: false }) === '100', 'Should omit dollar sign when includeSymbol is false');
  assert(formatCurrency(123.45, { includeSymbol: false }) === '123.45', 'Should omit dollar sign for floats when includeSymbol is false');
  assert(formatCurrency(0, { includeSymbol: false }) === '0', 'Should omit dollar sign for zero when includeSymbol is false');

  // 5. Options: minimumFractionDigits and maximumFractionDigits
  assert(formatCurrency(100, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) === '$100.00', 'Should respect minimumFractionDigits = 2 for integer');
  assert(formatCurrency(123.456, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) === '$123.46', 'Should round to maximumFractionDigits');
  assert(formatCurrency(123.4, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) === '$123', 'Should format to 0 fraction digits when requested');
  assert(formatCurrency(100, { minimumFractionDigits: 3, maximumFractionDigits: 3 }) === '$100.000', 'Should format to 3 fraction digits when requested');

  // 6. Combined Options
  assert(
    formatCurrency(0, { showZero: false, includeSymbol: false }) === '',
    'Should return empty string when showZero is false and includeSymbol is false for 0'
  );
  assert(
    formatCurrency(1234.5, { includeSymbol: false, minimumFractionDigits: 2, maximumFractionDigits: 2 }) === '1,234.50',
    'Should format non-zero amount with commas and no dollar sign when requested'
  );

  console.log('✅ ALL formatCurrency UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runFormatCurrencyTests();
  } catch (err) {
    console.error('❌ formatCurrency TEST FAILED:', err.message);
    process.exit(1);
  }
}

module.exports = { runFormatCurrencyTests };
