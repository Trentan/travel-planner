const fs = require('fs');
const path = require('path');
const { assert, createVmContext, loadSource, runScriptInContext } = require('./lib/test-helpers');

function setupTestContext(extraGlobals = {}) {
  const documentMock = {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
    body: {
      classList: {
        contains: () => false,
        add: () => {},
        remove: () => {}
      }
    }
  };
  const windowMock = {
    document: documentMock,
    addEventListener: () => {},
    removeEventListener: () => {},
    requestAnimationFrame: (cb) => { if (typeof cb === 'function') cb(); },
    cancelAnimationFrame: () => {},
    scrollTo: () => {},
    setTimeout,
    clearTimeout
  };
  const context = createVmContext({
    document: documentMock,
    window: windowMock,
    addEventListener: () => {},
    removeEventListener: () => {},
    requestAnimationFrame: (cb) => { if (typeof cb === 'function') cb(); },
    cancelAnimationFrame: () => {},
    scrollTo: () => {},
    appData: [],
    citiesData: [],
    journeys: [],
    stays: [],
    ...extraGlobals
  });
  context.window = context;
  context.document = documentMock;
  context.addEventListener = () => {};
  context.removeEventListener = () => {};

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

  console.log('✅ ALL 1:1 Chronological Leg Navigation unit tests passed cleanly!');
}

if (require.main === module) {
  runChronologicalLegNavigationTests();
}

module.exports = { runChronologicalLegNavigationTests };
