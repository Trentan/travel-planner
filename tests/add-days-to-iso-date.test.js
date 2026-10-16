const path = require('path');
const { assert, createVmContext, loadSource, runScriptInContext } = require('./lib/test-helpers');

function runAddDaysToIsoDateTests() {
  console.log('Running addDaysToIsoDate unit tests...');

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

  const { addDaysToIsoDate } = context;

  assert(typeof addDaysToIsoDate === 'function', 'addDaysToIsoDate should be exported as a function');
  assert(context.window.addDaysToIsoDate === addDaysToIsoDate, 'window.addDaysToIsoDate should equal addDaysToIsoDate');

  // 1. Falsy / empty input handling
  assert(addDaysToIsoDate('') === '', 'Empty string should return empty string');
  assert(addDaysToIsoDate(null) === '', 'null input should return empty string');
  assert(addDaysToIsoDate(undefined) === '', 'undefined input should return empty string');

  // 2. Invalid date strings
  assert(addDaysToIsoDate('invalid-date', 1) === '', 'Invalid date string should return empty string');
  assert(addDaysToIsoDate('2026-13-45', 1) === '', 'Out of bounds date string should return empty string');

  // 3. Happy path additions with positive days
  assert(addDaysToIsoDate('2026-05-10', 1) === '2026-05-11', '2026-05-10 + 1 day should be 2026-05-11');
  assert(addDaysToIsoDate('2026-05-10', 5) === '2026-05-15', '2026-05-10 + 5 days should be 2026-05-15');

  // 4. Addition with 0 days
  assert(addDaysToIsoDate('2026-05-10', 0) === '2026-05-10', 'Adding 0 days should return the same date');

  // 5. Subtraction with negative days
  assert(addDaysToIsoDate('2026-05-10', -1) === '2026-05-09', '2026-05-10 - 1 day should be 2026-05-09');
  assert(addDaysToIsoDate('2026-05-10', -10) === '2026-04-30', '2026-05-10 - 10 days should be 2026-04-30');

  // 6. Month boundary crossings
  assert(addDaysToIsoDate('2026-01-31', 1) === '2026-02-01', 'Jan 31 + 1 day should cross to Feb 01');
  assert(addDaysToIsoDate('2026-03-01', -1) === '2026-02-28', 'Mar 01 - 1 day should cross back to Feb 28 in non-leap year');

  // 7. Year boundary crossings
  assert(addDaysToIsoDate('2026-12-31', 1) === '2027-01-01', 'Dec 31 + 1 day should cross to Jan 01 of next year');
  assert(addDaysToIsoDate('2026-01-01', -1) === '2025-12-31', 'Jan 01 - 1 day should cross to Dec 31 of previous year');

  // 8. Leap year date calculations
  assert(addDaysToIsoDate('2024-02-28', 1) === '2024-02-29', 'Feb 28 + 1 day in leap year 2024 should be Feb 29');
  assert(addDaysToIsoDate('2024-02-29', 1) === '2024-03-01', 'Feb 29 + 1 day in leap year 2024 should be Mar 01');
  assert(addDaysToIsoDate('2025-02-28', 1) === '2025-03-01', 'Feb 28 + 1 day in non-leap year 2025 should be Mar 01');

  console.log('✅ ALL addDaysToIsoDate UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runAddDaysToIsoDateTests();
  } catch (err) {
    console.error(err.stack || err.message);
    process.exitCode = 1;
  }
}

module.exports = { runAddDaysToIsoDateTests };
