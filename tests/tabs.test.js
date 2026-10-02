const assert = require('assert');
const { createVmContext, runScriptInContext, loadSource } = require('./lib/test-helpers');

function runTabsTests() {
  console.log('Testing js/tabs.js...');

  // Helper mock DOM element generator
  const createMockElement = (initialHtml = '') => {
    const el = {
      innerHTML: initialHtml,
      appendChild: () => {},
      querySelector: () => null,
      querySelectorAll: () => []
    };
    return el;
  };

  const elements = {
    'accom-table-container': createMockElement(),
    'guides-container': createMockElement(),
    'packing-areas-container': createMockElement(),
    'budget-table-container': createMockElement(),
    'budget-kpi-container': createMockElement()
  };

  const mockDocument = {
    getElementById: (id) => elements[id] || null,
    createElement: (tag) => {
      let content = '';
      return {
        tag,
        set textContent(val) { content = String(val || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); },
        get textContent() { return content; },
        get innerHTML() { return content; }
      };
    }
  };

  const sampleCities = [
    { id: 'tokyo', name: 'Tokyo', colour: '#FF0000' },
    { id: 'kyoto', name: 'Kyoto', colour: '#00FF00' }
  ];

  const sampleStays = [
    {
      id: 'stay-1',
      cityId: 'tokyo',
      propertyName: 'Hotel Park',
      location: 'Shinjuku, Tokyo',
      provider: 'Booking.com',
      checkIn: '2025-05-01',
      checkOut: '2025-05-05',
      checkInTime: '15:00',
      checkOutTime: '10:00',
      nights: 4,
      bookingRef: 'REF123',
      notes: 'Near station',
      status: 'confirmed',
      totalCost: '400',
      attachments: [{ name: 'voucher.pdf', url: '#' }]
    },
    {
      id: 'stay-2',
      cityId: 'kyoto',
      propertyName: 'Kyoto Inn',
      location: 'Gion, Kyoto',
      provider: 'Agoda',
      checkIn: '2025-05-05',
      checkOut: '2025-05-08',
      nights: 3,
      bookingRef: 'REF456',
      notes: 'Breakfast included',
      status: 'planned',
      totalCost: '300'
    }
  ];

  const sampleAppData = [
    {
      id: 'leg-1',
      label: 'Tokyo Leg',
      colour: '#FF0000',
      days: [
        { date: '2025-05-01', from: 'Tokyo', to: 'Tokyo', activityItems: [{ cost: '50' }], accomItems: [] },
        { date: '2025-05-02', from: 'Tokyo', to: 'Tokyo', activityItems: [], accomItems: [] }
      ]
    }
  ];

  const sampleJourneys = [
    { id: 'j-1', legId: 'leg-1', cost: '120', toLocation: 'Tokyo' }
  ];

  const samplePackingData = [
    {
      areaName: '🚶 Walk-on Gear (Wear onto plane)',
      areaColor: '#E67E22',
      categories: [
        {
          title: 'Essentials',
          items: [{ text: 'Passport', done: true }, { text: 'Wallet', done: false }]
        }
      ]
    }
  ];

  const sampleLeaveHomeData = [
    { text: 'Security Check', isSection: true },
    { text: 'Lock back door', done: true }
  ];

  const sampleDefaultPacking = [
    { areaName: '🚶 Walk-on Gear (Wear onto plane)', areaColor: '#E67E22', categories: [] },
    { areaName: '🧳 Carry-on Packed Bag (Main Luggage)', areaColor: '#2980B9', categories: [] },
    { areaName: '🎒 Personal Item Bag (Under Seat)', areaColor: '#8E44AD', categories: [] },
    { areaName: '📝 Trip Notes', areaColor: '#6C5CE7', categories: [] }
  ];

  let savedDataCalled = false;

  const context = createVmContext({
    Date,
    document: mockDocument,
    window: { innerWidth: 1024 },
    innerWidth: 1024,
    stays: sampleStays,
    citiesData: sampleCities,
    appData: sampleAppData,
    journeys: sampleJourneys,
    packingData: samplePackingData,
    leaveHomeData: sampleLeaveHomeData,
    DEFAULT_PACKING: sampleDefaultPacking,
    isEditMode: true,
    isPackingEditLocked: false,
    currentCityFilter: 'all',
    escapeHtmlText: val => String(val || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    getMapSearchUrl: (loc, city) => `https://maps.example.com/?q=${encodeURIComponent(loc + ' ' + city)}`,
    normalizeItemStatus: status => ['planned', 'booked', 'confirmed', 'cancelled'].includes(status) ? status : 'planned',
    formatCurrency: (val, opts) => typeof opts === 'object' && opts.includeSymbol === false ? String(val) : `$${val}`,
    formatTripDateForDisplay: null,
    parseCost: val => parseFloat(val) || 0,
    getCityFlagHTML: city => `<span class="flag">${city}</span>`,
    renderStatusBadge: (status, opts) => `<span class="badge ${status}">${status}</span>`,
    renderMobileStatusCostMeta: () => '<div class="mobile-meta">Meta</div>',
    renderAttachmentsPillsHtml: (att) => `<span class="pill">${att.length} file(s)</span>`,
    renderMobileSurfaceCard: (opts) => `<div class="surface-card">${opts.title} - ${opts.subtitle}</div>`,
    renderMobileSwipePager: (opts) => `<div class="swipe-pager">${opts.slidesHtml}</div>`,
    isLeaveHomeSection: item => Boolean(item.isSection),
    saveData: () => { savedDataCalled = true; }
  });

  const tabsCode = loadSource('js/tabs.js');
  runScriptInContext(tabsCode, context, 'js/tabs.js');

  const {
    isStayRowExpanded,
    toggleStayRowDetails,
    renderStayDetailBlock,
    renderStayLocationDetails,
    renderStayLocationSummary,
    renderStayMobileFact,
    renderStayMobileLinkedFact,
    renderStayMobileSummary,
    renderStayDateSummary,
    renderStayStatusCostSummary,
    isAccomMobileCardLayout,
    renderStayMobileDetails,
    getFilteredAndSortedStays,
    renderAccomHeader,
    renderAccomEmptyState,
    renderAccomMobileView,
    renderAccomTableRow,
    renderAccomDesktopTable,
    buildAccomTab,
    calculateNights,
    formatDateShort,
    parseBudgetDate,
    getExclusiveDateRangeEnd,
    getStayOverlapDays,
    findBestStayLegIndex,
    escapeHtml,
    buildPackingTab,
    formatBudgetAmount,
    calculateBudgetBreakdown,
    renderBudgetKPIs,
    renderBudgetTableAndBreakdown,
    buildBudgetTab
  } = context;

  // 1. Expanded Stay Rows state management
  assert.strictEqual(isStayRowExpanded('stay-1'), false, 'stay-1 should initially not be expanded');
  toggleStayRowDetails('stay-1');
  assert.strictEqual(isStayRowExpanded('stay-1'), true, 'stay-1 should be expanded after toggleStayRowDetails');
  toggleStayRowDetails('stay-1');
  assert.strictEqual(isStayRowExpanded('stay-1'), false, 'stay-1 should be collapsed after second toggleStayRowDetails');

  // 2. Formatting & Math helpers
  assert.strictEqual(calculateNights('2025-05-01', '2025-05-05'), 4, 'calculateNights should return 4 days diff');
  assert.strictEqual(calculateNights('2025-05-05', '2025-05-01'), 0, 'calculateNights should clamp negative to 0');
  assert.strictEqual(calculateNights('', '2025-05-01'), 0, 'calculateNights with falsy date returns 0');

  assert.strictEqual(formatDateShort('2025-05-01'), '1 May', 'formatDateShort formatted default date string');
  assert.strictEqual(formatDateShort(''), '—', 'formatDateShort empty string returns fallback dash');

  const parsedDate = parseBudgetDate('2025-05-01');
  assert(parsedDate !== null && typeof parsedDate.getTime === 'function' && !isNaN(parsedDate.getTime()), 'parseBudgetDate returns a valid Date object');
  assert.strictEqual(parseBudgetDate('invalid-date'), null, 'parseBudgetDate returns null for invalid date');
  assert.strictEqual(parseBudgetDate(''), null, 'parseBudgetDate returns null for falsy date');

  const exclusiveEnd = getExclusiveDateRangeEnd('2025-05-01');
  assert(exclusiveEnd instanceof Date, 'getExclusiveDateRangeEnd returns a Date object');
  assert.strictEqual(exclusiveEnd.getTime() - parsedDate.getTime(), 24 * 60 * 60 * 1000, 'getExclusiveDateRangeEnd adds 24 hours');
  assert.strictEqual(exclusiveEnd.getDate(), 2, 'getExclusiveDateRangeEnd adds 1 day');
  assert.strictEqual(getExclusiveDateRangeEnd('invalid'), null, 'getExclusiveDateRangeEnd returns null for invalid date');

  // 3. Stay Leg overlap logic
  const testLeg = {
    days: [
      { date: '2025-05-01' },
      { date: '2025-05-02' },
      { date: '2025-05-03' },
      { date: '2025-05-04' }
    ]
  };
  const overlapDays = getStayOverlapDays(sampleStays[0], testLeg);
  assert.strictEqual(overlapDays, 4, 'getStayOverlapDays calculates 4 days overlap');
  assert.strictEqual(getStayOverlapDays(null, testLeg), 0, 'getStayOverlapDays returns 0 if stay is null');
  assert.strictEqual(getStayOverlapDays(sampleStays[0], null), 0, 'getStayOverlapDays returns 0 if leg is null');

  const bestIndex = findBestStayLegIndex(sampleStays[0], [testLeg]);
  assert.strictEqual(bestIndex, 0, 'findBestStayLegIndex selects leg index 0');
  assert.strictEqual(findBestStayLegIndex(null, [testLeg]), -1, 'findBestStayLegIndex returns -1 for null stay');
  assert.strictEqual(findBestStayLegIndex(sampleStays[0], []), -1, 'findBestStayLegIndex returns -1 for empty legs');

  // 4. HTML Escape
  assert.strictEqual(escapeHtml('Hello <World>'), 'Hello &lt;World&gt;', 'escapeHtml sanitizes HTML tags');
  assert.strictEqual(escapeHtml(''), '', 'escapeHtml returns empty string for falsy input');

  // 5. Small HTML Snippet Renderers
  assert(renderStayDetailBlock('Title', 'Val').includes('Title') && renderStayDetailBlock('Title', 'Val').includes('Val'), 'renderStayDetailBlock outputs title and value');
  assert(renderStayLocationDetails(sampleStays[0]).includes('Shinjuku, Tokyo'), 'renderStayLocationDetails outputs location link');
  assert.strictEqual(renderStayLocationDetails(null), '', 'renderStayLocationDetails returns empty string for null stay');

  assert(renderStayLocationSummary(sampleStays[0]).includes('Shinjuku, Tokyo'), 'renderStayLocationSummary outputs summary HTML');
  assert.strictEqual(renderStayLocationSummary(null), '', 'renderStayLocationSummary returns empty for null stay');

  assert(renderStayMobileFact('Fact', 'Value').includes('Fact') && renderStayMobileFact('Fact', 'Value').includes('Value'), 'renderStayMobileFact renders label & value');
  assert(renderStayMobileLinkedFact('Label', 'Val', 'https://example.com').includes('https://example.com'), 'renderStayMobileLinkedFact includes href');

  assert(renderStayMobileSummary(sampleStays[0], 'confirmed', '', 'Tokyo').includes('Hotel Park') || renderStayMobileSummary(sampleStays[0], 'confirmed', '', 'Tokyo').includes('Tokyo'), 'renderStayMobileSummary includes details');
  assert(renderStayDateSummary(sampleStays[0], 'confirmed', '').includes('Out:'), 'renderStayDateSummary includes checkout label');
  assert(renderStayStatusCostSummary(sampleStays[0], 'confirmed', '').includes('badge'), 'renderStayStatusCostSummary includes status badge');

  assert(renderStayMobileDetails(sampleStays[0], 'Tokyo').includes('Shinjuku, Tokyo'), 'renderStayMobileDetails includes facts grid');

  // 6. Filtering & Sorting Stays
  const allStays = getFilteredAndSortedStays('all');
  assert.strictEqual(allStays.length, 2, 'getFilteredAndSortedStays("all") returns 2 stays');
  const filteredStays = getFilteredAndSortedStays('tokyo');
  assert.strictEqual(filteredStays.length, 1, 'getFilteredAndSortedStays("tokyo") returns 1 stay');
  assert.strictEqual(filteredStays[0].id, 'stay-1', 'Filtered stay is stay-1');

  // 7. Accom Header & Empty State
  assert(renderAccomHeader().includes('Accommodation'), 'renderAccomHeader includes title');
  assert(renderAccomHeader().includes('openAddStayModal'), 'renderAccomHeader includes Add Stay button when isEditMode=true');
  assert(renderAccomEmptyState().includes('No stays found.'), 'renderAccomEmptyState includes empty message');

  // 8. Desktop & Mobile Table / View rendering
  const tableRowHtml = renderAccomTableRow(sampleStays[0]);
  assert(tableRowHtml.includes('Hotel Park'), 'renderAccomTableRow includes property name');
  assert(tableRowHtml.includes('Shinjuku, Tokyo'), 'renderAccomTableRow includes location');

  const desktopTableHtml = renderAccomDesktopTable(sampleStays);
  assert(desktopTableHtml.includes('stay-data-table'), 'renderAccomDesktopTable renders table shell');
  assert(desktopTableHtml.includes('Hotel Park') && desktopTableHtml.includes('Kyoto Inn'), 'renderAccomDesktopTable includes all stay rows');

  const mobileViewHtml = renderAccomMobileView(sampleStays);
  assert(mobileViewHtml.includes('swipe-pager'), 'renderAccomMobileView renders mobile swipe pager');

  // 9. Layout Detection & buildAccomTab
  assert.strictEqual(isAccomMobileCardLayout(), false, 'isAccomMobileCardLayout returns false for 1024px width');
  context.window.innerWidth = 500;
  assert.strictEqual(isAccomMobileCardLayout(), true, 'isAccomMobileCardLayout returns true for 500px width');
  context.window.innerWidth = 1024; // reset

  buildAccomTab('all');
  assert(elements['accom-table-container'].innerHTML.includes('stay-data-table'), 'buildAccomTab populates container with desktop table');

  // Test empty state in buildAccomTab
  context.stays = [];
  buildAccomTab('all');
  assert(elements['accom-table-container'].innerHTML.includes('No stays found.'), 'buildAccomTab populates container with empty state when no stays exist');
  context.stays = sampleStays; // reset

  // 10. Packing Tab
  buildPackingTab();
  assert(elements['guides-container'].innerHTML.includes('Hotel Sink Washing Guide'), 'buildPackingTab populates guides container');
  assert(elements['packing-areas-container'].innerHTML.includes('Walk-on Gear'), 'buildPackingTab populates packing areas container');

  // 11. Budget Tab
  assert.strictEqual(formatBudgetAmount('50'), '$50', 'formatBudgetAmount calls formatCurrency');
  const budgetData = calculateBudgetBreakdown();
  assert.strictEqual(budgetData.grandTotal, 870, 'calculateBudgetBreakdown totals stay cost (400+300) + journey cost (120) + activity cost (50)');

  buildBudgetTab();
  assert(elements['budget-kpi-container'].innerHTML.includes('$870'), 'buildBudgetTab populates KPI container');
  assert(elements['budget-table-container'].innerHTML.includes('Tokyo Leg'), 'buildBudgetTab populates table container');

  console.log('✔ All js/tabs.js unit tests passed successfully!\n');
}

if (require.main === module) {
  runTabsTests();
}

module.exports = { runTabsTests };
