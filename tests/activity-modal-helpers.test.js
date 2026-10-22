const path = require('path');
const { assert, createVmContext, loadSource, runScriptInContext } = require('./lib/test-helpers');

function runActivityModalHelpersTests() {
  console.log('Running activity modal helpers (addActivity, openEditActivityModal, _openActivityModal) unit tests...');

  // 1. CommonJS exports presence test
  const actModal = require('../js/activity-modal');
  assert(typeof actModal.addActivity === 'function', 'addActivity should be exported via CommonJS');
  assert(typeof actModal.openEditActivityModal === 'function', 'openEditActivityModal should be exported via CommonJS');
  assert(typeof actModal._openActivityModal === 'function', '_openActivityModal should be exported via CommonJS');

  // 2. VM / Window context test verifying invocation & argument forwarding
  let calls = [];
  const context = createVmContext({
    appData: [{ suggestedActivities: [] }]
  });

  const actModalCode = loadSource(path.join('js', 'activity-modal.js'));
  runScriptInContext(actModalCode, context, 'js/activity-modal.js');

  // Override openActivityModalUnified in context to track calls and return mock response
  context.openActivityModalUnified = (legIdx, activityIdx, options) => {
    calls.push({ legIdx, activityIdx, options });
    return { status: 'modal_opened', legIdx, activityIdx, options };
  };

  assert(typeof context.addActivity === 'function', 'addActivity should be assigned to window/global scope');
  assert(typeof context.openEditActivityModal === 'function', 'openEditActivityModal should be assigned to window/global scope');
  assert(typeof context._openActivityModal === 'function', '_openActivityModal should be assigned to window/global scope');

  // Test addActivity
  calls = [];
  let res = context.addActivity(0);
  assert(calls.length === 1, 'addActivity should call openActivityModalUnified once');
  assert(calls[0].legIdx === 0, 'addActivity(0) should pass 0 as legIdx');
  assert(calls[0].activityIdx === undefined, 'addActivity should pass undefined for activityIdx');
  assert(res.status === 'modal_opened' && res.legIdx === 0, 'addActivity should return result of openActivityModalUnified');

  calls = [];
  res = context.addActivity(5);
  assert(calls.length === 1, 'addActivity(5) should call openActivityModalUnified once');
  assert(calls[0].legIdx === 5, 'addActivity(5) should pass legIdx = 5');

  calls = [];
  res = context.addActivity(null);
  assert(calls.length === 1 && calls[0].legIdx === null, 'addActivity(null) should forward null');

  // Test openEditActivityModal
  calls = [];
  res = context.openEditActivityModal(2, 3);
  assert(calls.length === 1, 'openEditActivityModal should call openActivityModalUnified once');
  assert(calls[0].legIdx === 2, 'openEditActivityModal should pass legIdx = 2');
  assert(calls[0].activityIdx === 3, 'openEditActivityModal should pass activityIdx = 3');
  assert(res.status === 'modal_opened' && res.legIdx === 2 && res.activityIdx === 3, 'openEditActivityModal should return result of openActivityModalUnified');

  calls = [];
  res = context.openEditActivityModal(0, 0);
  assert(calls.length === 1, 'openEditActivityModal(0, 0) should call openActivityModalUnified once');
  assert(calls[0].legIdx === 0 && calls[0].activityIdx === 0, 'openEditActivityModal(0, 0) should pass 0 for both legIdx and activityIdx');

  // Test _openActivityModal
  calls = [];
  const opts = { titleOverride: 'Custom Title' };
  res = context._openActivityModal(1, 4, opts);
  assert(calls.length === 1, '_openActivityModal should call openActivityModalUnified once');
  assert(calls[0].legIdx === 1, '_openActivityModal should pass legIdx = 1');
  assert(calls[0].activityIdx === 4, '_openActivityModal should pass activityIdx = 4');
  assert(calls[0].options === opts, '_openActivityModal should forward options');
  assert(res.status === 'modal_opened', '_openActivityModal should return result of openActivityModalUnified');

  // 3. Test edge case: legIdx does not exist in appData (early return from openActivityModalUnified)
  const realModalContext = createVmContext({
    appData: []
  });
  runScriptInContext(actModalCode, realModalContext, 'js/activity-modal.js');

  const emptyResult = realModalContext.addActivity(99);
  assert(emptyResult === undefined, 'addActivity(99) with out-of-bounds legIdx should safely return undefined from openActivityModalUnified');

  const emptyEditResult = realModalContext.openEditActivityModal(99, 0);
  assert(emptyEditResult === undefined, 'openEditActivityModal(99, 0) with out-of-bounds legIdx should safely return undefined from openActivityModalUnified');

  console.log('✅ ALL ACTIVITY MODAL HELPERS UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runActivityModalHelpersTests();
  } catch (err) {
    console.error(err.stack || err.message);
    process.exitCode = 1;
  }
}

module.exports = { runActivityModalHelpersTests };
