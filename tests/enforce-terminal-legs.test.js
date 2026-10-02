const path = require('path');
const { assert, createVmContext, runScriptInContext, loadSource } = require('./lib/test-helpers');

function runEnforceTerminalLegsTests() {
  console.log('Running enforceTerminalLegs unit tests...');

  const legEngineCode = loadSource(path.join('js', 'leg-engine.js'));

  function createTestContext(extraGlobals = {}) {
    const context = createVmContext({
      titleData: undefined,
      getTripStartDate: undefined,
      getWeekdayLabelForTripDate: undefined,
      ...extraGlobals
    });
    runScriptInContext(legEngineCode, context, 'js/leg-engine.js');
    return context;
  }

  // 1. Non-array and empty array inputs
  {
    const ctx = createTestContext();
    const { enforceTerminalLegs } = ctx;

    try {
      enforceTerminalLegs(null);
      enforceTerminalLegs(undefined);
      enforceTerminalLegs('invalid');
      enforceTerminalLegs(123);
      enforceTerminalLegs({});
    } catch (err) {
      assert(false, `Falsy/non-array inputs should not throw: ${err.message}`);
    }

    const emptyArr = [];
    enforceTerminalLegs(emptyArr);
    assert(emptyArr.length === 0, 'Empty array should remain empty');
  }

  // 2. Single leg array (non-terminal)
  {
    const ctx = createTestContext();
    const { enforceTerminalLegs } = ctx;

    const singleLeg = [
      {
        id: 'leg_paris',
        label: 'Paris',
        days: [{ date: '2026-06-10', day: 'Wed', from: 'Paris', to: 'Paris' }]
      }
    ];

    enforceTerminalLegs(singleLeg);

    // Non-terminal single leg gets prepended with start leg, and because array length becomes > 1,
    // a return leg is appended at the end.
    assert(singleLeg.length === 3, 'Single non-terminal leg should expand to 3 legs (start, city, return)');
    assert(singleLeg[0].type === 'start', 'First leg should be typed as start');
    assert(singleLeg[0].label === 'Home (Trip Start)', 'First leg label should default to Home (Trip Start)');
    assert(singleLeg[0].days[0].date === '2026-06-10', 'Start leg should inherit trip start date from first leg');
    assert(singleLeg[0].days[0].from === 'Home', 'Start leg departure from should be Home');

    assert(singleLeg[1].id === 'leg_paris', 'Middle leg should be original Paris leg');

    assert(singleLeg[2].type === 'return', 'Last leg should be typed as return');
    assert(singleLeg[2].label === 'Home (Trip Finish)', 'Last leg label should default to Home (Trip Finish)');
    assert(singleLeg[2].days[0].to === 'Home', 'Return leg destination to should be Home');
  }

  // 3. Single leg array (already start leg)
  {
    const ctx = createTestContext();
    const { enforceTerminalLegs } = ctx;

    const startLegOnly = [
      {
        id: 'leg_start_1',
        type: 'start',
        label: 'Brisbane (Trip Start)',
        days: [{ date: '2026-06-10', from: 'Brisbane', to: 'Paris' }]
      }
    ];

    enforceTerminalLegs(startLegOnly);

    assert(startLegOnly.length === 1, 'Single start leg array should maintain length of 1');
    assert(startLegOnly[0].type === 'start', 'Leg type should remain start');
    assert(startLegOnly[0].days[0].from === 'Brisbane', 'Start leg day from should remain Brisbane');
  }

  // 4. Two non-terminal legs array
  {
    const ctx = createTestContext();
    const { enforceTerminalLegs } = ctx;

    const legs = [
      {
        id: 'leg_paris',
        label: 'Paris',
        days: [{ date: '2026-06-10', from: 'Paris', to: 'Paris' }]
      },
      {
        id: 'leg_rome',
        label: 'Rome',
        days: [{ date: '2026-06-15', from: 'Rome', to: 'Rome' }]
      }
    ];

    enforceTerminalLegs(legs);

    assert(legs.length === 4, 'Two non-terminal legs should expand to 4 legs');
    assert(legs[0].type === 'start', 'First leg is start terminal leg');
    assert(legs[1].id === 'leg_paris', 'Second leg is Paris');
    assert(legs[2].id === 'leg_rome', 'Third leg is Rome');
    assert(legs[3].type === 'return', 'Fourth leg is return terminal leg');
    assert(legs[3].days[0].to === 'Home', 'Return leg destination is Home');
  }

  // 5. Array with existing start and return legs
  {
    const ctx = createTestContext();
    const { enforceTerminalLegs } = ctx;

    const legs = [
      {
        id: 'departure',
        label: 'Sydney (Trip Start)',
        type: 'start',
        days: [{ date: '2026-06-01', from: '', to: '' }]
      },
      {
        id: 'leg_tokyo',
        label: 'Tokyo',
        type: 'city',
        days: [{ date: '2026-06-02', from: 'Tokyo', to: 'Tokyo' }]
      },
      {
        id: 'return',
        label: 'Sydney (Trip Finish)',
        type: 'return',
        days: [{ date: '2026-06-10', from: '', to: '' }]
      }
    ];

    enforceTerminalLegs(legs);

    assert(legs.length === 3, 'Array with existing terminal legs should maintain length of 3');
    assert(legs[0].type === 'start', 'First leg type is start');
    assert(legs[0].days[0].from === 'Sydney', 'First leg day.from is set to startHome (Sydney)');
    assert(legs[0].days[0].to === 'Tokyo', 'First leg day.to is updated to Tokyo');

    assert(legs[2].type === 'return', 'Last leg type is return');
    assert(legs[2].days[0].from === 'Tokyo', 'Last leg day.from is updated to Tokyo');
    assert(legs[2].days[0].to === 'Sydney', 'Last leg day.to is updated to Sydney');
  }

  // 6. Custom titleData.homeCity and custom getTripStartDate
  {
    const ctx = createTestContext({
      titleData: { homeCity: '  Melbourne  ' },
      getTripStartDate: () => '2026-08-01'
    });
    const { enforceTerminalLegs } = ctx;

    const legs = [
      {
        id: 'leg_london',
        label: 'London',
        days: [{ date: '2026-08-05' }]
      },
      {
        id: 'leg_edinburgh',
        label: 'Edinburgh',
        days: [{ date: '2026-08-10' }]
      }
    ];

    enforceTerminalLegs(legs);

    assert(legs[0].label === 'Melbourne (Trip Start)', 'Start leg should use titleData.homeCity Melbourne');
    assert(legs[0].days[0].date === '2026-08-01', 'Start leg should use date from getTripStartDate()');
    assert(legs[0].days[0].day === 'Sat', 'Start leg day label for 2026-08-01 should be Sat');

    assert(legs[3].label === 'Melbourne (Trip Finish)', 'Return leg should use titleData.homeCity Melbourne');
    assert(legs[3].days[0].date === '2026-08-10', 'Return leg should use date from last leg day');
    assert(legs[3].days[0].day === 'Mon', 'Return leg day label for 2026-08-10 should be Mon');
  }

  // 7. Edge case: Leg with empty or missing days array
  {
    const ctx = createTestContext();
    const { enforceTerminalLegs } = ctx;

    const legsWithEmptyDays = [
      { id: 'leg_no_days_1', label: 'Berlin' },
      { id: 'leg_no_days_2', label: 'Munich', days: [] }
    ];

    enforceTerminalLegs(legsWithEmptyDays);

    assert(legsWithEmptyDays.length === 4, 'Should handle legs without days gracefully and create terminal legs');
    assert(legsWithEmptyDays[0].type === 'start', 'Prepended start leg created');
    assert(legsWithEmptyDays[3].type === 'return', 'Appended return leg created');
  }

  // 8. Implicit terminal legs by ID suffix or label content
  {
    const ctx = createTestContext();
    const { enforceTerminalLegs } = ctx;

    const implicitLegs = [
      {
        id: 'my-trip-start',
        label: 'Departure (Trip Start)',
        days: [{ date: '2026-05-01' }]
      },
      {
        id: 'leg_rome',
        label: 'Rome',
        days: [{ date: '2026-05-02' }]
      },
      {
        id: 'my-trip-finish',
        label: 'Return (Trip Finish)',
        days: [{ date: '2026-05-10' }]
      }
    ];

    enforceTerminalLegs(implicitLegs);

    assert(implicitLegs.length === 3, 'Implicit terminal legs should be recognized and not duplicated');
    assert(implicitLegs[0].type === 'start', 'Implicit start leg has type updated to start');
    assert(implicitLegs[2].type === 'return', 'Implicit return leg has type updated to return');
  }

  console.log('✅ ALL enforceTerminalLegs UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runEnforceTerminalLegsTests();
  } catch (err) {
    console.error('❌ enforceTerminalLegs TEST FAILED:', err.stack || err.message);
    process.exit(1);
  }
}

module.exports = { runEnforceTerminalLegsTests };
