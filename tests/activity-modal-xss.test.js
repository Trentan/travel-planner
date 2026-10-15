const path = require('path');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function createSimpleDom() {
  const elements = {};

  function getEl(id) {
    if (!elements[id]) {
      elements[id] = {
        id,
        tagName: 'DIV',
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
        _textContent: '',
        get textContent() {
          return this._textContent;
        },
        set textContent(val) {
          this._textContent = val;
        },
        appendChild(child) {
          this.children.push(child);
        },
        addEventListener(type, fn) {},
        querySelector() {
          return null;
        },
        querySelectorAll() {
          return [];
        },
        remove() {}
      };
    }
    return elements[id];
  }

  const body = getEl('body');

  return {
    body,
    getElementById(id) {
      if (id === 'body') return body;
      if (id === 'activity-assign-modal') return this._modal;
      return getEl(id);
    },
    createElement(tag) {
      const el = {
        id: `el_${Math.random()}`,
        tagName: tag.toUpperCase(),
        style: {},
        className: '',
        innerHTML: '',
        querySelectorAll() { return []; },
        querySelector() { return null; },
        addEventListener() {},
        remove() {}
      };
      if (tag === 'div' && !this._modal) this._modal = el;
      return el;
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

async function runActivityModalXssTests() {
  console.log('Running Activity Modal XSS prevention tests...');

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
    parse24HourTo12HourParts() { return { hour: '10', minute: '00', ampm: 'AM' }; },
    get24HourTimeFrom12HourParts() { return '10:00'; },
    suggestActivityTimeForDay(leg, day) {
      return { startTime: '10:00', endTime: '11:00', available: true, label: '10:00 AM', reason: 'Open slot' };
    },
    getSuggestedActivityMatchTexts() { return []; },
    getAssignedSuggestedActivityDayItem() { return null; },
    isPlaceholderActivityItem() { return false; },
    convertLocalToHomeTime(time, date, city) {
      return `Converted ${time} <script>alert("xss_home_converted")</script>`;
    }
  });
  context.window = context;

  const utilsSource = loadSource(path.join('js', 'utils.js'));
  runScriptInContext(utilsSource, context, 'js/utils.js');

  const actModalSource = loadSource(path.join('js', 'activity-modal.js'));
  runScriptInContext(actModalSource, context, 'js/activity-modal.js');

  runScriptInContext(`
    const xssPayload = '<img src=x onerror=alert("xss")><script>alert("xss")</script>';
    appData = [
      {
        label: 'Tokyo ' + xssPayload,
        suggestedActivities: [
          {
            title: 'Activity Title ' + xssPayload,
            location: 'Location ' + xssPayload,
            notes: 'Notes ' + xssPayload,
            bookingRef: 'Ref ' + xssPayload,
            externalLink: 'Link ' + xssPayload,
            estTime: '1 hr ' + xssPayload,
            estCost: '50 ' + xssPayload,
            startTime: '09:00 ' + xssPayload,
            endTime: '10:00 ' + xssPayload,
            category: 'sight',
            status: 'planned'
          }
        ],
        days: [
          {
            day: 1,
            date: '2026-06-01 ' + xssPayload,
            from: 'Tokyo ' + xssPayload,
            to: 'Kyoto ' + xssPayload,
            desc: 'Day desc ' + xssPayload,
            activityItems: []
          }
        ]
      }
    ];

    openActivityModalUnified(0, 0);
  `, context, 'setup-test');

  const modal = document._modal;
  assert(modal, 'Modal element must exist in DOM');

  const html = modal.innerHTML;

  assert(!html.includes('<script>alert("xss")</script>'), 'Modal HTML must not contain unescaped script tag in fields');
  assert(!html.includes('<img src=x onerror=alert("xss")>'), 'Modal HTML must not contain unescaped img tag in fields');
  assert(!html.includes('<script>alert("xss_home_converted")</script>'), 'Modal HTML must not contain unescaped script tag from homeConverted dual time');

  const escapedScript = context.escapeHtmlText('<script>alert("xss")</script>');
  assert(html.includes(escapedScript), `Modal HTML must contain escaped XSS payload (${escapedScript})`);

  console.log('✅ ALL ACTIVITY MODAL XSS TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  runActivityModalXssTests().catch(err => {
    console.error('❌ Activity Modal XSS test failed:', err);
    process.exit(1);
  });
}

module.exports = { runActivityModalXssTests };
