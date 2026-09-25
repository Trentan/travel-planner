const { createBrowserHarness, loadAppScripts } = require('./lib/browser-harness');

function setupBenchmarkEnvironment() {
  const harness = createBrowserHarness();
  loadAppScripts(harness);

  const doc = harness.document;

  // Create a realistic DOM with many non-target elements
  const container = doc.getElementById('legReorderList');
  container.innerHTML = '';

  const items = [];
  for (let i = 0; i < 6; i++) {
    const item = doc.createElement('div');
    item.className = 'leg-reorder-item dragging drag-over';
    item.setAttribute('data-leg-index', String(i));
    container.appendChild(item);
    items.push(item);
  }

  // Populate document body with many other elements to simulate full trip document
  for (let i = 0; i < 500; i++) {
    const el = doc.createElement('div');
    el.className = `day-card item-${i}`;
    el.innerHTML = `<span>Day ${i}</span><button class="btn">Edit</button>`;
    doc.body.appendChild(el);
  }

  return { harness, container, items };
}

function runBenchmark(iterations = 20000) {
  const { harness, items } = setupBenchmarkEnvironment();
  const handleLegDragEnd = harness.window.handleLegDragEnd;

  // Warmup
  for (let i = 0; i < 500; i++) {
    const targetItem = items[i % items.length];
    targetItem.classList.add('dragging', 'drag-over');
    const mockEvent = { currentTarget: targetItem };
    handleLegDragEnd(mockEvent);
  }

  const start = process.hrtime.bigint();
  for (let i = 0; i < iterations; i++) {
    const targetItem = items[i % items.length];
    targetItem.classList.add('dragging', 'drag-over');
    const mockEvent = { currentTarget: targetItem };
    handleLegDragEnd(mockEvent);
  }
  const end = process.hrtime.bigint();

  const durationMs = Number(end - start) / 1e6;
  const opsPerSec = (iterations / (durationMs / 1000)).toFixed(2);

  console.log(`[Benchmark] handleLegDragEnd executed ${iterations} iterations in ${durationMs.toFixed(2)} ms (${opsPerSec} ops/sec)`);
  return { durationMs, opsPerSec, iterations };
}

if (require.main === module) {
  runBenchmark();
}

module.exports = { runBenchmark };
