// Transport/Journey management module
// Supports rich journey display with times, providers, booking refs
// Multi-leg journeys: N segments share a journeyId and journeyName
// Note: journeys variable is declared in data.js for proper loading order

// Helper: Get formatted location display with ISO code and hover tooltip
// Returns HTML string: "CityName (CODE)" with title attribute for full details
function getLocationDisplayWithCode(locationName) {
  if (!locationName || locationName === 'Home' || locationName === 'In transit') {
    return locationName || '—';
  }

  const city = typeof citiesData !== 'undefined'
      ? citiesData.find(c => c.name === locationName)
      : null;

  if (city && city.code) {
    const countryName = city.country || '';
    const tooltip = `${city.name}${countryName ? ', ' + countryName : ''} (${city.code})`;
    return `<span class="city-code-display" title="${tooltip}">${locationName} <span class="city-iso-code">(${city.code})</span></span>`;
  }

  return locationName;
}

// Calculate total journey duration in hours
function calculateJourneyDuration(segments) {
  if (!segments || segments.length === 0) return null;

  const firstSeg = segments[0];
  const lastSeg = segments[segments.length - 1];

  const depDate = firstSeg.departureDate || firstSeg.dayDate;
  const depTime = firstSeg.departureTime;
  const arrDate = lastSeg.arrivalDate;
  const arrTime = lastSeg.arrivalTime;

  if (!depDate || !arrDate) return null;

  // Parse dates - handle both YYYY-MM-DD and legacy formats
  let depTs = 0, arrTs = 0;

  if (depDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    depTs = new Date(`${depDate}T${depTime || '00:00'}:00`).getTime();
  } else {
    depTs = new Date(`${depDate} 2026 ${depTime || '00:00'}`).getTime();
  }

  if (arrDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    arrTs = new Date(`${arrDate}T${arrTime || '00:00'}:00`).getTime();
  } else {
    arrTs = new Date(`${arrDate} 2026 ${arrTime || '00:00'}`).getTime();
  }

  if (isNaN(depTs) || isNaN(arrTs)) return null;

  let diffMs = arrTs - depTs;
  if (diffMs < 0) {
    // Arrival next day - add 24 hours
    diffMs += 24 * 60 * 60 * 1000;
  }

  const totalHours = Math.floor(diffMs / (60 * 60 * 1000));
  return totalHours;
}

// Helper: Get compact code display for table cells
// Returns just the code with full name as tooltip
function getLocationCodeDisplay(locationName) {
  if (!locationName || locationName === 'Home' || locationName === 'In transit') {
    return locationName || '—';
  }

  // First check trip cities (citiesData)
  const city = typeof citiesData !== 'undefined'
      ? citiesData.find(c => c.name === locationName)
      : null;

  if (city && city.code) {
    const countryFlag = city.countryCode ? getCountryFlag(city.countryCode) : '';
    const tooltip = `${city.name}${city.country ? ', ' + city.country : ''}${countryFlag ? ' ' + countryFlag : ''}`;
    return `<span class="city-code-compact" title="${tooltip}">${city.code}</span>`;
  }

  // Fall back to CITY_DATABASE lookup (for transit cities like London)
  const dbCity = typeof CITY_DATABASE !== 'undefined'
      ? CITY_DATABASE.find(c => c.name.toLowerCase() === locationName.toLowerCase())
      : null;

  if (dbCity) {
    const countryFlag = dbCity.countryCode ? getCountryFlag(dbCity.countryCode) : '';
    const countryName = typeof getCountryName === 'function' ? getCountryName(dbCity.countryCode) : dbCity.countryCode;
    const tooltip = `${dbCity.name}, ${countryName}${countryFlag ? ' ' + countryFlag : ''}`;
    return `<span class="city-code-compact" title="${tooltip}">${dbCity.code}</span>`;
  }

  // Last resort: generate 3-letter code
  return locationName.substring(0, 3).toUpperCase();
}

function getLocationCodeText(locationName) {
  if (!locationName) return '---';

  const normalized = String(locationName).trim();
  if (!normalized) return '---';

  const tripCity = typeof citiesData !== 'undefined'
      ? citiesData.find(c => c.name && c.name.toLowerCase() === normalized.toLowerCase())
      : null;
  if (tripCity && tripCity.code) return tripCity.code.toUpperCase();

  const dbCity = typeof CITY_DATABASE !== 'undefined'
      ? CITY_DATABASE.find(c => c.name && c.name.toLowerCase() === normalized.toLowerCase())
      : null;
  if (dbCity && dbCity.code) return dbCity.code.toUpperCase();

  return normalized.replace(/[^a-z0-9]/gi, '').substring(0, 3).toUpperCase() || '---';
}

function getLocationCodeNameText(locationName) {
  const name = String(locationName || '').trim();
  if (!name) return '';
  const code = getLocationCodeText(name);
  return code && code !== '---' ? `${code} - ${name}` : name;
}

function buildRouteCodeChain(segments) {
  if (!segments || segments.length === 0) return '---';
  const stops = [getLocationCodeText(segments[0].fromLocation)];
  segments.forEach(seg => stops.push(getLocationCodeText(seg.toLocation)));
  return stops.join(' → ');
}

// Transport type icons
const TRANSPORT_ICONS = {
  flight: '✈️',
  train: '🚆',
  car: '🚗',
  ferry: '⛴️',
  bus: '🚌',
  bike: '🚲',
  walk: '🚶',
  other: '🚌'
};

function getTransportIcon(type) {
  return TRANSPORT_ICONS[type] || TRANSPORT_ICONS.other;
}

const TRANSPORT_LABELS = {
  flight: 'Flight',
  train: 'Train',
  car: 'Car',
  ferry: 'Ferry',
  bus: 'Bus',
  bike: 'Bike',
  walk: 'Walk',
  other: 'Transport'
};

function getTransportLabel(type) {
  return TRANSPORT_LABELS[type] || TRANSPORT_LABELS.other;
}

// Initialize journeys from localStorage - called by data.js
function initJourneys() {
  if (Array.isArray(journeys) && journeys.length > 0) {
    console.log(`[Journeys] Already loaded ${journeys.length} journeys, skipping initJourneys()`);
    return;
  }
  const saved = localStorage.getItem('travelApp_journeys_v1');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        journeys = parsed;
        window.journeys = journeys;
        console.log(`[Journeys] Loaded ${journeys.length} journeys from localStorage`);
      } else {
        journeys = [];
        window.journeys = journeys;
      }
    } catch (e) {
      console.error('[Journeys] Failed to parse journeys:', e);
      journeys = [];
      window.journeys = journeys;
    }
  } else {
    journeys = [];
    window.journeys = journeys;
  }
}

function importJourneys(journeysData) {
  if (journeysData && Array.isArray(journeysData)) {
    journeys = journeysData;
    window.journeys = journeys;
    saveJourneys();
  }
}

function saveJourneys() {
  localStorage.setItem('travelApp_journeys_v1', JSON.stringify(journeys));
  window.journeys = journeys;
}

function persistJourneys(showTick = true) {
  saveJourneys();
  if (typeof saveData === 'function') {
    saveData(showTick);
  }
}

function normalizeJourneyLocation(value) {
  return (value || '').trim().toLowerCase();
}

function getCityIdForJourneyLocation(locationName) {
  if (!locationName || locationName === 'Home' || locationName === 'In transit') return '';
  const city = Array.isArray(citiesData)
      ? citiesData.find(c => normalizeJourneyLocation(c.name) === normalizeJourneyLocation(locationName))
      : null;
  return city ? city.id : '';
}

function getJourneyDisplayDate(dateStr) {
  if (!dateStr) return '';
  if (typeof dateStr === 'string' && /^\d+\s+[A-Za-z]{3}$/.test(dateStr.trim())) return dateStr.trim();
  return formatJourneyDate(dateStr);
}

function journeyDatesMatch(leftDate, rightDate) {
  if (!leftDate || !rightDate) return false;
  return leftDate === rightDate || getJourneyDisplayDate(leftDate) === getJourneyDisplayDate(rightDate);
}

function journeyRouteMatchesDay(journey, fromLoc, toLoc) {
  if (!fromLoc && !toLoc) return true;

  const journeyFrom = normalizeJourneyLocation(journey.fromLocation);
  const journeyTo = normalizeJourneyLocation(journey.toLocation);
  const dayFrom = normalizeJourneyLocation(fromLoc);
  const dayTo = normalizeJourneyLocation(toLoc);

  if (dayFrom && dayTo && journeyFrom === dayFrom && journeyTo === dayTo) return true;
  if (dayFrom && journeyFrom === dayFrom) return true;
  if (dayTo && journeyTo === dayTo) return true;
  if (dayFrom && dayTo && dayFrom !== dayTo && (journeyFrom === dayTo || journeyTo === dayFrom)) return true;

  return false;
}

function findBestLegForJourney(journey) {
  if (!Array.isArray(appData)) return null;

  if (journey.legId) {
    const existingLeg = appData.find(leg => leg.id === journey.legId);
    if (existingLeg) return existingLeg;
  }

  const routeAndDateMatch = appData.find(leg =>
      (leg.days || []).some(day => {
        const depDateMatches = journeyDatesMatch(journey.departureDate || journey.dayDate, day.date);
        const arrDateMatches = journeyDatesMatch(journey.arrivalDate, day.date);
        return (depDateMatches || arrDateMatches) && journeyRouteMatchesDay(journey, day.from, day.to);
      })
  );
  if (routeAndDateMatch) return routeAndDateMatch;

  const dateOnlyMatch = appData.find(leg =>
      (leg.days || []).some(day =>
          journeyDatesMatch(journey.departureDate || journey.dayDate, day.date) ||
          journeyDatesMatch(journey.arrivalDate, day.date)
      )
  );
  if (dateOnlyMatch) return dateOnlyMatch;

  const routeOnlyMatch = appData.find(leg =>
      (leg.days || []).some(day => journeyRouteMatchesDay(journey, day.from, day.to))
  );
  return routeOnlyMatch || null;
}

