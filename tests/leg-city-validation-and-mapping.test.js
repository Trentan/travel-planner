// tests/leg-city-validation-and-mapping.test.js
// Tests for valid city dropdowns, home city mapping, transport alignment, and auto-stays

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('--- Running Leg City Validation, Home Mapping & Auto-Stays Test Suite ---');

// Mock browser environment
function createMockDom() {
  const elements = {};
  
  function createElement(tag) {
    const el = {
      tagName: tag.toUpperCase(),
      id: '',
      value: '',
      textContent: '',
      innerHTML: '',
      style: {},
      dataset: {},
      options: [],
      parentNode: {
        replaceChild() {},
        removeChild() {},
        appendChild() {}
      },
      classList: {
        classes: new Set(),
        add(c) { this.classes.add(c); },
        remove(c) { this.classes.delete(c); },
        contains(c) { return this.classes.has(c); },
        toggle(c, force) {
          const shouldHave = typeof force === 'boolean' ? force : !this.classes.has(c);
          if (shouldHave) this.classes.add(c);
          else this.classes.delete(c);
          return shouldHave;
        }
      },
      cloneNode(deep) {
        const copy = createElement(this.tagName.toLowerCase());
        copy.id = this.id;
        copy.value = this.value;
        copy.innerHTML = this.innerHTML;
        return copy;
      },
      setAttribute(name, val) { this.dataset[name] = String(val); },
      getAttribute(name) { return this.dataset[name] || null; },
      removeAttribute(name) { delete this.dataset[name]; },
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() { return true; },
      querySelector() { return null; },
      querySelectorAll() { return []; },
      appendChild(child) {
        if (!child) return;
        this.options.push(child);
      }
    };
    
    // Support parsing simple option tags assigned to innerHTML
    Object.defineProperty(el, 'innerHTML', {
      get() { return this._innerHTML || ''; },
      set(html) {
        this._innerHTML = html;
        this.options = [];
        const optRegex = /<option[^>]*value="([^"]*)"[^>]*>(.*?)<\/option>/gi;
        let match;
        while ((match = optRegex.exec(html)) !== null) {
          this.options.push({
            value: match[1],
            text: match[2].replace(/<[^>]*>/g, '').trim(),
            textContent: match[2].replace(/<[^>]*>/g, '').trim()
          });
        }
      }
    });

    return el;
  }

  function getElementById(id) {
    if (!elements[id]) {
      elements[id] = createElement('div');
      elements[id].id = id;
    }
    return elements[id];
  }

  return {
    document: {
      getElementById,
      createElement
    },
    window: {
      alert: () => {},
      confirm: () => true,
      addEventListener: () => {},
      removeEventListener: () => {},
      location: { href: 'http://localhost:3000', search: '', hash: '' },
      history: { pushState: () => {}, replaceState: () => {} }
    }
  };
}

const mockDom = createMockDom();

// Setup VM sandbox with data, itinerary, crud, and auto-stays
const sandbox = {
  console,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  document: mockDom.document,
  window: mockDom.window,
  alert: () => {},
  confirm: () => true,
  isEditMode: false,
  buildItinerary: () => {},
  buildCityNav: () => {},
  buildJourneyMap: () => {},
  saveData: () => {},
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
  }
};
vm.createContext(sandbox);

// Load required scripts in sequence
const scripts = [
  'js/utils.js',
  'js/timezone.js',
  'js/data.js',
  'js/transport.js',
  'js/itinerary.js',
  'js/crud.js',
  'js/auto-stays.js'
];

for (const scriptPath of scripts) {
  const code = fs.readFileSync(path.join(__dirname, '..', scriptPath), 'utf8');
  vm.runInContext(code, sandbox, { filename: scriptPath });
}

