const fs = require('fs');
const path = require('path');

async function runBenchmark() {
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

  const combinedCode = `
    const document = window.document;
    ${utilsCode}
    ${dataCode}
    return {
      addOrUpdateCity,
      extractCitiesFromItinerary,
      refetchCityLocationAndFlag,
      ALL_CITIES,
      citiesData,
      appData
    };
  `;

  const evalFn = new Function('window', 'localStorage', combinedCode);
  const engine = evalFn(windowMock, windowMock.localStorage);

  const cityNames = [
    'Tokyo', 'Vienna', 'Sydney', 'Munich', 'New York', 'Paris', 'Bangkok', 'Rome',
    'Barcelona', 'Prague', 'London', 'San Francisco', 'Cologne', 'Nuremberg', 'Bratislava',
    'Skopje', 'Tirana', 'Podgorica', 'Sarajevo', 'Split', 'Dubrovnik', 'Zagreb', 'Ljubljana',
    'Bucharest', 'Sofia', 'Tallinn', 'Riga', 'Vilnius', 'Krakow', 'Warsaw', 'Belgrade',
    'UnknownCity1', 'UnknownCity2'
  ];

  const ITERATIONS = 100000;

  console.log(`Running ALL_CITIES lookups benchmark (${ITERATIONS} iterations)...`);

  // 1. Benchmark addOrUpdateCity (isolating ALL_CITIES lookup)
  const startAdd = process.hrtime.bigint();
  for (let i = 0; i < ITERATIONS; i++) {
    engine.citiesData.length = 0; // Prevent citiesData growth
    const cityName = cityNames[i % cityNames.length];
    engine.addOrUpdateCity(cityName, 'Japan', '2026-01-01', '2026-01-05');
  }
  const endAdd = process.hrtime.bigint();
  const addMs = Number(endAdd - startAdd) / 1e6;

  console.log(`addOrUpdateCity (${ITERATIONS} calls): ${addMs.toFixed(2)} ms`);
}

runBenchmark().catch(console.error);
