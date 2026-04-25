// Transport/Journey management module
// Supports rich journey display with times, providers, booking refs
// Note: journeys variable is declared in data.js for proper loading order

// Transport type icons
const TRANSPORT_ICONS = {
  flight: '✈️',
  train: '🚂',
  car: '🚗',
  ferry: '⛴️',
  bus: '🚌',
  walk: '🚶',
  other: '🚌'
};

function getTransportIcon(type) {
  return TRANSPORT_ICONS[type] || TRANSPORT_ICONS.other;
}

// Initialize journeys from localStorage - called by data.js
// Note: data.js now loads journeys before initData() completes
// This function is kept for backwards compatibility
function initJourneys() {
  // Only load from localStorage if journeys is empty (prevents overwriting already loaded data)
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
        window.journeys = journeys; // sync to window
        console.log(`[Journeys] Loaded ${journeys.length} journeys from localStorage`);
      } else {
        journeys = [];
        window.journeys = journeys;
        console.log('[Journeys] No journeys found in localStorage');
      }
    } catch (e) {
      console.error('[Journeys] Failed to parse journeys:', e);
      journeys = [];
      window.journeys = journeys;
    }
  } else {
    journeys = [];
    window.journeys = journeys;
    console.log('[Journeys] No journeys in localStorage (key: travelApp_journeys_v1)');
  }
}

// Import journeys from JSON data (called during importJSON)
function importJourneys(journeysData) {
  if (journeysData && Array.isArray(journeysData)) {
    journeys = journeysData;
    window.journeys = journeys; // sync to window
    saveJourneys();
  }
}

function saveJourneys() {
  localStorage.setItem('travelApp_journeys_v1', JSON.stringify(journeys));
  window.journeys = journeys; // sync to window
}

// Create a new journey from transport item data
function createJourneyFromTransportItem(item, legId, dayDate, fromLoc, toLoc) {
  // Lookup city IDs from citiesData
  const fromCity = citiesData.find(c => c.name === fromLoc);
  const toCity = citiesData.find(c => c.name === toLoc);

  const journey = {
    id: 'journey_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
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
    notes: item.text,
    legs: []
  };
  journeys.push(journey);
  window.journeys = journeys; // sync to window
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
  if (t.includes('🚶') || t.includes('walk')) return 'walk';
  return 'other';
}

// Get journeys for a specific day
function getDayJourneys(dayDate, fromLoc, toLoc) {
  // Ensure journeys exists
  if (typeof journeys === 'undefined' && typeof window !== 'undefined' && window.journeys) {
    journeys = window.journeys;
  }
  if (!Array.isArray(journeys)) {
    console.warn('[Journeys] journeys array not initialized, returning empty');
    return [];
  }
  const matches = journeys.filter(j => j.dayDate === dayDate && j.fromLocation === fromLoc && j.toLocation === toLoc);
  if (matches.length === 0) {
    console.log(`[Journeys] No match for dayDate="${dayDate}", from="${fromLoc}", to="${toLoc}". Total journeys: ${journeys.length}`);
  }
  return matches;
}

// Find journey by id
function findJourney(id) {
  return journeys.find(j => j.id === id);
}

// Update journey status (booking confirmed/planned)
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

// Update journey booking reference
function updateJourneyBookingRef(id, ref) {
  const journey = findJourney(id);
  if (journey) {
    journey.bookingReference = ref;
    saveJourneys();
    // Rebuild current view to reflect changes
    if (typeof rebuildCurrentView === 'function') {
      rebuildCurrentView();
    }
    return journey;
  }
  return null;
}

// Update journey cost
function updateJourneyCost(id, cost) {
  const journey = findJourney(id);
  if (journey) {
    journey.cost = cost;
    saveJourneys();
    // Rebuild current view to reflect changes
    if (typeof rebuildCurrentView === 'function') {
      rebuildCurrentView();
    }
    return journey;
  }
  return null;
}

