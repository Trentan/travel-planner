const path = require('path');
const { assert, createVmContext, loadSource, runScriptInContext } = require('./lib/test-helpers');

function runAddOrUpdateCityTests() {
  console.log('Running addOrUpdateCity unit tests...');

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

  const { addOrUpdateCity } = context;

  assert(typeof addOrUpdateCity === 'function', 'addOrUpdateCity should be exported as a function');

  // 1. Falsy/empty input
  assert(addOrUpdateCity() === null, 'addOrUpdateCity() should return null');
  assert(addOrUpdateCity('') === null, 'addOrUpdateCity("") should return null');
  assert(addOrUpdateCity(null) === null, 'addOrUpdateCity(null) should return null');
  assert(addOrUpdateCity({}) === null, 'addOrUpdateCity({}) should return null');

  // 2. Add new city using options object
  const city1 = addOrUpdateCity({
    cityName: 'Aitutaki',
    country: 'Cook Islands',
    countryCode: 'CK',
    lat: -18.8579,
    lng: -159.7853,
    dateFrom: '2026-04-01',
    dateTo: '2026-04-05'
  });

  assert(city1 !== null, 'addOrUpdateCity with options object should return a city object');
  assert(city1.name === 'Aitutaki', 'city name should be Aitutaki');
  assert(city1.country === 'Cook Islands', 'city country should be Cook Islands');
  assert(city1.countryCode === 'CK', 'city countryCode should be CK');
  assert(city1.lat === -18.8579, 'city lat should match');
  assert(city1.lng === -159.7853, 'city lng should match');
  assert(city1.dateFrom === '2026-04-01', 'dateFrom should match');
  assert(city1.dateTo === '2026-04-05', 'dateTo should match');

  // 3. Update existing city using options object
  const city1Updated = addOrUpdateCity({
    name: 'aitutaki', // alias property test
    dateFrom: '2026-03-30',
    dateTo: '2026-04-07'
  });

  assert(city1Updated === city1, 'updating existing city should return the existing instance');
  assert(city1.dateFrom === '2026-03-30', 'dateFrom should be updated to earlier date');
  assert(city1.dateTo === '2026-04-07', 'dateTo should be updated to later date');

  // 4. Add new city using legacy positional arguments
  const city2 = addOrUpdateCity('Rarotonga', 'Cook Islands', '2026-04-08', '2026-04-12', 'RAR', 'CK', -21.2367, -159.7777);

  assert(city2 !== null, 'addOrUpdateCity with positional arguments should return a city object');
  assert(city2.name === 'Rarotonga', 'city name should be Rarotonga');
  assert(city2.country === 'Cook Islands', 'city country should be Cook Islands');
  assert(city2.countryCode === 'CK', 'city countryCode should be CK');
  assert(city2.code === 'RAR', 'city code should be RAR');
  assert(city2.lat === -21.2367, 'city lat should match');
  assert(city2.lng === -159.7777, 'city lng should match');

  console.log('✅ ALL addOrUpdateCity UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runAddOrUpdateCityTests();
  } catch (err) {
    console.error(err.stack || err.message);
    process.exitCode = 1;
  }
}

module.exports = { runAddOrUpdateCityTests };
