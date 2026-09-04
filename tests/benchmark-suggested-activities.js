const fs = require('fs');
const path = require('path');

// Set up global environment
global.window = global;
global.addEventListener = () => {};
global.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => []
};
global.isEditMode = false;
global.stays = [];
global.journeys = [];
global.citiesData = [];
global.formatTripDateForDisplay = (d) => d;
global.renderStayingHeadingNote = () => '';
global.getDayTotal = () => '$0';
global.getTransportIcon = () => '📌';
global.renderMobileSurfaceCard = (opts) => opts.details || '';
global.formatCurrency = (v) => `$${v}`;
global.getMapSearchUrl = (v) => v;

// Load relevant source files
const transportCode = fs.readFileSync(path.join(__dirname, '../js/transport.js'), 'utf8');
const crudCode = fs.readFileSync(path.join(__dirname, '../js/crud.js'), 'utf8');
const itineraryCode = fs.readFileSync(path.join(__dirname, '../js/itinerary.js'), 'utf8');

eval(transportCode);
eval(crudCode);
eval(itineraryCode);

// Legacy linear findAssignedSuggestedActivity for baseline comparison
function legacyFindAssignedSuggestedActivity(legIdx, dayIdx, itemText, activityId = null) {
  const activities = appData[legIdx]?.suggestedActivities || [];
  if (activityId) {
    const found = activities.find(activity => activity && activity.id === activityId);
    if (found) return found;
  }

  const cleanItem = String(itemText || '').trim().toLowerCase();
  if (!cleanItem) return null;

  const emojiPattern = /^[\u{1F300}-\u{1F9FF}\u{2700}-\u{27BF}\u{2600}-\u{26FF}\u{1F1E6}-\u{1F1FF}]\s*/gu;
  const cleanItemNoEmoji = cleanItem.replace(emojiPattern, '').trim();

  return activities.find(activity => {
    if (!activity) return false;
    if (activity.assignedDayIdx !== dayIdx) return false;

    const cleanTitle = String(activity.title || '').trim().toLowerCase();
    if (cleanItem === cleanTitle) return true;

    const cleanTitleNoEmoji = cleanTitle.replace(emojiPattern, '').trim();
    if (cleanItemNoEmoji === cleanTitleNoEmoji) return true;

    const separators = [' — ', ' – ', ' - ', ' | ', ' @ '];
    let baseTitle = cleanTitle;
    for (const separator of separators) {
      const idx = cleanTitle.indexOf(separator);
      if (idx !== -1) {
        baseTitle = cleanTitle.slice(0, idx).trim();
        break;
      }
    }

    const baseTitleNoEmoji = baseTitle.replace(emojiPattern, '').trim();
    if (cleanItemNoEmoji === baseTitleNoEmoji) return true;

    if (typeof getSuggestedActivityMatchTexts === 'function') {
      const matchTexts = getSuggestedActivityMatchTexts(activity).map(t => String(t).trim().toLowerCase());
      if (matchTexts.includes(cleanItem)) return true;
      const matchTextsNoEmoji = matchTexts.map(t => t.replace(emojiPattern, '').trim());
      if (matchTextsNoEmoji.includes(cleanItemNoEmoji)) return true;
    }

    return false;
  }) || null;
}

// Construct test dataset
const numLegs = 10;
const daysPerLeg = 10;
const itemsPerDay = 10;
const suggestedPerLeg = 100;

const appData = [];
for (let l = 0; l < numLegs; l++) {
  const suggestedActivities = [];
  for (let s = 0; s < suggestedPerLeg; s++) {
    suggestedActivities.push({
      id: `act_${l}_${s}`,
      title: `🏛️ Sightseeing Spot ${s} — Location ${s}`,
      category: 'sight',
      estTime: '2 hrs',
      estCost: '20',
      notes: `Notes for activity ${s}`,
      location: `Location ${s}`,
      assignedDayIdx: s % daysPerLeg
    });
  }

  const days = [];
  for (let d = 0; d < daysPerLeg; d++) {
    const activityItems = [];
    for (let i = 0; i < itemsPerDay; i++) {
      const matchIdx = (d + i) % suggestedPerLeg;
      activityItems.push({
        text: `Sightseeing Spot ${matchIdx}`,
        done: false,
        time: '2 hrs'
      });
    }
    days.push({
      day: `Day ${d + 1}`,
      date: `2026-06-${String(d + 1).padStart(2, '0')}`,
      from: 'City A',
      to: 'City A',
      desc: 'Exploring city',
      activityItems
    });
  }

  appData.push({
    id: `leg_${l}`,
    label: `City ${l}`,
    colour: '#2C3E50',
    days,
    suggestedActivities
  });
}

global.appData = appData;

function runBaselineBenchmark(iterations = 100) {
  const start = performance.now();

  for (let iter = 0; iter < iterations; iter++) {
    appData.forEach((leg, legIndex) => {
      leg.days.forEach((day, dayIndex) => {
        (day.activityItems || []).forEach(item => {
          legacyFindAssignedSuggestedActivity(legIndex, dayIndex, item.text, item.activityId);
        });
      });
    });
  }

  const end = performance.now();
  return (end - start) / iterations;
}

function runIndexedBenchmark(iterations = 100) {
  const start = performance.now();

  for (let iter = 0; iter < iterations; iter++) {
    // Invalidate caches to include indexing time on each render pass
    invalidateSuggestedActivityIndex();
    appData.forEach((leg, legIndex) => {
      leg.days.forEach((day, dayIndex) => {
        (day.activityItems || []).forEach(item => {
          findAssignedSuggestedActivity(legIndex, dayIndex, item.text, item.activityId);
        });
      });
    });
  }

  const end = performance.now();
  return (end - start) / iterations;
}

if (require.main === module) {
  console.log('Measuring unindexed (legacy linear search) baseline...');
  const baselineAvg = runBaselineBenchmark(100);
  console.log(`Baseline avg per pass (1,000 lookups against 100 items): ${baselineAvg.toFixed(2)}ms`);

  console.log('\nMeasuring indexed lookups...');
  const optAvg = runIndexedBenchmark(100);
  console.log(`Indexed avg per pass (including indexing build time): ${optAvg.toFixed(2)}ms`);

  const speedup = (baselineAvg / optAvg).toFixed(2);
  const reductionPct = (((baselineAvg - optAvg) / baselineAvg) * 100).toFixed(1);
  console.log(`\nResults: ${speedup}x speedup (${reductionPct}% reduction in time!)`);
}
