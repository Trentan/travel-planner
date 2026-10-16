const { assert, createVmContext, runScriptInContext, loadSource } = require('./lib/test-helpers');

function runGetPriorLegCityTests() {
  console.log('Running getPriorLegCity unit tests...');

  const legEngineCode = loadSource('js/leg-engine.js');

  const context = createVmContext({
    titleData: undefined,
    citiesData: undefined,
    cleanCityNavLabel: undefined,
    getCityByName: undefined
  });

  runScriptInContext(legEngineCode, context, 'js/leg-engine.js');
  const getPriorLegCity = context.getPriorLegCity;

  assert(typeof getPriorLegCity === 'function', 'getPriorLegCity should be exported as a function');

  // 1. Non-array inputs & targetIdx <= 0
  assert(getPriorLegCity(null, 1) === 'Home', 'null legs array should return default fallback Home');
  assert(getPriorLegCity(undefined, 1, 'CustomHome') === 'CustomHome', 'undefined legs array should return custom fallbackHome');
  assert(getPriorLegCity('not-an-array', 1) === 'Home', 'non-array legs should return fallbackHome');
  assert(getPriorLegCity([], 0) === 'Home', 'targetIdx = 0 should return fallbackHome');
  assert(getPriorLegCity([{ label: 'Tokyo' }], 0) === 'Home', 'targetIdx = 0 should return fallbackHome even if legs exist');
  assert(getPriorLegCity([{ label: 'Tokyo' }], -1, 'BaseCity') === 'BaseCity', 'negative targetIdx should return fallbackHome');

  // 2. Canonical homeCity override via titleData
  context.titleData = { homeCity: '  Sydney  ' };
  assert(getPriorLegCity(null, 1, 'Default') === 'Default', 'Non-array legs returns fallbackHome even if titleData is present');
  assert(getPriorLegCity([], 0, 'Default') === 'Default', 'targetIdx <= 0 returns fallbackHome even if titleData is present');
  assert(getPriorLegCity([{ label: 'Home' }], 1, 'Default') === 'Sydney', 'Fallback home resolved from titleData when loop finishes without prior city');

  // 3. Array with sparse / null elements
  const sparseLegs = [
    null,
    undefined,
    { label: 'Kyoto', type: 'city' }
  ];
  assert(getPriorLegCity(sparseLegs, 2) === 'Sydney', 'Should skip null/undefined leg entries and return homeCity if no prior non-home city before index');
  assert(getPriorLegCity(sparseLegs, 3) === 'Kyoto', 'Should skip null/undefined entries and find prior non-terminal city Kyoto');

  // 4. Traversing backwards to find non-terminal city leg
  const multiCityLegs = [
    { id: 'leg-start', type: 'start', label: 'Sydney (Trip Start)' },
    { id: 'leg-1', type: 'city', label: 'Tokyo' },
    { id: 'leg-2', type: 'city', label: 'Osaka' },
    { id: 'leg-3', type: 'city', label: 'Kyoto' }
  ];

  assert(getPriorLegCity(multiCityLegs, 1) === 'Sydney', 'Prior to index 1 is start leg, returning titleData homeCity');
  assert(getPriorLegCity(multiCityLegs, 2) === 'Tokyo', 'Prior to index 2 is Tokyo');
  assert(getPriorLegCity(multiCityLegs, 3) === 'Osaka', 'Prior to index 3 is Osaka');

  // 5. Encounters start terminal leg explicitly
  const legsWithStartTerminal = [
    { id: 'departure', type: 'start', label: 'Departure' },
    { id: 'leg-1', type: 'city', label: 'Paris' }
  ];
  assert(getPriorLegCity(legsWithStartTerminal, 1) === 'Sydney', 'Encountering start terminal leg returns homeCity');

  // Check implicit start terminal legs (by id / label)
  assert(
    getPriorLegCity([{ id: 'trip-start', label: 'London (Trip Start)' }], 1) === 'Sydney',
    'Start terminal leg identified by label substring returns homeCity'
  );
  assert(
    getPriorLegCity([{ id: 'leg-1-start', label: 'Start' }], 1) === 'Sydney',
    'Start terminal leg identified by id -start suffix returns homeCity'
  );

  // 6. Encounters return terminal leg prior (skips return terminal leg and continues backward search)
  const legsWithReturnTerminal = [
    { id: 'leg-1', type: 'city', label: 'Berlin' },
    { id: 'leg-return', type: 'return', label: 'Return Home' },
    { id: 'leg-2', type: 'city', label: 'Munich' }
  ];
  assert(
    getPriorLegCity(legsWithReturnTerminal, 2) === 'Berlin',
    'Return terminal leg at index 1 is skipped, returning Berlin from index 0'
  );

  // 7. Leg base city returning 'Home' or empty string is skipped
  const legsWithHomeBaseCity = [
    { id: 'leg-0', type: 'city', label: 'Vienna' },
    { id: 'leg-1', type: 'city', label: 'Home' },
    { id: 'leg-2', type: 'city', label: '  ' }
  ];
  assert(
    getPriorLegCity(legsWithHomeBaseCity, 2) === 'Vienna',
    'Leg at index 1 returning Home is skipped, returning Vienna'
  );

  // Reset titleData and test custom fallbackHome parameter
  context.titleData = undefined;
  assert(
    getPriorLegCity(legsWithHomeBaseCity, 2, 'FallbackCity') === 'Vienna',
    'Vienna is returned when previous leg is Home'
  );
  assert(
    getPriorLegCity([{ label: 'Home' }], 1, 'FallbackCity') === 'FallbackCity',
    'Returns fallbackCity when no valid city or start leg found and titleData is undefined'
  );

  console.log('✅ ALL getPriorLegCity UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runGetPriorLegCityTests();
  } catch (err) {
    console.error(err.stack || err.message);
    process.exitCode = 1;
  }
}

module.exports = { runGetPriorLegCityTests };
