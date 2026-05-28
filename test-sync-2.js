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
  function closeAddLegDialog() {}
  let document = { getElementById: () => null };

  ${crudJs}
  
  return { syncAllLegDays };
`);
const window = { journeys: fixture.journeys, stays: fixture.stays, appData: fixture.itinerary, document: { getElementById: () => null } };
const env = getSyncEnv(window);
env.syncAllLegDays();

const bne = window.appData.find(l => l.id.includes('brisbane-start') || l.id === 'departure');
console.log('Brisbane dates:', bne.days.map(d => d.date));
