const path = require('path');
const { assert, createVmContext, loadSource, runScriptInContext } = require('./lib/test-helpers');

function runIsTerminalLegTests() {
  console.log('Running isTerminalLeg unit tests...');

  const legEngineCode = loadSource('js/leg-engine.js');
  const context = createVmContext({});

  runScriptInContext(legEngineCode, context, 'js/leg-engine.js');
  const isTerminalLeg = context.isTerminalLeg;

  assert(typeof isTerminalLeg === 'function', 'isTerminalLeg should be exported as a function');

  // 1. Falsy and non-object inputs
  assert(isTerminalLeg(null) === false, 'null input should return false');
  assert(isTerminalLeg(undefined) === false, 'undefined input should return false');
  assert(isTerminalLeg(false) === false, 'false input should return false');
  assert(isTerminalLeg(0) === false, 'numeric 0 input should return false');
  assert(isTerminalLeg('') === false, 'empty string input should return false');
  assert(isTerminalLeg({}) === false, 'empty object should return false');

  // 2. Explicit leg.type field matching ('start' or 'return')
  assert(isTerminalLeg({ type: 'start' }) === true, 'leg.type "start" should return true');
  assert(isTerminalLeg({ type: 'return' }) === true, 'leg.type "return" should return true');
  assert(isTerminalLeg({ type: 'city' }) === false, 'leg.type "city" without terminal markers should return false');
  assert(isTerminalLeg({ type: 'transit' }) === false, 'leg.type "transit" without terminal markers should return false');

  // Explicit type overrides non-terminal id/label
  assert(
    isTerminalLeg({ type: 'start', id: 'leg-123', label: 'Tokyo' }) === true,
    'leg.type "start" takes precedence over non-terminal label'
  );
  assert(
    isTerminalLeg({ type: 'return', id: 'leg-456', label: 'Paris' }) === true,
    'leg.type "return" takes precedence over non-terminal label'
  );

  // 3. Leg ID matching ('departure', 'return', ending with '-start' or '-finish')
  assert(isTerminalLeg({ id: 'departure' }) === true, 'id "departure" should return true');
  assert(isTerminalLeg({ id: 'DEPARTURE' }) === true, 'id "DEPARTURE" (uppercase) should return true');
  assert(isTerminalLeg({ id: 'return' }) === true, 'id "return" should return true');
  assert(isTerminalLeg({ id: 'Return' }) === true, 'id "Return" (mixed case) should return true');

  assert(isTerminalLeg({ id: 'leg-1-start' }) === true, 'id ending in "-start" should return true');
  assert(isTerminalLeg({ id: 'TRIP-LEG-START' }) === true, 'id ending in "-START" (uppercase) should return true');

  assert(isTerminalLeg({ id: 'leg-9-finish' }) === true, 'id ending in "-finish" should return true');
  assert(isTerminalLeg({ id: 'TRIP-LEG-FINISH' }) === true, 'id ending in "-FINISH" (uppercase) should return true');

  // Non-matching IDs
  assert(isTerminalLeg({ id: 'leg-1' }) === false, 'standard leg id should return false');
  assert(isTerminalLeg({ id: 'start-leg' }) === false, 'id starting with "start-" (not ending with "-start") should return false');
  assert(isTerminalLeg({ id: 'finish-leg' }) === false, 'id starting with "finish-" (not ending with "-finish") should return false');

  // 4. Leg Label substring matching ('(trip start)' or '(trip finish)')
  assert(isTerminalLeg({ label: 'Brisbane (Trip Start)' }) === true, 'label containing "(Trip Start)" should return true');
  assert(isTerminalLeg({ label: 'SYDNEY (TRIP START)' }) === true, 'label containing "(TRIP START)" (uppercase) should return true');

  assert(isTerminalLeg({ label: 'Melbourne (Trip Finish)' }) === true, 'label containing "(Trip Finish)" should return true');
  assert(isTerminalLeg({ label: 'AUCKLAND (TRIP FINISH)' }) === true, 'label containing "(TRIP FINISH)" (uppercase) should return true');

  // Non-matching labels
  assert(isTerminalLeg({ label: 'Tokyo' }) === false, 'standard city label should return false');
  assert(isTerminalLeg({ label: 'Start of Trip' }) === false, 'label "Start of Trip" without parentheses tag should return false');
  assert(isTerminalLeg({ label: 'Trip Finish Line' }) === false, 'label without exact "(trip finish)" substring should return false');

  // 5. Robustness with non-string or unusual property types
  assert(isTerminalLeg({ id: 123, label: null }) === false, 'numeric id and null label should return false without error');
  assert(isTerminalLeg({ id: {}, label: [] }) === false, 'object id and array label should return false without error');

  console.log('✅ ALL isTerminalLeg UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runIsTerminalLegTests();
  } catch (err) {
    console.error(err.stack || err.message);
    process.exitCode = 1;
  }
}

module.exports = { runIsTerminalLegTests };
