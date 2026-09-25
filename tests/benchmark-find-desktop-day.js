const fs = require('fs');
const path = require('path');

// Mock DOM environment for benchmarking findDesktopDayFromScrollPosition
function setupMockDom() {
  const elementsByQuery = new Map();
  let queryCount = 0;

  function createMockNode(tagName, className = '', id = '') {
    const node = {
      tagName: tagName.toUpperCase(),
      id,
      className,
      classList: {
        contains: (c) => className.split(' ').includes(c)
      },
      isConnected: true,
      getAttribute: (attr) => (attr === 'data-day-index' ? '0' : attr === 'data-leg-index' ? '0' : null),
      getBoundingClientRect: () => ({ top: 100, bottom: 300, height: 200, width: 400 }),
      closest: () => null,
      querySelector: () => null,
      querySelectorAll: () => []
    };
    return node;
  }

  const headerNode = createMockNode('div', 'desktop-split-right-header');
  headerNode.getBoundingClientRect = () => ({ top: 180, bottom: 220, height: 40, width: 400 });

  const drawerNode = createMockNode('div', 'desktop-split-drawer');
  drawerNode.getBoundingClientRect = () => ({ top: 500, bottom: 850, height: 350, width: 400 });

  const slideNode = createMockNode('div', 'compact-day-slide is-active');

  elementsByQuery.set('.desktop-split-right-header', headerNode);
  elementsByQuery.set('.desktop-split-drawer', drawerNode);

  const mockLocalStorage = {};

  global.localStorage = {
    getItem: (key) => mockLocalStorage[key] || null,
    setItem: (key, val) => { mockLocalStorage[key] = String(val); },
    removeItem: (key) => { delete mockLocalStorage[key]; }
  };

  global.document = {
    body: { classList: { toggle: () => {} } },
    documentElement: { setAttribute: () => {}, style: { setProperty: () => {} } },
    getElementById: () => null,
    querySelector: (selector) => {
      queryCount++;
      return elementsByQuery.get(selector) || null;
    },
    querySelectorAll: (selector) => {
      if (selector.includes('.compact-day-slide') || selector.includes('.day-card')) {
        return [slideNode];
      }
      if (selector.includes('.compact-desktop-leg') || selector.includes('.leg')) {
        return [];
      }
      return [];
    },
    addEventListener: () => {}
  };

  global.window = {
    innerHeight: 900,
    innerWidth: 1200,
    addEventListener: () => {},
    matchMedia: () => ({ matches: false, addEventListener: () => {} }),
    scrollY: 0
  };

  global.appData = [
    {
      id: 'leg-1',
      label: 'Paris',
      days: [{ date: '2026-06-01', day: 'Mon' }]
    }
  ];

  return {
    getQueryCount: () => queryCount,
    resetQueryCount: () => { queryCount = 0; }
  };
}

function runBenchmark(iterations = 100000) {
  const domTracker = setupMockDom();

  // Load js/ui.js
  const uiJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'ui.js'), 'utf8');
  (0, eval)(uiJs);

  // Warmup
  for (let i = 0; i < 1000; i++) {
    findDesktopDayFromScrollPosition();
  }

  domTracker.resetQueryCount();

  const start = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) {
    findDesktopDayFromScrollPosition();
  }
  const end = process.hrtime.bigint();

  const durationMs = Number(end - start) / 1e6;
  const opsPerSec = (iterations / (durationMs / 1000)).toFixed(2);
  const totalQueries = domTracker.getQueryCount();

  console.log(`Executed ${iterations} findDesktopDayFromScrollPosition calls in ${durationMs.toFixed(2)} ms (${opsPerSec} ops/sec)`);
  console.log(`Total document.querySelector calls: ${totalQueries}`);
  return { durationMs, opsPerSec, iterations, totalQueries };
}

if (require.main === module) {
  runBenchmark();
}

module.exports = { runBenchmark };
