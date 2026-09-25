const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');
const { extractBetween } = require('./lib/test-helpers');

const dataJs = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8');
const localSplitBlock = extractBetween(
  dataJs,
  'const _ACTIVITY_TITLE_SEP_REGEX = /\\s+(?:—|–|-|\\||@)\\s+/;',
  'function normalizeActivityMatchText(value)'
);

const activityModalJs = fs.readFileSync(path.join(__dirname, '../js/activity-modal.js'), 'utf8');
const splitBlockModal = extractBetween(
  activityModalJs,
  'const _ACTIVITY_TITLE_SEP_REGEX = /\\s+(?:—|–|-|\\||@)\\s+/;',
  'function openActivityModalUnified'
);

const evalCode = `
  ${localSplitBlock}
  ${splitBlockModal.replace('const _ACTIVITY_TITLE_SEP_REGEX =', '// const _ACTIVITY_TITLE_SEP_REGEX =')}
`;

const fnContext = {};
const fn = new Function('exports', evalCode + '; exports._localSplitActivityTitle = _localSplitActivityTitle; exports._splitActivityTitle = _splitActivityTitle;');
fn(fnContext);

const testTitles = [
  'Eiffel Tower - Paris',
  'Louvre Museum — Paris',
  'Some Place @ Location',
  'Bar | Pub',
  'Day trip to Versailles – Versailles',
  'Just an activity with no separator',
  'Another activity without location info',
  '',
  null,
  undefined,
  'Hyphenated-word test',
  'Multi - word - separator',
  'First — second - third'
];

function runBenchmark(iterations = 100000) {
  // Warmup
  for (let i = 0; i < 1000; i++) {
    testTitles.forEach(t => fnContext._localSplitActivityTitle(t));
    testTitles.forEach(t => fnContext._splitActivityTitle(t));
  }

  const startLocal = performance.now();
  for (let i = 0; i < iterations; i++) {
    testTitles.forEach(t => fnContext._localSplitActivityTitle(t));
  }
  const endLocal = performance.now();
  const durationLocal = endLocal - startLocal;

  const startModal = performance.now();
  for (let i = 0; i < iterations; i++) {
    testTitles.forEach(t => fnContext._splitActivityTitle(t));
  }
  const endModal = performance.now();
  const durationModal = endModal - startModal;

  console.log(`[Benchmark] _localSplitActivityTitle x ${iterations * testTitles.length} calls: ${durationLocal.toFixed(2)} ms`);
  console.log(`[Benchmark] _splitActivityTitle x ${iterations * testTitles.length} calls: ${durationModal.toFixed(2)} ms`);

  return { durationLocal, durationModal };
}

if (require.main === module) {
  runBenchmark();
}

module.exports = { runBenchmark, fnContext };
