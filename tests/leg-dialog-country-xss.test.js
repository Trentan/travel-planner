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
      value: '',
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

async function runLegDialogCountryXssTests() {
  console.log('Running Leg Dialog Country Dropdown XSS prevention tests...');

  const document = createSimpleDom();
  const xssPayload = '<img src=x onerror=alert("xss")><script>alert("xss")</script>';

  const COUNTRY_DATA = [
    {
      code: `US"${xssPayload}`,
      flag: `🇺🇸${xssPayload}`,
      name: `United States${xssPayload}`
    }
  ];

  const legDialogState = {
    mode: 'add',
    stagedLegs: []
  };

  const context = createVmContext({
    document,
    COUNTRY_DATA,
    legDialogState,
    appData: [],
    window: {}
  });
  context.window = context;

  const utilsSource = loadSource(path.join('js', 'utils.js'));
  runScriptInContext(utilsSource, context, 'js/utils.js');

  const legDialogSource = loadSource(path.join('js', 'leg-dialog.js'));
  runScriptInContext(legDialogSource, context, 'js/leg-dialog.js');

  context._populateAddLegCityDropdowns();
  const countrySelect = document.getElementById('newLegCityCountrySelect');
  const html = countrySelect.innerHTML;

  assert(!html.includes('<script>alert("xss")</script>'), 'Country select HTML must not contain unescaped <script> tags from COUNTRY_DATA');
  assert(!html.includes('<img src=x onerror=alert("xss")>'), 'Country select HTML must not contain unescaped <img> tags from COUNTRY_DATA');
  assert(html.includes('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'), 'XSS payload in COUNTRY_DATA must be HTML entity escaped in country select dropdown');

  console.log('✅ ALL LEG DIALOG COUNTRY XSS TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  runLegDialogCountryXssTests().catch(err => {
    console.error('❌ Leg Dialog Country XSS test failed:', err);
    process.exit(1);
  });
}

module.exports = { runLegDialogCountryXssTests };
