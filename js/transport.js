// Transport/Journey management module
// Supports rich journey display with times, providers, booking refs
// Multi-leg journeys: N segments share a journeyId and journeyName
// Note: journeys variable is declared in data.js for proper loading order

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
    fromCityId: fromCity ? fromCity.id : '',
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

// Get journeys for a specific day (for itinerary view)
// Returns the PARENT journey (unique journeyId) when a segment departs on this date,
// or any single-segment journey whose dayDate/departureDate matches.
function getDayJourneys(dayDate, fromLoc, toLoc) {
  if (typeof journeys === 'undefined' && typeof window !== 'undefined' && window.journeys) {
    journeys = window.journeys;
  }
  if (!Array.isArray(journeys)) return [];

  const seen = new Set();
  const results = [];

  journeys.forEach(j => {
    // Match: segment departs on this day, OR legacy dayDate match
    const depMatch = j.departureDate === dayDate || j.dayDate === dayDate;
    // Also match from/to if provided (loose — multi-leg may not match exactly)
    const routeMatch = !fromLoc || !toLoc ||
      j.fromLocation === fromLoc ||
      j.toLocation === toLoc;

    if (depMatch && routeMatch) {
      // Deduplicate by journeyId so multi-leg trips show once per day
      const key = j.journeyId || j.id;
      if (!seen.has(key)) {
        seen.add(key);
        results.push(j);
      }
    }
  });

  return results;
}

// Find journey by id
function findJourney(id) {
  return journeys.find(j => j.id === id);
}

// Find all segments sharing a journeyId
function findJourneySegments(journeyId) {
  return journeys
    .filter(j => j.journeyId === journeyId)
    .sort((a, b) => (a.segmentOrder || 1) - (b.segmentOrder || 1));
}

