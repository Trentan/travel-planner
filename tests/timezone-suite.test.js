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
    return { getClientBrowserTimezone, cleanCityTimezoneName, getCityTimezone, getTimezoneOffsetMinutes, getTimezoneDeltaHours, formatTimezoneDeltaBadge, convertLocalToHomeTime, setCitiesData: (list) => { citiesData = list; window.citiesData = list; } };
  `;

  const evalFn = new Function('window', 'localStorage', 'Intl', combinedCode);
  const tzUtils = evalFn(windowMock, windowMock.localStorage, Intl);

  // Verify getClientBrowserTimezone
  assert(typeof tzUtils.getClientBrowserTimezone === 'function', 'getClientBrowserTimezone should be exposed as a function');

  // Case 1: Happy path with resolved timeZone
  const mockIntlNy = {
    DateTimeFormat: () => ({
      resolvedOptions: () => ({ timeZone: 'America/New_York' })
    })
  };
  const tzUtilsNy = evalFn(windowMock, windowMock.localStorage, mockIntlNy);
  assert(tzUtilsNy.getClientBrowserTimezone() === 'America/New_York', `Expected America/New_York, got ${tzUtilsNy.getClientBrowserTimezone()}`);

  const mockIntlTokyo = {
    DateTimeFormat: () => ({
      resolvedOptions: () => ({ timeZone: 'Asia/Tokyo' })
    })
  };
  const tzUtilsTokyo = evalFn(windowMock, windowMock.localStorage, mockIntlTokyo);
  assert(tzUtilsTokyo.getClientBrowserTimezone() === 'Asia/Tokyo', `Expected Asia/Tokyo, got ${tzUtilsTokyo.getClientBrowserTimezone()}`);

  // Case 2: Fallback when resolved timeZone is empty string or undefined
  const mockIntlEmpty = {
    DateTimeFormat: () => ({
      resolvedOptions: () => ({ timeZone: '' })
    })
  };
  const tzUtilsEmpty = evalFn(windowMock, windowMock.localStorage, mockIntlEmpty);
  assert(tzUtilsEmpty.getClientBrowserTimezone() === 'UTC', `Expected UTC fallback for empty string, got ${tzUtilsEmpty.getClientBrowserTimezone()}`);

  const mockIntlUndefined = {
    DateTimeFormat: () => ({
      resolvedOptions: () => ({ timeZone: undefined })
    })
  };
  const tzUtilsUndefined = evalFn(windowMock, windowMock.localStorage, mockIntlUndefined);
  assert(tzUtilsUndefined.getClientBrowserTimezone() === 'UTC', `Expected UTC fallback for undefined timeZone, got ${tzUtilsUndefined.getClientBrowserTimezone()}`);

  // Case 3: Error handling when Intl.DateTimeFormat or resolvedOptions throws
  const mockIntlError = {
    DateTimeFormat: () => {
      throw new Error('Intl disabled in environment');
    }
  };
  const tzUtilsError = evalFn(windowMock, windowMock.localStorage, mockIntlError);
  assert(tzUtilsError.getClientBrowserTimezone() === 'UTC', `Expected UTC fallback when exception is thrown, got ${tzUtilsError.getClientBrowserTimezone()}`);

  // Verify cleanCityTimezoneName
  assert(tzUtils.cleanCityTimezoneName(null) === '', 'null locationName should return empty string');
  assert(tzUtils.cleanCityTimezoneName(undefined) === '', 'undefined locationName should return empty string');
  assert(tzUtils.cleanCityTimezoneName(123) === '', 'numeric locationName should return empty string');
  assert(tzUtils.cleanCityTimezoneName({}) === '', 'object locationName should return empty string');

  assert(tzUtils.cleanCityTimezoneName('Tokyo') === 'Tokyo', 'Simple city name should remain Tokyo');
  assert(tzUtils.cleanCityTimezoneName('Paris, France') === 'Paris', 'Comma separated string should strip country/subregion');
  assert(tzUtils.cleanCityTimezoneName('London - Heathrow') === 'London', 'Space-hyphen-space separated string should strip suffix');
  assert(tzUtils.cleanCityTimezoneName('New York — JFK') === 'New York', 'Space-emdash-space separated string should strip suffix');
  assert(tzUtils.cleanCityTimezoneName('Berlin – Tegel') === 'Berlin', 'Space-endash-space separated string should strip suffix');

  assert(tzUtils.cleanCityTimezoneName('🗼 Tokyo') === 'Tokyo', 'Emoji prefix should be stripped');
  assert(tzUtils.cleanCityTimezoneName('🇯🇵 Tokyo 🌸') === 'Tokyo', 'Flag emojis and symbol emojis should be stripped');
  assert(tzUtils.cleanCityTimezoneName('Rome (Trip Start)') === 'Rome', 'Parenthetical suffix should be stripped');
  assert(tzUtils.cleanCityTimezoneName('🇯🇵 Tokyo, Japan — Haneda (Trip Start)') === 'Tokyo', 'Combined emojis, comma, dash, parenthetical suffix should reduce to Tokyo');

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

  // Comprehensive test suite for getTimezoneDeltaHours
  // 1. Falsy/missing input handling
  assert(tzUtils.getTimezoneDeltaHours(null, 'Tokyo') === 0, 'Null fromCity should return 0');
  assert(tzUtils.getTimezoneDeltaHours('Tokyo', null) === 0, 'Null toCity should return 0');
  assert(tzUtils.getTimezoneDeltaHours('', 'Tokyo') === 0, 'Empty string fromCity should return 0');
  assert(tzUtils.getTimezoneDeltaHours('Tokyo', '') === 0, 'Empty string toCity should return 0');
  assert(tzUtils.getTimezoneDeltaHours(undefined, undefined) === 0, 'Undefined cities should return 0');

  // 2. Same city or identical timezone
  assert(tzUtils.getTimezoneDeltaHours('Tokyo', 'Tokyo') === 0, 'Same city should return 0 delta');
  assert(tzUtils.getTimezoneDeltaHours('Paris', 'Paris') === 0, 'Identical city names should return 0 delta');

  // 3. Integer timezone deltas
  const londonToBangkokDelta = tzUtils.getTimezoneDeltaHours('London', 'Bangkok', '2026-06-15');
  assert(londonToBangkokDelta === 6, `London to Bangkok delta in June should be +6 hours, got ${londonToBangkokDelta}`);

  const bangkokToLondonDelta = tzUtils.getTimezoneDeltaHours('Bangkok', 'London', '2026-06-15');
  assert(bangkokToLondonDelta === -6, `Bangkok to London delta in June should be -6 hours, got ${bangkokToLondonDelta}`);

  const tokyoToParisDelta = tzUtils.getTimezoneDeltaHours('Tokyo', 'Paris', '2026-06-15');
  assert(tokyoToParisDelta === -7, `Tokyo to Paris delta in June should be -7 hours, got ${tokyoToParisDelta}`);

  const nyToLondonDelta = tzUtils.getTimezoneDeltaHours('New York', 'London', '2026-06-15');
  assert(nyToLondonDelta === 5, `New York to London delta in June should be +5 hours, got ${nyToLondonDelta}`);

  // 4. Fractional / half-hour timezone deltas
  const tokyoToAdelaideDelta = tzUtils.getTimezoneDeltaHours('Tokyo', 'Adelaide', '2026-06-15');
  assert(tokyoToAdelaideDelta === 0.5, `Tokyo (UTC+9) to Adelaide (ACST UTC+9:30) in June should be +0.5 hours, got ${tokyoToAdelaideDelta}`);

  const adelaideToTokyoDelta = tzUtils.getTimezoneDeltaHours('Adelaide', 'Tokyo', '2026-06-15');
  assert(adelaideToTokyoDelta === -0.5, `Adelaide (ACST UTC+9:30) to Tokyo (UTC+9) in June should be -0.5 hours, got ${adelaideToTokyoDelta}`);

  // 5. Seasonal DST differences across dates
  const londonToSydneyJune = tzUtils.getTimezoneDeltaHours('London', 'Sydney', '2026-06-15');
  assert(londonToSydneyJune === 9, `London (BST +1) to Sydney (AEST +10) in June should be +9 hours, got ${londonToSydneyJune}`);

  const londonToSydneyJan = tzUtils.getTimezoneDeltaHours('London', 'Sydney', '2026-01-15');
  assert(londonToSydneyJan === 11, `London (GMT +0) to Sydney (AEDT +11) in Jan should be +11 hours, got ${londonToSydneyJan}`);

  // 6. Custom citiesData timezone support
  tzUtils.setCitiesData([
    { name: 'CustomCityAlpha', timezone: 'America/Los_Angeles' },
    { name: 'CustomCityBeta', timezone: 'Asia/Tokyo' }
  ]);
  const customCityDelta = tzUtils.getTimezoneDeltaHours('CustomCityAlpha', 'CustomCityBeta', '2026-06-15');
  assert(customCityDelta === 16, `CustomCityAlpha (LA PDT -7) to CustomCityBeta (Tokyo JST +9) in June should be +16 hours, got ${customCityDelta}`);

  // 7. Default date parameter omitted
  const defaultDateDelta = tzUtils.getTimezoneDeltaHours('London', 'Bangkok');
  assert(typeof defaultDateDelta === 'number' && !isNaN(defaultDateDelta), `Default date input should produce a valid number delta, got ${defaultDateDelta}`);

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
