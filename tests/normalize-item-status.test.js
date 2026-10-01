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
  const getStatusMeta = context.window.getStatusMeta;
  const renderStatusBadge = context.window.renderStatusBadge;

  assert(typeof normalizeItemStatus === 'function', 'normalizeItemStatus should be exported on window');
  assert(typeof getStatusMeta === 'function', 'getStatusMeta should be exported on window');
  assert(typeof renderStatusBadge === 'function', 'renderStatusBadge should be exported on window');

  // 1. Valid standard statuses
  assert(normalizeItemStatus('planned') === 'planned', 'Should return "planned" for "planned"');
  assert(normalizeItemStatus('booked') === 'booked', 'Should return "booked" for "booked"');
  assert(normalizeItemStatus('confirmed') === 'confirmed', 'Should return "confirmed" for "confirmed"');
  assert(normalizeItemStatus('cancelled') === 'cancelled', 'Should return "cancelled" for "cancelled"');

  // 2. Case-insensitivity and leading/trailing whitespace & newlines/tabs
  assert(normalizeItemStatus('PLANNED') === 'planned', 'Should convert uppercase "PLANNED" to lowercase');
  assert(normalizeItemStatus('  Booked  ') === 'booked', 'Should trim whitespace around "  Booked  "');
  assert(normalizeItemStatus('CONFIRMED') === 'confirmed', 'Should convert uppercase "CONFIRMED" to lowercase');
  assert(normalizeItemStatus('  Cancelled  ') === 'cancelled', 'Should trim whitespace around "  Cancelled  "');
  assert(normalizeItemStatus('BoOkEd') === 'booked', 'Should handle mixed-case "BoOkEd"');
  assert(normalizeItemStatus('\tbooked\n') === 'booked', 'Should handle leading tab and trailing newline');
  assert(normalizeItemStatus('\r\nplanned\t') === 'planned', 'Should handle CRLF and tab characters');
  assert(normalizeItemStatus('\nCONFIRMED\r\n') === 'confirmed', 'Should trim newlines around uppercase status');

  // 3. Falsy and empty values
  assert(normalizeItemStatus(null) === 'planned', 'Should default to "planned" for null');
  assert(normalizeItemStatus(undefined) === 'planned', 'Should default to "planned" for undefined');
  assert(normalizeItemStatus('') === 'planned', 'Should default to "planned" for empty string');
  assert(normalizeItemStatus('   ') === 'planned', 'Should default to "planned" for whitespace string');
  assert(normalizeItemStatus(false) === 'planned', 'Should default to "planned" for false');
  assert(normalizeItemStatus(0) === 'planned', 'Should default to "planned" for 0');

  // 4. Legacy and alias string values (with whitespace and case variations)
  assert(normalizeItemStatus('pending') === 'planned', 'Should map legacy status "pending" to "planned"');
  assert(normalizeItemStatus('none') === 'planned', 'Should map legacy status "none" to "planned"');
  assert(normalizeItemStatus('null') === 'planned', 'Should map string "null" to "planned"');
  assert(normalizeItemStatus('  PENDING  ') === 'planned', 'Should map padded uppercase " PENDING " to "planned"');
  assert(normalizeItemStatus('  None  ') === 'planned', 'Should map padded titlecase " None " to "planned"');
  assert(normalizeItemStatus('NULL') === 'planned', 'Should map uppercase "NULL" to "planned"');

  // 5. Invalid / unrecognized status strings and complex data types
  assert(normalizeItemStatus('unknown_status') === 'planned', 'Should fallback to "planned" for unknown status string');
  assert(normalizeItemStatus('paid') === 'planned', 'Should fallback to "planned" for unsupported status "paid"');
  assert(normalizeItemStatus(123) === 'planned', 'Should fallback to "planned" for numeric input 123');
  assert(normalizeItemStatus(NaN) === 'planned', 'Should fallback to "planned" for NaN');
  assert(normalizeItemStatus(Infinity) === 'planned', 'Should fallback to "planned" for Infinity');
  assert(normalizeItemStatus(-0) === 'planned', 'Should fallback to "planned" for -0');
  assert(normalizeItemStatus(true) === 'planned', 'Should fallback to "planned" for boolean true');
  assert(normalizeItemStatus({}) === 'planned', 'Should fallback to "planned" for empty object input');
  assert(normalizeItemStatus({ status: 'booked' }) === 'planned', 'Should fallback to "planned" for object input');
  assert(normalizeItemStatus(['booked']) === 'booked', 'Should coerce single element array ["booked"] via String to "booked"');
  assert(normalizeItemStatus(['invalid']) === 'planned', 'Should fallback to "planned" for array ["invalid"]');
  assert(normalizeItemStatus([]) === 'planned', 'Should default to "planned" for empty array []');
  assert(normalizeItemStatus(new String('confirmed')) === 'confirmed', 'Should handle String object instance');
  assert(normalizeItemStatus(Symbol('booked')) === 'planned', 'Should fallback to "planned" for Symbol');

  // 6. getStatusMeta tests
  const metaPlanned = getStatusMeta('planned');
  assert(metaPlanned.key === 'planned', 'getStatusMeta("planned") key should be "planned"');
  assert(metaPlanned.label === '⏳ Planned', 'getStatusMeta("planned") label should be "⏳ Planned"');
  assert(metaPlanned.color === '#D97706', 'getStatusMeta("planned") color should be "#D97706"');

  const metaBooked = getStatusMeta('BOOKED');
  assert(metaBooked.key === 'booked', 'getStatusMeta("BOOKED") key should be "booked"');
  assert(metaBooked.label === '✓ Booked', 'getStatusMeta("BOOKED") label should be "✓ Booked"');
  assert(metaBooked.color === '#2563EB', 'getStatusMeta("BOOKED") color should be "#2563EB"');

  const metaConfirmed = getStatusMeta('confirmed');
  assert(metaConfirmed.key === 'confirmed', 'getStatusMeta("confirmed") key should be "confirmed"');
  assert(metaConfirmed.label === '🎫 Confirmed', 'getStatusMeta("confirmed") label should be "🎫 Confirmed"');
  assert(metaConfirmed.color === '#059669', 'getStatusMeta("confirmed") color should be "#059669"');

  const metaCancelled = getStatusMeta('cancelled');
  assert(metaCancelled.key === 'cancelled', 'getStatusMeta("cancelled") key should be "cancelled"');
  assert(metaCancelled.label === '✗ Cancelled', 'getStatusMeta("cancelled") label should be "✗ Cancelled"');
  assert(metaCancelled.color === '#DC2626', 'getStatusMeta("cancelled") color should be "#DC2626"');

  const metaLegacy = getStatusMeta('pending');
  assert(metaLegacy.key === 'planned', 'getStatusMeta("pending") should normalize key to "planned"');

  const metaInvalid = getStatusMeta('unknown');
  assert(metaInvalid.key === 'planned', 'getStatusMeta("unknown") should normalize key to "planned"');

  // 7. renderStatusBadge tests
  const clickableHtml = renderStatusBadge('booked', { onClick: 'toggleStatus(123)' });
  assert(clickableHtml.includes('onclick="toggleStatus(123)"'), 'Clickable badge should include onclick handler');
  assert(clickableHtml.includes('status-badge-clickable'), 'Clickable badge should include status-badge-clickable class');
  assert(clickableHtml.includes('✓ Booked'), 'Clickable badge should include label');
  assert(clickableHtml.includes('--status-color:#2563EB'), 'Clickable badge should include color style');
  assert(!clickableHtml.includes('disabled'), 'Clickable badge should not be disabled');

  const disabledHtml = renderStatusBadge('confirmed');
  assert(disabledHtml.includes('disabled'), 'Disabled badge should include disabled attribute');
  assert(disabledHtml.includes('cursor-default'), 'Disabled badge should include cursor-default class');
  assert(disabledHtml.includes('🎫 Confirmed'), 'Disabled badge should include label');
  assert(disabledHtml.includes('--status-color:#059669'), 'Disabled badge should include color style');

  const customBadgeHtml = renderStatusBadge('cancelled', {
    title: 'Custom Title <Alert>',
    ariaLabel: 'Custom Aria & Label',
    className: 'my-custom-class'
  });
  assert(customBadgeHtml.includes('title="Custom Title &lt;Alert&gt;"'), 'Custom title should be escaped');
  assert(customBadgeHtml.includes('aria-label="Custom Aria &amp; Label"'), 'Custom aria-label should be escaped');
  assert(customBadgeHtml.includes('my-custom-class'), 'Custom className should be included');

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
