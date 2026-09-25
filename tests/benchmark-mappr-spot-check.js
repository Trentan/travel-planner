const fs = require('fs');
const path = require('path');

// Mock DOM Node class
class MockElement {
  constructor(tagName, className = '', id = '') {
    this.tagName = tagName.toUpperCase();
    this.className = className;
    this.id = id;
    this.children = [];
    this.parentNode = null;
    this.listeners = {};
    this.checked = false;
    this.textContent = '';
  }

  classList = {
    contains: (cls) => this.className.split(' ').filter(Boolean).includes(cls)
  };

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  addEventListener(type, fn) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(fn);
  }

  dispatchEvent(event) {
    event.target = event.target || this;
    if (this.listeners[event.type]) {
      this.listeners[event.type].forEach(fn => fn(event));
    }
    if (this.parentNode) {
      this.parentNode.dispatchEvent(event);
    }
  }

  querySelectorAll(selector) {
    const results = [];
    const traverse = (node) => {
      for (const child of node.children) {
        if (matches(child, selector)) results.push(child);
        traverse(child);
      }
    };
    traverse(this);
    return results;
  }
}

function matches(node, selector) {
  if (selector === '.mappr-spot-check') return node.classList.contains('mappr-spot-check');
  if (selector === '.mappr-spot-check:checked') return node.classList.contains('mappr-spot-check') && node.checked;
  return false;
}

function createMockDom(numSpots = 500) {
  const doc = new MockElement('document');
  const body = new MockElement('body');
  doc.appendChild(body);

  const tbody = new MockElement('tbody', '', 'mapprSpotsTableBody');
  body.appendChild(tbody);

  const counter = new MockElement('span', '', 'mapprSelectedCount');
  body.appendChild(counter);

  doc.getElementById = (id) => {
    if (id === 'mapprSpotsTableBody') return tbody;
    if (id === 'mapprSelectedCount') return counter;
    return null;
  };
  doc.querySelectorAll = (sel) => body.querySelectorAll(sel);

  const inputs = [];
  for (let i = 0; i < numSpots; i++) {
    const tr = new MockElement('tr');
    const td = new MockElement('td');
    const input = new MockElement('input', 'mappr-spot-check');
    input.checked = true;
    td.appendChild(input);
    tr.appendChild(td);
    tbody.appendChild(tr);
    inputs.push(input);
  }

  return { doc, tbody, counter, inputs };
}

// Baseline implementation (original code from mappr-import.js)
function baselineSetupSpotCheckListeners(document) {
  const checks = document.querySelectorAll('.mappr-spot-check');
  const counter = document.getElementById('mapprSelectedCount');
  checks.forEach(ch => {
    ch.addEventListener('change', () => {
      const count = document.querySelectorAll('.mappr-spot-check:checked').length;
      if (counter) counter.textContent = `${count} selected`;
    });
  });
}

// Optimized implementation using Event Delegation on #mapprSpotsTableBody
function optimizedSetupSpotCheckListeners(document) {
  const container = document.getElementById('mapprSpotsTableBody');
  if (container && !container._mapprSpotCheckListenerAttached) {
    container._mapprSpotCheckListenerAttached = true;
    container.addEventListener('change', (e) => {
      if (e.target && e.target.classList && e.target.classList.contains('mappr-spot-check')) {
        const counter = document.getElementById('mapprSelectedCount');
        if (counter) {
          const count = container.querySelectorAll('.mappr-spot-check:checked').length;
          counter.textContent = `${count} selected`;
        }
      }
    });
  }
}

function runBenchmark() {
  const NUM_SPOTS = 500;
  const TOGGLES = 5000;

  console.log(`--- Running Mappr Spot Check Benchmark (${NUM_SPOTS} spots, ${TOGGLES} toggles) ---`);

  // --- Baseline ---
  const baselineDom = createMockDom(NUM_SPOTS);
  const baselineStartSetup = process.hrtime.bigint();
  baselineSetupSpotCheckListeners(baselineDom.doc);
  const baselineEndSetup = process.hrtime.bigint();
  const baselineSetupMs = Number(baselineEndSetup - baselineStartSetup) / 1e6;

  const baselineStartToggle = process.hrtime.bigint();
  for (let i = 0; i < TOGGLES; i++) {
    const input = baselineDom.inputs[i % NUM_SPOTS];
    input.checked = !input.checked;
    input.dispatchEvent({ type: 'change' });
  }
  const baselineEndToggle = process.hrtime.bigint();
  const baselineToggleMs = Number(baselineEndToggle - baselineStartToggle) / 1e6;

  console.log(`Baseline Setup Time: ${baselineSetupMs.toFixed(3)} ms`);
  console.log(`Baseline Toggle Time (${TOGGLES} events): ${baselineToggleMs.toFixed(3)} ms`);

  // --- Optimized ---
  const optDom = createMockDom(NUM_SPOTS);
  const optStartSetup = process.hrtime.bigint();
  optimizedSetupSpotCheckListeners(optDom.doc);
  const optEndSetup = process.hrtime.bigint();
  const optSetupMs = Number(optEndSetup - optStartSetup) / 1e6;

  const optStartToggle = process.hrtime.bigint();
  for (let i = 0; i < TOGGLES; i++) {
    const input = optDom.inputs[i % NUM_SPOTS];
    input.checked = !input.checked;
    input.dispatchEvent({ type: 'change' });
  }
  const optEndToggle = process.hrtime.bigint();
  const optToggleMs = Number(optEndToggle - optStartToggle) / 1e6;

  console.log(`Optimized Setup Time: ${optSetupMs.toFixed(3)} ms`);
  console.log(`Optimized Toggle Time (${TOGGLES} events): ${optToggleMs.toFixed(3)} ms`);

  const setupSpeedup = (baselineSetupMs / optSetupMs).toFixed(2);
  const toggleSpeedup = (baselineToggleMs / optToggleMs).toFixed(2);
  console.log(`Setup Speedup: ${setupSpeedup}x faster`);
  console.log(`Toggle Speedup: ${toggleSpeedup}x faster`);

  return {
    baselineSetupMs,
    baselineToggleMs,
    optSetupMs,
    optToggleMs
  };
}

if (require.main === module) {
  runBenchmark();
}

module.exports = { runBenchmark };
