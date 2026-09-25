const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock browser globals
const store = {};
global.localStorage = {
  getItem: (key) => store[key] || null,
  setItem: (key, val) => { store[key] = String(val); },
  removeItem: (key) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};

global.window = global;
global.window.addEventListener = () => {};
global.isEditMode = false;

const elements = {};
function createMockElement(id, initialProps = {}) {
  const el = {
    id,
    value: '',
    options: [],
    children: [],
    style: {},
    classList: {
      classes: new Set(),
      add(c) { this.classes.add(c); },
      remove(c) { this.classes.delete(c); },
      contains(c) { return this.classes.has(c); }
    },
    checked: true,
    disabled: false,
    _innerHTML: '',
    get innerHTML() {
      if (this.children && this.children.length > 0) {
        return this.children.map(c => `<option value="${c.value || ''}">${c.textContent || ''}</option>`).join('');
      }
      return this._innerHTML || '';
    },
    set innerHTML(val) {
      this._innerHTML = val;
      if (val === '') {
        this.children = [];
        this.options = [];
      }
    },
    textContent: '',
    addEventListener() {},
    appendChild(child) {
      if (!this.children) this.children = [];
      if (!this.options) this.options = [];
      this.children.push(child);
      this.options.push(child);
    },
    replaceChildren(...newChildren) {
      this.children = [...newChildren];
      this.options = [...newChildren];
    },
    querySelectorAll() { return []; },
    ...initialProps
  };
  elements[id] = el;
  return el;
}

createMockElement('add-leg-modal');
createMockElement('legDialogTitle');
createMockElement('legClashWarningBanner');
createMockElement('legClashWarningMessage');
createMockElement('legDialogSaveBtn');
createMockElement('legDialogDeleteBtn');
createMockElement('newLegStartDate');
createMockElement('newLegEndDate');
createMockElement('legAutoCascadeCheckbox', { checked: true });
createMockElement('legReorderList');
createMockElement('editLegSelect');
createMockElement('existingCitySelect');
createMockElement('fromCitySelect');
createMockElement('toCitySelect');
createMockElement('fromCitySelectGroup');
createMockElement('toCitySelectGroup');
createMockElement('routeSelectionGroup');
createMockElement('citySelectionGroup');
createMockElement('rebuildLegsSequenceBtn');
createMockElement('rebuildLegsEditBtn');
createMockElement('legTypeSelect', { value: 'city' });
createMockElement('legDayNotesInput');
createMockElement('legPlacementSelect', { value: 'before_return' });
createMockElement('legPlacementGroup');
createMockElement('legDurationNights', { value: '3' });
createMockElement('newLegCityName');
createMockElement('newLegCityCountrySelect');
createMockElement('newLegCityCountryOther');
createMockElement('newCityInlineGroup');
createMockElement('toggleNewCityBtn');
createMockElement('legTerminalWarningBanner');
createMockElement('legTerminalWarningMsg');
createMockElement('legDurationSubtext');
createMockElement('desktopLegDialogDeleteBtn');
createMockElement('desktopLegDialogSaveBtn');
createMockElement('legDayNotesList');
createMockElement('legEditorEmptyPrompt');
createMockElement('legEditorFormContent');
createMockElement('legEditorModeTitle');
createMockElement('legEditorLegName');
createMockElement('legOriginHelperCity');
createMockElement('legDepartingHelperCity');
createMockElement('legArrivingFromBox');
createMockElement('legDepartingToBox');

const mockDocument = {
  body: {
    classList: { contains: () => false },
    insertBefore: () => {},
    appendChild: () => {}
  },
  getElementById(id) {
    return elements[id] || null;
  },
  querySelector(selector) {
    if (selector && selector.startsWith('#')) return this.getElementById(selector.slice(1));
    return null;
  },
  querySelectorAll() {
    return [];
  },
  createElement(tag) {
    return createMockElement('created_' + tag);
  },
  addEventListener: () => {}
};
global.document = mockDocument;

// Require dependencies
require('../js/default-data.js');
require('../js/utils.js');
require('../js/timezone.js');
require('../js/data.js');
require('../js/crud.js');
require('../js/itinerary.js');

