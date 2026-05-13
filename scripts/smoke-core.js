const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function extractBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert(start !== -1, `Missing start marker: ${startMarker}`);
  assert(end !== -1, `Missing end marker: ${endMarker}`);
  return source.slice(start, end);
}

function createElement(initial = {}) {
  return {
    value: '',
    textContent: '',
    style: {},
    selected: false,
    select() {
      this.selected = true;
    },
    ...initial
  };
}

async function main() {
  const dataJs = read(path.join(root, 'js', 'data.js'));
  const transportJs = read(path.join(root, 'js', 'transport.js'));
  const aiJs = read(path.join(root, 'js', 'ai.js'));

  const dateHelpersBlock = extractBetween(
    dataJs,
    'const TRIP_DATE_MONTHS =',
    'function normalizeTripCitiesDateData'
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

  assert(dateHelpers.normalizeTripDateValue('7 Jun') === '2026-06-07', 'Date normalization should convert short dates to ISO');
  assert(dateHelpers.normalizeTripDateValue('2026-05-14') === '2026-05-14', 'Date normalization should preserve ISO dates');
  assert(dateHelpers.formatTripDateForDisplay('2026-06-07') === '7 Jun', 'Date formatting should convert ISO dates to display form');

  const normalizedJourneys = dateHelpers.normalizeTripJourneysData([
    { dayDate: '7 Jun', departureDate: '8 Jun', arrivalDate: '9 Jun' }
  ]);

  assert(normalizedJourneys[0].dayDate === '2026-06-07', 'Journey day dates should normalize');
  assert(normalizedJourneys[0].departureDate === '2026-06-08', 'Journey departure dates should normalize');
  assert(normalizedJourneys[0].arrivalDate === '2026-06-09', 'Journey arrival dates should normalize');

  const transportDateHelpers = new Function(
    'formatTripDateForDisplay',
    `${journeyDateFormatBlock}
${journeyDisplayBlock}
return {
  formatJourneyDate,
  getJourneyDisplayDate
};`
  )(dateHelpers.formatTripDateForDisplay);

  assert(transportDateHelpers.formatJourneyDate('2026-06-07') === '7 Jun', 'Transport date formatter should use the shared trip date formatter');
  assert(transportDateHelpers.getJourneyDisplayDate('7 Jun') === '7 Jun', 'Journey display dates should preserve display-form dates');

  const elements = new Map();
  const alerts = [];
  const clipboardWrites = [];
  const execCommands = [];

  const document = {
    getElementById(id) {
      if (!elements.has(id)) {
        elements.set(id, createElement());
      }
      return elements.get(id);
    },
    execCommand(command) {
      execCommands.push(command);
      return command === 'copy';
    }
  };

  const context = {
    document,
    navigator: {
      clipboard: {
        writeText: async text => {
          clipboardWrites.push(text);
        }
      }
    },
    alert: message => {
      alerts.push(message);
    },
    console,
    setTimeout,
    clearTimeout,
    globalThis: null
  };
  context.globalThis = context;

  vm.runInNewContext(aiJs, context, { filename: 'js/ai.js' });

  assert(typeof context.generatePrompt === 'function', 'generatePrompt should be exported');
  assert(typeof context.copyPrompt === 'function', 'copyPrompt should be exported');

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

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
