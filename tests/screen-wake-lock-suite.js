const path = require('path');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function createWakeLockTestingContext(hasWakeLockSupport = true) {
  let activeSentinel = null;
  let sentinelReleaseCallbacks = [];

  class MockWakeLockSentinel {
    constructor() {
      this.released = false;
      this.listeners = {};
    }

    addEventListener(event, callback) {
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(callback);
    }

    removeEventListener(event, callback) {
      if (!this.listeners[event]) return;
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }

    async release() {
      if (this.released) return;
      this.released = true;
      if (this.listeners['release']) {
        this.listeners['release'].forEach(cb => cb());
      }
    }
  }

  let requestCallCount = 0;

  const mockNavigator = {};
  if (hasWakeLockSupport) {
    mockNavigator.wakeLock = {
      request: async (type) => {
        assert(type === 'screen', `Expected wakeLock.request type 'screen', got '${type}'`);
        requestCallCount++;
        activeSentinel = new MockWakeLockSentinel();
        return activeSentinel;
      }
    };
  }

  const elementsMap = {};
  const eventListeners = {};

  const mockDocument = {
    visibilityState: 'visible',
    getElementById: (id) => elementsMap['#' + id] || { addEventListener: () => {}, classList: { contains: () => false, add: () => {}, remove: () => {} }, style: {} },
    querySelector: (selector) => elementsMap[selector] || null,
    querySelectorAll: (selector) => {
      if (selector === '.wake-lock-btn') {
        return Object.values(elementsMap).filter(el => el.classList && el.classList.contains('wake-lock-btn'));
      }
      return [];
    },
    addEventListener: (event, cb) => {
      if (!eventListeners[event]) eventListeners[event] = [];
      eventListeners[event].push(cb);
    },
    removeEventListener: (event, cb) => {
      if (!eventListeners[event]) return;
      eventListeners[event] = eventListeners[event].filter(c => c !== cb);
    }
  };

  const createMockButton = (id) => {
    const classSet = new Set(['action-btn', 'wake-lock-btn']);
    const btn = {
      id,
      style: {},
      disabled: false,
      classList: {
        add: (cls) => classSet.add(cls),
        remove: (cls) => classSet.delete(cls),
        contains: (cls) => classSet.has(cls),
        has: (cls) => classSet.has(cls)
      },
      attributes: {},
      children: {
        '.wake-lock-label': { textContent: 'Screen Awake' }
      },
      setAttribute(name, val) {
        this.attributes[name] = String(val);
      },
      getAttribute(name) {
        return this.attributes[name];
      },
      querySelector(selector) {
        return this.children[selector] || null;
      }
    };
    return btn;
  };

  const btnItinerary = createMockButton('wakeLockBtnItinerary');
  const btnTransport = createMockButton('wakeLockBtnTransport');
  elementsMap['#wakeLockBtnItinerary'] = btnItinerary;
  elementsMap['#wakeLockBtnTransport'] = btnTransport;
  elementsMap['.wake-lock-btn'] = btnItinerary;

  const context = createVmContext({
    navigator: mockNavigator,
    document: mockDocument,
    window: { addEventListener: () => {} },
    console: { warn: () => {}, log: () => {}, error: () => {} },
    localStorage: { getItem: () => null, setItem: () => {} },
    sessionStorage: { getItem: () => null, setItem: () => {} },
    matchMedia: () => ({ matches: false, addEventListener: () => {} })
  });

  context.window = context;
  context.navigator = mockNavigator;
  context.document = mockDocument;
  context.addEventListener = () => {};
  context.removeEventListener = () => {};

  return {
    context,
    btnItinerary,
    btnTransport,
    getRequestCallCount: () => requestCallCount,
    getActiveSentinel: () => activeSentinel,
    triggerVisibilityChange: async (newState) => {
      mockDocument.visibilityState = newState;
      if (eventListeners['visibilitychange']) {
        for (const cb of eventListeners['visibilitychange']) {
          await cb();
        }
      }
    }
  };
}

