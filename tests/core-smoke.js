const path = require('path');

const {
  assert,
  createAiContext,
  extractBetween,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function loadDateHelpers() {
  const dataJs = loadSource(path.join('js', 'data.js'));
  const transportJs = loadSource(path.join('js', 'transport.js'));
  const utilsJs = loadSource(path.join('js', 'utils.js'));
  const aiJs = loadSource(path.join('js', 'ai.js'));

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

  return {
    dateHelpers,
    checklistHelpers,
    transportHelpers,
    aiHarness
  };
}

async function run() {
  const { dateHelpers, checklistHelpers, transportHelpers, aiHarness } = loadDateHelpers();
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
  assert(document.getElementById('aiOutputBox').style.display === 'block', 'Prompt output box should be shown');
  assert(document.getElementById('aiPromptOutput').value === promptText, 'Prompt textarea should receive the generated prompt');

  const copied = await context.copyPrompt();
  assert(copied === true, 'copyPrompt should succeed');
  assert(clipboardWrites[0] === promptText, 'copyPrompt should write the prompt to the clipboard');
  assert(alerts.length >= 1, 'copyPrompt should notify the user');
  assert(execCommands.length === 0, 'Clipboard API should avoid the execCommand fallback when available');

  console.log('Core smoke checks passed');
}

if (require.main === module) {
  run().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { run };
