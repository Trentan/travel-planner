const assert = require('assert');
const path = require('path');
const { createVmContext, runScriptInContext, loadSource } = require('./lib/test-helpers');

function runBudgetTabTests() {
  console.log('Testing buildBudgetTab refactored helpers...');

  const mockElement = () => ({
    innerHTML: '',
    appendChild: () => {},
    querySelector: () => null,
    querySelectorAll: () => []
  });

  const elements = {
    'budget-table-container': mockElement(),
    'budget-kpi-container': mockElement()
  };

  const sampleAppData = [
    {
      id: 'leg1',
      label: 'Tokyo Leg',
      colour: '#FF0000',
      days: [
        {
          date: '2025-05-01',
          from: 'Tokyo',
          to: 'Tokyo',
          activityItems: [{ cost: '50' }]
        }
      ]
    }
  ];

  const sampleJourneys = [
    {
      id: 'j1',
      legId: 'leg1',
      cost: '100',
      toLocation: 'Tokyo'
    }
  ];

  const sampleStays = [
    {
      id: 's1',
      checkIn: '2025-05-01',
      checkOut: '2025-05-02',
      totalCost: '150'
    }
  ];

  const context = createVmContext({
    document: {
      getElementById: (id) => elements[id] || null,
      createElement: () => mockElement()
    },
    appData: sampleAppData,
    journeys: sampleJourneys,
    stays: sampleStays,
    parseCost: (val) => parseFloat(val) || 0,
    formatCurrency: (val) => `$${val}`,
    escapeHtmlText: (val) => String(val || ''),
    escapeHtml: (val) => String(val || ''),
    findBestStayLegIndex: (stay, legs) => 0
  });

  const tabsCode = loadSource('js/tabs.js');
  runScriptInContext(tabsCode, context, 'js/tabs.js');

  const { calculateBudgetBreakdown, renderBudgetKPIs, renderBudgetTableAndBreakdown, buildBudgetTab } = context;

  // 1. Verify function definitions
  assert.strictEqual(typeof calculateBudgetBreakdown, 'function', 'calculateBudgetBreakdown should be exported');
  assert.strictEqual(typeof renderBudgetKPIs, 'function', 'renderBudgetKPIs should be exported');
  assert.strictEqual(typeof renderBudgetTableAndBreakdown, 'function', 'renderBudgetTableAndBreakdown should be exported');
  assert.strictEqual(typeof buildBudgetTab, 'function', 'buildBudgetTab should be exported');

  // 2. Test calculateBudgetBreakdown
  const breakdown = calculateBudgetBreakdown();
  assert.strictEqual(breakdown.totalTrans, 100, 'Total transport cost should be 100');
  assert.strictEqual(breakdown.totalAccom, 150, 'Total accommodation cost should be 150');
  assert.strictEqual(breakdown.totalAct, 50, 'Total activities cost should be 50');
  assert.strictEqual(breakdown.grandTotal, 300, 'Grand total cost should be 300');
  assert.strictEqual(breakdown.legBreakdown.length, 1, 'Leg breakdown length should be 1');
  assert.strictEqual(breakdown.legBreakdown[0].label, 'Tokyo Leg');

  // 3. Test buildBudgetTab execution and DOM population
  buildBudgetTab();
  assert(elements['budget-kpi-container'].innerHTML.includes('$300'), 'KPI container should include grand total $300');
  assert(elements['budget-table-container'].innerHTML.includes('Tokyo Leg'), 'Table container should include leg label Tokyo Leg');

  console.log('✔ All buildBudgetTab refactoring unit tests passed successfully!\n');
}

if (require.main === module) {
  runBudgetTabTests();
}

module.exports = { runBudgetTabTests };
