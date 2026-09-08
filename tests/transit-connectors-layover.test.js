/* ==========================================================================
   TEST SUITE: Transit Connectors & Layover Transfer Warnings
   ========================================================================== */

const assert = require('assert');

// Mock browser globals
const store = {};
global.localStorage = {
  getItem: (key) => store[key] || null,
  setItem: (key, val) => { store[key] = String(val); },
  removeItem: (key) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};

global.window = global;
global.window.addEventListener = () => {};
global.document = {
  body: { classList: { contains: () => false } },
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null,
  addEventListener: () => {}
};

// Require dependencies
require('../js/default-data.js');
require('../js/utils.js');
require('../js/timezone.js');
require('../js/data.js');
require('../js/transport.js');
require('../js/itinerary.js');

async function run() {
  console.log('Running Transit Connectors & Layover Transfer Warnings test suite...');

  const calculateLayoverBuffer = global.calculateLayoverBuffer;
  const renderDailyTimelineConnectorRow = global.renderDailyTimelineConnectorRow;

  // 1. Test Flight Layovers
  {
    console.log('Testing Flight Layover Thresholds...');

    const flightArrival = {
      transportType: 'flight',
      provider: 'EVA Air',
      routeCode: 'BR067',
      arrivalDate: '2026-06-10',
      arrivalTime: '10:00'
    };

    // 1a. Normal flight layover (2 hours = 120m)
    const flightDepartureNormal = {
      transportType: 'flight',
      provider: 'Qantas',
      routeCode: 'QF001',
      departureDate: '2026-06-10',
      departureTime: '12:00'
    };
    const normalBuf = calculateLayoverBuffer(flightArrival, flightDepartureNormal);
    assert.strictEqual(normalBuf.bufferMinutes, 120);
    assert.strictEqual(normalBuf.level, 'normal');
    assert.strictEqual(normalBuf.formattedBuffer, '2h');

    // 1b. Tight flight layover (75m, < 90m tight threshold) -> Advisory (Yellow)
    const flightDepartureTight = {
      transportType: 'flight',
      provider: 'Qantas',
      routeCode: 'QF001',
      departureDate: '2026-06-10',
      departureTime: '11:15'
    };
    const tightBuf = calculateLayoverBuffer(flightArrival, flightDepartureTight);
    assert.strictEqual(tightBuf.bufferMinutes, 75);
    assert.strictEqual(tightBuf.level, 'advisory');
    assert.strictEqual(tightBuf.modeIcon, '✈️');
    assert.ok(tightBuf.badgeText.includes('Tight Connection'));

    // 1c. Critical flight layover (45m, < 60m critical threshold) -> Alert (Red)
    const flightDepartureCritical = {
      transportType: 'flight',
      provider: 'Qantas',
      routeCode: 'QF001',
      departureDate: '2026-06-10',
      departureTime: '10:45'
    };
    const criticalBuf = calculateLayoverBuffer(flightArrival, flightDepartureCritical);
    assert.strictEqual(criticalBuf.bufferMinutes, 45);
    assert.strictEqual(criticalBuf.level, 'alert');
    assert.ok(criticalBuf.badgeText.includes('Critical Layover'));

    // 1d. Negative flight buffer / Clash (-30m) -> Alert (Red)
    const flightDepartureClash = {
      transportType: 'flight',
      provider: 'Qantas',
      routeCode: 'QF001',
      departureDate: '2026-06-10',
      departureTime: '09:30'
    };
    const clashBuf = calculateLayoverBuffer(flightArrival, flightDepartureClash);
    assert.strictEqual(clashBuf.bufferMinutes, -30);
    assert.strictEqual(clashBuf.level, 'alert');
    assert.strictEqual(clashBuf.isClash, true);
    assert.ok(clashBuf.badgeText.includes('Schedule Clash'));
  }

  // 2. Test Train Transfers
  {
    console.log('Testing Train Transfer Thresholds...');

    const trainArrival = {
      transportType: 'train',
      provider: 'Eurostar',
      routeCode: 'ES9010',
      arrivalDate: '2026-06-15',
      arrivalTime: '14:00'
    };

    // 2a. Normal train transfer (30m)
    const trainDepNormal = {
      transportType: 'train',
      provider: 'SBB',
      routeCode: 'IC500',
      departureDate: '2026-06-15',
      departureTime: '14:30'
    };
    const normalTrainBuf = calculateLayoverBuffer(trainArrival, trainDepNormal);
    assert.strictEqual(normalTrainBuf.bufferMinutes, 30);
    assert.strictEqual(normalTrainBuf.level, 'normal');

    // 2b. Tight train transfer (18m, < 20m tight threshold) -> Advisory (Yellow)
    const trainDepTight = {
      transportType: 'train',
      provider: 'SBB',
      routeCode: 'IC500',
      departureDate: '2026-06-15',
      departureTime: '14:18'
    };
    const tightTrainBuf = calculateLayoverBuffer(trainArrival, trainDepTight);
    assert.strictEqual(tightTrainBuf.bufferMinutes, 18);
    assert.strictEqual(tightTrainBuf.level, 'advisory');
    assert.strictEqual(tightTrainBuf.modeIcon, '🚆');

    // 2c. Critical train transfer (10m, < 15m critical threshold) -> Alert (Red)
    const trainDepCritical = {
      transportType: 'train',
      provider: 'SBB',
      routeCode: 'IC500',
      departureDate: '2026-06-15',
      departureTime: '14:10'
    };
    const criticalTrainBuf = calculateLayoverBuffer(trainArrival, trainDepCritical);
    assert.strictEqual(criticalTrainBuf.bufferMinutes, 10);
    assert.strictEqual(criticalTrainBuf.level, 'alert');
  }

  // 3. Test Timeline Connector HTML Generation
  {
    console.log('Testing Timeline Connector HTML rendering...');

    const itemA = {
      type: 'transport',
      transportType: 'flight',
      provider: 'Lufthansa',
      routeCode: 'LH102',
      startTime: '08:00',
      endTime: '10:00',
      dateStr: '2026-06-20'
    };

    const itemB = {
      type: 'transport',
      transportType: 'flight',
      provider: 'Austrian',
      routeCode: 'OS501',
      startTime: '10:45',
      dateStr: '2026-06-20'
    };

    const connectorHtml = renderDailyTimelineConnectorRow(itemA, itemB, false);
    assert.ok(connectorHtml.includes('daily-timeline-connector'));
    assert.ok(connectorHtml.includes('is-warning-alert')); // 45m flight layover < 60m is alert
    assert.ok(connectorHtml.includes('Critical Layover'));
    assert.ok(connectorHtml.includes('Lufthansa → Austrian'));
  }

  console.log('✅ ALL TRANSIT CONNECTORS & LAYOVER WARNING TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  run().catch(err => {
    console.error(err);
    process.exitCode = 1;
  });
}

module.exports = { run };
