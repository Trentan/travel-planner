const assert = require('assert');
const fs = require('fs');

// 1. Verify weather module in Node environment
const weather = require('../js/weather.js');

function runWeatherNotesSuite() {
  console.log('Testing WMO weather code mapping...');
  assert.strictEqual(weather.getWeatherInfoFromWmo(0).icon, '☀️');
  assert.strictEqual(weather.getWeatherInfoFromWmo(2).icon, '⛅');
  assert.strictEqual(weather.getWeatherInfoFromWmo(61).icon, '🌧️');
  assert.strictEqual(weather.getWeatherInfoFromWmo(71).icon, '❄️');
  assert.strictEqual(weather.getWeatherInfoFromWmo(95).icon, '⛈️');
  console.log('✓ WMO weather code mappings passed.');

  console.log('Testing seasonal climate estimates...');
  const summerRome = weather.getSeasonalEstimate('Rome', 7);
  assert.ok(summerRome.high >= 28, 'Summer in Rome should be warm');
  assert.strictEqual(summerRome.icon, '☀️');

  const winterVienna = weather.getSeasonalEstimate('Vienna', 1);
  assert.ok(winterVienna.high <= 5, 'Winter in Vienna should be chilly');
  assert.strictEqual(winterVienna.icon, '❄️');
  console.log('✓ Seasonal climate estimates passed.');

  console.log('Testing date normalizer in weather module...');
  assert.strictEqual(weather.getIsoDate('8 Jun'), '2026-06-08');
  assert.strictEqual(weather.getIsoDate('2026-07-15'), '2026-07-15');
  console.log('✓ ISO date normalization passed.');

  console.log('Testing weather badge HTML generation...');
  const html = weather.renderDayWeatherBadgeHtml('8 Jun', 'Rome');
  assert.ok(html.includes('compact-day-weather-chip'), 'HTML should contain weather chip');
  assert.ok(html.includes('°C'), 'HTML should contain degree Celsius');
  console.log('✓ Weather badge HTML generation passed.');

  console.log('Testing day notes functions in crud.js...');
  const crudCode = fs.readFileSync('js/crud.js', 'utf8');
  const legEngineCode = fs.readFileSync('js/leg-engine.js', 'utf8');
  assert.ok(crudCode.includes('function addDayNote('), 'crud.js must define addDayNote');
  assert.ok(crudCode.includes('function updateDayNote('), 'crud.js must define updateDayNote');
  assert.ok(crudCode.includes('function deleteDayNote('), 'crud.js must define deleteDayNote');
  assert.ok(legEngineCode.includes('if (oldDay.notes) nd.notes = oldDay.notes;'), 'leg-engine.js must preserve day notes on rebuild');
  console.log('✓ Day notes CRUD definitions verified.');

  console.log('Testing itinerary.js integration...');
  const itinCode = fs.readFileSync('js/itinerary.js', 'utf8');
  assert.ok(itinCode.includes('function renderCompactDayNotes('), 'itinerary.js must define renderCompactDayNotes');
  assert.ok(itinCode.includes('renderDayWeatherBadgeHtml'), 'itinerary.js must call renderDayWeatherBadgeHtml');
  console.log('✓ Itinerary integration verified.');

  console.log('All weather and day notes tests passed cleanly!');
}

if (require.main === module) {
  runWeatherNotesSuite();
}

module.exports = { runWeatherNotesSuite };

