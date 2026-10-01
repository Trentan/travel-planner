const path = require('path');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function runGetMobilePagerStateStoreTests() {
  console.log('Running getMobilePagerStateStore unit tests...');

  // 1. Basic window context setup
  const context = createVmContext({
    document: {
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => []
    }
  });
  context.window = context;

  const utilsSource = loadSource(path.join('js', 'utils.js'));
  runScriptInContext(utilsSource, context, 'js/utils.js');

  const getMobilePagerStateStore = context.window.getMobilePagerStateStore;
  assert(typeof getMobilePagerStateStore === 'function', 'getMobilePagerStateStore should be exported on window');

  // 2. Initialization test: initializes window.__mobilePagerState as an empty object when undefined
  assert(context.window.__mobilePagerState === undefined, 'window.__mobilePagerState should initially be undefined');
  const store1 = getMobilePagerStateStore();
  assert(typeof store1 === 'object' && store1 !== null, 'getMobilePagerStateStore should return an object');
  assert(context.window.__mobilePagerState === store1, 'getMobilePagerStateStore should set window.__mobilePagerState');
  assert(Object.keys(store1).length === 0, 'Initial state store should be empty');

  // 3. Subsequent retrieval test: returns exact same reference and retains mutations
  store1['day-pager-1'] = 2;
  const store2 = getMobilePagerStateStore();
  assert(store2 === store1, 'Subsequent calls to getMobilePagerStateStore should return same reference');
  assert(store2['day-pager-1'] === 2, 'Stored state mutations should persist');

  // 4. Testing environment where window is undefined at call time
  const noWindowCtx = createVmContext({});
  noWindowCtx.window = noWindowCtx;
  runScriptInContext(utilsSource, noWindowCtx, 'js/utils.js');
  const standaloneFunc = noWindowCtx.getMobilePagerStateStore;
  delete noWindowCtx.window;
  const resultNoWindow = standaloneFunc();
  assert(typeof resultNoWindow === 'object' && resultNoWindow !== null, 'Should return object when window is undefined');
  assert(Object.keys(resultNoWindow).length === 0, 'Should return empty object when window is undefined');

  // 5. Interoperability with mobile pager helper functions
  const setMobilePagerActiveIndex = context.window.setMobilePagerActiveIndex;
  const getMobilePagerActiveIndex = context.window.getMobilePagerActiveIndex;
  const resetMobilePagerActiveIndex = context.window.resetMobilePagerActiveIndex;

  assert(typeof setMobilePagerActiveIndex === 'function', 'setMobilePagerActiveIndex should be exported on window');
  assert(typeof getMobilePagerActiveIndex === 'function', 'getMobilePagerActiveIndex should be exported on window');
  assert(typeof resetMobilePagerActiveIndex === 'function', 'resetMobilePagerActiveIndex should be exported on window');

  // Set and Get active index
  setMobilePagerActiveIndex('trip-leg-1', 3);
  assert(getMobilePagerActiveIndex('trip-leg-1') === 3, 'getMobilePagerActiveIndex should return set value 3');
  assert(context.window.__mobilePagerState['trip-leg-1'] === 3, 'store should directly contain key and value 3');

  // Clamp invalid/negative numbers to 0
  setMobilePagerActiveIndex('trip-leg-1', -5);
  assert(getMobilePagerActiveIndex('trip-leg-1') === 0, 'Negative index should be clamped to 0');

  // Fallback testing
  assert(getMobilePagerActiveIndex('non-existent-key', 2) === 2, 'Should return fallback index 2 when key missing');
  assert(getMobilePagerActiveIndex('', 5) === 5, 'Should return fallback when key is empty');

  // Reset active index
  resetMobilePagerActiveIndex('trip-leg-1');
  assert(context.window.__mobilePagerState['trip-leg-1'] === undefined, 'Key should be removed after reset');
  assert(getMobilePagerActiveIndex('trip-leg-1', 0) === 0, 'Active index should revert to fallback after reset');

  console.log('✅ ALL getMobilePagerStateStore UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runGetMobilePagerStateStoreTests();
  } catch (err) {
    console.error('❌ getMobilePagerStateStore TEST FAILED:', err.message);
    process.exit(1);
  }
}

module.exports = { runGetMobilePagerStateStoreTests };