function migrateJourneyCityIds() {
  if (!Array.isArray(journeys)) return false;

  let changed = false;
  journeys.forEach(journey => {
    const fromCityId = getCityIdForJourneyLocation(journey.fromLocation);
    const toCityId = getCityIdForJourneyLocation(journey.toLocation);

    if (fromCityId && journey.fromCityId !== fromCityId) {
      journey.fromCityId = fromCityId;
      changed = true;
    }
    if (toCityId && journey.toCityId !== toCityId) {
      journey.toCityId = toCityId;
      changed = true;
    }

    const bestLeg = findBestLegForJourney(journey);
    if (bestLeg && journey.legId !== bestLeg.id) {
      journey.legId = bestLeg.id;
      changed = true;
    }

    const displayDate = getJourneyDisplayDate(journey.departureDate || journey.dayDate || journey.arrivalDate);
    if (displayDate && journey.dayDate !== displayDate) {
      journey.dayDate = displayDate;
      changed = true;
    }
  });

  if (changed) saveJourneys();
  return changed;
}

// Create a new journey from transport item data (legacy helper)
function createJourneyFromTransportItem(item, legId, dayDate, fromLoc, toLoc) {
  const fromCity = citiesData.find(c => c.name === fromLoc);
  const toCity = citiesData.find(c => c.name === toLoc);
  const journeyId = 'jid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

  const journey = {
    id: 'journey_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    journeyId: journeyId,
    journeyName: fromLoc + ' → ' + toLoc,
    legId: legId,
    dayDate: dayDate,
    fromLocation: fromLoc,
    toLocation: toLoc,
    fromCityId: fromCity ? fromCity.id : '📍',
    toCityId: toCity ? toCity.id : '',
    departureDate: '',
    departureTime: '',
    arrivalDate: '',
    arrivalTime: '',
    transportType: detectTransportType(item.text),
    provider: '',
    routeCode: '',
    status: item.status === 'confirmed' ? 'booked' : 'planned',
    cost: item.cost || '0',
    bookingReference: item.bookingRef || '',
    isMultiLeg: false,
    segmentOrder: 1,
    notes: item.text,
    legs: []
  };
  journeys.push(journey);
  window.journeys = journeys;
  persistJourneys();
  return journey;
}

// Detect transport type from text
function detectTransportType(text) {
  if (!text) return 'other';
  const t = text.toLowerCase();
  if (t.includes('✈') || t.includes('flight') || t.includes('arrive') || t.includes('depart')) return 'flight';
  if (t.includes('🚆') || t.includes('train') || t.includes('rail') || t.includes('ice') || t.includes('obb') || t.includes('sbb')) return 'train';
  if (t.includes('🚌') || t.includes('bus')) return 'bus';
  if (t.includes('⛴') || t.includes('🚣') || t.includes('ferry') || t.includes('boat')) return 'ferry';
  if (t.includes('🚗') || t.includes('car') || t.includes('drive')) return 'car';
  if (t.includes('🚲') || t.includes('bike') || t.includes('bicycle')) return 'bike';
  if (t.includes('🚶') || t.includes('walk')) return 'walk';
  return 'other';
}

// Build journey name with via notation for multi-leg journeys
// e.g., "Zurich → Bangkok (via London)" or "Brisbane → Vienna (via Taipei, Bangkok)"
function buildJourneyName(segments) {
  if (!segments || segments.length === 0) return '';
  if (segments.length === 1) {
    return `${segments[0].fromLocation} → ${segments[0].toLocation}`;
  }

  const startCity = segments[0].fromLocation;
  const endCity = segments[segments.length - 1].toLocation;

  // Collect intermediate cities (excluding start and end)
  const intermediateCities = [];
  segments.forEach((seg, index) => {
    if (index === 0) {
      // First segment: add toCity if it's not the final destination
      if (seg.toLocation !== endCity) {
        intermediateCities.push(seg.toLocation);
      }
    } else if (index < segments.length - 1) {
      // Middle segments: add toCity
      if (seg.toLocation !== endCity) {
        intermediateCities.push(seg.toLocation);
      }
    }
  });

  // Remove duplicates while preserving order
  const uniqueViaCities = intermediateCities.filter((city, idx, arr) =>
      arr.indexOf(city) === idx
  );

  if (uniqueViaCities.length === 0) {
    return `${startCity} → ${endCity}`;
  }

  const viaText = uniqueViaCities.join(', ');
  return `${startCity} → ${endCity} (via ${viaText})`;
}

// Get journeys for a specific day (for itinerary view)
function getDayJourneys(dayDate, fromLoc, toLoc, legId = '') {
  // Check window.journeys as fallback if local journeys is undefined
  if (typeof journeys === 'undefined') {
    if (typeof window !== 'undefined' && Array.isArray(window.journeys)) {
      var journeys = window.journeys;
    } else {
      return [];
    }
  }
  if (!Array.isArray(journeys)) return [];

  const seen = new Set();
  const results = [];

  journeys.forEach(j => {
    const legMatch = legId && j.legId === legId;
    const depMatch = journeyDatesMatch(j.departureDate || j.dayDate, dayDate);
    const arrMatch = journeyDatesMatch(j.arrivalDate, dayDate);
    const hasJourneyDate = Boolean(j.departureDate || j.arrivalDate || j.dayDate);
    const dateMatch = depMatch || arrMatch || (!hasJourneyDate && legMatch);
    const routeMatch = journeyRouteMatchesDay(j, fromLoc, toLoc);

    if (dateMatch && (routeMatch || legMatch)) {
      const key = j.journeyId || j.id;
      const existing = results.find(r => (r.journeyId && r.journeyId === key) || r.id === key);
      if (!existing) {
        results.push(j);
      } else {
        // If there's already a matching segment for this journey, let's see if this one is a better match for the current day/leg!
        const currentScore = (existing.toLocation === toLoc ? 2 : 0) + (existing.legId === legId ? 2 : 0) + (existing.departureDate === dayDate ? 1 : 0);
        const newScore = (j.toLocation === toLoc ? 2 : 0) + (j.legId === legId ? 2 : 0) + (j.departureDate === dayDate ? 1 : 0);
        if (newScore > currentScore) {
          const idx = results.indexOf(existing);
          if (idx !== -1) {
            results[idx] = j;
          }
        }
      }
    }
  });

  return results;
}

function findJourney(id) {
  return journeys.find(j => j.id === id);
}

function findJourneySegments(journeyId) {
  return journeys
      .filter(j => j.journeyId === journeyId)
      .sort((a, b) => (a.segmentOrder || 1) - (b.segmentOrder || 1));
}

function buildRouteChain(segments) {
  if (!segments || segments.length === 0) return '';
  if (segments.length === 1) return segments[0].fromLocation + ' → ' + segments[0].toLocation;
  const stops = [segments[0].fromLocation];
  segments.forEach(s => stops.push(s.toLocation));
  return stops.join(' → ');
}

// Build route chain using ISO codes instead of full names
function buildRouteChainWithCodes(segments) {
  if (!segments || segments.length === 0) return '';
  if (segments.length === 1) {
    return getLocationCodeDisplay(segments[0].fromLocation) + ' → ' + getLocationCodeDisplay(segments[0].toLocation);
  }
  const stops = [getLocationCodeDisplay(segments[0].fromLocation)];
  segments.forEach(s => stops.push(getLocationCodeDisplay(s.toLocation)));
  return stops.join(' → ');
}

function updateJourneyStatus(id, newStatus) {
  const target = findJourney(id);
  if (target) {
    const gid = target.journeyId || target.id;
    journeys.forEach(j => {
      if ((j.journeyId && j.journeyId === gid) || j.id === gid) {
        j.status = newStatus;
      }
    });
    persistJourneys();
    return target;
  }
  return null;
}

function updateJourneyBookingRef(id, ref) {
  const journey = findJourney(id);
  if (journey) {
    journey.bookingReference = ref;
    persistJourneys();
    if (typeof rebuildCurrentView === 'function') rebuildCurrentView();
    return journey;
  }
  return null;
}

function updateJourneyCost(id, cost) {
  const journey = findJourney(id);
  if (journey) {
    journey.cost = cost;
    persistJourneys();
    if (typeof rebuildCurrentView === 'function') rebuildCurrentView();
    return journey;
  }
  return null;
}

function updateJourneyNotes(id, notes) {
  const journey = findJourney(id);
  if (journey) {
    journey.notes = String(notes || '').trim();
    persistJourneys();
    if (typeof rebuildCurrentView === 'function') rebuildCurrentView();
    return journey;
  }
  return null;
}

function deleteJourney(id) {
  journeys = journeys.filter(j => j.id !== id);
  window.journeys = journeys;
  persistJourneys();
  if (typeof rebuildCurrentView === 'function') rebuildCurrentView();
}

function deleteJourneyGroup(journeyId) {
  journeys = journeys.filter(j => j.journeyId !== journeyId);
  window.journeys = journeys;
  persistJourneys();
  if (typeof rebuildCurrentView === 'function') rebuildCurrentView();
}

