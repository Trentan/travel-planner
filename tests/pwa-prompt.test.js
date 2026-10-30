const path = require('path');
const { assert, createVmContext, loadSource, runScriptInContext } = require('./lib/test-helpers');

function runPwaPromptTests() {
  console.log('Running PWA prompt unit tests (dismissPwaPrompt & initPwaPrompt)...');

  const DISMISS_KEY = 'travelApp_pwa_prompt_dismissed_v1';

  function createMockEnvironment(options = {}) {
    const {
      userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      standalone = false,
      innerWidth = 390,
      initialStorage = {}
    } = options;

    const storage = { ...initialStorage };
    const timeouts = [];
    let timeoutIdCounter = 1;

    const mockStorage = {
      getItem: (key) => (storage.hasOwnProperty(key) ? storage[key] : null),
      setItem: (key, val) => {
        storage[key] = String(val);
      },
      removeItem: (key) => {
        delete storage[key];
      },
      _data: storage
    };

    const elementsById = new Map();

    function createMockElement(tagName) {
      const classes = new Set();
      const attributes = new Map();
      const children = [];
      let elementId = '';

      const element = {
        tagName: tagName.toUpperCase(),
        parentNode: null,
        children,
        innerHTML: '',
        get id() {
          return elementId;
        },
        set id(val) {
          elementId = val;
          if (val) elementsById.set(val, element);
        },
        get className() {
          return Array.from(classes).join(' ');
        },
        set className(val) {
          classes.clear();
          if (val) {
            val.split(' ').filter(Boolean).forEach(c => classes.add(c));
          }
        },
        classList: {
          add: (...cls) => cls.forEach(c => classes.add(c)),
          remove: (...cls) => cls.forEach(c => classes.delete(c)),
          contains: (c) => classes.has(c)
        },
        getAttribute: (attr) => attributes.get(attr) || null,
        setAttribute: (attr, val) => attributes.set(attr, String(val)),
        appendChild: (child) => {
          child.parentNode = element;
          children.push(child);
          return child;
        },
        removeChild: (child) => {
          const idx = children.indexOf(child);
          if (idx !== -1) {
            children.splice(idx, 1);
            child.parentNode = null;
          }
          if (child.id && elementsById.get(child.id) === child) {
            elementsById.delete(child.id);
          }
          return child;
        }
      };

      return element;
    }

    const mockBody = createMockElement('body');

    const mockDocument = {
      readyState: 'complete',
      body: mockBody,
      getElementById: (id) => elementsById.get(id) || null,
      createElement: (tagName) => createMockElement(tagName),
      addEventListener: () => {}
    };

    const mockWindow = {
      navigator: {
        userAgent,
        standalone,
        maxTouchPoints: 1
      },
      innerWidth,
      matchMedia: () => ({ matches: false }),
      setTimeout: (fn, delay) => {
        const id = timeoutIdCounter++;
        timeouts.push({ id, fn, delay });
        return id;
      },
      clearTimeout: (id) => {
        const idx = timeouts.findIndex(t => t.id === id);
        if (idx !== -1) timeouts.splice(idx, 1);
      },
      addEventListener: () => {}
    };

    const context = createVmContext({
      window: mockWindow,
      document: mockDocument,
      navigator: mockWindow.navigator,
      localStorage: mockStorage,
      sessionStorage: mockStorage,
      setTimeout: mockWindow.setTimeout,
      clearTimeout: mockWindow.clearTimeout,
      Date
    });

    context.window.window = context.window;
    context.window.document = mockDocument;

    const pwaSource = loadSource(path.join('js', 'pwa-prompt.js'));
    runScriptInContext(pwaSource, context, 'js/pwa-prompt.js');

    // Clear automatic script execution init timer (setTimeout(initPwaPrompt, 1200))
    timeouts.length = 0;

    function runAllTimeouts() {
      const pending = [...timeouts];
      timeouts.length = 0;
      pending.forEach(t => t.fn());
    }

    return {
      context,
      mockDocument,
      mockBody,
      mockStorage,
      storage,
      runAllTimeouts,
      createMockElement
    };
  }

  // 1. Permanent Dismissal: default permanent parameter and true parameter
  {
    const env = createMockEnvironment();
    const modal = env.mockDocument.createElement('div');
    modal.id = 'pwaPromptModal';
    env.mockBody.appendChild(modal);

    assert(env.mockDocument.getElementById('pwaPromptModal') !== null, 'pwaPromptModal should exist in DOM before dismissal');

    // Call dismissPwaPrompt() with default parameter
    env.context.window.dismissPwaPrompt();

    assert(modal.classList.contains('pwa-prompt-leaving'), 'pwaPromptModal should have "pwa-prompt-leaving" class immediately');
    assert(env.storage[DISMISS_KEY] === 'permanent', 'DISMISS_KEY should be set to "permanent"');
    assert(env.mockDocument.getElementById('pwaPromptModal') !== null, 'pwaPromptModal should remain in DOM before timeout runs');

    // Fast-forward 300ms timeout
    env.runAllTimeouts();

    assert(env.mockDocument.getElementById('pwaPromptModal') === null, 'pwaPromptModal should be removed from DOM after timeout');
    assert(modal.parentNode === null, 'Modal parentNode should be null after removal');
  }

  // 2. Permanent Dismissal: explicit permanent = true
  {
    const env = createMockEnvironment();
    const modal = env.mockDocument.createElement('div');
    modal.id = 'pwaPromptModal';
    env.mockBody.appendChild(modal);

    env.context.window.dismissPwaPrompt(true);

    assert(modal.classList.contains('pwa-prompt-leaving'), 'pwaPromptModal should have "pwa-prompt-leaving" class');
    assert(env.storage[DISMISS_KEY] === 'permanent', 'DISMISS_KEY should be set to "permanent"');

    env.runAllTimeouts();
    assert(env.mockDocument.getElementById('pwaPromptModal') === null, 'pwaPromptModal should be removed from DOM');
  }

  // 3. Temporary Dismissal: permanent = false ("Remind Later")
  {
    const env = createMockEnvironment();
    const modal = env.mockDocument.createElement('div');
    modal.id = 'pwaPromptModal';
    env.mockBody.appendChild(modal);

    const beforeTime = Date.now();
    env.context.window.dismissPwaPrompt(false);
    const afterTime = Date.now();

    assert(modal.classList.contains('pwa-prompt-leaving'), 'pwaPromptModal should have "pwa-prompt-leaving" class');

    const storedVal = env.storage[DISMISS_KEY];
    assert(storedVal !== undefined && storedVal !== 'permanent', 'DISMISS_KEY should store timestamp, got: ' + storedVal);
    const storedTs = parseInt(storedVal, 10);
    assert(!isNaN(storedTs), 'Stored timestamp should be a valid integer');
    assert(storedTs >= beforeTime && storedTs <= afterTime, 'Stored timestamp should match Date.now()');

    env.runAllTimeouts();
    assert(env.mockDocument.getElementById('pwaPromptModal') === null, 'pwaPromptModal should be removed from DOM');
  }

  // 4. Edge Case: Modal element missing from DOM when dismissPwaPrompt is called
  {
    const env = createMockEnvironment();
    assert(env.mockDocument.getElementById('pwaPromptModal') === null, 'No modal in DOM');

    // Should run smoothly without throwing an error
    env.context.window.dismissPwaPrompt(true);
    assert(env.storage[DISMISS_KEY] === 'permanent', 'DISMISS_KEY should be set to "permanent" even when modal element is missing');

    env.context.window.dismissPwaPrompt(false);
    assert(env.storage[DISMISS_KEY] !== 'permanent', 'DISMISS_KEY should be updated to timestamp even when modal element is missing');
  }

  // 5. Edge Case: Modal element removed before timeout callback fires
  {
    const env = createMockEnvironment();
    const modal = env.mockDocument.createElement('div');
    modal.id = 'pwaPromptModal';
    env.mockBody.appendChild(modal);

    env.context.window.dismissPwaPrompt(true);

    // Manually detach before timer executes
    env.mockBody.removeChild(modal);
    assert(modal.parentNode === null, 'Modal manually detached');

    // Timeout callback should execute cleanly without throwing
    env.runAllTimeouts();
    assert(env.storage[DISMISS_KEY] === 'permanent', 'DISMISS_KEY should remain "permanent"');
  }

  // 6. Integration: initPwaPrompt behavior with standalone apps
  {
    const env = createMockEnvironment({ standalone: true });
    env.context.window.initPwaPrompt();
    assert(env.mockDocument.getElementById('pwaPromptModal') === null, 'initPwaPrompt should suppress prompt for standalone app');
  }

  // 7. Integration: initPwaPrompt behavior with permanent dismissal
  {
    const env = createMockEnvironment({
      initialStorage: { [DISMISS_KEY]: 'permanent' }
    });
    env.context.window.initPwaPrompt();
    assert(env.mockDocument.getElementById('pwaPromptModal') === null, 'initPwaPrompt should suppress prompt when permanently dismissed');
  }

  // 8. Integration: initPwaPrompt behavior with recent temporary dismissal (< 7 days)
  {
    const recentTs = (Date.now() - 2 * 86400 * 1000).toString(); // 2 days ago
    const env = createMockEnvironment({
      initialStorage: { [DISMISS_KEY]: recentTs }
    });
    env.context.window.initPwaPrompt();
    assert(env.mockDocument.getElementById('pwaPromptModal') === null, 'initPwaPrompt should suppress prompt when dismissed 2 days ago');
  }

  // 9. Integration: initPwaPrompt behavior with expired temporary dismissal (> 7 days)
  {
    const oldTs = (Date.now() - 8 * 86400 * 1000).toString(); // 8 days ago
    const env = createMockEnvironment({
      initialStorage: { [DISMISS_KEY]: oldTs }
    });
    env.context.window.initPwaPrompt();
    assert(env.mockDocument.getElementById('pwaPromptModal') !== null, 'initPwaPrompt should show prompt when temporary dismissal expired 8 days ago');
  }

  // 10. Integration: initPwaPrompt on iOS mobile device creates iOS prompt card
  {
    const env = createMockEnvironment({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'
    });
    env.context.window.initPwaPrompt();
    const modal = env.mockDocument.getElementById('pwaPromptModal');
    assert(modal !== null, 'pwaPromptModal should be created on iOS');
    assert(modal.className.includes('role-ios'), 'iOS modal should have role-ios class');
    assert(modal.getAttribute('aria-label') === 'Add to Home Screen prompt', 'iOS modal should have proper aria-label');
  }

  // 11. Integration: initPwaPrompt on Android mobile device creates Android prompt card
  {
    const env = createMockEnvironment({
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36'
    });
    env.context.window.initPwaPrompt();
    const modal = env.mockDocument.getElementById('pwaPromptModal');
    assert(modal !== null, 'pwaPromptModal should be created on Android');
    assert(modal.className.includes('role-android'), 'Android modal should have role-android class');
    assert(modal.getAttribute('aria-label') === 'Play Store recommendation', 'Android modal should have proper aria-label');
  }

  console.log('✅ ALL PWA PROMPT UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runPwaPromptTests();
  } catch (err) {
    console.error('❌ PWA PROMPT TEST FAILED:', err.stack || err.message);
    process.exit(1);
  }
}

module.exports = { runPwaPromptTests };
