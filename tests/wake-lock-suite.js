const path = require('path');
const {
  assert,
  createDocument,
  createElement,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function createMockWakeLockSentinel() {
  let released = false;
  const listeners = {};
  return {
    get released() { return released; },
    addEventListener(type, listener) {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push(listener);
    },
    async release() {
      released = true;
      if (listeners['release']) {
        listeners['release'].forEach(cb => cb());
      }
    }
  };
}

async function run() {
  console.log('[WakeLock] Running Wake Lock suite...');

  const uiJs = loadSource(path.join('js', 'ui.js'));

  // Test 1: Supported browser wake lock acquisition, release, visibility change, and button syncing
  {
    let wakeLockRequestCount = 0;
    let currentSentinel = null;

    const listeners = {};
    const elementsMap = new Map();

    function getOrCreateElement(id) {
      if (!elementsMap.has(id)) {
        const classes = new Set();
        const el = createElement({
          id,
          hidden: false,
          disabled: false,
          attributes: {},
          addEventListener() {},
          setAttribute(k, v) { this.attributes[k] = v; },
          getAttribute(k) { return this.attributes[k]; },
          querySelector(sel) {
            if (sel === '.wake-lock-icon') {
              if (!this._iconNode) this._iconNode = createElement();
              return this._iconNode;
            }
            if (sel === '.wake-lock-label, .wake-lock-text') {
              if (!this._labelNode) this._labelNode = createElement();
              return this._labelNode;
            }
            return null;
          }
        });
        el.classList = {
          add(...cls) { cls.forEach(c => classes.add(c)); },
          remove(...cls) { cls.forEach(c => classes.delete(c)); },
          toggle(c, val) { if (val) classes.add(c); else classes.delete(c); },
          contains(c) { return classes.has(c); }
        };
        elementsMap.set(id, el);
      }
      return elementsMap.get(id);
    }

    const docMock = {
      visibilityState: 'visible',
      readyState: 'complete',
      querySelectorAll(sel) {
        if (sel.includes('.wake-lock-btn')) {
          return [getOrCreateElement('wakeLockBtnItinerary'), getOrCreateElement('wakeLockBtnTransport')];
        }
        return [];
      },
      getElementById(id) {
        return getOrCreateElement(id);
      },
      addEventListener(type, listener) {
        if (!listeners[type]) listeners[type] = [];
        listeners[type].push(listener);
      },
      body: { classList: { toggle: () => {}, contains: () => false, add: () => {}, remove: () => {} } },
      documentElement: { setAttribute: () => {}, style: { setProperty: () => {} } }
    };

    const navMock = {
      wakeLock: {
        async request(type) {
          assert(type === 'screen', 'Request type must be screen');
          wakeLockRequestCount++;
          currentSentinel = createMockWakeLockSentinel();
          return currentSentinel;
        }
      }
    };

    const vmContext = createVmContext({
      matchMedia: () => ({ matches: false, addEventListener: () => {} }),
      addEventListener: () => {},
      scrollTo: () => {},
      scrollY: 0,
      startTutorial: () => {},
      updateLegTip: () => {},
      deleteLegTip: () => {},
      addLeg: () => {},
      titleData: { title: '', subtitle: '' },
      saveData: () => {},
      trackUserEdit: () => {},
      document: docMock,
      navigator: navMock,
      localStorage: {
        getItem: () => null,
        setItem: () => {}
      },
      sessionStorage: {
        getItem: () => null,
        setItem: () => {}
      }
    });
    vmContext.window = vmContext;

    runScriptInContext(uiJs, vmContext, 'js/ui.js');

    const itineraryBtn = getOrCreateElement('wakeLockBtnItinerary');
    const transportBtn = getOrCreateElement('wakeLockBtnTransport');

    // Verify initial button sync
    assert(itineraryBtn.hidden === false, 'Itinerary button should not be hidden on supported browser');
    assert(itineraryBtn.disabled === false, 'Itinerary button should not be disabled on supported browser');
    assert(itineraryBtn.getAttribute('aria-pressed') === 'false', 'Initial aria-pressed should be false');

    // Toggle wake lock ON
    await vmContext.toggleScreenWakeLock();

    assert(wakeLockRequestCount === 1, 'navigator.wakeLock.request should have been called once');
    assert(currentSentinel !== null, 'Sentinel should be acquired');
    assert(itineraryBtn.getAttribute('aria-pressed') === 'true', 'aria-pressed should be true when active');
    assert(itineraryBtn.classList.contains('active'), 'Active class should be present on toggle button');
    assert(transportBtn.classList.contains('active'), 'Active class should be synced across all buttons');

    // Simulate tab hiding (visibilityState = 'hidden')
    docMock.visibilityState = 'hidden';
    assert(listeners['visibilitychange'], 'visibilitychange listener should be registered');
    for (const cb of listeners['visibilitychange']) {
      await cb();
    }

    assert(currentSentinel.released === true, 'Sentinel should be released when tab is hidden');

    // Simulate tab returning to visible (visibilityState = 'visible')
    docMock.visibilityState = 'visible';
    for (const cb of listeners['visibilitychange']) {
      await cb();
    }

    assert(wakeLockRequestCount === 2, 'Wake lock should be re-acquired when tab becomes visible again');
    assert(itineraryBtn.getAttribute('aria-pressed') === 'true', 'Toggle state should remain active upon returning');

    // Toggle wake lock OFF
    await vmContext.toggleScreenWakeLock();

    assert(currentSentinel.released === true, 'Sentinel should be released when toggled off');
    assert(itineraryBtn.getAttribute('aria-pressed') === 'false', 'aria-pressed should be false when deactivated');
    assert(!itineraryBtn.classList.contains('active'), 'Active class should be removed when deactivated');
  }

  // Test 2: Unsupported browser fallback
  {
    const elementsMap = new Map();
    function getOrCreateElement(id) {
      if (!elementsMap.has(id)) {
        elementsMap.set(id, createElement({ id, hidden: false, disabled: false, addEventListener() {} }));
      }
      return elementsMap.get(id);
    }

    const docMock = {
      visibilityState: 'visible',
      readyState: 'complete',
      querySelectorAll() {
        return [getOrCreateElement('wakeLockBtnItinerary')];
      },
      getElementById(id) { return getOrCreateElement(id); },
      addEventListener() {},
      body: { classList: { toggle: () => {}, contains: () => false, add: () => {}, remove: () => {} } },
      documentElement: { setAttribute: () => {}, style: { setProperty: () => {} } }
    };

    const vmContext = createVmContext({
      matchMedia: () => ({ matches: false, addEventListener: () => {} }),
      addEventListener: () => {},
      scrollTo: () => {},
      scrollY: 0,
      startTutorial: () => {},
      updateLegTip: () => {},
      deleteLegTip: () => {},
      addLeg: () => {},
      titleData: { title: '', subtitle: '' },
      saveData: () => {},
      trackUserEdit: () => {},
      document: docMock,
      navigator: {}, // No wakeLock in navigator
      localStorage: { getItem: () => null, setItem: () => {} },
      sessionStorage: { getItem: () => null, setItem: () => {} }
    });
    vmContext.window = vmContext;

    runScriptInContext(uiJs, vmContext, 'js/ui.js');

    const btn = getOrCreateElement('wakeLockBtnItinerary');
    assert(btn.hidden === true, 'Toggle button should be hidden in unsupported browsers');
    assert(btn.disabled === true, 'Toggle button should be disabled in unsupported browsers');

    // Calling toggleScreenWakeLock in unsupported browser should be safe and return false/not throw
    await vmContext.toggleScreenWakeLock();
    assert(btn.hidden === true, 'Button remains hidden after toggle attempt');
  }

  console.log('[WakeLock] All Wake Lock tests passed successfully!');
}

if (require.main === module) {
  run().catch(err => {
    console.error(err);
    process.exitCode = 1;
  });
}

module.exports = { run };
