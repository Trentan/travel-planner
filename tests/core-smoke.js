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
    `${journeyDateFormatBlock}
${journeyDisplayBlock}
return {
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

  return {
    dateHelpers,
    checklistHelpers,
    packingHelpers,
    itineraryPositionHelpers,
    transportHelpers,
    aiHarness,
    bookingContext
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
    bookingContext
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

  const savedPacking = JSON.parse(JSON.stringify(packingHelpers.DEFAULT_PACKING));
  const savedCarryOn = savedPacking.find(area => area.areaName.includes('Carry-on Packed Bag'));
  const savedWorkoutEquipment = savedCarryOn.categories.find(category => category.title === 'Workout Equipment');
  const savedEssentials = savedPacking
    .find(area => area.areaName.includes('Personal Item Bag'))
    .categories.find(category => category.title === 'Essentials');
  savedWorkoutEquipment.items = savedWorkoutEquipment.items.filter(item => item.text !== 'Mobile strap for running');
  savedEssentials.items = savedEssentials.items.map(item =>
    item.text === 'Phone' ? { ...item, done: true } : item
  );
  savedEssentials.items.push({ text: 'Mobile strap for running', done: true });
  savedEssentials.items.push({ text: 'Custom essentials item', done: true });

  const mergedPacking = packingHelpers.ensureDefaultPackingAreas(savedPacking);
  const mergedWorkoutEquipment = mergedPacking
    .find(area => area.areaName.includes('Carry-on Packed Bag'))
    .categories.find(category => category.title === 'Workout Equipment');
  const mergedEssentials = mergedPacking
    .find(area => area.areaName.includes('Personal Item Bag'))
    .categories.find(category => category.title === 'Essentials');
  assert(
    mergedWorkoutEquipment.items.some(item => item.text === 'Mobile strap for running' && item.done === true),
    'Packing defaults should move the running phone strap to Workout Equipment and preserve completion'
  );
  assert(
    !mergedEssentials.items.some(item => item.text === 'Mobile strap for running'),
    'Packing defaults should remove the running phone strap from Personal Item Essentials'
  );
  assert(
    mergedEssentials.items.find(item => item.text === 'Phone')?.done === true,
    'Packing defaults should preserve saved completion state'
  );
  assert(
    mergedEssentials.items.some(item => item.text === 'Custom essentials item' && item.done === true),
    'Packing defaults should preserve custom saved items'
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

  console.log('Core smoke checks passed');
}

if (require.main === module) {
  run().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { run };
