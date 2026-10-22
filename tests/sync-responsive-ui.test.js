const fs = require('fs');
const path = require('path');
const { assert, createVmContext, runScriptInContext, loadSource } = require('./lib/test-helpers');

function runSyncResponsiveUiTests() {
  console.log('Running syncResponsiveUi unit tests...');

  const elements = new Map();

  function createMockElement(id, tagName = 'DIV', classes = '') {
    const classSet = new Set(classes.split(' ').filter(Boolean));
    const attributes = {};
    const dataset = {};
    const style = {
      top: '',
      paddingTop: '',
      setProperty: (k, v) => { style[k] = String(v); }
    };

    const el = {
      id,
      tagName: tagName.toUpperCase(),
      classList: {
        add(c) { classSet.add(c); },
        remove(c) { classSet.delete(c); },
        contains(c) { return classSet.has(c); },
        toggle(c, force) {
          if (force !== undefined) {
            if (force) classSet.add(c);
            else classSet.delete(c);
          } else {
            if (classSet.has(c)) classSet.delete(c);
            else classSet.add(c);
          }
        }
      },
      attributes,
      dataset,
      style,
      disabled: false,
      hidden: false,
      open: true,
      textContent: '',
      innerHTML: '',
      setAttribute(k, v) { attributes[k] = String(v); },
      getAttribute(k) { return attributes[k] !== undefined ? attributes[k] : null; },
      removeAttribute(k) { delete attributes[k]; },
      getBoundingClientRect() {
        return {
          width: 100,
          height: classSet.has('app-menu-bar') ? 50 : classSet.has('app-tabs-nav') ? 40 : 0,
          top: 0, left: 0, bottom: 0, right: 0
        };
      },
      querySelector(sel) {
        if (sel === '.city-nav-pull-handle') return elements.get('cityNavPullHandle') || null;
        if (sel === '.city-nav-pull-label') return elements.get('cityNavPullLabel') || null;
        return null;
      },
      querySelectorAll() { return []; },
      contains() { return false; },
      addEventListener() {},
      removeEventListener() {}
    };

    if (id) elements.set(id, el);
    return el;
  }

  const bodyEl = createMockElement('body', 'BODY');
  const docEl = createMockElement('docEl', 'HTML');
  const cityNavEl = createMockElement('cityNav', 'DIV');
  const cityNavPullHandleEl = createMockElement('cityNavPullHandle', 'DIV');
  const cityNavPullLabelEl = createMockElement('cityNavPullLabel', 'SPAN');
  const undoBtn = createMockElement('undoBtn', 'BUTTON');
  undoBtn.disabled = true;
  const redoBtn = createMockElement('redoBtn', 'BUTTON');
  const mobileUndoBtn = createMockElement('mobileUndoBtn', 'BUTTON');
  const mobileRedoBtn = createMockElement('mobileRedoBtn', 'BUTTON');
  const activeFileDisplay = createMockElement('activeFileDisplay', 'SPAN');
  activeFileDisplay.textContent = 'My Trip';
  const mobileActiveFileDisplay = createMockElement('mobileActiveFileDisplay', 'SPAN');
  const saveStatus = createMockElement('saveStatus', 'SPAN');
  saveStatus.textContent = 'Saved';
  const mobileSaveStatus = createMockElement('mobileSaveStatus', 'SPAN');
  const timestampStatus = createMockElement('timestampStatus', 'SPAN');
  timestampStatus.textContent = '12:00';
  const mobileTimestampStatus = createMockElement('mobileTimestampStatus', 'SPAN');
  const mobileMenuSheet = createMockElement('mobileMenuSheet', 'DIV', 'open');
  mobileMenuSheet.setAttribute('aria-hidden', 'false');
  const desktopActionsMenu = createMockElement('desktopActionsMenu', 'DETAILS');
  desktopActionsMenu.open = true;

  const activeTabBtn = createMockElement('activeTabBtn', 'BUTTON', 'app-tab-btn active');
  activeTabBtn.setAttribute('data-tab', 'itinerary');

  let currentMobileMatches = false;

  const mockDocument = {
    body: bodyEl,
    documentElement: docEl,
    getElementById: (id) => elements.get(id) || null,
    querySelector: (sel) => {
      if (sel === '.app-menu-bar') return createMockElement('', 'DIV', 'app-menu-bar');
      if (sel === '.app-tabs-nav') return createMockElement('', 'DIV', 'app-tabs-nav');
      if (sel === '.city-nav') return cityNavEl;
      if (sel === '.app-tab-btn.active') return activeTabBtn;
      return null;
    },
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {}
  };

  let rebuildCount = 0;

  const context = createVmContext({
    document: mockDocument,
    matchMedia: (query) => ({
      matches: query.includes('max-width: 768px') ? currentMobileMatches : false,
      media: query,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {}
    }),
    addEventListener: () => {},
    removeEventListener: () => {},
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    location: { hostname: 'localhost', origin: 'http://localhost', href: 'http://localhost/' },
    navigator: { userAgent: 'node' },
    rebuildCurrentView: () => { rebuildCount++; }
  });
  context.window = context;

  const uiJsSource = loadSource(path.join('js', 'ui.js'));
  runScriptInContext(uiJsSource, context, 'js/ui.js');

  context.rebuildCurrentView = () => { rebuildCount++; };

  const syncResponsiveUi = context.syncResponsiveUi;
  assert(typeof syncResponsiveUi === 'function', 'syncResponsiveUi must be defined as a function');

  // --- Test Case 1: Initial call in Desktop Viewport (matches = false) ---
  currentMobileMatches = false;
  rebuildCount = 0;

  syncResponsiveUi();

  assert(!bodyEl.classList.contains('mobile-app-mode'), 'Desktop mode: mobile-app-mode class must be toggled off');
  assert(!bodyEl.classList.contains('compact-view-mode'), 'Desktop mode: compact-view-mode class must be toggled off');
  assert(context.window.isCompactView === false, 'Desktop mode: window.isCompactView must be false');
  assert(bodyEl.getAttribute('data-active-tab') === 'itinerary', 'data-active-tab on body must be itinerary');
  assert(cityNavEl.getAttribute('data-active-tab') === 'itinerary', 'data-active-tab on cityNav must be itinerary');
  assert(!cityNavEl.classList.contains('tab-hidden'), 'cityNav must not have tab-hidden for itinerary tab');

  // Verify desktop menu closing side effects
  assert(!mobileMenuSheet.classList.contains('open'), 'Desktop mode: closeMobileMenu removes open class');
  assert(mobileMenuSheet.getAttribute('aria-hidden') === 'true', 'Desktop mode: closeMobileMenu sets aria-hidden="true"');
  assert(desktopActionsMenu.open === false, 'Desktop mode: closeDesktopActionsMenu sets menu.open = false');

  // On initial invocation (lastViewportWasMobile was null), viewportChanged is false
  assert(rebuildCount === 0, 'First call: rebuildCurrentView should not be called when viewportChanged is false');

  // --- Test Case 2: Subsequent call in same Desktop Viewport ---
  rebuildCount = 0;
  syncResponsiveUi();
  assert(rebuildCount === 0, 'Same viewport: rebuildCurrentView should not be called');

  // --- Test Case 3: Transition to Mobile Viewport (matches = true) ---
  currentMobileMatches = true;
  rebuildCount = 0;

  // Open menus to ensure mobile mode does NOT auto-close them during syncResponsiveUi
  mobileMenuSheet.classList.add('open');
  mobileMenuSheet.setAttribute('aria-hidden', 'false');
  desktopActionsMenu.open = true;

  syncResponsiveUi();

  assert(bodyEl.classList.contains('mobile-app-mode'), 'Mobile mode: mobile-app-mode class must be toggled on');
  assert(bodyEl.classList.contains('compact-view-mode'), 'Mobile mode: compact-view-mode class must be toggled on');
  assert(context.window.isCompactView === true, 'Mobile mode: window.isCompactView must be true');

  // On transition from desktop to mobile, viewportChanged is true -> rebuildCurrentView called
  assert(rebuildCount === 1, 'Desktop -> Mobile transition: rebuildCurrentView should be called once');

  // In mobile mode, syncResponsiveUi does not close mobileMenuSheet or desktopActionsMenu
  assert(mobileMenuSheet.classList.contains('open'), 'Mobile mode: syncResponsiveUi should not close mobile menu sheet');
  assert(desktopActionsMenu.open === true, 'Mobile mode: syncResponsiveUi should not close desktop actions menu');

  // Verify syncMobileMenuStatus copied text
  assert(mobileActiveFileDisplay.textContent === 'My Trip', 'Mobile active file display text synced from desktop source');
  assert(mobileSaveStatus.textContent === 'Saved', 'Mobile save status text synced from desktop source');
  assert(mobileTimestampStatus.textContent === '12:00', 'Mobile timestamp status text synced from desktop source');

  // Verify syncMobileMenuControls disabled logic in mobile
  assert(undoBtn.hidden === true, 'Disabled undo button in mobile viewport should be hidden');
  assert(undoBtn.getAttribute('aria-hidden') === 'true', 'Disabled undo button aria-hidden set to "true"');

  // --- Test Case 4: Subsequent call in same Mobile Viewport ---
  rebuildCount = 0;
  syncResponsiveUi();
  assert(rebuildCount === 0, 'Same mobile viewport: rebuildCurrentView should not be called');

  // --- Test Case 5: Active tab = "guide" hides cityNav ---
  activeTabBtn.setAttribute('data-tab', 'guide');
  bodyEl.removeAttribute('data-active-tab');
  cityNavEl.removeAttribute('data-active-tab');

  syncResponsiveUi();

  assert(bodyEl.getAttribute('data-active-tab') === 'guide', 'data-active-tab on body synced to "guide"');
  assert(cityNavEl.getAttribute('data-active-tab') === 'guide', 'data-active-tab on cityNav synced to "guide"');
  assert(cityNavEl.classList.contains('tab-hidden'), 'cityNav gets tab-hidden class when active tab is guide');

  // --- Test Case 6: Transition back to Desktop Viewport ---
  currentMobileMatches = false;
  rebuildCount = 0;

  syncResponsiveUi();

  assert(!bodyEl.classList.contains('mobile-app-mode'), 'Mobile -> Desktop: mobile-app-mode toggled off');
  assert(!bodyEl.classList.contains('compact-view-mode'), 'Mobile -> Desktop: compact-view-mode toggled off');
  assert(context.window.isCompactView === false, 'Mobile -> Desktop: isCompactView is false');
  assert(rebuildCount === 1, 'Mobile -> Desktop transition: rebuildCurrentView called once');

  // In desktop mode, syncResponsiveUi closes open mobile sheet and desktop actions menu
  assert(!mobileMenuSheet.classList.contains('open'), 'Mobile -> Desktop: mobile menu closed');
  assert(desktopActionsMenu.open === false, 'Mobile -> Desktop: desktop actions menu closed');

  console.log('✅ ALL syncResponsiveUi UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runSyncResponsiveUiTests();
  } catch (err) {
    console.error('❌ syncResponsiveUi TEST FAILED:', err.stack || err.message);
    process.exit(1);
  }
}

module.exports = { runSyncResponsiveUiTests };
