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
    const el = {
      id,
      value: '',
      style: {},
      hidden: false,
      children: [],
      options: [],
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
      _textContent: '',
      get textContent() {
        return this._textContent;
      },
      set textContent(val) {
        this._textContent = val;
      },
      appendChild(child) {
        this.children.push(child);
        if (child.value !== undefined) {
          this.options.push(child);
        }
      },
      replaceChildren(...newChildren) {
        this.children = [...newChildren];
        this.options = newChildren.filter(c => c && c.value !== undefined);
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

async function runStaysCitySelectTests() {
  console.log('Running Stays City Select DOM rendering & XSS prevention tests...');

  const document = createSimpleDom();
  const xssPayload = '<img src=x onerror=alert("xss")><script>alert("xss")</script>';

  const citiesData = [
    {
      id: 'city_1',
      name: `Tokyo ${xssPayload}`,
      country: `Japan ${xssPayload}`
    },
    {
      id: 'city_2',
      name: 'Paris',
      country: 'France'
    }
  ];

  const context = createVmContext({
    document,
    citiesData,
    window: {}
  });
  context.window = context;

  const utilsSource = loadSource(path.join('js', 'utils.js'));
  runScriptInContext(utilsSource, context, 'js/utils.js');

  const staysSource = loadSource(path.join('js', 'stays.js'));
  runScriptInContext(staysSource, context, 'js/stays.js');

  const citySelect = document.getElementById('stayCitySelect');
  context._populateStayCitySelect(citySelect, 'city_1');

  assert(citySelect.options.length === 3, `Expected 3 options, got ${citySelect.options.length}`);
  assert(citySelect.options[0].value === '', 'Default option value should be empty string');
  assert(citySelect.options[0].textContent === '-- Select city --', 'Default option text should match');

  const option1 = citySelect.options[1];
  assert(option1.value === 'city_1', 'Option 1 value should match city_1');
  assert(option1.selected === true, 'Option 1 should be selected');
  assert(option1.textContent.includes(xssPayload), 'textContent must preserve raw string payload without HTML evaluation');
  assert(!citySelect.innerHTML.includes('<script>'), 'Select element innerHTML must not contain unescaped script tag');

  console.log('✅ ALL STAYS CITY SELECT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  runStaysCitySelectTests().catch(err => {
    console.error('❌ Stays City Select test failed:', err);
    process.exit(1);
  });
}

module.exports = { runStaysCitySelectTests };
