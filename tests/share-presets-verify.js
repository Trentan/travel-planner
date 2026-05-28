const path = require('path');
const {
  assert,
  createVmContext,
  loadSource,
  runScriptInContext
} = require('./lib/test-helpers');

function run() {
  const dataJs = loadSource(path.join('js', 'data.js'));

  // Create a minimal DOM and state context to load js/data.js
  const documentElements = {};
  const getElementById = (id) => {
    if (!documentElements[id]) {
      documentElements[id] = {
        checked: false,
        value: '',
        style: {},
        classList: {
          classes: new Set(),
          add(c) { this.classes.add(c); },
          remove(c) { this.classes.delete(c); },
          contains(c) { return this.classes.has(c); }
        },
        cloneNode() {
          return { ...this, options: [] };
        },
        options: [],
        parentNode: {
          replaceChild(newChild, oldChild) {}
        },
        addEventListener() {}
      };
    }
    return documentElements[id];
  };

  const windowContext = createVmContext({
    window: {
      addEventListener: () => {}
    },
    document: {
      getElementById,
      querySelectorAll: () => []
    },
    titleData: { title: 'Test Trip', subtitle: 'Test Subtitle' },
    appData: [],
    journeys: [],
    stays: [],
    citiesData: [],
    userCities: [],
    userCountries: [],
    packingData: [],
    leaveHomeData: [],
    currentFileName: 'Default Template',
    localStorage: {
      setItem: () => {},
      getItem: () => null
    },
    navigator: {},
    addEventListener: () => {}
  });
  windowContext.window.window = windowContext.window;

  // Run js/data.js in the mocked VM context
  runScriptInContext(dataJs, windowContext, 'js/data.js');

  console.log('Testing redactShareExportPayload...');
  const testPayload = {
    itinerary: [
      {
        id: 'leg-1',
        label: 'London',
        legTips: ['Tip 1', 'Tip 2'],
        days: [
          {
            date: '2026-06-01',
            desc: 'Explore London',
            activityItems: [
              { text: 'Museum', cost: 15, bookingRef: 'REF123', notes: 'Private note' }
            ]
          }
        ]
      }
    ],
    journeys: [
      { id: 'j-1', cost: 250, bookingReference: 'PNR456', notes: 'Flight note' }
    ],
    stays: [
      { id: 's-1', totalCost: 120, bookingRef: 'HOTEL789', notes: 'Hotel note' }
    ]
  };

  // Test Co-traveler Preset (Shows everything)
  const coTravelerPayload = windowContext.redactShareExportPayload(testPayload, {
    redactCosts: false,
    redactRefs: false,
    redactNotes: false
  });
  assert(coTravelerPayload.itinerary[0].days[0].activityItems[0].cost === 15, 'Co-traveler preset should preserve costs');
  assert(coTravelerPayload.itinerary[0].days[0].activityItems[0].bookingRef === 'REF123', 'Co-traveler preset should preserve refs');
  assert(coTravelerPayload.itinerary[0].days[0].activityItems[0].notes === 'Private note', 'Co-traveler preset should preserve notes');
  assert(coTravelerPayload.journeys[0].bookingReference === 'PNR456', 'Co-traveler preset should preserve journey refs');

  // Test Family/Friends Preset (Hides refs only)
  const familyPayload = windowContext.redactShareExportPayload(testPayload, {
    redactCosts: false,
    redactRefs: true,
    redactNotes: false
  });
  assert(familyPayload.itinerary[0].days[0].activityItems[0].cost === 15, 'Family preset should preserve costs');
  assert(familyPayload.itinerary[0].days[0].activityItems[0].bookingRef === '', 'Family preset should redact refs');
  assert(familyPayload.itinerary[0].days[0].activityItems[0].notes === 'Private note', 'Family preset should preserve notes');
  assert(familyPayload.journeys[0].bookingReference === '', 'Family preset should redact journey refs');

  // Test Public Preset (Hides refs and costs)
  const publicPayload = windowContext.redactShareExportPayload(testPayload, {
    redactCosts: true,
    redactRefs: true,
    redactNotes: false
  });
  assert(publicPayload.itinerary[0].days[0].activityItems[0].cost === '', 'Public preset should redact costs');
  assert(publicPayload.itinerary[0].days[0].activityItems[0].bookingRef === '', 'Public preset should redact refs');
  assert(publicPayload.itinerary[0].days[0].activityItems[0].notes === 'Private note', 'Public preset should preserve notes');

  // Test applySharePreset function
  console.log('Testing applySharePreset...');
  assert(typeof windowContext.applySharePreset === 'function', 'applySharePreset should be defined');

  // Apply "co-traveler"
  windowContext.applySharePreset('co-traveler');
  assert(getElementById('shareHideCosts').checked === false, 'co-traveler preset should uncheck Hide Costs');
  assert(getElementById('shareHideRefs').checked === false, 'co-traveler preset should uncheck Hide Refs');
  assert(getElementById('shareHideNotes').checked === false, 'co-traveler preset should uncheck Hide Notes');

  // Apply "family"
  windowContext.applySharePreset('family');
  assert(getElementById('shareHideCosts').checked === false, 'family preset should uncheck Hide Costs');
  assert(getElementById('shareHideRefs').checked === true, 'family preset should check Hide Refs');
  assert(getElementById('shareHideNotes').checked === false, 'family preset should uncheck Hide Notes');

  // Apply "public"
  windowContext.applySharePreset('public');
  assert(getElementById('shareHideCosts').checked === true, 'public preset should check Hide Costs');
  assert(getElementById('shareHideRefs').checked === true, 'public preset should check Hide Refs');
  assert(getElementById('shareHideNotes').checked === false, 'public preset should uncheck Hide Notes');

  // Apply "confidential"
  windowContext.applySharePreset('confidential');
  assert(getElementById('shareHideCosts').checked === true, 'confidential preset should check Hide Costs');
  assert(getElementById('shareHideRefs').checked === true, 'confidential preset should check Hide Refs');
  assert(getElementById('shareHideNotes').checked === true, 'confidential preset should check Hide Notes');

  console.log('Share presets tests passed successfully!');
}

if (require.main === module) {
  try {
    run();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { run };
