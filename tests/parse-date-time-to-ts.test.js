const fs = require('fs');
const path = require('path');
const { assert } = require('./lib/test-helpers');

async function run() {
  console.log('Running parseDateTimeToTs test suite...');
  const transportCode = fs.readFileSync(path.join(__dirname, '../js/transport.js'), 'utf8');

  const documentMock = {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {}
  };

  const windowMock = {
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    indexedDB: null,
    document: documentMock,
    addEventListener: () => {},
    journeys: []
  };

  // Test 1: Function loaded without normalizeDate present
  const codeWithoutNormalizeDate = `
    const document = window.document;
    ${transportCode}
    return { parseDateTimeToTs };
  `;
  const evalWithoutNormalize = new Function('window', 'localStorage', codeWithoutNormalizeDate);
  const { parseDateTimeToTs } = evalWithoutNormalize(windowMock, windowMock.localStorage);

  // 1. Falsy/empty dateStr inputs
  assert(parseDateTimeToTs(null) === null, 'null dateStr should return null');
  assert(parseDateTimeToTs(undefined) === null, 'undefined dateStr should return null');
  assert(parseDateTimeToTs('') === null, 'empty string dateStr should return null');
  assert(parseDateTimeToTs(false) === null, 'boolean false dateStr should return null');

  // 2. Standard ISO YYYY-MM-DD date and time inputs
  const expectedTs1 = new Date('2026-06-15T14:30:00').getTime();
  assert(parseDateTimeToTs('2026-06-15', '14:30') === expectedTs1, 'valid ISO date and time should return expected timestamp');

  // 3. Falsy / Omitted timeStr defaults to '00:00'
  const expectedTsMidnight = new Date('2026-06-15T00:00:00').getTime();
  assert(parseDateTimeToTs('2026-06-15') === expectedTsMidnight, 'omitted timeStr should default to 00:00');
  assert(parseDateTimeToTs('2026-06-15', null) === expectedTsMidnight, 'null timeStr should default to 00:00');
  assert(parseDateTimeToTs('2026-06-15', '') === expectedTsMidnight, 'empty string timeStr should default to 00:00');
  assert(parseDateTimeToTs('2026-06-15', undefined) === expectedTsMidnight, 'undefined timeStr should default to 00:00');

  // 4. White-space trimmed timeStr
  const expectedTsTrimmed = new Date('2026-06-15T09:15:00').getTime();
  assert(parseDateTimeToTs('2026-06-15', '  09:15  ') === expectedTsTrimmed, 'padded timeStr should be trimmed and parsed');

  // 5. Fallback path when ISO candidate produces NaN (e.g., 'Jun 15')
  // 'Jun 15T10:00:00' -> NaN, fallback 'Jun 15 2026 10:00' -> valid Date timestamp
  const fallbackTs = parseDateTimeToTs('Jun 15', '10:00');
  const expectedFallbackTs = new Date('Jun 15 2026 10:00').getTime();
  assert(fallbackTs === expectedFallbackTs, 'legacy date format "Jun 15" should parse via fallback path');
  assert(fallbackTs !== null && !isNaN(fallbackTs), 'fallback timestamp should be valid number');

  // 6. Completely invalid date/time inputs return null
  assert(parseDateTimeToTs('2026-99-99', '99:99') === null, 'out-of-bounds date and time should return null');

  // 7. Test 2: Function loaded WITH normalizeDate defined
  const codeWithNormalizeDate = `
    const document = window.document;
    function normalizeDate(dateStr) {
      if (dateStr === '15 Jun' || dateStr === 'Jun 15') return '2026-06-15';
      if (dateStr === '2026-07-20') return '2026-07-20';
      return dateStr;
    }
    ${transportCode}
    return { parseDateTimeToTs };
  `;
  const evalWithNormalize = new Function('window', 'localStorage', codeWithNormalizeDate);
  const { parseDateTimeToTs: parseWithNormalize } = evalWithNormalize(windowMock, windowMock.localStorage);

  const normalizedTs = parseWithNormalize('15 Jun', '16:45');
  const expectedNormalizedTs = new Date('2026-06-15T16:45:00').getTime();
  assert(normalizedTs === expectedNormalizedTs, 'should use normalizeDate output to form ISO candidate timestamp');

  console.log('✅ ALL PARSE DATE TIME TO TS UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  run().catch(error => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}

module.exports = { run };
