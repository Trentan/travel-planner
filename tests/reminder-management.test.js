const path = require('path');
const { assert, createVmContext, loadSource, runScriptInContext } = require('./lib/test-helpers');

function createReminderTestContext(storageMockOptions = {}) {
  const localStorageMap = new Map();
  let throwsOnGet = storageMockOptions.throwsOnGet || false;
  let throwsOnSet = storageMockOptions.throwsOnSet || false;
  let throwsOnRemove = storageMockOptions.throwsOnRemove || false;

  const mockLocalStorage = {
    getItem(key) {
      if (throwsOnGet) throw new Error('localStorage getItem blocked');
      return localStorageMap.has(key) ? localStorageMap.get(key) : null;
    },
    setItem(key, value) {
      if (throwsOnSet) throw new Error('localStorage setItem blocked');
      localStorageMap.set(key, String(value));
    },
    removeItem(key) {
      if (throwsOnRemove) throw new Error('localStorage removeItem blocked');
      localStorageMap.delete(key);
    },
    clear() {
      localStorageMap.clear();
    }
  };

  const dummyElement = {
    addEventListener: () => {},
    setAttribute: () => {},
    getAttribute: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    style: { setProperty: () => {} },
    dataset: {},
    classList: { toggle: () => {}, contains: () => false, add: () => {}, remove: () => {} },
    innerText: '',
    textContent: '',
    value: '',
    tagName: 'DIV'
  };

  const dummyDoc = {
    querySelectorAll: () => [],
    querySelector: () => null,
    getElementById: () => dummyElement,
    addEventListener: () => {},
    documentElement: dummyElement,
    body: dummyElement
  };

  let rebuildCurrentViewCallCount = 0;

  const context = createVmContext({
    window: {
      addEventListener: () => {},
      matchMedia: () => ({ matches: false, addEventListener: () => {} }),
      scrollY: 0
    },
    document: dummyDoc,
    localStorage: mockLocalStorage,
    sessionStorage: mockLocalStorage
  });

  context.window.window = context.window;
  context.window.document = dummyDoc;

  const uiSource = loadSource(path.join('js', 'ui.js'));
  runScriptInContext(uiSource, context, 'js/ui.js');

  // Override rebuildCurrentView with spy after ui.js loads
  context.rebuildCurrentView = () => {
    rebuildCurrentViewCallCount++;
  };
  context.window.rebuildCurrentView = context.rebuildCurrentView;

  return {
    context,
    localStorageMap,
    getRebuildCallCount: () => rebuildCurrentViewCallCount,
    resetRebuildCallCount: () => { rebuildCurrentViewCallCount = 0; },
    setStorageThrows: (get, set, remove) => {
      throwsOnGet = get;
      throwsOnSet = set;
      throwsOnRemove = remove;
    }
  };
}

