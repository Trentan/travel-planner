const path = require('path');
const { assert, createVmContext, loadSource, runScriptInContext } = require('./lib/test-helpers');

function runPackingTests() {
  console.log('Running js/packing.js unit tests...');

  // Mock global state and DOM dependencies needed by js/packing.js
  const documentMock = {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {}
  };

  const sampleLeaveHomeData = [
    { text: 'Kitchen and bins', kind: 'section' },
    { text: 'Empty fridge', done: true },
    { text: 'Empty bins', done: false },
    { text: 'Home shutdown', kind: 'section' },
    { text: 'Turn power off', done: true }
  ];

  const sampleHotelCheckoutData = [
    { text: 'Room Sweep', kind: 'section' },
    { text: 'Check under the bed', done: true },
    { text: 'Check the safe', done: false },
    { text: 'Check power outlets', done: false }
  ];

  const samplePackingData = [
    {
      areaName: '🧳 Carry-on Packed Bag (Main Luggage)',
      areaColor: '#2980B9',
      categories: [
        {
          title: 'Clothes',
          items: [
            { text: 'T-shirts', done: true },
            { text: 'Pants', done: false }
          ]
        },
        {
          title: 'Shoes',
          items: [
            { text: 'Sneakers', done: true },
            { text: 'Sandals', done: true }
          ]
        }
      ]
    }
  ];

  const context = createVmContext({
    document: documentMock,
    leaveHomeData: JSON.parse(JSON.stringify(sampleLeaveHomeData)),
    hotelCheckoutData: JSON.parse(JSON.stringify(sampleHotelCheckoutData)),
    packingData: JSON.parse(JSON.stringify(samplePackingData)),
    buildPackingTab: () => {},
    saveData: () => {},
    confirm: () => true
  });
  context.window = context;

  const packingSource = loadSource(path.join('js', 'packing.js'));
  runScriptInContext(packingSource, context, 'js/packing.js');

  const {
    isLeaveHomeSection,
    isActiveGuide,
    countLeaveHomeTasks,
    countCompletedLeaveHomeTasks,
    countHotelCheckoutTasks,
    countCompletedHotelCheckoutTasks,
    calculatePackingAreaProgress
  } = context;

  assert(typeof isLeaveHomeSection === 'function', 'isLeaveHomeSection should be exported as a function');

  // -------------------------------------------------------------
  // 1. isLeaveHomeSection Unit Tests
  // -------------------------------------------------------------

  // Valid section objects -> true
  assert(isLeaveHomeSection({ kind: 'section' }) === true, '{ kind: "section" } should return true');
  assert(
    isLeaveHomeSection({ text: 'Kitchen and bins', kind: 'section' }) === true,
    'Section item with text should return true'
  );
  assert(
    isLeaveHomeSection({ text: 'Leaving home', kind: 'section', done: false }) === true,
    'Section item with extra properties should return true'
  );

  // Non-section objects -> false
  assert(isLeaveHomeSection({ text: 'Empty fridge', done: false }) === false, 'Task item without kind property should return false');
  assert(isLeaveHomeSection({ kind: 'item', text: 'Task 1' }) === false, 'Item with kind "item" should return false');
  assert(isLeaveHomeSection({ kind: 'task', text: 'Task 1' }) === false, 'Item with kind "task" should return false');
  assert(isLeaveHomeSection({}) === false, 'Empty object should return false');

  // Non-matching kind values -> false
  assert(isLeaveHomeSection({ kind: 'SECTION' }) === false, 'Uppercase kind "SECTION" should return false (case-sensitive)');
  assert(isLeaveHomeSection({ kind: 'Section' }) === false, 'Capitalized kind "Section" should return false');
  assert(isLeaveHomeSection({ kind: 123 }) === false, 'Numeric kind should return false');
  assert(isLeaveHomeSection({ kind: null }) === false, 'null kind should return false');
  assert(isLeaveHomeSection({ kind: undefined }) === false, 'undefined kind should return false');
  assert(isLeaveHomeSection({ kind: true }) === false, 'Boolean kind should return false');

  // Nullish and falsy values -> false
  assert(isLeaveHomeSection(null) === false, 'null input should return strict false');
  assert(isLeaveHomeSection(undefined) === false, 'undefined input should return strict false');
  assert(isLeaveHomeSection(false) === false, 'boolean false input should return strict false');
  assert(isLeaveHomeSection(0) === false, 'numeric 0 input should return strict false');
  assert(isLeaveHomeSection('') === false, 'empty string input should return strict false');
  assert(isLeaveHomeSection(NaN) === false, 'NaN input should return strict false');

  // Non-object primitives -> false
  assert(isLeaveHomeSection(123) === false, 'numeric input should return false');
  assert(isLeaveHomeSection('section') === false, 'string "section" input should return false');
  assert(isLeaveHomeSection(true) === false, 'boolean true input should return false');

  // -------------------------------------------------------------
  // 2. Associated Packing Helper Function Unit Tests
  // -------------------------------------------------------------

  // countLeaveHomeTasks (excludes section items)
  assert(countLeaveHomeTasks() === 3, 'countLeaveHomeTasks should count 3 non-section tasks in sample data');
  assert(countCompletedLeaveHomeTasks() === 2, 'countCompletedLeaveHomeTasks should count 2 completed tasks');

  // countHotelCheckoutTasks (excludes section items)
  assert(countHotelCheckoutTasks() === 3, 'countHotelCheckoutTasks should count 3 non-section tasks in sample data');
  assert(countCompletedHotelCheckoutTasks() === 1, 'countCompletedHotelCheckoutTasks should count 1 completed task');

  // calculatePackingAreaProgress
  const progress = calculatePackingAreaProgress(0);
  assert(progress.total === 4, 'calculatePackingAreaProgress total should be 4');
  assert(progress.done === 3, 'calculatePackingAreaProgress done should be 3');
  assert(progress.percent === 75, 'calculatePackingAreaProgress percent should be 75');

  // isActiveGuide
  assert(isActiveGuide('leaveHome') === false, 'isActiveGuide should return false when no active guide panel');

  console.log('✅ ALL js/packing.js UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runPackingTests();
  } catch (err) {
    console.error(err.stack || err.message);
    process.exitCode = 1;
  }
}

module.exports = { runPackingTests };
