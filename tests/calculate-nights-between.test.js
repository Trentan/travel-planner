const path = require('path');
const { assert, createVmContext, loadSource, runScriptInContext } = require('./lib/test-helpers');

function runCalculateNightsBetweenTests() {
  console.log('Running calculateNightsBetween unit tests...');

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

  const calculateNightsBetween = context.window.calculateNightsBetween || context.calculateNightsBetween;

  assert(typeof calculateNightsBetween === 'function', 'calculateNightsBetween should be defined as a function');

  // 1. Falsy and missing inputs
  assert(calculateNightsBetween() === 0, 'calculateNightsBetween() with no args should return 0');
  assert(calculateNightsBetween(null, '2025-06-10') === 0, 'calculateNightsBetween(null, checkOut) should return 0');
  assert(calculateNightsBetween('2025-06-10', null) === 0, 'calculateNightsBetween(checkIn, null) should return 0');
  assert(calculateNightsBetween('', '') === 0, 'calculateNightsBetween("", "") should return 0');
  assert(calculateNightsBetween(undefined, undefined) === 0, 'calculateNightsBetween(undefined, undefined) should return 0');

  // 2. Invalid date strings
  assert(calculateNightsBetween('invalid', '2025-06-10') === 0, 'Invalid checkIn date string should return 0');
  assert(calculateNightsBetween('2025-06-10', 'not-a-date') === 0, 'Invalid checkOut date string should return 0');
  assert(calculateNightsBetween('abc', 'xyz') === 0, 'Two invalid date strings should return 0');

  // 3. Same checkIn and checkOut date (0 nights)
  assert(calculateNightsBetween('2025-06-10', '2025-06-10') === 0, 'Same checkIn and checkOut date should return 0 nights');

  // 4. Single night stay
  assert(calculateNightsBetween('2025-06-10', '2025-06-11') === 1, 'CheckIn 2025-06-10 and CheckOut 2025-06-11 should return 1 night');

  // 5. Multi-night stay within same month
  assert(calculateNightsBetween('2025-06-10', '2025-06-15') === 5, 'CheckIn 2025-06-10 and CheckOut 2025-06-15 should return 5 nights');

  // 6. Month boundary transition
  assert(calculateNightsBetween('2025-03-29', '2025-04-02') === 4, 'CheckIn 2025-03-29 to 2025-04-02 across month boundary should return 4 nights');

  // 7. Year boundary transition
  assert(calculateNightsBetween('2025-12-28', '2026-01-04') === 7, 'CheckIn 2025-12-28 to 2026-01-04 across year boundary should return 7 nights');

  // 8. Leap year transitions
  // 2024 is a leap year (Feb 29 exists -> 2 nights from Feb 28 to Mar 1)
  assert(calculateNightsBetween('2024-02-28', '2024-03-01') === 2, '2024 leap year: Feb 28 to Mar 1 should return 2 nights');
  // 2025 is a non-leap year (Feb 28 to Mar 1 is 1 night)
  assert(calculateNightsBetween('2025-02-28', '2025-03-01') === 1, '2025 non-leap year: Feb 28 to Mar 1 should return 1 night');

  // 9. CheckOut before checkIn (negative diff clamped to 0)
  assert(calculateNightsBetween('2025-06-15', '2025-06-10') === 0, 'CheckOut before checkIn should return 0 nights (clamped)');

  console.log('✅ ALL calculateNightsBetween UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runCalculateNightsBetweenTests();
  } catch (err) {
    console.error('❌ calculateNightsBetween TEST FAILED:', err.stack || err.message);
    process.exitCode = 1;
  }
}

module.exports = { runCalculateNightsBetweenTests };
