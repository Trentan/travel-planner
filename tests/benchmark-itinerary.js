// Benchmark script to measure transportLines journey lookup optimization

function runBenchmark() {
  const numJourneys = 200;
  const numDays = 30;

  // Build mock journeys array
  const journeys = [];
  for (let i = 0; i < numJourneys; i++) {
    const journeyId = 'jid_' + (i % 40);
    journeys.push({
      id: 'seg_' + i,
      journeyId: journeyId,
      segmentOrder: i % 3,
      provider: 'Airline ' + i,
      fromLocation: 'City A',
      toLocation: 'City B'
    });
  }

  // Build mock dayJourneys
  const dayJourneys = [];
  for (let i = 0; i < numDays * 3; i++) {
    dayJourneys.push(journeys[i % journeys.length]);
  }

  const RUNS = 1000;

  // 1. Baseline implementation: (window.journeys || []).filter(...).sort(...)
  const startBase = process.hrtime.bigint();
  for (let run = 0; run < RUNS; run++) {
    const transportLines = dayJourneys.map(j => {
      const gid = j.journeyId || j.id;
      const segs = (journeys || [])
        .filter(seg => seg.journeyId === j.journeyId)
        .sort((a, b) => (a.segmentOrder || 1) - (b.segmentOrder || 1));
      return segs.length;
    });
  }
  const endBase = process.hrtime.bigint();
  const baseMs = Number(endBase - startBase) / 1e6;

  // 2. Optimized implementation: Map lookup using journeysByJourneyId
  const startOpt = process.hrtime.bigint();
  for (let run = 0; run < RUNS; run++) {
    // Pre-grouping step (performed once per build CompactItineraryLegacy pass)
    const journeysByJourneyId = new Map();
    journeys.forEach(seg => {
      if (seg && seg.journeyId) {
        if (!journeysByJourneyId.has(seg.journeyId)) {
          journeysByJourneyId.set(seg.journeyId, []);
        }
        journeysByJourneyId.get(seg.journeyId).push(seg);
      }
    });
    journeysByJourneyId.forEach(list => {
      list.sort((a, b) => (a.segmentOrder || 1) - (b.segmentOrder || 1));
    });

    const transportLines = dayJourneys.map(j => {
      const segs = (j.journeyId && journeysByJourneyId.get(j.journeyId)) || [];
      return segs.length;
    });
  }
  const endOpt = process.hrtime.bigint();
  const optMs = Number(endOpt - startOpt) / 1e6;

  console.log(`=== Benchmark Results (${RUNS} iterations, ${numJourneys} journeys, ${dayJourneys.length} dayJourneys) ===`);
  console.log(`Baseline (Repeated filter/sort):  ${baseMs.toFixed(2)} ms`);
  console.log(`Optimized (Pre-grouped Map):      ${optMs.toFixed(2)} ms`);
  console.log(`Speedup:                          ${(baseMs / optMs).toFixed(2)}x faster`);
}

runBenchmark();