// Sort journeys: by first segment departure date then time
// For multi-leg, find the earliest segment for that journeyId
function getSortedJourneys() {
  // Build a map of journeyId -> earliest departure timestamp
  const earliestByJourneyId = {};

  journeys.forEach(j => {
    const jid = j.journeyId || j.id;
    const dateStr = j.departureDate || j.dayDate || '';
    const timeStr = j.departureTime || '00:00';
    let ts = 0;

    if (dateStr) {
      // Check if it's new YYYY-MM-DD format from the date picker
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Build ISO string: YYYY-MM-DDT00:00:00
        ts = new Date(`${dateStr}T${timeStr}:00`).getTime();
      } else {
        // Fallback for legacy format like "15 Jun"
        ts = new Date(`${dateStr} 2026 ${timeStr}`).getTime();
      }
    }

    // Fallback if date is somehow still invalid
    if (isNaN(ts)) ts = 0;

    if (!earliestByJourneyId[jid] || ts < earliestByJourneyId[jid]) {
      earliestByJourneyId[jid] = ts;
    }
  });

  return [...journeys].sort((a, b) => {
    const jidA = a.journeyId || a.id;
    const jidB = b.journeyId || b.id;
    const tsA = earliestByJourneyId[jidA] || 0;
    const tsB = earliestByJourneyId[jidB] || 0;

    // Sort journeys chronologically by start date/time
    if (tsA !== tsB) return tsA - tsB;

    // Within same group, sort sequentially by segmentOrder
    return (a.segmentOrder || 1) - (b.segmentOrder || 1);
  });
}

function formatJourneyDate(dateStr) {
  if (typeof formatTripDateForDisplay === 'function') return formatTripDateForDisplay(dateStr);
  if (!dateStr) return '';
  if (typeof dateStr === 'string' && dateStr.match(/^\d+\s+[A-Za-z]{3}$/)) return dateStr;
  try {
    const d = new Date(dateStr);
    return `${d.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]}`;
  } catch (e) { return dateStr; }
}

function formatJourneyTime(timeStr) {
  if (!timeStr) return '';
  return timeStr;
}

function calculateDuration(depDate, depTime, arrDate, arrTime) {
  if (!depDate || !arrDate) return '';
  if (depTime && arrTime) {
    const dep = parseTime(depTime);
    const arr = parseTime(arrTime);
    if (dep && arr) {
      let diff = arr - dep;
      if (diff < 0) diff += 24 * 60;
      const hrs = Math.floor(diff / 60);
      const mins = diff % 60;
      return `${hrs}h${mins > 0 ? ` ${mins}m` : ''}`;
    }
  }
  return '';
}

function parseTime(timeStr) {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (match) return parseInt(match[1]) * 60 + parseInt(match[2]);
  return null;
}

let expandedTransportGroups = new Set();

function isTransportGroupExpanded(groupId) {
  return expandedTransportGroups.has(groupId);
}

function toggleTransportGroupDetails(groupId) {
  if (expandedTransportGroups.has(groupId)) {
    expandedTransportGroups.delete(groupId);
  } else {
    expandedTransportGroups.add(groupId);
  }
  buildTransportTab(typeof currentCityFilter !== 'undefined' ? currentCityFilter : 'all');
}

function renderTransportDetailBlock(title, value, extraClass = '') {
  return `
    <div class="flex flex-col gap-1 p-2 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-100 dark:border-slate-800/60 ${extraClass}">
      <span class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">${escapeHtmlText(title)}</span>
      <span class="text-sm font-medium text-slate-800 dark:text-slate-200">${escapeHtmlText(value || '—')}</span>
    </div>
  `;
}

function getTransportSubLocationParts(seg) {
  if (!seg) return [];
  return [
    seg.fromAddress ? { label: 'Depart', value: seg.fromAddress, city: seg.fromLocation } : null,
    seg.toAddress ? { label: 'Arrive', value: seg.toAddress, city: seg.toLocation } : null
  ].filter(Boolean);
}

function renderTransportSubLocationParts(parts, extraClass = '') {
  if (parts.length === 0) return '';

  return `
    <div class="transport-sub-location-details ${extraClass}">
      ${parts.map(part => `
        <span class="transport-sub-location-detail" title="${escapeHtmlText(part.value)}">
          <span class="transport-sub-location-label">${escapeHtmlText(part.label)}</span>
          <span class="transport-sub-location-value">
            <a href="${getMapSearchUrl(part.value, part.city)}" target="_blank" rel="noopener noreferrer" class="transport-sub-location-value-link" onclick="event.stopPropagation();" title="Open in Google Maps">
              <span class="location-map-icon">&#x1F5FA;&#xFE0F;</span> ${escapeHtmlText(part.value)}
            </a>
          </span>
        </span>
      `).join('')}
    </div>
  `;
}

function renderTransportSubLocationPlainText(parts, extraClass = '') {
  const visibleParts = parts.filter(part => part && part.value);
  if (visibleParts.length === 0) return '';

  return `
    <div class="transport-card-location-summary ${extraClass}">
      ${visibleParts.map(part => `
        <span class="transport-card-location-item" title="${escapeHtmlText(part.value)}">
          <span class="transport-card-location-label">${escapeHtmlText(part.label)}:</span>
          <a href="${getMapSearchUrl(part.value, part.city)}" target="_blank" rel="noopener noreferrer" class="transport-card-location-link" onclick="event.stopPropagation();" title="Open in Google Maps">${escapeHtmlText(part.value)}</a>
          ${part.detail ? `<a href="${getMapSearchUrl(part.detail, part.city || part.value)}" target="_blank" rel="noopener noreferrer" class="transport-card-location-detail-link" onclick="event.stopPropagation();" title="Open in Google Maps">${escapeHtmlText(part.detail)}</a>` : ''}
        </span>
      `).join('')}
    </div>
  `;
}

function renderTransportMobileFact(label, value, extraClass = '') {
  return `
    <div class="transport-mobile-fact ${extraClass}">
      <span class="transport-mobile-fact-label">${escapeHtmlText(label)}</span>
      <span class="transport-mobile-fact-value">${escapeHtmlText(value || '')}</span>
    </div>
  `;
}

function renderTransportMobileLinkedFact(label, value, href, detail = '', detailHref = '', extraClass = '') {
  return `
    <div class="transport-mobile-fact ${extraClass}">
      <span class="transport-mobile-fact-label">${escapeHtmlText(label)}</span>
      ${value ? `<a href="${href}" target="_blank" rel="noopener noreferrer" class="transport-card-location-link transport-mobile-fact-link" onclick="event.stopPropagation();" title="Open in Google Maps">${escapeHtmlText(value)}</a>` : '<span class="transport-mobile-fact-value"></span>'}
      ${detail ? `<a href="${detailHref}" target="_blank" rel="noopener noreferrer" class="transport-card-location-detail-link transport-mobile-fact-detail-link" onclick="event.stopPropagation();" title="Open in Google Maps">${escapeHtmlText(detail)}</a>` : ''}
    </div>
  `;
}

function renderTransportSubLocationDetails(seg, extraClass = '') {
  return renderTransportSubLocationParts(getTransportSubLocationParts(seg), extraClass);
}

function getJourneySubLocationParts(segs) {
  if (!Array.isArray(segs)) return [];
  const isMultiLeg = segs.length > 1;
  return segs.flatMap((seg, index) => {
    const legPrefix = isMultiLeg ? `Leg ${index + 1} ` : '';
    return [
      seg.fromAddress ? { label: `${legPrefix}Depart`, value: seg.fromAddress, city: seg.fromLocation } : null,
      seg.toAddress ? { label: `${legPrefix}Arrive`, value: seg.toAddress, city: seg.toLocation } : null
    ].filter(Boolean);
  });
}

function renderJourneySubLocationDetails(segs, extraClass = '') {
  return renderTransportSubLocationParts(getJourneySubLocationParts(segs), extraClass);
}

function renderJourneySubLocationSummary(segs, extraClass = '') {
  if (!Array.isArray(segs) || segs.length === 0) return '';
  const firstSeg = segs[0];
  const lastSeg = segs[segs.length - 1];
  return renderTransportSubLocationPlainText([
    {
      label: 'From',
      value: firstSeg.fromLocation || '',
      city: firstSeg.fromLocation,
      detail: firstSeg.fromAddress || ''
    },
    {
      label: 'To',
      value: lastSeg.toLocation || '',
      city: lastSeg.toLocation,
      detail: lastSeg.toAddress || ''
    }
  ], extraClass);
}

