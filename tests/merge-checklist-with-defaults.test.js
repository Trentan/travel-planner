const path = require('path');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function runMergeChecklistWithDefaultsTests() {
  console.log('Running mergeChecklistWithDefaults unit tests...');

  const context = createVmContext({
    window: {},
    document: { getElementById: () => null, querySelectorAll: () => [] }
  });
  context.window = context;

  const utilsSource = loadSource(path.join('js', 'utils.js'));
  runScriptInContext(utilsSource, context, 'js/utils.js');

  const normalizeChecklistText = context.window.normalizeChecklistText;
  const getChecklistItemKeys = context.window.getChecklistItemKeys;
  const mergeChecklistWithDefaults = context.window.mergeChecklistWithDefaults;

  assert(typeof normalizeChecklistText === 'function', 'normalizeChecklistText should be exported on window');
  assert(typeof getChecklistItemKeys === 'function', 'getChecklistItemKeys should be exported on window');
  assert(typeof mergeChecklistWithDefaults === 'function', 'mergeChecklistWithDefaults should be exported on window');

  // 1. Helper function normalizeChecklistText
  assert(normalizeChecklistText('  Check   ALL   Lights  ') === 'check all lights', 'normalizeChecklistText should trim, lowercase, and collapse whitespace');
  assert(normalizeChecklistText(null) === '', 'normalizeChecklistText should return empty string for null');
  assert(normalizeChecklistText(undefined) === '', 'normalizeChecklistText should return empty string for undefined');

  // 2. Helper function getChecklistItemKeys
  assert(getChecklistItemKeys(null).length === 0, 'getChecklistItemKeys should return empty array for null');
  assert(getChecklistItemKeys({ text: '  Empty Bins  ', mergeKeys: ['take out rubbish', 'take OUT rubbish'] }).join(',') === 'empty bins,take out rubbish', 'getChecklistItemKeys should extract normalized primary and unique merge keys');

  // 3. Fallback for invalid/falsy inputs and default parameters
  const defaultFallbackMerged = mergeChecklistWithDefaults(null);
  assert(Array.isArray(defaultFallbackMerged), 'mergeChecklistWithDefaults should return an array when savedItems is null');
  assert(defaultFallbackMerged.length > 0, 'mergeChecklistWithDefaults should default to DEFAULT_LEAVE_HOME when defaultItems is omitted');
  assert(defaultFallbackMerged.some(item => item.text === 'Kitchen and bins' && item.kind === 'section'), 'DEFAULT_LEAVE_HOME section should be present');

  const emptyDefaultsMerged = mergeChecklistWithDefaults(null, null);
  assert(Array.isArray(emptyDefaultsMerged) && emptyDefaultsMerged.length === 0, 'Should return empty array when both inputs are non-arrays/falsy');

  const nonArraySaved = mergeChecklistWithDefaults('invalid string', [
    { text: 'Item 1', done: false }
  ]);
  assert(nonArraySaved.length === 1 && nonArraySaved[0].text === 'Item 1', 'Non-array savedItems should be treated as empty array');

  // 4. Exact primary text matching, case-insensitivity, and whitespace normalization
  const customDefaults = [
    { text: 'Header Section', kind: 'section' },
    { text: 'Lock back door', done: false },
    { text: 'Turn off aircon', done: false }
  ];
  const savedItems1 = [
    { text: '  LOCK BACK DOOR ', done: true },
    { text: 'turn OFF aircon', done: true }
  ];
  const merged1 = mergeChecklistWithDefaults(savedItems1, customDefaults);
  assert(merged1.length === 3, 'Merged list should contain section and 2 matched items');
  assert(merged1[1].text === 'Lock back door' && merged1[1].done === true, 'Matching item should retain original default text and receive saved done state');
  assert(merged1[2].text === 'Turn off aircon' && merged1[2].done === true, 'Case-insensitive matching should update done state to true');

  // 5. Matching via mergeKeys alias
  const aliasDefaults = [
    { text: 'Empty bins', done: false, mergeKeys: ['take out all rubbish and recycling'] }
  ];
  const savedItemsAlias = [
    { text: 'Take out all rubbish and recycling', done: true, customNote: 'Done on Tuesday' }
  ];
  const mergedAlias = mergeChecklistWithDefaults(savedItemsAlias, aliasDefaults);
  assert(mergedAlias.length === 1, 'Should match default item via mergeKeys alias');
  assert(mergedAlias[0].text === 'Empty bins', 'Primary default text should be preserved');
  assert(mergedAlias[0].done === true, 'Saved done state should be preserved');
  assert(mergedAlias[0].customNote === 'Done on Tuesday', 'Custom saved properties should be merged onto default item');

  // 6. Section header handling
  const sectionDefaults = [
    { text: 'Kitchen section', kind: 'section' }
  ];
  const savedSection = [
    { text: 'Kitchen section', done: true, extra: 'test' }
  ];
  const mergedSection = mergeChecklistWithDefaults(savedSection, sectionDefaults);
  assert(mergedSection[0].kind === 'section', 'Section item should retain kind: section');
  assert(mergedSection[0].done === undefined, 'Section item should not be assigned boolean done status');

  // 7. Appending unmatched custom user items
  const savedUnmatched = [
    { text: 'Custom user task', done: true },
    { text: 'Another custom task' } // done property omitted
  ];
  const mergedUnmatched = mergeChecklistWithDefaults(savedUnmatched, customDefaults);
  assert(mergedUnmatched.length === 5, 'Unmatched saved items should be appended');
  const customTask = mergedUnmatched.find(item => item.text === 'Custom user task');
  assert(customTask && customTask.done === true, 'Custom task with done=true should preserve done=true');
  const taskWithoutDone = mergedUnmatched.find(item => item.text === 'Another custom task');
  assert(taskWithoutDone && taskWithoutDone.done === false, 'Unmatched custom task without boolean done should default done to false');

  // 8. One-to-one matching rule (each saved item matches at most one default item)
  const duplicateDefaults = [
    { text: 'Check windows', done: false },
    { text: 'Check windows', done: false }
  ];
  const singleSaved = [
    { text: 'Check windows', done: true }
  ];
  const mergedDup = mergeChecklistWithDefaults(singleSaved, duplicateDefaults);
  assert(mergedDup[0].done === true, 'First matching default item should receive done=true');
  assert(mergedDup[1].done === false, 'Second default item should remain unmatched and default done to false');

  console.log('✅ ALL mergeChecklistWithDefaults UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runMergeChecklistWithDefaultsTests();
  } catch (err) {
    console.error('❌ mergeChecklistWithDefaults TEST FAILED:', err.message);
    process.exit(1);
  }
}

module.exports = { runMergeChecklistWithDefaultsTests };
