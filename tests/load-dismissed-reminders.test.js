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
    addEventListener: () => {}
  };

  let mockStorage = {};
  let throwOnGetItem = false;

  const localStorageMock = {
    getItem: key => {
      if (throwOnGetItem) {
        throw new Error('SecurityError: The operation is insecure.');
      }
      return mockStorage.hasOwnProperty(key) ? mockStorage[key] : null;
    },
    setItem: (key, val) => {
      mockStorage[key] = String(val);
    },
    removeItem: key => {
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

  assert(typeof loadDismissedReminders === 'function', 'loadDismissedReminders should be exposed on window');

  // 1. Happy path: Valid JSON array stored in localStorage
  mockStorage = {
    'travelApp_dismissedReminders_v1': JSON.stringify(['reminder-1', 'reminder-2'])
  };
  throwOnGetItem = false;
  loadDismissedReminders();
  assert(isReminderDismissed('reminder-1') === true, 'reminder-1 should be marked as dismissed');
  assert(isReminderDismissed('reminder-2') === true, 'reminder-2 should be marked as dismissed');
  assert(isReminderDismissed('reminder-3') === false, 'reminder-3 should not be marked as dismissed');

  // 2. Missing or empty localStorage key
  mockStorage = {};
  loadDismissedReminders();
  assert(isReminderDismissed('reminder-1') === false, 'dismissedReminders should reset to empty set when key is missing');

  // 3. Invalid / corrupt JSON syntax error path
  mockStorage = {
    'travelApp_dismissedReminders_v1': '{invalid-json'
  };
  loadDismissedReminders();
  assert(isReminderDismissed('reminder-1') === false, 'dismissedReminders should reset to empty set on JSON parse failure');

  // 4. Non-array JSON values (object, number, string, boolean)
  const nonArrayValues = [
    JSON.stringify({ key: 'value' }),
    JSON.stringify(12345),
    JSON.stringify('some-string'),
    JSON.stringify(true),
    JSON.stringify(false),
    JSON.stringify(null)
  ];

  nonArrayValues.forEach(val => {
    mockStorage = {
      'travelApp_dismissedReminders_v1': val
    };
    loadDismissedReminders();
    assert(isReminderDismissed('reminder-1') === false, `dismissedReminders should reset to empty set for non-array JSON: ${val}`);
  });

  // 5. Exception thrown by localStorage.getItem (e.g. SecurityError in restricted iframe)
  mockStorage = {
    'travelApp_dismissedReminders_v1': JSON.stringify(['rem-1'])
  };
  throwOnGetItem = true;
  loadDismissedReminders();
  assert(isReminderDismissed('rem-1') === false, 'dismissedReminders should reset to empty set when localStorage.getItem throws');

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
