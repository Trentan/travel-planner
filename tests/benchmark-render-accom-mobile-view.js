const fs = require('fs');
const path = require('path');
const { createVmContext, runScriptInContext, loadSource } = require('./lib/test-helpers');

function runBenchmark() {
  const sampleCities = Array.from({ length: 500 }, (_, i) => ({
    id: `city-${i}`,
    name: `City ${i}`,
    colour: '#2C3E50',
    code: `C${i}`
  }));

  const sampleStays = Array.from({ length: 300 }, (_, i) => ({
    id: `stay-${i}`,
    cityId: `city-${i % 500}`,
    propertyName: `Hotel ${i}`,
    checkIn: '2025-05-01',
    checkOut: '2025-05-05',
    status: 'confirmed',
    totalCost: '150'
  }));

  const context = createVmContext({
    Date,
    window: { innerWidth: 500 },
    innerWidth: 500,
    stays: sampleStays,
    citiesData: sampleCities,
    isEditMode: true,
    currentCityFilter: 'all',
    escapeHtmlText: val => String(val || ''),
    getMapSearchUrl: (loc, city) => 'https://maps.example.com',
    normalizeItemStatus: status => status || 'planned',
    formatCurrency: val => '$' + val,
    getCityFlag: () => '📍',
    getLocationCodeText: () => '---',
    renderStatusBadge: () => '<span class="badge">planned</span>',
    renderMobileSurfaceCard: (opts) => '<div class="surface-card">' + opts.title + '</div>',
    renderMobileSwipePager: (opts) => '<div class="swipe-pager">' + opts.slidesHtml + '</div>',
    formatTripDateForDisplay: date => date
  });

  const tabsCode = loadSource('js/tabs.js');
  runScriptInContext(tabsCode, context, 'js/tabs.js');

  const ITERATIONS = 1000;
  console.log(`Running renderAccomMobileView benchmark (${ITERATIONS} iterations, 300 stays, 500 cities)...`);

  const start = process.hrtime.bigint();
  for (let i = 0; i < ITERATIONS; i++) {
    context.renderAccomMobileView(sampleStays);
  }
  const end = process.hrtime.bigint();
  const durationMs = Number(end - start) / 1e6;

  console.log(`renderAccomMobileView Total Time: ${durationMs.toFixed(2)} ms`);
  console.log(`Average per call: ${(durationMs / ITERATIONS).toFixed(4)} ms`);
  return durationMs;
}

if (require.main === module) {
  runBenchmark();
}

module.exports = { runBenchmark };
