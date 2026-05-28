const fs = require('fs');
let crudJs = fs.readFileSync('js/crud.js', 'utf8');
let itineraryJs = fs.readFileSync('js/itinerary.js', 'utf8');
const fixture = JSON.parse(fs.readFileSync('./backups/2026_June_July_Europe_Thailand.json', 'utf8'));

const getEnv = new Function('window', 'document', `
  let appData = [];
  let journeys = [];
  let stays = [];
  let DEFAULT_DATA = [];
  function normalizeTripJourneysData(j) { return j; }
  function normalizeTripStaysData(s) { return s; }
  function normalizeTripLegsData(l) { return l; }
  function getIntermediateJourneyCities() { return []; }
  function resetAppStateToDefaults() {}
  function extractCitiesFromItinerary() { return []; }
  function normalizeTripCitiesDateData() {}
  function normalizeImportedCities() { return []; }
  function cleanCityNavLabel(v) { return v; }
  function rebuildUI() {}
  function saveData() {}
  function getStayDisplayForDay() { return []; }
  function getCityFlag() { return ''; }
  function escapeCompactText() { return ''; }
  function formatTimelineTimeRange() { return ''; }
  function formatCurrency() { return ''; }
  function renderJourneySubLocationTextHtml() { return ''; }
  function getTransportIcon() { return ''; }
  function getDailyTimelineItemSortValue() { return 0; }
  function formatJourneySubLocationText() { return ''; }
  function getJourneyDisplayCost() { return ''; }
  function renderDailyTimeline() { return ''; }
  function buildCompactItinerary() {}
  function buildCompactItineraryDesktop() {}
  let isMobileViewport = () => false;
  let openDayCardIds = new Set();
  let localStorage = { setItem: () => {} };
  ${crudJs}
  ${itineraryJs}
  
  return { 
    testImport: function(importedData) {
      if (!importedData.itinerary) return;
      appData = importedData.itinerary;
      if (importedData.journeys) {
         journeys = importedData.journeys;
         window.journeys = journeys;
      }
      autoGenerateMissingTransitLegs(appData);
      buildItinerary();
    }
  };
`);

const document = {
  querySelectorAll: () => [],
  getElementById: () => ({ innerHTML: '', style: {} }),
  querySelector: () => null
};
const window = { isCompactView: false, innerWidth: 1024 };
const env = getEnv(window, document);
try {
  env.testImport(fixture);
  console.log('Success!');
} catch (e) {
  console.error('Error:', e);
}