// 1. Test getCityByName enhancements
console.log('Test 1: getCityByName token, emoji, airport code & ID matching...');
vm.runInContext(`
  citiesData = [
    { id: 'city-bali', name: 'Denpasar Bali', code: 'DPS', country: 'Indonesia' },
    { id: 'city-taipei', name: 'Taipei', code: 'TPE', country: 'Taiwan' },
    { id: 'city-paris', name: 'Paris', code: 'CDG', country: 'France' }
  ];

  // Token matching for retreat/theme label
  const match1 = getCityByName('🌴 Bali Wellness, Diving & Fitness');
  if (!match1 || match1.name !== 'Denpasar Bali') {
    throw new Error('Expected "Denpasar Bali" for "🌴 Bali Wellness, Diving & Fitness", got: ' + (match1 ? match1.name : null));
  }

  // Airport code in parenthetical
  const match2 = getCityByName('Denpasar (DPS)');
  if (!match2 || match2.name !== 'Denpasar Bali') {
    throw new Error('Expected "Denpasar Bali" for "Denpasar (DPS)", got: ' + (match2 ? match2.name : null));
  }

  // Exact ID match
  const match3 = getCityByName('city-bali');
  if (!match3 || match3.id !== 'city-bali') {
    throw new Error('Expected city-bali for "city-bali", got: ' + (match3 ? match3.id : null));
  }
`, sandbox);
console.log('✓ Test 1 Passed: getCityByName successfully resolves complex labels, airport codes, and IDs');

// 2. Test setSelectValueMatchingCity NEVER injects non-cities
console.log('Test 2: Dropdown validation - no fake city injection...');
vm.runInContext(`
  const select = document.createElement('select');
  select.innerHTML = '<option value="">-- Choose city --</option><option value="Home">🏠 Home (Brisbane - BNE)</option><option value="Denpasar Bali">🇮🇩 Denpasar Bali</option><option value="Taipei">🇹🇼 Taipei</option>';

  // Passing arbitrary retreat name should match Denpasar Bali if getCityByName resolves it,
  // but if an unrecognized string is passed, it must NEVER append a new option!
  setSelectValueMatchingCity(select, '🌴 Bali Wellness, Diving & Fitness');
  if (select.value !== 'Denpasar Bali') {
    throw new Error('Expected select to resolve to Denpasar Bali, got: ' + select.value);
  }
  if (select.options.length !== 4) {
    throw new Error('Expected exactly 4 options in select, got: ' + select.options.length);
  }

  // Passing completely unknown string
  setSelectValueMatchingCity(select, 'Totally Unknown Theme Name 12345', '');
  if (select.value !== '') {
    throw new Error('Expected empty value for unknown string, got: ' + select.value);
  }
  if (select.options.length !== 4) {
    throw new Error('Options were dynamically injected for unknown string! Option count: ' + select.options.length);
  }
`, sandbox);
console.log('✓ Test 2 Passed: Dynamic fake city injection is completely prevented');

