const path = require('path');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function runViewportSizeTests() {
  console.log('Running viewport size unit tests...');

  let currentWidth = 1024;
  let matchMediaSupported = true;

  const mockMatchMedia = (query) => {
    if (!matchMediaSupported) {
      return undefined;
    }
    const match = query.match(/\(max-width:\s*(\d+)px\)/);
    const maxWidth = match ? parseInt(match[1], 10) : Infinity;
    return {
      matches: currentWidth <= maxWidth,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {}
    };
  };

  const documentMock = {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    documentElement: { style: { setProperty: () => {} } },
    body: {
      classList: { toggle: () => {}, remove: () => {}, add: () => {} },
      setAttribute: () => {},
      getAttribute: () => null
    }
  };

  const context = createVmContext({
    document: documentMock,
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    location: { hostname: 'localhost', origin: 'http://localhost:3000', href: 'http://localhost:3000/' },
    addEventListener() {},
    matchMedia: (query) => mockMatchMedia(query)
  });
  context.window = context;

  const uiSource = loadSource(path.join('js', 'ui.js'));
  runScriptInContext(uiSource, context, 'js/ui.js');

  const isMobileViewport = context.isMobileViewport;
  const isSmallMobileViewport = context.isSmallMobileViewport;

  assert(typeof isMobileViewport === 'function', 'isMobileViewport should be exported as a function');
  assert(typeof isSmallMobileViewport === 'function', 'isSmallMobileViewport should be exported as a function');

  // 1. Mobile Viewport (max-width: 768px) tests
  // Small mobile (320px, 379px) -> true
  currentWidth = 320;
  assert(isMobileViewport() === true, '320px width should be mobile viewport (true)');
  currentWidth = 379;
  assert(isMobileViewport() === true, '379px width should be mobile viewport (true)');

  // Standard mobile threshold boundary (768px -> true, 769px -> false)
  currentWidth = 768;
  assert(isMobileViewport() === true, '768px width should be mobile viewport (true)');
  currentWidth = 769;
  assert(isMobileViewport() === false, '769px width should NOT be mobile viewport (false)');

  // Desktop / Large screen (1024px, 1920px) -> false
  currentWidth = 1024;
  assert(isMobileViewport() === false, '1024px width should NOT be mobile viewport (false)');
  currentWidth = 1920;
  assert(isMobileViewport() === false, '1920px width should NOT be mobile viewport (false)');

  // 2. Small Mobile Viewport (max-width: 379px) tests
  // Small mobile (320px, 379px) -> true
  currentWidth = 320;
  assert(isSmallMobileViewport() === true, '320px width should be small mobile viewport (true)');
  currentWidth = 379;
  assert(isSmallMobileViewport() === true, '379px width should be small mobile viewport (true)');

  // Boundary between small mobile and standard mobile (380px -> false, 768px -> false)
  currentWidth = 380;
  assert(isSmallMobileViewport() === false, '380px width should NOT be small mobile viewport (false)');
  currentWidth = 768;
  assert(isSmallMobileViewport() === false, '768px width should NOT be small mobile viewport (false)');

  // Desktop / Large screen (1024px, 1920px) -> false
  currentWidth = 1024;
  assert(isSmallMobileViewport() === false, '1024px width should NOT be small mobile viewport (false)');
  currentWidth = 1920;
  assert(isSmallMobileViewport() === false, '1920px width should NOT be small mobile viewport (false)');

  // 3. Fallback when matchMedia is missing / falsy
  matchMediaSupported = false;
  context.matchMedia = undefined;
  delete context.window.matchMedia;

  assert(Boolean(isMobileViewport()) === false, 'isMobileViewport should return falsy when window.matchMedia is missing');
  assert(Boolean(isSmallMobileViewport()) === false, 'isSmallMobileViewport should return falsy when window.matchMedia is missing');

  // Restore matchMedia support for any subsequent context operations
  matchMediaSupported = true;
  context.matchMedia = (query) => mockMatchMedia(query);
  context.window.matchMedia = context.matchMedia;

  console.log('✅ ALL viewport size UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runViewportSizeTests();
  } catch (err) {
    console.error('❌ viewport size TEST FAILED:', err.message);
    process.exit(1);
  }
}

module.exports = { runViewportSizeTests };
