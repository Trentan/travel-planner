const fs = require('fs');
let crudJs = fs.readFileSync('js/crud.js', 'utf8');
const fixture = JSON.parse(fs.readFileSync('./backups/2026_June_July_Europe_Thailand.json', 'utf8'));

const getEnv = new Function('window', `
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
  function buildItinerary() {}
  function saveData() {}
  let localStorage = { setItem: () => {} };
  ${crudJs}
  
  // Expose test function
  return { 
    testImport: function(importedData) {
      if (!importedData.itinerary) return;
      appData = importedData.itinerary;
      if (importedData.journeys) {
         journeys = importedData.journeys;
         window.journeys = journeys;
      }
      autoGenerateMissingTransitLegs(appData);
    }
  };
`);

const window = {};
const env = getEnv(window);
try {
  env.testImport(fixture);
  console.log('Success!');
} catch (e) {
  console.error('Error:', e);
}