// 3. Test onEditLegSelectionChange pre-populating city from and city to
console.log('Test 3: onEditLegSelectionChange populates city from and to...');
vm.runInContext(`
  titleData = { homeCity: 'Brisbane' };
  citiesData = [
    { id: 'city-bali', name: 'Denpasar Bali', code: 'DPS', country: 'Indonesia' },
    { id: 'city-taipei', name: 'Taipei', code: 'TPE', country: 'Taiwan' }
  ];

  _populateAddLegCityDropdowns();

  appData = [
    {
      id: 'leg-start',
      label: 'Brisbane (Trip Start)',
      days: [{ date: '2026-12-13', from: 'Brisbane', to: 'Denpasar Bali', completed: false }]
    },
    {
      id: 'leg-bali',
      label: '🌴 Bali Wellness, Diving & Fitness',
      cityId: 'city-bali',
      days: [
        { date: '2026-12-14', from: 'Denpasar Bali', to: 'Denpasar Bali', desc: 'Day 1' },
        { date: '2026-12-15', from: 'Denpasar Bali', to: 'Denpasar Bali', desc: 'Day 2' }
      ]
    },
    {
      id: 'leg-finish',
      label: 'Brisbane (Trip Finish)',
      days: [{ date: '2026-12-21', from: 'Denpasar Bali', to: 'Brisbane', completed: false }]
    }
  ];

  legDialogState.stagedLegs = JSON.parse(JSON.stringify(appData));

  // Edit Leg 1 (leg-bali)
  document.getElementById('editLegSelect').value = '1';
  onEditLegSelectionChange();

  const existingVal = document.getElementById('existingCitySelect').value;
  const fromVal = document.getElementById('fromCitySelect').value;
  const toVal = document.getElementById('toCitySelect').value;
  const legTypeVal = document.getElementById('legTypeSelect').value;

  if (existingVal !== 'Denpasar Bali') {
    throw new Error('Expected existingCitySelect to be "Denpasar Bali", got: ' + existingVal);
  }
  if (fromVal !== 'Denpasar Bali') {
    throw new Error('Expected fromCitySelect to be "Denpasar Bali", got: ' + fromVal);
  }
  if (toVal !== 'Denpasar Bali') {
    throw new Error('Expected toCitySelect to be "Denpasar Bali", got: ' + toVal);
  }
  if (legTypeVal !== 'city') {
    throw new Error('Expected legType to be "city", got: ' + legTypeVal);
  }

  const helperCityVal = document.getElementById('legOriginHelperCity').textContent;
  const helperDisplay = document.getElementById('legOriginHelperGroup').style.display;
  if (helperDisplay !== 'flex' || helperCityVal !== 'Brisbane') {
    throw new Error('Expected legOriginHelperCity to be "Brisbane" (from trip start) and visible, got: ' + helperCityVal + ', display: ' + helperDisplay);
  }

  // Test confirmAddLeg editing leg-bali
  document.getElementById('newLegStartDate').value = '2026-12-14';
  document.getElementById('newLegEndDate').value = '2026-12-16';
  confirmAddLeg();

  const editedLeg = appData[1];
  if (!editedLeg || !editedLeg.days || editedLeg.days.length !== 3) {
    throw new Error('Expected edited leg to have 3 days, got: ' + (editedLeg?.days?.length));
  }
  // Day 0 arrives from Brisbane (prior leg) to Denpasar Bali
  if (editedLeg.days[0].from !== 'Brisbane' || editedLeg.days[0].to !== 'Denpasar Bali') {
    throw new Error('Expected Day 0 to arrive from Brisbane to Denpasar Bali, got from: ' + editedLeg.days[0].from + ', to: ' + editedLeg.days[0].to);
  }
  // Day 1 & 2 stay in Denpasar Bali
  if (editedLeg.days[1].from !== 'Denpasar Bali' || editedLeg.days[1].to !== 'Denpasar Bali') {
    throw new Error('Expected Day 1 to stay in Denpasar Bali, got from: ' + editedLeg.days[1].from + ', to: ' + editedLeg.days[1].to);
  }
`, sandbox);
console.log('✓ Test 3 Passed: onEditLegSelectionChange correctly populates valid city from, city to, city selection, and origin helper');

