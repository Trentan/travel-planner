const path = require('path');
const { performance } = require('perf_hooks');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function runMapJourneyMatchingBenchmark() {
  console.log('Running map journey matching unit & benchmark tests...');

  const mapJs = loadSource(path.join('js', 'map.js'));
  const dummyEl = {
    addEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    getAttribute: () => null
  };
  const win = {
    addEventListener: () => {},
    document: {
      addEventListener: () => {},
      getElementById: () => dummyEl,
      querySelector: () => null,
      querySelectorAll: () => [],
      documentElement: dummyEl
    }
  };
  win.window = win;
  const vmContext = createVmContext({
    window: win,
    document: win.document,
    addEventListener: () => {},
    appData: [],
    journeys: [],
    stays: [],
    citiesData: []
  });
  vmContext.window = vmContext;
  runScriptInContext(mapJs, vmContext, 'js/map.js');

  const getMapCityKey = vmContext.getMapCityKey;
  assert(typeof getMapCityKey === 'function', 'getMapCityKey should be exported on context');

  // Generate synthetic dataset: 100 travel sequence stops, 200 journeys
  const travelSequence = [];
  for (let i = 0; i < 100; i++) {
    travelSequence.push({
      id: `city-${i}`,
      name: `City ${i}`,
      score: i * 10,
      isTransit: false,
      color: '#3498DB'
    });
  }

  const journeys = [];
  for (let i = 0; i < 200; i++) {
    const fromIdx = i % 99;
    const toIdx = (fromIdx + 1) % 100;
    journeys.push({
      id: `journey-${i}`,
      fromLocation: `City ${fromIdx}`,
      toLocation: `City ${toIdx}`,
      fromCityId: `city-${fromIdx}`,
      toCityId: `city-${toIdx}`,
      transportType: 'flight',
      provider: `Airline ${i}`
    });
  }

  // Define linear find (baseline)
  function findJourneyLinear(fromStop, toStop, journeysList) {
    if (!journeysList || !Array.isArray(journeysList)) return null;
    return journeysList.find(j => {
      const jFrom = getMapCityKey(j.fromLocation || j.from);
      const jTo = getMapCityKey(j.toLocation || j.to);
      const sFrom = getMapCityKey(fromStop.name);
      const sTo = getMapCityKey(toStop.name);
      return (jFrom === sFrom && jTo === sTo) ||
             (j.fromCityId && j.toCityId && j.fromCityId === fromStop.id && j.toCityId === toStop.id);
    }) || null;
  }

  // Define O(1) Map pre-built lookup
  function buildJourneysMap(journeysList) {
    const map = new Map();
    if (!journeysList || !Array.isArray(journeysList)) return map;
    for (const j of journeysList) {
      if (!j) continue;
      const jFromKey = getMapCityKey(j.fromLocation || j.from);
      const jToKey = getMapCityKey(j.toLocation || j.to);
      if (jFromKey && jToKey) {
        const nameKey = `${jFromKey}->${jToKey}`;
        if (!map.has(nameKey)) map.set(nameKey, j);
      }
      if (j.fromCityId && j.toCityId) {
        const idKey = `${j.fromCityId}->${j.toCityId}`;
        if (!map.has(idKey)) map.set(idKey, j);
      }
    }
    return map;
  }

  function findJourneyMap(fromStop, toStop, journeysMap) {
    if (!journeysMap) return null;
    const sFromKey = getMapCityKey(fromStop.name);
    const sToKey = getMapCityKey(toStop.name);
    if (sFromKey && sToKey) {
      const nameKey = `${sFromKey}->${sToKey}`;
      const found = journeysMap.get(nameKey);
      if (found) return found;
    }
    if (fromStop.id && toStop.id) {
      const idKey = `${fromStop.id}->${toStop.id}`;
      const found = journeysMap.get(idKey);
      if (found) return found;
    }
    return null;
  }

  // Verify accuracy between both strategies
  const journeysMap = buildJourneysMap(journeys);
  for (let i = 0; i < travelSequence.length - 1; i++) {
    const fromStop = travelSequence[i];
    const toStop = travelSequence[i + 1];
    const linearResult = findJourneyLinear(fromStop, toStop, journeys);
    const mapResult = findJourneyMap(fromStop, toStop, journeysMap);
    assert(linearResult === mapResult, `Match mismatch at step ${i}: linear=${linearResult?.id}, map=${mapResult?.id}`);
  }

  // Performance benchmark
  const iterations = 2000;

  const startLinear = performance.now();
  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < travelSequence.length - 1; i++) {
      findJourneyLinear(travelSequence[i], travelSequence[i + 1], journeys);
    }
  }
  const timeLinear = performance.now() - startLinear;

  const startMap = performance.now();
  for (let iter = 0; iter < iterations; iter++) {
    const jMap = buildJourneysMap(journeys);
    for (let i = 0; i < travelSequence.length - 1; i++) {
      findJourneyMap(travelSequence[i], travelSequence[i + 1], jMap);
    }
  }
  const timeMap = performance.now() - startMap;

  const speedup = ((timeLinear - timeMap) / timeLinear) * 100;
  console.log(`  Linear Array.find loop time: ${timeLinear.toFixed(2)} ms`);
  console.log(`  Map Pre-indexed lookup time:  ${timeMap.toFixed(2)} ms`);
  console.log(`  Performance boost:           ${speedup.toFixed(2)}% faster (${(timeLinear / timeMap).toFixed(2)}x)`);

  console.log('✅ map journey matching unit & benchmark tests passed cleanly!');
}

if (require.main === module) {
  runMapJourneyMatchingBenchmark();
}

module.exports = { runMapJourneyMatchingBenchmark };
