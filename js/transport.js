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
  const journey = {
    id: 'journey_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    legId: legId,
    dayDate: dayDate,
    fromLocation: fromLoc,
    toLocation: toLoc,
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
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
}

// Format time for display
function formatJourneyTime(timeStr) {
  if (!timeStr) return '';
  return timeStr;
}

// Calculate duration between departure and arrival
function calculateDuration(depDate, depTime, arrDate, arrTime) {
  if (!depDate || !arrDate) return '';

  const dep = new Date(`${depDate} ${depTime || '00:00'}`);
  const arr = new Date(`${arrDate} ${arrTime || '00:00'}`);

  if (isNaN(dep.getTime()) || isNaN(arr.getTime())) return '';

  const diffMs = arr - dep;
  if (diffMs < 0) return '';

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

// Build Transport Tab - displays journeys
function buildTransportTab() {
  // Ensure journeys exists (for backwards compatibility)
  if (typeof journeys === 'undefined' || journeys === null) {
    if (typeof window !== 'undefined' && window.journeys) {
      journeys = window.journeys;
    } else {
      journeys = [];
    }
  }
  console.log('[buildTransportTab] Called. journeys:', typeof journeys, journeys?.length);
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

  const sorted = getSortedJourneys();
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
    html += '<div class="journey-list">';

    sorted.forEach(journey => {
      const icon = getTransportIcon(journey.transportType);
      const statusColor = journey.status === 'booked' ? '#27AE60' : '#E67E22';
      const statusIcon = journey.status === 'booked' ? '✓' : '📝';
      const duration = calculateDuration(
        journey.departureDate, journey.departureTime,
        journey.arrivalDate, journey.arrivalTime
      );

      html += `
      <div class="journey-card" data-journey-id="${journey.id}" style="border-left-color: ${statusColor};">
        <div class="journey-card-header" onclick="toggleJourneyCard(this)">
          <div class="journey-route">
            <span class="journey-icon">${icon}</span>
            <span class="journey-locations">${journey.fromLocation} → ${journey.toLocation}</span>
          </div>
          <div class="journey-meta">
            ${journey.departureDate ? `<span class="journey-date">${formatJourneyDate(journey.departureDate)}</span>` : ''}
            ${journey.departureTime ? `<span class="journey-time">${formatJourneyTime(journey.departureTime)}</span>` : ''}
            ${duration ? `<span class="journey-duration">${duration}</span>` : ''}
            <span class="journey-status-badge" style="background: ${statusColor}; cursor: pointer;"
              onclick="event.stopPropagation(); toggleJourneyStatus('${journey.id}')">
              ${statusIcon} ${journey.status === 'booked' ? 'Booked' : 'Planned'}
            </span>
            <span class="journey-chevron">▼</span>
          </div>
        </div>
        <div class="journey-card-details">
          <div class="journey-detail-grid">
            <div class="journey-detail-item">
              <label>From</label>
              <div>${journey.fromLocation}</div>
            </div>
            <div class="journey-detail-item">
              <label>To</label>
              <div>${journey.toLocation}</div>
            </div>
            <div class="journey-detail-item">
              <label>Departure</label>
              <div>${formatJourneyDate(journey.departureDate)} ${journey.departureTime || ''}</div>
            </div>
            <div class="journey-detail-item">
              <label>Arrival</label>
              <div>${formatJourneyDate(journey.arrivalDate)} ${journey.arrivalTime || ''}</div>
            </div>
            <div class="journey-detail-item">
              <label>Provider</label>
              <div>${journey.provider || '—'}</div>
            </div>
            <div class="journey-detail-item">
              <label>Route #</label>
              <div>${journey.routeCode || '—'}</div>
            </div>
            <div class="journey-detail-item">
              <label>Status</label>
              <div><span class="status-badge" style="background: ${statusColor}; cursor: pointer;"
                onclick="event.stopPropagation(); toggleJourneyStatus('${journey.id}')">${statusIcon} ${journey.status === 'booked' ? 'Booked' : 'Planned'}</span></div>
            </div>
            <div class="journey-detail-item">
              <label>Cost</label>
              <div class="journey-cost">$
                <span contenteditable="${isEditMode}" onblur="updateJourneyCost('${journey.id}', this.innerText); buildTransportTab();">${journey.cost || '0'}</span>
              </div>
            </div>
          </div>

          ${journey.bookingReference || journey.status === 'booked' ? `
          <div class="journey-booking-ref">
            <label>Booking Reference:</label>
            <input type="text" class="booking-ref-input ${journey.status === 'booked' ? 'confirmed' : ''}"
              value="${journey.bookingReference || ''}" placeholder="Ref #"
              onchange="updateJourneyBookingRef('${journey.id}', this.value); buildTransportTab();"
              ${isEditMode ? '' : 'readonly'}>
          </div>
          ` : ''}

          ${journey.notes ? `
          <div class="journey-notes">
            <label>Notes:</label>
            <p>${journey.notes}</p>
          </div>
          ` : ''}

          ${journey.isMultiLeg && journey.legs && journey.legs.length > 0 ? `
          <div class="journey-legs-section">
            <h5>Journey Legs</h5>
            <div class="journey-legs-list">
              ${journey.legs.map((leg, idx) => `
                <div class="journey-leg-item">
                  <span class="leg-sequence">${idx + 1}</span>
                  <div class="leg-route">
                    <strong>${leg.fromLocation} → ${leg.toLocation}</strong>
                    <span class="leg-times">${leg.departureTime || '??:??'} → ${leg.arrivalTime || '??:??'}</span>
                  </div>
                  <div class="leg-provider">${leg.provider || '—'} ${leg.routeCode ? `(${leg.routeCode})` : ''}</div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <div class="journey-actions">
            <button class="action-btn small" onclick="event.stopPropagation();">Edit (coming soon)</button>
            <button class="action-btn small danger" onclick="event.stopPropagation(); deleteJourney('${journey.id}'); buildTransportTab();">Delete</button>
          </div>
        </div>
      </div>
      `;
    });

    html += '</div>';
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

// Journey card toggle
function toggleJourneyCard(header) {
  const card = header.closest('.journey-card');
  card.classList.toggle('expanded');
}

// Open Add Journey Modal
function openAddJourneyModal(editJourneyId = null) {
  const isEdit = editJourneyId !== null;
  const journey = isEdit ? findJourney(editJourneyId) : null;

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  modal.id = 'addJourneyModal';

  modal.innerHTML = `
    <div class="modal-content" style="max-width: 550px; max-height: 90vh; overflow-y: auto;">
      <div class="modal-header">
        <h2>${isEdit ? '✏️ Edit Journey' : '✈️ Add New Journey'}</h2>
        <button class="modal-close" onclick="closeAddJourneyModal()">×</button>
      </div>
      <div class="modal-body">
        <form id="journeyForm" class="journey-form">
          <div class="form-row">
            <div class="form-group">
              <label for="jFrom">From</label>
              <input type="text" id="jFrom" placeholder="e.g., Brisbane" value="${journey ? journey.fromLocation : ''}" required>
            </div>
            <div class="form-group">
              <label for="jTo">To</label>
              <input type="text" id="jTo" placeholder="e.g., London" value="${journey ? journey.toLocation : ''}" required>
            </div>
          </div>
          <div class="form-group">
            <label for="jType">Transport Type</label>
            <select id="jType">
              <option value="flight" ${journey?.transportType === 'flight' ? 'selected' : ''}>✈️ Flight</option>
              <option value="train" ${journey?.transportType === 'train' ? 'selected' : ''}>🚂 Train</option>
              <option value="bus" ${journey?.transportType === 'bus' ? 'selected' : ''}>🚌 Bus</option>
              <option value="ferry" ${journey?.transportType === 'ferry' ? 'selected' : ''}>⛴️ Ferry</option>
              <option value="car" ${journey?.transportType === 'car' ? 'selected' : ''}>🚗 Car</option>
              <option value="walk" ${journey?.transportType === 'walk' ? 'selected' : ''}>🚶 Walk</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="jDepDate">Departure Date</label>
              <input type="date" id="jDepDate" value="${journey ? journey.departureDate : ''}">
            </div>
            <div class="form-group">
              <label for="jDepTime">Departure Time</label>
              <input type="time" id="jDepTime" value="${journey ? journey.departureTime : ''}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="jArrDate">Arrival Date</label>
              <input type="date" id="jArrDate" value="${journey ? journey.arrivalDate : ''}">
            </div>
            <div class="form-group">
              <label for="jArrTime">Arrival Time</label>
              <input type="time" id="jArrTime" value="${journey ? journey.arrivalTime : ''}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="jProvider">Provider / Airline</label>
              <input type="text" id="jProvider" placeholder="e.g., Qantas" value="${journey ? journey.provider : ''}">
            </div>
            <div class="form-group">
              <label for="jRouteCode">Flight # / Route Code</label>
              <input type="text" id="jRouteCode" placeholder="e.g., QF9" value="${journey ? journey.routeCode : ''}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="jCost">Cost ($)</label>
              <input type="text" id="jCost" placeholder="0" value="${journey ? journey.cost : '0'}">
            </div>
            <div class="form-group">
              <label for="jStatus">Status</label>
              <select id="jStatus">
                <option value="planned" ${!journey || journey.status === 'planned' ? 'selected' : ''}>📝 Planned</option>
                <option value="booked" ${journey?.status === 'booked' ? 'selected' : ''}>✓ Booked</option>
              </select>
            </div>
          </div>
          <div class="form-group" id="bookingRefGroup" style="${journey?.status === 'booked' ? '' : 'display: none;'}">
            <label for="jBookingRef">Booking Reference</label>
            <input type="text" id="jBookingRef" placeholder="e.g., ABC123" value="${journey ? journey.bookingReference : ''}">
          </div>
          <div class="form-group">
            <label for="jNotes">Notes</label>
            <textarea id="jNotes" rows="2" placeholder="Any additional details...">${journey ? journey.notes : ''}</textarea>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="jIsMultiLeg" ${journey?.isMultiLeg ? 'checked' : ''}>
              <span>This journey has stopovers / multiple legs</span>
            </label>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="action-btn" onclick="closeAddJourneyModal()">Cancel</button>
        ${isEdit ? `<button class="action-btn danger" onclick="deleteJourney('${editJourneyId}'); closeAddJourneyModal(); buildTransportTab();">Delete</button>` : ''}
        <button class="action-btn" style="background: #2C3E50; color: white;" onclick="saveJourneyForm('${editJourneyId || ''}')">${isEdit ? 'Update' : 'Save'} Journey</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Setup status toggle for booking ref visibility
  document.getElementById('jStatus').addEventListener('change', function() {
    document.getElementById('bookingRefGroup').style.display = this.value === 'booked' ? 'block' : 'none';
  });
}

function closeAddJourneyModal() {
  const modal = document.getElementById('addJourneyModal');
  if (modal) modal.remove();
}

function saveJourneyForm(editId = '') {
  const formData = {
    fromLocation: document.getElementById('jFrom').value.trim(),
    toLocation: document.getElementById('jTo').value.trim(),
    departureDate: document.getElementById('jDepDate').value,
    departureTime: document.getElementById('jDepTime').value,
    arrivalDate: document.getElementById('jArrDate').value,
    arrivalTime: document.getElementById('jArrTime').value,
    transportType: document.getElementById('jType').value,
    provider: document.getElementById('jProvider').value.trim(),
    routeCode: document.getElementById('jRouteCode').value.trim(),
    cost: document.getElementById('jCost').value.trim() || '0',
    status: document.getElementById('jStatus').value,
    bookingReference: document.getElementById('jBookingRef').value.trim(),
    isMultiLeg: document.getElementById('jIsMultiLeg').checked,
    notes: document.getElementById('jNotes').value.trim()
  };

  if (editId) {
    const journey = findJourney(editId);
    if (journey) {
      Object.assign(journey, formData);
      saveJourneys();
    }
  } else {
    journeys.push({
      id: 'journey_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      ...formData
    });
    saveJourneys();
  }

  closeAddJourneyModal();
  // Rebuild current view to reflect changes
  if (typeof rebuildCurrentView === 'function') {
    rebuildCurrentView();
  } else {
    buildTransportTab();
  }
}

// Initialize on load
if (typeof appData !== 'undefined') {
  initJourneys();
}

// Format date for input
function formatDateForInput(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}
