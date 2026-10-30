const path = require('path');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function runPwaPromptStandaloneTests() {
  console.log('Running isStandaloneApp unit tests...');

  // Helper to create a fresh context for testing pwa-prompt.js
  function setupTestEnvironment(customWindowProps = {}) {
    let mockMediaQueries = customWindowProps.mockMediaQueries || {};

    const documentMock = {
      readyState: 'complete',
      getElementById: () => null,
      createElement: () => ({
        id: '',
        className: '',
        setAttribute: () => {},
        innerHTML: ''
      }),
      body: {
        appendChild: () => {}
      },
      addEventListener: () => {}
    };

    const context = createVmContext({
      document: documentMock,
      localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      location: { hostname: 'localhost', origin: 'http://localhost:3000', href: 'http://localhost:3000/' },
      navigator: { userAgent: 'Mozilla/5.0', ...customWindowProps.navigator },
      addEventListener: () => {},
      setTimeout: (fn) => fn(),
      clearTimeout: () => {},
      matchMedia: customWindowProps.hasMatchMedia === false ? undefined : (query) => {
        return {
          matches: Boolean(mockMediaQueries[query]),
          media: query,
          addEventListener: () => {},
          removeEventListener: () => {}
        };
      },
      Capacitor: customWindowProps.Capacitor,
      isCapacitorNative: customWindowProps.isCapacitorNative
    });

    context.window = context;

    const source = loadSource(path.join('js', 'pwa-prompt.js'));
    runScriptInContext(source, context, 'js/pwa-prompt.js');

    return context;
  }

  // 1. Standard web browser (not standalone, matchMedia returns false, no Capacitor) -> false
  {
    const ctx = setupTestEnvironment();
    assert(typeof ctx.isStandaloneApp === 'function', 'isStandaloneApp should be exported on window');
    assert(ctx.isStandaloneApp() === false, 'Standard browser should return false for isStandaloneApp');
  }

  // 2. iOS Safari standalone mode (window.navigator.standalone === true) -> true
  {
    const ctx = setupTestEnvironment({
      navigator: { standalone: true }
    });
    assert(ctx.isStandaloneApp() === true, 'iOS Safari standalone mode (navigator.standalone === true) should return true');
  }

  // 2b. iOS Safari non-standalone mode (window.navigator.standalone === false) -> false
  {
    const ctx = setupTestEnvironment({
      navigator: { standalone: false }
    });
    assert(ctx.isStandaloneApp() === false, 'iOS Safari non-standalone mode (navigator.standalone === false) should return false');
  }

  // 3. Display mode: standalone via window.matchMedia -> true
  {
    const ctx = setupTestEnvironment({
      mockMediaQueries: {
        '(display-mode: standalone)': true
      }
    });
    assert(ctx.isStandaloneApp() === true, 'matchMedia (display-mode: standalone) should return true');
  }

  // 4. Display mode: fullscreen via window.matchMedia -> true
  {
    const ctx = setupTestEnvironment({
      mockMediaQueries: {
        '(display-mode: fullscreen)': true
      }
    });
    assert(ctx.isStandaloneApp() === true, 'matchMedia (display-mode: fullscreen) should return true');
  }

  // 5. Display mode: browser (other display mode queries return false) -> false
  {
    const ctx = setupTestEnvironment({
      mockMediaQueries: {
        '(display-mode: browser)': true,
        '(display-mode: standalone)': false,
        '(display-mode: fullscreen)': false
      }
    });
    assert(ctx.isStandaloneApp() === false, 'Non-standalone display mode should return false');
  }

  // 6. Capacitor app via window.Capacitor -> true
  {
    const ctx = setupTestEnvironment({
      Capacitor: { isNativePlatform: () => true }
    });
    assert(ctx.isStandaloneApp() === true, 'Presence of window.Capacitor object should return true');
  }

  // 7. Capacitor app via window.isCapacitorNative boolean -> true
  {
    const ctx = setupTestEnvironment({
      isCapacitorNative: true
    });
    assert(ctx.isStandaloneApp() === true, 'window.isCapacitorNative === true should return true');
  }

  // 8. Missing window.matchMedia fallback scenario -> false
  {
    const ctx = setupTestEnvironment({
      hasMatchMedia: false
    });
    assert(ctx.isStandaloneApp() === false, 'Missing window.matchMedia should fall back safely to false');
  }

  // 9. Node/CommonJS export verification
  {
    const pwaPromptModule = require('../js/pwa-prompt.js');
    assert(typeof pwaPromptModule.isStandaloneApp === 'function', 'isStandaloneApp should be exported via CommonJS module.exports');
  }

  console.log('✅ ALL isStandaloneApp UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runPwaPromptStandaloneTests();
  } catch (err) {
    console.error('❌ isStandaloneApp TEST FAILED:', err.message);
    process.exit(1);
  }
}

module.exports = { runPwaPromptStandaloneTests };
