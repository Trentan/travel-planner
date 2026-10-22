const assert = require('assert');
const path = require('path');
const { createVmContext, runScriptInContext, loadSource } = require('./lib/test-helpers');

function runUpdateStickyOffsetsTests() {
  console.log('Testing updateStickyOffsets in js/ui.js...');

  function setupTestEnvironment(options = {}) {
    const {
      isMobile = false,
      hasMenuBar = true,
      hasTabsNav = true,
      hasCityNav = true,
      menuHeight = 50,
      tabsHeight = 40,
      cityHeight = 30,
      cityNavHiddenClass = false,
      cityNavDisplayStyle = 'flex'
    } = options;

    const cssProperties = new Map();
    const documentElementStyle = {
      setProperty: (key, val) => {
        cssProperties.set(key, val);
      }
    };

    const bodyStyle = { paddingTop: 'initial' };

    function createMockElement(selector, height, extra = {}) {
      const classes = new Set(extra.classes || []);
      const style = extra.style || {};
      return {
        selector,
        style,
        classList: {
          contains: c => classes.has(c),
          add: c => classes.add(c),
          remove: c => classes.delete(c)
        },
        getBoundingClientRect: () => ({ height })
      };
    }

    const menuBarEl = hasMenuBar ? createMockElement('.app-menu-bar', menuHeight) : null;
    const tabsNavEl = hasTabsNav ? createMockElement('.app-tabs-nav', tabsHeight) : null;
    const cityNavEl = hasCityNav ? createMockElement('.city-nav', cityHeight, {
      classes: cityNavHiddenClass ? ['tab-hidden'] : []
    }) : null;

    const querySelector = (sel) => {
      if (sel === '.app-menu-bar') return menuBarEl;
      if (sel === '.app-tabs-nav') return tabsNavEl;
      if (sel === '.city-nav') return cityNavEl;
      return null;
    };

    const mockDocument = {
      querySelector,
      body: { style: bodyStyle, classList: { toggle: () => {}, remove: () => {}, add: () => {} } },
      documentElement: { style: documentElementStyle },
      addEventListener: () => {},
      getElementById: () => null
    };

    const mockWindow = {
      matchMedia: (query) => ({
        matches: query.includes('max-width: 768px') ? isMobile : false,
        addEventListener: () => {}
      }),
      getComputedStyle: (el) => {
        if (el === cityNavEl) {
          return { display: cityNavDisplayStyle };
        }
        return { display: 'block' };
      },
      addEventListener: () => {}
    };

    const context = createVmContext({
      document: mockDocument,
      window: mockWindow,
      navigator: {},
      localStorage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
      },
      sessionStorage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
      }
    });

    const uiSource = loadSource(path.join('js', 'ui.js'));
    runScriptInContext(uiSource, context, 'js/ui.js');

    // Clear initial properties set during script execution/syncResponsiveUi initialization
    cssProperties.clear();

    return {
      context,
      tabsNavEl,
      cityNavEl,
      menuBarEl,
      bodyStyle,
      cssProperties
    };
  }

  // 1. Missing .app-tabs-nav -> returns early without changes
  {
    const env = setupTestEnvironment({ hasTabsNav: false });
    env.context.updateStickyOffsets();
    assert.strictEqual(env.cssProperties.size, 0, 'No CSS custom properties should be set when tabsNav is missing');
    assert.strictEqual(env.bodyStyle.paddingTop, 'initial', 'body.style.paddingTop should not be updated when tabsNav is missing');
  }

  // 2. Desktop viewport standard calculations
  {
    const env = setupTestEnvironment({
      isMobile: false,
      menuHeight: 50,
      tabsHeight: 40,
      cityHeight: 30
    });
    env.context.updateStickyOffsets();

    assert.strictEqual(env.tabsNavEl.style.top, '50px', 'tabsNav.style.top should be set to menuHeight');
    assert.strictEqual(env.cityNavEl.style.top, '89px', 'cityNav.style.top should be menuHeight + tabsHeight - 1');
    assert.strictEqual(env.bodyStyle.paddingTop, '90px', 'body.style.paddingTop should be menuHeight + tabsHeight');

    assert.strictEqual(env.cssProperties.get('--app-menu-height'), '50px', '--app-menu-height should be 50px');
    assert.strictEqual(env.cssProperties.get('--app-tabs-height'), '40px', '--app-tabs-height should be 40px');
    assert.strictEqual(env.cssProperties.get('--app-city-height'), '30px', '--app-city-height should be 30px');
    assert.strictEqual(env.cssProperties.get('--desktop-sticky-offset'), '132px', '--desktop-sticky-offset should be 50 + 40 + 30 + 12 = 132px');
  }

  // 3. Desktop viewport missing menu bar
  {
    const env = setupTestEnvironment({
      isMobile: false,
      hasMenuBar: false,
      tabsHeight: 45,
      cityHeight: 35
    });
    env.context.updateStickyOffsets();

    assert.strictEqual(env.tabsNavEl.style.top, '0px', 'tabsNav.style.top should be 0px when menuBar is missing');
    assert.strictEqual(env.cityNavEl.style.top, '44px', 'cityNav.style.top should be 0 + 45 - 1 = 44px');
    assert.strictEqual(env.bodyStyle.paddingTop, '45px', 'body.style.paddingTop should be 45px');

    assert.strictEqual(env.cssProperties.get('--app-menu-height'), '0px', '--app-menu-height should be 0px');
    assert.strictEqual(env.cssProperties.get('--app-tabs-height'), '45px', '--app-tabs-height should be 45px');
    assert.strictEqual(env.cssProperties.get('--app-city-height'), '35px', '--app-city-height should be 35px');
    assert.strictEqual(env.cssProperties.get('--desktop-sticky-offset'), '92px', '--desktop-sticky-offset should be 0 + 45 + 35 + 12 = 92px');
  }

  // 4. Desktop viewport with hidden cityNav (via tab-hidden class)
  {
    const env = setupTestEnvironment({
      isMobile: false,
      menuHeight: 50,
      tabsHeight: 40,
      cityHeight: 30,
      cityNavHiddenClass: true
    });
    env.context.updateStickyOffsets();

    assert.strictEqual(env.cssProperties.get('--app-city-height'), '0px', '--app-city-height should be 0px when cityNav has tab-hidden');
    assert.strictEqual(env.cssProperties.get('--desktop-sticky-offset'), '102px', '--desktop-sticky-offset should be 50 + 40 + 0 + 12 = 102px');
  }

  // 5. Desktop viewport with hidden cityNav (via getComputedStyle display: none)
  {
    const env = setupTestEnvironment({
      isMobile: false,
      menuHeight: 50,
      tabsHeight: 40,
      cityHeight: 30,
      cityNavDisplayStyle: 'none'
    });
    env.context.updateStickyOffsets();

    assert.strictEqual(env.cssProperties.get('--app-city-height'), '0px', '--app-city-height should be 0px when getComputedStyle is display: none');
    assert.strictEqual(env.cssProperties.get('--desktop-sticky-offset'), '102px', '--desktop-sticky-offset should be 50 + 40 + 0 + 12 = 102px');
  }

  // 6. Desktop viewport with missing cityNav element
  {
    const env = setupTestEnvironment({
      isMobile: false,
      hasCityNav: false,
      menuHeight: 50,
      tabsHeight: 40
    });
    env.context.updateStickyOffsets();

    assert.strictEqual(env.cssProperties.get('--app-city-height'), '0px', '--app-city-height should be 0px when cityNav is null');
    assert.strictEqual(env.cssProperties.get('--desktop-sticky-offset'), '102px', '--desktop-sticky-offset should be 50 + 40 + 0 + 12 = 102px');
  }

  // 7. Mobile viewport calculations
  {
    const env = setupTestEnvironment({
      isMobile: true,
      menuHeight: 50,
      tabsHeight: 40,
      cityHeight: 30
    });
    // Set initial inline styles to verify reset
    env.tabsNavEl.style.top = '50px';
    env.cityNavEl.style.top = '89px';
    env.bodyStyle.paddingTop = '90px';

    env.context.updateStickyOffsets();

    assert.strictEqual(env.tabsNavEl.style.top, '', 'tabsNav.style.top should be cleared on mobile');
    assert.strictEqual(env.cityNavEl.style.top, '', 'cityNav.style.top should be cleared on mobile');
    assert.strictEqual(env.bodyStyle.paddingTop, '', 'body.style.paddingTop should be cleared on mobile');

    assert.strictEqual(env.cssProperties.get('--app-menu-height'), '0px', '--app-menu-height should be 0px on mobile');
    assert.strictEqual(env.cssProperties.get('--app-tabs-height'), '40px', '--app-tabs-height should match tabsHeight');
    assert.strictEqual(env.cssProperties.get('--app-city-height'), '30px', '--app-city-height should match cityHeight');
    assert.strictEqual(env.cssProperties.get('--desktop-sticky-offset'), '0px', '--desktop-sticky-offset should be 0px on mobile');
  }

  console.log('✔ All updateStickyOffsets unit tests passed successfully!\n');
}

if (require.main === module) {
  runUpdateStickyOffsetsTests();
}

module.exports = { runUpdateStickyOffsetsTests };
