const fs = require('fs');
const path = require('path');
const { assert, createVmContext, loadSource, runScriptInContext } = require('./lib/test-helpers');

function createMockDomElement(tag = 'div', attrs = {}) {
  const classes = new Set();
  const dataset = {};
  const children = [];
  const attributes = { ...attrs };

  if (attrs.class || attrs.className) {
    (attrs.class || attrs.className).split(/\s+/).filter(Boolean).forEach(c => classes.add(c));
  }

  const el = {
    tagName: tag.toUpperCase(),
    dataset,
    style: {},
    children,
    id: attrs.id || '',
    get className() {
      return Array.from(classes).join(' ');
    },
    set className(val) {
      classes.clear();
      String(val || '').split(/\s+/).filter(Boolean).forEach(c => classes.add(c));
    },
    classList: {
      add(...cs) { cs.forEach(c => classes.add(c)); },
      remove(...cs) { cs.forEach(c => classes.delete(c)); },
      toggle(c, force) {
        if (force === undefined) {
          if (classes.has(c)) classes.delete(c);
          else classes.add(c);
        } else if (force) {
          classes.add(c);
        } else {
          classes.delete(c);
        }
      },
      contains(c) { return classes.has(c); }
    },
    setAttribute(k, v) {
      attributes[k] = String(v);
      if (k === 'id') el.id = String(v);
      if (k.startsWith('data-')) {
        const camel = k.slice(5).replace(/-([a-z])/g, (_, g) => g.toUpperCase());
        dataset[camel] = String(v);
      }
    },
    getAttribute(k) {
      return attributes[k] !== undefined ? attributes[k] : (k.startsWith('data-') ? dataset[k.slice(5).replace(/-([a-z])/g, (_, g) => g.toUpperCase())] : null);
    },
    hasAttribute(k) {
      return attributes[k] !== undefined;
    },
    removeAttribute(k) {
      delete attributes[k];
    },
    appendChild(child) {
      children.push(child);
      child.parentNode = el;
      return child;
    },
    addEventListener() {},
    removeEventListener() {},
    querySelector(selector) {
      return findMatchingNode(el, selector);
    },
    querySelectorAll(selector) {
      return findAllMatchingNodes(el, selector);
    },
    getBoundingClientRect() {
      return { top: 100, bottom: 200, left: 0, right: 100, width: 100, height: 100 };
    },
    scrollIntoView() { el._scrolledIntoView = true; },
    scrollTo() {},
    _innerHTML: '',
    get innerHTML() { return el._innerHTML; },
    set innerHTML(html) {
      el._innerHTML = html;
      children.length = 0;
      const btnMatches = String(html).match(/<button[\s\S]*?<\/button>/gi) || [];
      btnMatches.forEach(btnHtml => {
        const btn = createMockDomElement('button');
        const classMatch = btnHtml.match(/class=["']([^"']*)["']/i);
        if (classMatch) btn.className = classMatch[1];
        const dataCityMatch = btnHtml.match(/data-city=["']([^"']*)["']/i);
        if (dataCityMatch) btn.setAttribute('data-city', dataCityMatch[1]);
        btn.innerHTML = btnHtml.replace(/<button[^>]*>|<\/button>/gi, '');
        el.appendChild(btn);
      });
    }
  };
  return el;
}

function matchesSelector(el, selector) {
  if (!el || !selector) return false;
  const parts = selector.split(',').map(s => s.trim());
  return parts.some(part => {
    if (part.startsWith('#') && !part.includes(' ') && !part.includes('.')) {
      return el.id === part.slice(1);
    }
    if (part.startsWith('.') && !part.includes(' ') && !part.includes('[')) {
      return el.classList.contains(part.slice(1));
    }
    const attrMatch = part.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
    if (attrMatch) {
      const attr = attrMatch[1];
      const val = attrMatch[2];
      if (val !== undefined) return el.getAttribute(attr) === val;
      return el.hasAttribute(attr);
    }
    if (part.includes('.')) {
      const subParts = part.split('.');
      const tag = subParts[0];
      const rest = subParts.slice(1).join('.');
      if (tag && el.tagName !== tag.toUpperCase()) return false;
      const cls = rest.split('[')[0];
      if (cls && !el.classList.contains(cls)) return false;
      if (rest.includes('[')) {
        const subAttrMatch = rest.match(/\[([^=\]]+)(?:="([^"]*)")?\]/);
        if (subAttrMatch) {
          const attr = subAttrMatch[1];
          const val = subAttrMatch[2];
          if (val !== undefined) return el.getAttribute(attr) === val;
          return el.hasAttribute(attr);
        }
      }
      return true;
    }
    return false;
  });
}

function findMatchingNode(root, selector) {
  if (root !== selector && matchesSelector(root, selector)) return root;
  for (const child of root.children || []) {
    const res = findMatchingNode(child, selector);
    if (res) return res;
  }
  return null;
}

function findAllMatchingNodes(root, selector) {
  const list = [];
  function search(node) {
    if (matchesSelector(node, selector)) {
      list.push(node);
    }
    for (const child of node.children || []) {
      search(child);
    }
  }
  for (const child of root.children || []) {
    search(child);
  }
  return list;
}

