const path = require('path');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function createSimpleDom() {
  const elements = {};

  function makeElement(id) {
    const listeners = {};
    const el = {
      id,
      style: {},
      hidden: false,
      children: [],
      classList: {
        add() {},
        remove() {}
      },
      _innerHTML: '',
      get innerHTML() {
        return this._innerHTML;
      },
      set innerHTML(val) {
        this._innerHTML = val;
      },
      _innerText: '',
      get innerText() {
        return this._innerText;
      },
      set innerText(val) {
        this._innerText = val;
      },
      appendChild(child) {
        this.children.push(child);
      },
      addEventListener(type, fn) {
        listeners[type] = listeners[type] || [];
        listeners[type].push(fn);
      },
      querySelectorAll(selector) {
        return [];
      },
      cloneNode(deep) {
        const clone = makeElement(`${this.id}_clone`);
        clone.parentNode = this.parentNode;
        return clone;
      },
      parentNode: {
        replaceChild(newChild, oldChild) {}
      }
    };
    return el;
  }

  return {
    getElementById(id) {
      if (!elements[id]) {
        elements[id] = makeElement(id);
      }
      return elements[id];
    },
    createElement(tag) {
      return makeElement(`el_${Math.random()}`);
    },
    elements
  };
}

async function runCityListXssTests() {
  console.log('Running City List XSS prevention tests...');

  const document = createSimpleDom();
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

  const context = createVmContext({
    document,
    localStorage: mockLocalStorage,
    location: { hostname: 'localhost', origin: 'http://localhost:3000', href: 'http://localhost:3000/', protocol: 'http:' },
    addEventListener() {},
    console,
    window: {}
  });
  context.window = context;

  const utilsSource = loadSource(path.join('js', 'utils.js'));
  runScriptInContext(utilsSource, context, 'js/utils.js');

  const dataSource = loadSource(path.join('js', 'data.js'));
  runScriptInContext(dataSource, context, 'js/data.js');

  const xssPayload = '<img src=x onerror=alert("xss")><script>alert("xss")</script>';

  runScriptInContext(`
    citiesData = [
      {
        id: 'city_xss_1${xssPayload}',
        name: 'London ${xssPayload}',
        code: 'LON${xssPayload}',
        icaoCode: 'EGLL${xssPayload}',
        countryCode: 'GB',
        lat: 51.5074,
        lng: -0.1278
      }
    ];
    populateCityList();
  `, context, 'setup-test');

  const container = document.getElementById('cityListContainer');
  assert(container.children.length > 0, 'Container should have child elements appended');

  let html = '';
  container.children.forEach(child => {
    html += child.innerHTML;
  });

  assert(!html.includes('<script>alert("xss")</script>'), 'City list HTML must not contain unescaped script tag');
  assert(!html.includes('<img src=x onerror=alert("xss")>'), 'City list HTML must not contain unescaped img tag');
  assert(html.includes('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'), 'City list HTML must contain escaped XSS payload');

  console.log('✅ ALL CITY LIST XSS TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  runCityListXssTests().catch(err => {
    console.error('❌ City List XSS test failed:', err);
    process.exit(1);
  });
}

module.exports = { runCityListXssTests };
