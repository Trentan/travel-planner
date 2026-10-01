const path = require('path');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function createMockClassList(initialClasses = []) {
  const classes = new Set(initialClasses);
  return {
    add: (...names) => names.forEach(n => classes.add(n)),
    remove: (...names) => names.forEach(n => classes.delete(n)),
    contains: name => classes.has(name),
    toArray: () => Array.from(classes)
  };
}

function createMockDataTransfer() {
  const store = {};
  return {
    data: store,
    effectAllowed: 'uninitialized',
    dropEffect: 'none',
    setData(format, val) {
      store[format] = String(val);
    },
    getData(format) {
      return store[format] || '';
    }
  };
}

function createMockElement(id = '', className = '') {
  const listeners = {};
  const attributes = {};
  const el = {
    id,
    parentElement: null,
    children: [],
    classList: createMockClassList(className ? className.split(' ') : []),
    getAttribute(name) {
      return attributes[name] !== undefined ? attributes[name] : null;
    },
    setAttribute(name, val) {
      attributes[name] = String(val);
    },
    addEventListener(event, handler) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
    },
    triggerEvent(event, eObj) {
      if (listeners[event]) {
        listeners[event].forEach(h => h(eObj));
      }
    },
    querySelector() {
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '.leg-reorder-item') {
        return el.children.filter(c => c.classList.contains('leg-reorder-item'));
      }
      return [];
    },
    closest(selector) {
      let curr = el;
      while (curr) {
        if (selector.startsWith('#') && curr.id === selector.slice(1)) return curr;
        if (selector.startsWith('.') && curr.classList.contains(selector.slice(1))) return curr;
        curr = curr.parentElement;
      }
      return null;
    }
  };
  return el;
}

