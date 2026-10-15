const path = require('path');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function runNormalizeBookingWhitespaceTests() {
  console.log('Running normalizeBookingWhitespace unit tests...');

  // 1. Direct CommonJS export check
  const bookingIntakeModule = require('../js/booking-intake');
  const normalizeBookingWhitespaceModule = bookingIntakeModule.normalizeBookingWhitespace;
  assert(typeof normalizeBookingWhitespaceModule === 'function', 'normalizeBookingWhitespace should be exported on module.exports');

  // 2. Window / VM Context export check
  const context = createVmContext({
    document: {
      getElementById: () => null,
      querySelectorAll: () => []
    }
  });
  context.window = context;

  const bookingSource = loadSource(path.join('js', 'booking-intake.js'));
  runScriptInContext(bookingSource, context, 'js/booking-intake.js');

  const normalizeBookingWhitespace = context.window.normalizeBookingWhitespace;
  assert(typeof normalizeBookingWhitespace === 'function', 'normalizeBookingWhitespace should be exported on window');

  // Test scenarios

  // Case 1: Falsy inputs
  assert(normalizeBookingWhitespace(null) === '', 'null input should return empty string');
  assert(normalizeBookingWhitespace(undefined) === '', 'undefined input should return empty string');
  assert(normalizeBookingWhitespace('') === '', 'empty string input should return empty string');
  assert(normalizeBookingWhitespace(false) === '', 'boolean false should return empty string (as String(false) is falsy or String(value || ""))');

  // Case 2: Non-string primitive values
  assert(normalizeBookingWhitespace(123) === '123', 'number input should be converted to string and trimmed');
  assert(normalizeBookingWhitespace(true) === 'true', 'boolean true should return "true"');

  // Case 3: Carriage returns (\r) replacement
  assert(normalizeBookingWhitespace('Line 1\rLine 2') === 'Line 1\nLine 2', 'Single carriage return \\r should be replaced with newline \\n');
  assert(normalizeBookingWhitespace('Line 1\r\nLine 2') === 'Line 1\n\nLine 2', 'Windows newline \\r\\n becomes double newline \\n\\n before regex rules');

  // Case 4: Tabs and multiple consecutive spaces collapsed
  assert(normalizeBookingWhitespace('Flight   QF123\t\tto   Sydney') === 'Flight QF123 to Sydney', 'Multiple spaces and tabs should be collapsed into single spaces');

  // Case 5: Multiple consecutive newlines (\n{3,}) collapsed to double newlines (\n\n)
  assert(
    normalizeBookingWhitespace('Header\n\n\nBody\n\n\n\nFooter') === 'Header\n\nBody\n\nFooter',
    '3 or more consecutive newlines should be collapsed to double newlines'
  );
  assert(
    normalizeBookingWhitespace('Line 1\n\nLine 2') === 'Line 1\n\nLine 2',
    'Double newlines should remain intact'
  );

  // Case 6: Leading and trailing whitespace trimming
  assert(normalizeBookingWhitespace('   \t\n  Hello World  \n\t   ') === 'Hello World', 'Leading and trailing whitespace/newlines should be trimmed');

  // Case 7: Combined complex booking confirmation text block
  const rawBookingText = '   \n\tFlight Confirmation:   QF123\nFrom:   London   Heathrow\t\tTo:   Tokyo   Haneda\n\n\nDeparture:   2026-05-10\t10:00\n\n\n\nSeat:   12A   (Window)\t\n  ';
  const expectedNormalizedText = 'Flight Confirmation: QF123\nFrom: London Heathrow To: Tokyo Haneda\n\nDeparture: 2026-05-10 10:00\n\nSeat: 12A (Window)';

  assert(
    normalizeBookingWhitespace(rawBookingText) === expectedNormalizedText,
    'Complex raw booking confirmation text should be correctly normalized'
  );

  // Case 8: Untouched text (already normalized)
  const alreadyNormalized = 'Flight BA100\nLondon to Paris\n\nHotel Grand';
  assert(normalizeBookingWhitespace(alreadyNormalized) === alreadyNormalized, 'Already normalized text should remain unchanged');

  console.log('✅ ALL normalizeBookingWhitespace UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runNormalizeBookingWhitespaceTests();
  } catch (err) {
    console.error('❌ normalizeBookingWhitespace TEST FAILED:', err.message);
    process.exit(1);
  }
}

module.exports = { runNormalizeBookingWhitespaceTests };
