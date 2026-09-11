const assert = require('assert');

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

const elements = {};
function createMockElement(id, initialProps = {}) {
  const el = {
    id,
    value: '',
    style: {},
    classList: {
      classes: new Set(),
      add(c) { this.classes.add(c); },
      remove(c) { this.classes.delete(c); },
      contains(c) { return this.classes.has(c); }
    },
    checked: true,
    disabled: false,
    innerHTML: '',
    textContent: '',
    addEventListener() {},
    querySelectorAll() { return []; },
    ...initialProps
  };
  elements[id] = el;
  return el;
}

createMockElement('add-leg-modal');
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
createMockElement('legTypeSelect', { value: 'city' });
createMockElement('legDayNotesInput');

global.document = {
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

// Require dependencies
require('../js/default-data.js');
require('../js/utils.js');
require('../js/timezone.js');
require('../js/data.js');
require('../js/crud.js');

async function runLegManagementWysiwygSuite() {
  console.log('Running Leg Management & WYSIWYG Drag-and-Drop test suite...');

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

  console.log('✅ ALL LEG MANAGEMENT & WYSIWYG DRAG-AND-DROP TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  runLegManagementWysiwygSuite().catch(err => {
    console.error(err);
    process.exitCode = 1;
  });
}

module.exports = { runLegManagementWysiwygSuite };