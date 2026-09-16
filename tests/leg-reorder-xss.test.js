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

async function runLegReorderXssTests() {
  console.log('Running Leg Reorder XSS prevention tests...');

  const document = createSimpleDom();
  const xssPayload = '<img src=x onerror=alert("xss")><script>alert("xss")</script>';

  const legDialogState = {
    mode: 'reorder',
    stagedLegs: [
      {
        id: 'leg_1',
        label: `Leg 1 ${xssPayload}`,
        days: [{ date: '2025-06-01' }]
      }
    ]
  };

  const context = createVmContext({
    document,
    legDialogState,
    appData: legDialogState.stagedLegs,
    window: {}
  });
  context.window = context;

  const utilsSource = loadSource(path.join('js', 'utils.js'));
  runScriptInContext(utilsSource, context, 'js/utils.js');

  const crudSource = loadSource(path.join('js', 'crud.js'));
  runScriptInContext(crudSource, context, 'js/crud.js');

  context.renderLegReorderList();
  const container = document.getElementById('legReorderList');
  const html = container.innerHTML;

  assert(!html.includes('<script>alert("xss")</script>'), 'Leg reorder list HTML must not contain unescaped <script> tags from leg.label');
  assert(!html.includes('<img src=x onerror=alert("xss")>'), 'Leg reorder list HTML must not contain unescaped <img> tags from leg.label');
  assert(html.includes('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'), 'XSS payload in leg.label must be HTML entity escaped in leg reorder list');

  console.log('✅ ALL LEG REORDER XSS TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  runLegReorderXssTests().catch(err => {
    console.error('❌ Leg Reorder XSS test failed:', err);
    process.exit(1);
  });
}

module.exports = { runLegReorderXssTests };