function renderTransportMobileFacts(segs, totalCost, notes = '') {
  if (!Array.isArray(segs) || segs.length === 0) return '';
  const firstSeg = segs[0];
  const lastSeg = segs[segs.length - 1];
  const firstDepDate = formatJourneyDate(firstSeg.departureDate) || firstSeg.dayDate || '';
  const firstDepTime = firstSeg.departureTime || '';
  const firstDep = [firstDepDate, firstDepTime].filter(Boolean).join(' ');
  const lastArr = formatJourneyDate(lastSeg.arrivalDate) || '';
  const lastArrTime = lastSeg.arrivalTime || '';
  const arrive = [lastArr, lastArrTime].filter(Boolean).join(' ');
  const providerSet = Array.from(new Set(segs.map(seg => seg.provider).filter(Boolean)));
  const routeCodeSet = Array.from(new Set(segs.map(seg => seg.routeCode).filter(Boolean)));
  const bookingSet = Array.from(new Set(segs.map(seg => seg.bookingReference).filter(Boolean)));
  const providerLabel = providerSet.length > 1 ? `${providerSet.length} carriers` : (providerSet[0] || '');
  const routeCodeLabel = routeCodeSet.length > 1 ? `${routeCodeSet.length} codes` : (routeCodeSet[0] || '');
  const bookingLabel = bookingSet.length > 1 ? `${bookingSet.length} refs` : (bookingSet[0] || '');
  const fromLocation = firstSeg.fromLocation || '';
  const toLocation = lastSeg.toLocation || '';
  const fromValue = getLocationCodeNameText(fromLocation);
  const toValue = getLocationCodeNameText(toLocation);
  const fromDetail = firstSeg.fromAddress || '';
  const toDetail = lastSeg.toAddress || '';
  const notesValue = String(notes || '').trim();

  return `
    <div class="transport-mobile-facts-grid">
      ${renderTransportMobileLinkedFact('From', fromValue, getMapSearchUrl(fromLocation, fromLocation))}
      ${renderTransportMobileLinkedFact('To', toValue, getMapSearchUrl(toLocation, toLocation))}
      ${fromDetail ? renderTransportMobileLinkedFact('From Details', fromDetail, getMapSearchUrl(getJourneyMapSearchQuery(fromDetail, fromLocation, firstSeg.transportType)), '', '', 'transport-mobile-fact--detail') : ''}
      ${toDetail ? renderTransportMobileLinkedFact('To Details', toDetail, getMapSearchUrl(getJourneyMapSearchQuery(toDetail, toLocation, lastSeg.transportType)), '', '', 'transport-mobile-fact--detail') : ''}
      ${renderTransportMobileFact('Depart', firstDep)}
      ${renderTransportMobileFact('Arrive', arrive)}
      ${renderTransportMobileFact('Carrier', providerLabel)}
      ${renderTransportMobileFact('Code', routeCodeLabel)}
      ${renderTransportMobileFact('Cost', formatCurrency(totalCost))}
      ${renderTransportMobileFact('Booking #', bookingLabel)}
      ${notesValue ? renderTransportMobileFact('Notes', notesValue, 'transport-mobile-fact--wide transport-mobile-fact--notes') : ''}
    </div>
  `;
}

function formatTransportSubLocationText(seg) {
  return getTransportSubLocationParts(seg)
      .map(part => `${part.label}: ${part.value}`)
      .join(' | ');
}

function renderJourneyMobileSummary(legCountText) {
  if (!legCountText) return '';

  return `
    <div class="mobile-table-meta transport-mobile-meta">
      <span class="transport-mobile-provider">${legCountText}</span>
    </div>
  `;
}

function formatJourneyNameDisplay(name) {
  if (!name) return '—';
  const match = name.match(/^(.*?)(\s*\(via\s+.+\))$/i);
  if (!match) return name;
  return `${match[1]}<span class="journey-name-via">${match[2]}</span>`;
}

function renderTransportScheduleMobile(firstDep, lastArr, lastArrTime, durationText = '', typeIcon = '') {
  const arrivalText = lastArr !== '—' ? `${lastArr} ${lastArrTime || ''}`.trim() : '—';
  const durationLabel = durationText ? `(${durationText.replace(/\s+/g, '')})` : '';
  const durationIcon = typeIcon ? `<span class="transport-schedule-type">${typeIcon}</span>` : '';

  return `
    <div class="mobile-table-meta transport-schedule-meta">
      <span class="transport-schedule-line"><strong>D:</strong> ${firstDep || '—'}</span>
      <span class="transport-schedule-line"><strong>A:</strong> ${arrivalText}</span>
      ${durationLabel ? `<span class="transport-schedule-line transport-schedule-duration">${durationIcon}${durationLabel}</span>` : ''}
    </div>
  `;
}

function renderTransportCarrierMobile(provider, routeCode, bookingReference, statusText, statusIcon, statusColor, costValue, journeyId, isEditable) {
  const providerLine = provider ? `<span class="transport-carrier-provider">${provider}</span>` : '';
  const codeLine = routeCode ? `<span class="transport-carrier-code">${routeCode}</span>` : '';
  const refAndCost = [bookingReference ? `<span class="transport-carrier-pnr">${bookingReference}</span>` : '', costValue !== '' ? `<span class="transport-carrier-cost">${formatCurrency(costValue)}</span>` : '']
      .filter(Boolean)
      .join('');
  const statusNode = renderStatusBadge(statusText, {
    onClick: isEditable ? `toggleJourneyStatus('${journeyId}')` : '',
    title: 'Change status',
    className: 'transport-mobile-status-btn'
  });

  return `
    <div class="mobile-table-meta transport-carrier-meta">
      <div class="transport-carrier-meta-inner">
        ${statusNode}
      </div>
      ${refAndCost ? `<div class="transport-carrier-inline-meta">${refAndCost}</div>` : ''}
      ${providerLine}
      ${codeLine}
    </div>
  `;
}

function renderTransportStatusCostMobile(statusText, statusIcon, statusColor, costValue, bookingReference, journeyId, isEditable) {
  if (typeof renderMobileStatusCostMeta === 'function') {
    return renderMobileStatusCostMeta({
      status: statusText.toLowerCase(),
      costValue,
      bookingReference,
      statusOnClick: isEditable ? `toggleJourneyStatus('${journeyId}')` : '',
      costOnBlur: `updateJourneyCost('${journeyId}', this.innerText); buildTransportTab();`,
      statusButtonTitle: 'Change status',
      metaClass: 'transport-status-cost-meta mobile-status-cost-meta',
      editableCost: isEditable
    });
  }
  return '';
}

function isTransportMobileCardLayout() {
  return typeof isMobileViewport === 'function'
      ? isMobileViewport()
      : (typeof window !== 'undefined' && window.innerWidth <= 768);
}

function renderTransportSegmentsDetailContent(segs) {
  const useCompactSegments = typeof window !== 'undefined' && (window.isCompactView || document.body.classList.contains('mobile-app-mode'));
  const detailRows = segs.map((seg, i) => {
    const segDepDate = formatJourneyDate(seg.departureDate) || seg.dayDate || '—';
    const segDepTime = seg.departureTime || '';
    const segDep = segDepDate !== '—' && segDepTime ? segDepDate + ' ' + segDepTime : segDepDate;
    const segArr = formatJourneyDate(seg.arrivalDate) || '—';
    const segRoute = `${getLocationCodeDisplay(seg.fromLocation)} → ${getLocationCodeDisplay(seg.toLocation)}`;

    if (useCompactSegments) {
      return `
        <div class="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700/50 rounded-lg p-3 shadow-sm text-sm">
          <div class="flex items-center justify-between mb-2">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Leg ${i + 1}</span>
            <span class="font-medium text-slate-800 dark:text-slate-200">${escapeHtmlText(seg.fromLocation || '—')} → ${escapeHtmlText(seg.toLocation || '—')}</span>
          </div>
          ${renderTransportSubLocationDetails(seg, 'text-xs text-slate-500 mb-2')}
          <div class="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400 mb-2">
            <div>
              <span class="block text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">Departs</span>
              <span class="font-medium">${escapeHtmlText(segDep)}</span>
            </div>
            <div>
              <span class="block text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500">Arrives</span>
              <span>${segArr !== '—' ? escapeHtmlText(segArr + ' ' + (seg.arrivalTime || '')) : '—'}</span>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2 text-xs">
            <span class="font-medium text-slate-700 dark:text-slate-300">${escapeHtmlText(seg.provider || '—')}</span>
            ${seg.routeCode ? `<span class="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono">${escapeHtmlText(seg.routeCode)}</span>` : ''}
            ${seg.bookingReference ? `<span class="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono">${escapeHtmlText(seg.bookingReference)}</span>` : ''}
            <span class="ml-auto font-semibold text-slate-800 dark:text-slate-200">${seg.cost ? escapeHtmlText(formatCurrency(seg.cost)) : '—'}</span>
          </div>
        </div>
      `;
    }

    return `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
        <td class="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200">
          ${seg.fromLocation || '—'} → ${seg.toLocation || '—'}
          ${renderTransportSubLocationDetails(seg, 'text-xs mt-0.5 text-slate-500')}
        </td>
        <td class="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">Leg ${i + 1}</td>
        <td class="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">${segRoute}</td>
        <td class="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap font-medium">${segDep}</td>
        <td class="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">${segArr !== '—' ? segArr + ' ' + (seg.arrivalTime || '') : '—'}</td>
        <td class="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">${seg.provider || '—'}</td>
        <td class="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400 font-mono uppercase">${seg.routeCode || '—'}</td>
        <td class="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400 font-mono uppercase">${seg.bookingReference || '—'}</td>
        <td class="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200 font-medium text-right">${seg.cost ? formatCurrency(seg.cost) : '—'}</td>
      </tr>
    `;
  }).join('');

  return useCompactSegments
      ? `
      <div class="mt-2 bg-slate-50/50 dark:bg-slate-800/30 rounded-lg p-3">
        <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Journey Segments</div>
        <div class="hidden">
          <span>Journey</span>
          <span>Schedule</span>
          <span>Carrier</span>
        </div>
        <div class="space-y-2">
          ${detailRows}
        </div>
      </div>
    `
      : `
      <div class="mt-2 bg-slate-50/50 dark:bg-slate-800/20 rounded-lg border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
        <div class="px-4 py-2 bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200/50 dark:border-slate-700/50 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Journey Segments</div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr class="bg-white/50 dark:bg-slate-800/20 border-b border-slate-200/50 dark:border-slate-700/50">
                <th class="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Journey</th>
                <th class="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Leg</th>
                <th class="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Route</th>
                <th class="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Departs</th>
                <th class="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Arrives</th>
                <th class="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Provider</th>
                <th class="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Code</th>
                <th class="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Booking Ref</th>
                <th class="px-4 py-2 text-xs font-semibold text-slate-500 uppercase text-right">Cost</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-slate-900">
              ${detailRows}
            </tbody>
          </table>
        </div>
      </div>
    `;
}

