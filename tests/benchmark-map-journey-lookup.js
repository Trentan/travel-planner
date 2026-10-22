const { performance } = require('perf_hooks');

function getMapCityKey(cityName) {
  return String(cityName || '').trim().toLowerCase();
}

// Baseline implementation (N+1 query in loop)
function drawPolylinesBaseline(travelSequence, journeys) {
  const matches = [];
  if (typeof journeys === 'undefined' || !Array.isArray(journeys)) return matches;

  for (let i = 0; i < travelSequence.length - 1; i++) {
    const fromStop = travelSequence[i];
    const toStop = travelSequence[i + 1];

    let matchedJourney = journeys.find(j => {
      const jFrom = getMapCityKey(j.fromLocation || j.from);
      const jTo = getMapCityKey(j.toLocation || j.to);
      const sFrom = getMapCityKey(fromStop.name);
      const sTo = getMapCityKey(toStop.name);
      return (jFrom === sFrom && jTo === sTo) ||
             (j.fromCityId && j.toCityId && j.fromCityId === fromStop.id && j.toCityId === toStop.id);
    });
    matches.push(matchedJourney);
  }
  return matches;
}

// Helper functions for O(1) hash map lookup
function buildJourneyLookupMap(journeyList) {
  if (!Array.isArray(journeyList) || journeyList.length === 0) {
    return { nameMap: null, idMap: null };
  }

  const nameMap = new Map();
  const idMap = new Map();

  for (let i = 0; i < journeyList.length; i++) {
    const j = journeyList[i];
    if (!j) continue;
    const jFrom = getMapCityKey(j.fromLocation || j.from);
    const jTo = getMapCityKey(j.toLocation || j.to);
    if (jFrom && jTo) {
      const nameKey = jFrom + '|' + jTo;
      if (!nameMap.has(nameKey)) {
        nameMap.set(nameKey, { journey: j, index: i });
      }
    }
    if (j.fromCityId && j.toCityId) {
      const idKey = j.fromCityId + '|' + j.toCityId;
      if (!idMap.has(idKey)) {
        idMap.set(idKey, { journey: j, index: i });
      }
    }
  }

  return { nameMap, idMap };
}

function findMatchedJourneyInMap(fromStop, toStop, nameMap, idMap) {
  if (!nameMap && !idMap) return null;
  const sFrom = getMapCityKey(fromStop ? fromStop.name : '');
  const sTo = getMapCityKey(toStop ? toStop.name : '');
  const nameKey = (sFrom && sTo) ? (sFrom + '|' + sTo) : null;
  const idKey = (fromStop && toStop && fromStop.id && toStop.id) ? (fromStop.id + '|' + toStop.id) : null;

  const matchByName = (nameKey && nameMap) ? nameMap.get(nameKey) : null;
  const matchById = (idKey && idMap) ? idMap.get(idKey) : null;

  if (matchByName && matchById) {
    return matchByName.index <= matchById.index ? matchByName.journey : matchById.journey;
  }
  if (matchByName) return matchByName.journey;
  if (matchById) return matchById.journey;
  return null;
}

// Optimized implementation using O(1) hash map lookup
function drawPolylinesOptimized(travelSequence, journeys) {
  const matches = [];
  if (typeof journeys === 'undefined' || !Array.isArray(journeys)) return matches;

  const { nameMap, idMap } = buildJourneyLookupMap(journeys);

  for (let i = 0; i < travelSequence.length - 1; i++) {
    const fromStop = travelSequence[i];
    const toStop = travelSequence[i + 1];

    const matchedJourney = findMatchedJourneyInMap(fromStop, toStop, nameMap, idMap);
    matches.push(matchedJourney);
  }
  return matches;
}

function generateTestData(numStops = 50, numJourneys = 200) {
  const cities = [];
  for (let c = 0; c < numStops; c++) {
    cities.push({ id: `city-${c}`, name: `City ${c}` });
  }

  const travelSequence = [];
  for (let s = 0; s < numStops; s++) {
    travelSequence.push(cities[s % cities.length]);
  }

  const journeys = [];
  for (let j = 0; j < numJourneys; j++) {
    const fromCity = cities[j % (cities.length - 1)];
    const toCity = cities[(j + 1) % cities.length];
    journeys.push({
      id: `journey-${j}`,
      transportType: j % 2 === 0 ? 'flight' : 'train',
      fromLocation: fromCity.name,
      toLocation: toCity.name,
      fromCityId: fromCity.id,
      toCityId: toCity.id
    });
  }

  return { travelSequence, journeys };
}

function runBenchmark() {
  const testCases = [
    { stops: 10, journeys: 20 },
    { stops: 30, journeys: 100 },
    { stops: 50, journeys: 200 },
    { stops: 100, journeys: 500 }
  ];

  const iterations = 50000;

  for (const tc of testCases) {
    const { travelSequence, journeys } = generateTestData(tc.stops, tc.journeys);

    const baseRes = drawPolylinesBaseline(travelSequence, journeys);
    const optRes = drawPolylinesOptimized(travelSequence, journeys);

    if (JSON.stringify(baseRes) !== JSON.stringify(optRes)) {
      console.error(`Mismatch in test case: ${tc.stops} stops, ${tc.journeys} journeys`);
      process.exit(1);
    }

    // Warmup
    for (let i = 0; i < 500; i++) {
      drawPolylinesBaseline(travelSequence, journeys);
      drawPolylinesOptimized(travelSequence, journeys);
    }

    const startBase = performance.now();
    for (let i = 0; i < iterations; i++) {
      drawPolylinesBaseline(travelSequence, journeys);
    }
    const timeBase = performance.now() - startBase;

    const startOpt = performance.now();
    for (let i = 0; i < iterations; i++) {
      drawPolylinesOptimized(travelSequence, journeys);
    }
    const timeOpt = performance.now() - startOpt;

    const speedup = ((timeBase - timeOpt) / timeBase) * 100;
    const ratio = (timeBase / timeOpt).toFixed(2);

    console.log(`[${tc.stops} stops, ${tc.journeys} journeys - ${iterations} iterations]`);
    console.log(`  Base: ${timeBase.toFixed(2)} ms | Opt: ${timeOpt.toFixed(2)} ms | Improvement: ${speedup.toFixed(2)}% (${ratio}x speedup)`);
  }
}

runBenchmark();
