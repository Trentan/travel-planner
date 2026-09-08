/* ==========================================================================
   BENCHMARK: Itinerary Journey Lookup Optimization (tests/benchmark-itinerary.js)
   ========================================================================== */

const { performance } = require('perf_hooks');

// Generate synthetic test dataset: 50 legs, 250 days, 500 journey segments
function generateSyntheticTripData() {
  const journeys = [];
  const appData = [];

  let journeyCount = 0;
  for (let l = 0; l < 50; l++) {
    const leg = {
      id: `leg-${l}`,
      label: `City ${l}`,
      colour: '#3b82f6',
      days: []
    };

    for (let d = 0; d < 5; d++) {
      const dayDate = `2026-06-${String(d + 1).padStart(2, '0')}`;
      const day = {
        day: `Day ${d + 1}`,
        date: dayDate,
        from: `City ${l}`,
        to: `City ${l}`,
        desc: `Activities for Day ${d + 1}`,
        activityItems: []
      };

      // Add 2 journeys per day
      for (let j = 0; j < 2; j++) {
        journeyCount++;
        const journeyId = `jid_${l}_${d}_${j}`;

        // Add 2-3 segments per journey
        for (let segIdx = 0; segIdx < 2; segIdx++) {
          journeys.push({
            id: `seg_${journeyId}_${segIdx}`,
            journeyId: journeyId,
            segmentOrder: segIdx + 1,
            transportType: segIdx === 0 ? 'flight' : 'bus',
            provider: `Provider ${segIdx}`,
            fromLocation: `Location A${segIdx}`,
            toLocation: `Location B${segIdx}`,
            departureDate: dayDate,
            departureTime: '10:00',
            arrivalDate: dayDate,
            arrivalTime: '12:00',
            legId: leg.id
          });
        }
      }

      leg.days.push(day);
    }
    appData.push(leg);
  }

  return { appData, journeys };
}

// Function to simulate getDayJourneys (retrieving journeys for a given date)
function getDayJourneys(date, from, to, legId, journeys) {
  return journeys.filter(j => j.departureDate === date || j.dayDate === date);
}

// Baseline implementation (unoptimized array filter & sort per journey)
function benchmarkUnoptimized(appData, journeys, iterations = 5) {
  const start = performance.now();

  for (let iter = 0; iter < iterations; iter++) {
    let lineCount = 0;
    appData.forEach(leg => {
      leg.days.forEach(day => {
        const dayJourneys = getDayJourneys(day.date, day.from, day.to, leg.id, journeys);
        dayJourneys.forEach(j => {
          // Unoptimized lookup: filter and sort window.journeys repeatedly
          const segs = journeys
            .filter(seg => seg.journeyId === j.journeyId)
            .sort((a, b) => (a.segmentOrder || 1) - (b.segmentOrder || 1));
          lineCount += segs.length;
        });
      });
    });
  }

  const duration = performance.now() - start;
  return duration / iterations;
}

// Optimized implementation (pre-grouping into Map with O(1) lookup)
function benchmarkOptimized(appData, journeys, iterations = 5) {
  const start = performance.now();

  for (let iter = 0; iter < iterations; iter++) {
    let lineCount = 0;

    // O(N) pre-grouping into Map
    const byJourneyId = new Map();
    for (let i = 0; i < journeys.length; i++) {
      const seg = journeys[i];
      if (seg && seg.journeyId) {
        let list = byJourneyId.get(seg.journeyId);
        if (!list) {
          list = [];
          byJourneyId.set(seg.journeyId, list);
        }
        list.push(seg);
      }
    }
    byJourneyId.forEach(list => {
      list.sort((a, b) => (a.segmentOrder || 1) - (b.segmentOrder || 1));
    });

    appData.forEach(leg => {
      leg.days.forEach(day => {
        const dayJourneys = getDayJourneys(day.date, day.from, day.to, leg.id, journeys);
        dayJourneys.forEach(j => {
          // Optimized O(1) lookup
          const segs = (j.journeyId && byJourneyId.get(j.journeyId)) || [];
          lineCount += segs.length;
        });
      });
    });
  }

  const duration = performance.now() - start;
  return duration / iterations;
}

function runBenchmark() {
  const { appData, journeys } = generateSyntheticTripData();
  console.log(`Generated synthetic dataset: ${appData.length} legs, ${journeys.length} segments.`);

  // Warmup
  benchmarkUnoptimized(appData, journeys, 1);
  benchmarkOptimized(appData, journeys, 1);

  const baselineMs = benchmarkUnoptimized(appData, journeys, 20);
  const optimizedMs = benchmarkOptimized(appData, journeys, 20);
  const speedup = baselineMs / (optimizedMs || 0.001);
  const percentImprovement = (((baselineMs - optimizedMs) / baselineMs) * 100).toFixed(2);

  console.log('--- BENCHMARK RESULTS ---');
  console.log(`Baseline (O(N) Filter & Sort per journey): ${baselineMs.toFixed(3)} ms`);
  console.log(`Optimized (O(1) Map Lookup):                ${optimizedMs.toFixed(3)} ms`);
  console.log(`Speedup:                                   ${speedup.toFixed(2)}x faster`);
  console.log(`Time Reduction:                            ${percentImprovement}%`);
}

if (require.main === module) {
  runBenchmark();
}

module.exports = { runBenchmark, generateSyntheticTripData, benchmarkUnoptimized, benchmarkOptimized };
