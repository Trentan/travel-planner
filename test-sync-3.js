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
  function closeAddLegDialog() {} function alert() {}
  let document = { getElementById: () => null, querySelector: () => null };

  ${crudJs}
  
  return { syncAllLegDays };
`);
const window = { journeys: fixture.journeys, stays: fixture.stays, appData: fixture.itinerary, document: { getElementById: () => null, querySelector: () => null } };
const env = getSyncEnv(window);
env.syncAllLegDays();

const bne = window.appData.find(leg => leg.id && leg.id.includes('brisbane') || leg.id === 'departure');
console.log('Brisbane dates AFTER sync:', bne.days.map(d => d.date));