function renderTransportMobileDetails(segs, rep, totalCost, statusText, statusIcon, statusColor, journeyId) {
  if (!segs || segs.length === 0) return '';

  return `
    ${renderTransportMobileFacts(segs, totalCost, rep?.notes || '')}
    ${segs.length > 1 ? renderTransportSegmentsDetailContent(segs) : ''}
  `;
}

function getJourneyMapSearchQuery(address, location, transportType) {
  let suffix = '';
  if (transportType === 'flight') suffix = ' Airport';
  else if (transportType === 'train') suffix = ' Train Station';
  else if (transportType === 'bus') suffix = ' Bus Station';
  else if (transportType === 'ferry') suffix = ' Ferry Terminal';

  let resolvedLoc = location || '';
  if (suffix && resolvedLoc && !resolvedLoc.toLowerCase().includes(suffix.toLowerCase())) {
    resolvedLoc = resolvedLoc + suffix;
  }
  return address ? `${address}, ${resolvedLoc}` : resolvedLoc;
}

// ─── BUILD TRANSPORT TAB ──────────────────────────────────────────

function buildTransportTab(cityFilter = null) {
  if (typeof journeys === 'undefined' || journeys === null) {
    journeys = (typeof window !== 'undefined' && window.journeys) ? window.journeys : [];
  }

  const container = document.getElementById('transport-table-container');
  if (!container) return;

  if (!Array.isArray(journeys) || journeys.length === 0) {
    const saved = localStorage.getItem('travelApp_journeys_v1');
    if (saved) {
      try {
        let parsed = JSON.parse(saved);
        if (typeof normalizeTripJourneysData === 'function') {
          parsed = normalizeTripJourneysData(parsed);
        }
        journeys = parsed;
        window.journeys = journeys;
      }
      catch (e) { journeys = []; }
    } else { journeys = []; }
  }

  let toShow = getSortedJourneys();
  if (cityFilter && cityFilter !== 'all') {
    toShow = toShow.filter(j =>
        j.fromCityId === cityFilter || j.toCityId === cityFilter
    );
  }

  let html = `
    <div class="section-header transport-header">
      <h3 class="section-header-title">✈️ Transport</h3>
      <button class="action-btn" onclick="openAddJourneyModal()">+ Add Journey</button>
    </div>
  `;

  if (toShow.length === 0) {
    html += `<div class="empty-placeholder">
      <p>No journeys planned yet.</p>
      <p class="section-header-note">Click "+ Add Journey" to add your first transport booking.</p>
    </div>`;
    container.innerHTML = html;
    return;
  }

  const groups = {};
  const groupOrder = [];
  toShow.forEach(j => {
    const gid = j.journeyId || j.id;
    if (!groups[gid]) {
      groups[gid] = [];
      groupOrder.push(gid);
    }
    groups[gid].push(j);
  });

  const useMobileCards = isTransportMobileCardLayout();
  if (useMobileCards) {
    const slidesHtml = [];
    const railHtml = [];

    groupOrder.forEach((gid, index) => {
      const segs = groups[gid].sort((a, b) => (a.segmentOrder || 1) - (b.segmentOrder || 1));
      const isMultiLeg = segs.length > 1;
      const rep = segs[0];
      const totalCost = segs.reduce((sum, s) => sum + parseCost(s.cost), 0);
      const routeText = isMultiLeg
          ? buildRouteChain(segs)
          : `${rep.fromLocation || '—'} → ${rep.toLocation || '—'}`;
      const routeCodeText = buildRouteCodeChain(segs);
      const firstDepDate = formatJourneyDate(rep.departureDate) || rep.dayDate || '—';
      const firstDepTime = rep.departureTime || '';
      const firstDep = firstDepDate !== '—' && firstDepTime ? `${firstDepDate} ${firstDepTime}` : firstDepDate;
      const lastSeg = segs[segs.length - 1];
      const lastArr = formatJourneyDate(lastSeg.arrivalDate) || '—';
      const lastArrTime = lastSeg.arrivalTime || '—';
      const statusMetaInfo = getStatusMeta(rep.status);
      const statusColor = statusMetaInfo.color;
      const statusIcon = '';
      const statusText = statusMetaInfo.label;
      const durationHours = isMultiLeg ? calculateJourneyDuration(segs) : null;
      const durationDisplay = durationHours !== null ? `${durationHours}h` : calculateDuration(rep.departureDate || rep.dayDate, rep.departureTime, lastSeg.arrivalDate, lastSeg.arrivalTime);
      const eyebrow = `${getTransportIcon(rep.transportType)} ${firstDepDate}`;
      const arrivalText = [lastArr, lastArrTime].filter(Boolean).join(' ');
      const subtitleParts = [`Dep ${firstDep}`, `Arr ${arrivalText}`, rep.provider || '—'];
      if (rep.routeCode) subtitleParts.push(rep.routeCode);
      if (durationDisplay) subtitleParts.push(durationDisplay);
      const primaryAction = renderStatusBadge(rep.status, {
        onClick: isEditMode ? `event.stopPropagation(); toggleJourneyStatus('${rep.id}')` : '',
        title: 'Change status',
        className: 'transport-mobile-status-btn'
      });
      const meta = '';
      const actions = `
        <button class="mobile-surface-card-button transport-edit-btn" onclick="event.stopPropagation(); editJourney('${gid}')" title="Edit journey" aria-label="Edit journey">Edit</button>
        <button class="mobile-surface-card-button mobile-surface-card-button--danger transport-del-btn" onclick="event.stopPropagation(); deleteJourneyGroup('${gid}')" title="Delete journey" aria-label="Delete journey">Delete</button>
      `;
      const summary = '';
      const details = renderTransportMobileDetails(segs, rep, totalCost, statusText, statusIcon, statusColor, rep.id);
      const cardHtml = renderMobileSurfaceCard({
        cardClass: 'transport-mobile-card row-accent',
        accentColor: statusColor,
        dateLabel: '',
        title: rep.journeyName || routeText,
        subtitle: subtitleParts.filter(Boolean).join(' · '),
        summary,
        meta,
        primaryAction,
        actions,
        details,
        detailsOpen: true
      });
      slidesHtml.push(`
        <div id="transport-slide-${index}" class="mobile-swipe-slide transport-swipe-slide" data-role="mobile-swipe-slide" data-slide-index="${index}" data-city-id="${escapeHtmlText(rep.toCityId || rep.fromCityId || '')}">
          ${cardHtml}
        </div>
      `);
      railHtml.push(`
        <button type="button" class="mobile-swipe-chip" data-role="mobile-swipe-chip" data-slide-index="${index}" aria-controls="transport-slide-${index}" aria-selected="${index === 0 ? 'true' : 'false'}">
          <span class="mobile-swipe-chip-eyebrow">${escapeHtmlText(eyebrow)}</span>
          <span class="mobile-swipe-chip-title">${escapeHtmlText(rep.journeyName || routeText)}</span>
          <span class="mobile-swipe-chip-route">${escapeHtmlText(routeCodeText)}</span>
        </button>
      `);
    });
    html += renderMobileSwipePager({
      pagerClass: 'transport-swipe-pager',
      pagerKey: 'transport-swipe',
      syncCityNav: true,
      railHtml: railHtml.join(''),
      slidesHtml: slidesHtml.join(''),
      ariaLabel: 'Transport journeys'
    });
    container.innerHTML = html;
    if (typeof setupMobileSwipePagers === 'function') setupMobileSwipePagers(container);
    return;
  }

  html += `<div class="w-full overflow-x-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm mt-4">
    <table class="w-full text-left border-collapse min-w-[800px]">
      <thead>
        <tr class="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/60 dark:border-slate-700/60">
          <th class="px-3 py-3 w-8"></th>
          <th class="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Journey</th>
          <th class="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Type</th>
          <th class="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Route</th>
          <th class="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Departs</th>
          <th class="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Arrives</th>
          <th class="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Duration</th>
          <th class="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Provider</th>
          <th class="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Code</th>
          <th class="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Booking Ref</th>
          <th class="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Notes</th>
          <th class="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Status</th>
          <th class="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Cost</th>
          <th class="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100 dark:divide-slate-800/50">
      `;

  groupOrder.forEach(gid => {
    const segs = groups[gid].sort((a, b) => (a.segmentOrder || 1) - (b.segmentOrder || 1));
    const isMultiLeg = segs.length > 1;
    const rep = segs[0];

    const statusMetaInfo = getStatusMeta(rep.status);
      const statusColor = statusMetaInfo.color;
      const statusIcon = '';
      const statusText = statusMetaInfo.label;

    const lastSeg = segs[segs.length - 1];
    const firstDepDate = formatJourneyDate(rep.departureDate) || rep.dayDate || '—';
    const firstDepTime = rep.departureTime || '';
    const firstDep = firstDepDate !== '—' && firstDepTime ? firstDepDate + ' ' + firstDepTime : firstDepDate;
    const lastArr = formatJourneyDate(lastSeg.arrivalDate) || '—';
    const lastArrTime = lastSeg.arrivalTime || '—';

    const totalCost = segs.reduce((sum, s) => sum + parseCost(s.cost), 0);
    const icon = isMultiLeg ? '✈️' : getTransportIcon(rep.transportType);
    const nameDisplay = formatJourneyNameDisplay(rep.journeyName || '—');

    const durationText = isMultiLeg ? calculateJourneyDuration(segs) : null;
    const durationDisplay = durationText !== null ? durationText : calculateDuration(rep.departureDate || rep.dayDate, rep.departureTime, lastSeg.arrivalDate, lastSeg.arrivalTime);

    const firstLoc = getLocationCodeDisplay(rep.fromLocation);
    const lastLoc = getLocationCodeDisplay(lastSeg.toLocation);
    let routeDisplay = `${firstLoc} → ${lastLoc}`;
    let desktopExpandControl = '';
    
    const isExpanded = isTransportGroupExpanded(gid);
    if (isMultiLeg) {
      const vias = segs.slice(0, -1).map(s => getLocationCodeDisplay(s.toLocation));
      const viaText = vias.length > 0 ? `(via ${vias.map(v => v.replace(/<[^>]*>?/gm, '')).join(', ')})` : '';
      desktopExpandControl = `<button class="journey-expand-btn ${isExpanded ? 'expanded' : ''}" onclick="event.stopPropagation(); toggleTransportGroupDetails('${gid}')" title="Show journey details" aria-expanded="${isExpanded}" aria-label="${isExpanded ? 'Collapse journey details' : 'Expand journey details'}">
          <span class="transport-expand-arrow">${isExpanded ? '▼' : '▶'}</span>
        </button>`;
      
      routeDisplay = `
        <div class="transport-route-main flex items-center">
          ${firstLoc} → ${lastLoc} 
          <span class="text-[10px] text-slate-500 ml-1 font-normal uppercase tracking-wider">${viaText}</span>
        </div>`;
    }

    const fromCityName = (typeof getCityNameById === 'function' && rep.fromCityId) ? getCityNameById(rep.fromCityId) : '';
    const toCityName = (typeof getCityNameById === 'function' && lastSeg.toCityId) ? getCityNameById(lastSeg.toCityId) : '';

    const cleanFromCity = (fromCityName || '').trim();
    const cleanFromLoc = (rep.fromLocation || '').trim();
    const cleanFromAddr = (rep.fromAddress || '').trim();

    let fromDetailsHtml = '';
    if (cleanFromAddr) {
      fromDetailsHtml = `
        <a href="${getMapSearchUrl(getJourneyMapSearchQuery(cleanFromAddr, cleanFromLoc, rep.transportType))}" target="_blank" rel="noopener noreferrer" class="hover:text-blue-500 hover:underline text-slate-400 dark:text-slate-500 transition-colors inline-flex items-center gap-1 text-xs" title="Open in Google Maps" onclick="event.stopPropagation();">
          <span class="font-medium text-slate-600 dark:text-slate-400">${escapeHtmlText(cleanFromCity || cleanFromLoc || '—')}</span>
          <span>·</span>
          <span>${escapeHtmlText(cleanFromAddr)}</span>
        </a>
      `;
    } else {
      if (cleanFromCity && cleanFromLoc && cleanFromCity.toLowerCase() !== cleanFromLoc.toLowerCase()) {
        fromDetailsHtml = `
          <div class="text-slate-400 dark:text-slate-500 inline-flex items-center gap-1 text-xs">
            <span class="font-medium text-slate-600 dark:text-slate-400">${escapeHtmlText(cleanFromCity)}</span>
            <span>·</span>
            <span>${escapeHtmlText(cleanFromLoc)}</span>
          </div>
        `;
      } else {
        fromDetailsHtml = `
          <span class="font-medium text-slate-600 dark:text-slate-400 text-xs">${escapeHtmlText(cleanFromCity || cleanFromLoc || '—')}</span>
        `;
      }
    }

    const cleanToCity = (toCityName || '').trim();
    const cleanToLoc = (lastSeg.toLocation || '').trim();
    const cleanToAddr = (lastSeg.toAddress || '').trim();

    let toDetailsHtml = '';
    if (cleanToAddr) {
      toDetailsHtml = `
        <a href="${getMapSearchUrl(getJourneyMapSearchQuery(cleanToAddr, cleanToLoc, lastSeg.transportType))}" target="_blank" rel="noopener noreferrer" class="hover:text-blue-500 hover:underline text-slate-400 dark:text-slate-500 transition-colors inline-flex items-center gap-1 text-xs" title="Open in Google Maps" onclick="event.stopPropagation();">
          <span class="font-medium text-slate-600 dark:text-slate-400">${escapeHtmlText(cleanToCity || cleanToLoc || '—')}</span>
          <span>·</span>
          <span>${escapeHtmlText(cleanToAddr)}</span>
        </a>
      `;
    } else {
      if (cleanToCity && cleanToLoc && cleanToCity.toLowerCase() !== cleanToLoc.toLowerCase()) {
        toDetailsHtml = `
          <div class="text-slate-400 dark:text-slate-500 inline-flex items-center gap-1 text-xs">
            <span class="font-medium text-slate-600 dark:text-slate-400">${escapeHtmlText(cleanToCity)}</span>
            <span>·</span>
            <span>${escapeHtmlText(cleanToLoc)}</span>
          </div>
        `;
      } else {
        toDetailsHtml = `
          <span class="font-medium text-slate-600 dark:text-slate-400 text-xs">${escapeHtmlText(cleanToCity || cleanToLoc || '—')}</span>
        `;
      }
    }

    html += `
      <tr class="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${isMultiLeg ? 'cursor-pointer' : ''}" data-group="${gid}" style="border-left: 4px solid ${statusColor};" ${isMultiLeg ? `onclick="toggleTransportGroupDetails('${gid}')"` : ''}>
        <td class="px-3 py-3 w-8 align-middle text-center">${desktopExpandControl}</td>
        <td class="px-4 py-3 align-middle text-slate-800 dark:text-slate-200 font-medium whitespace-nowrap" title="${escapeHtmlText(rep.journeyName || '')}">
          <div class="journey-name-main">${nameDisplay}</div>
          ${isMultiLeg ? `<div class="text-[11px] text-slate-400 dark:text-slate-500 font-normal mt-0.5">${segs.length} legs</div>` : ''}
        </td>
        <td class="px-4 py-3 align-middle text-center text-xl">${icon}</td>
        <td class="px-4 py-3 align-middle text-slate-600 dark:text-slate-300 text-sm whitespace-nowrap">${routeDisplay}</td>
        
        <td class="px-4 py-3 align-middle text-slate-600 dark:text-slate-300 whitespace-nowrap text-sm">
          <div class="flex flex-col">
            <span class="block font-medium text-slate-800 dark:text-slate-200">${firstDep}</span>
            <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ${fromDetailsHtml}
            </div>
          </div>
        </td>
        
        <td class="px-4 py-3 align-middle text-slate-600 dark:text-slate-300 whitespace-nowrap text-sm">
          <div class="flex flex-col">
            <span class="block font-medium text-slate-800 dark:text-slate-200">${lastArr !== '—' ? lastArr + ' ' + lastArrTime : '—'}</span>
            <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ${toDetailsHtml}
            </div>
          </div>
        </td>
        
        <td class="px-4 py-3 align-middle text-center text-slate-600 dark:text-slate-300 text-sm font-medium whitespace-nowrap">
          ${durationDisplay || '—'}
        </td>
        
        <td class="px-4 py-3 align-middle text-slate-600 dark:text-slate-300 whitespace-nowrap text-sm">
          <span class="font-medium">${escapeHtmlText(rep.provider || '—')}</span>
        </td>
        
        <td class="px-4 py-3 align-middle text-slate-500 dark:text-slate-400 font-mono text-sm uppercase whitespace-nowrap">
          ${escapeHtmlText(rep.routeCode || '—')}
        </td>
        
        <td class="px-4 py-3 align-middle text-slate-500 dark:text-slate-400 font-mono text-sm uppercase whitespace-nowrap">
          ${escapeHtmlText(rep.bookingReference || '—')}
        </td>
        
        <!-- Notes -->
        <td class="px-4 py-3 align-middle text-slate-400 dark:text-slate-500 text-xs max-w-[250px] break-words" title="${escapeHtmlText(rep.notes || '')}" onclick="event.stopPropagation()">
          <span contenteditable="${window.isEditMode}" class="focus:outline-none focus:ring-1 focus:ring-slate-300 rounded px-1" onblur="updateJourneyNotes('${rep.id}', this.innerText); buildTransportTab();">${escapeHtmlText(rep.notes || '—')}</span>
        </td>
        
        <td class="px-4 py-3 align-middle text-center">
          ${renderStatusBadge(rep.status, {
            onClick: window.isEditMode ? `event.stopPropagation(); toggleJourneyStatus('${rep.id}')` : '',
            title: 'Change transport status'
          })}
        </td>
        
        <td class="px-4 py-3 align-middle text-right font-medium text-slate-800 dark:text-slate-200" onclick="event.stopPropagation()">
          $<span contenteditable="${window.isEditMode}" class="focus:outline-none focus:ring-1 focus:ring-slate-300 rounded px-1" onblur="updateJourneyCost('${rep.id}', this.innerText); buildTransportTab();">${formatCurrency(isMultiLeg ? totalCost : (rep.cost || '0'), { includeSymbol: false })}</span>
        </td>
        
        <td class="px-4 py-3 align-middle text-center whitespace-nowrap" onclick="event.stopPropagation()">
          <div class="inline-flex gap-2">
            <button class="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors" onclick="editJourney('${gid}')" title="Edit journey" aria-label="Edit journey">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/></svg>
            </button>
            <button class="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors" onclick="deleteJourneyGroup('${gid}')" title="Delete journey" aria-label="Delete journey">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
            </button>
          </div>
        </td>
      </tr>`;

    if (isMultiLeg) {
      const detailRowContent = renderTransportSegmentsDetailContent(segs);

      html += `
        <tr class="journey-detail-row ${isExpanded ? 'expanded' : ''}" data-group="${gid}" style="display:${isExpanded ? 'table-row' : 'none'};">
          <td colspan="14">
            ${detailRowContent}
          </td>
        </tr>`;
    }
  });

  html += '</tbody></table></div>';
  container.innerHTML = html;
}

