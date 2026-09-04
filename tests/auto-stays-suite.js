const path = require('path');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function createAutoStaysTestingContext() {
  const context = createVmContext({
    appData: [],
    stays: [],
    citiesData: [],
    window: {},
    alert: () => {},
    saveData: () => {},
    buildAccomTab: () => {},
    renderAll: () => {},
    calculateNights: (checkIn, checkOut) => {
      if (!checkIn || !checkOut) return 0;
      const d1 = new Date(checkIn);
      const d2 = new Date(checkOut);
      const diffTime = d2.getTime() - d1.getTime();
      return Math.round(diffTime / (1000 * 3600 * 24));
    },
    toLocalIsoDate: (dateObj) => {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  });

  context.window = context;
  return context;
}

async function run() {
  console.log('Running auto-stays test suite...');

  const autoStaysSource = loadSource(path.join('js', 'auto-stays.js'));

  // Test 1: Basic expected stays calculation with single and multi-day stays
  {
    const context = createAutoStaysTestingContext();
    context.appData = [
      {
        id: 'leg-1',
        label: 'France & Italy',
        days: [
          { day: 1, date: '2026-06-01', from: 'Home', to: 'Paris' },
          { day: 2, date: '2026-06-02', from: 'Paris', to: 'Paris' },
          { day: 3, date: '2026-06-03', from: 'Paris', to: 'Paris' },
          { day: 4, date: '2026-06-04', from: 'Paris', to: 'Rome' },
          { day: 5, date: '2026-06-05', from: 'Rome', to: 'Rome' },
          { day: 6, date: '2026-06-06', from: 'Rome', to: 'Home' }
        ]
      }
    ];

    runScriptInContext(autoStaysSource, context, 'js/auto-stays.js');

    const expected = context.calculateExpectedStays();
    // Day 1->Day 2 (Paris), Day 2->Day 3 (Paris) => 2 nights in Paris before leaving for Rome on Day 4
    assert(expected['Paris'] === 2, `Expected Paris to have 2 nights, got ${expected['Paris']}`);
    // Day 4->Day 5 (Rome) => 1 night in Rome before returning home on Day 6
    assert(expected['Rome'] === 1, `Expected Rome to have 1 night, got ${expected['Rome']}`);
    assert(!('Home' in expected), 'Home should not be counted in expected stays');
  }

  // Test 2: Destinations in skip list and empty/placeholder destinations
  {
    const context = createAutoStaysTestingContext();
    const skipItems = ['Home', 'In transit', 'Between cities', 'TBC', '', 'Return', 'Departure', 'Flight'];

    context.appData = [
      {
        id: 'leg-skip',
        label: 'Transit Leg',
        days: skipItems.map((skipDest, idx) => ({
          day: idx + 1,
          date: `2026-06-0${idx + 1}`,
          from: 'Somewhere',
          to: skipDest
        }))
      }
    ];

    runScriptInContext(autoStaysSource, context, 'js/auto-stays.js');

    const expected = context.calculateExpectedStays();
    assert(Object.keys(expected).length === 0, 'No expected stays should be calculated for skip list items');
  }

  // Test 3: Leg filtering for trip start, finish, transit, and special leg IDs
  {
    const context = createAutoStaysTestingContext();
    context.appData = [
      {
        id: 'departure',
        label: 'Flight Out',
        days: [{ day: 1, date: '2026-06-01', from: 'Home', to: 'Tokyo' }, { day: 2, date: '2026-06-02', from: 'Tokyo', to: 'Tokyo' }]
      },
      {
        id: 'return',
        label: 'Flight Home',
        days: [{ day: 1, date: '2026-06-10', from: 'Tokyo', to: 'Tokyo' }, { day: 2, date: '2026-06-11', from: 'Tokyo', to: 'Home' }]
      },
      {
        id: 'tokyo-start',
        label: 'Tokyo Entry (trip start)',
        days: [{ day: 1, date: '2026-06-02', from: 'Tokyo', to: 'Tokyo' }, { day: 2, date: '2026-06-03', from: 'Tokyo', to: 'Tokyo' }]
      },
      {
        id: 'tokyo-finish',
        label: 'Tokyo Exit (trip finish)',
        days: [{ day: 1, date: '2026-06-08', from: 'Tokyo', to: 'Tokyo' }, { day: 2, date: '2026-06-09', from: 'Tokyo', to: 'Tokyo' }]
      },
      {
        id: 'leg-transit',
        label: 'Overnight Train (transit)',
        days: [{ day: 1, date: '2026-06-05', from: 'Tokyo', to: 'Osaka' }, { day: 2, date: '2026-06-06', from: 'Osaka', to: 'Osaka' }]
      },
      {
        id: 'leg-end',
        label: 'Final Leg (trip end)',
        days: [{ day: 1, date: '2026-06-09', from: 'Osaka', to: 'Osaka' }, { day: 2, date: '2026-06-10', from: 'Osaka', to: 'Osaka' }]
      }
    ];

    runScriptInContext(autoStaysSource, context, 'js/auto-stays.js');

    const expected = context.calculateExpectedStays();
    assert(Object.keys(expected).length === 0, 'Special transit/start/finish legs should be skipped completely');
  }

  // Test 4: calculateExistingStays calculation with explicit and calculated nights
  {
    const context = createAutoStaysTestingContext();
    context.citiesData = [
      { id: 'city-paris', name: 'Paris' },
      { id: 'city-rome', name: 'Rome' }
    ];
    context.stays = [
      { id: 'stay-1', cityId: 'city-paris', nights: 3, checkIn: '2026-06-01', checkOut: '2026-06-04' },
      { id: 'stay-2', cityId: 'city-paris', checkIn: '2026-06-04', checkOut: '2026-06-06' }, // 2 nights calculated
      { id: 'stay-3', cityId: 'city-unknown', nights: 1 } // unknown city
    ];

    runScriptInContext(autoStaysSource, context, 'js/auto-stays.js');

    const existing = context.calculateExistingStays();
    assert(existing['Paris'] === 5, `Expected 5 total nights in Paris, got ${existing['Paris']}`);
    assert(existing['Unknown City'] === 1, `Expected 1 night for Unknown City, got ${existing['Unknown City']}`);
  }

  // Test 5: getMissingStays matching expected vs existing with city name normalization
  {
    const context = createAutoStaysTestingContext();
    context.appData = [
      {
        id: 'leg-main',
        label: 'Europe Trip',
        days: [
          { day: 1, date: '2026-06-01', from: 'Paris', to: '🇫🇷 Paris (Trip Start)' },
          { day: 2, date: '2026-06-02', from: 'Paris', to: '🇫🇷 Paris (Trip Start)' },
          { day: 3, date: '2026-06-03', from: 'Paris', to: '🇫🇷 Paris (Trip Start)' },
          { day: 4, date: '2026-06-04', from: 'Paris', to: 'Berlin, Germany' },
          { day: 5, date: '2026-06-05', from: 'Berlin', to: 'Berlin, Germany' },
          { day: 6, date: '2026-06-06', from: 'Berlin', to: 'Home' }
        ]
      }
    ];

    context.citiesData = [
      { id: 'c1', name: 'Paris' },
      { id: 'c2', name: 'Berlin' }
    ];

    // Expected: 2 nights Paris (days 1, 2), 1 night Berlin (day 4)
    // Existing stay covers 1 night Paris (1 missing) and 0 for Berlin (1 missing)
    context.stays = [
      { id: 's1', cityId: 'c1', nights: 1 }
    ];

    runScriptInContext(autoStaysSource, context, 'js/auto-stays.js');

    const { missing, totalMissing } = context.getMissingStays();
    assert(missing['🇫🇷 Paris (Trip Start)'] === 1, `Expected 1 missing night for Paris, got ${missing['🇫🇷 Paris (Trip Start)']}`);
    assert(missing['Berlin, Germany'] === 1, `Expected 1 missing night for Berlin, got ${missing['Berlin, Germany']}`);
    assert(totalMissing === 2, `Expected totalMissing to be 2, got ${totalMissing}`);
    assert(context.shouldShowAutopopulateButton() === true, 'shouldShowAutopopulateButton should return true when totalMissing > 0');

    const buttonHtml = context.initAutopopulateButton();
    assert(buttonHtml.includes('Missing Accommodation!'), 'initAutopopulateButton should return missing accommodation banner');
  }

  // Test 6: getMissingStays when all stays are fully covered
  {
    const context = createAutoStaysTestingContext();
    context.appData = [
      {
        id: 'leg-main',
        label: 'Trip',
        days: [
          { day: 1, date: '2026-06-01', from: 'London', to: 'London' },
          { day: 2, date: '2026-06-02', from: 'London', to: 'London' },
          { day: 3, date: '2026-06-03', from: 'London', to: 'Home' }
        ]
      }
    ];
    context.citiesData = [{ id: 'c-london', name: 'London' }];
    context.stays = [{ id: 's-london', cityId: 'c-london', nights: 2 }];

    runScriptInContext(autoStaysSource, context, 'js/auto-stays.js');

    const { missing, totalMissing } = context.getMissingStays();
    assert(totalMissing === 0, 'totalMissing should be 0 when expected stays are met');
    assert(Object.keys(missing).length === 0, 'missing should be empty when expected stays are met');
    assert(context.shouldShowAutopopulateButton() === false, 'shouldShowAutopopulateButton should return false when no missing stays');
    assert(context.initAutopopulateButton() === '', 'initAutopopulateButton should return empty string when no missing stays');
  }

  // Test 7: createStayFromItinerary helper function
  {
    const context = createAutoStaysTestingContext();
    context.citiesData = [{ id: 'city-tokyo', name: 'Tokyo' }];

    runScriptInContext(autoStaysSource, context, 'js/auto-stays.js');

    const stay = context.createStayFromItinerary('Tokyo', 'leg-1', '2026-06-10', 3);
    assert(stay !== null, 'createStayFromItinerary should return a stay object when city exists');
    assert(stay.cityId === 'city-tokyo', 'Stay should have cityId set to city-tokyo');
    assert(stay.checkIn === '2026-06-10', 'Check-in date should match start date');
    assert(stay.checkOut === '2026-06-13', 'Check-out date should be start date + nights');
    assert(stay.nights === 3, 'Nights should be 3');
    assert(stay.status === 'pending', 'Status should be pending');

    const nullStay = context.createStayFromItinerary('NonExistentCity', 'leg-1', '2026-06-10', 3);
    assert(nullStay === null, 'createStayFromItinerary should return null for non-existent city');
  }

  // Test 8: autopopulateStays integration test
  {
    const context = createAutoStaysTestingContext();
    let saved = false;
    context.saveData = () => { saved = true; };

    context.appData = [
      {
        id: 'leg-japan',
        label: 'Japan Trip',
        days: [
          { day: 1, date: '2026-06-01', from: 'Tokyo', to: 'Tokyo' },
          { day: 2, date: '2026-06-02', from: 'Tokyo', to: 'Tokyo' },
          { day: 3, date: '2026-06-03', from: 'Tokyo', to: 'Osaka' },
          { day: 4, date: '2026-06-04', from: 'Osaka', to: 'Osaka' },
          { day: 5, date: '2026-06-05', from: 'Osaka', to: 'Home' }
        ]
      }
    ];

    context.citiesData = [
      { id: 'c-tokyo', name: 'Tokyo' },
      { id: 'c-osaka', name: 'Osaka' }
    ];

    context.stays = [];

    runScriptInContext(autoStaysSource, context, 'js/auto-stays.js');

    const createdCount = context.autopopulateStays();
    assert(createdCount === 2, `Expected 2 stays to be created, got ${createdCount}`);
    assert(context.stays.length === 2, `Expected stays array length 2, got ${context.stays.length}`);
    assert(saved === true, 'saveData should be called when stays are autopopulated');
  }

  console.log('All auto-stays tests passed successfully!');
}

if (require.main === module) {
  run().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { run };
