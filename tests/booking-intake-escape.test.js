const path = require('path');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function runBookingIntakeEscapeTests() {
  console.log('Running bookingIntakeEscape unit tests...');

  // Setup VM context without escapeHtmlText defined
  const context = createVmContext({
    window: {},
    document: {
      getElementById: () => null,
      querySelectorAll: () => []
    }
  });
  context.window = context;

  const intakeSource = loadSource(path.join('js', 'booking-intake.js'));
  runScriptInContext(intakeSource, context, 'js/booking-intake.js');

  const bookingIntakeEscape = context.bookingIntakeEscape || context.window.bookingIntakeEscape;
  assert(typeof bookingIntakeEscape === 'function', 'bookingIntakeEscape should be accessible in script context');

  // A. Tests when escapeHtmlText is NOT defined (Standalone Fallback Path)

  // 1. Null and undefined handling
  assert(bookingIntakeEscape(null) === '', 'null input should return empty string');
  assert(bookingIntakeEscape(undefined) === '', 'undefined input should return empty string');

  // 2. Individual special HTML character escaping
  assert(bookingIntakeEscape('&') === '&amp;', '& should be escaped to &amp;');
  assert(bookingIntakeEscape('<') === '&lt;', '< should be escaped to &lt;');
  assert(bookingIntakeEscape('>') === '&gt;', '> should be escaped to &gt;');
  assert(bookingIntakeEscape('"') === '&quot;', '" should be escaped to &quot;');
  assert(bookingIntakeEscape("'") === '&#39;', "' should be escaped to &#39;");

  // 3. String without special characters and empty string
  assert(bookingIntakeEscape('Flight BA123') === 'Flight BA123', 'Plain string should remain unchanged');
  assert(bookingIntakeEscape('') === '', 'Empty string should return empty string');

  // 4. Non-string primitive inputs (numbers, booleans)
  assert(bookingIntakeEscape(12345) === '12345', 'Number input should be converted to string');
  assert(bookingIntakeEscape(0) === '0', 'Number 0 input should return "0"');
  assert(bookingIntakeEscape(true) === 'true', 'Boolean true input should return "true"');
  assert(bookingIntakeEscape(false) === 'false', 'Boolean false input should return "false"');

  // 5. Complex XSS payloads and multi-character strings
  assert(
    bookingIntakeEscape('<script>alert("XSS & \'test\'")</script>') ===
      '&lt;script&gt;alert(&quot;XSS &amp; &#39;test&#39;&quot;)&lt;/script&gt;',
    'XSS payload string should have all HTML special characters escaped'
  );
  assert(
    bookingIntakeEscape('Ref: #123 & <456> "test"') ===
      'Ref: #123 &amp; &lt;456&gt; &quot;test&quot;',
    'Mixed text with multiple special characters should be escaped properly'
  );

  // 6. Non-ASCII, unicode, and emoji handling
  assert(bookingIntakeEscape('Café & Hotel') === 'Café &amp; Hotel', 'Non-ASCII characters should be preserved while escaping &');
  assert(bookingIntakeEscape('✈️ Flight > Hotel') === '✈️ Flight &gt; Hotel', 'Emoji characters should be preserved while escaping >');

  // B. Tests when escapeHtmlText IS defined (Delegation Path)
  let delegateCalled = false;
  let delegateInput = null;
  context.escapeHtmlText = function(val) {
    delegateCalled = true;
    delegateInput = val;
    return `delegated:${val}`;
  };

  const delegatedResult = bookingIntakeEscape('<test>');
  assert(delegateCalled === true, 'bookingIntakeEscape should delegate to escapeHtmlText when defined');
  assert(delegateInput === '<test>', 'escapeHtmlText should receive the exact argument');
  assert(delegatedResult === 'delegated:<test>', 'bookingIntakeEscape should return the result of escapeHtmlText');

  console.log('✅ ALL bookingIntakeEscape UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runBookingIntakeEscapeTests();
  } catch (err) {
    console.error('❌ bookingIntakeEscape TEST FAILED:', err.message);
    process.exit(1);
  }
}

module.exports = { runBookingIntakeEscapeTests };