function toggleJourneySegments(journeyId) {
  const rows = document.querySelectorAll(`.journey-segment-row[data-group="${journeyId}"]`);
  const btn = document.querySelector(`.journey-parent-row[data-group="${journeyId}"] .journey-expand-btn`);
  const isHidden = rows.length > 0 && rows[0].style.display === 'none';
  rows.forEach(r => r.style.display = isHidden ? 'table-row' : 'none');
  if (btn) btn.textContent = isHidden ? '▼' : '▶';
}

function toggleJourneyStatus(journeyId) { if (!window.isEditMode) return;
  const journey = findJourney(journeyId);
  if (journey) {
    const statusCycle = { 'planned': 'booked', 'booked': 'confirmed', 'confirmed': 'cancelled', 'cancelled': 'planned' }; const newStatus = statusCycle[journey.status] || 'planned';
    updateJourneyStatus(journeyId, newStatus);
    if (typeof rebuildCurrentView === 'function') rebuildCurrentView();
    else buildTransportTab();
  }
}

// â”€â”€â”€ ADD JOURNEY MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let _pendingSegments = [];
let _pendingJourneyId = null;
let _pendingJourneyName = ''; // Track the name when editing

function _syncJourneyModalActions() {
  const deleteBtn = document.getElementById('journeyDeleteBtn');
  const isExistingJourney = _pendingJourneyId ? journeys.some(j => j.journeyId === _pendingJourneyId) : false;
  if (deleteBtn) deleteBtn.style.display = isExistingJourney ? 'inline-flex' : 'none';
}

