const path = require('path');

const {
  assert,
  extractBetween,
  loadSource
} = require('./lib/test-helpers');

function cityHasCoords(city) {
  return Number.isFinite(Number.parseFloat(city?.lat)) &&
    Number.isFinite(Number.parseFloat(city?.lng));
}

function normalizeFixtureCities(importedData, importedCityBlock) {
  return new Function(
    'importedData',
    'getRandomCityColor',
    `const ALL_CITIES = [
  { code: 'BNE', name: 'Brisbane', countryCode: 'AU', lat: -27.4698, lng: 153.0251 },
  { code: 'TPE', name: 'Taipei', countryCode: 'TW', lat: 25.0330, lng: 121.5654 },
  { code: 'VIE', name: 'Vienna', countryCode: 'AT', lat: 48.2082, lng: 16.3738 },
  { code: 'VRN', name: 'Verona', countryCode: 'IT', lat: 45.4384, lng: 10.9916 },
  { code: 'LHR', name: 'London', countryCode: 'GB', lat: 51.5074, lng: -0.1278 },
  { code: 'BKK', name: 'Bangkok', countryCode: 'TH', lat: 13.7563, lng: 100.5018 }
];
function getCountryName(countryCode) { return countryCode; }
function cityHasStoredCoords(city) {
  return Number.isFinite(Number.parseFloat(city?.lat)) && Number.isFinite(Number.parseFloat(city?.lng));
}
function getCityLocationDatabaseMatch(city) {
  const cityName = String(city?.name || '').trim().toLowerCase();
  const cityCode = String(city?.code || '').trim().toUpperCase();
  return ALL_CITIES.find(candidate =>
    (cityName && candidate.name.toLowerCase() === cityName) ||
    (cityCode && candidate.code === cityCode)
  ) || null;
}
function normalizeCityLocationData(city) {
  const match = getCityLocationDatabaseMatch(city);
  if (match) {
    if (!city.code) city.code = match.code;
    if (!city.countryCode) city.countryCode = match.countryCode;
    if (!city.country) city.country = getCountryName(match.countryCode);
    if (!cityHasStoredCoords(city)) {
      city.lat = match.lat;
      city.lng = match.lng;
    }
  }
  return city;
}
${importedCityBlock}
return normalizeImportedCities(importedData);`
  )(importedData, () => '#123456');
}

function getFixtureCityNav(appData, citiesData, journeys, stays, cityNavBlock) {
  return new Function(
    'appData',
    'citiesData',
    'journeys',
    'stays',
    `${cityNavBlock}
return {
  order: getCitiesInTravelOrder(),
  londonLeg: findLegForJourneyCity('city-london', 'London')?.id,
  veronaLeg: appData.find(l => cleanCityNavLabel(l.label).toLowerCase() === 'verona')?.id,
  chronologicalSequence: getChronologicalLegSequence(appData)
};`
  )(appData, citiesData, journeys, stays);
}

