const path = require('path');
const { assert, createVmContext, loadSource, runScriptInContext } = require('./lib/test-helpers');

function runStripCityLabelTests() {
  console.log('Running stripCityLabel unit tests...');

  const documentMock = {
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    getElementById: () => null
  };

  const context = createVmContext({
    document: documentMock,
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    },
    location: { hostname: 'localhost', origin: 'http://localhost:3000', href: 'http://localhost:3000/' },
    addEventListener() {}
  });
  context.window = context;

  const utilsCode = loadSource(path.join('js', 'utils.js'));
  const dataCode = loadSource(path.join('js', 'data.js'));

  runScriptInContext(utilsCode, context, 'js/utils.js');
  runScriptInContext(dataCode, context, 'js/data.js');

  const { stripCityLabel } = context;

  assert(typeof stripCityLabel === 'function', 'stripCityLabel should be exported as a function');

  // 1. Falsy/empty inputs
  assert(stripCityLabel() === '', 'stripCityLabel() should return empty string');
  assert(stripCityLabel('') === '', 'stripCityLabel("") should return empty string');
  assert(stripCityLabel(null) === '', 'stripCityLabel(null) should return empty string');
  assert(stripCityLabel(undefined) === '', 'stripCityLabel(undefined) should return empty string');

  // 2. Standard city names
  assert(stripCityLabel('Tokyo') === 'Tokyo', 'Standard city name should remain unchanged');
  assert(stripCityLabel('Cluj-Napoca') === 'Cluj-Napoca', 'Hyphenated city name should be preserved');
  assert(stripCityLabel('New York') === 'New York', 'Multi-word city name should be preserved');

  // 3. Comma-separated country/region labels
  assert(stripCityLabel('Tokyo, Japan') === 'Tokyo', 'Comma suffix should be stripped');
  assert(stripCityLabel('Osaka, Kansai Region, Japan') === 'Osaka', 'Everything after first comma should be stripped');

  // 4. Dash-separated country/region labels (em-dash, en-dash, hyphen with spaces)
  assert(stripCityLabel('Paris — France') === 'Paris', 'Em-dash separator should strip country label');
  assert(stripCityLabel('Berlin – Germany') === 'Berlin', 'En-dash separator should strip country label');
  assert(stripCityLabel('London - UK') === 'London', 'Hyphen separator with spaces should strip country label');

  // 5. Parenthetical suffixes
  assert(stripCityLabel('Tokyo (Trip Start)') === 'Tokyo', 'Parenthetical suffix (Trip Start) should be stripped');
  assert(stripCityLabel('Vienna (Trip Finish)') === 'Vienna', 'Parenthetical suffix (Trip Finish) should be stripped');
  assert(stripCityLabel('Sydney (BNE / YBBN)') === 'Sydney', 'Airport code parenthetical suffix should be stripped');
  assert(stripCityLabel('Bangkok (1)') === 'Bangkok', 'Numbered parenthetical suffix should be stripped');

  // 6. Emojis and flag sequences
  assert(stripCityLabel('🗼 Tokyo') === 'Tokyo', 'Leading emoji should be stripped');
  assert(stripCityLabel('🇯🇵 Tokyo, Japan') === 'Tokyo', 'Country flag emoji and comma suffix should be stripped');
  assert(stripCityLabel('Vienna (Trip Finish) 🇦🇹') === 'Vienna', 'Trailing flag emoji and parenthetical suffix should be stripped');

  // 7. Whitespace trimming and non-alphanumeric character handling
  assert(stripCityLabel('  New York  ') === 'New York', 'Leading and trailing whitespace should be trimmed');
  assert(stripCityLabel('!!!Rome???') === 'Rome', 'Punctuation symbols should be stripped');

  console.log('✅ ALL stripCityLabel UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runStripCityLabelTests();
  } catch (err) {
    console.error(err.stack || err.message);
    process.exitCode = 1;
  }
}

module.exports = { runStripCityLabelTests };
