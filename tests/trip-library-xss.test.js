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

async function runTripLibraryXssTests() {
  console.log('Running Trip Library XSS prevention tests...');

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

  const xssPayload = '<img src=x onerror=alert("xss")><script>alert("xss")</script>';
  const mockTrips = [
    {
      id: `trip_xss_1_${xssPayload}`,
      title: `Malicious Trip ${xssPayload}`,
      subtitle: `Subtitle ${xssPayload}`,
      flags: `🚩${xssPayload}`,
      dateRange: `2025 ${xssPayload}`,
      legCount: `<script>alert("legCountXSS")</script>`,
      stayCount: `<script>alert("stayCountXSS")</script>`,
      updatedAt: `<script>alert("updatedAtXSS")</script>`
    }
  ];

  const context = createVmContext({
    URL,
    document,
    localStorage: mockLocalStorage,
    location: { hostname: 'localhost', origin: 'http://localhost:3000', href: 'http://localhost:3000/', protocol: 'http:' },
    addEventListener() {},
    getAllTripsFromIndexedDB: async () => mockTrips,
    getActiveTripId: () => mockTrips[0].id,
    isGoogleDriveConnected: () => false,
    __gdriveCloudFiles: [],
    getGDriveFileMap: () => ({})
  });
  context.window = context;

  const tripLibrarySource = loadSource(path.join('js', 'trip-library.js'));
  runScriptInContext(tripLibrarySource, context, 'js/trip-library.js');

  // Test 1: Trip Gallery Grid Rendering
  await context.renderTripGalleryGrid();
  const grid = document.getElementById('tripGalleryGrid');
  const cardElement = grid.children.find(c => c.children && c.children.length > 0) || grid.children[0];
  const gridHtml = cardElement ? cardElement.innerHTML : grid.innerHTML;

  assert(!gridHtml.includes('<script>alert("xss")</script>'), 'Trip gallery card HTML must not contain unescaped <script> tags from trip flags/title');
  assert(!gridHtml.includes('<img src=x onerror=alert("xss")>'), 'Trip gallery card HTML must not contain unescaped <img> tags from trip flags/title');
  assert(!gridHtml.includes('<script>alert("legCountXSS")</script>'), 'Trip gallery card HTML must not contain unescaped legCount XSS payload');
  assert(!gridHtml.includes('<script>alert("stayCountXSS")</script>'), 'Trip gallery card HTML must not contain unescaped stayCount XSS payload');
  assert(!gridHtml.includes('<script>alert("updatedAtXSS")</script>'), 'Trip gallery card HTML must not contain unescaped updatedAt XSS payload');
  assert(gridHtml.includes('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'), 'XSS payload in trip flags/title/subtitle/dates must be HTML entity escaped in trip gallery cards');
  assert(gridHtml.includes('&lt;script&gt;alert(&quot;legCountXSS&quot;)&lt;/script&gt;'), 'XSS payload in legCount must be HTML entity escaped');
  assert(gridHtml.includes('&lt;script&gt;alert(&quot;stayCountXSS&quot;)&lt;/script&gt;'), 'XSS payload in stayCount must be HTML entity escaped');
  assert(gridHtml.includes('&lt;script&gt;alert(&quot;updatedAtXSS&quot;)&lt;/script&gt;'), 'XSS payload in updatedAt must be HTML entity escaped');

  // Test 2: Header Trip Switcher Dropdown Rendering
  await context.renderHeaderTripSwitcher();
  const recentList = document.getElementById('recentTripsList');
  const dropdownHtml = recentList.children.map(c => c.innerHTML).join('');

  assert(!dropdownHtml.includes('<script>alert("xss")</script>'), 'Header trip dropdown HTML must not contain unescaped <script> tags from trip flags/title');
  assert(!dropdownHtml.includes('<img src=x onerror=alert("xss")>'), 'Header trip dropdown HTML must not contain unescaped <img> tags from trip flags/title');

  console.log('✅ ALL TRIP LIBRARY XSS TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  runTripLibraryXssTests().catch(err => {
    console.error('❌ Trip Library XSS test failed:', err);
    process.exit(1);
  });
}

module.exports = { runTripLibraryXssTests };
