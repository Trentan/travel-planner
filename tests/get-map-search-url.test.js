const path = require('path');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function runGetMapSearchUrlTests() {
  console.log('Running getMapSearchUrl unit tests...');

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

  const getMapSearchUrl = context.getMapSearchUrl;

  assert(typeof getMapSearchUrl === 'function', 'getMapSearchUrl should be available in context');

  // 1. Falsy / Empty query inputs return empty string
  assert(getMapSearchUrl('') === '', 'Empty string query should return empty string');
  assert(getMapSearchUrl(null) === '', 'null query should return empty string');
  assert(getMapSearchUrl(undefined) === '', 'undefined query should return empty string');
  assert(getMapSearchUrl(false) === '', 'boolean false query should return empty string');

  // 2. Query without city parameter
  const baseUrl = 'https://www.google.com/maps/search/?api=1&query=';
  assert(
    getMapSearchUrl('Eiffel Tower') === `${baseUrl}Eiffel%20Tower`,
    'Should correctly encode simple query without city'
  );
  assert(
    getMapSearchUrl('Tokyo Tower & Skytree') === `${baseUrl}Tokyo%20Tower%20%26%20Skytree`,
    'Should correctly encode query with special characters like &'
  );

  // 3. Query with city parameter when query already contains the city (case-insensitive)
  assert(
    getMapSearchUrl('Eiffel Tower, Paris', 'Paris') === `${baseUrl}Eiffel%20Tower%2C%20Paris`,
    'Should not append city if query already contains city'
  );
  assert(
    getMapSearchUrl('Eiffel Tower, paris', 'PARIS') === `${baseUrl}Eiffel%20Tower%2C%20paris`,
    'Should handle case-insensitive city matching'
  );
  assert(
    getMapSearchUrl('Tokyo Station', 'tokyo') === `${baseUrl}Tokyo%20Station`,
    'Should recognize city within query regardless of case'
  );

  // 4. Query with city parameter when query does NOT contain the city
  assert(
    getMapSearchUrl('Eiffel Tower', 'Paris') === `${baseUrl}Eiffel%20Tower%2C%20Paris`,
    'Should append ", City" when city is not in query'
  );
  assert(
    getMapSearchUrl('Senso-ji Temple', '  Tokyo  ') === `${baseUrl}Senso-ji%20Temple%2C%20Tokyo`,
    'Should trim city name before appending'
  );

  // 5. Edge cases: empty/whitespace city parameter
  assert(
    getMapSearchUrl('Eiffel Tower', '') === `${baseUrl}Eiffel%20Tower`,
    'Empty city string should not alter query'
  );
  assert(
    getMapSearchUrl('Eiffel Tower', '   ') === `${baseUrl}Eiffel%20Tower`,
    'Whitespace-only city should not alter query'
  );
  assert(
    getMapSearchUrl('Eiffel Tower', null) === `${baseUrl}Eiffel%20Tower`,
    'null city should not alter query'
  );
  assert(
    getMapSearchUrl('Eiffel Tower', undefined) === `${baseUrl}Eiffel%20Tower`,
    'undefined city should not alter query'
  );

  console.log('✅ ALL getMapSearchUrl UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runGetMapSearchUrlTests();
  } catch (err) {
    console.error('❌ getMapSearchUrl TEST FAILED:', err.message);
    process.exit(1);
  }
}

module.exports = { runGetMapSearchUrlTests };
