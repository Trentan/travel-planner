const fs = require('fs');
const path = require('path');
const { assert } = require('./lib/test-helpers');

async function runFormatJourneySubLocationTests() {
  console.log('Running formatJourneySubLocationText unit tests...');
  const itineraryCode = fs.readFileSync(path.join(__dirname, '../js/itinerary.js'), 'utf8');

  const documentMock = {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {}
  };

  const windowMock = {
    document: documentMock,
    addEventListener: () => {},
    journeys: []
  };

  const combinedCode = `
    const window = windowMock;
    const document = windowMock.document;
    ${itineraryCode}
    return { formatJourneySubLocationText };
  `;

  const evalFn = new Function('windowMock', combinedCode);
  const { formatJourneySubLocationText } = evalFn(windowMock);

  // 1. Edge cases: null, undefined, empty array, non-array inputs
  assert(formatJourneySubLocationText(null) === '', 'null input should return empty string');
  assert(formatJourneySubLocationText(undefined) === '', 'undefined input should return empty string');
  assert(formatJourneySubLocationText([]) === '', 'empty array should return empty string');
  assert(formatJourneySubLocationText(123) === '', 'number input should return empty string');
  assert(formatJourneySubLocationText('string') === '', 'string input should return empty string');
  assert(formatJourneySubLocationText({}) === '', 'object input should return empty string');

  // 2. Segments without address fields
  assert(
    formatJourneySubLocationText([{}]) === '',
    'segment without fromAddress or toAddress should return empty string'
  );
  assert(
    formatJourneySubLocationText([{ fromLocation: 'Tokyo', toLocation: 'Kyoto' }]) === '',
    'segment with locations but no addresses should return empty string'
  );

  // 3. Single segment scenarios
  // 3a. Depart address only (city already in address vs city not in address)
  assert(
    formatJourneySubLocationText([
      { fromAddress: '123 Main St', fromLocation: 'Tokyo' }
    ]) === 'Depart: 123 Main St (Tokyo)',
    'single segment fromAddress without city in address should format as Depart: Address (City)'
  );

  assert(
    formatJourneySubLocationText([
      { fromAddress: '123 Main St, Tokyo', fromLocation: 'Tokyo' }
    ]) === 'Depart: 123 Main St, Tokyo',
    'single segment fromAddress with city already in address should not duplicate city'
  );

  assert(
    formatJourneySubLocationText([
      { fromAddress: 'PARIS CHARLES DE GAULLE AIRPORT', fromLocation: 'Paris' }
    ]) === 'Depart: PARIS CHARLES DE GAULLE AIRPORT',
    'case-insensitive matching should recognize city in address'
  );

  assert(
    formatJourneySubLocationText([
      { fromAddress: '123 Main St', fromLocation: '  Tokyo  ' }
    ]) === 'Depart: 123 Main St (Tokyo)',
    'location with surrounding whitespace should be trimmed when formatting'
  );

  assert(
    formatJourneySubLocationText([
      { fromAddress: '123 Main St' }
    ]) === 'Depart: 123 Main St',
    'fromAddress with no fromLocation should return address as-is'
  );

  // 3b. Arrive address only
  assert(
    formatJourneySubLocationText([
      { toAddress: 'Haneda Terminal 1', toLocation: 'Tokyo' }
    ]) === 'Arrive: Haneda Terminal 1 (Tokyo)',
    'single segment toAddress without city in address should format as Arrive: Address (City)'
  );

  assert(
    formatJourneySubLocationText([
      { toAddress: 'Haneda Airport, Tokyo', toLocation: 'Tokyo' }
    ]) === 'Arrive: Haneda Airport, Tokyo',
    'single segment toAddress with city already in address should not duplicate city'
  );

  assert(
    formatJourneySubLocationText([
      { toAddress: 'Haneda Terminal 1' }
    ]) === 'Arrive: Haneda Terminal 1',
    'toAddress with no toLocation should return address as-is'
  );

  // 3c. Both Depart and Arrive in a single segment
  assert(
    formatJourneySubLocationText([
      {
        fromAddress: 'Tokyo Station',
        fromLocation: 'Tokyo',
        toAddress: 'Kyoto Station',
        toLocation: 'Kyoto'
      }
    ]) === 'Depart: Tokyo Station | Arrive: Kyoto Station',
    'single segment with both depart and arrive should join with pipe'
  );

  assert(
    formatJourneySubLocationText([
      {
        fromAddress: '123 Main St',
        fromLocation: 'Tokyo',
        toAddress: '456 Side Rd',
        toLocation: 'Kyoto'
      }
    ]) === 'Depart: 123 Main St (Tokyo) | Arrive: 456 Side Rd (Kyoto)',
    'single segment with missing city names in addresses should append cities in parentheses'
  );

  // 4. Multi-segment scenarios (isMultiLeg = true)
  assert(
    formatJourneySubLocationText([
      { fromAddress: '123 Main St', fromLocation: 'Tokyo', toAddress: 'Haneda Airport', toLocation: 'Tokyo' },
      { fromAddress: 'Haneda Airport', fromLocation: 'Tokyo', toAddress: '789 Grand Hotel', toLocation: 'Osaka' }
    ]) === 'Leg 1 Depart: 123 Main St (Tokyo) | Leg 1 Arrive: Haneda Airport (Tokyo) | Leg 2 Depart: Haneda Airport (Tokyo) | Leg 2 Arrive: 789 Grand Hotel (Osaka)',
    'multi-leg segments should prefix with Leg 1, Leg 2, etc.'
  );

  assert(
    formatJourneySubLocationText([
      { fromAddress: '123 Main St', fromLocation: 'Tokyo' },
      { toAddress: '789 Grand Hotel', toLocation: 'Osaka' }
    ]) === 'Leg 1 Depart: 123 Main St (Tokyo) | Leg 2 Arrive: 789 Grand Hotel (Osaka)',
    'multi-leg with partial addresses per leg should handle missing fields gracefully'
  );

  console.log('✅ ALL formatJourneySubLocationText UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  runFormatJourneySubLocationTests().catch(error => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}

module.exports = { runFormatJourneySubLocationTests };