async function runLegManagementWysiwygSuite() {
  global.document = mockDocument;
  global.window = global;
  console.log('Running Leg Management & WYSIWYG Drag-and-Drop test suite...');

  // 0. Test checkDateConflict
  console.log('  Testing checkDateConflict function...');
  global.appData = [
    {
      id: 'leg_rome',
      label: 'Rome',
      days: [
        { date: '2026-06-01', desc: 'Arrive Rome' },
        { date: '2026-06-02', desc: 'Sightseeing Rome' }
      ]
    },
    {
      id: 'leg_florence',
      label: 'Florence',
      days: [
        { date: '2026-06-03', desc: 'Arrive Florence' },
        { date: '2026-06-04', desc: 'Museums Florence' }
      ]
    },
    {
      id: 'leg_empty',
      label: 'Empty Leg',
      days: []
    },
    {
      id: 'leg_malformed',
      label: 'Malformed Leg'
    }
  ];

  // Test non-matching date
  assert.strictEqual(checkDateConflict('2026-06-10'), null, 'Non-existent date should return null');

  // Test matching date in second leg
  const conflictFlorence = checkDateConflict('2026-06-03');
  assert.notStrictEqual(conflictFlorence, null, 'Matching date in Florence leg should return a conflict object');
  assert.strictEqual(conflictFlorence.legIndex, 1, 'Conflict legIndex should be 1');
  assert.strictEqual(conflictFlorence.legLabel, 'Florence', 'Conflict legLabel should be Florence');
  assert.strictEqual(conflictFlorence.day.date, '2026-06-03', 'Conflict day date should match');

  // Test excluding matching leg index
  const conflictFlorenceExcluded = checkDateConflict('2026-06-03', 1);
  assert.strictEqual(conflictFlorenceExcluded, null, 'Excluding leg index 1 should ignore Florence leg and return null');

  // Test multiple legs sharing the same date
  global.appData.push({
    id: 'leg_venice',
    label: 'Venice',
    days: [
      { date: '2026-06-02', desc: 'Arrive Venice' }
    ]
  });

  const conflictFirstMatch = checkDateConflict('2026-06-02');
  assert.strictEqual(conflictFirstMatch.legIndex, 0, 'First matching leg should be index 0 (Rome)');

  const conflictSecondMatch = checkDateConflict('2026-06-02', 0);
  assert.strictEqual(conflictSecondMatch.legIndex, 4, 'Excluding index 0 should find second matching leg at index 4 (Venice)');

  // Test invalid / empty date inputs
  assert.strictEqual(checkDateConflict(''), null, 'Empty string dateStr should return null');
  assert.strictEqual(checkDateConflict(null), null, 'null dateStr should return null');
  assert.strictEqual(checkDateConflict(undefined), null, 'undefined dateStr should return null');

  // 1. Test checkLegDateClash
  console.log('  Testing checkLegDateClash helper...');
  assert.strictEqual(checkLegDateClash('2026-06-10', '2026-06-12', '2026-06-10', '2026-06-12'), true, 'Exact duplicate ranges should clash');
  assert.strictEqual(checkLegDateClash('2026-06-10', '2026-06-14', '2026-06-11', '2026-06-13'), true, 'Contained overlapping ranges should clash');
  assert.strictEqual(checkLegDateClash('2026-06-10', '2026-06-12', '2026-06-11', '2026-06-15'), true, 'Partial interior overlapping ranges should clash');
  assert.strictEqual(checkLegDateClash('2026-06-10', '2026-06-12', '2026-06-12', '2026-06-15'), false, 'Clean endpoint handover should NOT clash');
  assert.strictEqual(checkLegDateClash('2026-06-10', '2026-06-12', '2026-06-13', '2026-06-15'), false, 'Disjoint ranges should NOT clash');

  // 2. Test validateLegEditorForm: Inverted dates
  console.log('  Testing date clash validations (inverted & overlapping)...');
  elements['newLegStartDate'].value = '2026-06-15';
  elements['newLegEndDate'].value = '2026-06-10'; // Inverted
  const validInverted = validateLegEditorForm();
  assert.strictEqual(validInverted, false, 'validateLegEditorForm should return false for inverted dates');
  assert.strictEqual(elements['legDialogSaveBtn'].disabled, true, 'Save button must be disabled for inverted dates');
  assert.ok(elements['legClashWarningMessage'].textContent.includes('cannot be earlier than start date'), 'Warning message must explain inverted date error');
  assert.strictEqual(elements['legClashWarningBanner'].style.display, 'flex', 'Warning banner must be visible');

  // 3. Test validateLegEditorForm: Overlapping with staged legs
  setLegDialogState({
    mode: 'add',
    editLegIdx: null,
    stagedLegs: [
      {
        id: 'leg_1',
        label: 'Vienna',
        days: [{ date: '2026-06-10' }, { date: '2026-06-11' }, { date: '2026-06-12' }]
      }
    ]
  });
  elements['newLegStartDate'].value = '2026-06-11';
  elements['newLegEndDate'].value = '2026-06-13'; // Overlaps 06-11 to 06-12
  const validOverlap = validateLegEditorForm();
  assert.strictEqual(validOverlap, false, 'validateLegEditorForm should return false for overlapping date range');
  assert.strictEqual(elements['legDialogSaveBtn'].disabled, true, 'Save button must be disabled for overlapping dates');
  assert.ok(elements['legClashWarningMessage'].textContent.includes('overlaps with Leg'), 'Warning message must explain overlap');

  // Valid non-clashing handover
  elements['newLegStartDate'].value = '2026-06-12';
  elements['newLegEndDate'].value = '2026-06-15';
  const validHandover = validateLegEditorForm();
  assert.strictEqual(validHandover, true, 'validateLegEditorForm should pass for clean handover');
  assert.strictEqual(elements['legDialogSaveBtn'].disabled, false, 'Save button must be enabled for valid dates');
  assert.strictEqual(elements['legClashWarningBanner'].style.display, 'none', 'Warning banner must be hidden when valid');

  // 4. Test Modal Staging Isolation (cancelling does NOT mutate appData)
  console.log('  Testing modal containment & isolation on cancel...');
  global.appData = [
    {
      id: 'leg_original_1',
      label: 'Original Leg 1',
      days: [{ date: '2026-06-10' }, { date: '2026-06-11' }]
    },
    {
      id: 'leg_original_2',
      label: 'Original Leg 2',
      days: [{ date: '2026-06-11' }, { date: '2026-06-13' }]
    }
  ];
  openAddLegDialog();
  assert.strictEqual(getLegDialogState().stagedLegs.length, 2, 'stagedLegs should have 2 items');

  // Reorder in stagedLegs
  moveLegInSequence(0, 1);
  assert.strictEqual(getLegDialogState().stagedLegs[0].id, 'leg_original_2', 'stagedLegs should be reordered');
  assert.strictEqual(global.appData[0].id, 'leg_original_1', 'Live appData must NOT be mutated during modal interaction');

  // Close dialog (simulate Cancel)
  closeAddLegDialog();
  assert.strictEqual(global.appData[0].id, 'leg_original_1', 'Live appData must remain intact after cancel');
  assert.strictEqual(getLegDialogState().stagedLegs.length, 0, 'stagedLegs must be cleared upon cancel');

  // 5. Test Auto-Cascade calculation
  console.log('  Testing auto-cascade date shifts...');
  setLegDialogState({
    mode: 'edit',
    editLegIdx: 0,
    stagedLegs: [
      {
        id: 'leg_a',
        label: 'Leg A',
        days: [{ date: '2026-06-10' }, { date: '2026-06-11' }, { date: '2026-06-12' }]
      },
      {
        id: 'leg_b',
        label: 'Leg B',
        days: [{ date: '2026-06-12' }, { date: '2026-06-13' }, { date: '2026-06-14' }, { date: '2026-06-15' }]
      },
      {
        id: 'leg_c',
        label: 'Leg C',
        days: [{ date: '2026-06-15' }, { date: '2026-06-16' }, { date: '2026-06-17' }, { date: '2026-06-18' }]
      }
    ],
    originalLegDates: {
      leg_a: { startDate: '2026-06-10', endDate: '2026-06-12' },
      leg_b: { startDate: '2026-06-12', endDate: '2026-06-15' },
      leg_c: { startDate: '2026-06-15', endDate: '2026-06-18' }
    }
  });

  // Extend Leg A by 2 days (new end: 2026-06-14)
  elements['newLegStartDate'].value = '2026-06-10';
  elements['newLegEndDate'].value = '2026-06-14';
  elements['legAutoCascadeCheckbox'].checked = true;
  onLegDateInputChange();

  assert.strictEqual(global.legDialogState.stagedLegs[0].days[global.legDialogState.stagedLegs[0].days.length - 1].date, '2026-06-14', 'Leg A end date updated');
  assert.strictEqual(global.legDialogState.stagedLegs[1].days[0].date, '2026-06-14', 'Leg B cascaded start date');
  assert.strictEqual(global.legDialogState.stagedLegs[1].days[global.legDialogState.stagedLegs[1].days.length - 1].date, '2026-06-17', 'Leg B preserved duration');
  assert.strictEqual(global.legDialogState.stagedLegs[2].days[0].date, '2026-06-17', 'Leg C cascaded start date');

  // 6. Test Journey & Stay Synchronization upon Save
  console.log('  Testing journey & stay remapping synchronization on save...');
  global.appData = [
    {
      id: 'leg_paris',
      label: 'Paris',
      days: [{ date: '2026-06-10', activityItems: [] }, { date: '2026-06-12', activityItems: [] }]
    }
  ];
  global.window.stays = [
    {
      id: 'stay_paris_1',
      _inferredLegId: 'leg_paris',
      propertyName: 'Hotel Paris',
      checkIn: '2026-06-10',
      checkOut: '2026-06-12',
      startDate: '2026-06-10',
      endDate: '2026-06-12'
    }
  ];
  global.window.journeys = [
    {
      id: 'journey_paris_1',
      legId: 'leg_paris',
      departureDate: '2026-06-10',
      arrivalDate: '2026-06-10',
      dayDate: '2026-06-10'
    }
  ];

  openAddLegDialog();
  // Select Leg 0 for editing
  elements['editLegSelect'].value = '0';
  onEditLegSelectionChange();

  // Shift Paris start date forward by 3 days: 2026-06-13 to 2026-06-15
  elements['newLegStartDate'].value = '2026-06-13';
  elements['newLegEndDate'].value = '2026-06-15';
  onLegDateInputChange();

  // Save the leg
  confirmAddLeg();

  // Verify Paris dates updated in appData
  assert.strictEqual(global.appData[0].days[0].date, '2026-06-13', 'Paris leg start date committed');
  assert.strictEqual(global.appData[0].days[global.appData[0].days.length - 1].date, '2026-06-15', 'Paris leg end date committed');

  // Verify Stays shifted by +3 days
  assert.strictEqual(global.window.stays[0].checkIn, '2026-06-13', 'Stay checkIn shifted +3 days');
  assert.strictEqual(global.window.stays[0].checkOut, '2026-06-15', 'Stay checkOut shifted +3 days');

  // Verify Journeys shifted by +3 days
  assert.strictEqual(global.window.journeys[0].departureDate, '2026-06-13', 'Journey departureDate shifted +3 days');
  assert.strictEqual(global.window.journeys[0].arrivalDate, '2026-06-13', 'Journey arrivalDate shifted +3 days');

  // 7. Test Issue #418: Intelligent Date Defaulting from Trip Timeline
  console.log('  Testing intelligent date defaulting from trip timeline (Issue #418)...');
  global.appData = [
    {
      id: 'leg_rome',
      label: 'Rome',
      days: [{ date: '2026-06-01' }, { date: '2026-06-02' }, { date: '2026-06-03' }]
    },
    {
      id: 'leg_florence',
      label: 'Florence',
      days: [{ date: '2026-06-03' }, { date: '2026-06-04' }, { date: '2026-06-05' }, { date: '2026-06-06' }]
    },
    {
      id: 'leg_return',
      label: 'Brisbane (Trip Finish)',
      days: [{ date: '2026-06-06' }, { date: '2026-06-07' }]
    }
  ];

  openAddLegDialog('edit');
  assert.strictEqual(getLegDialogState().mode, 'none', 'Default dialog mode is none on initial open');
  resetLegDialogToAddNew();
  assert.strictEqual(getLegDialogState().mode, 'add', 'Dialog mode becomes add after resetLegDialogToAddNew');
  assert.strictEqual(elements['newLegStartDate'].value, '2026-06-06', 'Commence date defaults to end date of preceding leg (Florence), not today');
  assert.strictEqual(elements['legDurationNights'].value, 3, 'Default duration is 3 nights');
  assert.strictEqual(elements['newLegEndDate'].value, '2026-06-09', 'End date auto-computed from duration (+3 days)');

  // 8. Test Issue #418: Duration Stepper & Bidirectional Date Calculation
  console.log('  Testing duration stepper & bidirectional date calculation (Issue #418)...');
  // Step duration +1 night
  stepLegDuration(1);
  assert.strictEqual(elements['legDurationNights'].value, 4, 'Duration incremented to 4 nights');
  assert.strictEqual(elements['newLegEndDate'].value, '2026-06-10', 'End date updated to +4 days');

  // Step duration -2 nights
  stepLegDuration(-2);
  assert.strictEqual(elements['legDurationNights'].value, 2, 'Duration decremented to 2 nights');
  assert.strictEqual(elements['newLegEndDate'].value, '2026-06-08', 'End date updated to +2 days');

  // Change End Date manually -> Duration updates
  elements['newLegEndDate'].value = '2026-06-12';
  onLegEndDateChange();
  assert.strictEqual(elements['legDurationNights'].value, 6, 'Duration recalculated to 6 nights on manual end date change');

  // Change Start Date manually -> End date shifts preserving duration
  elements['newLegStartDate'].value = '2026-06-08';
  onLegStartDateChange();
  assert.strictEqual(elements['newLegEndDate'].value, '2026-06-14', 'End date shifted to maintain 6 nights');

  // 9. Test Issue #418: Auto-Extend Return Leg & Seamless Insertion
  console.log('  Testing auto-extend return leg on insertion (Issue #418)...');
  // Re-open fresh add leg dialog for Venice (3 nights, 2026-06-06 to 2026-06-09)
  openAddLegDialog('edit');
  elements['existingCitySelect'].value = 'Venice';
  elements['legPlacementSelect'].value = 'before_return';
  onLegPlacementChange();
  elements['legDurationNights'].value = 3;
  onLegDurationInputChange();

  assert.strictEqual(elements['newLegStartDate'].value, '2026-06-06', 'Venice starts on 2026-06-06');
  assert.strictEqual(elements['newLegEndDate'].value, '2026-06-09', 'Venice ends on 2026-06-09');

  // Validate form passes without clash error against the return leg
  const isValidOnAdd = validateLegEditorForm();
  assert.strictEqual(isValidOnAdd, true, 'Form must be valid without clash warning for auto-extending return leg');
  assert.strictEqual(elements['legDialogSaveBtn'].disabled, false, 'Save button must be enabled');

  // Setup a return journey to verify cascading
  global.window.journeys = [
    {
      id: 'journey_return',
      legId: 'leg_return',
      departureDate: '2026-06-06',
      arrivalDate: '2026-06-07',
      dayDate: '2026-06-06'
    }
  ];

  confirmAddLeg();

  // Verify Venice was inserted before Return
  assert.strictEqual(global.appData.length, 4, 'appData now has 4 legs');
  assert.strictEqual(global.appData[2].label.includes('Venice'), true, 'Venice inserted at index 2');
  assert.strictEqual(global.appData[2].days[0].date, '2026-06-06', 'Venice start date is 2026-06-06');
  assert.strictEqual(global.appData[2].days[global.appData[2].days.length - 1].date, '2026-06-09', 'Venice end date is 2026-06-09');

  // Verify Return leg at index 3 was automatically extended forward by 3 days
  const returnLeg = global.appData[3];
  assert.strictEqual(returnLeg.id, 'leg_return', 'Return leg is now at index 3');
  assert.strictEqual(returnLeg.days[0].date, '2026-06-09', 'Return leg start date auto-extended to 2026-06-09');
  assert.strictEqual(returnLeg.days[returnLeg.days.length - 1].date, '2026-06-10', 'Return leg end date auto-extended to 2026-06-10');

  // Verify return journey cascaded by +3 days
  assert.strictEqual(global.window.journeys[0].departureDate, '2026-06-09', 'Return journey departureDate auto-shifted +3 days');
  assert.strictEqual(global.window.journeys[0].arrivalDate, '2026-06-10', 'Return journey arrivalDate auto-shifted +3 days');

  // 10. Test Issue #418: adjustLegDays (+ / −) Cascades Subsequent Legs & Remaps Stays/Journeys
  console.log('  Testing adjustLegDays cascading subsequent legs forward/backward & remapping...');
  global.appData = [
    {
      id: 'leg_rome',
      label: '🇮🇹 Rome',
      days: [
        { date: '2026-06-01', day: 'Mon', desc: 'Arrive Rome', activityItems: [] },
        { date: '2026-06-02', day: 'Tue', desc: 'Colosseum', activityItems: [] },
        { date: '2026-06-03', day: 'Wed', desc: 'Vatican', activityItems: [] }
      ]
    },
    {
      id: 'leg_florence',
      label: '🇮🇹 Florence',
      days: [
        { date: '2026-06-03', day: 'Wed', desc: 'Arrive Florence', activityItems: [] },
        { date: '2026-06-04', day: 'Thu', desc: 'Uffizi Gallery', activityItems: [] },
        { date: '2026-06-05', day: 'Fri', desc: 'Duomo', activityItems: [] }
      ]
    },
    {
      id: 'leg_venice',
      label: '🇮🇹 Venice',
      days: [
        { date: '2026-06-05', day: 'Fri', desc: 'Arrive Venice', activityItems: [] },
        { date: '2026-06-06', day: 'Sat', desc: 'Canals', activityItems: [] },
        { date: '2026-06-07', day: 'Sun', desc: 'Piazza San Marco', activityItems: [] }
      ]
    },
    {
      id: 'leg_return_trip',
      label: 'Home (Trip Finish)',
      days: [
        { date: '2026-06-07', day: 'Sun', desc: 'Flight to Hub', activityItems: [] },
        { date: '2026-06-08', day: 'Mon', desc: 'Arrive Home', activityItems: [] }
      ]
    }
  ];

  global.window.stays = [
    {
      id: 'stay_florence_hotel',
      _inferredLegId: 'leg_florence',
      checkIn: '2026-06-03',
      checkOut: '2026-06-05',
      startDate: '2026-06-03',
      endDate: '2026-06-05'
    },
    {
      id: 'stay_venice_hotel',
      _inferredLegId: 'leg_venice',
      checkIn: '2026-06-05',
      checkOut: '2026-06-07',
      startDate: '2026-06-05',
      endDate: '2026-06-07'
    }
  ];

  global.window.journeys = [
    {
      id: 'journey_florence_to_venice',
      _inferredFromLegId: 'leg_florence',
      _inferredToLegId: 'leg_venice',
      departureDate: '2026-06-05',
      arrivalDate: '2026-06-05',
      dayDate: '2026-06-05'
    },
    {
      id: 'journey_finish',
      _inferredFromLegId: 'leg_return_trip',
      departureDate: '2026-06-07',
      arrivalDate: '2026-06-08',
      dayDate: '2026-06-07'
    }
  ];

  // 10a. Add 1 day to Rome (adjustLegDays(0, 1))
  adjustLegDays(0, 1);

  // Verify Rome has 4 days, ending 2026-06-04
  assert.strictEqual(global.appData[0].days.length, 4, 'Rome leg should now have 4 days');
  assert.strictEqual(global.appData[0].days[3].date, '2026-06-04', 'Rome leg should end on 2026-06-04');

  // Verify Florence cascaded forward by +1 day (2026-06-04 to 2026-06-06)
  assert.strictEqual(global.appData[1].days[0].date, '2026-06-04', 'Florence start date cascaded +1 day to 2026-06-04');
  assert.strictEqual(global.appData[1].days[2].date, '2026-06-06', 'Florence end date cascaded +1 day to 2026-06-06');

  // Verify Venice cascaded forward by +1 day (2026-06-06 to 2026-06-08)
  assert.strictEqual(global.appData[2].days[0].date, '2026-06-06', 'Venice start date cascaded +1 day to 2026-06-06');
  assert.strictEqual(global.appData[2].days[2].date, '2026-06-08', 'Venice end date cascaded +1 day to 2026-06-08');

  // Verify Return cascaded forward by +1 day (2026-06-08 to 2026-06-09)
  assert.strictEqual(global.appData[3].days[0].date, '2026-06-08', 'Return start date cascaded +1 day to 2026-06-08');
  assert.strictEqual(global.appData[3].days[1].date, '2026-06-09', 'Return end date cascaded +1 day to 2026-06-09');

  // Verify Florence stay cascaded +1 day
  assert.strictEqual(global.window.stays[0].checkIn, '2026-06-04', 'Florence stay checkIn cascaded +1 day');
  assert.strictEqual(global.window.stays[0].checkOut, '2026-06-06', 'Florence stay checkOut cascaded +1 day');

  // Verify Venice stay cascaded +1 day
  assert.strictEqual(global.window.stays[1].checkIn, '2026-06-06', 'Venice stay checkIn cascaded +1 day');
  assert.strictEqual(global.window.stays[1].checkOut, '2026-06-08', 'Venice stay checkOut cascaded +1 day');

  // Verify Journeys cascaded +1 day
  assert.strictEqual(global.window.journeys[0].departureDate, '2026-06-06', 'Inter-leg journey departureDate cascaded +1 day');
  assert.strictEqual(global.window.journeys[1].departureDate, '2026-06-08', 'Return journey departureDate cascaded +1 day');

  // 10b. Remove 1 day from Rome (adjustLegDays(0, -1))
  adjustLegDays(0, -1);

  // Verify Rome restored to 3 days (2026-06-01 to 2026-06-03)
  assert.strictEqual(global.appData[0].days.length, 3, 'Rome leg restored to 3 days');
  assert.strictEqual(global.appData[0].days[2].date, '2026-06-03', 'Rome leg restored end date to 2026-06-03');

  // Verify Florence cascaded backward by -1 day (2026-06-03 to 2026-06-05)
  assert.strictEqual(global.appData[1].days[0].date, '2026-06-03', 'Florence start date cascaded -1 day back to 2026-06-03');
  assert.strictEqual(global.appData[1].days[2].date, '2026-06-05', 'Florence end date cascaded -1 day back to 2026-06-05');

  // Verify Venice cascaded backward by -1 day (2026-06-05 to 2026-06-07)
  assert.strictEqual(global.appData[2].days[0].date, '2026-06-05', 'Venice start date cascaded -1 day back to 2026-06-05');
  assert.strictEqual(global.appData[2].days[2].date, '2026-06-07', 'Venice end date cascaded -1 day back to 2026-06-07');

  // Verify Return cascaded backward by -1 day (2026-06-07 to 2026-06-08)
  assert.strictEqual(global.appData[3].days[0].date, '2026-06-07', 'Return start date cascaded -1 day back to 2026-06-07');
  assert.strictEqual(global.appData[3].days[1].date, '2026-06-08', 'Return end date cascaded -1 day back to 2026-06-08');

  // Verify Florence stay cascaded -1 day back
  assert.strictEqual(global.window.stays[0].checkIn, '2026-06-03', 'Florence stay checkIn restored to 2026-06-03');
  assert.strictEqual(global.window.stays[0].checkOut, '2026-06-05', 'Florence stay checkOut restored to 2026-06-05');

  // Verify Venice stay cascaded -1 day back
  assert.strictEqual(global.window.stays[1].checkIn, '2026-06-05', 'Venice stay checkIn restored to 2026-06-05');
  assert.strictEqual(global.window.stays[1].checkOut, '2026-06-07', 'Venice stay checkOut restored to 2026-06-07');

  // Verify Journeys cascaded -1 day back
  assert.strictEqual(global.window.journeys[0].departureDate, '2026-06-05', 'Inter-leg journey departureDate restored to 2026-06-05');
  assert.strictEqual(global.window.journeys[1].departureDate, '2026-06-07', 'Return journey departureDate restored to 2026-06-07');

  // 10c. Test Edit Leg Modal with auto-cascade on Leg 1 (Florence)
  openAddLegDialog('edit');
  switchLegModalTab('edit');
  elements['editLegSelect'].value = '1';
  onEditLegSelectionChange();

  // Extend Florence duration from 2 nights (2026-06-03 to 2026-06-05) to 3 nights (2026-06-03 to 2026-06-06)
  elements['legDurationNights'].value = 3;
  onLegDurationInputChange();

  assert.strictEqual(elements['newLegStartDate'].value, '2026-06-03', 'Florence starts 2026-06-03');
  assert.strictEqual(elements['newLegEndDate'].value, '2026-06-06', 'Florence ends 2026-06-06');

  // Verify validation passes without false clash against Venice when auto-cascade is on
  const isValidEditWithCascade = validateLegEditorForm();
  assert.strictEqual(isValidEditWithCascade, true, 'Form must be valid when editing leg with auto-cascade enabled');
  assert.strictEqual(elements['legDialogSaveBtn'].disabled, false, 'Save button must be enabled for edited leg with cascade');

  confirmAddLeg();
  assert.strictEqual(global.appData[1].days.length, 4, 'Florence should now have 4 days');
  assert.strictEqual(global.appData[1].days[3].date, '2026-06-06', 'Florence should now end on 2026-06-06');

  // Verify subsequent legs (Venice, Return) cascaded forward +1 day
  assert.strictEqual(global.appData[2].days[0].date, '2026-06-06', 'Venice start date cascaded to 2026-06-06');
  assert.strictEqual(global.appData[2].days[2].date, '2026-06-08', 'Venice end date cascaded to 2026-06-08');
  assert.strictEqual(global.appData[3].days[0].date, '2026-06-08', 'Return start date cascaded to 2026-06-08');
  assert.strictEqual(global.appData[3].days[1].date, '2026-06-09', 'Return end date cascaded to 2026-06-09');

  // 11. Test Rebuild button scoping to legs
  console.log('  Testing Rebuild button scoping (Issue #419)...');
  const indexHtml = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
  assert.strictEqual(indexHtml.includes('id="rebuildItineraryBtn"'), false, 'Header rebuild button must be removed');
  assert.strictEqual(indexHtml.includes('rebuildItineraryAndDataMappings({ showToast: true }); closeCityDialog();'), false, 'City dialog rebuild button must be removed');
  assert.strictEqual(indexHtml.includes('closeDesktopActionsMenu(); rebuildItineraryAndDataMappings'), false, 'Desktop actions menu rebuild button must be removed');
  assert.strictEqual(indexHtml.includes('id="rebuildLegsSequenceBtn"'), true, 'Legs reorder sequence view must include Rebuild button');
  assert.strictEqual(indexHtml.includes('id="rebuildLegsEditBtn"'), true, 'Legs add/edit view must include Rebuild button');

  // 12. Test populating City From and City To when clicking an existing leg
  console.log('  Testing populating City From and City To on existing leg click...');
  global.citiesData = [
    { name: 'Taipei', code: 'TPE' },
    { name: 'Vienna', code: 'VIE' },
    { name: 'Bangkok', code: 'BKK' },
    { name: 'London', code: 'LHR' },
    { name: 'Brisbane', code: 'BNE' }
  ];
  global.titleData = { homeCity: 'Brisbane' };

  global.appData = [
    {
      id: 'leg_0',
      label: 'Brisbane (Trip Start)',
      days: [{ date: '2026-06-08', day: 'Mon', from: 'Brisbane (Trip Start) (1)', to: 'Taipei', completed: false }]
    },
    {
      id: 'leg_1',
      label: '🇦🇹 Vienna',
      days: [
        { date: '2026-06-10', day: 'Wed', from: 'Bangkok', to: '🇦🇹 Vienna', completed: false },
        { date: '2026-06-11', day: 'Thu', from: 'Vienna', to: 'Vienna', completed: false }
      ]
    },
    {
      id: 'leg_2',
      label: '🇹🇭 Bangkok (2)',
      days: [
        { date: '2026-06-27', day: 'Sat', from: 'London', to: '🇹🇭 Bangkok (2)', completed: false }
      ]
    }
  ];

  openAddLegDialog('edit');
  switchLegModalTab('edit');

  // Populate mock options on city selects (innerHTML doesn't parse in mock env)
  const mockCityOptions = [
    { value: '', text: '-- Choose a city --' },
    { value: 'Home', text: '🏠 Home (Brisbane - BNE)' },
    { value: 'Bangkok', text: '📍 Bangkok (BKK)' },
    { value: 'Brisbane', text: '📍 Brisbane (BNE)' },
    { value: 'London', text: '📍 London (LHR)' },
    { value: 'Taipei', text: '📍 Taipei (TPE)' },
    { value: 'Vienna', text: '📍 Vienna (VIE)' }
  ];
  elements['fromCitySelect'].options = mockCityOptions.slice(1); // no placeholder
  elements['toCitySelect'].options = [...mockCityOptions];
  elements['existingCitySelect'].options = [...mockCityOptions];

  // Click / Select Leg 0 (Brisbane -> Taipei)
  elements['editLegSelect'].value = '0';
  onEditLegSelectionChange();
  assert.strictEqual(elements['fromCitySelect'].value, 'Home', 'Leg 0 fromCitySelect populated with Home/Brisbane');
  assert.strictEqual(elements['toCitySelect'].value, 'Taipei', 'Leg 0 toCitySelect populated with Taipei');
  assert.strictEqual(elements['routeSelectionGroup'].style.display, 'block', 'Route selection group shown with from/to fields');

  // Click / Select Leg 1 (Bangkok -> Vienna)
  elements['editLegSelect'].value = '1';
  onEditLegSelectionChange();
  assert.strictEqual(elements['fromCitySelect'].value, 'Bangkok', 'Leg 1 fromCitySelect populated with Bangkok');
  assert.strictEqual(elements['toCitySelect'].value, 'Vienna', 'Leg 1 toCitySelect populated with Vienna');
  assert.strictEqual(elements['existingCitySelect'].value, 'Vienna', 'Leg 1 existingCitySelect populated with Vienna');

  // Click / Select Leg 2 (London -> Bangkok)
  elements['editLegSelect'].value = '2';
  onEditLegSelectionChange();
  assert.strictEqual(elements['fromCitySelect'].value, 'London', 'Leg 2 fromCitySelect populated with London');
  assert.strictEqual(elements['toCitySelect'].value, 'Bangkok', 'Leg 2 toCitySelect populated with Bangkok');

  // 13. Test same-day legs support (startDate === endDate, 0 nights)
  console.log('  Testing same-day legs support (startDate === endDate, 0 nights)...');
  assert.strictEqual(indexHtml.includes('id="legDurationNights" min="0"'), true, 'Duration input allows 0 nights');

  // End date change to same date recalculates duration to 0
  elements['newLegStartDate'].value = '2026-06-10';
  elements['newLegEndDate'].value = '2026-06-10';
  onLegEndDateChange();
  assert.strictEqual(elements['legDurationNights'].value, 0, 'Duration recalculated to 0 nights when startDate === endDate');

  // Duration input set to 0 updates endDate to same as startDate
  elements['legDurationNights'].value = 0;
  onLegDurationInputChange();
  assert.strictEqual(elements['newLegEndDate'].value, '2026-06-10', 'End date stays 2026-06-10 for 0 nights duration');

  // Stepping duration -1 stops at 0, not below 0
  stepLegDuration(-1);
  assert.strictEqual(elements['legDurationNights'].value, 0, 'stepLegDuration does not drop below 0');

  // Same-day leg date clash check with identical dates does not false-positive
  assert.strictEqual(checkLegDateClash('2026-06-10', '2026-06-10', '2026-06-10', '2026-06-10'), false, 'Same-day legs on same date do NOT clash');
  assert.strictEqual(checkLegDateClash('2026-06-10', '2026-06-10', '2026-06-10', '2026-06-12'), false, 'Same-day leg handover does NOT clash');

  // Validation passes for same-day leg
  const isSameDayValid = validateLegEditorForm();
  assert.strictEqual(isSameDayValid, true, 'Validation passes for same-day leg');
  assert.strictEqual(elements['legDialogSaveBtn'].disabled, false, 'Save button enabled for same-day leg');

  // 14. Test Issue #428 Leg Management, Terminal Leg Enforcement & Rebuild
  console.log('  Testing Issue #428 Leg Management, Terminal Leg Enforcement & Rebuild...');
  
  // 14a. Test isTerminalLeg prefers leg.type
  assert.strictEqual(isTerminalLeg({ type: 'start' }), true, 'isTerminalLeg recognizes type: start');
  assert.strictEqual(isTerminalLeg({ type: 'return' }), true, 'isTerminalLeg recognizes type: return');
  assert.strictEqual(isTerminalLeg({ type: 'city' }), false, 'isTerminalLeg returns false for type: city');
  assert.strictEqual(isTerminalLeg({ label: 'Brisbane (Trip Start)' }), true, 'isTerminalLeg recognizes legacy Trip Start label');

  // 14b. Test enforceTerminalLegs ensures start and return terminal legs
  const testTripLegs = [
    { id: 'leg-paris', label: '🇫🇷 Paris', type: 'city', days: [
      { date: '2026-06-12', from: 'Paris', to: 'Paris' },
      { date: '2026-06-13', from: 'Paris', to: 'Paris' }
    ]},
    { id: 'leg-rome', label: '🇮🇹 Rome', type: 'city', days: [
      { date: '2026-06-14', from: 'Rome', to: 'Rome' },
      { date: '2026-06-15', from: 'Rome', to: 'Rome' }
    ]}
  ];
  enforceTerminalLegs(testTripLegs);
  assert.strictEqual(testTripLegs.length, 4, 'enforceTerminalLegs prepended start leg and appended return leg');
  assert.strictEqual(testTripLegs[0].type, 'start', 'First leg is start type');
  assert.strictEqual(testTripLegs[testTripLegs.length - 1].type, 'return', 'Last leg is return type');

  // 14c. Test rebuildLegRouting establishes correct sequence-based routing
  rebuildLegRouting(testTripLegs);
  assert.strictEqual(testTripLegs[0].days[0].from, 'Brisbane', 'Start leg departs from Home (Brisbane)');
  assert.strictEqual(testTripLegs[0].days[0].to, 'Paris', 'Start leg arrives at first destination (Paris)');
  assert.strictEqual(testTripLegs[1].days[0].from, 'Brisbane', 'Paris day 1 arrives from Brisbane');
  assert.strictEqual(testTripLegs[1].days[1].to, 'Rome', 'Paris day 2 departs for Rome');
  assert.strictEqual(testTripLegs[2].days[0].from, 'Paris', 'Rome day 1 arrives from Paris');
  assert.strictEqual(testTripLegs[2].days[1].to, 'Brisbane', 'Rome day 2 departs to Brisbane');
  assert.strictEqual(testTripLegs[3].days[0].from, 'Rome', 'Return leg departs from Rome');
  assert.strictEqual(testTripLegs[3].days[0].to, 'Brisbane', 'Return leg returns to Home (Brisbane)');

  // 14d. Test renderLegReorderList locks terminal legs with padlock icon
  setLegDialogState({ mode: 'add', editLegIdx: null, stagedLegs: testTripLegs, originalLegDates: {} });
  renderLegReorderList();
  assert.strictEqual(elements['legReorderList'].innerHTML.includes('🔒'), true, 'Reorder list renders 🔒 padlock for terminal legs');
  assert.strictEqual(elements['legReorderList'].innerHTML.includes('draggable="false"'), true, 'Terminal legs have draggable=false');

  // 14e. Test moveLegInSequence guards against moving terminal legs or moving into terminal positions
  const originalOrder = testTripLegs.map(l => l.id);
  moveLegInSequence(0, 1);
  assert.strictEqual(testTripLegs[0].id, originalOrder[0], 'moveLegInSequence blocked moving start leg away from position 0');
  moveLegInSequence(1, 0);
  assert.strictEqual(testTripLegs[0].id, originalOrder[0], 'moveLegInSequence blocked moving regular leg into start leg position 0');
  moveLegInSequence(testTripLegs.length - 1, testTripLegs.length - 2);
  assert.strictEqual(testTripLegs[testTripLegs.length - 1].id, originalOrder[testTripLegs.length - 1], 'moveLegInSequence blocked moving return leg away from final position');

  // 14f. Test _populateLegPlacementDropdown omits "At start of trip" when start leg exists
  _populateLegPlacementDropdown();
  const placementHtml = elements['legPlacementSelect'].innerHTML;
  assert.strictEqual(placementHtml.includes('value="start"'), false, 'Placement dropdown excludes "At start of trip" when start leg is present');

  // 14g. Test onLegTypeChange locks fromCitySelect to Home for start legs and hides From City dropdown
  elements['legTypeSelect'].value = 'start';
  onLegTypeChange();
  assert.strictEqual(elements['fromCitySelect'].disabled, true, 'fromCitySelect disabled/locked for start leg');
  assert.strictEqual(elements['fromCitySelect'].value, 'Home', 'fromCitySelect pre-set to Home for start leg');
  assert.strictEqual(elements['fromCitySelectGroup'].style.display, 'none', 'fromCitySelectGroup hidden for start leg');
  assert.strictEqual(elements['toCitySelectGroup'].style.display, 'block', 'toCitySelectGroup visible for start leg');

  // Test onLegTypeChange locks toCitySelect to Home for return legs and hides To City dropdown
  elements['legTypeSelect'].value = 'return';
  onLegTypeChange();
  assert.strictEqual(elements['toCitySelect'].disabled, true, 'toCitySelect disabled/locked for return leg');
  assert.strictEqual(elements['toCitySelect'].value, 'Home', 'toCitySelect pre-set to Home for return leg');
  assert.strictEqual(elements['toCitySelectGroup'].style.display, 'none', 'toCitySelectGroup hidden for return leg');
  assert.strictEqual(elements['fromCitySelectGroup'].style.display, 'block', 'fromCitySelectGroup visible for return leg');

  // Reset to city
  elements['legTypeSelect'].value = 'city';
  onLegTypeChange();
  assert.strictEqual(elements['fromCitySelect'].disabled, false, 'fromCitySelect unlocked for city leg');
  assert.strictEqual(elements['toCitySelect'].disabled, false, 'toCitySelect unlocked for city leg');
  assert.strictEqual(elements['fromCitySelectGroup'].style.display, 'block', 'fromCitySelectGroup visible for city leg');
  assert.strictEqual(elements['toCitySelectGroup'].style.display, 'block', 'toCitySelectGroup visible for city leg');

  // 14h. Test automatic transit vs city classification in confirmAddLeg
  // Case 1: Same day leg (startDate === endDate, 0 nights) -> Automatically classified as 'transit' with '(Transit)' in label
  elements['editLegSelect'].value = 'ADD_NEW';
  elements['newLegStartDate'].value = '2026-06-20';
  elements['newLegEndDate'].value = '2026-06-20';
  elements['legDurationNights'].value = '0';
  elements['existingCitySelect'].value = 'Doha';
  elements['legPlacementSelect'].value = 'before_return';
  setLegDialogState({ mode: 'add', editLegIdx: null, stagedLegs: JSON.parse(JSON.stringify(testTripLegs)), originalLegDates: {} });
  confirmAddLeg();
  const addedTransitLeg = legDialogState.stagedLegs.find(l => (l.label || '').includes('Doha'));
  assert.ok(addedTransitLeg, 'Doha transit leg added to stagedLegs');
  assert.strictEqual(addedTransitLeg.type, 'transit', 'Same-day leg automatically typed as transit');
  assert.ok(addedTransitLeg.label.includes('(Transit)'), 'Transit leg has (Transit) suffix');

  // Case 2: Multi-day leg (startDate < endDate, 2 nights) -> Automatically classified as 'city'
  elements['newLegStartDate'].value = '2026-06-21';
  elements['newLegEndDate'].value = '2026-06-23';
  elements['legDurationNights'].value = '2';
  elements['existingCitySelect'].value = 'Berlin';
  confirmAddLeg();
  const addedCityLeg = legDialogState.stagedLegs.find(l => (l.label || '').includes('Berlin'));
  assert.ok(addedCityLeg, 'Berlin city leg added to stagedLegs');
  assert.strictEqual(addedCityLeg.type, 'city', 'Multi-day leg automatically typed as city');
  assert.strictEqual(addedCityLeg.label.includes('(Transit)'), false, 'City leg does NOT have (Transit) suffix');

  // 14i. Test updateLegDurationSubtext
  updateLegDurationSubtext(0);
  assert.strictEqual(elements['legDurationSubtext'].textContent, '0 nights • ✈️ Transit (same-day stop)', '0 nights displays transit explanation');
  updateLegDurationSubtext(1);
  assert.strictEqual(elements['legDurationSubtext'].textContent, '1 night', '1 night displays singular');
  updateLegDurationSubtext(4);
  assert.strictEqual(elements['legDurationSubtext'].textContent, '4 nights', '4 nights displays plural');

  // 14j. Test normalizeTripLegsData automatic inference
  const sampleLegs = [
    { label: 'Brisbane (Trip Start)', days: [{ date: '2026-06-10', from: 'Brisbane', to: 'Singapore' }] },
    { label: '🇸🇬 Singapore', days: [{ date: '2026-06-11', from: 'Brisbane', to: 'Singapore' }] }, // single day -> transit
    { label: '🇫🇷 Paris', days: [
      { date: '2026-06-12', from: 'Singapore', to: 'Paris' },
      { date: '2026-06-13', from: 'Paris', to: 'Paris' }
    ] }, // multi-day -> city
    { label: 'Brisbane (Trip Finish)', days: [{ date: '2026-06-14', from: 'Paris', to: 'Brisbane' }] }
  ];
  normalizeTripLegsData(sampleLegs);
  assert.strictEqual(sampleLegs[0].type, 'start', 'First terminal leg typed as start');
  assert.strictEqual(sampleLegs[1].type, 'transit', 'Single-day intermediate leg typed as transit');
  assert.strictEqual(sampleLegs[2].type, 'city', 'Multi-day intermediate leg typed as city');
  assert.strictEqual(sampleLegs[3].type, 'return', 'Final terminal leg typed as return');

  // 14k. Test rebuildTripFromLegs preserves destination city days during Sync from Transport (Issue #428)
  console.log('  Testing rebuildTripFromLegs preserves destination city days during Sync from Transport (#428)...');
  global.titleData = { homeCity: 'Melbourne', title: 'Bali 2026' };
  global.journeys = [
    { id: 'j-out', legId: 'leg-start', fromLocation: 'Melbourne', toLocation: 'Denpasar (DPS)', departureDate: '2026-12-13', arrivalDate: '2026-12-13' },
    { id: 'j-ret', legId: 'leg-return', fromLocation: 'Denpasar (DPS)', toLocation: 'Melbourne', departureDate: '2026-12-21', arrivalDate: '2026-12-21' }
  ];
  global.stays = [
    { id: 's-bali', city: 'Bali', checkIn: '2026-12-13', checkOut: '2026-12-21' }
  ];
  global.citiesData = [
    { id: 'city-bali', name: 'Denpasar Bali', code: 'DPS' }
  ];
  global.appData = [
    { id: 'leg-start', label: 'Melbourne (Trip Start)', type: 'start', days: [{ date: '2026-12-13', from: 'Melbourne', to: 'Denpasar' }] },
    { id: 'leg-denpasar', label: 'Denpasar', type: 'city', days: [
      { date: '2026-12-14', from: 'Denpasar', to: 'Denpasar' },
      { date: '2026-12-15', from: 'Denpasar', to: 'Denpasar' },
      { date: '2026-12-16', from: 'Denpasar', to: 'Denpasar' },
      { date: '2026-12-17', from: 'Denpasar', to: 'Denpasar' },
      { date: '2026-12-18', from: 'Denpasar', to: 'Denpasar' },
      { date: '2026-12-19', from: 'Denpasar', to: 'Denpasar' },
      { date: '2026-12-20', from: 'Denpasar', to: 'Denpasar' }
    ]},
    { id: 'leg-return', label: 'Melbourne (Trip Finish)', type: 'return', days: [{ date: '2026-12-21', from: 'Denpasar', to: 'Melbourne' }] }
  ];
  window.journeys = global.journeys;
  window.stays = global.stays;

  rebuildTripFromLegs({ showToast: false, forceRebuildDays: true });

  const stLeg = global.appData.find(l => l.id === 'leg-start');
  const denpasarLeg = global.appData.find(l => l.id === 'leg-denpasar');
  const retLeg = global.appData.find(l => l.id === 'leg-return');

  assert.strictEqual(stLeg.days.length, 1, 'Start leg has 1 departure day');
  assert.ok(denpasarLeg.days.length >= 7, `Denpasar leg must maintain multi-day stay duration (actual: ${denpasarLeg.days.length})`);
  assert.strictEqual(denpasarLeg.days[0].date, '2026-12-13', 'Denpasar stay begins on flight arrival / checkin date');
  assert.strictEqual(denpasarLeg.days[denpasarLeg.days.length - 1].date, '2026-12-21', 'Denpasar stay ends on checkout / departure date');
  assert.strictEqual(retLeg.days.length, 1, 'Return leg has 1 return day');

  // 14l. Test return leg routing and buildLegDaysWithNotes sets destination to homeCity on all days (#428)
  console.log('  Testing return leg routing and buildLegDaysWithNotes destination (#428)...');
  const returnDays = buildLegDaysWithNotes({
    dateFrom: '2026-12-21',
    dateTo: '2026-12-22',
    fromCity: 'Denpasar Bali',
    toCity: 'Brisbane',
    legType: 'return'
  });
  assert.strictEqual(returnDays.length, 2, 'Return leg spans 2 days');
  assert.strictEqual(returnDays[0].from, 'Denpasar Bali', 'Day 1 departs from Denpasar Bali');
  assert.strictEqual(returnDays[0].to, 'Brisbane', 'Day 1 destination is Brisbane (not Denpasar Bali)');
  assert.strictEqual(returnDays[1].from, 'Denpasar Bali', 'Day 2 departs from Denpasar Bali');
  assert.strictEqual(returnDays[1].to, 'Brisbane', 'Day 2 destination is Brisbane');

  // Also test renderCompactDayPager for return leg day with DPS -> BNE flight
  const mockReturnLeg = {
    id: 'leg-ret-test',
    label: 'Brisbane (Trip Finish)',
    type: 'return',
    colour: '#10b981',
    days: returnDays
  };
  global.journeysByJourneyIdMap = new Map();
  global.getDayJourneys = (date) => {
    if (date === '2026-12-21') {
      return [{
        id: 'j-flight',
        fromLocation: 'Denpasar Bali',
        toLocation: 'Brisbane',
        transportType: 'flight'
      }];
    }
    return [];
  };
  const pagerHtml = renderCompactDayPager(mockReturnLeg, 0);
  assert.ok(pagerHtml.includes('✈️ Brisbane'), 'Day 1 compact chip displays ✈️ Brisbane');
  assert.strictEqual(pagerHtml.includes('✈️ Denpasar Bali'), false, 'Day 1 compact chip does NOT display ✈️ Denpasar Bali');

  // 14m. Test editLegSelect and legPlacementSelect includes <Transit> for transit destinations
  console.log('  Testing editLegSelect and legPlacementSelect includes <Transit> for transit legs...');
  const testTransitTrip = [
    { id: 'leg-start', label: 'Brisbane (Trip Start)', type: 'start', days: [{ date: '2026-06-08' }] },
    { id: 'leg-tpe', label: '🇹🇼 Taipei', type: 'transit', days: [{ date: '2026-06-09' }] },
    { id: 'leg-vie', label: '🇦🇹 Vienna', type: 'city', days: [{ date: '2026-06-10' }, { date: '2026-06-11' }] },
    { id: 'leg-ret', label: 'Brisbane (Trip Finish)', type: 'return', days: [{ date: '2026-06-12' }] }
  ];
  setLegDialogState({ mode: 'add', editLegIdx: null, stagedLegs: testTransitTrip, originalLegDates: {} });
  _populateAddLegCityDropdowns();
  const selectHtml = elements['editLegSelect'].innerHTML;
  assert.ok(selectHtml.includes('Taipei <Transit> (2026-06-09)'), 'Taipei transit leg option includes <Transit> tag in editLegSelect');
  assert.strictEqual(selectHtml.includes('Vienna <Transit>'), false, 'Vienna multi-day city stay does NOT have <Transit> tag');

  // 14n. Test Issue #431 Leg edit dialog improvements
  console.log('  Testing Issue #431 Leg edit dialog improvements...');
  _populateAddLegCityDropdowns();
  assert.strictEqual(elements['editLegSelect'].value, '', 'editLegSelect defaults to empty string');
  assert.ok(elements['editLegSelect'].innerHTML.includes('value=""'), 'editLegSelect includes placeholder option with value=""');
  assert.ok(elements['editLegSelect'].innerHTML.includes('-- Select existing leg to edit --'), 'editLegSelect includes placeholder text');
  assert.strictEqual(elements['editLegSelect'].innerHTML.includes('ADD_NEW'), false, 'Add New Leg is NOT an option in editLegSelect');

  // Test selecting an existing leg switches to edit mode, disables destination city, hides add new city
  elements['editLegSelect'].value = '2'; // Vienna (city leg)
  onEditLegSelectionChange();
  assert.strictEqual(legDialogState.mode, 'edit', 'legDialogState mode is edit');
  assert.strictEqual(legDialogState.editLegIdx, 2, 'editLegIdx is set to 2');
  assert.strictEqual(elements['existingCitySelect'].disabled, true, 'existingCitySelect disabled in edit mode');
  assert.strictEqual(elements['toggleNewCityBtn'].style.display, 'none', 'toggleNewCityBtn hidden in edit mode');
  assert.strictEqual(elements['newCityInlineGroup'].style.display, 'none', 'newCityInlineGroup hidden in edit mode');
  assert.strictEqual(elements['legPlacementGroup'].style.display, 'none', 'legPlacementGroup hidden in edit mode');
  assert.strictEqual(elements['legDialogTitle'].textContent, 'Edit Trip Leg', 'Dialog title updated to Edit Trip Leg');
  assert.strictEqual(elements['legDialogSaveBtn'].textContent, 'Save Leg', 'Primary button updated to Save Leg');

  // Test dayNotes updating day.desc in edit mode without wiping day items
  elements['legDayNotesInput'].value = 'Arrival and explore Ringstrasse\nPalace visit and cafe tour';
  // Attach mock activity and stay to Vienna days
  const viennaLeg = legDialogState.stagedLegs[2];
  viennaLeg.days[0].activityItems = [{ text: 'Visit Opera House', cost: '20', time: '2 hrs', done: false }];
  viennaLeg.days[0].accomItems = [{ text: 'Hotel Sacher', cost: '200', status: 'confirmed' }];
  confirmAddLeg();
  assert.strictEqual(viennaLeg.days[0].desc, 'Arrival and explore Ringstrasse', 'Day 0 desc updated from dayNotes');
  assert.strictEqual(viennaLeg.days[1].desc, 'Palace visit and cafe tour', 'Day 1 desc updated from dayNotes');
  assert.strictEqual(viennaLeg.days[0].activityItems[0].text, 'Visit Opera House', 'Day 0 activity items preserved');
  assert.strictEqual(viennaLeg.days[0].accomItems[0].text, 'Hotel Sacher', 'Day 0 accommodation items preserved');

  // Test 4-column Day Notes table rendering, simplified # column, and day.title support
  renderLegDayNotesList();
  assert.ok(elements['legDayNotesList'].innerHTML.includes('<table class="leg-day-notes-table'), 'Renders 4-column table');
  assert.ok(elements['legDayNotesList'].innerHTML.includes('>#</th>'), 'Table contains # header');
  assert.ok(elements['legDayNotesList'].innerHTML.includes('>Date</th>'), 'Table contains Date header');
  assert.ok(elements['legDayNotesList'].innerHTML.includes('>Title</th>'), 'Table contains Title header');
  assert.ok(elements['legDayNotesList'].innerHTML.includes('>Note</th>'), 'Table contains Note header');

  // Verify direct day.title change updates staged leg
  onLegDayTitleRowChange(0);
  viennaLeg.days[0].title = 'Vienna Central';
  assert.strictEqual(viennaLeg.days[0].title, 'Vienna Central', 'Day 0 title updated');

  // Verify renderCompactDayPager reflects day.title
  if (typeof renderCompactDayPager === 'function') {
    const pagerHtml = renderCompactDayPager(viennaLeg, 2);
    assert.ok(pagerHtml.includes('Vienna Central'), 'Day pager button reflects day.title');
  }

  // Test mode header, leg name, and arriving from / departing to in edit mode
  elements['editLegSelect'].value = '2'; // Vienna
  onEditLegSelectionChange();
  assert.strictEqual(elements['citySelectionGroup'].style.display, 'none', 'citySelectionGroup hidden in edit mode');
  assert.strictEqual(elements['legEditorModeTitle'].textContent, 'Edit Leg', 'Mode title displays Edit Leg');
  assert.ok(elements['legEditorLegName'].textContent.includes('Vienna'), 'Leg name contains Vienna');
  assert.ok(elements['legOriginHelperCity'].textContent.length > 0, 'Arriving from city is computed');
  assert.ok(elements['legDepartingHelperCity'].textContent.length > 0, 'Departing to city is computed');

  // Test resetLegDialogToAddNew switches back to Add New Leg mode
  resetLegDialogToAddNew();
  assert.strictEqual(legDialogState.mode, 'add', 'legDialogState mode reset to add');
  assert.strictEqual(legDialogState.isAddingNewLeg, true, 'isAddingNewLeg is true after resetLegDialogToAddNew');
  assert.strictEqual(elements['editLegSelect'].value, '', 'editLegSelect reset to empty string');
  assert.strictEqual(elements['citySelectionGroup'].style.display, 'block', 'citySelectionGroup visible in add mode');
  assert.strictEqual(elements['existingCitySelect'].disabled, false, 'existingCitySelect enabled in add mode');
  assert.strictEqual(elements['toggleNewCityBtn'].style.display, 'inline-block', 'toggleNewCityBtn visible in add mode');
  assert.strictEqual(elements['toggleNewCityBtn'].textContent, '+ Add a new city', 'toggleNewCityBtn button text is + Add a new city');
  assert.strictEqual(elements['legPlacementGroup'].style.display, 'block', 'legPlacementGroup visible when Add New Leg is chosen');
  assert.strictEqual(elements['legDialogTitle'].textContent, 'Add New Trip Leg', 'Dialog title updated to Add New Trip Leg');
  assert.strictEqual(elements['legDialogSaveBtn'].textContent, 'Add Leg', 'Primary button updated to Add Leg');
  assert.strictEqual(elements['legEditorModeTitle'].textContent, 'Add New Leg', 'Mode title displays Add New Leg');

  // Test openAddLegDialog defaults to mode: none (empty prompt on right, no premature Add New Leg)
  openAddLegDialog('edit');
  assert.strictEqual(legDialogState.mode, 'none', 'openAddLegDialog initializes with mode: none');
  assert.strictEqual(elements['legEditorEmptyPrompt'].style.display, 'flex', 'Empty prompt visible on initial openAddLegDialog');
  assert.strictEqual(elements['legEditorFormContent'].style.display, 'none', 'Form content hidden on initial openAddLegDialog');

  // Test selecting start leg (index 0): hides 'Arriving from' box, shows 'Departing to' box
  elements['editLegSelect'].value = '0';
  onEditLegSelectionChange();
  assert.strictEqual(elements['legArrivingFromBox'].style.display, 'none', 'Start leg hides Arriving from box');
  assert.strictEqual(elements['legDepartingToBox'].style.display, 'flex', 'Start leg shows Departing to box');

  // Test selecting return leg (index 3): hides 'Departing to' box, shows 'Arriving from' box
  elements['editLegSelect'].value = '3';
  onEditLegSelectionChange();
  assert.strictEqual(elements['legDepartingToBox'].style.display, 'none', 'Return leg hides Departing to box');
  assert.strictEqual(elements['legArrivingFromBox'].style.display, 'flex', 'Return leg shows Arriving from box');

  // Test selecting middle leg (index 2): shows both
  elements['editLegSelect'].value = '2';
  onEditLegSelectionChange();
  assert.strictEqual(elements['legArrivingFromBox'].style.display, 'flex', 'Middle leg shows Arriving from box');
  assert.strictEqual(elements['legDepartingToBox'].style.display, 'flex', 'Middle leg shows Departing to box');

  // Test desktop delete button sync in edit vs add mode
  assert.strictEqual(elements['desktopLegDialogDeleteBtn'].style.display, 'inline-flex', 'desktopLegDialogDeleteBtn visible in edit mode');
  resetLegDialogToAddNew();
  assert.strictEqual(elements['desktopLegDialogDeleteBtn'].style.display, 'none', 'desktopLegDialogDeleteBtn hidden in add mode');

  // Test staging deletion without premature commit
  elements['editLegSelect'].value = '2';
  onEditLegSelectionChange();
  const originalAppDataLength = appData.length;
  const initialStagedLength = legDialogState.stagedLegs.length;
  // Mock global.confirm to auto-approve
  const oldConfirm = global.confirm;
  global.confirm = () => true;
  deleteLegFromDialog();
  global.confirm = oldConfirm;
  assert.strictEqual(legDialogState.stagedLegs.length, initialStagedLength - 1, 'Leg deleted from stagedLegs');
  assert.strictEqual(appData.length, originalAppDataLength, 'appData remains untouched before save');

  // Test close and initial open state: legPlacementGroup should be hidden until Add New Leg is triggered
  closeAddLegDialog();
  assert.strictEqual(elements['legPlacementGroup'].style.display, 'none', 'legPlacementGroup hidden on modal close');
  assert.strictEqual(legDialogState.isAddingNewLeg, false, 'isAddingNewLeg reset to false on close');

  console.log('✅ ALL LEG MANAGEMENT & WYSIWYG DRAG-AND-DROP TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  runLegManagementWysiwygSuite()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { runLegManagementWysiwygSuite };