// Delete journey
function deleteJourney(id) {
  journeys = journeys.filter(j => j.id !== id);
  window.journeys = journeys; // sync to window
  saveJourneys();
  // Rebuild current view to reflect changes
  if (typeof rebuildCurrentView === 'function') {
    rebuildCurrentView();
  }
}

// Get sorted journeys (by departure date then time)
function getSortedJourneys() {
  return [...journeys].sort((a, b) => {
    const dateA = a.departureDate ? new Date(a.departureDate).getTime() : 0;
    const dateB = b.departureDate ? new Date(b.departureDate).getTime() : 0;
    if (dateA !== dateB) return dateA - dateB;
    const timeA = a.departureTime || '';
    const timeB = b.departureTime || '';
    return timeA.localeCompare(timeB);
  });
}

// Format date for display
function formatJourneyDate(dateStr) {
  if (!dateStr) return '';
  // If already in DD MMM format (e.g., "15 Jun"), return as-is
  if (typeof dateStr === 'string' && dateStr.match(/^\d+\s+[A-Za-z]{3}$/)) {
    return dateStr;
  }
  // Otherwise try to parse and format
  try {
    const d = new Date(dateStr);
    return `${d.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]}`;
  } catch (e) {
    return dateStr;
  }
}

// Format time for display
function formatJourneyTime(timeStr) {
  if (!timeStr) return '';
  return timeStr;
}