function runDragdropTests() {
  console.log('Running dragdrop.js unit tests...');

  let pointElement = null;
  const mockAllLegReorderItems = [];

  const documentMock = {
    getElementById(id) {
      if (id === 'legReorderList') return null;
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '.leg-reorder-item') {
        return mockAllLegReorderItems;
      }
      return [];
    },
    elementFromPoint(x, y) {
      return pointElement;
    }
  };

  let hapticCalls = [];
  let savedDataCalled = false;
  let buildItineraryCalled = false;
  let feedbackMessages = [];
  let moveLegCalls = [];
  let assignResult = true;
  let assignError = '';

  const appDataMock = [
    {
      suggestedActivities: [{ id: 'act0', name: 'Museum' }],
      days: [{ day: 'Day 1', date: '2025-06-01' }]
    },
    {
      suggestedActivities: [{ id: 'act1', name: 'Park' }],
      days: [{ day: 'Day 1', date: '2025-06-02' }, { day: 'Day 2', date: '2025-06-03' }]
    }
  ];

  const assignSuggestedActivityToDayMock = (srcLegIdx, itemIdx, targetLegIdx, targetDayIdx) => {
    assignSuggestedActivityToDayMock.lastError = assignError;
    return assignResult;
  };

  const context = createVmContext({
    document: documentMock,
    isEditMode: true,
    appData: appDataMock,
    triggerHaptic: type => hapticCalls.push(type),
    assignSuggestedActivityToDay: assignSuggestedActivityToDayMock,
    saveData: () => { savedDataCalled = true; },
    buildItinerary: () => { buildItineraryCalled = true; },
    showActivityAssignFeedback: msg => feedbackMessages.push(msg),
    moveLegInSequence: (fromIdx, toIdx) => moveLegCalls.push({ fromIdx, toIdx }),
    window: {}
  });
  context.window = context;

  const dragdropSource = loadSource(path.join('js', 'dragdrop.js'));
  runScriptInContext(dragdropSource, context, 'js/dragdrop.js');

  // Verify window exports
  assert(typeof context.handleLegDragStart === 'function', 'handleLegDragStart should be on window');
  assert(typeof context.handleLegDragOver === 'function', 'handleLegDragOver should be on window');
  assert(typeof context.handleLegDragLeave === 'function', 'handleLegDragLeave should be on window');
  assert(typeof context.handleLegDrop === 'function', 'handleLegDrop should be on window');
  assert(typeof context.handleLegDragEnd === 'function', 'handleLegDragEnd should be on window');
  assert(typeof context.setupMobileTouchLegReordering === 'function', 'setupMobileTouchLegReordering should be on window');

  // --- 1. handleDragStart ---
  let defaultPrevented = false;
  let dt = createMockDataTransfer();
  let dragEvent = {
    preventDefault: () => { defaultPrevented = true; },
    dataTransfer: dt
  };

  // When isEditMode = false
  context.isEditMode = false;
  context.handleDragStart(dragEvent, 0, 'activity', 0);
  assert(defaultPrevented === true, 'handleDragStart should prevent default when isEditMode is false');
  assert(!dt.data['text/plain'], 'handleDragStart should not set data when isEditMode is false');

  // When isEditMode = true
  context.isEditMode = true;
  defaultPrevented = false;
  dt = createMockDataTransfer();
  dragEvent = {
    preventDefault: () => { defaultPrevented = true; },
    dataTransfer: dt
  };
  context.handleDragStart(dragEvent, 0, 'activity', 1);
  assert(defaultPrevented === false, 'handleDragStart should not prevent default when isEditMode is true');
  assert(dt.effectAllowed === 'move', 'handleDragStart should set effectAllowed to move');
  assert(JSON.parse(dt.data['text/plain']).itemIdx === 1, 'handleDragStart should set payload JSON in dataTransfer');

  // --- 2. handleDragOver & handleDragLeave ---
  let targetEl = createMockElement('target', '');
  dragEvent = {
    preventDefault: () => { defaultPrevented = true; },
    currentTarget: targetEl
  };

  context.isEditMode = false;
  defaultPrevented = false;
  context.handleDragOver(dragEvent);
  assert(!defaultPrevented, 'handleDragOver should do nothing when isEditMode is false');
  assert(!targetEl.classList.contains('drag-over'), 'handleDragOver should not add class when isEditMode is false');

  context.isEditMode = true;
  defaultPrevented = false;
  context.handleDragOver(dragEvent);
  assert(defaultPrevented, 'handleDragOver should preventDefault when isEditMode is true');
  assert(targetEl.classList.contains('drag-over'), 'handleDragOver should add drag-over class when isEditMode is true');

  context.handleDragLeave(dragEvent);
  assert(!targetEl.classList.contains('drag-over'), 'handleDragLeave should remove drag-over class');

  // --- 3. handleDrop ---
  targetEl = createMockElement('dropTarget', 'drag-over');
  dt = createMockDataTransfer();

  // Test isEditMode = false in handleDrop
  context.isEditMode = false;
  hapticCalls = [];
  dragEvent = {
    preventDefault: () => {},
    currentTarget: targetEl,
    dataTransfer: dt
  };
  context.handleDrop(dragEvent, 0, 0);
  assert(hapticCalls.length === 1 && hapticCalls[0] === 'light', 'handleDrop should trigger haptic feedback');
  assert(targetEl.classList.contains('drag-over'), 'handleDrop should return early when isEditMode is false without removing drag-over class');

  // Test successful activity assignment
  context.isEditMode = true;
  dt.setData('text/plain', JSON.stringify({ legIdx: 0, itemType: 'activity', itemIdx: 0 }));
  savedDataCalled = false;
  buildItineraryCalled = false;
  feedbackMessages = [];
  assignResult = true;

  context.handleDrop(dragEvent, 1, 0);
  assert(!targetEl.classList.contains('drag-over'), 'handleDrop should remove drag-over class on drop');
  assert(savedDataCalled === true, 'handleDrop should call saveData() when activity is assigned');
  assert(buildItineraryCalled === true, 'handleDrop should call buildItinerary() when activity is assigned');
  assert(feedbackMessages.length === 1 && feedbackMessages[0] === 'Assigned to Day 1 2025-06-02', `Expected feedback "Assigned to Day 1 2025-06-02", got "${feedbackMessages[0]}"`);

  // Test failed activity assignment
  savedDataCalled = false;
  buildItineraryCalled = false;
  feedbackMessages = [];
  assignResult = false;
  assignError = 'Day is full';

  context.handleDrop(dragEvent, 1, 0);
  assert(!savedDataCalled, 'handleDrop should not call saveData() when activity assignment fails');
  assert(feedbackMessages.length === 1 && feedbackMessages[0] === 'Day is full', 'handleDrop should report assignment error message');

  // Test empty/invalid data transfer in handleDrop
  dt = createMockDataTransfer();
  dragEvent.dataTransfer = dt;
  savedDataCalled = false;
  context.handleDrop(dragEvent, 0, 0);
  assert(!savedDataCalled, 'handleDrop should handle empty dataTransfer without throwing');

  // --- 4. Leg Reordering Handlers ---
  let legEl = createMockElement('leg1', '');
  dt = createMockDataTransfer();
  let legDragEvent = {
    preventDefault: () => {},
    currentTarget: legEl,
    dataTransfer: dt
  };

  // handleLegDragStart
  context.handleLegDragStart(legDragEvent, 2);
  assert(dt.effectAllowed === 'move', 'handleLegDragStart should set effectAllowed');
  assert(JSON.parse(dt.data['text/plain']).legIndex === 2, 'handleLegDragStart should set legIndex in dataTransfer');
  assert(legEl.classList.contains('dragging'), 'handleLegDragStart should add dragging class');

  // handleLegDragOver
  defaultPrevented = false;
  legEl.classList.remove('drag-over');
  legDragEvent.preventDefault = () => { defaultPrevented = true; };
  context.handleLegDragOver(legDragEvent, 1);
  assert(defaultPrevented === true, 'handleLegDragOver should preventDefault');
  assert(dt.dropEffect === 'move', 'handleLegDragOver should set dropEffect');
  assert(legEl.classList.contains('drag-over'), 'handleLegDragOver should add drag-over class');

  // handleLegDragLeave
  context.handleLegDragLeave(legDragEvent);
  assert(!legEl.classList.contains('drag-over'), 'handleLegDragLeave should remove drag-over class');

  // handleLegDrop - same index (noop)
  moveLegCalls = [];
  legEl.classList.add('drag-over');
  context.handleLegDrop(legDragEvent, 2);
  assert(!legEl.classList.contains('drag-over'), 'handleLegDrop should remove drag-over class');
  assert(moveLegCalls.length === 0, 'handleLegDrop should not call moveLegInSequence if target index equals dragged index');

  // handleLegDrop - different index
  context.handleLegDragStart(legDragEvent, 0);
  context.handleLegDrop(legDragEvent, 1);
  assert(moveLegCalls.length === 1 && moveLegCalls[0].fromIdx === 0 && moveLegCalls[0].toIdx === 1, 'handleLegDrop should call moveLegInSequence with correct indices');

  // handleLegDragEnd with container parent
  const containerEl = createMockElement('legReorderList', '');
  const child1 = createMockElement('c1', 'leg-reorder-item dragging drag-over');
  const child2 = createMockElement('c2', 'leg-reorder-item drag-over');
  child1.parentElement = containerEl;
  child2.parentElement = containerEl;
  containerEl.children = [child1, child2];

  legDragEvent = { currentTarget: child1 };
  context.handleLegDragEnd(legDragEvent);
  assert(!child1.classList.contains('dragging'), 'handleLegDragEnd should remove dragging from target');
  assert(!child1.classList.contains('drag-over'), 'handleLegDragEnd should remove drag-over from target');
  assert(!child2.classList.contains('drag-over'), 'handleLegDragEnd should remove drag-over from sibling items');

  // handleLegDragEnd without container (fallback)
  mockAllLegReorderItems.length = 0;
  mockAllLegReorderItems.push(child1, child2);
  child1.classList.add('dragging');
  child2.classList.add('drag-over');
  context.handleLegDragEnd(null);
  assert(!child1.classList.contains('dragging'), 'handleLegDragEnd fallback should clean up dragging classes on all items');
  assert(!child2.classList.contains('drag-over'), 'handleLegDragEnd fallback should clean up drag-over classes on all items');

  // --- 5. setupMobileTouchLegReordering ---
  // setup null container check
  context.setupMobileTouchLegReordering(null);

  const mobileContainer = createMockElement('mobileContainer', '');
  const touchItem0 = createMockElement('t0', 'leg-reorder-item');
  touchItem0.setAttribute('data-leg-index', '0');
  const touchItem1 = createMockElement('t1', 'leg-reorder-item');
  touchItem1.setAttribute('data-leg-index', '1');

  mobileContainer.children = [touchItem0, touchItem1];
  context.setupMobileTouchLegReordering(mobileContainer);

  // Simulate touchstart on item0
  touchItem0.triggerEvent('touchstart', {});
  assert(touchItem0.classList.contains('dragging'), 'touchstart should add dragging class to item');

  // Simulate touchmove over item1
  pointElement = touchItem1;
  touchItem0.triggerEvent('touchmove', {
    touches: [{ clientX: 100, clientY: 200 }]
  });
  assert(touchItem1.classList.contains('drag-over'), 'touchmove over item1 should add drag-over class to item1');

  // Simulate touchend over item1
  moveLegCalls = [];
  touchItem0.triggerEvent('touchend', {
    changedTouches: [{ clientX: 100, clientY: 200 }]
  });
  assert(!touchItem0.classList.contains('dragging'), 'touchend should remove dragging class');
  assert(!touchItem1.classList.contains('drag-over'), 'touchend should remove drag-over class');
  assert(moveLegCalls.length === 1 && moveLegCalls[0].fromIdx === 0 && moveLegCalls[0].toIdx === 1, 'touchend should call moveLegInSequence(0, 1)');

  // Touch move/end when touchDragLegIdx is null
  pointElement = touchItem1;
  touchItem0.triggerEvent('touchmove', { touches: [{ clientX: 100, clientY: 200 }] });
  touchItem0.triggerEvent('touchend', { changedTouches: [{ clientX: 100, clientY: 200 }] });

  console.log('✅ ALL dragdrop.js UNIT TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  try {
    runDragdropTests();
  } catch (err) {
    console.error('❌ dragdrop TEST FAILED:', err);
    process.exit(1);
  }
}

module.exports = { runDragdropTests };
