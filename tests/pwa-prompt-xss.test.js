const path = require('path');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function createSimpleDom() {
  const elements = {};

  function makeElement(id, tag = 'div') {
    const el = {
      id,
      tagName: tag.toUpperCase(),
      style: {},
      attributes: {},
      _className: '',
      get className() {
        return this._className;
      },
      set className(val) {
        this._className = val || '';
        this.attributes['class'] = val || '';
        this.classList._list = new Set((val || '').split(' ').filter(Boolean));
      },
      get href() {
        return this.attributes['href'] || '';
      },
      set href(val) {
        this.attributes['href'] = val || '';
      },
      classList: {
        _list: new Set(),
        add(...cls) {
          cls.forEach(c => this._list.add(c));
          el._className = Array.from(this._list).join(' ');
          el.attributes['class'] = el._className;
        },
        remove(...cls) {
          cls.forEach(c => this._list.delete(c));
          el._className = Array.from(this._list).join(' ');
          el.attributes['class'] = el._className;
        },
        contains(c) { return this._list.has(c); }
      },
      children: [],
      listeners: {},
      addEventListener(evt, handler) {
        if (!this.listeners[evt]) this.listeners[evt] = [];
        this.listeners[evt].push(handler);
      },
      dispatchEvent(evt) {
        if (this.listeners[evt]) {
          this.listeners[evt].forEach(h => h());
        }
      },
      setAttribute(name, val) {
        this.attributes[name] = val;
        if (name === 'class') {
          this.className = val;
        }
      },
      getAttribute(name) {
        return this.attributes[name] !== undefined ? this.attributes[name] : null;
      },
      _textContent: '',
      get textContent() {
        if (this.children.length > 0) {
          return this.children.map(c => c.textContent || '').join('');
        }
        return this._textContent;
      },
      set textContent(val) {
        this.children = [];
        this._textContent = val;
      },
      appendChild(child) {
        child.parentNode = this;
        this.children.push(child);
      },
      removeChild(child) {
        const idx = this.children.indexOf(child);
        if (idx !== -1) {
          this.children.splice(idx, 1);
          child.parentNode = null;
        }
      },
      querySelector(selector) {
        return findSelector(this, selector);
      },
      querySelectorAll(selector) {
        const results = [];
        findAllSelectors(this, selector, results);
        return results;
      }
    };
    return el;
  }

  function findSelector(node, selector) {
    if (!node || !node.children) return null;
    for (const child of node.children) {
      if (child.nodeType === 3) continue;
      if (matchesSelector(child, selector)) return child;
      const found = findSelector(child, selector);
      if (found) return found;
    }
    return null;
  }

  function findAllSelectors(node, selector, results) {
    if (!node || !node.children) return;
    for (const child of node.children) {
      if (child.nodeType === 3) continue;
      if (matchesSelector(child, selector)) results.push(child);
      findAllSelectors(child, selector, results);
    }
  }

  function matchesSelector(el, selector) {
    if (selector.startsWith('#')) {
      return el.id === selector.slice(1);
    }
    if (selector.startsWith('.')) {
      return el.classList.contains(selector.slice(1));
    }
    if (selector.toLowerCase() === el.tagName.toLowerCase()) {
      return true;
    }
    return false;
  }

  const body = makeElement('body', 'body');

  return {
    body,
    getElementById(id) {
      if (id === 'pwaPromptModal') {
        return findSelector(body, '#pwaPromptModal');
      }
      if (!elements[id]) {
        elements[id] = makeElement(id);
      }
      return elements[id];
    },
    createElement(tag) {
      return makeElement(`el_${Math.random()}`, tag);
    },
    createTextNode(text) {
      return {
        nodeType: 3,
        textContent: text
      };
    },
    elements
  };
}

async function runPwaPromptXssTests() {
  console.log('Running PWA Prompt DOM rendering & XSS prevention tests...');

  const localStorageMap = new Map();
  const mockLocalStorage = {
    getItem(key) {
      return localStorageMap.get(key) || null;
    },
    setItem(key, value) {
      localStorageMap.set(key, String(value));
    },
    removeItem(key) {
      localStorageMap.delete(key);
    }
  };

  // Test 1: iOS PWA prompt safe DOM structure and dismiss action
  {
    const document = createSimpleDom();
    localStorageMap.clear();

    const context = createVmContext({
      document,
      localStorage: mockLocalStorage,
      navigator: {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
        standalone: false,
        maxTouchPoints: 5
      },
      window: { innerWidth: 390 },
      setTimeout,
      clearTimeout,
      Date,
      parseInt,
      isNaN
    });
    context.window = context;

    const pwaSource = loadSource(path.join('js', 'pwa-prompt.js'));
    runScriptInContext(pwaSource, context, 'js/pwa-prompt.js');

    context.initPwaPrompt();

    const card = document.getElementById('pwaPromptModal');
    assert(card !== null, 'iOS PWA prompt card should be created and appended to document body');
    assert(card.classList.contains('pwa-prompt-card'), 'iOS card should have pwa-prompt-card class');
    assert(card.classList.contains('role-ios'), 'iOS card should have role-ios class');

    const title = card.querySelector('.pwa-prompt-title');
    assert(title && title.textContent === '📱 Add to Home Screen', 'iOS title should match "📱 Add to Home Screen"');

    const steps = card.querySelector('.pwa-prompt-steps');
    assert(steps !== null, 'iOS prompt should render step-by-step guidance container');

    const primaryBtn = card.querySelector('.pwa-btn-primary');
    assert(primaryBtn && primaryBtn.textContent === 'Got it!', 'Primary button should be "Got it!"');

    // Click primary button to dismiss
    primaryBtn.dispatchEvent('click');
    assert(mockLocalStorage.getItem('travelApp_pwa_prompt_dismissed_v1') === 'permanent', 'Dismissing prompt should set permanent dismiss in localStorage');
  }

  // Test 2: Android Play Store advisory safe DOM structure
  {
    const document = createSimpleDom();
    localStorageMap.clear();

    const context = createVmContext({
      document,
      localStorage: mockLocalStorage,
      navigator: {
        userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        standalone: false,
        maxTouchPoints: 5
      },
      window: { innerWidth: 390 },
      setTimeout,
      clearTimeout,
      Date,
      parseInt,
      isNaN
    });
    context.window = context;

    const pwaSource = loadSource(path.join('js', 'pwa-prompt.js'));
    runScriptInContext(pwaSource, context, 'js/pwa-prompt.js');

    context.initPwaPrompt();

    const card = document.getElementById('pwaPromptModal');
    assert(card !== null, 'Android PWA prompt card should be created and appended to document body');
    assert(card.classList.contains('role-android'), 'Android card should have role-android class');

    const title = card.querySelector('.pwa-prompt-title');
    assert(title && title.textContent === '🚀 Get the Mobile App', 'Android title should match "🚀 Get the Mobile App"');

    const playLink = card.querySelector('.pwa-btn-play');
    assert(playLink && playLink.getAttribute('href').includes('play.google.com'), 'Android prompt should include valid Google Play URL');
  }

  console.log('✅ ALL PWA PROMPT XSS TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  runPwaPromptXssTests().catch(err => {
    console.error('❌ PWA Prompt XSS test failed:', err);
    process.exit(1);
  });
}

module.exports = { runPwaPromptXssTests };
