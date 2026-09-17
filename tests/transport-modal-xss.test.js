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
    elements
  };
}

async function runTransportModalXssTests() {
  console.log('Running Transport Modal Segment List XSS prevention tests...');

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
    URL,
    document,
    localStorage: mockLocalStorage,
    location: { hostname: 'localhost', origin: 'http://localhost:3000', href: 'http://localhost:3000/', protocol: 'http:' },
    addEventListener() {},
    console,
    formatJourneyDate(d) { return d || ''; }
  });
  context.window = context;

  const utilsSource = loadSource(path.join('js', 'utils.js'));
  runScriptInContext(utilsSource, context, 'js/utils.js');

  const transportSource = loadSource(path.join('js', 'transport.js'));
  runScriptInContext(transportSource, context, 'js/transport.js');

  const xssPayload = '<img src=x onerror=alert("xss")><script>alert("xss")</script>';

  runScriptInContext(`
    _pendingSegments = [
      {
        id: 'seg_xss_1',
        fromLocation: 'London ${xssPayload}',
        toLocation: 'Paris ${xssPayload}',
        departureDate: '2026-06-01',
        departureTime: '10:00 ${xssPayload}',
        arrivalDate: '2026-06-01',
        arrivalTime: '12:00 ${xssPayload}',
        provider: 'Airline ${xssPayload}',
        routeCode: 'BA123 ${xssPayload}'
      }
    ];
    _activeSegmentIndex = 0;
    _updateSegmentList();
  `, context, 'setup-test');

  const labelEl = document.getElementById('currentSegmentLabel');
  const trackerEl = document.getElementById('segmentTracker');
  const summaryEl = document.getElementById('pendingSegmentsList');

  // Assertions for currentSegmentLabel
  assert(!labelEl.innerHTML.includes('<script>alert("xss")</script>'), 'Label HTML must not contain unescaped script tag');
  assert(!labelEl.innerHTML.includes('<img src=x onerror=alert("xss")>'), 'Label HTML must not contain unescaped img tag');
  assert(labelEl.innerHTML.includes('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'), 'Label HTML must contain escaped XSS payload');

  // Assertions for segmentTracker
  assert(!trackerEl.innerHTML.includes('<script>alert("xss")</script>'), 'Tracker HTML must not contain unescaped script tag');
  assert(!trackerEl.innerHTML.includes('<img src=x onerror=alert("xss")>'), 'Tracker HTML must not contain unescaped img tag');
  assert(trackerEl.innerHTML.includes('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'), 'Tracker HTML must contain escaped XSS payload');

  // Assertions for pendingSegmentsList
  assert(!summaryEl.innerHTML.includes('<script>alert("xss")</script>'), 'Summary list HTML must not contain unescaped script tag');
  assert(!summaryEl.innerHTML.includes('<img src=x onerror=alert("xss")>'), 'Summary list HTML must not contain unescaped img tag');
  assert(summaryEl.innerHTML.includes('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'), 'Summary list HTML must contain escaped XSS payload');

  console.log('✅ ALL TRANSPORT MODAL XSS TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  runTransportModalXssTests().catch(err => {
    console.error('❌ Transport Modal XSS test failed:', err);
    process.exit(1);
  });
}

module.exports = { runTransportModalXssTests };