// Load an existing journey into the modal
function editJourney(journeyId) {
  const segs = findJourneySegments(journeyId);
  if (!segs || segs.length === 0) return;

  const modal = document.getElementById('journey-modal');
  if (!modal) return;

  // Deep copy to prevent mutating active data until saved
  const segmentsCopy = JSON.parse(JSON.stringify(segs));

  _pendingJourneyId = journeyId;
  _pendingJourneyName = segmentsCopy[0].journeyName || '';
  _populateJourneyCityDropdowns();

  // Multi-leg: all segments go into array, first one loaded into form for editing
  _pendingSegments = segmentsCopy;
  _activeSegmentIndex = segmentsCopy.length > 0 ? 0 : -1;
  if (segmentsCopy.length > 0) {
    _loadSegmentIntoForm(segmentsCopy[0]);
  }

  _updateSegmentList();
  _syncJourneyModalActions();

  // Update journey title display
  const titleEl = document.getElementById('journeyTitleDisplay');
  if (titleEl) {
    titleEl.textContent = _pendingJourneyName || 'New Journey';
  }

  const header = modal.querySelector('.modal-header h2');
  if (header) header.textContent = '✈️ Edit journey';

  modal.style.display = 'flex';
  const modalBody = modal.querySelector('.modal-body');
  if (modalBody) modalBody.scrollTop = 0;
  const pendingList = document.getElementById('pendingSegmentsList');
  if (pendingList) pendingList.scrollTop = 0;
}

// Track if form is "dirty" (has unsaved user changes)
let _journeyFormDirty = false;

// Helper to fill the form inputs
function _loadSegmentIntoForm(seg) {
  _journeyFormDirty = false; // Reset dirty flag when loading form
  selectJourneyType(seg.transportType || 'flight');

  document.getElementById('journeyFromCity').value = seg.fromLocation || '';
  document.getElementById('journeyToCity').value = seg.toLocation || '';
  document.getElementById('journeyFromAddress').value = seg.fromAddress || '';
  document.getElementById('journeyToAddress').value = seg.toAddress || '';
  document.getElementById('journeyDateFrom').value = seg.departureDate || '';
  document.getElementById('journeyTimeFrom').value = seg.departureTime || '';
  document.getElementById('journeyDateTo').value = seg.arrivalDate || '';
  document.getElementById('journeyTimeTo').value = seg.arrivalTime || '';
  document.getElementById('journeyProvider').value = seg.provider || '';
  document.getElementById('journeyRouteCode').value = seg.routeCode || '';
  document.getElementById('journeyCost').value = seg.cost || '0';
  document.getElementById('journeyNotes').value = seg.notes || '';
  document.getElementById('journeyBookingRef').value = seg.bookingReference || '';
  document.getElementById('journeyStatus').value = normalizeItemStatus(seg.status);
}

// Track which segment is currently active (0-based index for segments in pending, -1 if form is new)
let _activeSegmentIndex = -1;

// Allow clicking any segment pill to switch between segments
function editPendingSegment(index) {
  // If clicking the same segment, do nothing
  if (_activeSegmentIndex === index) return;

  // First, save the current form data back to its position
  const currentFrom = document.getElementById('journeyFromCity')?.value;
  const currentTo = document.getElementById('journeyToCity')?.value;

  if (currentTo && currentTo !== '' && _activeSegmentIndex >= 0 && _activeSegmentIndex < _pendingSegments.length) {
    const currentSeg = _buildJourneyObject(currentFrom, currentTo, _activeSegmentIndex + 1);
    _pendingSegments[_activeSegmentIndex] = currentSeg;
  }

  // Load the clicked segment into the form (don't remove it from array!)
  const clickedSeg = _pendingSegments[index];
  if (clickedSeg) {
    _loadSegmentIntoForm(clickedSeg);
    _activeSegmentIndex = index;
  }

  _journeyFormDirty = false;
  _updateSegmentList();
}

function selectJourneyType(type) {
  document.querySelectorAll('.transport-type-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.querySelector(`.transport-type-btn[data-type="${type}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  const hiddenInput = document.getElementById('journeyType');
  if (hiddenInput) hiddenInput.value = type;
}

function promptAddNewCity() {
  // Open the Manage Cities dialog instead of using browser prompts
  if (typeof openCityDialog === 'function') {
    openCityDialog();
  }
}

function _populateJourneyCityDropdowns() {
  const fromSelect = document.getElementById('journeyFromCity');
  const toSelect = document.getElementById('journeyToCity');
  const currentFrom = fromSelect?.value;
  const currentTo = toSelect?.value;

  let optionsHtml = '<option value="Home">🏠 Home</option>';
  if (typeof citiesData !== 'undefined') {
    [...citiesData].sort((a, b) => a.name.localeCompare(b.name)).forEach(city => {
      const flag = typeof getCityFlag === 'function' ? getCityFlag(city.name) : '📍';
      optionsHtml += `<option value="${city.name}">${flag} ${city.name}</option>`;
    });
  }

  if (fromSelect) {
    fromSelect.innerHTML = optionsHtml;
    if (currentFrom) fromSelect.value = currentFrom;
  }
  if (toSelect) {
    toSelect.innerHTML = '<option value="">-- Select city --</option>' + optionsHtml;
    if (currentTo) toSelect.value = currentTo;
  }
}

function openAddJourneyModal() {
  try {
    const modal = document.getElementById('journey-modal');
    if (!modal) return;

    _pendingJourneyId = 'jid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    _pendingSegments = [];
    _pendingJourneyName = ''; // Reset name
    _activeSegmentIndex = -1;

    _populateJourneyCityDropdowns();

    // Clear journey title display for new journey
    const titleEl = document.getElementById('journeyTitleDisplay');
    if (titleEl) {
      titleEl.textContent = 'New Journey';
    }

    _updateSegmentList();
    selectJourneyType('flight');
    _syncJourneyModalActions();

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('journeyDateFrom').value = today;
    document.getElementById('journeyDateTo').value = today;

    ['journeyTimeFrom','journeyTimeTo','journeyProvider','journeyRouteCode','journeyBookingRef','journeyCost','journeyNotes','journeyFromAddress','journeyToAddress']
        .forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = '';
        });

    const header = modal.querySelector('.modal-header h2');
    if (header) header.textContent = '✈️ Add journey';

    modal.style.display = 'flex';
    const modalBody = modal.querySelector('.modal-body');
    if (modalBody) modalBody.scrollTop = 0;
    const pendingList = document.getElementById('pendingSegmentsList');
    if (pendingList) pendingList.scrollTop = 0;
  } catch (e) {
    console.error('[openAddJourneyModal] Error:', e);
  }
}

function _updateSegmentList() {
  const trackerContainer = document.getElementById('segmentTracker');
  const summaryContainer = document.getElementById('pendingSegmentsList');
  const labelEl = document.getElementById('currentSegmentLabel');

  const totalSegments = _pendingSegments.length;

  // Update label to show current status
  if (labelEl) {
    if (_activeSegmentIndex >= 0 && _activeSegmentIndex < totalSegments) {
      const seg = _pendingSegments[_activeSegmentIndex];
      labelEl.innerHTML = `<span class="segment-index-badge">${_activeSegmentIndex + 1}</span> Editing: ${seg.fromLocation} → ${seg.toLocation}`;
    } else {
      labelEl.innerHTML = `<span class="segment-index-badge">${totalSegments + 1}</span> Segment ${totalSegments + 1} — entering details`;
    }
  }

  // Build the Pill Tracker at the top - ONLY show actual segments, NOT form segment
  if (trackerContainer) {
    let trackerHtml = '';

    _pendingSegments.forEach((seg, i) => {
      const isActive = _activeSegmentIndex === i;
      trackerHtml += `<div class="segment-pill ${isActive ? 'here' : 'behind'} is-clickable" onclick="editPendingSegment(${i})" title="${isActive ? 'Here now' : 'Behind you'}"><span class="pill-num">${i + 1}</span> ${seg.fromLocation} → ${seg.toLocation}</div>`;
      if (i < totalSegments - 1) {
        trackerHtml += '<div class="segment-arrow">➔</div>';
      }
    });

    trackerContainer.innerHTML = trackerHtml;
  }

  // Build the Summary Lines at the bottom
  if (summaryContainer) {
    if (_pendingSegments.length === 0) {
      summaryContainer.innerHTML = '';
      return;
    }

    summaryContainer.innerHTML = _pendingSegments.map((s, i) => {
      const isCurrent = _activeSegmentIndex === i;
      const depString = `${formatJourneyDate(s.departureDate)} ${s.departureTime || ''}`.trim();
      const arrString = `${formatJourneyDate(s.arrivalDate)} ${s.arrivalTime || ''}`.trim();
      const providerStr = `${s.provider} ${s.routeCode}`.trim();

      return `
      <div class="pending-segment-summary ${isCurrent ? 'is-current' : ''}">
        <span>✓ Segment ${i + 1}: ${s.fromLocation} ➔ ${s.toLocation}</span>
        <span class="pending-segment-separator">&bull;</span>
        <span>${depString} ➔ ${arrString}</span>
        ${providerStr ? `<span class="pending-segment-separator">&bull;</span><span>${providerStr}</span>` : ''}
        <button onclick="editPendingSegment(${i})" class="pending-segment-icon-btn pending-segment-icon-btn-edit" title="Edit leg">✎</button>
        <button onclick="removePendingSegment(${i})" class="pending-segment-icon-btn pending-segment-icon-btn-remove" title="Remove leg">&times;</button>
      </div>`;
    }).join('');
  }
}

