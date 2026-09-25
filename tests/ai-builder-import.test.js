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

  // Test copyPrompt in js/ai.js uses showToast without calling alert
  let toastMessage = null;
  let alertCalled = false;
  let clipboardText = null;

  contextAi.showToast = msg => { toastMessage = msg; };
  contextAi.alert = () => { alertCalled = true; };
  contextAi.navigator = {
    clipboard: {
      writeText: async text => { clipboardText = text; }
    }
  };

  const promptOutputEl = { value: 'Test prompt text for AI' };
  contextAi.document = {
    getElementById: id => (id === 'aiPromptOutput' ? promptOutputEl : null)
  };

  const copyResult = await contextAi.copyPrompt();
  assert(copyResult === true, 'copyPrompt should return true on success');
  assert(clipboardText === 'Test prompt text for AI', 'copyPrompt should copy prompt text to clipboard');
  assert(toastMessage === 'Prompt copied to clipboard! Paste this into an AI to generate your trip JSON.', 'copyPrompt should trigger toast notification');
  assert(alertCalled === false, 'copyPrompt should not call native alert');
  console.log('  ✔ copyPrompt non-blocking toast verification passed');

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
      log: console.log,
      warn: console.warn,
      error: console.error
    },
    alert: () => {},
    confirm: () => true,
    L: {
      map: () => ({
        setView: () => {},
        fitBounds: () => {},
        remove: () => {},
        invalidateSize: () => {}
      }),
      tileLayer: () => ({ addTo: () => {} }),
      polyline: () => ({
        addTo: () => ({ bindPopup: () => {}, on: () => {} }),
        bindPopup: () => {},
        on: () => {},
        getBounds: () => ({})
      }),
      divIcon: () => ({}),
      marker: () => ({
        addTo: () => ({ bindPopup: () => {}, on: () => {} }),
        bindPopup: () => {},
        on: () => {}
      }),
      latLngBounds: () => ({})
    }
  });

  // Load scripts
  const defaultDataCode = loadSource('js/default-data.js');
  const utilsCode = loadSource('js/utils.js');
  const dataCode = loadSource('js/data.js');
  const mapCode = loadSource('js/map.js');

  runScriptInContext(defaultDataCode, context, 'js/default-data.js');
  runScriptInContext(utilsCode, context, 'js/utils.js');
  runScriptInContext(dataCode, context, 'js/data.js');
  runScriptInContext(mapCode, context, 'js/map.js');

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
  assert(baliCities[0].countryCode === 'ID', 'Bali must have countryCode ID');
  assert(baliCities[0].lat !== undefined && baliCities[0].lng !== undefined, 'Bali must have resolved coordinates');

  // Verify map coordinate resolution & destinations
  const getCityCoords = context.getCityCoords;
  assert(typeof getCityCoords === 'function', 'getCityCoords should be defined');
  const baliCoords = getCityCoords('Bali');
  assert(baliCoords && baliCoords.lat && baliCoords.lng, 'getCityCoords("Bali") must resolve valid coordinates');
  const dpsCoords = getCityCoords('Denpasar (DPS)');
  assert(dpsCoords && dpsCoords.lat && dpsCoords.lng, 'getCityCoords("Denpasar (DPS)") must resolve valid coordinates');
  const seminyakCoords = getCityCoords('Seminyak');
  assert(seminyakCoords && seminyakCoords.lat && seminyakCoords.lng, 'getCityCoords("Seminyak") must resolve valid coordinates');

  const collectPathStops = context.collectPathStops;
  const buildTravelSequence = context.buildTravelSequence;
  const buildMapDestinations = context.buildMapDestinations;
  assert(typeof buildMapDestinations === 'function', 'buildMapDestinations should be defined');

  const pathStops = collectPathStops();
  const travelSequence = buildTravelSequence(pathStops);
  const { destinations } = buildMapDestinations(travelSequence);
  assert(Array.isArray(destinations) && destinations.length >= 1, `Expected at least 1 destination on map, found ${destinations.length}`);
  assert(destinations.some(d => d.name === 'Bali' || d.id === 'city-bali'), 'Bali must be present in map destinations');

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
  console.log('  ✔ Bali coordinates resolved and journey map destinations verified');

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

  // Verify city add and delete lifecycle via dialog
  let mapRebuilt = false;
  let splitMapRebuilt = false;
  context.buildJourneyMap = () => { mapRebuilt = true; };
  context.buildDesktopSplitMap = () => { splitMapRebuilt = true; };

  const nameInput = context.document.getElementById('newCityName');
  nameInput.value = 'Lombok';
  await context.addNewCityFromDialog();

  const currentCitiesAfterAdd = context.getCurrentAppData().cities;
  const lombokCity = currentCitiesAfterAdd.find(c => c.name === 'Lombok');
  assert(lombokCity, 'New city "Lombok" should be added to citiesData');
  assert(mapRebuilt, 'buildJourneyMap should be called upon adding a city');
  assert(splitMapRebuilt, 'buildDesktopSplitMap should be called upon adding a city');
  console.log('  ✔ Adding a city via dialog successfully registers entity and triggers map rebuilds');

  mapRebuilt = false;
  splitMapRebuilt = false;
  context.deleteCityFromDialog(lombokCity.id);

  const currentCitiesAfterDelete = context.getCurrentAppData().cities;
  assert(!currentCitiesAfterDelete.some(c => c.id === lombokCity.id), 'Deleted city must be removed from citiesData');
  assert(mapRebuilt, 'buildJourneyMap should be called upon deleting a city');
  assert(splitMapRebuilt, 'buildDesktopSplitMap should be called upon deleting a city');
  console.log('  ✔ Deleting a city via dialog cleanly purges entity and triggers map rebuilds');

  // Test Live Injection of random city with staged coordinates & name preservation
  mapRebuilt = false;
  splitMapRebuilt = false;
  nameInput.value = 'Seminyak';
  context.window.__stagedCityCoords = {
    name: 'Seminyak',
    lat: -8.6913,
    lng: 115.1682,
    countryCode: 'ID',
    countryName: 'Indonesia'
  };

  await context.addNewCityFromDialog();
  const citiesAfterSeminyak = context.getCurrentAppData().cities;
  const seminyakCity = citiesAfterSeminyak.find(c => c.name === 'Seminyak');
  assert(seminyakCity, 'City "Seminyak" must be added without being renamed or replaced by an alias');
  assert(seminyakCity.name === 'Seminyak', 'City name must stay "Seminyak" (never renamed to alias)');
  assert(seminyakCity.lat === -8.6913, 'Seminyak must retain its live staged latitude');
  assert(seminyakCity.lng === 115.1682, 'Seminyak must retain its live staged longitude');
  assert(seminyakCity.countryCode === 'ID', 'Seminyak must retain its country code');

  // Verify added city is persisted in userCities
  const userCities = (context.getUserCities && context.getUserCities()) || (context.window && context.window.userCities) || context.userCities || [];
  const inUserCities = userCities.find(c => c.name === 'Seminyak');
  assert(inUserCities, 'Seminyak must be added to userCities');
  assert(inUserCities.lat === -8.6913, 'userCities entry must store latitude');
  assert(inUserCities.lng === 115.1682, 'userCities entry must store longitude');

  // Verify getCityCoords resolves Seminyak from map.js
  const liveSeminyakCoords = context.getCityCoords('Seminyak');
  assert(liveSeminyakCoords, 'getCityCoords must resolve coordinates for Seminyak');
  assert(liveSeminyakCoords.lat === -8.6913, 'getCityCoords lat matches');
  assert(liveSeminyakCoords.lng === 115.1682, 'getCityCoords lng matches');
  console.log('  ✔ Live city injection preserves exact name, captures coordinates, and stores in userCities');

  // Test autoResolveMissingTripCities for unmapped cities
  mapRebuilt = false;
  splitMapRebuilt = false;
  const unmappedCity = context.addOrUpdateCity('Aitutaki', 'Cook Islands', '', '', '', 'CK');
  delete unmappedCity.lat;
  delete unmappedCity.lng;
  assert(!context.cityHasStoredCoords(unmappedCity), 'Aitutaki initially has no stored coords');

  // Mock searchCityOnline for Aitutaki
  const mockSearchCityOnline = async (cityName) => {
    if (cityName === 'Aitutaki') {
      return { lat: -18.8572, lng: -159.7892, countryCode: 'CK', countryName: 'Cook Islands' };
    }
    return null;
  };
  context.searchCityOnline = mockSearchCityOnline;
  if (context.window) context.window.searchCityOnline = mockSearchCityOnline;

  await context.autoResolveMissingTripCities();
  assert(context.cityHasStoredCoords(unmappedCity), 'Aitutaki must receive resolved coordinates');
  assert(unmappedCity.lat === -18.8572, 'Aitutaki lat resolved');
  assert(unmappedCity.lng === -159.7892, 'Aitutaki lng resolved');
  assert(mapRebuilt, 'buildJourneyMap must be triggered upon auto-resolving missing cities');
  console.log('  ✔ autoResolveMissingTripCities asynchronously identifies and injects coordinates for unmapped cities');

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