// Calculate duration between departure and arrival
function calculateDuration(depDate, depTime, arrDate, arrTime) {
  if (!depDate || !arrDate) return '';
  // Simplified - just return the hours/minutes if we can parse them
  if (depTime && arrTime) {
    const dep = parseTime(depTime);
    const arr = parseTime(arrTime);
    if (dep && arr) {
      let diff = arr - dep;
      if (diff < 0) diff += 24 * 60; // next day
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
  if (match) {
    return parseInt(match[1]) * 60 + parseInt(match[2]);
  }
  return null;
}

// Build Transport Tab - Table format with columns
function buildTransportTab(cityFilter = null) {
  // Ensure journeys exists (for backwards compatibility)
  if (typeof journeys === 'undefined' || journeys === null) {
    if (typeof window !== 'undefined' && window.journeys) {
      journeys = window.journeys;
    } else {
      journeys = [];
    }
  }
  console.log('[buildTransportTab] Called. journeys:', typeof journeys, journeys?.length, 'cityFilter:', cityFilter);
  const container = document.getElementById('transport-table-container');
  if (!container) {
    console.error('[buildTransportTab] No container found!');
    return;
  }

  // Ensure journeys is initialized from localStorage if empty
  if (!Array.isArray(journeys) || journeys.length === 0) {
    console.log('[buildTransportTab] journeys empty, attempting to load from localStorage...');
    const saved = localStorage.getItem('travelApp_journeys_v1');
    if (saved) {
      try {
        journeys = JSON.parse(saved);
        window.journeys = journeys; // sync to window
        console.log('[buildTransportTab] Loaded', journeys.length, 'journeys from localStorage');
      } catch (e) {
        console.error('[buildTransportTab] Failed to parse journeys:', e);
        journeys = [];
      }
    } else {
      journeys = [];
    }
  }

  // Filter by city if specified
  let journeysToShow = getSortedJourneys();
  if (cityFilter && cityFilter !== 'all') {
    journeysToShow = journeysToShow.filter(j =>
      j.fromCityId === cityFilter || j.toCityId === cityFilter
    );
    console.log(`[buildTransportTab] Filtered to ${journeysToShow.length} journeys for city ${cityFilter}`);
  }

  const sorted = journeysToShow;
  console.log('[buildTransportTab] Sorted journeys:', sorted.length);

  let html = `
    <div class="transport-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <h3 style="margin: 0; font-family: 'Playfair Display', serif; color: #2C3E50;">✈️ Transport Itinerary</h3>
      <button class="action-btn" onclick="openAddJourneyModal()">+ Add Journey</button>
    </div>
  `;

  if (sorted.length === 0) {
    html += `
      <div class="empty-placeholder">
        <p>No journeys planned yet.</p>
        <p style="font-size: 0.9rem; color: #666; margin-top: 0.5rem;">Click "+ Add Journey" to add your first transport booking.</p>
      </div>
    `;
  } else {
    html += `
      <div class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Date</th>
              <th>Route</th>
              <th>Time</th>
              <th>Provider</th>
              <th>Route #</th>
              <th>Cost</th>
              <th>Status</th>
              <th>Booking Ref</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
    `;

    sorted.forEach(journey => {
      const icon = getTransportIcon(journey.transportType);
      const statusColor = journey.status === 'booked' ? '#27AE60' : '#E67E22';
      const statusText = journey.status === 'booked' ? 'Booked' : 'Planned';
      const depDate = formatJourneyDate(journey.departureDate) || journey.dayDate || '—';
      const depTime = journey.departureTime || '—';
      const arrTime = journey.arrivalTime || '';
      const timeDisplay = arrTime ? `${depTime} → ${arrTime}` : depTime;
      const route = `${journey.fromLocation} → ${journey.toLocation}`;

      html += `
        <tr data-journey-id="${journey.id}">
          <td>${icon}</td>
          <td class="date-col">${depDate}</td>
          <td class="route-col">${route}</td>
          <td>${timeDisplay}</td>
          <td>${journey.provider || '—'}</td>
          <td>${journey.routeCode || '—'}</td>
          <td class="budget-field">$<span contenteditable="${isEditMode}" onblur="updateJourneyCost('${journey.id}', this.innerText); buildTransportTab();">${journey.cost || '0'}</span></td>
          <td>
            <span class="status-badge" style="background: ${statusColor}; cursor: pointer;"
              onclick="toggleJourneyStatus('${journey.id}')">
              ${statusText}
            </span>
          </td>
          <td>
            <input type="text" value="${journey.bookingReference || ''}" placeholder="Ref #"
              onchange="updateJourneyBookingRef('${journey.id}', this.value); buildTransportTab();"
              style="width: 90px; padding: 2px 6px; font-size: 0.85rem; border: 1px solid #ddd; border-radius: 3px; font-family: monospace;"
              ${isEditMode ? '' : 'readonly'}>
          </td>
          <td>
            <button class="del-btn" onclick="deleteJourney('${journey.id}'); buildTransportTab();" title="Delete">×</button>
          </td>
        </tr>
      `;
    });

    html += '</tbody></table></div>';
  }

  container.innerHTML = html;
}

// Toggle journey status
function toggleJourneyStatus(journeyId) {
  const journey = findJourney(journeyId);
  if (journey) {
    const newStatus = journey.status === 'booked' ? 'planned' : 'booked';
    updateJourneyStatus(journeyId, newStatus);
    if (typeof rebuildCurrentView === 'function') {
      rebuildCurrentView();
    } else {
      buildTransportTab();
    }
  }
}

// Stub for add journey modal
function openAddJourneyModal() {
  alert('Add Journey modal coming soon. For now, add transport items in the itinerary days.');
}

// Rebuild current view helper
function rebuildCurrentView() {
  const activeTab = document.querySelector('.app-tab-btn.active');
  if (activeTab) {
    const tabType = activeTab.getAttribute('data-tab');
    if (tabType === 'transport') {
      buildTransportTab(currentCityFilter);
    } else if (tabType === 'accom') {
      buildAccomTab(currentCityFilter);
    } else if (tabType === 'budget') {
      buildBudgetTab();
    } else if (tabType === 'packing') {
      buildPackingTab();
    } else if (tabType === 'itinerary') {
      buildItinerary();
    }
  }
}