function getFixtureJourneyMapping(appData, citiesData, journeys, transportMappingBlock) {
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
  veronaDay: getDayJourneys('22 Jun', 'Bolzano', 'Milan', 'verona').map(j => j.id)
};`
  )(appData, citiesData, journeys);
}

async function run() {
  const dataJs = loadSource(path.join('js', 'data.js'));
  const itineraryJs = loadSource(path.join('js', 'itinerary.js'));
  const transportJs = loadSource(path.join('js', 'transport.js'));

  const fixture = JSON.parse(loadSource(path.join('backups', '2026_June_July_Europe_Thailand.json')));

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
    extractBetween(transportJs, 'function formatJourneyDate', 'function calculateDuration');

  const importedCities = normalizeFixtureCities(fixture, importedCityBlock);
  const importedCityNames = importedCities.map(city => city.name);

  assert(!importedCityNames.includes('Return'), 'Return should not be imported as a city');
  assert(!importedCityNames.includes('Paris'), 'Stale browser city Paris should not appear');
  assert(
    importedCityNames.length === new Set(importedCityNames.map(name => name.toLowerCase())).size,
    'Imported city list should not contain duplicate names'
  );
  assert(importedCities.find(city => city.name === 'Verona')?.isTransit !== true, 'Verona should be a destination city because it has stays');
  assert(importedCities.find(city => city.name === 'London')?.isTransit === true, 'London should remain a transit city');
  assert(cityHasCoords(importedCities.find(city => city.name === 'Brisbane')), 'Imported destination cities should include known coordinates');
  assert(cityHasCoords(importedCities.find(city => city.name === 'London')), 'Imported transit cities should include known coordinates');

  const cityNav = getFixtureCityNav(fixture.itinerary, importedCities, fixture.journeys, fixture.stays, cityNavBlock);
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

  // 1:1 Chronological Leg Navigation Assertions
  const chronoSeq = cityNav.chronologicalSequence;
  assert(Array.isArray(chronoSeq), 'getChronologicalLegSequence should return an array');
  assert(chronoSeq.length === 17, `Chronological sequence length should match 17 legs, got ${chronoSeq.length}`);

  // Assert Brisbane (Trip Start) is leg 0 with isStart: true
  assert(chronoSeq[0].displayLabel === 'Brisbane (Trip Start)', `Leg 0 displayLabel should be "Brisbane (Trip Start)", got "${chronoSeq[0].displayLabel}"`);
  assert(chronoSeq[0].legIndex === 0, `Leg 0 legIndex should be 0, got ${chronoSeq[0].legIndex}`);
  assert(chronoSeq[0].isStart === true, 'Leg 0 should have isStart: true');
  assert(!chronoSeq[0].isFinish, 'Leg 0 should not have isFinish: true');

  // Assert Brisbane (Trip Finish) is leg 16 with isFinish: true
  assert(chronoSeq[16].displayLabel === 'Brisbane (Trip Finish)', `Leg 16 displayLabel should be "Brisbane (Trip Finish)", got "${chronoSeq[16].displayLabel}"`);
  assert(chronoSeq[16].legIndex === 16, `Leg 16 legIndex should be 16, got ${chronoSeq[16].legIndex}`);
  assert(chronoSeq[16].isFinish === true, 'Leg 16 should have isFinish: true');
  assert(!chronoSeq[16].isStart, 'Leg 16 should not have isStart: true');

  // Assert Bangkok appears at 3 distinct chronological visit positions (Bangkok (1), Bangkok (2), Bangkok (3))
  const bangkokVisits = chronoSeq.filter(item => item.cityName === 'Bangkok');
  assert(bangkokVisits.length === 3, `Bangkok should appear in 3 chronological legs, got ${bangkokVisits.length}`);
  assert(bangkokVisits[0].displayLabel === 'Bangkok (1)' && bangkokVisits[0].legIndex === 2, `Bangkok visit 1 should be "Bangkok (1)" at index 2, got "${bangkokVisits[0].displayLabel}" at index ${bangkokVisits[0].legIndex}`);
  assert(bangkokVisits[1].displayLabel === 'Bangkok (2)' && bangkokVisits[1].legIndex === 13, `Bangkok visit 2 should be "Bangkok (2)" at index 13, got "${bangkokVisits[1].displayLabel}" at index ${bangkokVisits[1].legIndex}`);
  assert(bangkokVisits[2].displayLabel === 'Bangkok (3)' && bangkokVisits[2].legIndex === 15, `Bangkok visit 3 should be "Bangkok (3)" at index 15, got "${bangkokVisits[2].displayLabel}" at index ${bangkokVisits[2].legIndex}`);

  const journeyMapping = getFixtureJourneyMapping(
    fixture.itinerary,
    importedCities,
    JSON.parse(JSON.stringify(fixture.journeys)),
    transportMappingBlock
  );

  assert(journeyMapping.blankLegIds === 0, 'Journey migration should fill blank leg IDs');
  assert(journeyMapping.londonLeg === 'zurich', 'London journey segment should map to Zurich leg');
  assert(
    journeyMapping.outboundLegs.join(' > ') === 'city-brisbane-start > taipei > vienna',
    'Outbound journey segments should map to city-brisbane-start, Taipei, and Vienna legs'
  );
  assert(
    journeyMapping.zurichDay.includes('jid_zrh_bkk_456'),
    'Zurich day should include Zurich to Bangkok journey group'
  );
  assert(
    journeyMapping.veronaDay.includes('journey_1779880837955_pe6x8j'),
    'Verona day should include Bolzano to Milan journey'
  );

  console.log('City nav regression checks passed');
  console.log(JSON.stringify({
    cityCount: importedCities.length,
    firstFour: navNames.slice(0, 4),
    aroundVerona: navNames.slice(navNames.indexOf('Bolzano'), navNames.indexOf('Zurich') + 1),
    bangkokIndex: navNames.indexOf('Bangkok'),
    chronologicalLegs: chronoSeq.length,
    bangkokVisits: bangkokVisits.map(v => ({ legIndex: v.legIndex, label: v.displayLabel, legId: v.legId })),
    londonLeg: cityNav.londonLeg,
    veronaLeg: cityNav.veronaLeg,
    blankJourneyLegIds: journeyMapping.blankLegIds
  }, null, 2));
}

if (require.main === module) {
  run().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { run };
