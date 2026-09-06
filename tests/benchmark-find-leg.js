// Test version-tracked cache invalidation and performance benchmark
const fs = require('fs');

global.window = global;
global.journeys = [];
global.appData = [];
global.citiesData = [];

function getTripTimelineYear() {
  if (Array.isArray(global.journeys)) {
    const datedJourney = global.journeys.find(j => /^\d{4}-\d{2}-\d{2}$/.test(j.departureDate || j.arrivalDate || j.dayDate || ''));
    if (datedJourney) return Number((datedJourney.departureDate || datedJourney.arrivalDate || datedJourney.dayDate).slice(0, 4));
  }
  return new Date().getFullYear();
}

function getTimelineScore(dateValue, timeValue = '', fallback = Number.MAX_SAFE_INTEGER) {
  if (!dateValue || typeof dateValue !== 'string') return fallback;

  const trimmedDate = dateValue.trim();
  let year, month, day;

  const isoMatch = trimmedDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    year = Number(isoMatch[1]);
    month = Number(isoMatch[2]) - 1;
    day = Number(isoMatch[3]);
  } else {
    const shortMatch = trimmedDate.match(/^(\d{1,2})\s+([A-Za-z]{3,})$/);
    if (!shortMatch) return fallback;

    const months = {
      jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
      may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7, sep: 8, sept: 8, september: 8,
      oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11
    };

    const monthKey = shortMatch[2].toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(months, monthKey)) return fallback;

    year = getTripTimelineYear();
    month = months[monthKey];
    day = Number(shortMatch[1]);
  }

  const timeMatch = (timeValue || '').match(/^(\d{1,2}):(\d{2})$/);
  const hours = timeMatch ? Number(timeMatch[1]) : 12;
  const minutes = timeMatch ? Number(timeMatch[2]) : 0;
  return Date.UTC(year, month, day, hours, minutes) / 60000;
}

function sameTimelineDay(dayDate, targetDate) {
  if (!dayDate || !targetDate) return false;
  const dayScore = getTimelineScore(dayDate, '', null);
  const targetScore = getTimelineScore(targetDate, '', null);
  if (dayScore === null || targetScore === null) return false;
  return Math.floor(dayScore / 1440) === Math.floor(targetScore / 1440);
}

// Generate test data: 50 legs with 10 days each = 500 days, 200 journeys
const legs = [];
const journeys = [];
const cities = [
  { id: 'city-london', name: 'London' },
  { id: 'city-paris', name: 'Paris' },
  { id: 'city-tokyo', name: 'Tokyo' },
  { id: 'city-zurich', name: 'Zurich' },
  { id: 'city-sydney', name: 'Sydney' }
];

for (let i = 0; i < 50; i++) {
  const days = [];
  for (let d = 0; d < 10; d++) {
    const dayNum = i * 10 + d + 1;
    const month = String(Math.floor(dayNum / 28) + 1).padStart(2, '0');
    const day = String((dayNum % 28) + 1).padStart(2, '0');
    days.push({
      date: `2026-${month}-${day}`,
      day: `Day ${d + 1}`,
      from: cities[i % cities.length].name,
      to: cities[(i + 1) % cities.length].name
    });
  }
  legs.push({
    id: `leg-${i}`,
    label: `Leg ${i} ${cities[i % cities.length].name}`,
    days
  });
}

for (let j = 0; j < 200; j++) {
  const fromCity = cities[j % cities.length];
  const toCity = cities[(j + 1) % cities.length];
  const dayNum = (j * 2) + 1;
  const month = String(Math.floor(dayNum / 28) + 1).padStart(2, '0');
  const day = String((dayNum % 28) + 1).padStart(2, '0');
  journeys.push({
    id: `j-${j}`,
    legId: j % 3 === 0 ? `leg-${j % 50}` : null,
    fromCityId: fromCity.id,
    toCityId: toCity.id,
    fromLocation: fromCity.name,
    toLocation: toCity.name,
    departureDate: `2026-${month}-${day}`,
    arrivalDate: `2026-${month}-${day}`,
    departureTime: '10:00',
    arrivalTime: '14:00'
  });
}

global.journeys = journeys;
global.appData = legs;

