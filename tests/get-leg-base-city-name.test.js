const fs = require('fs');
const path = require('path');
const { assert, createVmContext, runScriptInContext, loadSource } = require('./lib/test-helpers');

function runGetLegBaseCityNameTests() {
  console.log('Running getLegBaseCityName unit tests...');

  const legEngineCode = loadSource('js/leg-engine.js');

  const context = createVmContext({
    titleData: undefined,
    citiesData: undefined,
    cleanCityNavLabel: undefined,
    getCityByName: undefined
  });

  runScriptInContext(legEngineCode, context, 'js/leg-engine.js');
  const getLegBaseCityName = context.getLegBaseCityName;

  assert(typeof getLegBaseCityName === 'function', 'getLegBaseCityName should be exported as a function');

  // 1. Falsy and null inputs
  assert(getLegBaseCityName(null) === '', 'null leg should return empty string');
  assert(getLegBaseCityName(undefined) === '', 'undefined leg should return empty string');
  assert(getLegBaseCityName(false) === '', 'false leg should return empty string');

  // 2. Start terminal legs
  // Default homeCity = 'Home'
  assert(
    getLegBaseCityName({ type: 'start', label: 'Brisbane (Trip Start)' }) === 'Brisbane',
    'Start leg with city label should return city name'
  );
  assert(
    getLegBaseCityName({ type: 'start', label: '🇦🇺 (Trip Start)' }) === 'Home',
    'Start leg with only emoji/strip-able chars should fallback to default Home'
  );

  // Custom titleData.homeCity
  context.titleData = { homeCity: '  Melbourne  ' };
  assert(
    getLegBaseCityName({ type: 'start', label: '(Trip Start)' }) === 'Melbourne',
    'Start leg with empty cleaned label should fallback to titleData.homeCity'
  );

  // Implicit start terminal leg via isTerminalLeg (id ends with -start)
  assert(
    getLegBaseCityName({ id: 'leg-1-start', label: 'Perth (Trip Start)' }) === 'Perth',
    'Implicit start leg via id suffix should resolve clean label'
  );
  assert(
    getLegBaseCityName({ id: 'departure', label: 'Departure (Trip Start)' }) === 'Departure',
    'Implicit start leg via label "start" should clean label correctly'
  );

  // 3. Return terminal legs
  assert(
    getLegBaseCityName({ type: 'return', label: 'Melbourne (Trip Finish)' }) === 'Melbourne',
    'Return leg with city label should return city name'
  );
  assert(
    getLegBaseCityName({ type: 'return', label: 'Return Home' }) === 'Melbourne',
    'Return leg labeled "Return Home" should fallback to titleData.homeCity'
  );
  assert(
    getLegBaseCityName({ id: 'leg-finish', type: 'return', label: 'Auckland (Trip End)' }) === 'Auckland',
    'Return leg with "(Trip End)" should strip end tag'
  );

  // Implicit return terminal leg via isTerminalLeg (id ends with -finish / label includes finish/return)
  assert(
    getLegBaseCityName({ id: 'leg-finish', label: 'Adelaide (Trip Finish)' }) === 'Adelaide',
    'Implicit return leg via id -finish should return clean label'
  );

  // Reset titleData for subsequent tests
  context.titleData = { homeCity: 'Home' };

  // 4. cityId lookup in citiesData
  context.citiesData = [
    { id: 'city-tokyo', name: 'Tokyo', country: 'Japan' },
    { id: 'city-paris', name: 'Paris', country: 'France' }
  ];

  assert(
    getLegBaseCityName({ type: 'city', cityId: 'city-tokyo', label: 'Tokyo Wellness' }) === 'Tokyo',
    'Leg with matching cityId should resolve name from citiesData'
  );
  assert(
    getLegBaseCityName({ type: 'city', cityId: 'city-unknown', label: 'Unknown City' }) === 'Unknown City',
    'Leg with unmatched cityId should fallback to label resolution'
  );

  // 5. cleanCityNavLabel and getCityByName resolution
  context.cleanCityNavLabel = (lbl) => String(lbl || '').replace(/^[^\w\s]+/, '').trim();
  context.getCityByName = (name) => {
    if (name === 'Paris' || name === 'Paris France') return { id: 'city-paris', name: 'Paris' };
    return null;
  };

  assert(
    getLegBaseCityName({ type: 'city', label: '🇫🇷 Paris' }) === 'Paris',
    'Leg resolved via getCityByName should return canonical city name'
  );

  // 6. Fallback string when no city match
  assert(
    getLegBaseCityName({ type: 'city', label: 'Custom Tour Stop' }) === 'Custom Tour Stop',
    'Leg without city match should fallback to clean label'
  );
  assert(
    getLegBaseCityName({ type: 'city', label: '' }) === '',
    'Leg with empty label and no match should return empty string'
  );

  console.log('✅ ALL getLegBaseCityName UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runGetLegBaseCityNameTests();
  } catch (err) {
    console.error(err.stack || err.message);
    process.exitCode = 1;
  }
}

module.exports = { runGetLegBaseCityNameTests };
