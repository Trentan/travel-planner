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
        remove() {},
        toggle() {},
        contains() { return false; }
      },
      dataset: {},
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
      querySelector(selector) {
        return null;
      },
      insertAdjacentElement(position, element) {
        this.children.push(element);
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
    querySelector(selector) {
      return null;
    },
    querySelectorAll(selector) {
      return [];
    },
    addEventListener() {},
    removeEventListener() {},
    elements
  };
}

async function runMapXssTests() {
  console.log('Running Journey Map XSS prevention tests...');

  const document = createSimpleDom();

  const context = createVmContext({
    document,
    location: { hostname: 'localhost', origin: 'http://localhost:3000', href: 'http://localhost:3000/', protocol: 'http:' },
    addEventListener() {},
    console,
    isMobileViewport: () => true,
    innerWidth: 375,
    window: {}
  });
  context.window = context;

  const utilsSource = loadSource(path.join('js', 'utils.js'));
  runScriptInContext(utilsSource, context, 'js/utils.js');

  const mapSource = loadSource(path.join('js', 'map.js'));
  runScriptInContext(mapSource, context, 'js/map.js');

  const xssPayload = '<img src=x onerror=alert("xss")><script>alert("xss")</script>';

  // 1. Test renderMobileMapOverlayControls with XSS payload
  const hostContainer = document.createElement('div');
  const destinations = [
    {
      id: `dest-1-${xssPayload}`,
      name: `Tokyo ${xssPayload}`,
      country: `Japan ${xssPayload}`,
      colour: `#14b8a6${xssPayload}`,
      lat: 35.6762,
      lng: 139.6503
    }
  ];

  context.renderMobileMapOverlayControls(hostContainer, null, destinations);

  let stripHtml = '';
  hostContainer.children.forEach(child => {
    stripHtml += child.innerHTML;
  });

  assert(!stripHtml.includes('<script>alert("xss")</script>'), 'Mobile map overlay card HTML must not contain unescaped script tag');
  assert(!stripHtml.includes('<img src=x onerror=alert("xss")>'), 'Mobile map overlay card HTML must not contain unescaped img tag');
  assert(stripHtml.includes('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'), 'Mobile map overlay card HTML must contain escaped XSS payload in label/country/id');

  // 2. Test updateMapLegend with XSS payload
  const legendContainer = document.getElementById('map-legend-container');
  const legendDestinations = [
    {
      id: `legend-id-${xssPayload}`,
      name: `Paris ${xssPayload}`,
      color: `#3498DB${xssPayload}`,
      index: 1,
      isHome: false
    }
  ];

  context.updateMapLegend(legendDestinations);
  const legendHtml = legendContainer.innerHTML;

  assert(!legendHtml.includes('<script>alert("xss")</script>'), 'Map legend HTML must not contain unescaped script tag');
  assert(!legendHtml.includes('<img src=x onerror=alert("xss")>'), 'Map legend HTML must not contain unescaped img tag');
  assert(legendHtml.includes('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'), 'Map legend HTML must contain escaped XSS payload');

  // 3. Test updateMapStats with XSS payload in unmatchedCities
  const statsContainer = document.getElementById('journey-stats');
  const unmatchedCities = [`Rome ${xssPayload}`];

  context.updateMapStats(legendDestinations, unmatchedCities);
  const statsHtml = statsContainer.innerHTML;

  assert(!statsHtml.includes('<script>alert("xss")</script>'), 'Map stats HTML must not contain unescaped script tag');
  assert(!statsHtml.includes('<img src=x onerror=alert("xss")>'), 'Map stats HTML must not contain unescaped img tag');
  assert(statsHtml.includes('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'), 'Map stats HTML must contain escaped XSS payload in unmatched cities');

  console.log('✅ ALL JOURNEY MAP XSS TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  runMapXssTests().catch(err => {
    console.error('❌ Journey Map XSS test failed:', err);
    process.exit(1);
  });
}

module.exports = { runMapXssTests };
