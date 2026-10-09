const { performance } = require('perf_hooks');
const assert = require('assert');

function runArrayFindMerge(oldDays, newDays, dayNotes) {
  const targetDays = newDays.map(d => ({ ...d }));
  targetDays.forEach(newDay => {
    const oldDay = oldDays.find(od => od.date === newDay.date);
    if (oldDay) {
      if (oldDay.title) newDay.title = oldDay.title;
      if (oldDay.accomItems) newDay.accomItems = oldDay.accomItems;
      if (oldDay.activityItems) newDay.activityItems = oldDay.activityItems;
      if (oldDay.transportItems) newDay.transportItems = oldDay.transportItems;
      if (oldDay.notes) newDay.notes = oldDay.notes;
      if (typeof oldDay.completed !== 'undefined') newDay.completed = oldDay.completed;
      if (oldDay.desc && (!dayNotes || dayNotes.length === 0)) newDay.desc = oldDay.desc;
    }
  });
  return targetDays;
}

function runMapMerge(oldDays, newDays, dayNotes) {
  const targetDays = newDays.map(d => ({ ...d }));
  const oldDaysByDate = new Map();
  oldDays.forEach(od => {
    if (od && od.date) {
      oldDaysByDate.set(od.date, od);
    }
  });

  targetDays.forEach(newDay => {
    const oldDay = oldDaysByDate.get(newDay.date);
    if (oldDay) {
      if (oldDay.title) newDay.title = oldDay.title;
      if (oldDay.accomItems) newDay.accomItems = oldDay.accomItems;
      if (oldDay.activityItems) newDay.activityItems = oldDay.activityItems;
      if (oldDay.transportItems) newDay.transportItems = oldDay.transportItems;
      if (oldDay.notes) newDay.notes = oldDay.notes;
      if (typeof oldDay.completed !== 'undefined') newDay.completed = oldDay.completed;
      if (oldDay.desc && (!dayNotes || dayNotes.length === 0)) newDay.desc = oldDay.desc;
    }
  });
  return targetDays;
}

function main() {
  console.log('⚡ Running Leg Dialog Day Merge Performance Benchmark...');

  // Build dataset
  const daysCount = 300;
  const oldDays = [];
  const dayNotes = [];

  for (let i = 0; i < daysCount; i++) {
    const d = new Date(2025, 0, 1 + i).toISOString().split('T')[0];
    oldDays.push({
      date: d,
      title: 'Day ' + (i + 1),
      accomItems: [{ id: 'acc-' + i, title: 'Hotel ' + i }],
      activityItems: [{ id: 'act-' + i, title: 'Sightseeing ' + i }],
      transportItems: [{ id: 'trn-' + i, type: 'flight' }],
      notes: 'Day note ' + i,
      completed: true,
      desc: 'Day description ' + i
    });
  }

  const newDays = oldDays.map(d => ({ date: d.date, from: 'CityA', to: 'CityB' }));

  // Correctness check
  const resFind = runArrayFindMerge(oldDays, newDays, dayNotes);
  const resMap = runMapMerge(oldDays, newDays, dayNotes);
  assert.deepStrictEqual(resFind, resMap, 'Map merge output does not match Array.find merge output!');
  console.log('✅ Correctness verified: Map lookup output matches Array.find output identically.');

  // Benchmark execution
  const iterations = 1000;

  const t0 = performance.now();
  for (let i = 0; i < iterations; i++) {
    runArrayFindMerge(oldDays, newDays, dayNotes);
  }
  const t1 = performance.now();
  const findTimeMs = t1 - t0;

  const t2 = performance.now();
  for (let i = 0; i < iterations; i++) {
    runMapMerge(oldDays, newDays, dayNotes);
  }
  const t3 = performance.now();
  const mapTimeMs = t3 - t2;

  const speedup = (findTimeMs / mapTimeMs).toFixed(2);

  console.log(`📊 Benchmark Results (${iterations} iterations, ${daysCount} days/leg):`);
  console.log(`   • Baseline (Array.find O(N^2)): ${findTimeMs.toFixed(2)} ms`);
  console.log(`   • Optimized (Map O(N)):        ${mapTimeMs.toFixed(2)} ms`);
  console.log(`   • Speedup over baseline:       ${speedup}x faster`);
}

main();
