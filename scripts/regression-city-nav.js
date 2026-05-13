const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const backupPath = path.join(root, 'backups', '2026_June_July_Europe_Thailand.json');
const dataJsPath = path.join(root, 'js', 'data.js');
const itineraryJsPath = path.join(root, 'js', 'itinerary.js');
const transportJsPath = path.join(root, 'js', 'transport.js');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function extractBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert(start !== -1, `Missing start marker: ${startMarker}`);
  assert(end !== -1, `Missing end marker: ${endMarker}`);
  return source.slice(start, end);
}

const fixture = JSON.parse(read(backupPath));
const dataJs = read(dataJsPath);
const itineraryJs = read(itineraryJsPath);
const transportJs = read(transportJsPath);

const importedCityBlock = extractBetween(
  dataJs,
  'function getImportedDestinationCityNames',
  'function getIntermediateJourneyCities'
);

const cityNavBlock = extractBetween(
  itineraryJs,
  'const CITY_NAV_SKIP_NAMES',
  '// Active city filter'
);

const transportMappingBlock =
  transportJs.slice(0, transportJs.indexOf('function findJourney')) +
  extractBetween(transportJs, 'function formatJourneyDate', 'function formatJourneyTime');

function normalizeFixtureCities(importedData) {
  return new Function(
    'importedData',
    'getRandomCityColor',
    `${importedCityBlock}
return normalizeImportedCities(importedData);`
  )(importedData, () => '#123456');
}

function getFixtureCityNav(appData, citiesData, journeys, stays) {
  return new Function(
    'appData',
    'citiesData',
    'journeys',
    'stays',
    `${cityNavBlock}
return {
  order: getCitiesInTravelOrder(),
  londonLeg: findLegForJourneyCity('city-london', 'London')?.id,
  veronaLeg: appData.find(l => cleanCityNavLabel(l.label).toLowerCase() === 'verona')?.id
};`
  )(appData, citiesData, journeys, stays);
}

function getFixtureJourneyMapping(appData, citiesData, journeys) {
  return new Function(
    'appDataArg',
    'citiesDataArg',
    'journeysArg',
    `var window = { journeys: journeysArg };
var localStorage = { setItem() {} };
var appData = appDataArg;
var citiesData = citiesDataArg;
var journeys = journeysArg;
${transportMappingBlock}
const changed = migrateJourneyCityIds();
return {
  changed,
  blankLegIds: journeys.filter(j => !j.legId).length,
  londonLeg: journeys.find(j => j.toLocation === 'London')?.legId,
  outboundLegs: journeys.filter(j => j.journeyId === 'jid_outbound_123').map(j => j.legId),
  zurichDay: getDayJourneys('26 Jun', 'Zurich', 'Bangkok', 'zurich').map(j => j.journeyId || j.id),
  veronaDay: getDayJourneys('23 Jun', 'Bolzano', 'Milan', 'verona').map(j => j.id)
};`
  )(appData, citiesData, journeys);
}

const importedCities = normalizeFixtureCities(fixture);
const importedCityNames = importedCities.map(city => city.name);

assert(!importedCityNames.includes('Return'), 'Return should not be imported as a city');
assert(!importedCityNames.includes('Paris'), 'Stale browser city Paris should not appear');
assert(
  importedCityNames.length === new Set(importedCityNames.map(name => name.toLowerCase())).size,
  'Imported city list should not contain duplicate names'
);
assert(importedCities.find(city => city.name === 'Verona')?.isTransit === true, 'Verona should remain a transit city');
assert(importedCities.find(city => city.name === 'London')?.isTransit === true, 'London should remain a transit city');

const cityNav = getFixtureCityNav(fixture.itinerary, importedCities, fixture.journeys, fixture.stays);
const navNames = cityNav.order.map(city => city.name);

assert(navNames.slice(0, 3).join(' > ') === 'Brisbane > Taipei > Vienna', 'City nav should favor real stay blocks over early transit stops');
assert(navNames.includes('Verona'), 'City nav should include Verona');
assert(navNames.includes('London'), 'City nav should include London');
assert(!navNames.includes('Return'), 'City nav should exclude Return');
assert(
  navNames.slice(navNames.indexOf('Bolzano'), navNames.indexOf('Zurich') + 1).join(' > ') === 'Bolzano > Verona > Milan > Zurich',
  'Verona should sit between Bolzano and Milan in the journey path'
);
assert(cityNav.londonLeg === 'zurich', 'London city nav click target should map to Zurich leg');
assert(cityNav.veronaLeg === 'verona', 'Verona city nav click target should map to Verona leg');
assert(
  navNames.indexOf('Bangkok') > navNames.indexOf('Zurich') && navNames.indexOf('Bangkok') < navNames.indexOf('Koh Samui'),
  'Bangkok should map to the longer Bangkok stay, not the early outbound transit stop'
);
assert(
  navNames.filter(name => name === 'Bangkok').length === 1,
  'Repeated city visits should map to one best/longest-stay city nav entry'
);

const journeyMapping = getFixtureJourneyMapping(
  fixture.itinerary,
  importedCities,
  JSON.parse(JSON.stringify(fixture.journeys))
);

assert(journeyMapping.blankLegIds === 0, 'Journey migration should fill blank leg IDs');
assert(journeyMapping.londonLeg === 'zurich', 'London journey segment should map to Zurich leg');
assert(
  journeyMapping.outboundLegs.join(' > ') === 'departure > taipei > vienna',
  'Outbound journey segments should map to departure, Taipei, and Vienna legs'
);
assert(
  journeyMapping.zurichDay.includes('jid_zrh_bkk_456'),
  'Zurich day should include Zurich to Bangkok journey group'
);
assert(
  journeyMapping.veronaDay.includes('journey_12'),
  'Verona day should include Bolzano to Milan journey'
);

console.log('City nav regression checks passed');
console.log(JSON.stringify({
  cityCount: importedCities.length,
  firstFour: navNames.slice(0, 4),
  aroundVerona: navNames.slice(navNames.indexOf('Bolzano'), navNames.indexOf('Zurich') + 1),
  bangkokIndex: navNames.indexOf('Bangkok'),
  londonLeg: cityNav.londonLeg,
  veronaLeg: cityNav.veronaLeg,
  blankJourneyLegIds: journeyMapping.blankLegIds
}, null, 2));
