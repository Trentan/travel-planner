const { assert } = require('./lib/test-helpers');

function deepClone(obj) {
  if (obj === null || obj === undefined) return obj;
  const type = typeof obj;
  if (type === 'number') {
    return Number.isFinite(obj) ? obj : null;
  }
  if (type === 'boolean' || type === 'string') {
    return obj;
  }
  if (type === 'function' || type === 'symbol') {
    return undefined;
  }
  if (obj instanceof Date) {
    return obj.toJSON();
  }
  if (Array.isArray(obj)) {
    const len = obj.length;
    const copy = new Array(len);
    for (let i = 0; i < len; i++) {
      const item = obj[i];
      const itemType = typeof item;
      if (itemType === 'function' || itemType === 'symbol' || item === undefined) {
        copy[i] = null;
      } else if (itemType === 'number') {
        copy[i] = Number.isFinite(item) ? item : null;
      } else if (item instanceof Date) {
        copy[i] = item.toJSON();
      } else if (item !== null && typeof item === 'object') {
        copy[i] = deepClone(item);
      } else {
        copy[i] = item;
      }
    }
    return copy;
  }
  if (typeof obj === 'object') {
    if (obj.constructor && obj.constructor.name !== 'Object') {
      return JSON.parse(JSON.stringify(obj));
    }
    const copy = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        const valType = typeof val;
        if (val === undefined || valType === 'function' || valType === 'symbol') {
          continue;
        }
        if (valType === 'number') {
          copy[key] = Number.isFinite(val) ? val : null;
        } else if (val instanceof Date) {
          copy[key] = val.toJSON();
        } else if (val !== null && typeof val === 'object') {
          copy[key] = deepClone(val);
        } else {
          copy[key] = val;
        }
      }
    }
    return copy;
  }
  return JSON.parse(JSON.stringify(obj));
}

function verifyJsonEquivalence() {
  const edgeCaseObj = {
    str: 'hello',
    num: 123,
    nan: NaN,
    inf: Infinity,
    date: new Date('2026-06-01T12:00:00.000Z'),
    undef: undefined,
    func: () => {},
    arr: [1, undefined, NaN, new Date('2026-06-01T12:00:00.000Z'), () => {}],
    nested: { a: 1, b: undefined }
  };

  const expectedJson = JSON.stringify(JSON.parse(JSON.stringify(edgeCaseObj)));
  const actualJson = JSON.stringify(deepClone(edgeCaseObj));

  assert(
    expectedJson === actualJson,
    `deepClone output must be strictly equivalent to JSON.parse(JSON.stringify).\nExpected: ${expectedJson}\nActual:   ${actualJson}`
  );
  console.log('✅ JSON serialization equivalence verified!');
}

