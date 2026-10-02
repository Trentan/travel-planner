const path = require('path');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function runGetDayTotalTests() {
  console.log('Running getDayTotal unit tests...');

  const documentMock = {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {}
  };

  const context = createVmContext({
    document: documentMock,
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    location: { hostname: 'localhost', origin: 'http://localhost:3000', href: 'http://localhost:3000/' },
    addEventListener() {}
  });
  context.window = context;

  const utilsSource = loadSource(path.join('js', 'utils.js'));
  runScriptInContext(utilsSource, context, 'js/utils.js');

  const getDayTotal = context.window.getDayTotal;
  assert(typeof getDayTotal === 'function', 'getDayTotal should be exported on window');

  // 1. Empty / Zero cost day object
  assert(getDayTotal({}) === '', 'Empty day object should return empty string (showZero: false)');
  assert(getDayTotal({ date: '2025-05-01' }) === '', 'Day with no items should return empty string');
  assert(getDayTotal({ activityItems: [] }) === '', 'Day with empty activityItems should return empty string');

  // 2. Direct activityItems calculation
  const dayWithActivities = {
    activityItems: [
      { cost: 25 },
      { cost: '15.50' },
      { cost: '$10' },
      { cost: null },
      { cost: 'invalid' }
    ]
  };
  assert(getDayTotal(dayWithActivities) === '$50.50', 'Should sum numeric, string, and currency costs in activityItems');

  // 3. Fallback accomItems and transportItems calculation (when getStayDisplayForDay and getDayJourneys are undefined)
  const dayWithFallbackItems = {
    activityItems: [{ cost: 20 }],
    accomItems: [{ cost: 100 }, { cost: '50' }],
    transportItems: [{ cost: 30 }, { cost: '15.25' }]
  };
  assert(getDayTotal(dayWithFallbackItems) === '$215.25', 'Should sum activityItems, accomItems, and transportItems when helper functions are absent');

  // 4. getStayDisplayForDay integration
  context.getStayDisplayForDay = (date, to) => {
    assert(date === '2025-06-10', 'getStayDisplayForDay should receive day.date');
    assert(to === 'Paris', 'getStayDisplayForDay should receive day.to');
    return [
      { type: 'checkin', cost: 120 },
      { type: 'checkout', cost: 120 }, // should be ignored
      { type: 'stay', cost: 120 }       // should be ignored
    ];
  };

  const dayWithStayHelper = {
    date: '2025-06-10',
    to: 'Paris',
    activityItems: [{ cost: 30 }]
  };
  assert(getDayTotal(dayWithStayHelper) === '$150', 'Should only add stay cost on checkin day via getStayDisplayForDay');

  // Clean up stay helper mock
  delete context.getStayDisplayForDay;

  // 5. getDayJourneys integration with appData parent leg matching
  context.appData = [
    {
      id: 'leg-1',
      days: [{ date: '2025-06-10' }, { date: '2025-06-11' }]
    },
    {
      id: 'leg-2',
      days: [{ date: '2025-06-12' }]
    }
  ];

  context.journeyDatesMatch = (d1, d2) => d1 === d2;

  context.getDayJourneys = (date, from, to, legId) => {
    assert(date === '2025-06-10', 'getDayJourneys should receive day.date');
    assert(legId === 'leg-1', 'getDayJourneys should receive matched legId from appData');
    return [
      { legId: 'leg-1', departureDate: '2025-06-10', cost: 45 },
      { legId: 'leg-1', departureDate: '2025-06-09', cost: 100 }, // non-departure day -> ignored
      { legId: 'leg-2', departureDate: '2025-06-10', cost: 80 }   // legId mismatch -> ignored
    ];
  };

  const dayWithJourneyHelper = {
    date: '2025-06-10',
    from: 'London',
    to: 'Paris',
    activityItems: [{ cost: 15 }]
  };
  assert(getDayTotal(dayWithJourneyHelper) === '$60', 'Should sum valid journey cost matching legId and departure date');

  // Clean up global mocks
  delete context.getDayJourneys;
  delete context.journeyDatesMatch;
  delete context.appData;

  // 6. Both getStayDisplayForDay and getDayJourneys active
  context.getStayDisplayForDay = () => [{ type: 'checkin', cost: '200' }];
  context.getDayJourneys = () => [{ dayDate: '2025-07-01', cost: '$50.50' }];

  const dayWithBothHelpers = {
    date: '2025-07-01',
    activityItems: [{ cost: '$100' }]
  };
  assert(getDayTotal(dayWithBothHelpers) === '$350.50', 'Should sum activities, stays, and journeys when both helpers are present');

  delete context.getStayDisplayForDay;
  delete context.getDayJourneys;

  console.log('✅ ALL getDayTotal UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runGetDayTotalTests();
  } catch (err) {
    console.error('❌ getDayTotal TEST FAILED:', err.message);
    process.exit(1);
  }
}

module.exports = { runGetDayTotalTests };
