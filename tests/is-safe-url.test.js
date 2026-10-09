const path = require('path');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function runIsSafeUrlTests() {
  console.log('Running isSafeUrl unit tests...');

  const documentMock = {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {}
  };

  const context = createVmContext({
    URL,
    document: documentMock,
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    location: { hostname: 'example.com', origin: 'https://example.com', href: 'https://example.com/app/' },
    addEventListener() {}
  });
  context.window = context;

  const utilsSource = loadSource(path.join('js', 'utils.js'));
  runScriptInContext(utilsSource, context, 'js/utils.js');

  const isSafeUrl = context.window.isSafeUrl;
  assert(typeof isSafeUrl === 'function', 'isSafeUrl should be exported on window');

  // 1. Non-string and falsy inputs
  assert(isSafeUrl(null) === false, 'null should return false');
  assert(isSafeUrl(undefined) === false, 'undefined should return false');
  assert(isSafeUrl('') === false, 'empty string should return false');
  assert(isSafeUrl('   ') === false, 'whitespace-only string should return false');
  assert(isSafeUrl(12345) === false, 'number should return false');
  assert(isSafeUrl(true) === false, 'boolean true should return false');
  assert(isSafeUrl(false) === false, 'boolean false should return false');
  assert(isSafeUrl({}) === false, 'plain object should return false');
  assert(isSafeUrl([]) === false, 'array should return false');
  assert(isSafeUrl(() => {}) === false, 'function should return false');

  // 2. Valid absolute URLs (http, https, data)
  assert(isSafeUrl('http://example.com') === true, 'http URL should return true');
  assert(isSafeUrl('http://localhost:8080/path?query=1') === true, 'http URL with port and query should return true');
  assert(isSafeUrl('https://example.com/avatar.png') === true, 'https URL should return true');
  assert(isSafeUrl('https://sub.domain.org/path#hash') === true, 'https URL with subdomain and hash should return true');
  assert(
    isSafeUrl('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==') === true,
    'data URI should return true'
  );
  assert(isSafeUrl('data:text/plain;charset=utf-8,Hello%20World') === true, 'text data URI should return true');

  // 3. Leading and trailing whitespace handling
  assert(isSafeUrl('   https://example.com/photo.jpg   ') === true, 'trimmed https URL should return true');
  assert(isSafeUrl('  http://example.com  ') === true, 'trimmed http URL should return true');

  // 4. Disallowed / Unsafe URL protocols
  assert(isSafeUrl('javascript:alert(1)') === false, 'javascript: URI should return false');
  assert(isSafeUrl('JAVASCRIPT:alert(1)') === false, 'uppercase JAVASCRIPT: URI should return false');
  assert(isSafeUrl('javascript:void(0)') === false, 'javascript:void(0) should return false');
  assert(isSafeUrl('file:///etc/passwd') === false, 'file: URI should return false');
  assert(isSafeUrl('file://C:/Windows/system32') === false, 'file: URI (Windows) should return false');
  assert(isSafeUrl('ftp://example.com/file.txt') === false, 'ftp: URI should return false');
  assert(isSafeUrl('blob:https://example.com/550e8400-e29b-41d4-a716-446655440000') === false, 'blob: URI should return false');
  assert(isSafeUrl('vbscript:msgbox("XSS")') === false, 'vbscript: URI should return false');
  assert(isSafeUrl('mailto:test@example.com') === false, 'mailto: URI should return false');
  assert(isSafeUrl('tel:+1234567890') === false, 'tel: URI should return false');

  // 5. Relative URLs resolved against window.location.href (https://example.com/app/)
  assert(isSafeUrl('/images/logo.png') === true, 'relative root path should resolve to https and return true');
  assert(isSafeUrl('relative/path.html') === true, 'relative path should resolve to https and return true');
  assert(isSafeUrl('?search=test') === true, 'relative query string should resolve to https and return true');
  assert(isSafeUrl('#section1') === true, 'relative hash anchor should resolve to https and return true');

  // 6. Fallback when window is undefined or window.location is missing
  const dummyWin = {};
  const noLocationContext = createVmContext({ URL, window: dummyWin });
  runScriptInContext(utilsSource, noLocationContext, 'js/utils.js');
  const isSafeUrlNoLocation = dummyWin.isSafeUrl;
  assert(typeof isSafeUrlNoLocation === 'function', 'isSafeUrl should be function');
  assert(isSafeUrlNoLocation('https://example.com') === true, 'https URL should return true without window.location');
  assert(isSafeUrlNoLocation('javascript:alert(1)') === false, 'javascript URI should return false without window.location');
  assert(isSafeUrlNoLocation('/relative/path') === true, 'relative path should fallback to http://localhost/ and return true');

  // 7. Malformed URLs handling
  assert(isSafeUrl('http://]') === false, 'malformed URL causing parse error should return false');
  assert(isSafeUrl('http://:') === false, 'malformed URL with invalid port should return false');

  console.log('✅ ALL isSafeUrl UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runIsSafeUrlTests();
  } catch (err) {
    console.error('❌ isSafeUrl TEST FAILED:', err.message);
    process.exit(1);
  }
}

module.exports = { runIsSafeUrlTests };