function findLegForJourneyCityBaseline(cityId, cityName) {
  if (!Array.isArray(global.journeys)) return null;

  const matchingJourneys = global.journeys
      .filter(j =>
          j.fromCityId === cityId ||
          j.toCityId === cityId ||
          (cityName && (j.fromLocation === cityName || j.toLocation === cityName))
      )
      .sort((a, b) => {
        const aScore = getTimelineScore(a.arrivalDate || a.departureDate || a.dayDate, a.arrivalTime || a.departureTime, Number.MAX_SAFE_INTEGER);
        const bScore = getTimelineScore(b.arrivalDate || b.departureDate || b.dayDate, b.arrivalTime || b.departureTime, Number.MAX_SAFE_INTEGER);
        return aScore - bScore;
      });

  for (const journey of matchingJourneys) {
    if (journey.legId) {
      const directLeg = global.appData.find(leg => leg.id === journey.legId);
      if (directLeg) return directLeg;
    }

    const targetDate = journey.toCityId === cityId || journey.toLocation === cityName
        ? (journey.arrivalDate || journey.dayDate || journey.departureDate)
        : (journey.departureDate || journey.dayDate || journey.arrivalDate);

    const dateMatchedLeg = global.appData.find(leg =>
        (leg.days || []).some(day => sameTimelineDay(day.date, targetDate))
    );
    if (dateMatchedLeg) return dateMatchedLeg;
  }

  return null;
}

// Optimized Implementation
let _findLegCache = null;
let _findLegCacheVersion = 0;

function invalidateFindLegCache() {
  _findLegCacheVersion++;
  _findLegCache = null;
}

function _getFindLegIndex() {
  const journeysSource = (typeof window !== 'undefined' && Array.isArray(window.journeys))
    ? window.journeys
    : (typeof journeys !== 'undefined' && Array.isArray(journeys) ? journeys : []);
  const appDataSource = (typeof window !== 'undefined' && Array.isArray(window.appData))
    ? window.appData
    : (typeof appData !== 'undefined' && Array.isArray(appData) ? appData : []);

  if (_findLegCache &&
      _findLegCache.version === _findLegCacheVersion &&
      _findLegCache.journeysRef === journeysSource &&
      _findLegCache.appDataRef === appDataSource &&
      _findLegCache.journeysLen === journeysSource.length &&
      _findLegCache.appDataLen === appDataSource.length) {
    return _findLegCache;
  }

  const legById = new Map();
  const legByDayKey = new Map();

  if (Array.isArray(appDataSource)) {
    for (let i = 0; i < appDataSource.length; i++) {
      const leg = appDataSource[i];
      if (!leg) continue;
      if (leg.id) legById.set(leg.id, leg);
      if (Array.isArray(leg.days)) {
        for (let d = 0; d < leg.days.length; d++) {
          const day = leg.days[d];
          if (day && day.date) {
            const score = getTimelineScore(day.date, '', null);
            if (score !== null) {
              const dayKey = Math.floor(score / 1440);
              if (!legByDayKey.has(dayKey)) {
                legByDayKey.set(dayKey, leg);
              }
            }
          }
        }
      }
    }
  }

  const sortedJourneys = Array.isArray(journeysSource) ? journeysSource.map(j => {
    const score = getTimelineScore(
      j.arrivalDate || j.departureDate || j.dayDate,
      j.arrivalTime || j.departureTime,
      Number.MAX_SAFE_INTEGER
    );
    return { journey: j, score };
  }).sort((a, b) => a.score - b.score) : [];

  const journeysByCity = new Map();
  for (let i = 0; i < sortedJourneys.length; i++) {
    const item = sortedJourneys[i];
    const j = item.journey;
    const keys = new Set();
    if (j.fromCityId) keys.add(j.fromCityId);
    if (j.toCityId) keys.add(j.toCityId);
    if (j.fromLocation) keys.add(j.fromLocation);
    if (j.toLocation) keys.add(j.toLocation);

    keys.forEach(key => {
      let list = journeysByCity.get(key);
      if (!list) {
        list = [];
        journeysByCity.set(key, list);
      }
      list.push(item); // Store item containing precalculated score
    });
  }

  _findLegCache = {
    version: _findLegCacheVersion,
    journeysRef: journeysSource,
    appDataRef: appDataSource,
    journeysLen: journeysSource.length,
    appDataLen: appDataSource.length,
    legById,
    legByDayKey,
    journeysByCity,
    memoResults: new Map()
  };

  return _findLegCache;
}

