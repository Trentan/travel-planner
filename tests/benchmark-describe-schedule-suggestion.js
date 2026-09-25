const assert = require('assert');
const { performance } = require('perf_hooks');
const { describeScheduleSuggestion } = require('../js/activity-scheduler');

function runUnitTests() {
  // Edge cases and correctness checks
  assert.strictEqual(
    describeScheduleSuggestion(null, []),
    'No clean slot found',
    'Should return "No clean slot found" for null choice'
  );

  assert.strictEqual(
    describeScheduleSuggestion({ start: 600, end: 660, windowLabel: 'open gap' }, []),
    'Best open gap',
    'Should return choice windowLabel when intervals are empty'
  );

  assert.strictEqual(
    describeScheduleSuggestion(
      { start: 600, end: 660, windowLabel: 'open gap' },
      [{ start: 480, end: 540, label: 'Breakfast' }]
    ),
    'Best opening after Breakfast',
    'Should identify previous interval'
  );

  assert.strictEqual(
    describeScheduleSuggestion(
      { start: 600, end: 660, windowLabel: 'open gap' },
      [{ start: 720, end: 780, label: 'Lunch' }]
    ),
    'Best opening before Lunch',
    'Should identify next interval'
  );

  assert.strictEqual(
    describeScheduleSuggestion(
      { start: 600, end: 660, windowLabel: 'open gap' },
      [
        { start: 480, end: 540, label: 'Breakfast' },
        { start: 720, end: 780, label: 'Lunch' }
      ]
    ),
    'Fits between Breakfast and Lunch',
    'Should identify both previous and next intervals'
  );

  assert.strictEqual(
    describeScheduleSuggestion(
      { start: 600, end: 660, windowLabel: 'open gap' },
      [
        { start: 100, end: 200, label: 'Early Event' },
        { start: 480, end: 540, label: 'Breakfast' },
        { start: 720, end: 780, label: 'Lunch' },
        { start: 900, end: 1000, label: 'Dinner' }
      ]
    ),
    'Fits between Breakfast and Lunch',
    'Should select closest previous and closest next interval'
  );

  console.log('describeScheduleSuggestion unit tests passed!');
}

function runBenchmark(iterations = 200000) {
  const choice = { start: 600, end: 660, windowLabel: 'open gap' };
  const intervals = [];
  for (let i = 0; i < 50; i++) {
    intervals.push({ start: i * 10, end: i * 10 + 8, label: `Interval ${i}` });
  }

  // Warmup
  for (let i = 0; i < 1000; i++) {
    describeScheduleSuggestion(choice, intervals);
  }

  const startTime = performance.now();
  for (let i = 0; i < iterations; i++) {
    describeScheduleSuggestion(choice, intervals);
  }
  const endTime = performance.now();

  const totalMs = endTime - startTime;
  const avgMs = (totalMs / iterations) * 1000; // microseconds per iteration
  console.log(`Benchmark completed: ${iterations} iterations in ${totalMs.toFixed(2)}ms (${avgMs.toFixed(3)}µs/iter)`);
  return { iterations, totalMs, avgMs };
}

if (require.main === module) {
  runUnitTests();
  runBenchmark();
}

module.exports = { runUnitTests, runBenchmark };
