const fs = require('fs');
const path = require('path');
const { assert, createVmContext, runScriptInContext, loadSource } = require('./lib/test-helpers');

async function runAiBuilderImportTests() {
  console.log('Running AI Builder prompt & import hardening tests...');

  // 1. Test buildAiPrompt in js/ai.js
  const aiCode = loadSource('js/ai.js');
  const contextAi = createVmContext({
    document: {
      getElementById: () => null
    }
  });
  runScriptInContext(aiCode, contextAi, 'js/ai.js');

  const buildAiPrompt = contextAi.buildAiPrompt;
  assert(typeof buildAiPrompt === 'function', 'buildAiPrompt should be a function');

  const prompt = buildAiPrompt({
    title: 'Bali 2026',
    regions: 'Indonesia',
    dates: '13 Dec 2026 - 21 Dec 2026',
    citiesInput: 'Bali',
    cities: ['Bali'],
    junctions: 'Virgin dep, Batik return',
    vibe: 'Wellness, diving, fitness'
  });

  assert(prompt.includes('EXPECTED JSON SCHEMA'), 'Prompt must include EXPECTED JSON SCHEMA');
  assert(prompt.includes('"activityItems"'), 'Prompt must specify activityItems');
  assert(prompt.includes('"text": "'), 'Prompt schema must explicitly use "text" for activity items');
  assert(prompt.includes('NEVER use "title" instead of "text" for activityItems'), 'Prompt rules must forbid using title for activityItems');
  assert(prompt.includes('DO NOT append long itinerary descriptions or theme text'), 'Prompt rules must instruct clean leg labels');
  assert(prompt.includes('areaName'), 'Prompt schema must include nested packing area structure');
  assert(prompt.includes('cityId'), 'Prompt must emphasize cityId consistency');
  console.log('  ✔ buildAiPrompt schema & rules verification passed');

  // 2. Test importing the Bali 2026 fixture
  const fixturePath = path.join(__dirname, '../backups/test-fixtures/bali-2026.json');
  assert(fs.existsSync(fixturePath), 'bali-2026.json test fixture must exist');
  const baliData = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

  const localStorageData = new Map();
  const mockLocalStorage = {
    getItem: (key) => localStorageData.has(key) ? localStorageData.get(key) : null,
    setItem: (key, val) => localStorageData.set(key, String(val)),
    removeItem: (key) => localStorageData.delete(key),
    clear: () => localStorageData.clear()
  };

  const elements = new Map();
  const mockDocument = {
    getElementById: (id) => {
      if (!elements.has(id)) {
        elements.set(id, {
          id,
          style: {},
          innerText: '',
          innerHTML: '',
          value: '',
          classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
          closest: () => ({}),
          cloneNode: function() { return { ...this }; },
          parentNode: { replaceChild: () => {} },
          addEventListener: () => {},
          removeEventListener: () => {},
          setAttribute: () => {},
          removeAttribute: () => {},
          remove: function() { elements.delete(this.id); },
          appendChild: () => {},
          querySelectorAll: () => [],
          querySelector: () => null,
          dataset: {},
          textContent: ''
        });
      }
      return elements.get(id);
    },
    createElement: () => ({
      style: {},
      classList: { add: () => {}, remove: () => {}, toggle: () => {} },
      appendChild: () => {},
      addEventListener: () => {}
    }),
    body: {
      appendChild: () => {},
      classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
      style: {}
    },
    querySelectorAll: () => [],
    querySelector: () => null,
    addEventListener: () => {},
    removeEventListener: () => {}
  };

  const context = createVmContext({
    window: {
      isSecureContext: true,
      addEventListener: () => {},
      removeEventListener: () => {}
    },
    document: mockDocument,
    localStorage: mockLocalStorage,
    console: {
      log: () => {},
      warn: () => {},
      error: () => {}
    },
    alert: () => {}
  });

  // Load scripts
  const defaultDataCode = loadSource('js/default-data.js');
  const utilsCode = loadSource('js/utils.js');
  const dataCode = loadSource('js/data.js');

  runScriptInContext(defaultDataCode, context, 'js/default-data.js');
  runScriptInContext(utilsCode, context, 'js/utils.js');
  runScriptInContext(dataCode, context, 'js/data.js');

  const loadImportedPayload = context.loadImportedPayload || context.window.loadImportedPayload;
  assert(typeof loadImportedPayload === 'function', 'loadImportedPayload should be defined');

  await loadImportedPayload(baliData, 'bali-2026.json');

  const getCurrentAppData = context.getCurrentAppData || context.window.getCurrentAppData;
  assert(typeof getCurrentAppData === 'function', 'getCurrentAppData should be defined');
  const currentData = getCurrentAppData();

  const appData = currentData.itinerary;
  const citiesData = currentData.cities;
  const packingData = currentData.packing;

  // Verify city normalization
  assert(Array.isArray(citiesData) && citiesData.length > 0, 'citiesData must not be empty');

  const baliCities = citiesData.filter(c => c.id === 'city-bali');
  assert(baliCities.length === 1, `Expected exactly 1 city with id 'city-bali', found ${baliCities.length}`);

  const startCities = citiesData.filter(c => c.id === 'city-start' || String(c.name).toLowerCase() === 'start');
  assert(startCities.length === 0, 'Spurious transit city "Start" must NOT be created');

  const returnCities = citiesData.filter(c => c.id === 'city-return-home' || String(c.name).toLowerCase() === 'return home');
  assert(returnCities.length === 0, 'Spurious transit city "Return Home" must NOT be created');

  const descriptiveCities = citiesData.filter(c => String(c.name).toLowerCase().includes('wellness diving fitness'));
  assert(descriptiveCities.length === 0, 'Spurious transit city from descriptive leg label must NOT be created');

  // Verify destination cities
  const destinationCities = citiesData.filter(c => !c.isTransit);
  assert(destinationCities.length === 1, `Expected exactly 1 destination city, found ${destinationCities.length}`);
  console.log('  ✔ Phantom transit cities prevented and duplicate cities eliminated');

  // Verify day activity items have non-empty text
  let totalActivityItems = 0;
  let missingTextCount = 0;
  appData.forEach(leg => {
    (leg.days || []).forEach(day => {
      (day.activityItems || []).forEach(item => {
        totalActivityItems++;
        if (!item.text || !item.text.trim()) {
          missingTextCount++;
        }
      });
    });
  });
  assert(totalActivityItems > 0, 'Should have day activity items');
  assert(missingTextCount === 0, `All day activityItems must have non-empty text, but ${missingTextCount} were blank`);
  console.log(`  ✔ All ${totalActivityItems} day activity items normalized with valid text`);

  // Verify suggestedActivities have non-empty title
  let totalSuggested = 0;
  let missingTitleCount = 0;
  appData.forEach(leg => {
    (leg.suggestedActivities || []).forEach(act => {
      totalSuggested++;
      if (!act.title || !act.title.trim()) {
        missingTitleCount++;
      }
    });
  });
  assert(totalSuggested > 0, 'Should have suggested activities in pool');
  assert(missingTitleCount === 0, `All suggestedActivities must have non-empty title, but ${missingTitleCount} were blank`);
  console.log(`  ✔ All ${totalSuggested} suggested activities normalized with valid titles`);

  // Verify cityFood items have valid text
  let foodCount = 0;
  let blankFoodCount = 0;
  appData.forEach(leg => {
    (leg.cityFood || []).forEach(f => {
      foodCount++;
      if (!f.text || !f.text.trim()) blankFoodCount++;
      assert(!String(f.text).includes('[object Object]'), 'Food item text must not be [object Object]');
    });
  });
  assert(foodCount > 0, 'Should have food items');
  assert(blankFoodCount === 0, `All cityFood items must have valid text, but ${blankFoodCount} were blank`);
  console.log(`  ✔ All ${foodCount} cityFood items normalized with valid descriptions`);

  // Verify legTips items have valid text and not [object Object]
  let tipCount = 0;
  let blankTipCount = 0;
  appData.forEach(leg => {
    (leg.legTips || []).forEach(t => {
      tipCount++;
      const text = typeof t === 'string' ? t : (t.text || '');
      if (!text.trim()) blankTipCount++;
      assert(!String(text).includes('[object Object]'), 'Tip text must not be [object Object]');
    });
  });
  assert(tipCount > 0, 'Should have leg tips');
  assert(blankTipCount === 0, `All legTips must have valid text, but ${blankTipCount} were blank`);
  console.log(`  ✔ All ${tipCount} legTips normalized into readable text without [object Object]`);

  // Verify packingData
  assert(Array.isArray(packingData), 'packingData must be an array');
  packingData.forEach(area => {
    assert(typeof area === 'object' && area !== null, 'Each packing area must be an object');
    assert(typeof area.areaName === 'string', 'Packing area must have areaName string');
    assert(Array.isArray(area.categories), 'Packing area must have categories array');
  });
  console.log('  ✔ Packing data structure cleanly normalized into valid areas and categories');

  console.log('✅ ALL AI BUILDER PROMPT & IMPORT HARDENING TESTS PASSED CLEANLY!\n');
}

if (require.main === module) {
  runAiBuilderImportTests()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { runAiBuilderImportTests };