// Build a human-readable route chain for multi-leg: BNE → TPE → BKK → VIE
function buildRouteChain(segments) {
  if (!segments || segments.length === 0) return '';
  if (segments.length === 1) return segments[0].fromLocation + ' → ' + segments[0].toLocation;
  const stops = [segments[0].fromLocation];
  segments.forEach(s => stops.push(s.toLocation));
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

// Delete all segments of a multi-leg journey
function deleteJourneyGroup(journeyId) {
  journeys = journeys.filter(j => j.journeyId !== journeyId);
  window.journeys = journeys;
  saveJourneys();
  if (typeof rebuildCurrentView === 'function') rebuildCurrentView();
}

// Sort journeys: by first segment departure date then time
// For multi-leg, find the earliest segment for that journeyId
function getSortedJourneys() {
  // Build a map of journeyId -> earliest departure time
  const earliestByJourneyId = {};
  journeys.forEach(j => {
    const jid = j.journeyId || j.id;
    const dateStr = j.departureDate || j.dayDate || '';
    const timeStr = j.departureTime || '';
    const ts = dateStr ? (new Date(dateStr + ' 2026').getTime() || 0) : 0;
    if (!earliestByJourneyId[jid] || ts < earliestByJourneyId[jid]) {
      earliestByJourneyId[jid] = ts;
    }
  });

  return [...journeys].sort((a, b) => {
    const jidA = a.journeyId || a.id;
    const jidB = b.journeyId || b.id;
    const tsA = earliestByJourneyId[jidA] || 0;
    const tsB = earliestByJourneyId[jidB] || 0;
    if (tsA !== tsB) return tsA - tsB;
    // Within same group, sort by segmentOrder
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

  // Load from localStorage if empty
  if (!Array.isArray(journeys) || journeys.length === 0) {
    const saved = localStorage.getItem('travelApp_journeys_v1');
    if (saved) {
      try { journeys = JSON.parse(saved); window.journeys = journeys; }
      catch (e) { journeys = []; }
    } else { journeys = []; }
  }

  // Filter by city if specified
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

  // Group segments by journeyId
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
          <th>Ref</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>`;

  groupOrder.forEach(gid => {
    const segs = groups[gid].sort((a, b) => (a.segmentOrder || 1) - (b.segmentOrder || 1));
    const isMultiLeg = segs.length > 1;
    // Use the first segment as representative for single-leg display
    const rep = segs[0];

    const statusColor = rep.status === 'booked' ? '#27AE60' : '#E67E22';
    const statusText = rep.status === 'booked' ? 'Booked' : 'Planned';

    // For display: show full route chain across segments
    const route = isMultiLeg ? buildRouteChain(segs) : `${rep.fromLocation} → ${rep.toLocation}`;
    const firstDep = formatJourneyDate(rep.departureDate) || rep.dayDate || '—';
    const firstTime = rep.departureTime || '—';
    const lastSeg = segs[segs.length - 1];
    const lastArr = formatJourneyDate(lastSeg.arrivalDate) || '—';
    const lastArrTime = lastSeg.arrivalTime || '—';

    // Total cost across all segments
    const totalCost = segs.reduce((sum, s) => sum + (parseFloat(s.cost) || 0), 0);

    // Icon: show flight icon for multi-leg (most common), otherwise segment icon
    const icon = isMultiLeg ? '✈️' : getTransportIcon(rep.transportType);

    // Journey name display
    const nameDisplay = rep.journeyName
      ? (rep.journeyName.length > 22 ? rep.journeyName.substring(0, 22) + '…' : rep.journeyName)
      : '—';

    const expandBtn = isMultiLeg
      ? `<button class="journey-expand-btn" onclick="toggleJourneySegments('${gid}')" title="Show/hide segments" style="background:none;border:none;cursor:pointer;font-size:0.85rem;padding:2px 4px;">▶</button>`
      : '';

    // Parent row
    html += `
      <tr class="journey-parent-row" data-group="${gid}" style="border-left:3px solid ${statusColor};">
        <td>${expandBtn}</td>
        <td class="journey-name-col" title="${rep.journeyName || ''}">${nameDisplay}${isMultiLeg ? ` <span style="font-size:0.7rem;background:#e8f0fe;color:#3c5a99;padding:1px 5px;border-radius:8px;">${segs.length} legs</span>` : ''}</td>
        <td>${icon}</td>
        <td class="date-col">${firstDep}</td>
        <td class="route-col">${route}</td>
        <td>${firstTime}</td>
        <td>${lastArr !== '—' ? lastArr + ' ' + lastArrTime : '—'}</td>
        <td>${rep.provider || '—'}</td>
        <td>${isMultiLeg ? '—' : (rep.routeCode || '—')}</td>
        <td class="budget-field">$<span contenteditable="${isEditMode}" onblur="updateJourneyCost('${rep.id}', this.innerText); buildTransportTab();">${isMultiLeg ? totalCost.toFixed(0) : (rep.cost || '0')}</span></td>
        <td>
          <span class="status-badge" style="background:${statusColor};cursor:pointer;" onclick="toggleJourneyStatus('${rep.id}')">
            ${statusText}
          </span>
        </td>
        <td>
          <input type="text" value="${rep.bookingReference || ''}" placeholder="Ref #"
            onchange="updateJourneyBookingRef('${rep.id}', this.value); buildTransportTab();"
            style="width:70px;padding:2px 4px;font-size:0.8rem;border:1px solid #ddd;border-radius:3px;font-family:monospace;"
            ${isEditMode ? '' : 'readonly'}>
        </td>
        <td>
          ${isMultiLeg
            ? `<button class="del-btn" onclick="if(confirm('Delete all ${segs.length} segments of this journey?')) { deleteJourneyGroup('${gid}'); buildTransportTab(); }" title="Delete journey">×</button>`
            : `<button class="del-btn" onclick="deleteJourney('${rep.id}'); buildTransportTab();" title="Delete">×</button>`
          }
        </td>
      </tr>`;

    // Segment sub-rows (hidden by default for multi-leg)
    if (isMultiLeg) {
      segs.forEach((seg, i) => {
        const segIcon = getTransportIcon(seg.transportType);
        const segDep = formatJourneyDate(seg.departureDate) || seg.dayDate || '—';
        const segArr = formatJourneyDate(seg.arrivalDate) || '—';
        html += `
          <tr class="journey-segment-row" data-group="${gid}" style="display:none;background:#fafaf8;font-size:0.85rem;">
            <td></td>
            <td style="padding-left:2rem;color:#888;">↳ Leg ${i + 1}</td>
            <td>${segIcon}</td>
            <td class="date-col">${segDep}</td>
            <td class="route-col" style="color:#555;">${seg.fromLocation} → ${seg.toLocation}</td>
            <td>${seg.departureTime || '—'}</td>
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

// Toggle visibility of segment sub-rows for a journey group
function toggleJourneySegments(journeyId) {
  const rows = document.querySelectorAll(`.journey-segment-row[data-group="${journeyId}"]`);
  const btn = document.querySelector(`.journey-parent-row[data-group="${journeyId}"] .journey-expand-btn`);
  const isHidden = rows.length > 0 && rows[0].style.display === 'none';
  rows.forEach(r => r.style.display = isHidden ? 'table-row' : 'none');
  if (btn) btn.textContent = isHidden ? '▼' : '▶';
}

// Toggle journey status
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
// Holds segments being built before final save
let _pendingSegments = [];
let _pendingJourneyId = null;

function openAddJourneyModal() {
  console.log('[openAddJourneyModal] Called');
  try {
    const modal = document.getElementById('journey-modal');
    if (!modal) {
      console.error('[openAddJourneyModal] Modal element not found!');
      alert('Journey modal HTML not found. Please check the modal is defined in index.html');
      return;
    }

    // Fresh session: new journeyId, clear pending segments
    _pendingJourneyId = 'jid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    _pendingSegments = [];
    _updateSegmentList();

    // Populate city dropdowns
    const fromSelect = document.getElementById('journeyFromCity');
    const toSelect = document.getElementById('journeyToCity');

    if (fromSelect) {
      fromSelect.innerHTML = '<option value="Home">🏠 Home</option>';
      if (typeof citiesData !== 'undefined') {
        citiesData.forEach(city => {
          const flag = typeof getCityFlag === 'function' ? getCityFlag(city.name) : '';
          const opt = document.createElement('option');
          opt.value = city.name;
          opt.textContent = `${flag} ${city.name}`;
          fromSelect.appendChild(opt);
        });
      }
    }

    if (toSelect) {
      toSelect.innerHTML = '<option value="">-- Select destination --</option>';
      if (typeof citiesData !== 'undefined') {
        citiesData.forEach(city => {
          const flag = typeof getCityFlag === 'function' ? getCityFlag(city.name) : '';
          const opt = document.createElement('option');
          opt.value = city.name;
          opt.textContent = `${flag} ${city.name}`;
          toSelect.appendChild(opt);
        });
      }
    }

    // Reset form fields
    ['journeyType','journeyDateFrom','journeyTimeFrom','journeyDateTo','journeyTimeTo',
     'journeyProvider','journeyRouteCode','journeyCost','journeyNotes','journeyName']
      .forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.tagName === 'SELECT' ? (el.value = 'flight') : (el.value = ''); }
      });

    modal.style.display = 'flex';
    console.log('[openAddJourneyModal] Modal opened, journeyId:', _pendingJourneyId);
  } catch (e) {
    console.error('[openAddJourneyModal] Error:', e);
    alert('Error opening journey modal: ' + e.message);
  }
}

// Render the pending segments list inside the modal
function _updateSegmentList() {
  let container = document.getElementById('pendingSegmentsList');
  if (!container) return; // modal may not have this element yet; it's injected below

  if (_pendingSegments.length === 0) {
    container.innerHTML = '<p style="color:#999;font-size:0.85rem;font-style:italic;">No segments added yet.</p>';
    return;
  }

  container.innerHTML = _pendingSegments.map((s, i) => `
    <div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:#f0f4f8;border-radius:6px;margin-bottom:6px;">
      <span style="font-size:0.75rem;font-weight:600;color:#2C3E50;">Leg ${i + 1}</span>
      <span style="font-size:0.75rem;">${getTransportIcon(s.transportType)}</span>
      <span style="flex:1;font-size:0.85rem;">${s.fromLocation} → ${s.toLocation}</span>
      <span style="font-size:0.75rem;color:#888;font-family:monospace;">${s.departureDate} ${s.departureTime}</span>
      <button onclick="removePendingSegment(${i})" style="background:none;border:none;color:#E74C3C;cursor:pointer;font-size:1rem;opacity:0.5;" title="Remove">×</button>
    </div>
  `).join('');
}

function removePendingSegment(index) {
  _pendingSegments.splice(index, 1);
  _updateSegmentList();
}

// Add current form values as a segment (without saving yet)
function addSegmentToJourney() {
  const fromLocation = document.getElementById('journeyFromCity')?.value;
  const toLocation = document.getElementById('journeyToCity')?.value;
  if (!toLocation) { alert('Please select a destination for this segment'); return; }

  const seg = _buildJourneyObject(fromLocation, toLocation, _pendingSegments.length + 1);
  _pendingSegments.push(seg);
  _updateSegmentList();

  // Auto-advance: set From to the just-added To city for next segment
  const fromSelect = document.getElementById('journeyFromCity');
  if (fromSelect && toLocation) fromSelect.value = toLocation;
  const toSelect = document.getElementById('journeyToCity');
  if (toSelect) toSelect.value = '';

  // Clear time/date/provider/route fields but keep dates as starting point
  ['journeyTimeFrom','journeyTimeTo','journeyProvider','journeyRouteCode'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  // Shift dates: arrival date becomes next departure date
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
  const cost = document.getElementById('journeyCost')?.value.trim() || '0';
  const notes = document.getElementById('journeyNotes')?.value.trim() || '';

  const fromCity = typeof citiesData !== 'undefined' ? citiesData.find(c => c.name === fromLocation) : null;
  const toCity = typeof citiesData !== 'undefined' ? citiesData.find(c => c.name === toLocation) : null;

  return {
    id: 'journey_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    journeyId: _pendingJourneyId,
    journeyName: '', // set on final save
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
    bookingReference: '',
    isMultiLeg: false, // set on final save
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
}

function saveJourneyFromModal() {
  try {
    const fromLocation = document.getElementById('journeyFromCity')?.value;
    const toLocation = document.getElementById('journeyToCity')?.value;

    // If form still has unsaved fields (to/from filled), treat as an implicit single segment
    const hasFormData = toLocation && toLocation !== '';

    // Determine final segments array
    let finalSegments = [..._pendingSegments];
    if (hasFormData) {
      // Add the current form as the last (or only) segment
      finalSegments.push(_buildJourneyObject(fromLocation, toLocation, finalSegments.length + 1));
    }

    if (finalSegments.length === 0) {
      alert('Please add at least one segment, or fill in a From/To destination.');
      return;
    }

    // Journey name: user-defined or auto-generated from route chain
    let journeyName = document.getElementById('journeyName')?.value.trim() || '';
    if (!journeyName) {
      journeyName = buildRouteChain(finalSegments);
    }

    const isMultiLeg = finalSegments.length > 1;

    // Stamp journeyName and isMultiLeg onto all segments
    finalSegments.forEach(seg => {
      seg.journeyName = journeyName;
      seg.isMultiLeg = isMultiLeg;
      seg.journeyId = _pendingJourneyId;
    });

    journeys.push(...finalSegments);
    window.journeys = journeys;
    saveJourneys();
    closeJourneyModal();
    buildTransportTab();
    console.log(`[saveJourneyFromModal] Saved ${finalSegments.length} segment(s) for journey "${journeyName}"`);
  } catch (e) {
    console.error('[saveJourneyFromModal] Error:', e);
    alert('Error saving journey: ' + e.message);
  }
}

// Rebuild current view helper
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