function setupTestContext(extraGlobals = {}) {
  const elementsById = new Map();

  const getOrCreateElement = (id) => {
    if (!elementsById.has(id)) {
      elementsById.set(id, createMockDomElement('div', { id }));
    }
    return elementsById.get(id);
  };

  const documentMock = {
    getElementById: (id) => getOrCreateElement(id),
    querySelector: (sel) => {
      for (const el of elementsById.values()) {
        const match = findMatchingNode(el, sel);
        if (match) return match;
      }
      return null;
    },
    querySelectorAll: (sel) => {
      const results = [];
      for (const el of elementsById.values()) {
        results.push(...findAllMatchingNodes(el, sel));
      }
      return results;
    },
    createElement: (tag) => createMockDomElement(tag),
    addEventListener: () => {},
    removeEventListener: () => {},
    body: {
      classList: {
        contains: () => false,
        add: () => {},
        remove: () => {}
      },
      getAttribute: () => 'itinerary'
    }
  };

  const windowMock = {
    document: documentMock,
    addEventListener: () => {},
    removeEventListener: () => {},
    requestAnimationFrame: (cb) => { if (typeof cb === 'function') cb(); },
    cancelAnimationFrame: () => {},
    scrollTo: (coords) => { windowMock._lastScrollTo = coords; },
    setTimeout,
    clearTimeout,
    currentCityFilter: 'all'
  };

  const context = createVmContext({
    document: documentMock,
    window: windowMock,
    addEventListener: () => {},
    removeEventListener: () => {},
    requestAnimationFrame: (cb) => { if (typeof cb === 'function') cb(); },
    cancelAnimationFrame: () => {},
    scrollTo: (coords) => { windowMock._lastScrollTo = coords; },
    appData: [],
    citiesData: [],
    journeys: [],
    stays: [],
    currentCityFilter: 'all',
    isEditMode: false,
    getDayJourneys: () => [],
    getDayTotal: () => 0,
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    formatCurrency: (v) => String(v || ''),
    escapeHtmlText: (str) => String(str || ''),
    escapeCompactText: (str) => String(str || ''),
    ...extraGlobals
  });
  context.window = context;
  context.document = documentMock;
  context.addEventListener = () => {};
  context.removeEventListener = () => {};

  const utilsCode = loadSource('js/utils.js');
  runScriptInContext(utilsCode, context, 'js/utils.js');
  const itineraryCode = loadSource('js/itinerary.js');
  runScriptInContext(itineraryCode, context, 'js/itinerary.js');
  return context;
}

