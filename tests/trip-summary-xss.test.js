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

function runTripSummaryXssTests() {
  console.log('Running Trip Summary Modal XSS prevention tests...');

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

  const mockLegs = [
    {
      city: `Malicious City ${xssPayload}`,
      days: [
        {
          date: `2025-06-01"><script>alert("dateXSS")</script>`,
          to: `CityTo ${xssPayload}`,
          sights: [
            { name: `Sight ${xssPayload}` }
          ]
        }
      ]
    }
  ];

  const mockStays = [
    {
      checkIn: '2025-06-01',
      checkOut: '2025-06-02',
      name: `Stay ${xssPayload}`,
      neighborhood: `Neighborhood ${xssPayload}`
    }
  ];

  const mockJourneys = [
    {
      dep: '2025-06-01T10:00:00',
      from: `DepCity ${xssPayload}`,
      to: `ArrCity ${xssPayload}`,
      method: `Transport ${xssPayload}`
    }
  ];

  const context = createVmContext({
    URL,
    document,
    localStorage: mockLocalStorage,
    location: { hostname: 'localhost', origin: 'http://localhost:3000', href: 'http://localhost:3000/', protocol: 'http:' },
    addEventListener() {},
    appData: mockLegs,
    stays: mockStays,
    journeys: mockJourneys
  });
  context.window = context;

  const utilsSource = loadSource(path.join('js', 'utils.js'));
  runScriptInContext(utilsSource, context, 'js/utils.js');

  const uiSource = loadSource(path.join('js', 'ui.js'));
  runScriptInContext(uiSource, context, 'js/ui.js');

  context.openTripSummaryModal();

  const tbody = document.getElementById('tripSummaryTableBody');
  const tbodyHtml = tbody.children.map(c => c.innerHTML).join('') || tbody.innerHTML;

  assert(!tbodyHtml.includes('<script>'), 'Trip summary HTML must not contain raw unescaped <script> tags');
  assert(!tbodyHtml.includes('<img src=x onerror=alert(1)>'), 'Trip summary HTML must not contain raw unescaped <img> tags');

  assert(tbodyHtml.includes('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'), 'XSS payload in city/stay/journey/sight must be entity-escaped');
  assert(tbodyHtml.includes('&lt;script&gt;alert(&quot;dateXSS&quot;)&lt;/script&gt;'), 'XSS payload in display date must be entity-escaped');

  console.log('✅ ALL TRIP SUMMARY MODAL XSS TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runTripSummaryXssTests();
  } catch (err) {
    console.error('❌ Trip Summary XSS test failed:', err.message);
    process.exit(1);
  }
}

module.exports = { runTripSummaryXssTests };
