const testHelpers = require('./tests/lib/test-helpers');
const crudJs = testHelpers.loadSource('js/crud.js');
const fixture = require('./backups/2026_June_July_Europe_Thailand.json');
const getSyncEnv = new Function('window', `
  let appData = window.appData || [];
  let saveAppData = () => {};
  let getCurrentAppData = () => appData;
  let normalizeTripDateValue = (d) => d;
  function getBaseNameGlobal(v) { return (v||'').toLowerCase(); }
  function confirm() { return true; } function alert() {}
  function closeAddLegDialog() {}
  let document = { getElementById: () => null, querySelector: () => null };

  ${crudJs}
  
  return { syncAllLegDays };
`);
const window = { journeys: fixture.journeys, stays: fixture.stays, appData: fixture.itinerary, document: { getElementById: () => null, querySelector: () => null } };
const env = getSyncEnv(window);

const orig = env.syncAllLegDays;
env.syncAllLegDays = function() {
  console.log('Running syncAllLegDays...');
  console.log(window.appData.map(l => l.id));
  orig();
};
env.syncAllLegDays();

const bne = window.appData.find(l => l.id.includes('brisbane-start') || l.id === 'departure');
console.log('Brisbane dates AFTER sync:', bne.days.map(d => d.date));
