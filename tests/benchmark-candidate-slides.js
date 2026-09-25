const fs = require('fs');
const path = require('path');

// Setup mock DOM environment similar to tests/desktop-split-print.test.js
function createMockElement(id, tagName = 'DIV', className = '') {
  const children = [];
  const el = {
    id,
    tagName: tagName.toUpperCase(),
    className,
    classList: {
      classes: new Set(className.split(' ').filter(Boolean)),
      add(c) { this.classes.add(c); el.className = Array.from(this.classes).join(' '); },
      remove(c) { this.classes.delete(c); el.className = Array.from(this.classes).join(' '); },
      contains(c) { return this.classes.has(c); }
    },
    attributes: {},
    setAttribute(k, v) { this.attributes[k] = String(v); },
    getAttribute(k) { return this.attributes[k] !== undefined ? this.attributes[k] : null; },
    dataset: {},
    children,
    isConnected: true,
    closest(sel) {
      if (sel.includes('.compact-desktop-leg') || sel.includes('.leg')) {
        return el._legParent || el;
      }
      return el;
    },
    querySelector(sel) {
      if (sel === '.compact-day-pager') {
        return children.find(c => c.classList.contains('compact-day-pager')) || null;
      }
      return null;
    },
    getBoundingClientRect() {
      return { top: 200, bottom: 400, height: 200, width: 300 };
    }
  };
  return el;
}

function setupBenchmarkDOM(numLegs = 20, slidesPerLeg = 5) {
  const elementsById = new Map();
  const allNodes = [];

  const header = createMockElement('splitHeader', 'DIV', 'desktop-split-right-header');
  header.getBoundingClientRect = () => ({ top: 184, height: 50, bottom: 234 });
  allNodes.push(header);

  const drawer = createMockElement('splitDrawer', 'DIV', 'desktop-split-drawer');
  drawer.getBoundingClientRect = () => ({ top: 784, height: 100, bottom: 884 });
  allNodes.push(drawer);

  const itinerary = createMockElement('itinerary', 'DIV', '');
  elementsById.set('itinerary', itinerary);
  allNodes.push(itinerary);

  const candidateSlides = [];
  const legElements = [];

  for (let l = 0; l < numLegs; l++) {
    const legEl = createMockElement(`leg-${l}`, 'DIV', 'compact-desktop-leg leg');
    legEl.dataset.legIndex = String(l);
    legEl.getBoundingClientRect = () => ({ top: l * 300 + 100, bottom: l * 300 + 400, height: 300 });
    legElements.push(legEl);
    allNodes.push(legEl);

    const pager = createMockElement(`pager-${l}`, 'DIV', 'compact-day-pager');
    pager.dataset.activeIndex = '0';
    legEl.children.push(pager);

    for (let d = 0; d < slidesPerLeg; d++) {
      const slideEl = createMockElement(`slide-${l}-${d}`, 'DIV', 'compact-day-slide is-active open day-card');
      slideEl.dataset.legIndex = String(l);
      slideEl.dataset.dayIndex = String(d);
      slideEl._legParent = legEl;
      slideEl.getBoundingClientRect = () => ({ top: l * 300 + d * 50 + 100, bottom: l * 300 + d * 50 + 200, height: 100, width: 300 });
      candidateSlides.push(slideEl);
      allNodes.push(slideEl);
    }
  }

  global.document = {
    body: createMockElement('body', 'BODY'),
    getElementById: id => elementsById.get(id) || null,
    querySelector: (sel) => {
      if (sel === '.desktop-split-right-header') return header;
      if (sel === '.desktop-split-drawer') return drawer;
      return null;
    },
    querySelectorAll: (sel) => {
      if (sel.includes('.compact-day-slide') || sel.includes('.day-card')) {
        return candidateSlides;
      }
      if (sel.includes('.compact-desktop-leg') || sel.includes('.leg')) {
        return legElements;
      }
      return [];
    },
    addEventListener: () => {}
  };

  global.window = {
    innerHeight: 1000,
    innerWidth: 1200,
    addEventListener: () => {},
    matchMedia: () => ({ matches: false, addEventListener: () => {} })
  };

  global.appData = Array.from({ length: numLegs }, (_, l) => ({
    id: `leg-${l}`,
    days: Array.from({ length: slidesPerLeg }, (_, d) => ({ id: `day-${l}-${d}` }))
  }));
}

function runBenchmark(iterations = 100000) {
  setupBenchmarkDOM(20, 5); // 100 candidate slides, 20 legs

  const uiJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'ui.js'), 'utf8');
  (0, eval)(uiJs);

  // Warmup
  for (let i = 0; i < 1000; i++) {
    findDesktopDayFromScrollPosition();
  }

  const start = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) {
    findDesktopDayFromScrollPosition();
  }
  const end = process.hrtime.bigint();

  const durationMs = Number(end - start) / 1e6;
  const opsPerSec = Math.round((iterations / (durationMs / 1000)));

  console.log(`Executed ${iterations} calls to findDesktopDayFromScrollPosition in ${durationMs.toFixed(2)} ms (${opsPerSec.toLocaleString()} ops/sec)`);
  return { durationMs, opsPerSec, iterations };
}

if (require.main === module) {
  runBenchmark();
}

module.exports = { runBenchmark, setupBenchmarkDOM };
