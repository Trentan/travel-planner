const path = require('path');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function createBackupTestContext() {
  const localStorageMap = new Map();
  const sessionStorageMap = new Map();
  const listeners = {};
  const bodyChildren = [];

  const mockLocalStorage = {
    getItem(key) { return localStorageMap.has(key) ? localStorageMap.get(key) : null; },
    setItem(key, value) { localStorageMap.set(key, String(value)); },
    removeItem(key) { localStorageMap.delete(key); },
    clear() { localStorageMap.clear(); }
  };

  const mockSessionStorage = {
    getItem(key) { return sessionStorageMap.has(key) ? sessionStorageMap.get(key) : null; },
    setItem(key, value) { sessionStorageMap.set(key, String(value)); },
    removeItem(key) { sessionStorageMap.delete(key); },
    clear() { sessionStorageMap.clear(); }
  };

  const mockDocument = {
    body: {
      appendChild(child) {
        bodyChildren.push(child);
        child.parentElement = mockDocument.body;
      },
      removeChild(child) {
        const idx = bodyChildren.indexOf(child);
        if (idx !== -1) bodyChildren.splice(idx, 1);
        child.parentElement = null;
      }
    },
    getElementById(id) {
      return bodyChildren.find(el => el.id === id) || null;
    },
    createElement(tagName) {
      const element = {
        tagName: String(tagName).toUpperCase(),
        id: '',
        innerHTML: '',
        parentElement: null,
        remove() {
          if (element.parentElement) {
            element.parentElement.removeChild(element);
          } else {
            const idx = bodyChildren.indexOf(element);
            if (idx !== -1) bodyChildren.splice(idx, 1);
          }
        }
      };
      return element;
    }
  };

  let originalSaveDataReturnValue = false;
  let originalSaveDataCalled = false;
  let originalSaveDataArg = null;
  let originalExportJSONCalled = false;

  const context = createVmContext({
    document: mockDocument,
    localStorage: mockLocalStorage,
    sessionStorage: mockSessionStorage,
    addEventListener(event, handler) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    },
    saveData: async function(showTick = true) {
      originalSaveDataCalled = true;
      originalSaveDataArg = showTick;
      return originalSaveDataReturnValue;
    },
    exportJSON: async function() {
      originalExportJSONCalled = true;
    }
  });

  context.window = context;

  const backupSource = loadSource(path.join('js', 'backup.js'));
  runScriptInContext(backupSource, context, 'js/backup.js');

  return {
    context,
    localStorageMap,
    sessionStorageMap,
    bodyChildren,
    listeners,
    setOriginalSaveDataReturnValue(val) { originalSaveDataReturnValue = val; },
    getOriginalSaveDataCalled() { return originalSaveDataCalled; },
    getOriginalSaveDataArg() { return originalSaveDataArg; },
    getOriginalExportJSONCalled() { return originalExportJSONCalled; },
    resetSpies() {
      originalSaveDataCalled = false;
      originalSaveDataArg = null;
      originalExportJSONCalled = false;
    }
  };
}

