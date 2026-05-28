const testHelpers = require('./tests/lib/test-helpers');
const crudJs = testHelpers.loadSource('js/crud.js');
const fixture = require('./backups/2026_June_July_Europe_Thailand.json');
const getSyncEnv = new Function('window', `
  let appData = window.appData || [];
  let saveAppData = () => {};
  let getCurrentAppData = () => appData;
  let normalizeTripDateValue = (d) => d;
  function getBaseNameGlobal(v) { return (v||'').toLowerCase(); }
  function confirm() { return true; }
  function alert() {}
  function closeAddLegDialog() {}
  let document = { getElementById: () => null, querySelector: () => null };

  ${crudJs}
  
  return { syncAllLegDays };
`);
const window = { journeys: fixture.journeys, stays: fixture.stays, appData: fixture.itinerary, document: { getElementById: () => null, querySelector: () => null }, getBaseNameGlobal: (v) => (v||'').toLowerCase() };
const env = getSyncEnv(window);

const orig = env.syncAllLegDays;
env.syncAllLegDays = function() {
  const brisbane = window.appData.find(l => l.id && l.id.includes('brisbane'));
  const cityId = brisbane.id;
  const baseCityName = 'brisbane';
  const departingJourneys = window.journeys.filter(j => 
    (j._inferredFromLegId === brisbane.id && (j.fromLocation && j.toLocation && j.fromLocation.toLowerCase() !== j.toLocation.toLowerCase())) ||
    (!j._inferredFromLegId && (j.legId === brisbane.id || !j.legId) && (j.fromCityId === cityId || (j.fromLocation && j.fromLocation.toLowerCase() === baseCityName)) && (j.fromCityId !== j.toCityId))
  );
  console.log('Departing Journeys length:', departingJourneys.length);
  if (departingJourneys.length > 0) {
    console.log('Journey:', departingJourneys[0].id, 'Departure Date:', departingJourneys[0].departureDate);
  }
  orig();
};

env.syncAllLegDays();

const bne = window.appData.find(l => l.id && l.id.includes('brisbane'));
console.log('Brisbane dates AFTER sync:', bne.days.map(d => d.date));
