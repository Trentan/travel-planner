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

// Transport type icons
const TRANSPORT_ICONS = {
  flight: '✈️',
  train: '🚂',
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
  saveJourneys();
  return journey;
}

// Detect transport type from text
function detectTransportType(text) {
  if (!text) return 'other';
  const t = text.toLowerCase();
  if (t.includes('✈') || t.includes('flight') || t.includes('arrive') || t.includes('depart')) return 'flight';
  if (t.includes('🚂') || t.includes('train') || t.includes('rail') || t.includes('ice') || t.includes('obb') || t.includes('sbb')) return 'train';
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
function getDayJourneys(dayDate, fromLoc, toLoc) {
  if (typeof journeys === 'undefined' && typeof window !== 'undefined' && window.journeys) {
    journeys = window.journeys;
  }
  if (!Array.isArray(journeys)) return [];

  const seen = new Set();
  const results = [];

  journeys.forEach(j => {
    const depMatch = j.departureDate === dayDate || j.dayDate === dayDate;
    const routeMatch = !fromLoc || !toLoc ||
        j.fromLocation === fromLoc ||
        j.toLocation === toLoc;

    if (depMatch && routeMatch) {
      const key = j.journeyId || j.id;
      if (!seen.has(key)) {
        seen.add(key);
        results.push(j);
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
  const journey = findJourney(id);
  if (journey) {
    journey.status = newStatus;
    if (newStatus === 'planned') journey.bookingReference = '';
    saveJourneys();
    return journey;
  }
  return null;
}

function updateJourneyBookingRef(id, ref) {
  const journey = findJourney(id);
  if (journey) {
    journey.bookingReference = ref;
    saveJourneys();
    if (typeof rebuildCurrentView === 'function') rebuildCurrentView();
    return journey;
  }
  return null;
}

function updateJourneyCost(id, cost) {
  const journey = findJourney(id);
  if (journey) {
    journey.cost = cost;
    saveJourneys();
    if (typeof rebuildCurrentView === 'function') rebuildCurrentView();
    return journey;
  }
  return null;
}

function deleteJourney(id) {
  journeys = journeys.filter(j => j.id !== id);
  window.journeys = journeys;
  saveJourneys();
  if (typeof rebuildCurrentView === 'function') rebuildCurrentView();
}

function deleteJourneyGroup(journeyId) {
  journeys = journeys.filter(j => j.journeyId !== journeyId);
  window.journeys = journeys;
  saveJourneys();
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

// ─── BUILD TRANSPORT TAB ────────────────────────────────────────────────────

function buildTransportTab(cityFilter = null) {
  if (typeof journeys === 'undefined' || journeys === null) {
    journeys = (typeof window !== 'undefined' && window.journeys) ? window.journeys : [];
  }

  const container = document.getElementById('transport-table-container');
  if (!container) return;

  if (!Array.isArray(journeys) || journeys.length === 0) {
    const saved = localStorage.getItem('travelApp_journeys_v1');
    if (saved) {
      try { journeys = JSON.parse(saved); window.journeys = journeys; }
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
    <div class="transport-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
      <h3 style="margin:0; font-family:'Playfair Display',serif; color:#2C3E50;">✈️ Transport Itinerary</h3>
      <button class="action-btn" onclick="openAddJourneyModal()">+ Add Journey</button>
    </div>
  `;

  if (toShow.length === 0) {
    html += `<div class="empty-placeholder">
      <p>No journeys planned yet.</p>
      <p style="font-size:0.9rem;color:#666;margin-top:0.5rem;">Click "+ Add Journey" to add your first transport booking.</p>
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

  html += `<div class="data-table-wrapper">
    <table class="data-table">
      <thead>
        <tr>
          <th style="width:28px;"></th>
          <th>Journey</th>
          <th>Type</th>
          <th>Date</th>
          <th>Route</th>
          <th>Departs</th>
          <th>Arrives</th>
          <th>Provider</th>
          <th>Route #</th>
          <th>Cost</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>`;

  groupOrder.forEach(gid => {
    const segs = groups[gid].sort((a, b) => (a.segmentOrder || 1) - (b.segmentOrder || 1));
    const isMultiLeg = segs.length > 1;
    const rep = segs[0];

    const statusColor = rep.status === 'booked' ? '#27AE60' : '#E67E22';
    const statusText = rep.status === 'booked' ? 'Booked' : 'Planned';

    const route = isMultiLeg
    ? buildRouteChainWithCodes(segs)
    : `${getLocationCodeDisplay(rep.fromLocation)} → ${getLocationCodeDisplay(rep.toLocation)}`;
    const firstDepDate = formatJourneyDate(rep.departureDate) || rep.dayDate || '—';
const firstDepTime = rep.departureTime || '';
const firstDep = firstDepDate !== '—' && firstDepTime ? firstDepDate + ' ' + firstDepTime : firstDepDate;
    const lastSeg = segs[segs.length - 1];
    const lastArr = formatJourneyDate(lastSeg.arrivalDate) || '—';
    const lastArrTime = lastSeg.arrivalTime || '—';

    const totalCost = segs.reduce((sum, s) => sum + (parseFloat(s.cost) || 0), 0);

    const icon = isMultiLeg ? '✈️' : getTransportIcon(rep.transportType);

    const nameDisplay = rep.journeyName
        ? (rep.journeyName.length > 22 ? rep.journeyName.substring(0, 22) + '…' : rep.journeyName)
        : '—';

    const expandBtn = isMultiLeg
        ? `<button class="journey-expand-btn" onclick="toggleJourneySegments('${gid}')" title="Show/hide segments" style="background:none;border:none;cursor:pointer;font-size:0.85rem;padding:2px 4px;">▶</button>`
        : '';

    html += `
      <tr class="journey-parent-row" data-group="${gid}" style="border-left:3px solid ${statusColor};">
        <td>${expandBtn}</td>
        <td class="journey-name-col" title="${rep.journeyName || ''}">${nameDisplay}${durationDisplay}${isMultiLeg ? ` <span style="font-size:0.7rem;background:#e8f0fe;color:#3c5a99;padding:1px 5px;border-radius:8px;">${segs.length} legs</span>` : ''}</td>
        <td>${icon}</td>
        <td class="date-col">${firstDep}</td>
        <td class="route-col">${route}</td>
        <td class="date-col">${firstDep}</td>
        <td>${lastArr !== '—' ? lastArr + ' ' + lastArrTime : '—'}</td>
        <td>${rep.provider || '—'}</td>
        <td>${isMultiLeg ? '—' : (rep.routeCode || '—')}</td>
        <td class="budget-field">$<span contenteditable="${isEditMode}" onblur="updateJourneyCost('${rep.id}', this.innerText); buildTransportTab();">${isMultiLeg ? totalCost.toFixed(0) : (rep.cost || '0')}</span></td>
        <td>
          <span class="status-badge" style="background:${statusColor};cursor:pointer;" onclick="toggleJourneyStatus('${rep.id}')">
            ${statusText}
          </span>
          ${rep.bookingReference ? `<br><span class="booking-ref" style="font-family:monospace; font-size:0.75rem; color:#666;">${rep.bookingReference}</span>` : ""}
        </td>
        <td>
          <input type="text" value="${rep.bookingReference || ''}" placeholder="Ref #"
            onchange="updateJourneyBookingRef('${rep.id}', this.value); buildTransportTab();"
            style="width:70px;padding:2px 4px;font-size:0.8rem;border:1px solid #ddd;border-radius:3px;font-family:monospace;"
            ${isEditMode ? '' : 'readonly'}>
        </td>
        <td>
          <button class="action-btn small" onclick="editJourney('${gid}')" title="Edit journey" style="padding: 2px 6px; font-size: 0.8rem; margin-right: 4px; background: #e8f0fe; border-color: #3c5a99; color: #3c5a99;">✎</button>
          ${isMultiLeg
        ? `<button class="del-btn" onclick="if(confirm('Delete all ${segs.length} segments of this journey?')) { deleteJourneyGroup('${gid}'); buildTransportTab(); }" title="Delete journey">×</button>`
        : `<button class="del-btn" onclick="deleteJourney('${rep.id}'); buildTransportTab();" title="Delete">×</button>`}
        </td>
      </tr>`;

    if (isMultiLeg) {
      segs.forEach((seg, i) => {
        const segIcon = getTransportIcon(seg.transportType);
        const segDepDate = formatJourneyDate(seg.departureDate) || seg.dayDate || '—';
const segDepTime = seg.departureTime || '';
const segDep = segDepDate !== '—' && segDepTime ? segDepDate + ' ' + segDepTime : segDepDate;
        const segArr = formatJourneyDate(seg.arrivalDate) || '—';
        html += `
          <tr class="journey-segment-row" data-group="${gid}" style="display:none;background:#fafaf8;font-size:0.85rem;">
            <td></td>
            <td style="padding-left:2rem;color:#888;">↳ Leg ${i + 1}</td>
            <td>${segIcon}</td>
            <td class="date-col">${segDep}</td>
            <td class="route-col" style="color:#555;">${getLocationCodeDisplay(seg.fromLocation)} → ${getLocationCodeDisplay(seg.toLocation)}</td>
            <td class="date-col">${segDep}</td>
            <td>${segArr !== '—' ? segArr + ' ' + (seg.arrivalTime || '') : '—'}</td>
            <td>${seg.provider || '—'}</td>
            <td>${seg.routeCode || '—'}</td>
            <td class="budget-field" style="color:#888;">$<span contenteditable="${isEditMode}" onblur="updateJourneyCost('${seg.id}', this.innerText); buildTransportTab();">${seg.cost || '0'}</span></td>
            <td>—</td>
            <td>—</td>
            <td><button class="del-btn" onclick="deleteJourney('${seg.id}'); buildTransportTab();" title="Delete segment">×</button></td>
          </tr>`;
      });
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

function toggleJourneyStatus(journeyId) {
  const journey = findJourney(journeyId);
  if (journey) {
    const newStatus = journey.status === 'booked' ? 'planned' : 'booked';
    updateJourneyStatus(journeyId, newStatus);
    if (typeof rebuildCurrentView === 'function') rebuildCurrentView();
    else buildTransportTab();
  }
}

// ─── ADD JOURNEY MODAL ──────────────────────────────────────────────────────
let _pendingSegments = [];
let _pendingJourneyId = null;
let _pendingJourneyName = ''; // Track the name when editing

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

  if (segmentsCopy.length === 1) {
    // Single leg: load directly into form
    _pendingSegments = [];
    _loadSegmentIntoForm(segmentsCopy[0]);
  } else {
    // Multi-leg: put all but last into pending, load last into form
    const lastSeg = segmentsCopy.pop();
    _pendingSegments = segmentsCopy;
    _loadSegmentIntoForm(lastSeg);
  }

  _updateSegmentList();

  const header = modal.querySelector('.modal-header h2');
  if (header) header.textContent = '✈️ Edit journey';

  modal.style.display = 'flex';
}

// Helper to fill the form inputs
function _loadSegmentIntoForm(seg) {
  selectJourneyType(seg.transportType || 'flight');

  document.getElementById('journeyFromCity').value = seg.fromLocation || '';
  document.getElementById('journeyToCity').value = seg.toLocation || '';
  document.getElementById('journeyDateFrom').value = seg.departureDate || '';
  document.getElementById('journeyTimeFrom').value = seg.departureTime || '';
  document.getElementById('journeyDateTo').value = seg.arrivalDate || '';
  document.getElementById('journeyTimeTo').value = seg.arrivalTime || '';
  document.getElementById('journeyProvider').value = seg.provider || '';
  document.getElementById('journeyRouteCode').value = seg.routeCode || '';
  document.getElementById('journeyCost').value = seg.cost || '0';
  document.getElementById('journeyNotes').value = seg.notes || '';
  document.getElementById('journeyBookingRef').value = seg.bookingReference || '';
}

// Allow clicking a pending segment to load it back into the active form
function editPendingSegment(index) {
  const toLoc = document.getElementById('journeyToCity')?.value;
  if (toLoc) {
    // Save current form to pending before swapping
    addSegmentToJourney();
  }

  const seg = _pendingSegments.splice(index, 1)[0];
  _loadSegmentIntoForm(seg);
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
  const cityName = prompt("Enter new city name:");
  if (!cityName) return;

  const exists = typeof citiesData !== 'undefined' ? citiesData.find(c => c.name.toLowerCase() === cityName.toLowerCase()) : null;
  if (exists) {
    alert("City already exists!");
    const toSelect = document.getElementById('journeyToCity');
    if (toSelect) toSelect.value = exists.name;
    return;
  }

  const countryName = prompt(`Enter country for ${cityName} (optional):`) || '';

  if (typeof addOrUpdateCity === 'function') {
    const newCity = addOrUpdateCity(cityName, countryName);
    if (newCity) {
      if (typeof saveData === 'function') saveData(false);
      if (typeof buildCityNav === 'function') buildCityNav();
      if (typeof populateCityList === 'function') populateCityList();

      _populateJourneyCityDropdowns();

      const toSelect = document.getElementById('journeyToCity');
      if (toSelect) toSelect.value = newCity.name;
    }
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

    _populateJourneyCityDropdowns();
    _updateSegmentList();
    selectJourneyType('flight');

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('journeyDateFrom').value = today;
    document.getElementById('journeyDateTo').value = today;

    ['journeyTimeFrom','journeyTimeTo','journeyProvider','journeyRouteCode','journeyBookingRef','journeyCost','journeyNotes']
        .forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = '';
        });

    const header = modal.querySelector('.modal-header h2');
    if (header) header.textContent = '✈️ Add journey';

    modal.style.display = 'flex';
  } catch (e) {
    console.error('[openAddJourneyModal] Error:', e);
  }
}

function _updateSegmentList() {
  const trackerContainer = document.getElementById('segmentTracker');
  const summaryContainer = document.getElementById('pendingSegmentsList');
  const labelEl = document.getElementById('currentSegmentLabel');

  const currentLegNum = _pendingSegments.length + 1;

  if (labelEl) {
    labelEl.innerHTML = `<span style="background: #2980B9; color: white; border-radius: 50%; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.8rem; margin-right: 6px;">${currentLegNum}</span> Segment ${currentLegNum} — entering details`;
  }

  // Build the Pill Tracker at the top
  if (trackerContainer) {
    let trackerHtml = '';

    _pendingSegments.forEach((seg, i) => {
      trackerHtml += `
        <div class="segment-pill completed" title="${seg.transportType}: ${seg.fromLocation} to ${seg.toLocation}">
          <span class="pill-num">${i + 1}</span> ${seg.fromLocation} ➔ ${seg.toLocation}
        </div>
        <div class="segment-arrow">➔</div>
      `;
    });

    const fromLoc = _pendingSegments.length > 0 ? _pendingSegments[_pendingSegments.length-1].toLocation : '...';
    trackerHtml += `
      <div class="segment-pill active">
        <span class="pill-num">${currentLegNum}</span> ${fromLoc} ➔ ...
      </div>
    `;

    trackerContainer.innerHTML = trackerHtml;
  }

  // Build the Summary Lines at the bottom
  if (summaryContainer) {
    if (_pendingSegments.length === 0) {
      summaryContainer.innerHTML = '';
      return;
    }

    summaryContainer.innerHTML = _pendingSegments.map((s, i) => {
      const depString = `${formatJourneyDate(s.departureDate)} ${s.departureTime || ''}`.trim();
      const arrString = `${formatJourneyDate(s.arrivalDate)} ${s.arrivalTime || ''}`.trim();
      const providerStr = `${s.provider} ${s.routeCode}`.trim();

      return `
      <div style="font-size: 0.85rem; color: #666; text-align: center; margin-bottom: 4px; display: flex; justify-content: center; align-items: center; gap: 8px;">
        <span>✓ Segment ${i + 1}: ${s.fromLocation} ➔ ${s.toLocation}</span>
        <span style="color: #ccc;">•</span>
        <span>${depString} ➔ ${arrString}</span>
        ${providerStr ? `<span style="color: #ccc;">•</span><span>${providerStr}</span>` : ''}
        <button onclick="editPendingSegment(${i})" style="background:none; border:none; color:#3498DB; cursor:pointer; font-size:1rem; opacity:0.8; padding:0 4px;" title="Edit leg">✎</button>
        <button onclick="removePendingSegment(${i})" style="background:none; border:none; color:#E74C3C; cursor:pointer; font-size:1rem; opacity:0.6; padding:0 4px;" title="Remove leg">×</button>
      </div>`;
    }).join('');
  }
}

function removePendingSegment(index) {
  _pendingSegments.splice(index, 1);
  _updateSegmentList();
}

function addSegmentToJourney() {
  const fromLocation = document.getElementById('journeyFromCity')?.value;
  const toLocation = document.getElementById('journeyToCity')?.value;
  if (!toLocation) { alert('Please select a destination for this segment'); return; }

  const seg = _buildJourneyObject(fromLocation, toLocation, _pendingSegments.length + 1);
  _pendingSegments.push(seg);
  _updateSegmentList();

  const fromSelect = document.getElementById('journeyFromCity');
  if (fromSelect && toLocation) fromSelect.value = toLocation;
  const toSelect = document.getElementById('journeyToCity');
  if (toSelect) toSelect.value = '';

  ['journeyTimeFrom','journeyTimeTo','journeyProvider','journeyRouteCode'].forEach(id => {
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
  const notes = document.getElementById('journeyNotes')?.value.trim() || '';

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
    status: 'planned',
    cost: cost,
    bookingReference: bookingRef,
    isMultiLeg: false,
    segmentOrder: segmentOrder,
    notes: notes,
    legs: []
  };
}

function closeJourneyModal() {
  const modal = document.getElementById('journey-modal');
  if (modal) modal.style.display = 'none';
  _pendingSegments = [];
  _pendingJourneyId = null;
  _pendingJourneyName = '';
}

function saveJourneyFromModal() {
  try {
    const fromLocation = document.getElementById('journeyFromCity')?.value;
    const toLocation = document.getElementById('journeyToCity')?.value;

    const hasFormData = toLocation && toLocation !== '';

    let finalSegments = [..._pendingSegments];
    if (hasFormData) {
      finalSegments.push(_buildJourneyObject(fromLocation, toLocation, finalSegments.length + 1));
    }

    if (finalSegments.length === 0) {
      alert('Please add at least one segment, or fill in a From/To destination.');
      return;
    }

    const journeyName = buildJourneyName(finalSegments);

    const isMultiLeg = finalSegments.length > 1;

    finalSegments.forEach((seg, i) => {
      seg.journeyName = journeyName;
      seg.isMultiLeg = isMultiLeg;
      seg.journeyId = _pendingJourneyId;
      seg.segmentOrder = i + 1; // Ensure correct ordering
    });

    // EDIT FIX: Remove the old segments for this journeyId before saving
    journeys = journeys.filter(j => j.journeyId !== _pendingJourneyId);

    journeys.push(...finalSegments);
    window.journeys = journeys;
    saveJourneys();
    closeJourneyModal();
    buildTransportTab();
  } catch (e) {
    console.error('[saveJourneyFromModal] Error:', e);
    alert('Error saving journey: ' + e.message);
  }
}

function rebuildCurrentView() {
  const activeTab = document.querySelector('.app-tab-btn.active');
  if (activeTab) {
    const tabType = activeTab.getAttribute('data-tab');
    if (tabType === 'transport') buildTransportTab(currentCityFilter);
    else if (tabType === 'accom' && typeof buildAccomTab === 'function') buildAccomTab(currentCityFilter);
    else if (tabType === 'budget' && typeof buildBudgetTab === 'function') buildBudgetTab();
    else if (tabType === 'packing' && typeof buildPackingTab === 'function') buildPackingTab();
    else if (tabType === 'itinerary') buildItinerary();
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
window.addSegmentToJourney = addSegmentToJourney;
window.removePendingSegment = removePendingSegment;
window.toggleJourneySegments = toggleJourneySegments;
window.toggleJourneyStatus = toggleJourneyStatus;
window.deleteJourney = deleteJourney;
window.deleteJourneyGroup = deleteJourneyGroup;
window.updateJourneyCost = updateJourneyCost;
window.updateJourneyBookingRef = updateJourneyBookingRef;
window.buildTransportTab = buildTransportTab;
window.getDayJourneys = getDayJourneys;
window.getTransportIcon = getTransportIcon;
window.createJourneyFromTransportItem = createJourneyFromTransportItem;
window.importJourneys = importJourneys;
window.rebuildCurrentView = rebuildCurrentView;
window.selectJourneyType = selectJourneyType;
window.promptAddNewCity = promptAddNewCity;
window.editJourney = editJourney;
window.editPendingSegment = editPendingSegment;