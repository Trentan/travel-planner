const path = require('path');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function runLoadDismissedRemindersTests() {
  console.log('Running loadDismissedReminders unit tests...');

  const dummyDoc = {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    documentElement: { setAttribute: () => {} },
    body: { classList: { toggle: () => {}, remove: () => {} } }
  };

  let mockStorage = {};
  let throwOnGetItem = false;
  let throwOnSetItem = false;
  let throwOnRemoveItem = false;

  const localStorageMock = {
    getItem: key => {
      if (throwOnGetItem) {
        throw new Error('SecurityError: The operation is insecure.');
      }
      return mockStorage.hasOwnProperty(key) ? mockStorage[key] : null;
    },
    setItem: (key, val) => {
      if (throwOnSetItem) {
        throw new Error('QuotaExceededError: Storage quota exceeded.');
      }
      mockStorage[key] = String(val);
    },
    removeItem: key => {
      if (throwOnRemoveItem) {
        throw new Error('SecurityError: The operation is insecure.');
      }
      delete mockStorage[key];
    }
  };

  const context = createVmContext({
    window: {
      addEventListener: () => {},
      matchMedia: () => ({ matches: false, addEventListener: () => {} }),
      scrollY: 0
    },
    document: dummyDoc,
    localStorage: localStorageMock,
    sessionStorage: localStorageMock
  });
  context.window.window = context.window;
  context.window.document = dummyDoc;

  const uiSource = loadSource(path.join('js', 'ui.js'));
  runScriptInContext(uiSource, context, 'js/ui.js');

  const loadDismissedReminders = context.window.loadDismissedReminders;
  const isReminderDismissed = context.window.isReminderDismissed;
  const dismissTimelineReminder = context.window.dismissTimelineReminder;
  const resetDismissedReminders = context.window.resetDismissedReminders;
  const saveDismissedReminders = context.window.saveDismissedReminders || context.saveDismissedReminders;
  const applyTheme = context.window.applyTheme;
  const applyUiSettings = context.window.applyUiSettings;

  assert(typeof loadDismissedReminders === 'function', 'loadDismissedReminders should be exposed on window');

  // 1. Happy path: Valid JSON array stored in localStorage
  mockStorage = {
    'travelApp_dismissedReminders_v1': JSON.stringify(['reminder-1', 'reminder-2'])
  };
  throwOnGetItem = false;
  throwOnSetItem = false;
  throwOnRemoveItem = false;

  loadDismissedReminders();
  assert(isReminderDismissed('reminder-1') === true, 'reminder-1 should be marked as dismissed');
  assert(isReminderDismissed('reminder-2') === true, 'reminder-2 should be marked as dismissed');
  assert(isReminderDismissed('reminder-3') === false, 'reminder-3 should not be marked as dismissed');

  // 2. Missing or empty localStorage key (should clear pre-existing state)
  mockStorage = {};
  loadDismissedReminders();
  assert(isReminderDismissed('reminder-1') === false, 'dismissedReminders should reset to empty set when key is missing');

  // 3. Exception thrown by localStorage.getItem (SecurityError) when set was previously populated
  // Populating initial state
  mockStorage = {
    'travelApp_dismissedReminders_v1': JSON.stringify(['rem-pre-existing'])
  };
  loadDismissedReminders();
  assert(isReminderDismissed('rem-pre-existing') === true, 'rem-pre-existing should be dismissed initially');

  // Now trigger error on getItem
  throwOnGetItem = true;
  loadDismissedReminders();
  assert(isReminderDismissed('rem-pre-existing') === false, 'dismissedReminders should reset to empty set when localStorage.getItem throws an exception');

  // 4. Invalid / corrupt JSON syntax error path (should reset pre-populated state)
  throwOnGetItem = false;
  mockStorage = {
    'travelApp_dismissedReminders_v1': JSON.stringify(['rem-before-corrupt'])
  };
  loadDismissedReminders();
  assert(isReminderDismissed('rem-before-corrupt') === true, 'rem-before-corrupt should be set initially');

  mockStorage = {
    'travelApp_dismissedReminders_v1': '{invalid-json-syntax'
  };
  loadDismissedReminders();
  assert(isReminderDismissed('rem-before-corrupt') === false, 'dismissedReminders should reset to empty set on JSON parse failure');

  // 5. Non-array JSON values (object, number, string, boolean, null) resetting pre-populated state
  const nonArrayValues = [
    JSON.stringify({ key: 'value' }),
    JSON.stringify(12345),
    JSON.stringify('some-string'),
    JSON.stringify(true),
    JSON.stringify(false),
    'null'
  ];

  nonArrayValues.forEach(val => {
    mockStorage = {
      'travelApp_dismissedReminders_v1': JSON.stringify(['rem-before-non-array'])
    };
    loadDismissedReminders();
    assert(isReminderDismissed('rem-before-non-array') === true, 'pre-populating before non-array test');

    mockStorage = {
      'travelApp_dismissedReminders_v1': val
    };
    loadDismissedReminders();
    assert(isReminderDismissed('rem-before-non-array') === false, `dismissedReminders should reset to empty set for non-array JSON: ${val}`);
  });

  // 6. saveDismissedReminders error handling when localStorage.setItem throws
  throwOnSetItem = true;
  try {
    dismissTimelineReminder('rem-item-error');
    assert(isReminderDismissed('rem-item-error') === true, 'dismissTimelineReminder should still update memory state when setItem throws');
  } catch (err) {
    assert(false, `saveDismissedReminders should catch setItem errors but threw: ${err.message}`);
  }
  throwOnSetItem = false;

  // 7. resetDismissedReminders error handling when localStorage.removeItem throws
  throwOnRemoveItem = true;
  try {
    resetDismissedReminders();
    assert(isReminderDismissed('rem-item-error') === false, 'resetDismissedReminders should clear memory state even if removeItem throws');
  } catch (err) {
    assert(false, `resetDismissedReminders should catch removeItem errors but threw: ${err.message}`);
  }
  throwOnRemoveItem = false;

  // 8. applyTheme and applyUiSettings error handling when localStorage throws
  throwOnGetItem = true;
  throwOnSetItem = true;
  try {
    applyTheme();
    applyUiSettings();
  } catch (err) {
    assert(false, `applyTheme/applyUiSettings should catch localStorage errors but threw: ${err.message}`);
  }

  console.log('✅ ALL loadDismissedReminders UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runLoadDismissedRemindersTests();
  } catch (err) {
    console.error('❌ loadDismissedReminders TEST FAILED:', err.message);
    process.exit(1);
  }
}

module.exports = { runLoadDismissedRemindersTests };
