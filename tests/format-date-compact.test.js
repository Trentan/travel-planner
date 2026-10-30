const path = require('path');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function runFormatDateCompactTests() {
  console.log('Running formatDateCompact unit tests...');

  const context = createVmContext({
    Date,
    window: {},
    document: { getElementById: () => null, querySelectorAll: () => [] }
  });
  context.window = context;

  const utilsSource = loadSource(path.join('js', 'utils.js'));
  runScriptInContext(utilsSource, context, 'js/utils.js');

  const formatDateCompact = context.window.formatDateCompact;
  assert(typeof formatDateCompact === 'function', 'formatDateCompact should be exported on window');

  // 1. Falsy inputs
  assert(formatDateCompact('') === '', 'Empty string should return empty string');
  assert(formatDateCompact(null) === '', 'null should return empty string');
  assert(formatDateCompact(undefined) === '', 'undefined should return empty string');
  assert(formatDateCompact(0) === '', '0 should return empty string');
  assert(formatDateCompact(false) === '', 'false should return empty string');

  // 2. Valid date strings
  assert(formatDateCompact('2026-05-15') === 'May 15', 'Should format valid ISO date string "2026-05-15" to "May 15"');
  assert(formatDateCompact('2025-01-01') === 'Jan 01', 'Should format valid ISO date string "2025-01-01" to "Jan 01"');
  assert(formatDateCompact('2024-12-31') === 'Dec 31', 'Should format valid ISO date string "2024-12-31" to "Dec 31"');

  // 3. Malformed / invalid date strings
  assert(formatDateCompact('invalid-date-string') === '', 'Invalid date string should return empty string');
  assert(formatDateCompact('2026-99-99') === '', 'Out-of-range date string should return empty string');
  assert(formatDateCompact('abc') === '', 'Arbitrary text should return empty string');

  // 4. Error / exception throwing inputs
  const throwingObj = {
    toString() {
      throw new Error('Simulated toString error during Date parsing');
    }
  };
  assert(formatDateCompact(throwingObj) === '', 'Object with throwing toString should be caught and return empty string');

  // Simulated exception in Date prototype method (e.g., toDateString throwing)
  const origToDateString = context.Date.prototype.toDateString;
  try {
    context.Date.prototype.toDateString = function() {
      throw new Error('Simulated toDateString exception');
    };
    assert(formatDateCompact('2026-05-15') === '', 'Exception thrown by toDateString should be caught and return empty string');
  } finally {
    context.Date.prototype.toDateString = origToDateString;
  }

  console.log('✅ ALL formatDateCompact UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runFormatDateCompactTests();
  } catch (err) {
    console.error('❌ formatDateCompact TEST FAILED:', err.message);
    process.exit(1);
  }
}

module.exports = { runFormatDateCompactTests };
