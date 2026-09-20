const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { createVmContext, runScriptInContext, loadSource } = require('./lib/test-helpers');

function runTripDayMetricsTests() {
  console.log('Testing Issue #417: Trip Day Metrics & Itinerary Cumulative Day Indicators...');

  const testTripPath = path.resolve(__dirname, '../backups/2026_June_July_Europe_Thailand.json');
  const backupJson = JSON.parse(fs.readFileSync(testTripPath, 'utf8'));
  const sampleItinerary = backupJson.itinerary;

  const context = createVmContext({
    window: {
      innerWidth: 1200,
      isCompactView: true,
      addEventListener: () => {},
      matchMedia: () => ({ matches: false, addEventListener: () => {} })
    },
    document: {
      body: { classList: { contains: () => false, toggle: () => {} } },
      addEventListener: () => {}
    },
    appData: sampleItinerary,
    stays: backupJson.stays || [],
    journeys: backupJson.journeys || [],
    citiesData: backupJson.cities || [],
    isEditMode: false,
    getDayJourneys: () => [],
    formatTripDateForDisplay: d => d,
    formatCurrency: c => `$${c}`,
    cleanCityNavLabel: l => String(l || '').replace(/^[^\w\s]+/, '').trim(),
    getCityFlag: () => '📍',
    getTransportIcon: () => '✈️',
    renderStatusBadge: () => '',
    renderStayingHeadingNote: () => '',
    renderMobileSurfaceCard: opts => `${opts.title} ${opts.primaryAction}`,
    getCompactDaySlideId: (legId, dayIdx) => `slide-${legId}-${dayIdx}`,
    getJourneysGroupedByJourneyId: () => new Map(),
    getLegNightSummary: leg => ({ label: `${leg.days?.length || 0} Nights`, isTransit: false }),
    getLegTotalCost: () => 100,
    isTipsCardExpanded: () => false,
    isFoodQuestExpanded: () => false,
    isActivitiesCardExpanded: () => false,
    renderCompactTipsCard: () => '',
    renderCompactFoodQuestCard: () => '',
    renderCompactActivitiesCard: () => '',
    getDayTotal: () => '$0',
    getLegFlightButtonTimeLabel: () => '',
    getMapSearchUrl: () => '#',
    escapeHtmlText: t => String(t || '')
  });
  context.window.window = context.window;
  context.window.document = context.document;

  const itineraryCode = loadSource('js/itinerary.js');
  runScriptInContext(itineraryCode, context, 'js/itinerary.js');

  const { getTripDayMetrics, renderCompactDaySlide, renderCompactDayPager, renderCompactLegCard, renderCompactCityChip } = context;
  assert(typeof getTripDayMetrics === 'function', 'getTripDayMetrics should be defined');

  // Test 1: Empty itinerary handling
  const emptyMetrics = getTripDayMetrics(0, 0, []);
  assert.strictEqual(emptyMetrics.totalTripDays, 0, 'Empty data should yield 0 totalTripDays');
  assert.strictEqual(emptyMetrics.globalDayIndex, null, 'Empty data should yield null globalDayIndex');
  assert.strictEqual(emptyMetrics.legTripDayRange, '', 'Empty data should yield empty legTripDayRange');

  // Test 2: Full trip totals
  const totalTripDays = sampleItinerary.reduce((sum, leg) => sum + (leg.days || []).length, 0);
  assert.strictEqual(totalTripDays, 43, 'Sample trip should have 43 total days');

  // Test 3: Leg 0 (Brisbane, 1 day)
  const leg0Metrics = getTripDayMetrics(0, 0, sampleItinerary);
  assert.strictEqual(leg0Metrics.totalTripDays, 43);
  assert.strictEqual(leg0Metrics.legStartDay, 1);
  assert.strictEqual(leg0Metrics.legEndDay, 1);
  assert.strictEqual(leg0Metrics.legTripDayRange, 'Trip Day #1');
  assert.strictEqual(leg0Metrics.legTripDayRangeShort, '#1');
  assert.strictEqual(leg0Metrics.cityDayIndex, 1);
  assert.strictEqual(leg0Metrics.globalDayIndex, 1);

  // Test 4: Leg 1 (Taipei, 1 day) by ID
  const leg1Metrics = getTripDayMetrics('taipei', 0, sampleItinerary);
  assert.strictEqual(leg1Metrics.legStartDay, 2);
  assert.strictEqual(leg1Metrics.legEndDay, 2);
  assert.strictEqual(leg1Metrics.legTripDayRange, 'Trip Day #2');
  assert.strictEqual(leg1Metrics.globalDayIndex, 2);

  // Test 5: Leg 3 (Vienna, 2 days)
  const viennaLeg = sampleItinerary[3];
  assert.strictEqual(viennaLeg.label.includes('Vienna'), true);
  const viennaMetrics = getTripDayMetrics(viennaLeg, null, sampleItinerary);
  assert.strictEqual(viennaMetrics.cityTotalDays, 2);
  assert.strictEqual(viennaMetrics.legStartDay, 4);
  assert.strictEqual(viennaMetrics.legEndDay, 5);
  assert.strictEqual(viennaMetrics.legTripDayRange, 'Trip Days #4–#5');
  assert.strictEqual(viennaMetrics.legTripDayRangeShort, '#4–#5');

  // Vienna Day 1
  const viennaDay1Metrics = getTripDayMetrics(3, 0, sampleItinerary);
  assert.strictEqual(viennaDay1Metrics.cityDayIndex, 1);
  assert.strictEqual(viennaDay1Metrics.globalDayIndex, 4);

  // Vienna Day 2
  const viennaDay2Metrics = getTripDayMetrics(3, 1, sampleItinerary);
  assert.strictEqual(viennaDay2Metrics.cityDayIndex, 2);
  assert.strictEqual(viennaDay2Metrics.globalDayIndex, 5);

  // Test 6: Bratislava (Leg 4, 3 days: Days #6–#8)
  const bratislavaMetrics = getTripDayMetrics(4, 1, sampleItinerary);
  assert.strictEqual(bratislavaMetrics.legTripDayRange, 'Trip Days #6–#8');
  assert.strictEqual(bratislavaMetrics.cityDayIndex, 2);
  assert.strictEqual(bratislavaMetrics.globalDayIndex, 7);

  // Test 7: Final Leg 16 (Brisbane return, 1 day -> #43)
  const finalLegMetrics = getTripDayMetrics(16, 0, sampleItinerary);
  assert.strictEqual(finalLegMetrics.legStartDay, 43);
  assert.strictEqual(finalLegMetrics.legEndDay, 43);
  assert.strictEqual(finalLegMetrics.legTripDayRange, 'Trip Day #43');
  assert.strictEqual(finalLegMetrics.globalDayIndex, 43);

  // Test 8: Verify rendered day chips and slides
  const viennaSlideHtml = renderCompactDaySlide(viennaLeg, 3, viennaLeg.days[0], 0, 2, new Map());
  assert(viennaSlideHtml.includes('Day 1 (#4)'), 'Vienna day slide title should include (#4)');
  assert(viennaSlideHtml.includes('Day 1 of 2 (#4/43)'), 'Vienna counter chip should show Day 1 of 2 (#4/43)');

  const viennaPagerHtml = renderCompactDayPager(viennaLeg, 3, new Map());
  assert(viennaPagerHtml.includes('Day 1 (#4)'), 'Vienna day pager chip should include Day 1 (#4)');
  assert(viennaPagerHtml.includes('Day 2 (#5)'), 'Vienna day pager chip should include Day 2 (#5)');

  // Test 9: Verify rendered compact leg card
  const viennaCardHtml = renderCompactLegCard(viennaLeg, 3, new Map());
  assert(viennaCardHtml.includes('compact-leg-trip-days-badge'), 'Compact leg card should render trip day badge');
  assert(viennaCardHtml.includes('Trip Days #4–#5'), 'Compact leg card should display Trip Days #4–#5');

  // Test 10: Verify mobile city chip route
  const viennaChipHtml = renderCompactCityChip({ leg: viennaLeg, cityId: viennaLeg.id }, 3, new Map());
  assert(viennaChipHtml.includes('#4–#5'), 'Mobile city chip route should include #4–#5');

  console.log('✔ All trip day metrics and itinerary rendering checks passed successfully!\n');
}

if (require.main === module) {
  runTripDayMetricsTests();
}

module.exports = { runTripDayMetricsTests };
