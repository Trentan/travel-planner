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
    return {
      id,
      style: {},
      hidden: false,
      children: [],
      classList: {
        add() {},
        remove() {}
      },
      addEventListener() {},
      removeEventListener() {},
      setAttribute() {},
      removeAttribute() {},
      querySelector() { return null; },
      querySelectorAll() { return []; },
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
      }
    };
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
    addEventListener() {},
    elements
  };
}

function runPrintAccomXssTests() {
  console.log('Running Printable Accommodations Table XSS prevention tests...');

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

  const xssPayload = '<script>alert("xss")</script><img src=x onerror=alert(1)>';

  const mockStays = [
    {
      city: `Malicious City ${xssPayload}`,
      name: `Stay ${xssPayload}`,
      checkIn: `2025-06-01"><script>alert("checkInXSS")</script>`,
      checkOut: `2025-06-05"><script>alert("checkOutXSS")</script>`,
      bookingRef: `BK-${xssPayload}`,
      location: `123 St ${xssPayload}`,
      notes: `Note ${xssPayload}`
    }
  ];

  const context = createVmContext({
    URL,
    document,
    localStorage: mockLocalStorage,
    location: { hostname: 'localhost', origin: 'http://localhost:3000', href: 'http://localhost:3000/', protocol: 'http:' },
    addEventListener() {},
    stays: mockStays
  });
  context.window = context;

  const utilsSource = loadSource(path.join('js', 'utils.js'));
  runScriptInContext(utilsSource, context, 'js/utils.js');

  const uiSource = loadSource(path.join('js', 'ui.js'));
  runScriptInContext(uiSource, context, 'js/ui.js');

  context.populatePrintTripHeader();

  const tableBody = document.getElementById('printAccomTableBody');
  const tableBodyHtml = tableBody.innerHTML;

  assert(!tableBodyHtml.includes('<script>'), 'Print accommodations HTML must not contain raw unescaped <script> tags');
  assert(!tableBodyHtml.includes('<img src=x onerror=alert(1)>'), 'Print accommodations HTML must not contain raw unescaped <img> tags');

  assert(tableBodyHtml.includes('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'), 'XSS payload in city/stay/bookingRef/locInfo must be entity-escaped');
  assert(tableBodyHtml.includes('&lt;script&gt;alert(&quot;checkInXSS&quot;)&lt;/script&gt;'), 'XSS payload in checkIn must be entity-escaped');
  assert(tableBodyHtml.includes('&lt;script&gt;alert(&quot;checkOutXSS&quot;)&lt;/script&gt;'), 'XSS payload in checkOut must be entity-escaped');

  console.log('✅ ALL PRINTABLE ACCOMMODATIONS TABLE XSS TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runPrintAccomXssTests();
  } catch (err) {
    console.error('❌ Printable Accommodations Table XSS test failed:', err.message);
    process.exit(1);
  }
}

module.exports = { runPrintAccomXssTests };
