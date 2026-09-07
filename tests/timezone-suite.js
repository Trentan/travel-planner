const assert = require('assert');

// Mock browser environment
global.window = global;
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};
global.window.addEventListener = () => {};
global.document = {
  addEventListener() {},
  querySelector() { return null; },
  querySelectorAll() { return []; },
  getElementById() { return null; }
};

// Load dependencies
require('../js/utils.js');
require('../js/data.js');
require('../js/transport.js');

async function runTimezoneSuite() {
  console.log('Running Timezone Suite...');

  // 1. Test getCityTimezone
  assert.strictEqual(getCityTimezone('Tokyo'), 'Asia/Tokyo');
  assert.strictEqual(getCityTimezone('London'), 'Europe/London');
  assert.strictEqual(getCityTimezone('Paris'), 'Europe/Paris');
  assert.strictEqual(getCityTimezone('Bangkok'), 'Asia/Bangkok');
  assert.strictEqual(getCityTimezone('Sydney'), 'Australia/Sydney');
  assert.strictEqual(getCityTimezone('New York'), 'America/New_York');
  console.log('  ✅ City IANA timezone resolution tests passed');

  // 2. Test getTimezoneOffsetMinutes
  const dateIso = '2026-06-15';
  const londonOffset = getTimezoneOffsetMinutes('Europe/London', dateIso); // BST UTC+1 = +60
  const tokyoOffset = getTimezoneOffsetMinutes('Asia/Tokyo', dateIso); // JST UTC+9 = +540
  const bangkokOffset = getTimezoneOffsetMinutes('Asia/Bangkok', dateIso); // ICT UTC+7 = +420
  const nyOffset = getTimezoneOffsetMinutes('America/New_York', dateIso); // EDT UTC-4 = -240

  assert.strictEqual(londonOffset, 60, 'London summer offset should be +60 mins (UTC+1)');
  assert.strictEqual(tokyoOffset, 540, 'Tokyo offset should be +540 mins (UTC+9)');
  assert.strictEqual(bangkokOffset, 420, 'Bangkok offset should be +420 mins (UTC+7)');
  assert.strictEqual(nyOffset, -240, 'New York summer offset should be -240 mins (UTC-4)');
  console.log('  ✅ Timezone offset calculations (JST, UTC, BST, EDT) passed');

  // 3. Test getTimezoneDeltaHours
  const londonToBangkokDelta = getTimezoneDeltaHours('Europe/London', 'Asia/Bangkok', dateIso);
  const tokyoToParisDelta = getTimezoneDeltaHours('Asia/Tokyo', 'Europe/Paris', dateIso); // Paris CEST UTC+2 (+120), Tokyo UTC+9 (+540) => 120-540 = -420 / 60 = -7

  assert.strictEqual(londonToBangkokDelta, 6, 'London to Bangkok delta should be +6 hrs');
  assert.strictEqual(tokyoToParisDelta, -7, 'Tokyo to Paris delta should be -7 hrs');
  console.log('  ✅ Cross-timezone delta calculations passed');

  // 4. Test formatTimezoneDeltaBadge
  const badge1 = formatTimezoneDeltaBadge('Europe/London', 'Asia/Bangkok', dateIso);
  const badge2 = formatTimezoneDeltaBadge('Asia/Tokyo', 'Europe/Paris', dateIso);
  const badgeSame = formatTimezoneDeltaBadge('Europe/London', 'Europe/London', dateIso);

  assert.strictEqual(badge1, '🕐 +6 hrs Timezone Change');
  assert.strictEqual(badge2, '🕐 -7 hrs Timezone Change');
  assert.strictEqual(badgeSame, '');
  console.log('  ✅ Timezone transition badge formatting passed');

  // 5. Test convertTimeBetweenTimezones & formatDualTimeDisplay
  const conv1 = convertTimeBetweenTimezones('14:00', dateIso, 'Asia/Tokyo', 'Europe/London');
  assert.deepStrictEqual(conv1, { time: '06:00', dayShift: 0, text: '06:00' });

  const conv2 = convertTimeBetweenTimezones('22:00', dateIso, 'Europe/London', 'Asia/Tokyo');
  assert.deepStrictEqual(conv2, { time: '06:00', dayShift: 1, text: '06:00 +1d' });

  const dualDisplay = formatDualTimeDisplay('14:00', dateIso, 'Asia/Tokyo', 'Europe/London');
  assert.strictEqual(dualDisplay, '🏡 Home: 06:00');
  console.log('  ✅ Dual timezone conversion and formatting tests passed');

  console.log('ALL TIMEZONE TESTS PASSED CLEANLY! 🎉');
}

if (require.main === module) {
  runTimezoneSuite().catch(err => {
    console.error('Timezone suite failed:', err);
    process.exit(1);
  });
}

module.exports = { runTimezoneSuite };
