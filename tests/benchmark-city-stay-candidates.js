const path = require('path');
const { performance } = require('perf_hooks');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function runCityStayCandidatesBenchmarkTests() {
  console.log('Running getCityStayCandidates unit & benchmark tests...');

  const itineraryJs = loadSource(path.join('js', 'itinerary.js'));
  const win = { addEventListener: () => {}, innerWidth: 1024, currentCityFilter: 'all' };
  win.window = win;

  // Mock data
  const mockCities = [];
  for (let i = 0; i < 100; i++) {
    mockCities.push({ id: `city-${i}`, name: `City ${i}`, country: 'Country' });
  }

  const mockStays = [];
  for (let i = 0; i < 200; i++) {
    const cityIndex = (i * 7) % 100;
    mockStays.push({
      id: `stay-${i}`,
      cityId: `city-${cityIndex}`,
      checkIn: '2026-06-01',
      checkOut: '2026-06-05',
      nights: 4
    });
  }

  const mockAppData = [
    {
      id: 'leg-1',
      label: 'City 0',
      days: [
        { date: '2026-06-01', day: 'Mon', from: 'City 0', to: 'City 0' },
        { date: '2026-06-02', day: 'Tue', from: 'City 0', to: 'City 0' }
      ]
    }
  ];

  const vmContext = createVmContext({
    window: win,
    addEventListener: () => {},
    removeEventListener: () => {},
    appData: mockAppData,
    journeys: [],
    stays: mockStays,
    citiesData: mockCities,
    titleData: {},
    isEditMode: false,
    formatCurrency: (val) => `$${val}`,
    escapeHtmlText: (str) => str
  });
  vmContext.window = vmContext;
  runScriptInContext(itineraryJs, vmContext, 'js/itinerary.js');

  const getCityStayCandidates = vmContext.getCityStayCandidates;
  assert(typeof getCityStayCandidates === 'function', 'getCityStayCandidates should be exported on context');

  // 1. Correctness checks
  const candidates = getCityStayCandidates();
  assert(Array.isArray(candidates), 'Candidates should be an array');
  assert(candidates.length === mockStays.length + 1, `Expected ${mockStays.length + 1} candidates, got ${candidates.length}`);
  assert(candidates[0].cityName === 'City 0', `First candidate cityName should be 'City 0', got '${candidates[0].cityName}'`);
  assert(candidates[0].weight === 1004, `First candidate stay weight should be 1004, got ${candidates[0].weight}`);

  // Test unmapped city fallback
  vmContext.stays = [{ id: 'stay-unmapped', cityId: 'unknown-city', checkIn: '2026-06-01', checkOut: '2026-06-02' }];
  vmContext.appData = [];
  const emptyCandidates = getCityStayCandidates();
  assert(emptyCandidates.length === 0, 'Unmapped cityId with no city name should yield 0 candidates');

  // Test explicit stay.city override
  vmContext.stays = [{ id: 'stay-explicit', city: 'Custom City', checkIn: '2026-06-01', checkOut: '2026-06-02' }];
  const customCandidates = getCityStayCandidates();
  assert(customCandidates.length === 1, 'Explicit stay.city candidate should be present');
  assert(customCandidates[0].cityName === 'Custom City', 'Explicit candidate name should match');

  // Reset mock data for benchmark
  vmContext.stays = mockStays;
  vmContext.appData = mockAppData;

  // Define unoptimized version inside vmContext for benchmark comparison
  runScriptInContext(`
    function unoptimizedGetCityStayCandidates() {
      const candidates = [];
      if (Array.isArray(stays)) {
        stays.forEach(stay => {
          const cityName = stay.city || getCityNameForNavId(stay.cityId);
          if (!cityName) return;
          const startScore = getTimelineScore(stay.checkIn, '', Number.MAX_SAFE_INTEGER);
          const endScore = getTimelineScore(stay.checkOut, '', startScore);
          const nights = Number(stay.nights) || Math.max(1, Math.round((endScore - startScore) / 1440)) || 1;
          candidates.push({
            cityName,
            score: startScore,
            weight: 1000 + nights,
            sourceRank: 0
          });
        });
      }
      if (Array.isArray(appData)) {
        appData.forEach((leg, legIndex) => {
          let activeCity = '';
          let activeStartScore = 0;
          let activeCount = 0;
          const flush = () => {
            if (!activeCity) return;
            candidates.push({
              cityName: activeCity,
              score: activeStartScore,
              weight: 1,
              sourceRank: 1
            });
          };
          (leg.days || []).forEach((day, dayIndex) => {
            const sameCityStay = day.from && day.to && day.from === day.to && !shouldSkipCityNavName(day.to);
            const dayScore = getTimelineScore(day.date, '', getLegDateScore(leg, legIndex) + dayIndex * 10);
            if (!sameCityStay) {
              flush();
              activeCity = '';
              activeCount = 0;
              return;
            }
            if (activeCity.toLowerCase() !== day.to.toLowerCase()) {
              flush();
              activeCity = day.to;
              activeStartScore = dayScore;
              activeCount = 1;
            } else {
              activeCount++;
            }
          });
          flush();
        });
      }
      return candidates;
    }
  `, vmContext, 'unoptimized-test');

  const unoptimizedGetCandidates = vmContext.unoptimizedGetCityStayCandidates;

  const iterations = 5000;

  const startUnopt = performance.now();
  for (let i = 0; i < iterations; i++) {
    unoptimizedGetCandidates();
  }
  const timeUnopt = performance.now() - startUnopt;

  const startOpt = performance.now();
  for (let i = 0; i < iterations; i++) {
    getCityStayCandidates();
  }
  const timeOpt = performance.now() - startOpt;

  const speedup = ((timeUnopt - timeOpt) / timeUnopt) * 100;
  console.log(`  Linear search time:  ${timeUnopt.toFixed(2)} ms`);
  console.log(`  Map hash lookup time: ${timeOpt.toFixed(2)} ms`);
  console.log(`  Performance boost:    ${speedup.toFixed(2)}% faster (${(timeUnopt / timeOpt).toFixed(2)}x)`);

  console.log('✅ getCityStayCandidates unit & benchmark tests passed cleanly!');
}

if (require.main === module) {
  runCityStayCandidatesBenchmarkTests();
}

module.exports = { runCityStayCandidatesBenchmarkTests };