function removePendingSegment(index) {
  _pendingSegments.splice(index, 1);
  // Adjust active segment index if needed
  if (_activeSegmentIndex >= _pendingSegments.length) {
    _activeSegmentIndex = _pendingSegments.length - 1;
  }
  // Update journey title if segments changed
  const titleEl = document.getElementById('journeyTitleDisplay');
  if (titleEl && _pendingSegments.length > 0) {
    titleEl.textContent = buildJourneyName(_pendingSegments);
  }
  _updateSegmentList();
}

function addSegmentToJourney() {
  const fromLocation = document.getElementById('journeyFromCity')?.value;
  const toLocation = document.getElementById('journeyToCity')?.value;
  if (!toLocation) { alert('Please select a destination for this segment'); return; }

  const seg = _buildJourneyObject(fromLocation, toLocation, _pendingSegments.length + 1);
  _pendingSegments.push(seg);
  // Update journey title when segments added
  const titleEl = document.getElementById('journeyTitleDisplay');
  if (titleEl) {
    titleEl.textContent = buildJourneyName(_pendingSegments);
  }
  _updateSegmentList();

  const fromSelect = document.getElementById('journeyFromCity');
  if (fromSelect && toLocation) fromSelect.value = toLocation;
  const toSelect = document.getElementById('journeyToCity');
  if (toSelect) toSelect.value = '';

  ['journeyTimeFrom','journeyTimeTo','journeyProvider','journeyRouteCode','journeyBookingRef','journeyCost','journeyNotes','journeyFromAddress','journeyToAddress'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  const arrDate = document.getElementById('journeyDateTo')?.value;
  if (arrDate) {
    const depEl = document.getElementById('journeyDateFrom');
    if (depEl) depEl.value = arrDate;
  }
  document.getElementById('journeyDateTo').value = '';
}

function _buildJourneyObject(fromLocation, toLocation, segmentOrder) {
  const transportType = document.getElementById('journeyType')?.value || 'flight';
  const dateFrom = document.getElementById('journeyDateFrom')?.value || '';
  const timeFrom = document.getElementById('journeyTimeFrom')?.value || '';
  const dateTo = document.getElementById('journeyDateTo')?.value || '';
  const timeTo = document.getElementById('journeyTimeTo')?.value || '';
  const provider = document.getElementById('journeyProvider')?.value.trim() || '';
  const routeCode = document.getElementById('journeyRouteCode')?.value.trim() || '';
  const bookingRef = document.getElementById('journeyBookingRef')?.value.trim() || '';
  const cost = document.getElementById('journeyCost')?.value.trim() || '0';
  const status = document.getElementById('journeyStatus')?.value || 'planned';
  const notes = document.getElementById('journeyNotes')?.value.trim() || '';
  const fromAddress = document.getElementById('journeyFromAddress')?.value.trim() || '';
  const toAddress = document.getElementById('journeyToAddress')?.value.trim() || '';

  const fromCity = typeof citiesData !== 'undefined' ? citiesData.find(c => c.name === fromLocation) : null;
  const toCity = typeof citiesData !== 'undefined' ? citiesData.find(c => c.name === toLocation) : null;

  return {
    id: 'journey_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    journeyId: _pendingJourneyId,
    journeyName: '',
    legId: '',
    dayDate: dateFrom,
    fromLocation: fromLocation,
    toLocation: toLocation,
    fromCityId: fromCity ? fromCity.id : '',
    toCityId: toCity ? toCity.id : '',
    departureDate: dateFrom,
    departureTime: timeFrom,
    arrivalDate: dateTo,
    arrivalTime: timeTo,
    transportType: transportType,
    provider: provider,
    routeCode: routeCode,
    status: status || 'planned',
    cost: cost,
    bookingReference: bookingRef,
    isMultiLeg: false,
    segmentOrder: segmentOrder,
    notes: notes,
    fromAddress: fromAddress,
    toAddress: toAddress,
    legs: []
  };
}

function closeJourneyModal() {
  const modal = document.getElementById('journey-modal');
  if (modal) modal.style.display = 'none';
  _pendingSegments = [];
  _pendingJourneyId = null;
  _pendingJourneyName = '';
  _journeyFormDirty = false;
  _syncJourneyModalActions();
}

function deleteJourneyFromModal() {
  if (!_pendingJourneyId) return;
  if (!confirm('Delete this journey?')) return;
  const journeyId = _pendingJourneyId;
  const hasGroup = journeys.some(j => j.journeyId === journeyId);
  if (hasGroup) {
    deleteJourneyGroup(journeyId);
  } else {
    const pendingIds = new Set(_pendingSegments.map(seg => seg.id).filter(Boolean));
    journeys = journeys.filter(j => !pendingIds.has(j.id));
    window.journeys = journeys;
    persistJourneys();
    if (typeof rebuildCurrentView === 'function') rebuildCurrentView();
  }
  closeJourneyModal();
}

function saveJourneyFromModal() {
  try {
    const fromLocation = document.getElementById('journeyFromCity')?.value;
    const toLocation = document.getElementById('journeyToCity')?.value;

    const hasFormData = toLocation && toLocation !== '';

    // If form is dirty and there's an active segment, save the current form data first
    let finalSegments = [..._pendingSegments];
    if (hasFormData && _activeSegmentIndex >= 0 && _activeSegmentIndex < finalSegments.length) {
      // Replace the active segment with current form data
      finalSegments[_activeSegmentIndex] = _buildJourneyObject(fromLocation, toLocation, _activeSegmentIndex + 1);
    } else if (hasFormData) {
      // Add new segment if no active segment
      finalSegments.push(_buildJourneyObject(fromLocation, toLocation, finalSegments.length + 1));
    }

    if (finalSegments.length === 0) {
      alert('Please add at least one segment, or fill in a From/To destination.');
      return;
    }

    const journeyName = buildJourneyName(finalSegments);

    const isMultiLeg = finalSegments.length > 1;

    const status = document.getElementById('journeyStatus')?.value || 'planned';

    finalSegments.forEach((seg, i) => {
      seg.journeyName = journeyName;
      seg.isMultiLeg = isMultiLeg;
      seg.journeyId = _pendingJourneyId;
      seg.segmentOrder = i + 1; // Ensure correct ordering
      seg.status = status; // Keep status in sync across all segments of the journey!
    });

    // EDIT FIX: Remove the old segments for this journeyId before saving
    journeys = journeys.filter(j => j.journeyId !== _pendingJourneyId);

    journeys.push(...finalSegments);
    window.journeys = journeys;
    persistJourneys();
    closeJourneyModal();
    buildTransportTab();
  } catch (e) {
    console.error('[saveJourneyFromModal] Error:', e);
    alert('Error saving journey: ' + e.message);
  }
}

// Expose to window
window.getLocationDisplayWithCode = getLocationDisplayWithCode;
window.getLocationCodeDisplay = getLocationCodeDisplay;
window.buildRouteChainWithCodes = buildRouteChainWithCodes;
window.buildJourneyName = buildJourneyName;
window.openAddJourneyModal = openAddJourneyModal;
window.closeJourneyModal = closeJourneyModal;
window.saveJourneyFromModal = saveJourneyFromModal;
window.deleteJourneyFromModal = deleteJourneyFromModal;
window.addSegmentToJourney = addSegmentToJourney;
window.removePendingSegment = removePendingSegment;
window.toggleJourneySegments = toggleJourneySegments;
window.toggleTransportGroupDetails = toggleTransportGroupDetails;
window.toggleJourneyStatus = toggleJourneyStatus;
window.deleteJourney = deleteJourney;
window.deleteJourneyGroup = deleteJourneyGroup;
window.updateJourneyCost = updateJourneyCost;
window.updateJourneyBookingRef = updateJourneyBookingRef;
window.updateJourneyNotes = updateJourneyNotes;
window.buildTransportTab = buildTransportTab;
window.getDayJourneys = getDayJourneys;
window.getTransportIcon = getTransportIcon;
window.createJourneyFromTransportItem = createJourneyFromTransportItem;
window.importJourneys = importJourneys;
window.migrateJourneyCityIds = migrateJourneyCityIds;

window.selectJourneyType = selectJourneyType;
window.promptAddNewCity = promptAddNewCity;
window.editJourney = editJourney;
window.editPendingSegment = editPendingSegment;