// 4. Test Home City (Brisbane) Mapping for Trip Start and Trip Finish
console.log('Test 4: Home city mapping (Brisbane) for Trip Start and Trip Finish...');
vm.runInContext(`
  titleData = { homeCity: 'Brisbane' };
  buildItinerary = () => {};
  buildCityNav = () => {};
  saveData = () => {};

  // Edit Start Leg
  document.getElementById('editLegSelect').value = '0';
  onEditLegSelectionChange();
  if (document.getElementById('fromCitySelect').value !== 'Home') {
    throw new Error('Expected start leg fromCity to be Home, got: ' + document.getElementById('fromCitySelect').value);
  }
  document.getElementById('toCitySelect').value = 'Denpasar Bali';
  confirmAddLeg();

  const savedStart = appData[0];
  if (savedStart.label !== 'Brisbane (Trip Start)') {
    throw new Error('Expected label "Brisbane (Trip Start)", got: ' + savedStart.label);
  }
  if (savedStart.days[0].from !== 'Brisbane') {
    throw new Error('Expected day.from "Brisbane", got: ' + savedStart.days[0].from);
  }
  if (savedStart.days[0].to !== 'Denpasar Bali') {
    throw new Error('Expected day.to "Denpasar Bali", got: ' + savedStart.days[0].to);
  }

  // Edit Finish Leg
  document.getElementById('editLegSelect').value = '2';
  onEditLegSelectionChange();
  if (document.getElementById('toCitySelect').value !== 'Home') {
    throw new Error('Expected finish leg toCity to be Home, got: ' + document.getElementById('toCitySelect').value);
  }
  document.getElementById('fromCitySelect').value = 'Denpasar Bali';
  confirmAddLeg();

  const savedFinish = appData[2];
  if (savedFinish.label !== 'Brisbane (Trip Finish)') {
    throw new Error('Expected label "Brisbane (Trip Finish)", got: ' + savedFinish.label);
  }
  if (savedFinish.days[0].from !== 'Denpasar Bali') {
    throw new Error('Expected day.from "Denpasar Bali", got: ' + savedFinish.days[0].from);
  }
  if (savedFinish.days[0].to !== 'Brisbane') {
    throw new Error('Expected day.to "Brisbane", got: ' + savedFinish.days[0].to);
  }
`, sandbox);
console.log('✓ Test 4 Passed: Trip Start and Finish legs properly map Brisbane as Home city');

// 5. Test Transport Journey Alignment
console.log('Test 5: Transport journeys alignment in syncAllLegDays...');
vm.runInContext(`
  titleData = { homeCity: 'Brisbane' };
  window.journeys = [
    {
      id: 'j-1',
      fromLocation: 'Home City',
      toLocation: 'Denpasar (DPS)',
      departureDate: '2026-12-13',
      departureTime: '09:30',
      arrivalDate: '2026-12-13',
      arrivalTime: '14:30',
      legId: 'leg-start'
    },
    {
      id: 'j-2',
      fromLocation: 'Denpasar (DPS)',
      toLocation: 'Home City',
      departureDate: '2026-12-21',
      departureTime: '14:15',
      arrivalDate: '2026-12-21',
      arrivalTime: '21:45',
      legId: 'leg-finish'
    }
  ];

  window.stays = [];

  syncAllLegDays(true);

  if (window.journeys[0]._inferredFromLegId !== 'leg-start') {
    throw new Error('Expected j-1 _inferredFromLegId to be leg-start, got: ' + window.journeys[0]._inferredFromLegId);
  }
  if (window.journeys[1]._inferredToLegId !== 'leg-finish') {
    throw new Error('Expected j-2 _inferredToLegId to be leg-finish, got: ' + window.journeys[1]._inferredToLegId);
  }
`, sandbox);
console.log('✓ Test 5 Passed: Journeys align with Trip Start and Trip Finish legs');

