const fs = require('fs');
const path = require('path');
const { assert } = require('./lib/test-helpers');

function jsonSafeClone(value) {
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'number' && !Number.isFinite(value)) {
      return null;
    }
    return value;
  }

  if (typeof value.toJSON === 'function') {
    try {
      return jsonSafeClone(value.toJSON());
    } catch (e) {
      // Fallback
    }
  }

  if (Array.isArray(value)) {
    const len = value.length;
    const copy = new Array(len);
    for (let i = 0; i < len; i++) {
      const item = value[i];
      if (item === undefined || typeof item === 'function' || typeof item === 'symbol') {
        copy[i] = null;
      } else {
        copy[i] = jsonSafeClone(item);
      }
    }
    return copy;
  }

  const proto = Object.getPrototypeOf(value);
  if (proto !== null && proto !== Object.prototype) {
    return JSON.parse(JSON.stringify(value));
  }

  const copy = {};
  const keys = Object.keys(value);
  const keyCount = keys.length;
  for (let i = 0; i < keyCount; i++) {
    const key = keys[i];
    const val = value[key];
    if (val !== undefined && typeof val !== 'function' && typeof val !== 'symbol') {
      copy[key] = jsonSafeClone(val);
    }
  }
  return copy;
}

function deepClone(obj) {
  if (obj === null || obj === undefined) return obj;
  try {
    return jsonSafeClone(obj);
  } catch (e) {
    return JSON.parse(JSON.stringify(obj));
  }
}

function verifyJsonSemantics() {
  console.log('Verifying strict JSON serialization equivalence...');

  // 1. Edge cases
  const edgeCases = [
    { name: 'undefined properties in object', val: { a: 1, b: undefined, c: 'ok' } },
    { name: 'functions and symbols in object', val: { a: 1, fn: () => {}, sym: Symbol('foo') } },
    { name: 'undefined, function, symbol in array', val: [1, undefined, () => {}, Symbol('bar'), 'test'] },
    { name: 'Date instances', val: { departureDate: new Date('2026-07-01T10:30:00.000Z') } },
    { name: 'NaN, Infinity, -Infinity', val: { a: NaN, b: Infinity, c: -Infinity, d: 42 } },
    { name: 'nested complex structures', val: { leg: { days: [{ items: [{ cost: 10, note: undefined }] }] } } },
    { name: 'primitives', val: 'Hello World' },
    { name: 'null value', val: null }
  ];

  for (const tc of edgeCases) {
    const expected = JSON.parse(JSON.stringify(tc.val));
    const actual = deepClone(tc.val);
    assert(
      JSON.stringify(actual) === JSON.stringify(expected),
      `Failed JSON parity for edge case: ${tc.name}`
    );
  }

  // 2. Real-world backup trip validation
  const backupPath = path.join(__dirname, '../backups/2026_June_July_Europe_Thailand.json');
  if (fs.existsSync(backupPath)) {
    const realTrip = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    const expectedTrip = JSON.parse(JSON.stringify(realTrip));
    const actualTrip = deepClone(realTrip);

    assert(
      JSON.stringify(actualTrip) === JSON.stringify(expectedTrip),
      'Real trip JSON.stringify parity check failed'
    );
    console.log('✔ Real trip data JSON serialization equivalence confirmed');
  }

  console.log('✔ All JSON serialization semantic edge cases passed cleanly');
}

function runBenchmark() {
  verifyJsonSemantics();

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

  // 1. JSON.parse(JSON.stringify)
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

  // 2. structuredClone
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

  // 3. New deepClone (jsonSafeClone)
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

  console.log('\n--- Deep Clone Benchmark Results (10,000 iterations) ---');
  console.log(`1. Baseline JSON.parse(JSON.stringify): ${jsonTime.toFixed(2)} ms`);
  if (structuredTime > 0) {
    console.log(`2. Commit b9d8654 (structuredClone):    ${structuredTime.toFixed(2)} ms`);
  }
  console.log(`3. Improved deepClone (jsonSafeClone):  ${deepTime.toFixed(2)} ms`);

  const speedupVsJson = ((jsonTime - deepTime) / jsonTime) * 100;
  const speedupVsStructured = structuredTime > 0 ? ((structuredTime - deepTime) / structuredTime) * 100 : 0;

  console.log(`Speedup vs Baseline JSON:   ${speedupVsJson.toFixed(1)}% faster`);
  if (structuredTime > 0) {
    console.log(`Speedup vs structuredClone: ${speedupVsStructured.toFixed(1)}% faster`);
  }

  // Real backup trip benchmark
  const backupPath = path.join(__dirname, '../backups/2026_June_July_Europe_Thailand.json');
  if (fs.existsSync(backupPath)) {
    const realTrip = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    const tripIters = 1000;

    const t0 = performance.now();
    for (let i = 0; i < tripIters; i++) JSON.parse(JSON.stringify(realTrip));
    const t1 = performance.now();
    for (let i = 0; i < tripIters; i++) structuredClone(realTrip);
    const t2 = performance.now();
    for (let i = 0; i < tripIters; i++) deepClone(realTrip);
    const t3 = performance.now();

    console.log(`\n--- Realistic 125 KB Trip Benchmark (${tripIters} iterations) ---`);
    console.log(`1. Baseline JSON.parse(JSON.stringify): ${(t1 - t0).toFixed(2)} ms (${((t1 - t0) / tripIters).toFixed(3)} ms/op)`);
    console.log(`2. Commit b9d8654 (structuredClone):    ${(t2 - t1).toFixed(2)} ms (${((t2 - t1) / tripIters).toFixed(3)} ms/op)`);
    console.log(`3. Improved deepClone (jsonSafeClone):  ${(t3 - t2).toFixed(2)} ms (${((t3 - t2) / tripIters).toFixed(3)} ms/op)`);
    console.log(`Speedup on real trip data:              ${(((t1 - t0) - (t3 - t2)) / (t1 - t0) * 100).toFixed(1)}% faster than JSON`);
  }

  return { jsonTime, structuredTime, deepTime, speedupVsJson };
}

if (require.main === module) {
  runBenchmark();
}

module.exports = { runBenchmark, deepClone, jsonSafeClone };