async function runReminderManagementTests() {
  console.log('Running UI Reminder Management unit tests...');

  // --- Test 1: dismissTimelineReminder adds key, persists to localStorage, and triggers view rebuild ---
  {
    const env = createReminderTestContext();
    const { context, localStorageMap } = env;

    assert(context.isReminderDismissed('key1') === false, 'Initially key1 should not be dismissed');
    assert(context.window.isReminderDismissed('key1') === false, 'window.isReminderDismissed should match initial state');

    context.dismissTimelineReminder('key1');

    assert(context.isReminderDismissed('key1') === true, 'key1 should now be dismissed');
    assert(context.window.isReminderDismissed('key1') === true, 'window.isReminderDismissed should return true for key1');
    assert(env.getRebuildCallCount() === 1, 'rebuildCurrentView should be called once');

    const savedJson = localStorageMap.get('travelApp_dismissedReminders_v1');
    assert(savedJson !== undefined, 'Dismissed reminders should be saved to localStorage');
    assert(JSON.parse(savedJson).includes('key1'), 'localStorage should contain key1');

    // Dismiss second key
    context.dismissTimelineReminder('key2');
    assert(context.isReminderDismissed('key2') === true, 'key2 should now be dismissed');
    assert(env.getRebuildCallCount() === 2, 'rebuildCurrentView should be called again');

    const savedArray = JSON.parse(localStorageMap.get('travelApp_dismissedReminders_v1'));
    assert(savedArray.length === 2 && savedArray.includes('key1') && savedArray.includes('key2'), 'localStorage should contain both key1 and key2');
  }

  // --- Test 2: resetDismissedReminders clears dismissed reminders, removes from localStorage, and triggers view rebuild ---
  {
    const env = createReminderTestContext();
    const { context, localStorageMap } = env;

    context.dismissTimelineReminder('reminder-A');
    context.dismissTimelineReminder('reminder-B');
    assert(localStorageMap.has('travelApp_dismissedReminders_v1'), 'localStorage should have saved reminders key');

    env.resetRebuildCallCount();
    context.resetDismissedReminders();

    assert(context.isReminderDismissed('reminder-A') === false, 'reminder-A should no longer be dismissed after reset');
    assert(context.isReminderDismissed('reminder-B') === false, 'reminder-B should no longer be dismissed after reset');
    assert(localStorageMap.has('travelApp_dismissedReminders_v1') === false, 'travelApp_dismissedReminders_v1 should be removed from localStorage');
    assert(env.getRebuildCallCount() === 1, 'resetDismissedReminders should trigger rebuildCurrentView');
  }

  // --- Test 3: loadDismissedReminders restores saved reminders from localStorage ---
  {
    const env = createReminderTestContext();
    const { context, localStorageMap } = env;

    localStorageMap.set('travelApp_dismissedReminders_v1', JSON.stringify(['saved-rem-1', 'saved-rem-2']));
    context.applyUiSettings(); // calls loadDismissedReminders() internally

    assert(context.isReminderDismissed('saved-rem-1') === true, 'saved-rem-1 loaded from localStorage should be dismissed');
    assert(context.isReminderDismissed('saved-rem-2') === true, 'saved-rem-2 loaded from localStorage should be dismissed');
    assert(context.isReminderDismissed('unsaved-rem') === false, 'unsaved-rem should not be dismissed');
  }

  // --- Test 4: loadDismissedReminders handles corrupted JSON and non-array storage values gracefully ---
  {
    const env = createReminderTestContext();
    const { context, localStorageMap } = env;

    // 4a. Invalid JSON syntax
    localStorageMap.set('travelApp_dismissedReminders_v1', '{corrupted_json_syntax');
    context.applyUiSettings();
    assert(context.isReminderDismissed('any-key') === false, 'Corrupted JSON should fall back to empty Set without throwing');

    // 4b. Non-array JSON (e.g. JSON object)
    localStorageMap.set('travelApp_dismissedReminders_v1', JSON.stringify({ key: 'value' }));
    context.applyUiSettings();
    assert(context.isReminderDismissed('any-key') === false, 'Non-array JSON should fall back to empty Set');

    // 4c. JSON null
    localStorageMap.set('travelApp_dismissedReminders_v1', 'null');
    context.applyUiSettings();
    assert(context.isReminderDismissed('any-key') === false, 'null JSON value should fall back to empty Set');
  }

  // --- Test 5: Storage error handling (e.g. restricted/quota exceeded/disabled localStorage) ---
  {
    const env = createReminderTestContext();
    const { context } = env;

    // Make getItem throw errors during loadDismissedReminders
    env.setStorageThrows(true, false, false);
    context.applyUiSettings();
    assert(context.isReminderDismissed('test') === false, 'Should handle localStorage getItem throwing without exception');

    // Make setItem and removeItem throw errors during dismiss/reset
    env.setStorageThrows(false, true, true);

    // dismissTimelineReminder should handle setItem throwing
    context.dismissTimelineReminder('test-key');
    assert(context.isReminderDismissed('test-key') === true, 'dismissTimelineReminder should update in-memory state even if setItem throws');

    // resetDismissedReminders should handle removeItem throwing
    context.resetDismissedReminders();
    assert(context.isReminderDismissed('test-key') === false, 'resetDismissedReminders should clear in-memory state even if removeItem throws');
  }

  // --- Test 6: Functions work when rebuildCurrentView is null/undefined ---
  {
    const env = createReminderTestContext();
    const { context } = env;

    delete context.rebuildCurrentView;
    delete context.window.rebuildCurrentView;

    // These should not throw when rebuildCurrentView is missing
    context.dismissTimelineReminder('no-rebuild-key');
    assert(context.isReminderDismissed('no-rebuild-key') === true, 'dismissTimelineReminder works without rebuildCurrentView');

    context.resetDismissedReminders();
    assert(context.isReminderDismissed('no-rebuild-key') === false, 'resetDismissedReminders works without rebuildCurrentView');
  }

  // --- Test 7: Verify window scope global exports ---
  {
    const env = createReminderTestContext();
    const { context } = env;

    assert(typeof context.window.isReminderDismissed === 'function', 'window.isReminderDismissed is exported');
    assert(typeof context.window.dismissTimelineReminder === 'function', 'window.dismissTimelineReminder is exported');
    assert(typeof context.window.resetDismissedReminders === 'function', 'window.resetDismissedReminders is exported');

    context.window.dismissTimelineReminder('win-key');
    assert(context.window.isReminderDismissed('win-key') === true, 'window.dismissTimelineReminder updates state correctly');

    context.window.resetDismissedReminders();
    assert(context.window.isReminderDismissed('win-key') === false, 'window.resetDismissedReminders resets state correctly');
  }

  console.log('✅ ALL UI Reminder Management unit tests passed cleanly!');
}

if (require.main === module) {
  try {
    runReminderManagementTests().then(() => {
      process.exit(0);
    }).catch(err => {
      console.error('❌ reminder-management.test.js TEST FAILED:', err.stack || err.message);
      process.exit(1);
    });
  } catch (err) {
    console.error('❌ reminder-management.test.js TEST FAILED:', err.stack || err.message);
    process.exit(1);
  }
}

module.exports = { runReminderManagementTests };
