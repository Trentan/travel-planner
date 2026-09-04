const path = require('path');

const {
  assert,
  createAiContext,
  createVmContext,
  extractBetween,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function loadDateHelpers() {
  const dataJs = loadSource(path.join('js', 'data.js'));
  const transportJs = loadSource(path.join('js', 'transport.js'));
  const utilsJs = loadSource(path.join('js', 'utils.js'));
  const aiJs = loadSource(path.join('js', 'ai.js'));
  const bookingIntakeJs = loadSource(path.join('js', 'booking-intake.js'));

  const dateHelpersBlock = extractBetween(
    dataJs,
    'const TRIP_DATE_MONTHS =',
    'function normalizeTripCitiesDateData'
  );

  const checklistHelpersBlock = extractBetween(
    utilsJs,
    'const DEFAULT_LEAVE_HOME =',
    'const DEFAULT_PACKING ='
  );

  const defaultPackingBlock = extractBetween(
    utilsJs,
    'const DEFAULT_PACKING =',
    'function updateClocks'
  );

  const packingMergeBlock = extractBetween(
    dataJs,
    'function ensureDefaultPackingAreas',
    'function getImportedDestinationCityNames'
  );

  const itineraryPositionBlock = extractBetween(
    loadSource(path.join('js', 'itinerary.js')),
    'function findItineraryPositionForDate',
    'function initializeItineraryPositionForToday'
  );

  const journeyDurationBlock = extractBetween(
    transportJs,
    '// Calculate total journey duration in hours',
    '// Helper: Get compact code display for table cells'
  );

  const crudJs = loadSource(path.join('js', 'crud.js'));
  const parseActivityDurationBlock = extractBetween(
    crudJs,
    'function parseActivityDurationMinutes(',
    'function addMinutesToTimeValue('
  );

  const journeyDateFormatBlock = extractBetween(
    transportJs,
    'function formatJourneyDate',
    'function formatJourneyTime'
  );

  const journeyDisplayBlock = extractBetween(
    transportJs,
    'function getJourneyDisplayDate',
    'function findJourney'
  );

  const dateHelpers = new Function(
    `${dateHelpersBlock}
return {
  normalizeTripDateValue,
  formatTripDateForDisplay,
  toLocalIsoDate,
  normalizeTripJourneysData
};`
  )();

  const checklistHelpers = new Function(
    `${checklistHelpersBlock}
return {
  normalizeChecklistText,
  getChecklistItemKeys,
  mergeChecklistWithDefaults
};`
  )();

  const packingHelpers = new Function(
    `${defaultPackingBlock}
${packingMergeBlock}
return {
  DEFAULT_PACKING,
  ensureDefaultPackingAreas
};`
  )();

  const itineraryPositionHelpers = new Function(
    'normalizeTripDateValue',
    `${itineraryPositionBlock}
return { findItineraryPositionForDate };`
  )(dateHelpers.normalizeTripDateValue);

  const transportHelpers = new Function(
    'formatTripDateForDisplay',
    `${journeyDurationBlock}
${journeyDateFormatBlock}
${journeyDisplayBlock}
return {
  calculateJourneyDuration,
  formatJourneyDate,
  getJourneyDisplayDate
};`
  )(dateHelpers.formatTripDateForDisplay);

  const aiHarness = createAiContext();
  runScriptInContext(aiJs, aiHarness.context, 'js/ai.js');

  const bookingContext = createVmContext({
    window: {},
    document: { getElementById: () => null, querySelectorAll: () => [] },
    appData: [],
    journeys: [],
    stays: [],
    citiesData: [],
    alert: () => {}
  });
  bookingContext.window = bookingContext;
  runScriptInContext(bookingIntakeJs, bookingContext, 'js/booking-intake.js');

  const utilsContext = createVmContext({
    window: {},
    document: { getElementById: () => null, querySelectorAll: () => [] }
  });
  utilsContext.window = utilsContext;
  runScriptInContext(utilsJs, utilsContext, 'js/utils.js');

  const parseActivityDurationMinutes = new Function(
    `${parseActivityDurationBlock}
return parseActivityDurationMinutes;`
  )();

  return {
    dateHelpers,
    checklistHelpers,
    packingHelpers,
    itineraryPositionHelpers,
    transportHelpers,
    aiHarness,
    bookingContext,
    utilsContext,
    parseActivityDurationMinutes
  };
}

async function run() {
  const {
    dateHelpers,
    checklistHelpers,
    packingHelpers,
    itineraryPositionHelpers,
    transportHelpers,
    aiHarness,
    bookingContext,
    utilsContext,
    parseActivityDurationMinutes
  } = loadDateHelpers();
  const { context, document, alerts, clipboardWrites, execCommands } = aiHarness;

  assert(dateHelpers.normalizeTripDateValue('7 Jun') === '2026-06-07', 'Date normalization should convert short dates to ISO');
  assert(dateHelpers.normalizeTripDateValue('2026-05-14') === '2026-05-14', 'Date normalization should preserve ISO dates');
  assert(dateHelpers.formatTripDateForDisplay('2026-06-07') === '7 Jun', 'Date formatting should convert ISO dates to display form');

  const normalizedJourneys = dateHelpers.normalizeTripJourneysData([
    { dayDate: '7 Jun', departureDate: '8 Jun', arrivalDate: '9 Jun' }
  ]);

  assert(normalizedJourneys[0].dayDate === '2026-06-07', 'Journey day dates should normalize');
  assert(normalizedJourneys[0].departureDate === '2026-06-08', 'Journey departure dates should normalize');
  assert(normalizedJourneys[0].arrivalDate === '2026-06-09', 'Journey arrival dates should normalize');

  assert(transportHelpers.formatJourneyDate('2026-06-07') === '7 Jun', 'Transport date formatter should use the shared trip date formatter');
  assert(transportHelpers.getJourneyDisplayDate('7 Jun') === '7 Jun', 'Journey display dates should preserve display-form dates');

  const mergedChecklist = checklistHelpers.mergeChecklistWithDefaults([
    { text: 'Empty fridge and pantry perishables', done: true },
    { text: 'Custom note', done: true },
    { text: 'Kitchen and bins', kind: 'section' }
  ]);

  assert(
    mergedChecklist.find(item => item.text === 'Empty fridge and pantry perishables')?.done === true,
    'Checklist merge should preserve saved state for matching default items'
  );
  assert(
    mergedChecklist.some(item => item.text === 'Custom note'),
    'Checklist merge should keep user-added tasks'
  );
  assert(
    mergedChecklist.some(item => item.kind === 'section' && item.text === 'Kitchen and bins'),
    'Checklist merge should preserve section headers'
  );

  const defaultCarryOn = packingHelpers.DEFAULT_PACKING
    .find(area => area.areaName.includes('Carry-on Packed Bag'))
  const shoesAndMisc = defaultCarryOn.categories.find(category => category.title === 'Shoes & Misc');
  assert(
    shoesAndMisc.items.some(item => item.text === 'Mobile strap for running' && item.done === false),
    'Packing defaults should include the running phone strap in Shoes & Misc'
  );
  assert(
    !defaultCarryOn.categories.some(category => category.title === 'Workout Equipment'),
    'Packing defaults should not create a dedicated Workout Equipment category'
  );

  const itineraryLegs = [
    {
      id: 'vienna',
      days: [{ day: 'Thu', date: '2026-06-11', from: 'Vienna', to: 'Bratislava' }]
    },
    {
      id: 'bratislava',
      days: [
        { day: 'Thu', date: '2026-06-11', from: 'Vienna', to: 'Bratislava' },
        { day: 'Fri', date: '2026-06-12', from: 'Bratislava', to: 'Bratislava' }
      ]
    }
  ];
  const currentPosition = itineraryPositionHelpers.findItineraryPositionForDate(itineraryLegs, '2026-06-11');
  assert(
    currentPosition?.leg.id === 'bratislava' && currentPosition.dayIndex === 0,
    'Current itinerary position should prefer the arrival leg on duplicated travel dates'
  );
  assert(
    itineraryPositionHelpers.findItineraryPositionForDate(itineraryLegs, '2026-06-30') === null,
    'Current itinerary position should fall back when today is outside the trip'
  );

  document.getElementById('aiTripTitle').value = 'Japan Spring';
  document.getElementById('aiTripDates').value = '12 days';
  document.getElementById('aiTripCities').value = 'Tokyo, Kyoto, Osaka';
  document.getElementById('aiTripVibe').value = 'Food focused, moderate pace, no early starts';
  document.getElementById('aiOutputBox').style.display = 'none';
  document.getElementById('aiPromptOutput').value = '';

  const promptText = context.generatePrompt();

  assert(promptText.includes('Japan Spring'), 'Prompt should use the entered title');
  assert(promptText.includes('Generated 3-city itinerary'), 'Prompt should reflect the city count');
  assert(promptText.includes('Tokyo, Kyoto, Osaka'), 'Prompt should include the entered cities');
  assert(promptText.includes('downloadable .json file'), 'Prompt should request a downloadable JSON file');
  assert(promptText.includes('"lat"') && promptText.includes('"lng"'), 'Prompt should include city coordinate fields');
  assert(document.getElementById('aiOutputBox').style.display === 'block', 'Prompt output box should be shown');
  assert(document.getElementById('aiPromptOutput').value === promptText, 'Prompt textarea should receive the generated prompt');

  const copied = await context.copyPrompt();
  assert(copied === true, 'copyPrompt should succeed');
  assert(clipboardWrites[0] === promptText, 'copyPrompt should write the prompt to the clipboard');
  assert(alerts.length >= 1, 'copyPrompt should notify the user');
  assert(execCommands.length === 0, 'Clipboard API should avoid the execCommand fallback when available');

  const bookingItems = bookingContext.parseBookingConfirmationText(`
    EVA Air booking confirmation
    Booking reference: ABC123
    Flight BR316
    From Brisbane to Vienna
    Departure: 7 Jun 2026 22:15
    Arrival: 8 Jun 2026 14:40

    Hotel: Vienna Central Hotel
    Check-in: 8 Jun 2026
    Check-out: 12 Jun 2026
    City: Vienna
  `);
  assert(bookingItems.some(item => item.kind === 'journey' && item.bookingReference === 'ABC123'), 'Booking intake should extract transport with booking ref');
  assert(bookingItems.some(item => item.kind === 'stay' && item.propertyName.includes('Vienna')), 'Booking intake should extract stay details');

  // Tests for calculateJourneyDuration
  const { calculateJourneyDuration } = transportHelpers;

  // 1. Invalid or missing inputs return null
  assert(calculateJourneyDuration(null) === null, 'calculateJourneyDuration should return null for null input');
  assert(calculateJourneyDuration(undefined) === null, 'calculateJourneyDuration should return null for undefined input');
  assert(calculateJourneyDuration([]) === null, 'calculateJourneyDuration should return null for empty array');
  assert(calculateJourneyDuration([{}]) === null, 'calculateJourneyDuration should return null when segment has no dates');
  assert(calculateJourneyDuration([{ departureDate: '2026-06-10' }]) === null, 'calculateJourneyDuration should return null when arrivalDate is missing');
  assert(calculateJourneyDuration([{ arrivalDate: '2026-06-10' }]) === null, 'calculateJourneyDuration should return null when departureDate/dayDate is missing');

  // 2. Fallback to dayDate when departureDate is omitted
  assert(
    calculateJourneyDuration([{ dayDate: '2026-06-10', departureTime: '08:00', arrivalDate: '2026-06-10', arrivalTime: '14:00' }]) === 6,
    'calculateJourneyDuration should use dayDate if departureDate is omitted'
  );

  // 3. Single-leg journey with ISO dates (YYYY-MM-DD)
  assert(
    calculateJourneyDuration([{ departureDate: '2026-06-10', departureTime: '08:00', arrivalDate: '2026-06-10', arrivalTime: '14:30' }]) === 6,
    'calculateJourneyDuration should calculate duration in hours and floor fractional hours'
  );

  // 4. Multi-leg journey spanning multiple dates and legs
  const multiLegSegments = [
    { departureDate: '2026-06-10', departureTime: '20:00', arrivalDate: '2026-06-11', arrivalTime: '06:00' },
    { departureDate: '2026-06-11', departureTime: '09:00', arrivalDate: '2026-06-11', arrivalTime: '17:00' }
  ];
  assert(
    calculateJourneyDuration(multiLegSegments) === 21,
    'calculateJourneyDuration should calculate total duration from first segment departure to last segment arrival'
  );

  // 5. Legacy date formats (e.g., "10 Jun")
  assert(
    calculateJourneyDuration([{ departureDate: '10 Jun', departureTime: '09:00', arrivalDate: '10 Jun', arrivalTime: '15:00' }]) === 6,
    'calculateJourneyDuration should support legacy date format strings'
  );

  // 6. Default time to 00:00 when departureTime/arrivalTime omitted
  assert(
    calculateJourneyDuration([{ departureDate: '2026-06-10', arrivalDate: '2026-06-12' }]) === 48,
    'calculateJourneyDuration should default missing times to 00:00'
  );

  // 7. Overnight adjustment (diffMs < 0) when depTime > arrTime on same date string
  assert(
    calculateJourneyDuration([{ departureDate: '2026-06-10', departureTime: '22:00', arrivalDate: '2026-06-10', arrivalTime: '04:00' }]) === 6,
    'calculateJourneyDuration should add 24 hours when arrival time is earlier than departure time on same date'
  );

  // 8. Invalid date strings resulting in NaN timestamp
  assert(
    calculateJourneyDuration([{ departureDate: '2026-99-99', arrivalDate: '2026-06-10' }]) === null,
    'calculateJourneyDuration should return null for unparseable dates'
  );

  // parseCurrencyAmount edge cases
  const parseCurrencyAmount = utilsContext.parseCurrencyAmount;
  assert(parseCurrencyAmount(100) === 100, 'parseCurrencyAmount should handle positive integers');
  assert(parseCurrencyAmount(123.45) === 123.45, 'parseCurrencyAmount should handle floats');
  assert(parseCurrencyAmount(0) === 0, 'parseCurrencyAmount should handle zero');
  assert(parseCurrencyAmount(-50.25) === -50.25, 'parseCurrencyAmount should handle negative numbers');

  assert(parseCurrencyAmount('100') === 100, 'parseCurrencyAmount should parse numeric integer strings');
  assert(parseCurrencyAmount('123.45') === 123.45, 'parseCurrencyAmount should parse numeric float strings');
  assert(parseCurrencyAmount('-50.25') === -50.25, 'parseCurrencyAmount should parse negative numeric strings');
  assert(parseCurrencyAmount('0.00') === 0, 'parseCurrencyAmount should parse zero formatted string');

  assert(parseCurrencyAmount('$100') === 100, 'parseCurrencyAmount should strip $ currency symbol');
  assert(parseCurrencyAmount('$1,234.56') === 1234.56, 'parseCurrencyAmount should handle commas and dollar signs');
  assert(parseCurrencyAmount('€99.99') === 99.99, 'parseCurrencyAmount should strip Euro symbol');
  assert(parseCurrencyAmount('£1,000,000.50') === 1000000.5, 'parseCurrencyAmount should handle multiple commas and Pound symbol');
  assert(parseCurrencyAmount('  $ 250.75  ') === 250.75, 'parseCurrencyAmount should handle leading/trailing whitespace and spaces around currency symbol');
  assert(parseCurrencyAmount('100 USD') === 100, 'parseCurrencyAmount should handle trailing currency code');
  assert(parseCurrencyAmount('USD 100.50') === 100.5, 'parseCurrencyAmount should handle leading currency code');
  assert(parseCurrencyAmount('.50') === 0.5, 'parseCurrencyAmount should parse leading decimal point');
  assert(parseCurrencyAmount('-.75') === -0.75, 'parseCurrencyAmount should parse negative decimal point without leading zero');

  assert(parseCurrencyAmount(null) === 0, 'parseCurrencyAmount should return 0 for null');
  assert(parseCurrencyAmount(undefined) === 0, 'parseCurrencyAmount should return 0 for undefined');
  assert(parseCurrencyAmount('') === 0, 'parseCurrencyAmount should return 0 for empty string');
  assert(parseCurrencyAmount('   ') === 0, 'parseCurrencyAmount should return 0 for whitespace-only string');

  assert(parseCurrencyAmount('abc') === 0, 'parseCurrencyAmount should return 0 for non-numeric text');
  assert(parseCurrencyAmount('free') === 0, 'parseCurrencyAmount should return 0 for word "free"');
  assert(parseCurrencyAmount('N/A') === 0, 'parseCurrencyAmount should return 0 for "N/A"');
  assert(parseCurrencyAmount('$$$') === 0, 'parseCurrencyAmount should return 0 for currency symbol only string');

  assert(parseCurrencyAmount(NaN) === 0, 'parseCurrencyAmount should return 0 for NaN');
  assert(parseCurrencyAmount(Infinity) === 0, 'parseCurrencyAmount should return 0 for Infinity');
  assert(parseCurrencyAmount(-Infinity) === 0, 'parseCurrencyAmount should return 0 for -Infinity');
  assert(parseCurrencyAmount(true) === 0, 'parseCurrencyAmount should return 0 for boolean true');
  assert(parseCurrencyAmount(false) === 0, 'parseCurrencyAmount should return 0 for boolean false');
  assert(parseCurrencyAmount({}) === 0, 'parseCurrencyAmount should return 0 for object');
  assert(parseCurrencyAmount([]) === 0, 'parseCurrencyAmount should return 0 for empty array');
  assert(parseCurrencyAmount([100]) === 100, 'parseCurrencyAmount should parse single-element array containing a number');

  assert(parseCurrencyAmount('--50') === 0, 'parseCurrencyAmount should return 0 for double negative sign');
  assert(parseCurrencyAmount('12.34.56') === 12.34, 'parseCurrencyAmount should parse up to the second decimal point');

  // Tests for parseBookingDate
  const parseBookingDate = bookingContext.parseBookingDate;
  assert(typeof parseBookingDate === 'function', 'parseBookingDate should be exported on context');

  // Falsy & empty values
  assert(parseBookingDate('') === '', 'parseBookingDate should return empty string for empty input');
  assert(parseBookingDate(null) === '', 'parseBookingDate should return empty string for null input');
  assert(parseBookingDate(undefined) === '', 'parseBookingDate should return empty string for undefined input');
  assert(parseBookingDate('   ') === '', 'parseBookingDate should return empty string for whitespace input');

  // ISO format YYYY-MM-DD
  assert(parseBookingDate('2026-07-15') === '2026-07-15', 'parseBookingDate should pass through ISO YYYY-MM-DD strings');

  // Day Month Year format ("7 June 2026", "15 Jul 2026", "01 January 2026")
  assert(parseBookingDate('7 June 2026') === '2026-06-07', 'parseBookingDate should parse "7 June 2026"');
  assert(parseBookingDate('15 Jul 2026') === '2026-07-15', 'parseBookingDate should parse "15 Jul 2026"');
  assert(parseBookingDate('01 January 2026') === '2026-01-01', 'parseBookingDate should parse "01 January 2026"');
  assert(parseBookingDate('12 Sept 2026') === '2026-09-12', 'parseBookingDate should parse "12 Sept 2026"');

  // Day Month without Year (default to 2026)
  assert(parseBookingDate('7 June') === '2026-06-07', 'parseBookingDate should parse "7 June" defaulting to year 2026');
  assert(parseBookingDate('25 Dec') === '2026-12-25', 'parseBookingDate should parse "25 Dec" defaulting to year 2026');

  // Month Day Year format ("June 7 2026", "Jul 15 2026", "January 01, 2026")
  assert(parseBookingDate('June 7 2026') === '2026-06-07', 'parseBookingDate should parse "June 7 2026"');
  assert(parseBookingDate('Jul 15, 2026') === '2026-07-15', 'parseBookingDate should handle commas e.g. "Jul 15, 2026"');
  assert(parseBookingDate('October 31 2026') === '2026-10-31', 'parseBookingDate should parse "October 31 2026"');

  // Month Day without Year (default to 2026)
  assert(parseBookingDate('June 7') === '2026-06-07', 'parseBookingDate should parse "June 7" defaulting to year 2026');
  assert(parseBookingDate('Feb 14') === '2026-02-14', 'parseBookingDate should parse "Feb 14" defaulting to year 2026');

  // Case insensitivity
  assert(parseBookingDate('7 JUNE 2026') === '2026-06-07', 'parseBookingDate should handle uppercase month names');
  assert(parseBookingDate('january 15 2026') === '2026-01-15', 'parseBookingDate should handle lowercase month names');

  // Fallback JS Date parsing or invalid inputs
  assert(parseBookingDate('invalid date string xyz') === '', 'parseBookingDate should return empty string for completely unparseable input');

  // parseActivityDurationMinutes tests
  // Hours
  assert(parseActivityDurationMinutes('1h') === 60, '1h should parse to 60 minutes');
  assert(parseActivityDurationMinutes('2 hr') === 120, '2 hr should parse to 120 minutes');
  assert(parseActivityDurationMinutes('3.5 hrs') === 210, '3.5 hrs should parse to 210 minutes');
  assert(parseActivityDurationMinutes('1.5 hour') === 90, '1.5 hour should parse to 90 minutes');
  assert(parseActivityDurationMinutes('2 hours') === 120, '2 hours should parse to 120 minutes');

  // Minutes
  assert(parseActivityDurationMinutes('30m') === 30, '30m should parse to 30 minutes');
  assert(parseActivityDurationMinutes('45 min') === 45, '45 min should parse to 45 minutes');
  assert(parseActivityDurationMinutes('15 mins') === 15, '15 mins should parse to 15 minutes');
  assert(parseActivityDurationMinutes('90 minute') === 90, '90 minute should parse to 90 minutes');
  assert(parseActivityDurationMinutes('120 minutes') === 120, '120 minutes should parse to 120 minutes');

  // Combined
  assert(parseActivityDurationMinutes('1h 30m') === 90, '1h 30m should parse to 90 minutes');
  assert(parseActivityDurationMinutes('1 hr 15 mins') === 75, '1 hr 15 mins should parse to 75 minutes');
  assert(parseActivityDurationMinutes('2 hours 45 minutes') === 165, '2 hours 45 minutes should parse to 165 minutes');
  assert(parseActivityDurationMinutes('1.5h 30min') === 120, '1.5h 30min should parse to 120 minutes');

  // Numeric fallback (interpreted as hours)
  assert(parseActivityDurationMinutes('2') === 120, 'Numeric string "2" should parse as 2 hours (120 min)');
  assert(parseActivityDurationMinutes('1.5') === 90, 'Numeric string "1.5" should parse as 1.5 hours (90 min)');
  assert(parseActivityDurationMinutes('0.5') === 30, 'Numeric string "0.5" should parse as 0.5 hours (30 min)');
  assert(parseActivityDurationMinutes(2) === 120, 'Number 2 should parse as 2 hours (120 min)');

  // Invalid / Edge cases
  assert(parseActivityDurationMinutes(null) === 0, 'null should parse to 0');
  assert(parseActivityDurationMinutes(undefined) === 0, 'undefined should parse to 0');
  assert(parseActivityDurationMinutes('') === 0, 'empty string should parse to 0');
  assert(parseActivityDurationMinutes('   ') === 0, 'whitespace string should parse to 0');
  assert(parseActivityDurationMinutes('invalid text') === 0, 'non-duration string should parse to 0');
  assert(parseActivityDurationMinutes('0') === 0, '"0" should parse to 0');
  assert(parseActivityDurationMinutes('0h') === 0, '"0h" should parse to 0');
  assert(parseActivityDurationMinutes('0 mins') === 0, '"0 mins" should parse to 0');
  assert(parseActivityDurationMinutes('-1') === 0, 'negative number string should parse to 0');

  // Test journey updating and removing old segments for journeyId
  const transportJs = loadSource(path.join('js', 'transport.js'));
  const { createDocument } = require('./lib/test-helpers');
  const documentMock = createDocument();
  documentMock.body = { classList: { contains: () => false } };
  documentMock.getElementById('journeyFromCity').value = 'Zurich';
  documentMock.getElementById('journeyToCity').value = 'Bangkok';
  documentMock.getElementById('journeyStatus').value = 'booked';

  const transportContext = createVmContext({
    window: {},
    document: documentMock,
    localStorage: {
      getItem: () => null,
      setItem: () => {}
    },
    journeys: [
      { id: 'seg1', journeyId: 'jid_123', fromLocation: 'Zurich', toLocation: 'London', segmentOrder: 1 },
      { id: 'seg2', journeyId: 'jid_123', fromLocation: 'London', toLocation: 'Bangkok', segmentOrder: 2 },
      { id: 'other_seg', journeyId: 'jid_456', fromLocation: 'Paris', toLocation: 'Rome', segmentOrder: 1 }
    ],
    citiesData: [
      { id: 'zurich', name: 'Zurich', code: 'ZRH' },
      { id: 'bangkok', name: 'Bangkok', code: 'BKK' }
    ],
    persistJourneys: () => {},
    closeJourneyModal: () => {},
    buildTransportTab: () => {},
    normalizeItemStatus: s => s,
    formatCurrency: v => '$' + v,
    parseCost: v => parseFloat(v) || 0,
    escapeHtmlText: s => s || '',
    renderStatusBadge: () => '',
    getStatusMeta: s => ({ color: '#000', label: s }),
    isEditMode: true,
    alert: msg => { throw new Error(msg); }
  });
  transportContext.window = transportContext;
  runScriptInContext(transportJs, transportContext, 'js/transport.js');

  // Simulate editing multi-leg journey jid_123 and removing leg 2
  transportContext.editJourney('jid_123');
  documentMock.getElementById('journeyFromCity').value = 'Zurich';
  documentMock.getElementById('journeyToCity').value = 'Bangkok';
  documentMock.getElementById('journeyStatus').value = 'booked';
  // Remove 2nd leg in pending segments
  transportContext.removePendingSegment(1);

  // Execute save
  transportContext.saveJourneyFromModal();

  // Assert old segments with jid_123 were removed and replaced with the updated single segment
  const updatedJid123Segs = transportContext.journeys.filter(j => j.journeyId === 'jid_123');
  assert(updatedJid123Segs.length === 1, 'Updating journey should replace old segments with new segments');
  assert(updatedJid123Segs[0].fromLocation === 'Zurich' && updatedJid123Segs[0].toLocation === 'Bangkok', 'Updated segment should have new route');
  assert(transportContext.journeys.some(j => j.journeyId === 'jid_456'), 'Unrelated journeys should be preserved');

  console.log('Core smoke checks passed');
}

if (require.main === module) {
  run().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { run };
