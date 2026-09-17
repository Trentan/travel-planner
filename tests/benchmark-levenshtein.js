const fs = require('fs');
const path = require('path');

const utilsCode = fs.readFileSync(path.join(__dirname, '../js/utils.js'), 'utf8');
const dataCode = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');

const windowMock = {
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  indexedDB: null,
  document: {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ setAttribute: () => {}, appendChild: () => {}, style: {}, addEventListener: () => {}, remove: () => {} }),
    body: { addEventListener: () => {}, appendChild: () => {}, insertBefore: () => {}, firstChild: null },
    addEventListener: () => {}
  },
  addEventListener: () => {},
  journeys: [],
  stays: []
};

const combinedCode = `
  const document = window.document;
  ${utilsCode}
  ${dataCode}
  return calculateLevenshteinDistance;
`;

const evalFn = new Function('window', 'localStorage', combinedCode);
const calculateLevenshteinDistanceDataJs = evalFn(windowMock, windowMock.localStorage);

function calculateLevenshteinDistanceLegacy(a, b) {
  const str1 = String(a || '');
  const str2 = String(b || '');
  if (str1 === str2) return 0;
  if (!str1) return str2.length;
  if (!str2) return str1.length;

  const aLen = str1.length;
  const bLen = str2.length;
  const dp = [];

  for (let i = 0; i <= bLen; i++) {
    dp[i] = [i];
  }
  for (let j = 0; j <= aLen; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= bLen; i++) {
    for (let j = 1; j <= aLen; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j - 1] + 1, // substitution
          dp[i][j - 1] + 1,     // insertion
          dp[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return dp[bLen][aLen];
}

const testPairs = [
  ['Osaka', 'Osaka'],
  ['Osacka', 'Osaka'],
  ['Viena', 'Vienna'],
  ['Zurichh', 'Zurich'],
  ['München', 'Munchen'],
  ['San Francisco', 'San Fransisco'],
  ['Bratislava', 'Brataslava'],
  ['Krakow', 'Kraków'],
  ['Ho Chi Minh City', 'Ho Chi Minh'],
  ['Washington DC', 'Washington D.C.'],
  ['', ''],
  ['a', ''],
  ['', 'a'],
  ['a', 'a'],
  ['a', 'b'],
  ['abc', 'yabd'],
  ['kitten', 'sitting'],
  ['flaw', 'lawn'],
  [null, undefined],
  ['12345', '123456789'],
  ['gumbo', 'gambol']
];

// Verify correctness
for (const [s1, s2] of testPairs) {
  const resLegacy = calculateLevenshteinDistanceLegacy(s1, s2);
  const resDataJs = calculateLevenshteinDistanceDataJs(s1, s2);
  if (resLegacy !== resDataJs) {
    console.error(`Mismatch for pair ("${s1}", "${s2}"): legacy=${resLegacy}, dataJs=${resDataJs}`);
    process.exit(1);
  }
}

console.log('✅ Correctness check passed across all test pairs!');

// Benchmark
const ITERATIONS = 200000;

// Warmup
for (let i = 0; i < 10000; i++) {
  const [s1, s2] = testPairs[i % testPairs.length];
  calculateLevenshteinDistanceLegacy(s1, s2);
  calculateLevenshteinDistanceDataJs(s1, s2);
}

const startLegacy = process.hrtime.bigint();
for (let i = 0; i < ITERATIONS; i++) {
  const [s1, s2] = testPairs[i % testPairs.length];
  calculateLevenshteinDistanceLegacy(s1, s2);
}
const endLegacy = process.hrtime.bigint();
const legacyMs = Number(endLegacy - startLegacy) / 1e6;

const startDataJs = process.hrtime.bigint();
for (let i = 0; i < ITERATIONS; i++) {
  const [s1, s2] = testPairs[i % testPairs.length];
  calculateLevenshteinDistanceDataJs(s1, s2);
}
const endDataJs = process.hrtime.bigint();
const dataJsMs = Number(endDataJs - startDataJs) / 1e6;

console.log(`Unoptimized (Legacy) baseline (${ITERATIONS} calls): ${legacyMs.toFixed(2)} ms`);
console.log(`Optimized (data.js)          (${ITERATIONS} calls): ${dataJsMs.toFixed(2)} ms`);
console.log(`Speedup: ${(legacyMs / dataJsMs).toFixed(2)}x (${(((legacyMs - dataJsMs) / legacyMs) * 100).toFixed(1)}% reduction in execution time)`);