function runBenchmark() {
  verifyJsonEquivalence();

  const sampleSnapshot = {
    meta: { title: 'European Adventure', subtitle: 'Summer 2026 Tour' },
    itinerary: Array.from({ length: 15 }, (_, i) => ({
      id: 'leg-' + i,
      label: 'Destination ' + i,
      colour: '#2C3E50',
      days: Array.from({ length: 4 }, (_, d) => ({
        id: `day-${i}-${d}`,
        date: `2026-07-${d + 1}`,
        from: `City ${i}`,
        to: `City ${i + 1}`,
        activityItems: [
          { text: 'City Walk Tour', time: '2 hrs', cost: '15.50' },
          { text: 'Local Museum', time: '1.5 hrs', cost: '12.00' }
        ],
        transportItems: [
          { text: 'Train Express 101', departureTime: '09:00', arrivalTime: '11:30', cost: '45.00' }
        ],
        accomItems: [
          { text: 'Boutique Hotel', cost: '120.00', status: 'confirmed' }
        ]
      })),
      legTips: [{ text: 'Get subway pass at station', cityId: 'city-1' }],
      cityFood: [{ text: 'Try local pastry', done: false, cityId: 'city-1' }]
    })),
    packing: Array.from({ length: 3 }, (_, a) => ({
      areaName: `Area ${a}`,
      categories: [
        { title: 'Category 1', items: [{ text: 'Item 1', done: true }] }
      ]
    })),
    leaveHome: Array.from({ length: 10 }, (_, i) => ({ text: `Home Check ${i}`, done: i % 2 === 0 })),
    hotelCheckout: Array.from({ length: 8 }, (_, i) => ({ text: `Hotel Check ${i}`, done: false })),
    journeys: Array.from({ length: 12 }, (_, i) => ({
      id: `j-${i}`,
      journeyName: `Transport ${i}`,
      fromLocation: `City ${i}`,
      toLocation: `City ${i + 1}`,
      cost: '50.00'
    })),
    stays: Array.from({ length: 10 }, (_, i) => ({
      id: `s-${i}`,
      propertyName: `Grand Hotel ${i}`,
      totalCost: '300.00'
    })),
    cities: Array.from({ length: 10 }, (_, i) => ({
      id: `city-${i}`,
      name: `City ${i}`,
      countryCode: 'FR'
    })),
    userCities: [],
    userCountries: []
  };

  const iterations = 10000;

  const startJson = performance.now();
  for (let i = 0; i < iterations; i++) {
    const titleData = JSON.parse(JSON.stringify(sampleSnapshot.meta));
    const appData = JSON.parse(JSON.stringify(sampleSnapshot.itinerary));
    const leaveHomeData = JSON.parse(JSON.stringify(sampleSnapshot.leaveHome));
    const hotelCheckoutData = JSON.parse(JSON.stringify(sampleSnapshot.hotelCheckout));
    const journeys = JSON.parse(JSON.stringify(sampleSnapshot.journeys));
    const stays = JSON.parse(JSON.stringify(sampleSnapshot.stays));
    const citiesData = JSON.parse(JSON.stringify(sampleSnapshot.cities));
    const userCities = JSON.parse(JSON.stringify(sampleSnapshot.userCities));
    const userCountries = JSON.parse(JSON.stringify(sampleSnapshot.userCountries));
  }
  const endJson = performance.now();
  const jsonTime = endJson - startJson;

  let structuredTime = 0;
  if (typeof structuredClone === 'function') {
    const startStructured = performance.now();
    for (let i = 0; i < iterations; i++) {
      const titleData = structuredClone(sampleSnapshot.meta);
      const appData = structuredClone(sampleSnapshot.itinerary);
      const leaveHomeData = structuredClone(sampleSnapshot.leaveHome);
      const hotelCheckoutData = structuredClone(sampleSnapshot.hotelCheckout);
      const journeys = structuredClone(sampleSnapshot.journeys);
      const stays = structuredClone(sampleSnapshot.stays);
      const citiesData = structuredClone(sampleSnapshot.cities);
      const userCities = structuredClone(sampleSnapshot.userCities);
      const userCountries = structuredClone(sampleSnapshot.userCountries);
    }
    const endStructured = performance.now();
    structuredTime = endStructured - startStructured;
  }

  const startDeep = performance.now();
  for (let i = 0; i < iterations; i++) {
    const titleData = deepClone(sampleSnapshot.meta);
    const appData = deepClone(sampleSnapshot.itinerary);
    const leaveHomeData = deepClone(sampleSnapshot.leaveHome);
    const hotelCheckoutData = deepClone(sampleSnapshot.hotelCheckout);
    const journeys = deepClone(sampleSnapshot.journeys);
    const stays = deepClone(sampleSnapshot.stays);
    const citiesData = deepClone(sampleSnapshot.cities);
    const userCities = deepClone(sampleSnapshot.userCities);
    const userCountries = deepClone(sampleSnapshot.userCountries);
  }
  const endDeep = performance.now();
  const deepTime = endDeep - startDeep;

  console.log('--- Deep Clone Benchmark Results ---');
  console.log(`JSON.parse(JSON.stringify): ${jsonTime.toFixed(2)} ms`);
  if (structuredTime > 0) {
    console.log(`structuredClone:            ${structuredTime.toFixed(2)} ms`);
  }
  console.log(`deepClone (JSON-safe):      ${deepTime.toFixed(2)} ms`);
  const speedupVsJson = ((jsonTime - deepTime) / jsonTime) * 100;
  console.log(`Speedup vs JSON: ${speedupVsJson.toFixed(1)}% faster`);

  return { jsonTime, structuredTime, deepTime, speedupVsJson };
}

if (require.main === module) {
  runBenchmark();
}

module.exports = { runBenchmark, deepClone, verifyJsonEquivalence };
