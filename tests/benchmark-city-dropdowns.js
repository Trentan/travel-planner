function runBenchmark() {
  const getCityFlag = (name) => '📍';

  const testCities = [
    'Tokyo', 'Vienna', 'Sydney', 'Munich', 'New York', 'Paris', 'Bangkok', 'Rome',
    'Barcelona', 'Prague', 'London', 'San Francisco', 'Cologne', 'Nuremberg', 'Bratislava',
    'Amsterdam', 'Berlin', 'Madrid', 'Lisbon', 'Athens', 'Dublin', 'Brussels', 'Oslo', 'Stockholm'
  ];

  const citiesData = [];
  for (let i = 0; i < 10; i++) {
    testCities.forEach((cityName, idx) => {
      citiesData.push({
        id: `city-${i}-${idx}`,
        name: `${cityName} ${i}`,
        country: 'Country'
      });
    });
  }

  const ITERATIONS = 10000;

  // Warmup
  for (let i = 0; i < 1000; i++) {
    let html1 = '';
    [...citiesData].sort((a, b) => a.name.localeCompare(b.name)).forEach(city => {
      html1 += `<option value="${city.name}">📍 ${city.name}</option>`;
    });

    const html2 = [...citiesData]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(city => `<option value="${city.name}">📍 ${city.name}</option>`)
      .join('');
  }

  console.log(`Benchmarking city options generation (${citiesData.length} cities, ${ITERATIONS} iterations)...`);

  // Baseline: forEach + string concatenation
  const startConcat = process.hrtime.bigint();
  for (let iter = 0; iter < ITERATIONS; iter++) {
    let cityOptionsHtml = '';
    if (typeof citiesData !== 'undefined') {
      [...citiesData].sort((a, b) => a.name.localeCompare(b.name)).forEach(city => {
        const flag = typeof getCityFlag === 'function' ? getCityFlag(city.name) : '📍';
        cityOptionsHtml += `<option value="${city.name}">${flag} ${city.name}</option>`;
      });
    }
  }
  const endConcat = process.hrtime.bigint();
  const concatMs = Number(endConcat - startConcat) / 1e6;

  // Optimized: map + join
  const startMapJoin = process.hrtime.bigint();
  for (let iter = 0; iter < ITERATIONS; iter++) {
    let cityOptionsHtml = '';
    if (typeof citiesData !== 'undefined') {
      cityOptionsHtml = [...citiesData]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(city => {
          const flag = typeof getCityFlag === 'function' ? getCityFlag(city.name) : '📍';
          return `<option value="${city.name}">${flag} ${city.name}</option>`;
        })
        .join('');
    }
  }
  const endMapJoin = process.hrtime.bigint();
  const mapJoinMs = Number(endMapJoin - startMapJoin) / 1e6;

  console.log(`Baseline (forEach + +=): ${concatMs.toFixed(2)} ms`);
  console.log(`Optimized (map + join):  ${mapJoinMs.toFixed(2)} ms`);
  const diff = concatMs - mapJoinMs;
  const pct = ((diff / concatMs) * 100).toFixed(2);
  console.log(`Difference: ${diff.toFixed(2)} ms (${pct}%)`);
}

runBenchmark();
