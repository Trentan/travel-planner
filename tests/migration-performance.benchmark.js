const fs = require('fs');
const path = require('path');
const { assert } = require('./lib/test-helpers');

async function run() {
  console.log('Running migrateCitiesToISOFormat performance benchmark...');

  const utilsCode = fs.readFileSync(path.join(__dirname, '../js/utils.js'), 'utf8');
  const dataCode = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');

  const documentMock = {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ setAttribute: () => {}, appendChild: () => {}, style: {}, addEventListener: () => {}, remove: () => {} }),
    body: { addEventListener: () => {}, appendChild: () => {}, insertBefore: () => {}, firstChild: null },
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

  const evalFn = new Function('window', 'localStorage', `
    const document = window.document;
    ${utilsCode}
    ${dataCode}
    return { ALL_CITIES, COUNTRY_DATA, getRandomCityColor, CITY_TO_CODE, migrateCitiesToISOFormat };
  `);
  const engine = evalFn(windowMock, windowMock.localStorage);

  // Linear lookup implementation for comparison baseline
  function migrateLinear(citiesData) {
    const citiesNeedingMigration = citiesData.filter(city => !city.countryCode || 'code' in city);
    if (citiesNeedingMigration.length === 0) return;

    const usedColorsSet = new Set(citiesData.map(c => c.colour).filter(Boolean));

    citiesNeedingMigration.forEach(city => {
      const normalizedName = city.name?.trim();
      if (!normalizedName) return;

      if ('code' in city) delete city.code;

      const dbMatch = engine.ALL_CITIES.find(c =>
        c.name.toLowerCase() === normalizedName.toLowerCase()
      );

      if (dbMatch) {
        city.countryCode = dbMatch.countryCode;
        const countryMatch = dbMatch.countryCode ? engine.COUNTRY_DATA.find(c => c.code === dbMatch.countryCode.toUpperCase()) : null;
        if (countryMatch) {
          city.country = countryMatch.name;
        }
      } else {
        const cityNameLower = normalizedName.toLowerCase().replace(/\s+/g, '');
        const inferredCode = engine.CITY_TO_CODE[cityNameLower];

        if (inferredCode) {
          const countryMatch = engine.COUNTRY_DATA.find(c => c.code === inferredCode.toUpperCase());
          if (countryMatch) {
            city.countryCode = countryMatch.code;
            city.country = countryMatch.name;
          }
        }

        if (!city.countryCode && city.country) {
          const countryMatch = engine.COUNTRY_DATA.find(c => c.name.toLowerCase() === city.country.toLowerCase());
          if (countryMatch) {
            city.countryCode = countryMatch.code;
          }
        }
      }

      if (!city.colour) {
        city.colour = engine.getRandomCityColor(usedColorsSet);
      }
    });
  }

  // Create 1000 test cities needing migration
  const testCitiesLinear = [];
  const testCitiesMap = [];
  for (let i = 0; i < 1000; i++) {
    const dbSample = engine.ALL_CITIES[i % engine.ALL_CITIES.length];
    const cityObj = {
      id: 'city-' + i,
      name: dbSample.name,
      code: dbSample.code,
      country: ''
    };
    testCitiesLinear.push({ ...cityObj });
    testCitiesMap.push({ ...cityObj });
  }

  // Measure Linear .find()
  const t0 = performance.now();
  migrateLinear(testCitiesLinear);
  const linearDuration = performance.now() - t0;

  // Measure Optimized Map lookup (using engine.migrateCitiesToISOFormat)
  // engine.migrateCitiesToISOFormat operates on window.citiesData (or engine's citiesData variable).
  // We can pass testCitiesMap into citiesData array in the engine context or evaluate it directly.
  const evalFnOptimized = new Function('window', 'localStorage', 'citiesInput', `
    const document = window.document;
    ${utilsCode}
    ${dataCode}
    citiesData = citiesInput;
    const start = performance.now();
    migrateCitiesToISOFormat();
    const duration = performance.now() - start;
    return { duration, citiesData };
  `);

  const optimizedResult = evalFnOptimized(windowMock, windowMock.localStorage, testCitiesMap);
  const mapDuration = optimizedResult.duration;

  console.log(`\n📊 Benchmark Results (1,000 cities migration):`);
  console.log(`  • Baseline Linear .find(): ${linearDuration.toFixed(3)} ms`);
  console.log(`  • Optimized Map Lookup:   ${mapDuration.toFixed(3)} ms`);
  console.log(`  • Performance Improvement: ${(linearDuration / mapDuration).toFixed(2)}x faster (${(linearDuration - mapDuration).toFixed(3)} ms saved)`);

  // Verify result parity
  assert(testCitiesLinear.length === optimizedResult.citiesData.length, 'City counts match');
  for (let i = 0; i < 50; i++) {
    assert(testCitiesLinear[i].countryCode === optimizedResult.citiesData[i].countryCode, `CountryCode parity at index ${i}`);
    assert(testCitiesLinear[i].country === optimizedResult.citiesData[i].country, `Country parity at index ${i}`);
  }

  console.log('✅ Paragon & parity verified across migration benchmark tests!\n');
}

if (require.main === module) {
  run().catch(err => {
    console.error(err);
    process.exitCode = 1;
  });
}

module.exports = { run };
