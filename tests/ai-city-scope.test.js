const { assert, createVmContext, runScriptInContext, loadSource } = require('./lib/test-helpers');

function runAiCityScopeTests() {
  console.log('Running AI Co-Pilot multi-day CITY scope unit tests...');

  const aiCode = loadSource('js/ai.js');
  const contextAi = createVmContext({
    document: {
      getElementById: () => null
    }
  });
  runScriptInContext(aiCode, contextAi, 'js/ai.js');

  const {
    parseAndValidateAiPayload,
    buildScopedAiPrompt,
    computeAiDiffSummary
  } = contextAi;

  // Test 1: City multi-day prompt generation
  const cityDays = [
    {
      date: '2026-06-15',
      dayIndex: 0,
      activities: [{ text: 'Visit Shinjuku Gyoen', time: '10:00', cost: '500' }]
    },
    {
      date: '2026-06-16',
      dayIndex: 1,
      activities: [{ text: 'Meiji Shrine', time: '09:00', cost: '0' }]
    }
  ];

  const cityPrompt = buildScopedAiPrompt({
    scope: {
      type: 'CITY',
      cityName: 'Tokyo',
      legIndex: 1,
      cityDays
    },
    instruction: 'Add cultural workshops and optimize for a family traveling with a teenager'
  });

  assert(cityPrompt.includes('TARGET CITY CONTEXT: Tokyo'), 'City prompt must indicate Target City');
  assert(cityPrompt.includes('Day 1 (2026-06-15)'), 'City prompt must list Day 1 date');
  assert(cityPrompt.includes('Day 2 (2026-06-16)'), 'City prompt must list Day 2 date');
  assert(cityPrompt.includes('EXPECTED JSON SCHEMA'), 'City prompt must include schema with days array');

  // Test 2: Multi-day city response validation
  const cityResponseJson = `\`\`\`json
  {
    "city": "Tokyo",
    "days": [
      {
        "date": "2026-06-15",
        "desc": "Traditional gardens and modern anime culture",
        "activities": [
          { "text": "Visit Shinjuku Gyoen", "time": "09:30", "cost": "500" },
          { "text": "Akihabara Tech & Anime Tour", "time": "14:00", "cost": "1500" }
        ]
      },
      {
        "date": "2026-06-16",
        "desc": "Spiritual shrines and Harajuku youth culture",
        "activities": [
          { "text": "Meiji Shrine & Yoyogi Park", "time": "09:00", "cost": "0" },
          { "text": "Takeshita Street Crepe Walk", "time": "13:00", "cost": "800" }
        ]
      }
    ],
    "cityFood": [
      { "text": "Ichiran Ramen in Shibuya" },
      { "text": "Tsukiji Outer Market fresh sushi" }
    ],
    "legTips": [
      { "text": "Get a digital Suica card on Apple/Google Wallet" }
    ]
  }
  \`\`\``;

  const parsed = parseAndValidateAiPayload(cityResponseJson, { type: 'CITY', cityDays });
  assert(parsed.valid === true, 'Valid city multi-day payload must pass validation: ' + parsed.error);
  assert(Array.isArray(parsed.data.days) && parsed.data.days.length === 2, 'Must extract 2 days');
  assert(parsed.data.days[0].activities.length === 2, 'Day 1 should have 2 activities');
  assert(parsed.data.days[1].activities.length === 2, 'Day 2 should have 2 activities');
  assert(Array.isArray(parsed.data.cityFood) && parsed.data.cityFood.length === 2, 'Should extract cityFood quests');
  assert(Array.isArray(parsed.data.legTips) && parsed.data.legTips.length === 1, 'Should extract legTips');

  console.log('✅ ALL AI Co-Pilot multi-day CITY scope unit tests passed cleanly!');
}

if (require.main === module) {
  runAiCityScopeTests();
}

module.exports = { runAiCityScopeTests };