// 6. Test Auto-Populate Stays
console.log('Test 6: Auto-populate stays detection and stay generation...');
vm.runInContext(`
  // Setup appData with 3 nights in Denpasar Bali
  appData = [
    {
      id: 'leg-start',
      label: 'Brisbane (Trip Start)',
      days: [{ date: '2026-12-13', from: 'Brisbane', to: 'Denpasar Bali' }]
    },
    {
      id: 'leg-bali',
      label: '🌴 Denpasar Bali',
      cityId: 'city-bali',
      days: [
        { date: '2026-12-13', from: 'Denpasar Bali', to: 'Denpasar Bali' },
        { date: '2026-12-14', from: 'Denpasar Bali', to: 'Denpasar Bali' },
        { date: '2026-12-15', from: 'Denpasar Bali', to: 'Denpasar Bali' },
        { date: '2026-12-16', from: 'Denpasar Bali', to: 'Denpasar Bali' }
      ]
    },
    {
      id: 'leg-finish',
      label: 'Brisbane (Trip Finish)',
      days: [{ date: '2026-12-16', from: 'Denpasar Bali', to: 'Brisbane' }]
    }
  ];

  window.stays = [];
  const expected = calculateExpectedStays();
  if (expected['Denpasar Bali'] !== 3) {
    throw new Error('Expected 3 nights in Denpasar Bali, got: ' + expected['Denpasar Bali']);
  }
  if (expected['Brisbane']) {
    throw new Error('Transit legs should not have expected stays for Brisbane, got: ' + expected['Brisbane']);
  }

  const missing = getMissingStays();
  if (missing.missing['Denpasar Bali'] !== 3) {
    throw new Error('Expected 3 missing nights in Denpasar Bali, got: ' + missing.missing['Denpasar Bali']);
  }

  const createdCount = autopopulateStays();
  if (createdCount !== 1) {
    throw new Error('Expected 1 stay created, got: ' + createdCount);
  }
  if (!window.stays || window.stays.length !== 1) {
    throw new Error('Expected 1 stay in window.stays, got: ' + (window.stays ? window.stays.length : 0));
  }
  if (window.stays[0].cityId !== 'city-bali') {
    throw new Error('Expected created stay cityId to be city-bali, got: ' + window.stays[0].cityId);
  }
  if (window.stays[0].nights !== 3) {
    throw new Error('Expected created stay nights to be 3, got: ' + window.stays[0].nights);
  }
`, sandbox);
console.log('✓ Test 6 Passed: Auto-populate stays accurately creates missing accommodation');

// 7. Test Bali trip itinerary rebuild date preservation (No doubling of days)
console.log('Test 7: Rebuilding itinerary preserves exact leg days without doubling (Bali test)...');
const baliFixture = JSON.parse(fs.readFileSync('backups/test-fixtures/bali-2026.json', 'utf8'));
sandbox._testBaliData = baliFixture;
vm.runInContext(`
  const baliData = _testBaliData;
  appData = JSON.parse(JSON.stringify(baliData.itinerary));
  window.journeys = JSON.parse(JSON.stringify(baliData.journeys || []));
  window.stays = JSON.parse(JSON.stringify(baliData.stays || []));
  citiesData = JSON.parse(JSON.stringify(baliData.cities || []));
  titleData = JSON.parse(JSON.stringify(baliData.meta || {}));

  const origLegStartDays = appData[0].days.length; // 1 day: 2026-12-13
  const origLegBaliDays = appData[1].days.length;  // 7 days: 2026-12-14 to 2026-12-20
  const origLegReturnDays = appData[2].days.length; // 1 day: 2026-12-21

  if (origLegStartDays !== 1 || origLegBaliDays !== 7 || origLegReturnDays !== 1) {
    throw new Error('Fixture day lengths mismatch: ' + [origLegStartDays, origLegBaliDays, origLegReturnDays].join(', '));
  }

  // Execute rebuild
  rebuildItineraryAndDataMappings({ showToast: false });

  if (appData[0].days.length !== origLegStartDays) {
    throw new Error('Leg 0 days changed after rebuild! Expected ' + origLegStartDays + ', got ' + appData[0].days.length);
  }
  if (appData[1].days.length !== origLegBaliDays) {
    throw new Error('Leg 1 (Bali) days doubled/changed after rebuild! Expected ' + origLegBaliDays + ', got ' + appData[1].days.length);
  }
  if (appData[2].days.length !== origLegReturnDays) {
    throw new Error('Leg 2 days changed after rebuild! Expected ' + origLegReturnDays + ', got ' + appData[2].days.length);
  }

  if (appData[1].days[0].date !== '2026-12-14' || appData[1].days[appData[1].days.length - 1].date !== '2026-12-20') {
    throw new Error('Leg 1 (Bali) date span corrupted! Got: ' + appData[1].days[0].date + ' to ' + appData[1].days[appData[1].days.length - 1].date);
  }
`, sandbox);
console.log('✓ Test 7 Passed: Bali trip rebuild retains exact 7-day span and prevents doubled days');

console.log('🎉 ALL LEG CITY VALIDATION, HOME MAPPING & AUTO-STAYS TESTS PASSED CLEANLY!');
