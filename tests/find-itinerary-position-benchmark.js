const { performance } = require('perf_hooks');

function originalFindItineraryPositionForDate(legs, dateValue) {
  if (!Array.isArray(legs) || !dateValue) return null;
  const targetDate = String(dateValue);
  if (!targetDate) return null;

  let match = null;
  legs.forEach((leg, legIndex) => {
    (leg.days || []).forEach((day, dayIndex) => {
      const dayDate = String(day.date || '');
      if (dayDate === targetDate) {
        match = { leg, legIndex, day, dayIndex, dayKey: `${day.day}-${day.date}` };
      }
    });
  });
  return match;
}

function optimizedFindItineraryPositionForDate(legs, dateValue) {
  if (!Array.isArray(legs) || !dateValue) return null;
  const targetDate = String(dateValue);
  if (!targetDate) return null;

  for (let legIndex = legs.length - 1; legIndex >= 0; legIndex--) {
    const leg = legs[legIndex];
    if (!leg) continue;
    const days = leg.days;
    if (!Array.isArray(days)) continue;
    for (let dayIndex = days.length - 1; dayIndex >= 0; dayIndex--) {
      const day = days[dayIndex];
      if (!day) continue;
      const dayDate = String(day.date || '');
      if (dayDate === targetDate) {
        return { leg, legIndex, day, dayIndex, dayKey: `${day.day}-${day.date}` };
      }
    }
  }
  return null;
}

function generateBenchmarkData(numLegs = 50, daysPerLeg = 10) {
  const legs = [];
  let currentDate = new Date('2026-01-01');
  for (let l = 0; l < numLegs; l++) {
    const days = [];
    for (let d = 0; d < daysPerLeg; d++) {
      const isoDate = currentDate.toISOString().slice(0, 10);
      days.push({
        day: 'Day',
        date: isoDate
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    legs.push({ id: `leg-${l}`, days });
  }
  return legs;
}

const legs = generateBenchmarkData(50, 10); // 500 total days
const dates = [
  { name: 'Last day (day 500)', date: '2027-05-15' },
  { name: 'Late day (day 400)', date: '2027-02-04' },
  { name: 'Mid day (day 250)', date: '2026-09-07' },
  { name: 'Early day (day 50)', date: '2026-02-19' },
  { name: 'First day (day 1)', date: '2026-01-01' },
];

const iterations = 100000;

for (const testCase of dates) {
  const startOrig = performance.now();
  for (let i = 0; i < iterations; i++) {
    originalFindItineraryPositionForDate(legs, testCase.date);
  }
  const timeOrig = performance.now() - startOrig;

  const startOpt = performance.now();
  for (let i = 0; i < iterations; i++) {
    optimizedFindItineraryPositionForDate(legs, testCase.date);
  }
  const timeOpt = performance.now() - startOpt;

  const speedup = ((timeOrig - timeOpt) / timeOrig) * 100;
  const ratio = (timeOrig / timeOpt).toFixed(2);
  console.log(`[${testCase.name}]`);
  console.log(`  Orig: ${timeOrig.toFixed(2)}ms | Opt: ${timeOpt.toFixed(2)}ms | Speedup: ${speedup.toFixed(2)}% (${ratio}x)`);
}
