const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('Running buildExportDailyTimelineItems unit tests...');

global.document = global.document || {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};

global.window = global.window || {
  addEventListener: () => {},
  removeEventListener: () => {},
  BroadcastChannel: function() {
    this.postMessage = () => {};
    this.onmessage = null;
  }
};

global.localStorage = global.localStorage || {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

const dataCode = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
eval(dataCode);

function runBuildExportDailyTimelineItemsTests() {
  // Test 1: Options object invocation with journeys, stays, and activities
  const leg = { id: 'leg-1', label: 'Tokyo' };
  const day = {
    date: '2026-05-10',
    from: 'Tokyo',
    to: 'Tokyo',
    activityItems: [
      { text: 'Visit Shibuya Crossing', startTime: '10:00', time: '2 hrs', cost: '0' }
    ]
  };
  const journeysData = [
    {
      legId: 'leg-1',
      departureDate: '2026-05-10',
      departureTime: '08:00',
      arrivalDate: '2026-05-10',
      arrivalTime: '09:00',
      fromLocation: 'Tokyo',
      toLocation: 'Tokyo',
      journeyName: 'Express Train',
      provider: 'JR',
      cost: '15'
    }
  ];
  const staysData = [
    {
      city: 'Tokyo',
      checkIn: '2026-05-10',
      checkInTime: '15:00',
      propertyName: 'Hotel Gracery',
      totalCost: '120'
    }
  ];

  const timelineItemsOptions = buildExportDailyTimelineItems({
    leg,
    day,
    legIdx: 0,
    dayIdx: 0,
    journeysData,
    staysData
  });

  assert.strictEqual(Array.isArray(timelineItemsOptions), true, 'Returned items should be an array');
  assert.strictEqual(timelineItemsOptions.length, 3, 'Should extract 3 items (journey, stay check-in, activity)');
  assert(timelineItemsOptions[0].text.includes('Transport: Express Train'), 'First sorted item should be early transport');
  assert(timelineItemsOptions[1].text.includes('Activity: Visit Shibuya Crossing'), 'Second sorted item should be 10:00 activity');
  assert(timelineItemsOptions[2].text.includes('Stay check-in: Hotel Gracery'), 'Third sorted item should be 15:00 check-in');

  // Test 2: Positional parameter backwards compatibility invocation
  const timelineItemsPositional = buildExportDailyTimelineItems(leg, day, 0, 0, journeysData, staysData);
  assert.strictEqual(timelineItemsPositional.length, 3, 'Positional signature should produce identical 3 items');
  assert.deepStrictEqual(timelineItemsOptions, timelineItemsPositional, 'Options object and positional output should match');

  // Test 3: Null or missing day handling
  assert.deepStrictEqual(buildExportDailyTimelineItems(), [], 'Empty options object should return empty array');
  assert.deepStrictEqual(buildExportDailyTimelineItems({ leg }), [], 'Options with missing day should return empty array');

  console.log('✅ ALL buildExportDailyTimelineItems UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  runBuildExportDailyTimelineItemsTests();
}

module.exports = { runBuildExportDailyTimelineItemsTests };
