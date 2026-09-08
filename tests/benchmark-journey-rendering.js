const fs = require('fs');
const itineraryCode = fs.readFileSync('js/itinerary.js', 'utf8');

global.window = { addEventListener: () => {} };
global.isEditMode = false;
global.getTransportIcon = () => '✈️';
global.normalizeItemStatus = (s) => s;
global.renderStatusBadge = () => '';
global.formatCurrency = (c) => '$' + c;
global.getMapSearchUrl = (u) => u;
global.getLegNightSummary = () => ({ label: '1 night' });
global.getLegHeaderLabelWithFlag = (l) => l;
global.renderCompactTipsCard = () => '';
global.renderCompactFoodQuestCard = () => '';
global.renderCompactActivitiesCard = () => '';
global.renderCompactDayPager = () => '';
global.renderDailyTimeline = () => '';
global.getDayJourneys = (date, from, to, legId) => global.journeys;
global.getDayTotal = () => '$0';
global.renderStayingHeadingNote = () => '';
global.getStayDisplayForDay = () => [];
global.formatJourneySubLocationText = (segs) => segs.map(s => s.fromLocation + '->' + s.toLocation).join(' | ');
global.renderJourneySubLocationTextHtml = (t) => t;
global.isMobileViewport = () => false;

eval(itineraryCode);

const numJourneys = 200;
const segmentsPerJourney = 3;
const journeys = [];
for (let j = 0; j < numJourneys; j++) {
  const jid = 'journey_' + j;
  for (let s = 0; s < segmentsPerJourney; s++) {
    journeys.push({
      id: jid + '_seg_' + s,
      journeyId: jid,
      segmentOrder: s + 1,
      transportType: 'flight',
      provider: 'Airline ' + j,
      fromLocation: 'City ' + s,
      toLocation: 'City ' + (s + 1),
      cost: '0'
    });
  }
}
global.window.journeys = journeys;
global.journeys = journeys;

const appData = [];
for (let l = 0; l < 10; l++) {
  const days = [];
  for (let d = 0; d < 10; d++) {
    days.push({
      date: '2026-06-' + String(d + 1).padStart(2, '0'),
      from: 'City A',
      to: 'City B',
      day: 'Day ' + (d + 1),
      desc: 'Fun day',
      activityItems: []
    });
  }
  appData.push({
    id: 'leg_' + l,
    label: 'Leg ' + l,
    colour: '#123456',
    days
  });
}
global.appData = appData;

function runBaseline(dayJourneys) {
  return dayJourneys.map((journey) => {
    const status = normalizeItemStatus(journey.status);
    const icon = getTransportIcon(journey.transportType);
    const showRef = status === 'booked' || status === 'confirmed';
    const journeysSource = (typeof window !== 'undefined' && Array.isArray(window.journeys))
      ? window.journeys
      : [];
    const segs = journey.journeyId ? journeysSource
        .filter(seg => seg.journeyId === journey.journeyId)
        .sort((a, b) => (a.segmentOrder || 1) - (b.segmentOrder || 1)) : [];
    const subLocations = formatJourneySubLocationText(segs.length > 0 ? segs : [journey]);
    return `<div class="cost-item journey-item">${subLocations}</div>`;
  }).join('');
}

function runOptimized(dayJourneys, journeysByJourneyId) {
  return dayJourneys.map((journey) => {
    const status = normalizeItemStatus(journey.status);
    const icon = getTransportIcon(journey.transportType);
    const showRef = status === 'booked' || status === 'confirmed';
    const gid = journey.journeyId || journey.id;
    const segs = (gid && journeysByJourneyId.get(gid)) || [];
    const subLocations = formatJourneySubLocationText(segs.length > 0 ? segs : [journey]);
    return `<div class="cost-item journey-item">${subLocations}</div>`;
  }).join('');
}

const RUNS = 5;

// Baseline
const startBase = performance.now();
for (let i = 0; i < RUNS; i++) {
  appData.forEach(leg => {
    leg.days.forEach(day => {
      runBaseline(journeys);
    });
  });
}
const timeBase = performance.now() - startBase;

// Optimized using function from itinerary.js
const startOpt = performance.now();
for (let i = 0; i < RUNS; i++) {
  const journeysByJourneyId = getJourneysGroupedByJourneyId();
  appData.forEach(leg => {
    leg.days.forEach(day => {
      runOptimized(journeys, journeysByJourneyId);
    });
  });
}
const timeOpt = performance.now() - startOpt;

console.log(`Baseline Execution Time (${RUNS} full renders across 10 legs x 10 days x 200 journeys): ${timeBase.toFixed(2)} ms`);
console.log(`Optimized Execution Time (${RUNS} full renders across 10 legs x 10 days x 200 journeys): ${timeOpt.toFixed(2)} ms`);
console.log(`Measured Speedup: ${(timeBase / timeOpt).toFixed(2)}x (${((1 - timeOpt / timeBase) * 100).toFixed(1)}% reduction in runtime)`);
