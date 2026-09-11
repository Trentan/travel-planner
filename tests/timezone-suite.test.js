const fs = require('fs');
const path = require('path');
const { assert } = require('./lib/test-helpers');

async function run() {
  console.log('Running timezone calculations unit test suite...');
  const utilsCode = fs.readFileSync(path.join(__dirname, '../js/utils.js'), 'utf8');
  const dataCode = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
  const timezoneCode = fs.readFileSync(path.join(__dirname, '../js/timezone.js'), 'utf8');

  const documentMock = {
    getElementById: () => null,
    body: { addEventListener: () => {}, appendChild: () => {} },
    addEventListener: () => {}
  };

  const windowMock = {
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    indexedDB: null,
    document: documentMock,
    addEventListener: () => {}
  };

  const combinedCode = `
    const document = window.document;
    ${utilsCode}
    ${dataCode}
    ${timezoneCode}
    return { getCityTimezone, getTimezoneOffsetMinutes, getTimezoneDeltaHours, formatTimezoneDeltaBadge, convertLocalToHomeTime };
  `;

  const evalFn = new Function('window', 'localStorage', 'Intl', combinedCode);
  const tzUtils = evalFn(windowMock, windowMock.localStorage, Intl);

  // Verify city timezone lookups
  assert(tzUtils.getCityTimezone('Tokyo') === 'Asia/Tokyo', `Tokyo timezone lookup should be Asia/Tokyo, got ${tzUtils.getCityTimezone('Tokyo')}`);
  assert(tzUtils.getCityTimezone('London') === 'Europe/London', `London timezone lookup should be Europe/London, got ${tzUtils.getCityTimezone('London')}`);
  assert(tzUtils.getCityTimezone('Paris') === 'Europe/Paris', `Paris timezone lookup should be Europe/Paris, got ${tzUtils.getCityTimezone('Paris')}`);
  assert(tzUtils.getCityTimezone('Bangkok') === 'Asia/Bangkok', `Bangkok timezone lookup should be Asia/Bangkok, got ${tzUtils.getCityTimezone('Bangkok')}`);
  assert(tzUtils.getCityTimezone('New York') === 'America/New_York', `New York timezone lookup should be America/New_York, got ${tzUtils.getCityTimezone('New York')}`);

  // Verify offset calculations on fixed date (2026-06-15)
  const tokyoOffset = tzUtils.getTimezoneOffsetMinutes('Asia/Tokyo', '2026-06-15');
  assert(tokyoOffset === 540, `Tokyo offset in June should be 540 minutes (+9 hrs), got ${tokyoOffset}`);

  const londonOffset = tzUtils.getTimezoneOffsetMinutes('Europe/London', '2026-06-15');
  assert(londonOffset === 60, `London offset in June should be 60 minutes (+1 hr BST), got ${londonOffset}`);

  const bangkokOffset = tzUtils.getTimezoneOffsetMinutes('Asia/Bangkok', '2026-06-15');
  assert(bangkokOffset === 420, `Bangkok offset in June should be 420 minutes (+7 hrs), got ${bangkokOffset}`);

  // Verify delta hours
  const londonToBangkokDelta = tzUtils.getTimezoneDeltaHours('London', 'Bangkok', '2026-06-15');
  assert(londonToBangkokDelta === 6, `London to Bangkok delta should be +6 hours, got ${londonToBangkokDelta}`);

  const tokyoToParisDelta = tzUtils.getTimezoneDeltaHours('Tokyo', 'Paris', '2026-06-15');
  assert(tokyoToParisDelta === -7, `Tokyo to Paris delta should be -7 hours, got ${tokyoToParisDelta}`);

  // Verify transition badges
  assert(tzUtils.formatTimezoneDeltaBadge('London', 'Bangkok', '2026-06-15') === '🕐 +6 hrs', `London to Bangkok badge should format as "🕐 +6 hrs", got ${tzUtils.formatTimezoneDeltaBadge('London', 'Bangkok', '2026-06-15')}`);
  assert(tzUtils.formatTimezoneDeltaBadge('Tokyo', 'Paris', '2026-06-15') === '🕐 -7 hrs', `Tokyo to Paris badge should format as "🕐 -7 hrs", got ${tzUtils.formatTimezoneDeltaBadge('Tokyo', 'Paris', '2026-06-15')}`);

  // Verify local to home time conversion
  // Local 14:00 in Tokyo (UTC+9) converted to Home London (UTC+1 in June): -8 hrs -> 06:00
  const homeConverted = tzUtils.convertLocalToHomeTime('14:00', '2026-06-15', 'Tokyo', 'London');
  assert(homeConverted.includes('06:00'), `Local 14:00 in Tokyo should convert to 06:00 in London, got ${homeConverted}`);

  console.log('✅ ALL TIMEZONE UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  run().catch(error => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}

module.exports = { run };
