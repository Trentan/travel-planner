const { assert, createVmContext, runScriptInContext, loadSource } = require('./lib/test-helpers');

function runAiCopilotTests() {
  console.log('Running AI Co-Pilot two-way ingestion & diff unit tests...');

  const aiCode = loadSource('js/ai.js');
  const contextAi = createVmContext({
    document: {
      getElementById: () => null
    }
  });
  runScriptInContext(aiCode, contextAi, 'js/ai.js');

  const {
    parseAndValidateAiPayload,
    computeAiDiffSummary,
    sanitizeAiResponseText,
    buildScopedAiPrompt
  } = contextAi;

  assert(typeof parseAndValidateAiPayload === 'function', 'parseAndValidateAiPayload should be defined');
  assert(typeof computeAiDiffSummary === 'function', 'computeAiDiffSummary should be defined');
  assert(typeof sanitizeAiResponseText === 'function', 'sanitizeAiResponseText should be defined');
  assert(typeof buildScopedAiPrompt === 'function', 'buildScopedAiPrompt should be defined');

  // Test 1: Markdown code fence stripping
  const fenced = "Here is your requested itinerary:\n```json\n{\n  \"meta\": {\"title\": \"Tokyo 2027\"},\n  \"cities\": [{\"id\": \"c1\", \"name\": \"Tokyo\"}],\n  \"itinerary\": []\n}\n```\nEnjoy your trip!";
  const cleaned = sanitizeAiResponseText(fenced);
  assert(!cleaned.includes('```'), 'sanitizeAiResponseText should strip markdown backticks');
  assert(cleaned.startsWith('{') && cleaned.endsWith('}'), 'Cleaned text should start and end with JSON brackets');

  // Test 2: Valid full trip parsing
  const fullTripParsed = parseAndValidateAiPayload(cleaned, { type: 'FULL_TRIP' });
  assert(fullTripParsed.valid === true, 'Valid trip payload must pass validation');
  assert(fullTripParsed.data.meta.title === 'Tokyo 2027', 'Parsed title should match');

  // Test 3: Malformed JSON handling
  const broken = "{ meta: { title: 'Broken }";
  const brokenParsed = parseAndValidateAiPayload(broken, { type: 'FULL_TRIP' });
  assert(brokenParsed.valid === false, 'Malformed JSON must fail validation');
  assert(brokenParsed.error && typeof brokenParsed.error === 'string', 'Should produce helpful error message');

  // Test 4: Scoped Day activity parsing
  const dayJson = `\`\`\`json
  {
    "date": "2026-06-15",
    "activities": [
      { "text": "Visit Sensoji Temple", "time": "09:00", "cost": "0", "notes": "Early morning" },
      { "text": "Tokyo Skytree", "time": "14:00", "cost": "2500" }
    ]
  }
  \`\`\``;
  const dayParsed = parseAndValidateAiPayload(dayJson, { type: 'DAY' });
  assert(dayParsed.valid === true, 'Valid day payload must pass validation');
  assert(dayParsed.data.activities.length === 2, 'Should extract 2 activities');

  // Test 5: Diff summary calculation
  const existingActivities = [
    { text: "Old Morning Walk", time: "08:00" },
    { text: "Visit Sensoji Temple", time: "10:00" }
  ];
  const newActivities = [
    { text: "Visit Sensoji Temple", time: "09:00" }, // modified time
    { text: "Tokyo Skytree", time: "14:00" }          // added
  ];
  const diff = computeAiDiffSummary(existingActivities, newActivities);
  assert(diff.added.length === 1 && diff.added[0].text === 'Tokyo Skytree', 'Diff should identify added activity');
  assert(diff.modified.length === 1 && diff.modified[0].text === 'Visit Sensoji Temple', 'Diff should identify modified activity');
  assert(diff.removed.length === 1 && diff.removed[0].text === 'Old Morning Walk', 'Diff should identify removed activity');

  // Test 6: Scoped prompt generation
  const scopedPrompt = buildScopedAiPrompt({
    scope: { type: 'DAY', date: '2026-06-15', cityName: 'Tokyo' },
    instruction: 'Make it a rainy day itinerary',
    existingActivities
  });
  assert(scopedPrompt.includes('Make it a rainy day itinerary'), 'Scoped prompt should contain instruction');
  assert(scopedPrompt.includes('Tokyo'), 'Scoped prompt should mention city');
  assert(scopedPrompt.includes('2026-06-15'), 'Scoped prompt should include date');
  assert(scopedPrompt.includes('EXPECTED JSON SCHEMA'), 'Scoped prompt should provide schema');

  console.log('✅ ALL AI Co-Pilot two-way ingestion & diff unit tests passed cleanly!');
}

if (require.main === module) {
  runAiCopilotTests();
}

module.exports = { runAiCopilotTests };