async function runBackupTests() {
  console.log('Running js/backup.js unit tests...');

  // --- Test 1: loadBackupTracking ---
  {
    const { context, localStorageMap } = createBackupTestContext();

    // Default when localStorage is empty
    context.loadBackupTracking();
    assert(localStorageMap.get('travelApp_editCount') === undefined, 'No item set initially');

    // Set values in localStorage and load
    localStorageMap.set('travelApp_editCount', '12');
    localStorageMap.set('travelApp_lastExport', '2026-03-01T12:00:00Z');
    context.loadBackupTracking();

    // Test trackUserEdit to verify editCountSinceExport was loaded as 12
    context.trackUserEdit();
    assert(localStorageMap.get('travelApp_editCount') === '13', 'Should increment from loaded editCount 12 to 13');
  }

  // --- Test 2: trackUserEdit & resetEditTracking ---
  {
    const { context, localStorageMap } = createBackupTestContext();

    context.resetEditTracking();
    assert(localStorageMap.get('travelApp_editCount') === '0', 'resetEditTracking sets travelApp_editCount to 0');

    context.trackUserEdit();
    assert(localStorageMap.get('travelApp_editCount') === '1', 'trackUserEdit increments to 1');

    for (let i = 0; i < 8; i++) {
      context.trackUserEdit();
    }
    assert(localStorageMap.get('travelApp_editCount') === '9', 'trackUserEdit increments to 9');

    context.resetEditTracking();
    assert(localStorageMap.get('travelApp_editCount') === '0', 'resetEditTracking resets to 0');
  }

  // --- Test 3: checkBackupReminder early exit conditions ---
  {
    const { context, sessionStorageMap, bodyChildren } = createBackupTestContext();

    // 3a. Edit count below 10 -> no reminder
    for (let i = 0; i < 5; i++) {
      context.trackUserEdit();
    }
    context.checkBackupReminder();
    assert(bodyChildren.length === 0, 'No reminder shown when edit count < 10');

    // 3b. File backed mode -> no reminder
    for (let i = 0; i < 10; i++) {
      context.trackUserEdit();
    }
    context.window.isSavingToFile = () => true;
    context.checkBackupReminder();
    assert(bodyChildren.length === 0, 'No reminder shown when isSavingToFile() returns true');

    // 3c. Dismissed in sessionStorage -> no reminder
    delete context.window.isSavingToFile;
    sessionStorageMap.set('travelApp_backupReminderDismissed', 'true');
    context.checkBackupReminder();
    assert(bodyChildren.length === 0, 'No reminder shown when travelApp_backupReminderDismissed is true');
  }

  // --- Test 4: showBackupReminder & checkBackupReminder with no previous export ---
  {
    const { context, bodyChildren } = createBackupTestContext();

    for (let i = 0; i < 10; i++) {
      context.trackUserEdit();
    }

    // Without FSA support
    context.window.isFSASupported = () => false;
    context.checkBackupReminder();
    assert(bodyChildren.length === 1, 'Reminder popup appended to body when edit count >= 10');

    const reminderEl = context.document.getElementById('backup-reminder');
    assert(reminderEl !== null, 'backup-reminder element found in document');
    assert(reminderEl.innerHTML.includes('You have made 10 local edits.'), 'Message contains edit count');
    assert(reminderEl.innerHTML.includes('Tap the download option to save a fresh JSON copy.'), 'Non-FSA message generated');
    assert(reminderEl.innerHTML.includes('Export Now'), 'Non-FSA action button is "Export Now"');

    // Idempotency check for showBackupReminder
    context.showBackupReminder('Duplicate call test');
    assert(bodyChildren.length === 1, 'Duplicate showBackupReminder does not add a second popup element');

    // Hide reminder
    context.hideBackupReminder();
    assert(bodyChildren.length === 0, 'hideBackupReminder removes element from body');
  }

  // --- Test 5: checkBackupReminder with FSA support & prior export info ---
  {
    const { context, localStorageMap, sessionStorageMap, bodyChildren } = createBackupTestContext();

    for (let i = 0; i < 15; i++) {
      context.trackUserEdit();
    }

    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    localStorageMap.set('travelApp_last_export_v2026', fiveDaysAgo);
    localStorageMap.set('travelApp_last_export_filename', 'EuroTrip2026.json');
    context.window.isFSASupported = () => true;

    context.checkBackupReminder();
    assert(bodyChildren.length === 1, 'Reminder popup shown with prior export info');

    const reminderEl = context.document.getElementById('backup-reminder');
    assert(reminderEl.innerHTML.includes('EuroTrip2026.json'), 'Message includes last export filename');
    assert(reminderEl.innerHTML.includes('Tap Save As if you want to reconnect file-based autosave.'), 'FSA refresh message included');
    assert(reminderEl.innerHTML.includes('Save As'), 'FSA button is "Save As"');

    // Test markDismissed parameter on hideBackupReminder
    context.hideBackupReminder(true);
    assert(bodyChildren.length === 0, 'Reminder element removed');
    assert(sessionStorageMap.get('travelApp_backupReminderDismissed') === 'true', 'Dismissed state saved in sessionStorage');
  }

  // --- Test 6: updateExportIndicator ---
  {
    const { context } = createBackupTestContext();

    let syncCalled = false;
    context.window.syncActiveFileDisplay = () => { syncCalled = true; };

    context.updateExportIndicator();
    assert(syncCalled, 'updateExportIndicator calls window.syncActiveFileDisplay()');
  }

  // --- Test 7: window.saveData wrapper ---
  {
    const env = createBackupTestContext();
    const { context, localStorageMap, bodyChildren } = env;

    // 7a. Save to local storage only (savedToFile = false) -> tracks user edit
    env.setOriginalSaveDataReturnValue(false);
    const result1 = await context.window.saveData(true);
    assert(result1 === false, 'saveData returns false');
    assert(env.getOriginalSaveDataCalled(), 'Original saveData was called');
    assert(env.getOriginalSaveDataArg() === true, 'Original saveData passed showTick argument');
    assert(localStorageMap.get('travelApp_editCount') === '1', 'trackUserEdit was called when savedToFile is false');

    // 7b. Save to file (savedToFile = true) -> resets edit tracking and hides reminder
    env.resetSpies();
    context.showBackupReminder('Test reminder');
    assert(bodyChildren.length === 1, 'Reminder present before file save');

    env.setOriginalSaveDataReturnValue(true);
    const result2 = await context.window.saveData(false);
    assert(result2 === true, 'saveData returns true');
    assert(localStorageMap.get('travelApp_editCount') === '0', 'Edit tracking reset when savedToFile is true');
    assert(bodyChildren.length === 0, 'Backup reminder hidden when savedToFile is true');

    // 7c. Suppress backup tracking flag
    env.resetSpies();
    context.window.__suppressBackupTracking = true;
    env.setOriginalSaveDataReturnValue(false);
    await context.window.saveData(true);
    assert(localStorageMap.get('travelApp_editCount') === '0', 'Edit count not updated when __suppressBackupTracking is true');
  }

  // --- Test 8: window.exportJSON wrapper ---
  {
    const env = createBackupTestContext();
    const { context, localStorageMap, bodyChildren } = env;

    for (let i = 0; i < 12; i++) {
      context.trackUserEdit();
    }
    context.showBackupReminder('Test export reminder');
    assert(bodyChildren.length === 1, 'Reminder shown before export');

    let syncCalled = false;
    context.window.syncActiveFileDisplay = () => { syncCalled = true; };

    await context.window.exportJSON();
    assert(env.getOriginalExportJSONCalled(), 'Original exportJSON was executed');
    assert(bodyChildren.length === 0, 'Backup reminder hidden on export');
    assert(syncCalled, 'Export indicator updated on export');
    assert(localStorageMap.get('travelApp_editCount') === '0', 'Edit tracking reset on export');
  }

  // --- Test 9: DOMContentLoaded event listener setup ---
  {
    const { listeners } = createBackupTestContext();
    assert(Array.isArray(listeners['DOMContentLoaded']), 'DOMContentLoaded listener registered');
    assert(listeners['DOMContentLoaded'].length >= 1, 'At least one DOMContentLoaded handler attached');
  }

  console.log('✅ ALL js/backup.js UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runBackupTests().then(() => {
      process.exit(0);
    }).catch(err => {
      console.error('❌ backup.test.js TEST FAILED:', err.stack || err.message);
      process.exit(1);
    });
  } catch (err) {
    console.error('❌ backup.test.js TEST FAILED:', err.stack || err.message);
    process.exit(1);
  }
}

module.exports = { runBackupTests };
