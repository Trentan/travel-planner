const { performance } = require('perf_hooks');

// Mock browser globals if needed by js/data.js
global.window = global;
global.window.addEventListener = () => {};
global.document = {
  getElementById: () => null,
  addEventListener: () => {}
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

const fs = require('fs');
const path = require('path');

// Load js/data.js code or evaluate it in VM / Node scope
const dataJsPath = path.join(__dirname, '../js/data.js');
const dataJsCode = fs.readFileSync(dataJsPath, 'utf8');

// Evaluate in global scope so functions like normalizeTripLegsData become available
eval(dataJsCode);

function generateBenchmarkDataset() {
  const legs = [];
  for (let l = 0; l < 10; l++) {
    const suggested = [];
    for (let a = 0; a < 100; a++) {
      suggested.push({
        id: `act-leg${l}-${a}`,
        title: `Activity ${a} Location ${a % 5}`,
        category: 'sight',
        estTime: '1.5 hrs',
        estCost: '10',
        assignedDayIdx: a % 2 === 0 ? Math.floor(a / 10) % 5 : null,
        notes: `Note for act ${a}`
      });
    }

    const days = [];
    for (let d = 0; d < 5; d++) {
      const activityItems = [];
      for (let itemIdx = 0; itemIdx < 20; itemIdx++) {
        // Some items match by ID, some by title assigned to this day, some unassigned, some assigned to other day, some new
        const actNum = (d * 20 + itemIdx) % 120;
        const hasId = itemIdx % 3 === 0 && actNum < 100;
        activityItems.push({
          activityId: hasId ? `act-leg${l}-${actNum}` : undefined,
          text: `Activity ${actNum} Location ${actNum % 5}`,
          startTime: '10:00',
          endTime: '12:00',
          cost: '10'
        });
      }
      days.push({
        date: `2026-06-0${d + 1}`,
        activityItems
      });
    }

    legs.push({
      id: `leg-${l}`,
      label: `Leg ${l}`,
      suggestedActivities: suggested,
      days
    });
  }
  return legs;
}

function runBenchmark() {
  const testData = generateBenchmarkDataset();

  // Warmup
  for (let i = 0; i < 5; i++) {
    normalizeTripLegsData(JSON.parse(JSON.stringify(testData)));
  }

  const iterations = 50;
  const startTime = performance.now();
  for (let i = 0; i < iterations; i++) {
    normalizeTripLegsData(JSON.parse(JSON.stringify(testData)));
  }
  const endTime = performance.now();

  const totalMs = endTime - startTime;
  const avgMs = totalMs / iterations;
  console.log(`Benchmark completed: ${iterations} iterations in ${totalMs.toFixed(2)}ms (avg: ${avgMs.toFixed(3)}ms/iter)`);
  return { totalMs, avgMs };
}

if (require.main === module) {
  runBenchmark();
}

module.exports = { runBenchmark };