async function run() {
  console.log('Running screen wake lock test suite...');

  const uiSource = loadSource(path.join('js', 'ui.js'));

  // Test 1: Feature detection in supported browser
  {
    const { context, btnItinerary, btnTransport } = createWakeLockTestingContext(true);
    runScriptInContext(uiSource, context, 'js/ui.js');

    assert(context.isWakeLockSupported() === true, 'isWakeLockSupported() should return true when navigator.wakeLock exists');

    context.updateWakeLockButtons();
    assert(btnItinerary.disabled === false, 'Itinerary wake lock button should be enabled');
    assert(btnTransport.disabled === false, 'Transport wake lock button should be enabled');
    assert(btnItinerary.getAttribute('aria-pressed') === 'false', 'aria-pressed should be false initially');
  }

  // Test 2: Feature detection in unsupported browser
  {
    const { context, btnItinerary, btnTransport } = createWakeLockTestingContext(false);
    runScriptInContext(uiSource, context, 'js/ui.js');

    assert(context.isWakeLockSupported() === false, 'isWakeLockSupported() should return false when navigator.wakeLock is missing');

    context.updateWakeLockButtons();
    assert(btnItinerary.style.display === 'none', 'Button should be hidden when wake lock is unsupported');
    assert(btnItinerary.disabled === true, 'Button should be disabled when wake lock is unsupported');

    // Toggling should safely do nothing
    await context.toggleScreenWakeLock();
    assert(btnItinerary.style.display === 'none', 'Button should remain hidden');
  }

  // Test 3: Toggle ON and OFF flow
  {
    const { context, btnItinerary, btnTransport, getRequestCallCount, getActiveSentinel } = createWakeLockTestingContext(true);
    runScriptInContext(uiSource, context, 'js/ui.js');

    // Toggle ON
    await context.toggleScreenWakeLock();
    assert(getRequestCallCount() === 1, 'navigator.wakeLock.request should have been called once');
    const sentinel = getActiveSentinel();
    assert(sentinel !== null, 'Sentinel should be stored');
    assert(sentinel.released === false, 'Sentinel should not be released yet');

    assert(btnItinerary.classList.contains('is-active') === true, 'Itinerary button should have is-active class');
    assert(btnTransport.classList.contains('is-active') === true, 'Transport button should have is-active class');
    assert(btnItinerary.getAttribute('aria-pressed') === 'true', 'aria-pressed should be true');
    assert(btnItinerary.querySelector('.wake-lock-label').textContent === 'Screen Awake (On)', 'Button text should update to Screen Awake (On)');

    // Toggle OFF
    await context.toggleScreenWakeLock();
    assert(sentinel.released === true, 'Sentinel should be released');
    assert(btnItinerary.classList.contains('is-active') === false, 'Itinerary button should not have is-active class');
    assert(btnItinerary.getAttribute('aria-pressed') === 'false', 'aria-pressed should be false');
    assert(btnItinerary.querySelector('.wake-lock-label').textContent === 'Screen Awake', 'Button text should revert to Screen Awake');
  }

  // Test 4: Visibility change auto-release and re-acquisition
  {
    const { context, btnItinerary, getRequestCallCount, getActiveSentinel, triggerVisibilityChange } = createWakeLockTestingContext(true);
    runScriptInContext(uiSource, context, 'js/ui.js');

    // Toggle ON
    await context.toggleScreenWakeLock();
    assert(getRequestCallCount() === 1, 'Initial request called');
    const sentinel1 = getActiveSentinel();

    // Tab becomes hidden (user switches app/tab)
    await triggerVisibilityChange('hidden');
    assert(btnItinerary.classList.contains('is-active') === false, 'Button active class removed when hidden');

    // Tab becomes visible again
    await triggerVisibilityChange('visible');
    assert(getRequestCallCount() === 2, 'Wake lock re-requested when tab becomes visible again');
    const sentinel2 = getActiveSentinel();
    assert(sentinel2 !== null && sentinel2 !== sentinel1, 'New sentinel acquired on returning to tab');
    assert(btnItinerary.classList.contains('is-active') === true, 'Button active class restored on returning to tab');

    // Manually turn off
    await context.toggleScreenWakeLock();
    assert(sentinel2.released === true, 'Sentinel released when toggled off');

    // Hidden & visible should NOT re-acquire now because user turned it off
    await triggerVisibilityChange('hidden');
    await triggerVisibilityChange('visible');
    assert(getRequestCallCount() === 2, 'Request count should remain 2 after visibility changes when toggled off');
  }

  console.log('All screen wake lock tests passed successfully!');
}

if (require.main === module) {
  run().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { run };
