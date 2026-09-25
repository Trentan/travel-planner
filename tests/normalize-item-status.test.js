const path = require('path');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function runNormalizeItemStatusTests() {
  console.log('Running normalizeItemStatus unit tests...');

  const context = createVmContext({
    window: {},
    document: { getElementById: () => null, querySelectorAll: () => [] }
  });
  context.window = context;

  const utilsSource = loadSource(path.join('js', 'utils.js'));
  runScriptInContext(utilsSource, context, 'js/utils.js');

  const normalizeItemStatus = context.window.normalizeItemStatus;
  assert(typeof normalizeItemStatus === 'function', 'normalizeItemStatus should be exported on window');

  // 1. Valid standard statuses
  assert(normalizeItemStatus('planned') === 'planned', 'Should return "planned" for "planned"');
  assert(normalizeItemStatus('booked') === 'booked', 'Should return "booked" for "booked"');
  assert(normalizeItemStatus('confirmed') === 'confirmed', 'Should return "confirmed" for "confirmed"');
  assert(normalizeItemStatus('cancelled') === 'cancelled', 'Should return "cancelled" for "cancelled"');

  // 2. Case-insensitivity and leading/trailing whitespace
  assert(normalizeItemStatus('PLANNED') === 'planned', 'Should convert uppercase "PLANNED" to lowercase');
  assert(normalizeItemStatus('  Booked  ') === 'booked', 'Should trim whitespace around "  Booked  "');
  assert(normalizeItemStatus('CONFIRMED') === 'confirmed', 'Should convert uppercase "CONFIRMED" to lowercase');
  assert(normalizeItemStatus('  Cancelled  ') === 'cancelled', 'Should trim whitespace around "  Cancelled  "');
  assert(normalizeItemStatus('BoOkEd') === 'booked', 'Should handle mixed-case "BoOkEd"');

  // 3. Falsy and empty values
  assert(normalizeItemStatus(null) === 'planned', 'Should default to "planned" for null');
  assert(normalizeItemStatus(undefined) === 'planned', 'Should default to "planned" for undefined');
  assert(normalizeItemStatus('') === 'planned', 'Should default to "planned" for empty string');
  assert(normalizeItemStatus('   ') === 'planned', 'Should default to "planned" for whitespace string');
  assert(normalizeItemStatus(false) === 'planned', 'Should default to "planned" for false');
  assert(normalizeItemStatus(0) === 'planned', 'Should default to "planned" for 0');

  // 4. Legacy and alias string values
  assert(normalizeItemStatus('pending') === 'planned', 'Should map legacy status "pending" to "planned"');
  assert(normalizeItemStatus('none') === 'planned', 'Should map legacy status "none" to "planned"');
  assert(normalizeItemStatus('null') === 'planned', 'Should map string "null" to "planned"');

  // 5. Invalid / unrecognized status strings and non-string types
  assert(normalizeItemStatus('unknown_status') === 'planned', 'Should fallback to "planned" for unknown status string');
  assert(normalizeItemStatus('paid') === 'planned', 'Should fallback to "planned" for unsupported status "paid"');
  assert(normalizeItemStatus(123) === 'planned', 'Should fallback to "planned" for numeric input 123');
  assert(normalizeItemStatus({}) === 'planned', 'Should fallback to "planned" for object input');

  console.log('✅ ALL normalizeItemStatus UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runNormalizeItemStatusTests();
  } catch (err) {
    console.error('❌ normalizeItemStatus TEST FAILED:', err.message);
    process.exit(1);
  }
}

module.exports = { runNormalizeItemStatusTests };