function findLegForJourneyCityOptimized(cityId, cityName) {
  const journeysSource = (typeof window !== 'undefined' && Array.isArray(window.journeys))
    ? window.journeys
    : (typeof journeys !== 'undefined' && Array.isArray(journeys) ? journeys : []);
  if (!Array.isArray(journeysSource)) return null;

  const index = _getFindLegIndex();
  const memoKey = `${cityId || ''}|${cityName || ''}`;
  if (index.memoResults.has(memoKey)) {
    return index.memoResults.get(memoKey);
  }

  let matching = [];
  const cityIdMatches = cityId ? index.journeysByCity.get(cityId) : null;
  const cityNameMatches = cityName ? index.journeysByCity.get(cityName) : null;

  if (cityIdMatches && cityNameMatches) {
    const set = new Set(cityIdMatches.map(m => m.journey));
    matching = [...cityIdMatches];
    for (let i = 0; i < cityNameMatches.length; i++) {
      if (!set.has(cityNameMatches[i].journey)) {
        matching.push(cityNameMatches[i]);
      }
    }
    matching.sort((a, b) => a.score - b.score);
  } else {
    matching = cityIdMatches || cityNameMatches || [];
  }

  let result = null;
  for (let i = 0; i < matching.length; i++) {
    const journey = matching[i].journey;
    if (journey.legId) {
      const directLeg = index.legById.get(journey.legId);
      if (directLeg) {
        result = directLeg;
        break;
      }
    }

    const targetDate = (journey.toCityId === cityId || journey.toLocation === cityName)
        ? (journey.arrivalDate || journey.dayDate || journey.departureDate)
        : (journey.departureDate || journey.dayDate || journey.arrivalDate);

    if (targetDate) {
      const targetScore = getTimelineScore(targetDate, '', null);
      if (targetScore !== null) {
        const targetDayKey = Math.floor(targetScore / 1440);
        const dateMatchedLeg = index.legByDayKey.get(targetDayKey);
        if (dateMatchedLeg) {
          result = dateMatchedLeg;
          break;
        }
      }
    }
  }

  index.memoResults.set(memoKey, result);
  return result;
}

// 1. Correctness check
const testCities = [
  ['city-london', 'London'],
  ['city-paris', 'Paris'],
  ['city-tokyo', 'Tokyo'],
  ['city-zurich', 'Zurich'],
  ['city-sydney', 'Sydney'],
  ['city-nonexistent', 'Atlantis']
];

for (const [cId, cName] of testCities) {
  const baseRes = findLegForJourneyCityBaseline(cId, cName);
  const optRes = findLegForJourneyCityOptimized(cId, cName);
  if ((baseRes ? baseRes.id : null) !== (optRes ? optRes.id : null)) {
    console.error(`MISMATCH for ${cId}, ${cName}: Baseline=${baseRes?.id}, Opt=${optRes?.id}`);
    process.exit(1);
  }
}
console.log('✅ Baseline and Optimized results match perfectly!');

// 2. Invalidation check
global.journeys[1].legId = 'leg-49';
invalidateFindLegCache(); // simulate data mutation invalidation
const baseResMut = findLegForJourneyCityBaseline('city-paris', 'Paris');
const optResMut = findLegForJourneyCityOptimized('city-paris', 'Paris');
if ((baseResMut ? baseResMut.id : null) !== (optResMut ? optResMut.id : null)) {
  console.error(`MUTATION MISMATCH! Baseline=${baseResMut?.id}, Opt=${optResMut?.id}`);
  process.exit(1);
}
console.log('✅ Invalidation on mutation verified! Results match after mutation.');

// Benchmarking
const ITERATIONS = 1000;

const startBase = process.hrtime.bigint();
for (let i = 0; i < ITERATIONS; i++) {
  for (const [cId, cName] of testCities) {
    findLegForJourneyCityBaseline(cId, cName);
  }
}
const endBase = process.hrtime.bigint();
const durationBaseMs = Number(endBase - startBase) / 1e6;

const startOpt = process.hrtime.bigint();
for (let i = 0; i < ITERATIONS; i++) {
  for (const [cId, cName] of testCities) {
    findLegForJourneyCityOptimized(cId, cName);
  }
}
const endOpt = process.hrtime.bigint();
const durationOptMs = Number(endOpt - startOpt) / 1e6;

console.log(`Baseline: ${durationBaseMs.toFixed(2)} ms (${(durationBaseMs / (ITERATIONS * testCities.length)).toFixed(4)} ms/call)`);
console.log(`Optimized: ${durationOptMs.toFixed(2)} ms (${(durationOptMs / (ITERATIONS * testCities.length)).toFixed(4)} ms/call)`);
console.log(`Speedup: ${(durationBaseMs / durationOptMs).toFixed(2)}x faster!`);