function runChronologicalLegNavigationTests() {
  console.log('Running 1:1 Chronological Leg Navigation unit tests...');

  const context = setupTestContext();
  const getChronologicalLegSequence = context.getChronologicalLegSequence || (context.window && context.window.getChronologicalLegSequence);

  assert(
    typeof getChronologicalLegSequence === 'function',
    'getChronologicalLegSequence should be exported as a function on context or window'
  );

  // ---------------------------------------------------------------------------
  // 1. Chronological Sequence from appData (1:1 mapping)
  // ---------------------------------------------------------------------------
  const backupPath = path.resolve(__dirname, '..', 'backups', '2026_June_July_Europe_Thailand.json');
  const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  const backupLegs = backupData.itinerary;
  assert(Array.isArray(backupLegs) && backupLegs.length === 17, 'Backup itinerary fixture must contain 17 legs');

  const fullSequence = getChronologicalLegSequence(backupLegs);
  assert(Array.isArray(fullSequence), 'getChronologicalLegSequence should return an array');

  // Filter only main leg entries (excluding any inline daytrip blips)
  const legEntries = fullSequence.filter(item => item.type === 'leg');
  assert(
    legEntries.length === backupLegs.length,
    `Main leg entries count (${legEntries.length}) must match appData length (${backupLegs.length})`
  );

  // Verify 1:1 order and keying by legId
  backupLegs.forEach((leg, idx) => {
    const entry = legEntries[idx];
    assert(entry.legId === leg.id, `Leg entry at index ${idx} must have legId "${leg.id}", got "${entry.legId}"`);
    assert(entry.legIndex === idx, `Leg entry at index ${idx} must have legIndex ${idx}, got ${entry.legIndex}`);
    if (idx === 0) {
      assert(entry.isStart === true, 'First leg entry must have isStart: true');
    } else {
      assert(!entry.isStart, `Non-first leg entry at index ${idx} must have isStart: false/falsy`);
    }
    if (idx === backupLegs.length - 1) {
      assert(entry.isFinish === true, 'Last leg entry must have isFinish: true');
    } else {
      assert(!entry.isFinish, `Non-last leg entry at index ${idx} must have isFinish: false/falsy`);
    }
  });

  // ---------------------------------------------------------------------------
  // 2. Dynamic Visit Numbering for Repeat Cities
  // ---------------------------------------------------------------------------
  // When cities are visited multiple times without explicit numbering/custom labels,
  // they should be numbered automatically: Brisbane (1), Brisbane (2), Bangkok (1), Bangkok (2), Bangkok (3)
  const repeatLegs = [
    { id: 'leg-bne-1', label: 'Brisbane', days: [{ date: '2026-06-01' }] },
    { id: 'leg-bkk-1', label: 'Bangkok', days: [{ date: '2026-06-02' }] },
    { id: 'leg-vie-1', label: 'Vienna', days: [{ date: '2026-06-05' }] },
    { id: 'leg-bkk-2', label: 'Bangkok', days: [{ date: '2026-06-10' }] },
    { id: 'leg-sam-1', label: 'Koh Samui', days: [{ date: '2026-06-15' }] },
    { id: 'leg-bkk-3', label: 'Bangkok', days: [{ date: '2026-06-20' }] },
    { id: 'leg-bne-2', label: 'Brisbane', days: [{ date: '2026-06-25' }] }
  ];

  const repeatSequence = getChronologicalLegSequence(repeatLegs);
  assert(repeatSequence.length === 7, `Expected 7 items for repeatLegs, got ${repeatSequence.length}`);

  assert(repeatSequence[0].cityName === 'Brisbane', 'Leg 0 cityName should be Brisbane');
  assert(repeatSequence[0].displayLabel === 'Brisbane (1)', `Leg 0 displayLabel should be "Brisbane (1)", got "${repeatSequence[0].displayLabel}"`);

  assert(repeatSequence[1].cityName === 'Bangkok', 'Leg 1 cityName should be Bangkok');
  assert(repeatSequence[1].displayLabel === 'Bangkok (1)', `Leg 1 displayLabel should be "Bangkok (1)", got "${repeatSequence[1].displayLabel}"`);

  assert(repeatSequence[3].cityName === 'Bangkok', 'Leg 3 cityName should be Bangkok');
  assert(repeatSequence[3].displayLabel === 'Bangkok (2)', `Leg 3 displayLabel should be "Bangkok (2)", got "${repeatSequence[3].displayLabel}"`);

  assert(repeatSequence[5].cityName === 'Bangkok', 'Leg 5 cityName should be Bangkok');
  assert(repeatSequence[5].displayLabel === 'Bangkok (3)', `Leg 5 displayLabel should be "Bangkok (3)", got "${repeatSequence[5].displayLabel}"`);

  assert(repeatSequence[6].cityName === 'Brisbane', 'Leg 6 cityName should be Brisbane');
  assert(repeatSequence[6].displayLabel === 'Brisbane (2)', `Leg 6 displayLabel should be "Brisbane (2)", got "${repeatSequence[6].displayLabel}"`);

  // ---------------------------------------------------------------------------
  // 3. Single-Visit Cities Remain Clean Without Numbers
  // ---------------------------------------------------------------------------
  // Vienna and Koh Samui only appear once in repeatLegs
  assert(repeatSequence[2].cityName === 'Vienna', 'Leg 2 cityName should be Vienna');
  assert(repeatSequence[2].displayLabel === 'Vienna', `Single-visit Vienna displayLabel should be "Vienna", got "${repeatSequence[2].displayLabel}"`);

  assert(repeatSequence[4].cityName === 'Koh Samui', 'Leg 4 cityName should be Koh Samui');
  assert(repeatSequence[4].displayLabel === 'Koh Samui', `Single-visit Koh Samui displayLabel should be "Koh Samui", got "${repeatSequence[4].displayLabel}"`);

  // ---------------------------------------------------------------------------
  // 4. Custom Labels and Explicit Labels Preserved
  // ---------------------------------------------------------------------------
  const customLabelLegs = [
    { id: 'bne-start', label: 'Brisbane (Trip Start)', days: [{ date: '2026-06-01' }] },
    { id: 'tpe', label: '🇹🇼 Taipei', days: [{ date: '2026-06-02' }] },
    { id: 'bkk-explicit', label: 'Bangkok (1)', days: [{ date: '2026-06-04' }] },
    { id: 'bkk-custom', label: 'Bangkok (Stopover)', days: [{ date: '2026-06-14' }] },
    { id: 'bne-finish', label: 'Brisbane (Trip Finish)', days: [{ date: '2026-06-25' }] }
  ];

  const customSequence = getChronologicalLegSequence(customLabelLegs);
  assert(customSequence[0].displayLabel === 'Brisbane (Trip Start)', `Custom label "Brisbane (Trip Start)" must be preserved, got "${customSequence[0].displayLabel}"`);
  assert(customSequence[0].cityName === 'Brisbane', `Clean city name for Brisbane (Trip Start) should be "Brisbane", got "${customSequence[0].cityName}"`);

  assert(customSequence[1].cityName === 'Taipei', `Clean city name for 🇹🇼 Taipei should be "Taipei", got "${customSequence[1].cityName}"`);
  assert(customSequence[1].displayLabel === 'Taipei', `Display label for single-visit Taipei should be "Taipei", got "${customSequence[1].displayLabel}"`);

  assert(customSequence[2].displayLabel === 'Bangkok (1)', `Explicit label "Bangkok (1)" must be preserved, got "${customSequence[2].displayLabel}"`);
  assert(customSequence[3].displayLabel === 'Bangkok (Stopover)', `Custom label "Bangkok (Stopover)" must be preserved, got "${customSequence[3].displayLabel}"`);
  assert(customSequence[4].displayLabel === 'Brisbane (Trip Finish)', `Custom label "Brisbane (Trip Finish)" must be preserved, got "${customSequence[4].displayLabel}"`);

  // ---------------------------------------------------------------------------
  // 5. Day-Trip Blip Detection
  // ---------------------------------------------------------------------------
  // Scenario A: Day with explicit dayTrip property
  // Scenario B: Day with isDayTrip: true
  // Scenario C: Day with activity marked with category 'daytrip' or titled 'Day trip to ...'
  const legsWithDayTrips = [
    {
      id: 'leg-verona',
      label: '🇮🇹 Verona',
      days: [
        { date: '2026-06-21', day: 'Sun', from: 'Bolzano', to: 'Verona' },
        { date: '2026-06-22', day: 'Mon', from: 'Verona', to: 'Venice', dayTrip: 'Venice' }
      ]
    },
    {
      id: 'leg-milan',
      label: 'Milan',
      days: [
        {
          date: '2026-06-23',
          day: 'Tue',
          from: 'Milan',
          to: 'Milan',
          activityItems: [
            { text: 'Day trip to Lake Como', category: 'daytrip' }
          ]
        },
        {
          date: '2026-06-24',
          day: 'Wed',
          from: 'Milan',
          to: 'Bergamo',
          isDayTrip: true
        }
      ]
    }
  ];

  const dayTripSequence = getChronologicalLegSequence(legsWithDayTrips);

  // Expect:
  // 0: leg-verona (type: 'leg')
  // 1: daytrip-blip Venice (type: 'daytrip-blip', parentLegId: 'leg-verona', dayIndex: 1, cityName: 'Venice', displayLabel: '↳ Venice')
  // 2: leg-milan (type: 'leg')
  // 3: daytrip-blip Lake Como (type: 'daytrip-blip', parentLegId: 'leg-milan', dayIndex: 0, cityName: 'Lake Como', displayLabel: '↳ Lake Como')
  // 4: daytrip-blip Bergamo (type: 'daytrip-blip', parentLegId: 'leg-milan', dayIndex: 1, cityName: 'Bergamo', displayLabel: '↳ Bergamo')
  assert(dayTripSequence.length === 5, `Expected 5 items including blips, got ${dayTripSequence.length}`);

  assert(dayTripSequence[0].type === 'leg' && dayTripSequence[0].legId === 'leg-verona', 'Item 0 must be Verona leg');
  assert(dayTripSequence[1].type === 'daytrip-blip', 'Item 1 must be daytrip-blip');
  assert(dayTripSequence[1].cityName === 'Venice', `Blip 1 cityName must be "Venice", got "${dayTripSequence[1].cityName}"`);
  assert(dayTripSequence[1].displayLabel === '↳ Venice', `Blip 1 displayLabel must be "↳ Venice", got "${dayTripSequence[1].displayLabel}"`);
  assert(dayTripSequence[1].parentLegId === 'leg-verona', 'Blip 1 parentLegId must be "leg-verona"');
  assert(dayTripSequence[1].dayIndex === 1, 'Blip 1 dayIndex must be 1');

  assert(dayTripSequence[2].type === 'leg' && dayTripSequence[2].legId === 'leg-milan', 'Item 2 must be Milan leg');
  assert(dayTripSequence[3].type === 'daytrip-blip', 'Item 3 must be daytrip-blip');
  assert(dayTripSequence[3].cityName === 'Lake Como', `Blip 3 cityName must be "Lake Como", got "${dayTripSequence[3].cityName}"`);
  assert(dayTripSequence[3].displayLabel === '↳ Lake Como', `Blip 3 displayLabel must be "↳ Lake Como", got "${dayTripSequence[3].displayLabel}"`);
  assert(dayTripSequence[3].parentLegId === 'leg-milan', 'Blip 3 parentLegId must be "leg-milan"');
  assert(dayTripSequence[3].dayIndex === 0, 'Blip 3 dayIndex must be 0');

  assert(dayTripSequence[4].type === 'daytrip-blip', 'Item 4 must be daytrip-blip');
  assert(dayTripSequence[4].cityName === 'Bergamo', `Blip 4 cityName must be "Bergamo", got "${dayTripSequence[4].cityName}"`);
  assert(dayTripSequence[4].displayLabel === '↳ Bergamo', `Blip 4 displayLabel must be "↳ Bergamo", got "${dayTripSequence[4].displayLabel}"`);
  assert(dayTripSequence[4].parentLegId === 'leg-milan', 'Blip 4 parentLegId must be "leg-milan"');
  assert(dayTripSequence[4].dayIndex === 1, 'Blip 4 dayIndex must be 1');

  // Verify that day trips do NOT increment the parent city's visit numbering
  assert(dayTripSequence[0].displayLabel === 'Verona', 'Verona should not have (1) suffix because of day trip');
  assert(dayTripSequence[2].displayLabel === 'Milan', 'Milan should not have (1) suffix because of day trips');

  // ---------------------------------------------------------------------------
  // 6. Edge Cases
  // ---------------------------------------------------------------------------
  // Empty / null / non-array inputs
  assert(JSON.stringify(getChronologicalLegSequence([])) === '[]', 'Empty array should return empty array');
  assert(JSON.stringify(getChronologicalLegSequence(null)) === '[]', 'null should return empty array');
  assert(JSON.stringify(getChronologicalLegSequence(undefined)) === '[]', 'undefined should return empty array');
  assert(JSON.stringify(getChronologicalLegSequence('invalid')) === '[]', 'non-array string should return empty array');

  // Single-leg trip
  const singleLeg = [{ id: 'leg-only', label: 'Sydney', days: [{ date: '2026-01-01' }] }];
  const singleSequence = getChronologicalLegSequence(singleLeg);
  assert(singleSequence.length === 1, 'Single-leg trip should return exactly 1 item');
  assert(singleSequence[0].displayLabel === 'Sydney', 'Single-leg trip should not have (1) suffix');
  assert(singleSequence[0].isStart === true, 'Single leg should be isStart: true');
  assert(singleSequence[0].isFinish === true, 'Single leg should be isFinish: true');

  // 0-night / empty days leg
  const zeroNightLegs = [
    { id: 'leg-start', label: 'Perth (Trip Start)', days: [] },
    { id: 'leg-singapore', label: 'Singapore', days: [] }
  ];
  const zeroNightSeq = getChronologicalLegSequence(zeroNightLegs);
  assert(zeroNightSeq.length === 2, 'Zero-night legs should still be included in sequence');
  assert(zeroNightSeq[0].legId === 'leg-start', 'Zero-night leg 0 id should match');
  assert(zeroNightSeq[1].legId === 'leg-singapore', 'Zero-night leg 1 id should match');

  // Fallback legId when id is missing
  const noIdLegs = [{ label: 'Rome', days: [] }];
  const noIdSeq = getChronologicalLegSequence(noIdLegs);
  assert(noIdSeq.length === 1, 'Leg with missing id should be processed');
  assert(noIdSeq[0].legId === 'leg-0', `Missing id should generate fallback "leg-0", got "${noIdSeq[0].legId}"`);

  // ---------------------------------------------------------------------------
  // 7. buildCityNav() DOM Rendering with 1:1 Leg Sequence and Day-Trip Blips
  // ---------------------------------------------------------------------------
  {
    const navContext = setupTestContext({
      appData: legsWithDayTrips
    });
    const buildCityNav = navContext.buildCityNav || (navContext.window && navContext.window.buildCityNav);
    assert(typeof buildCityNav === 'function', 'buildCityNav must be defined as a function');

    const nav = navContext.document.getElementById('cityNav');
    const navList = navContext.document.createElement('div');
    navList.className = 'city-nav-list';
    nav.appendChild(navList);

    buildCityNav();

    // Verify leading All button
    const allBtn = navList.querySelector('[data-city="all"]');
    assert(allBtn, 'buildCityNav must render a leading [data-city="all"] button');
    assert(allBtn.classList.contains('active'), 'Leading [data-city="all"] button should be active by default');
    assert(allBtn.innerHTML.includes('All'), 'Leading button text should include "All"');

    // Verify 1:1 Leg buttons
    const veronaBtn = navList.querySelector('[data-leg-id="leg-verona"]');
    assert(veronaBtn, 'buildCityNav must render button for leg-verona');
    assert(veronaBtn.getAttribute('data-city') === 'leg-verona', 'Verona button data-city must be leg-verona');
    assert(veronaBtn.getAttribute('data-city-name') === 'Verona', 'Verona button data-city-name must be Verona');
    assert(veronaBtn.innerHTML.includes('Verona'), 'Verona button innerHTML must include "Verona"');

    const milanBtn = navList.querySelector('[data-leg-id="leg-milan"]');
    assert(milanBtn, 'buildCityNav must render button for leg-milan');
    assert(milanBtn.getAttribute('data-city') === 'leg-milan', 'Milan button data-city must be leg-milan');

    // Verify Day-trip blip buttons
    const blips = navList.querySelectorAll('[data-role="daytrip-blip"]');
    assert(blips.length === 3, `Expected 3 day-trip blips in navList, got ${blips.length}`);

    const veniceBlip = blips.find(b => b.getAttribute('data-city-name') === 'Venice');
    assert(veniceBlip, 'Venice day-trip blip must be rendered');
    assert(veniceBlip.getAttribute('data-parent-leg-id') === 'leg-verona', 'Venice blip parentLegId must be leg-verona');
    assert(veniceBlip.getAttribute('data-day-index') === '1', 'Venice blip dayIndex must be 1');
    assert(veniceBlip.innerHTML.includes('↳ Venice'), 'Venice blip must display "↳ Venice"');
    assert(veniceBlip.className.includes('border-dashed'), 'Venice blip must have dashed border styling');

    const comoBlip = blips.find(b => b.getAttribute('data-city-name') === 'Lake Como');
    assert(comoBlip, 'Lake Como day-trip blip must be rendered');
    assert(comoBlip.getAttribute('data-parent-leg-id') === 'leg-milan', 'Lake Como blip parentLegId must be leg-milan');
    assert(comoBlip.getAttribute('data-day-index') === '0', 'Lake Como blip dayIndex must be 0');
    assert(comoBlip.innerHTML.includes('↳ Lake Como'), 'Lake Como blip must display "↳ Lake Como"');

    // Verify trailing Add City button
    const addBtn = navList.querySelector('.city-nav-add-btn');
    assert(addBtn, 'buildCityNav must render trailing .city-nav-add-btn');
    assert(addBtn.innerHTML.includes('City'), 'Trailing button must contain "City"');
  }

  // ---------------------------------------------------------------------------
  // 8. selectCityFilter() & switchCityFilter() Targeted Leg Selection
  // ---------------------------------------------------------------------------
  {
    const navContext = setupTestContext({
      appData: legsWithDayTrips
    });
    const buildCityNav = navContext.buildCityNav || (navContext.window && navContext.window.buildCityNav);
    const selectCityFilter = navContext.selectCityFilter || (navContext.window && navContext.window.selectCityFilter);
    const switchCityFilter = navContext.switchCityFilter || (navContext.window && navContext.window.switchCityFilter);

    assert(typeof switchCityFilter === 'function', 'switchCityFilter must be exported to window');

    const nav = navContext.document.getElementById('cityNav');
    const navList = navContext.document.createElement('div');
    navList.className = 'city-nav-list';
    nav.appendChild(navList);

    navContext.document.getElementById('leg-leg-verona');
    navContext.document.getElementById('leg-leg-milan');

    buildCityNav();

    // Select Verona leg
    const veronaBtn = navList.querySelector('[data-leg-id="leg-verona"]');
    selectCityFilter('leg-verona', veronaBtn);

    assert(navContext.window.currentCityFilter === 'leg-verona', 'currentCityFilter should be "leg-verona"');
    assert(veronaBtn.classList.contains('active'), 'Verona button should have active class');
    const allBtn = navList.querySelector('[data-city="all"]');
    assert(!allBtn.classList.contains('active'), 'All button should no longer have active class');

    // Switch to Milan leg via switchCityFilter
    switchCityFilter('leg-milan');
    assert(navContext.window.currentCityFilter === 'leg-milan', 'currentCityFilter should be "leg-milan" after switchCityFilter');
    const milanBtn = navList.querySelector('[data-leg-id="leg-milan"]');
    assert(milanBtn.classList.contains('active'), 'Milan button should now have active class');
    assert(!veronaBtn.classList.contains('active'), 'Verona button should no longer have active class');

    // Reset back to all
    switchCityFilter('all');
    assert(navContext.window.currentCityFilter === 'all', 'currentCityFilter should be "all" after resetting');
    assert(allBtn.classList.contains('active'), 'All button should be active again');
  }

  // ---------------------------------------------------------------------------
  // 9. Day-Trip Blip Clicking & Scrolling via scrollToDayCard
  // ---------------------------------------------------------------------------
  {
    const navContext = setupTestContext({
      appData: legsWithDayTrips
    });
    const scrollToDayCard = navContext.scrollToDayCard || (navContext.window && navContext.window.scrollToDayCard);
    assert(typeof scrollToDayCard === 'function', 'scrollToDayCard must be exported to window');

    const nav = navContext.document.getElementById('cityNav');
    const navList = navContext.document.createElement('div');
    navList.className = 'city-nav-list';
    nav.appendChild(navList);

    const blipBtn = navContext.document.createElement('button');
    blipBtn.className = 'city-nav-btn city-nav-blip-btn';
    blipBtn.setAttribute('data-role', 'daytrip-blip');
    navList.appendChild(blipBtn);

    navContext.document.getElementById('day-0-1');
    scrollToDayCard('leg-verona', 0, 1, blipBtn);

    assert(blipBtn.classList.contains('active'), 'blipBtn should receive active class on click');
  }

  // ---------------------------------------------------------------------------
  // 10. Scrollspy / Active State Sync via updateCityNavActiveState
  // ---------------------------------------------------------------------------
  {
    const navContext = setupTestContext({
      appData: legsWithDayTrips
    });
    const buildCityNav = navContext.buildCityNav || (navContext.window && navContext.window.buildCityNav);
    const updateCityNavActiveState = navContext.updateCityNavActiveState || (navContext.window && navContext.window.updateCityNavActiveState);
    assert(typeof updateCityNavActiveState === 'function', 'updateCityNavActiveState must be exported to window');

    const nav = navContext.document.getElementById('cityNav');
    const navList = navContext.document.createElement('div');
    navList.className = 'city-nav-list';
    nav.appendChild(navList);

    buildCityNav();

    // Trigger updateCityNavActiveState for leg-milan
    updateCityNavActiveState('leg-milan');

    const milanBtn = navList.querySelector('[data-leg-id="leg-milan"]');
    assert(milanBtn && milanBtn.classList.contains('active'), 'Milan button should be marked active by updateCityNavActiveState');
    const allBtn = navList.querySelector('[data-city="all"]');
    assert(!allBtn.classList.contains('active'), 'All button should not be active');
  }

  // ---------------------------------------------------------------------------
  // 11. Mobile Swipe Slider (getCompactMobileLegSequence, slides & chips)
  // ---------------------------------------------------------------------------
  const legsWithRepeats = [
    { id: 'leg-bne-start', label: 'Brisbane', days: [{ date: '2026-06-01' }] },
    { id: 'leg-bkk-1', label: 'Bangkok', days: [{ date: '2026-06-05' }] },
    { id: 'leg-vie', label: 'Vienna', days: [{ date: '2026-06-12' }] },
    { id: 'leg-bkk-2', label: 'Bangkok', days: [{ date: '2026-06-20' }] },
    { id: 'leg-bne-end', label: 'Brisbane', days: [{ date: '2026-06-30' }] }
  ];

  {
    const mobileContext = setupTestContext({
      appData: legsWithRepeats
    });
    const getCompactMobileLegSequence = mobileContext.getCompactMobileLegSequence || (mobileContext.window && mobileContext.window.getCompactMobileLegSequence);
    const renderCompactCitySlide = mobileContext.renderCompactCitySlide || (mobileContext.window && mobileContext.window.renderCompactCitySlide);
    const renderCompactCityChip = mobileContext.renderCompactCityChip || (mobileContext.window && mobileContext.window.renderCompactCityChip);

    assert(typeof getCompactMobileLegSequence === 'function', 'getCompactMobileLegSequence must be exported');
    const mobileSeq = getCompactMobileLegSequence();
    assert(mobileSeq.length === 5, `Expected 5 mobile legs, got ${mobileSeq.length}`);

    // Verify 1:1 sequence labels and IDs match getChronologicalLegSequence
    assert(mobileSeq[0].displayLabel === 'Brisbane (1)', `Expected Brisbane (1), got ${mobileSeq[0].displayLabel}`);
    assert(mobileSeq[0].legId === 'leg-bne-start', `Expected leg-bne-start, got ${mobileSeq[0].legId}`);
    assert(mobileSeq[1].displayLabel === 'Bangkok (1)', `Expected Bangkok (1), got ${mobileSeq[1].displayLabel}`);
    assert(mobileSeq[1].legId === 'leg-bkk-1', `Expected leg-bkk-1, got ${mobileSeq[1].legId}`);
    assert(mobileSeq[2].displayLabel === 'Vienna', `Expected Vienna, got ${mobileSeq[2].displayLabel}`);
    assert(mobileSeq[2].legId === 'leg-vie', `Expected leg-vie, got ${mobileSeq[2].legId}`);
    assert(mobileSeq[3].displayLabel === 'Bangkok (2)', `Expected Bangkok (2), got ${mobileSeq[3].displayLabel}`);
    assert(mobileSeq[3].legId === 'leg-bkk-2', `Expected leg-bkk-2, got ${mobileSeq[3].legId}`);
    assert(mobileSeq[4].displayLabel === 'Brisbane (2)', `Expected Brisbane (2), got ${mobileSeq[4].displayLabel}`);
    assert(mobileSeq[4].legId === 'leg-bne-end', `Expected leg-bne-end, got ${mobileSeq[4].legId}`);

    // Test renderCompactCitySlide
    const slide0Html = renderCompactCitySlide(mobileSeq[0], 0, new Map(), 0);
    assert(slide0Html.includes('id="city-slide-0"'), 'Slide 0 must have id="city-slide-0"');
    assert(slide0Html.includes('data-leg-id="leg-bne-start"'), 'Slide 0 must have data-leg-id="leg-bne-start"');
    assert(slide0Html.includes('Brisbane (1)'), 'Slide 0 must render "Brisbane (1)"');

    const slide3Html = renderCompactCitySlide(mobileSeq[3], 3, new Map(), 0);
    assert(slide3Html.includes('id="city-slide-3"'), 'Slide 3 must have id="city-slide-3"');
    assert(slide3Html.includes('data-leg-id="leg-bkk-2"'), 'Slide 3 must have data-leg-id="leg-bkk-2"');
    assert(slide3Html.includes('Bangkok (2)'), 'Slide 3 must render "Bangkok (2)"');

    // Test renderCompactCityChip
    const chip0Html = renderCompactCityChip(mobileSeq[0], 0, new Map(), 0);
    assert(chip0Html.includes('aria-controls="city-slide-0"'), 'Chip 0 must control city-slide-0');
    assert(chip0Html.includes('data-leg-id="leg-bne-start"'), 'Chip 0 must have data-leg-id="leg-bne-start"');
    assert(chip0Html.includes('Brisbane (1)'), 'Chip 0 must render "Brisbane (1)"');
  }

  // ---------------------------------------------------------------------------
  // 12. Accommodation Cross-Tab Leg Filtering (getFilteredAndSortedStays)
  // ---------------------------------------------------------------------------
  {
    const staysSample = [
      { id: 'stay-vie', legId: 'leg-vie', cityId: 'city-vienna', propertyName: 'Hotel Vienna', checkIn: '2026-06-12', checkOut: '2026-06-15' },
      { id: 'stay-bkk1', legId: 'leg-bkk-1', cityId: 'city-bangkok', propertyName: 'Bangkok Hub Hotel', checkIn: '2026-06-10', checkOut: '2026-06-12' },
      { id: 'stay-bkk2', legId: 'leg-bkk-2', cityId: 'city-bangkok', propertyName: 'Bangkok Riverside', checkIn: '2026-06-20', checkOut: '2026-06-25' }
    ];

    const tabContext = setupTestContext({
      appData: legsWithRepeats,
      stays: staysSample
    });
    const tabsCode = loadSource('js/tabs.js');
    runScriptInContext(tabsCode, tabContext, 'js/tabs.js');

    const getFilteredAndSortedStays = tabContext.getFilteredAndSortedStays;
    assert(typeof getFilteredAndSortedStays === 'function', 'getFilteredAndSortedStays must be exported');

    // All returns all 3 stays
    const allStays = getFilteredAndSortedStays('all');
    assert(allStays.length === 3, 'Filtering by "all" returns all stays');

    // Specific legId isolation
    const bkk1Stays = getFilteredAndSortedStays('leg-bkk-1');
    assert(bkk1Stays.length === 1, 'Filtering by "leg-bkk-1" returns exactly 1 stay');
    assert(bkk1Stays[0].id === 'stay-bkk1', 'Matching stay must be stay-bkk1');

    const bkk2Stays = getFilteredAndSortedStays('leg-bkk-2');
    assert(bkk2Stays.length === 1, 'Filtering by "leg-bkk-2" returns exactly 1 stay');
    assert(bkk2Stays[0].id === 'stay-bkk2', 'Matching stay must be stay-bkk2');

    const vieStays = getFilteredAndSortedStays('leg-vie');
    assert(vieStays.length === 1, 'Filtering by "leg-vie" returns exactly 1 stay');
    assert(vieStays[0].id === 'stay-vie');
  }

  // ---------------------------------------------------------------------------
  // 13. Transit Filtering & Budget Tab Consolidated City Breakdown
  // ---------------------------------------------------------------------------
  {
    const journeysSample = [
      { id: 'j-bne-bkk', legId: 'leg-bne-start', fromCityId: 'city-brisbane', toCityId: 'city-bangkok', cost: '500' },
      { id: 'j-bkk-vie', legId: 'leg-bkk-1', fromCityId: 'city-bangkok', toCityId: 'city-vienna', cost: '300' },
      { id: 'j-vie-bkk', legId: 'leg-vie', fromCityId: 'city-vienna', toCityId: 'city-bangkok', cost: '350' }
    ];

    const multiContext = setupTestContext({
      appData: legsWithRepeats,
      journeys: journeysSample,
      stays: [
        { id: 's1', legId: 'leg-bkk-1', totalCost: '200', checkIn: '2026-06-10', checkOut: '2026-06-12' },
        { id: 's2', legId: 'leg-bkk-2', totalCost: '300', checkIn: '2026-06-20', checkOut: '2026-06-25' }
      ]
    });

    const transportCode = loadSource('js/transport.js');
    runScriptInContext(transportCode, multiContext, 'js/transport.js');
    const tabsCode = loadSource('js/tabs.js');
    runScriptInContext(tabsCode, multiContext, 'js/tabs.js');

    // Transit filtering
    multiContext.document.getElementById('transport-table-container');
    const buildTransportTab = multiContext.buildTransportTab;
    assert(typeof buildTransportTab === 'function', 'buildTransportTab must be exported');

    buildTransportTab('leg-bkk-1');
    const container = multiContext.document.getElementById('transport-table-container');
    assert(container.innerHTML.includes('j-bkk-vie') || container.innerHTML.includes('Transport'), 'buildTransportTab filtered by leg-bkk-1 renders');

    // Budget Tab consolidated breakdown
    const calculateBudgetBreakdown = multiContext.calculateBudgetBreakdown;
    assert(typeof calculateBudgetBreakdown === 'function', 'calculateBudgetBreakdown must be exported');

    const budget = calculateBudgetBreakdown();
    // Bangkok has 2 visits (leg-bkk-1 and leg-bkk-2); it must be consolidated into a single 'Bangkok' row
    const bangkokRow = budget.legBreakdown.find(row => row.label === 'Bangkok');
    assert(bangkokRow, 'Budget breakdown must consolidate multi-visit Bangkok legs into a single "Bangkok" row');
    // Combined accommodation for Bangkok: $200 + $300 = $500
    assert(bangkokRow.accom === 500, `Expected Bangkok consolidated accommodation $500, got ${bangkokRow.accom}`);
  }

  console.log('✅ ALL 1:1 Chronological Leg Navigation unit tests passed cleanly!');
}

if (require.main === module) {
  runChronologicalLegNavigationTests();
}

module.exports = { runChronologicalLegNavigationTests };
