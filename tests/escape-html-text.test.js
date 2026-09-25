const path = require('path');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function runEscapeHtmlTextTests() {
  console.log('Running escapeHtmlText unit tests...');

  const context = createVmContext({
    window: {},
    document: { getElementById: () => null, querySelectorAll: () => [] }
  });
  context.window = context;

  const utilsSource = loadSource(path.join('js', 'utils.js'));
  runScriptInContext(utilsSource, context, 'js/utils.js');

  const escapeHtmlText = context.window.escapeHtmlText;
  assert(typeof escapeHtmlText === 'function', 'escapeHtmlText should be exported on window');

  // 1. Null and undefined handling
  assert(escapeHtmlText(null) === '', 'null input should return empty string');
  assert(escapeHtmlText(undefined) === '', 'undefined input should return empty string');

  // 2. Individual special HTML character escaping
  assert(escapeHtmlText('&') === '&amp;', '& should be escaped to &amp;');
  assert(escapeHtmlText('<') === '&lt;', '< should be escaped to &lt;');
  assert(escapeHtmlText('>') === '&gt;', '> should be escaped to &gt;');
  assert(escapeHtmlText('"') === '&quot;', '" should be escaped to &quot;');
  assert(escapeHtmlText("'") === '&#39;', "' should be escaped to &#39;");

  // 3. String without special characters
  assert(escapeHtmlText('Hello World') === 'Hello World', 'Plain string should remain unchanged');
  assert(escapeHtmlText('') === '', 'Empty string should return empty string');

  // 4. Non-string primitive inputs (numbers, booleans)
  assert(escapeHtmlText(12345) === '12345', 'Number input should be converted to string');
  assert(escapeHtmlText(0) === '0', 'Number 0 input should return "0"');
  assert(escapeHtmlText(true) === 'true', 'Boolean true input should return "true"');
  assert(escapeHtmlText(false) === 'false', 'Boolean false input should return "false"');

  // 5. Complex XSS payloads and multi-character strings
  assert(
    escapeHtmlText('<script>alert("XSS & \'test\'")</script>') ===
      '&lt;script&gt;alert(&quot;XSS &amp; &#39;test&#39;&quot;)&lt;/script&gt;',
    'XSS payload string should have all HTML special characters escaped'
  );
  assert(
    escapeHtmlText('<a href="https://example.com?a=1&b=2">Link</a>') ===
      '&lt;a href=&quot;https://example.com?a=1&amp;b=2&quot;&gt;Link&lt;/a&gt;',
    'HTML string with attributes and URL parameters should be fully escaped'
  );

  // 6. Non-ASCII, unicode, and emoji handling
  assert(escapeHtmlText('Café & Restaurant') === 'Café &amp; Restaurant', 'Non-ASCII characters should be preserved while escaping &');
  assert(escapeHtmlText('✈️ Flight > Hotel') === '✈️ Flight &gt; Hotel', 'Emoji characters should be preserved while escaping >');

  console.log('✅ ALL escapeHtmlText UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runEscapeHtmlTextTests();
  } catch (err) {
    console.error('❌ escapeHtmlText TEST FAILED:', err.message);
    process.exit(1);
  }
}

module.exports = { runEscapeHtmlTextTests };
