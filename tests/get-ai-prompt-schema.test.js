const path = require('path');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function runGetAiPromptSchemaTests() {
  console.log('Running _getAiPromptSchema unit tests...');

  const documentMock = {
    getElementById: () => null
  };

  const context = createVmContext({
    document: documentMock
  });

  const aiSource = loadSource(path.join('js', 'ai.js'));
  runScriptInContext(aiSource, context, 'js/ai.js');

  const _getAiPromptSchema = context._getAiPromptSchema || (context.globalThis && context.globalThis._getAiPromptSchema);

  assert(typeof _getAiPromptSchema === 'function', '_getAiPromptSchema should be exposed as a function on context/globalThis');

  // Helper to extract and parse JSON payload from schema string
  function parseSchemaJson(schemaString) {
    assert(schemaString.startsWith('EXPECTED JSON SCHEMA:\n'), 'Schema text must start with EXPECTED JSON SCHEMA header');
    const jsonText = schemaString.replace(/^EXPECTED JSON SCHEMA:\n/, '').trim();
    return JSON.parse(jsonText);
  }

  // 1. Happy path testing parameter substitution
  const title = 'Japan Odyssey 2026';
  const cityCount = 4;
  const schemaText = _getAiPromptSchema(title, cityCount);

  assert(schemaText.includes(`"title": "${title}"`), 'Schema text must interpolate title parameter');
  assert(schemaText.includes(`"subtitle": "Generated ${cityCount}-city itinerary"`), 'Schema text must interpolate cityCount in subtitle');

  // 2. Validate JSON structure & parseability
  const parsed = parseSchemaJson(schemaText);
  assert(parsed && typeof parsed === 'object', 'Extracted schema must be a valid JSON object');

  // Verify meta section
  assert(parsed.meta && parsed.meta.title === title, 'Parsed meta.title must match input title');
  assert(parsed.meta.subtitle === `Generated ${cityCount}-city itinerary`, 'Parsed meta.subtitle must match expected format');

  // Verify cities array schema structure
  assert(Array.isArray(parsed.cities) && parsed.cities.length > 0, 'Schema must define at least one sample city');
  const sampleCity = parsed.cities[0];
  assert(sampleCity.id && sampleCity.name && sampleCity.country && sampleCity.countryCode && sampleCity.code, 'Sample city must include basic properties');
  assert(typeof sampleCity.lat === 'number' && typeof sampleCity.lng === 'number', 'Sample city must include numeric lat/lng coordinates');

  // Verify itinerary legs schema structure
  assert(Array.isArray(parsed.itinerary) && parsed.itinerary.length === 3, 'Schema itinerary must contain start, destination, and return legs');

  const startLeg = parsed.itinerary[0];
  assert(startLeg.id === 'leg-start', 'Start leg id must be leg-start');
  assert(Array.isArray(startLeg.days) && startLeg.days[0].activityItems.length > 0, 'Start leg must contain sample activity items');
  const startAct = startLeg.days[0].activityItems[0];
  assert(typeof startAct.text === 'string' && startAct.text.length > 0, 'Activity item must use "text" property for activity name');
  assert(startAct.title === undefined, 'Activity item must NOT use "title" property');
  assert(typeof startAct.lat === 'number' && typeof startAct.lng === 'number', 'Start activity item must include numeric lat/lng');

  const destLeg = parsed.itinerary[1];
  assert(destLeg.id === 'leg-cityname', 'Destination leg id must be leg-cityname');
  assert(Array.isArray(destLeg.cityFood) && destLeg.cityFood.length > 0, 'Destination leg must contain cityFood array');
  assert(typeof destLeg.cityFood[0].lat === 'number' && typeof destLeg.cityFood[0].lng === 'number', 'cityFood item must include numeric lat/lng');
  assert(Array.isArray(destLeg.suggestedActivities) && destLeg.suggestedActivities.length > 0, 'Destination leg must contain suggestedActivities array');
  assert(typeof destLeg.suggestedActivities[0].lat === 'number' && typeof destLeg.suggestedActivities[0].lng === 'number', 'suggestedActivities item must include numeric lat/lng');
  assert(Array.isArray(destLeg.legTips) && destLeg.legTips.length > 0, 'Destination leg must contain legTips array');
  assert(typeof destLeg.legTips[0].text === 'string', 'legTips item must contain text');

  const returnLeg = parsed.itinerary[2];
  assert(returnLeg.id === 'leg-return', 'Return leg id must be leg-return');

  // Verify journeys schema structure
  assert(Array.isArray(parsed.journeys) && parsed.journeys.length > 0, 'Schema journeys must contain sample journey');
  const sampleJourney = parsed.journeys[0];
  assert(typeof sampleJourney.fromLat === 'number' && typeof sampleJourney.fromLng === 'number', 'Journey must include numeric fromLat/fromLng');
  assert(typeof sampleJourney.toLat === 'number' && typeof sampleJourney.toLng === 'number', 'Journey must include numeric toLat/toLng');

  // Verify stays schema structure
  assert(Array.isArray(parsed.stays) && parsed.stays.length > 0, 'Schema stays must contain sample stay');
  const sampleStay = parsed.stays[0];
  assert(typeof sampleStay.lat === 'number' && typeof sampleStay.lng === 'number', 'Stay must include numeric lat/lng');
  assert(typeof sampleStay.location === 'string' && sampleStay.location.length > 0, 'Stay must include location');

  // Verify packing schema structure
  assert(Array.isArray(parsed.packing) && parsed.packing.length === 3, 'Schema packing must contain 3 nested packing areas');
  parsed.packing.forEach(area => {
    assert(typeof area.areaName === 'string', 'Packing area must have areaName string');
    assert(Array.isArray(area.categories), 'Packing area must have categories array');
    area.categories.forEach(cat => {
      assert(typeof cat.title === 'string', 'Packing category must have title string');
      assert(Array.isArray(cat.items), 'Packing category must have items array');
    });
  });

  // Verify leaveHome schema structure
  assert(Array.isArray(parsed.leaveHome) && parsed.leaveHome.length > 0, 'Schema leaveHome must contain pre-trip tasks');

  // 3. Edge cases and parameter variation
  // Zero cityCount & empty title
  const schemaEmpty = _getAiPromptSchema('', 0);
  const parsedEmpty = parseSchemaJson(schemaEmpty);
  assert(parsedEmpty.meta.title === '', 'Empty title should produce empty title in meta');
  assert(parsedEmpty.meta.subtitle === 'Generated 0-city itinerary', 'Zero city count should produce 0-city in subtitle');

  // String cityCount parameter
  const schemaStrCount = _getAiPromptSchema('Bali Getaway', '5');
  const parsedStrCount = parseSchemaJson(schemaStrCount);
  assert(parsedStrCount.meta.title === 'Bali Getaway', 'Title should match');
  assert(parsedStrCount.meta.subtitle === 'Generated 5-city itinerary', 'String city count should format correctly in subtitle');

  // Special characters in title (unicode emojis and ampersands)
  const schemaSpecial = _getAiPromptSchema('Rome & Paris Adventure ✈️ 🍕', 2);
  assert(schemaSpecial.includes('Rome & Paris Adventure ✈️ 🍕'), 'Schema string must include special characters and emojis');
  const parsedSpecial = parseSchemaJson(schemaSpecial);
  assert(parsedSpecial.meta.title === 'Rome & Paris Adventure ✈️ 🍕', 'Parsed JSON meta title must retain special characters and emojis');

  console.log('✅ ALL _getAiPromptSchema UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runGetAiPromptSchemaTests();
  } catch (err) {
    console.error('❌ _getAiPromptSchema TEST FAILED:', err.message);
    process.exit(1);
  }
}

module.exports = { runGetAiPromptSchemaTests };
