const fs = require('fs');
const path = require('path');
const { assert } = require('./lib/test-helpers');

async function run() {
  console.log('Running city fuzzy matching and alias resolution test suite...');
  const utilsCode = fs.readFileSync(path.join(__dirname, '../js/utils.js'), 'utf8');
  const dataCode = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
  const bookingIntakeCode = fs.readFileSync(path.join(__dirname, '../js/booking-intake.js'), 'utf8');

  const documentMock = {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({
      setAttribute: () => {},
      appendChild: () => {},
      style: {},
      addEventListener: () => {},
      remove: () => {}
    }),
    body: {
      addEventListener: () => {},
      appendChild: () => {},
      insertBefore: () => {},
      firstChild: null
    },
    addEventListener: () => {}
  };

  const windowMock = {
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    indexedDB: null,
    document: documentMock,
    addEventListener: () => {},
    journeys: [],
    stays: []
  };

  const combinedCode = `
    const document = window.document;
    ${utilsCode}
    ${dataCode}
    ${bookingIntakeCode}
    return {
      calculateLevenshteinDistance,
      calculateSimilarityScore,
      stripDiacritics,
      getCityAliasMatch,
      findFuzzyCityCandidate,
      getCityLocationDatabaseMatch,
      findCityByBookingName,
      applySuggestedCityCorrection,
      ALL_CITIES,
      citiesData
    };
  `;

  const evalFn = new Function('window', 'localStorage', combinedCode);
  const engine = evalFn(windowMock, windowMock.localStorage);

  // 1. Levenshtein Distance & Similarity Score
  assert(engine.calculateLevenshteinDistance('Osaka', 'Osaka') === 0, 'Exact strings should have distance 0');
  assert(engine.calculateLevenshteinDistance('Osacka', 'Osaka') === 1, 'Osacka -> Osaka should have distance 1');
  assert(engine.calculateLevenshteinDistance('Viena', 'Vienna') === 1, 'Viena -> Vienna should have distance 1');
  assert(engine.calculateLevenshteinDistance('Zurichh', 'Zurich') === 1, 'Zurichh -> Zurich should have distance 1');
  assert(engine.calculateSimilarityScore('Osacka', 'Osaka') >= 0.8, 'Osacka similarity score should be >= 0.8');

  // 2. Diacritics stripping
  assert(engine.stripDiacritics('München') === 'Munchen', 'München diacritics stripping');
  assert(engine.stripDiacritics('Zürich') === 'Zurich', 'Zürich diacritics stripping');
  assert(engine.stripDiacritics('Kraków') === 'Krakow', 'Kraków diacritics stripping');
  assert(engine.stripDiacritics('São Paulo') === 'Sao Paulo', 'São Paulo diacritics stripping');

  // 3. City Aliases Dictionary
  const munichAlias = engine.getCityAliasMatch('München');
  assert(munichAlias && munichAlias.name === 'Munich', `München should map to Munich, got ${munichAlias?.name}`);

  const viennaAlias = engine.getCityAliasMatch('Wien');
  assert(viennaAlias && viennaAlias.name === 'Vienna', `Wien should map to Vienna, got ${viennaAlias?.name}`);

  const beijingAlias = engine.getCityAliasMatch('Peking');
  assert(beijingAlias && beijingAlias.name === 'Beijing', `Peking should map to Beijing, got ${beijingAlias?.name}`);

  const pragueAlias = engine.getCityAliasMatch('Praha');
  assert(pragueAlias && pragueAlias.name === 'Prague', `Praha should map to Prague, got ${pragueAlias?.name}`);

  const florenceAlias = engine.getCityAliasMatch('Firenze');
  assert(florenceAlias && florenceAlias.name === 'Florence', `Firenze should map to Florence, got ${florenceAlias?.name}`);

  const romeAlias = engine.getCityAliasMatch('Roma');
  assert(romeAlias && romeAlias.name === 'Rome', `Roma should map to Rome, got ${romeAlias?.name}`);

  const saigonAlias = engine.getCityAliasMatch('Saigon');
  assert(saigonAlias && saigonAlias.name === 'Ho Chi Minh City', `Saigon should map to Ho Chi Minh City, got ${saigonAlias?.name}`);

  // 4. Fuzzy Candidate Matching (Typo correction)
  const osakaFuzzy = engine.findFuzzyCityCandidate('Osacka');
  assert(osakaFuzzy && osakaFuzzy.candidate.name === 'Osaka', `Osacka should resolve to Osaka, got ${osakaFuzzy?.candidate?.name}`);

  const viennaFuzzy = engine.findFuzzyCityCandidate('Viena');
  assert(viennaFuzzy && viennaFuzzy.candidate.name === 'Vienna', `Viena should resolve to Vienna, got ${viennaFuzzy?.candidate?.name}`);

  const zurichFuzzy = engine.findFuzzyCityCandidate('Zurichh');
  assert(zurichFuzzy && zurichFuzzy.candidate.name === 'Zurich', `Zurichh should resolve to Zurich, got ${zurichFuzzy?.candidate?.name}`);

  // 5. Database Match Integration
  const exactMatch = engine.getCityLocationDatabaseMatch({ name: 'Tokyo' });
  assert(exactMatch && exactMatch.name === 'Tokyo' && exactMatch.countryCode === 'JP', 'Exact match for Tokyo');

  const aliasDbMatch = engine.getCityLocationDatabaseMatch({ name: 'München' });
  assert(aliasDbMatch && aliasDbMatch.name === 'Munich' && aliasDbMatch.countryCode === 'DE', `Alias db match for München should be Munich, DE; got ${aliasDbMatch?.name}, ${aliasDbMatch?.countryCode}`);

  const typoDbMatch = engine.getCityLocationDatabaseMatch({ name: 'Osacka' });
  assert(typoDbMatch && typoDbMatch.name === 'Osaka' && typoDbMatch.lat !== undefined, `Typo db match for Osacka should resolve to Osaka coordinates`);

  const countryFilteredMatch = engine.getCityLocationDatabaseMatch({ name: 'Viena', countryCode: 'AT' });
  assert(countryFilteredMatch && countryFilteredMatch.name === 'Vienna' && countryFilteredMatch.countryCode === 'AT', 'Country filtered fuzzy match for Viena, AT');

  // 6. Booking Intake Integration
  const intakeTypo = engine.findCityByBookingName('Osacka');
  assert(intakeTypo && intakeTypo.name === 'Osaka', `Booking intake should resolve typo Osacka to Osaka, got ${intakeTypo?.name}`);

  const intakeAlias = engine.findCityByBookingName('München');
  assert(intakeAlias && intakeAlias.name === 'Munich', `Booking intake should resolve alias München to Munich, got ${intakeAlias?.name}`);

  // 7. Apply Suggested Correction
  engine.citiesData.push({
    id: 'city-osacka',
    name: 'Osacka',
    country: '',
    countryCode: '',
    lat: '',
    lng: ''
  });
  engine.applySuggestedCityCorrection('city-osacka', 'Osaka');
  const corrected = engine.citiesData.find(c => c.id === 'city-osacka');
  assert(corrected && corrected.name === 'Osaka', `City name should be corrected to Osaka, got ${corrected?.name}`);
  assert(corrected.countryCode === 'JP', `City countryCode should be JP, got ${corrected?.countryCode}`);
  assert(Number.isFinite(corrected.lat), `City lat should be finite number, got ${corrected?.lat}`);

  // Allow async debounced save to complete safely
  await new Promise(r => setTimeout(r, 100));

  console.log('✅ ALL CITY FUZZY MATCHING & DISAMBIGUATION TESTS PASSED CLEANLY!');
}

if (require.main === module) {
  run().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { run };
