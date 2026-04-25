// Transport/Journey management module
// Supports both single journeys and multi-leg journeys

let journeys = [];

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

// Initialize journeys from appData transportItems
function initJourneys() {
  const saved = localStorage.getItem('travelApp_journeys_v1');
  if (saved) {
    journeys = JSON.parse(saved);
  } else {
    // Migrate existing transportItems from appData to journeys
    migrateExistingTransport();
  }
}

// Migrate existing transport data from day-based structure to journey structure
function migrateExistingTransport() {
  journeys = [];
  appData.forEach((leg, legIdx) => {
    leg.days.forEach((day, dayIdx) => {
      if (day.transportItems && day.transportItems.length > 0) {
        day.transportItems.forEach(item => {
          if (item.text && item.text.trim() !== '' && item.text !== '—') {
            // Parse date from day.date (format: "1 Jan" or similar)
            const dateMatch = day.date.match(/(\d+)\s+([A-Za-z]+)/);
            const departureDate = dateMatch ? `${dateMatch[1]} ${dateMatch[2]} 2026` : day.date;

            journeys.push({
              id: 'journey_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
              legId: leg.id,
              dayIdx: dayIdx,
              fromLocation: day.from,
              toLocation: day.to,
              departureDate: departureDate,
              departureTime: '',
              arrivalDate: departureDate, // Default to same day
              arrivalTime: '',
              transportType: 'flight', // Default
              provider: '',
              routeCode: '',
              status: item.status || 'planned',
              cost: item.cost || '0',
              bookingReference: item.bookingRef || '',
              isMultiLeg: false,
              notes: item.text,
              legs: []
            });
          }
        });
      }
    });
  });
  saveJourneys();
}

function saveJourneys() {
  localStorage.setItem('travelApp_journeys_v1', JSON.stringify(journeys));
}

// Create a new journey
function createJourney(journeyData) {
  const journey = {
    id: 'journey_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    fromLocation: journeyData.fromLocation || '',
    toLocation: journeyData.toLocation || '',
    departureDate: journeyData.departureDate || '',
    departureTime: journeyData.departureTime || '',
    arrivalDate: journeyData.arrivalDate || '',
    arrivalTime: journeyData.arrivalTime || '',
    transportType: journeyData.transportType || 'flight',
    provider: journeyData.provider || '',
    routeCode: journeyData.routeCode || '',
    status: journeyData.status || 'planned',
    cost: journeyData.cost || '0',
    bookingReference: journeyData.bookingReference || '',
    isMultiLeg: journeyData.isMultiLeg || false,
    notes: journeyData.notes || '',
    legs: journeyData.legs || []
  };
  journeys.push(journey);
  saveJourneys();
  return journey;
}

// Update a journey
function updateJourney(id, updates) {
  const idx = journeys.findIndex(j => j.id === id);
  if (idx !== -1) {
    journeys[idx] = { ...journeys[idx], ...updates };
    saveJourneys();
    return journeys[idx];
  }
  return null;
}

// Delete a journey
function deleteJourney(id) {
  journeys = journeys.filter(j => j.id !== id);
  saveJourneys();
}

// Delete a leg from a multi-leg journey
function deleteJourneyLeg(journeyId, legIdx) {
  const journey = journeys.find(j => j.id === journeyId);
  if (journey && journey.legs) {
    journey.legs.splice(legIdx, 1);
    saveJourneys();
  }
}

// Get sorted journeys (by date then departure time)
function getSortedJourneys() {
  return [...journeys].sort((a, b) => {
    const dateA = new Date(a.departureDate).getTime() || 0;
    const dateB = new Date(b.departureDate).getTime() || 0;
    if (dateA !== dateB) return dateA - dateB;
    // If dates equal, sort by departure time
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

// Open the Add Journey modal
function openAddJourneyModal(editJourneyId = null) {
  const isEdit = editJourneyId !== null;
  const journey = isEdit ? journeys.find(j => j.id === editJourneyId) : null;

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  modal.id = 'addJourneyModal';

  modal.innerHTML = `
    <div class="modal-content" style="max-width: 550px; max-height: 90vh; overflow-y: auto;">
      <div class="modal-header">
        <h2>${isEdit ? '✏️ Edit Journey' : '✈️ Add New Journey'}</h2>
        <button class="modal-close" onclick="closeAddJourneyModal()">&times;</button>
      </div>
      <div class="modal-body">
        <form id="journeyForm" class="journey-form">
          <!-- Route -->
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

          <!-- Transport Type -->
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

          <!-- Departure -->
          <div class="form-row">
            <div class="form-group">
              <label for="jDepDate">Departure Date</label>
              <input type="date" id="jDepDate" value="${journey ? formatDateForInput(journey.departureDate) : ''}" required>
            </div>
            <div class="form-group">
              <label for="jDepTime">Departure Time</label>
              <input type="time" id="jDepTime" value="${journey ? journey.departureTime : ''}">
            </div>
          </div>

          <!-- Arrival -->
          <div class="form-row">
            <div class="form-group">
              <label for="jArrDate">Arrival Date</label>
              <input type="date" id="jArrDate" value="${journey ? formatDateForInput(journey.arrivalDate) : ''}">
            </div>
            <div class="form-group">
              <label for="jArrTime">Arrival Time</label>
              <input type="time" id="jArrTime" value="${journey ? journey.arrivalTime : ''}">
            </div>
          </div>

          <!-- Provider & Route Code -->
          <div class="form-row">
            <div class="form-group">
              <label for="jProvider">Provider / Airline</label>
              <input type="text" id="jProvider" placeholder="e.g., Qantas, Eurostar" value="${journey ? journey.provider : ''}">
            </div>
            <div class="form-group">
              <label for="jRouteCode">Flight # / Route Code</label>
              <input type="text" id="jRouteCode" placeholder="e.g., QF9" value="${journey ? journey.routeCode : ''}">
            </div>
          </div>

          <!-- Cost & Status -->
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

          <!-- Booking Reference (only show if booked) -->
          <div class="form-group" id="bookingRefGroup" style="${journey?.status === 'booked' ? '' : 'display: none;'}">
            <label for="jBookingRef">Booking Reference</label>
            <input type="text" id="jBookingRef" placeholder="e.g., ABC123" value="${journey ? journey.bookingReference : ''}">
          </div>

          <!-- Notes -->
          <div class="form-group">
            <label for="jNotes">Notes</label>
            <textarea id="jNotes" rows="2" placeholder="Any additional details...">${journey ? journey.notes : ''}</textarea>
          </div>

          <!-- Multi-leg checkbox (Phase 5) -->
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="jIsMultiLeg" ${journey?.isMultiLeg ? 'checked' : ''}>
              <span>This journey has stopovers / multiple legs</span>
            </label>
          </div>

          <!-- Multi-leg section (Phase 5) -->
          <div id="multiLegSection" class="multi-leg-section" style="${journey?.isMultiLeg ? '' : 'display: none;'}">
            <div class="section-header">
              <h4>Journey Legs</h4>
              <button type="button" class="action-btn small" onclick="addJourneyLeg()">+ Add Leg</button>
            </div>
            <div id="legsList">
              ${journey?.legs?.map((leg, idx) => renderLegFormRow(leg, idx)).join('') || ''}
            </div>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="action-btn" onclick="closeAddJourneyModal()">Cancel</button>
        ${isEdit ? `<button class="action-btn danger" onclick="confirmDeleteJourney('${editJourneyId}')">Delete</button>` : ''}
        <button class="action-btn" style="background: #2C3E50; color: white;" onclick="saveJourneyForm('${editJourneyId || ''}')">
          ${isEdit ? 'Update Journey' : 'Save Journey'}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Setup status toggle for booking ref visibility
  document.getElementById('jStatus').addEventListener('change', function() {
    document.getElementById('bookingRefGroup').style.display = this.value === 'booked' ? 'block' : 'none';
  });

  // Setup multi-leg toggle
  document.getElementById('jIsMultiLeg').addEventListener('change', function() {
    document.getElementById('multiLegSection').style.display = this.checked ? 'block' : 'none';
  });
}

function formatDateForInput(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}

function renderLegFormRow(leg, idx) {
  return `
    <div class="leg-row" data-leg-idx="${idx}">
      <div class="leg-row-header">
        <span class="leg-number">Leg ${idx + 1}</span>
        <button type="button" class="del-btn" onclick="removeJourneyLeg(${idx})">×</button>
      </div>
      <div class="form-row">
        <div class="form-group">
          <input type="text" placeholder="From" value="${leg.fromLocation || ''}" class="leg-from">
        </div>
        <div class="form-group">
          <input type="text" placeholder="To" value="${leg.toLocation || ''}" class="leg-to">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <input type="time" placeholder="Dep" value="${leg.departureTime || ''}" class="leg-dep-time">
        </div>
        <div class="form-group">
          <input type="time" placeholder="Arr" value="${leg.arrivalTime || ''}" class="leg-arr-time">
        </div>
        <div class="form-group">
          <input type="text" placeholder="Provider" value="${leg.provider || ''}" class="leg-provider">
        </div>
        <div class="form-group">
          <input type="text" placeholder="Route #" value="${leg.routeCode || ''}" class="leg-route">
        </div>
      </div>
    </div>
  `;
}

function addJourneyLeg() {
  const legsList = document.getElementById('legsList');
  const legCount = legsList.querySelectorAll('.leg-row').length;
  const newLeg = { fromLocation: '', toLocation: '', departureTime: '', arrivalTime: '', provider: '', routeCode: '' };

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = renderLegFormRow(newLeg, legCount);
  legsList.appendChild(tempDiv.firstElementChild);
}

function removeJourneyLeg(idx) {
  const legRow = document.querySelector(`.leg-row[data-leg-idx="${idx}"]`);
  if (legRow) {
    legRow.remove();
    // Reindex remaining legs
    document.querySelectorAll('.leg-row').forEach((row, newIdx) => {
      row.dataset.legIdx = newIdx;
      row.querySelector('.leg-number').textContent = `Leg ${newIdx + 1}`;
      const delBtn = row.querySelector('.del-btn');
      delBtn.setAttribute('onclick', `removeJourneyLeg(${newIdx})`);
    });
  }
}

function closeAddJourneyModal() {
  const modal = document.getElementById('addJourneyModal');
  if (modal) modal.remove();
}

function confirmDeleteJourney(id) {
  if (confirm('Are you sure you want to delete this journey?')) {
    deleteJourney(id);
    closeAddJourneyModal();
    buildTransportTab();
  }
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

  // Gather legs if multi-leg
  if (formData.isMultiLeg) {
    formData.legs = [];
    document.querySelectorAll('.leg-row').forEach(row => {
      formData.legs.push({
        fromLocation: row.querySelector('.leg-from').value.trim(),
        toLocation: row.querySelector('.leg-to').value.trim(),
        departureTime: row.querySelector('.leg-dep-time').value,
        arrivalTime: row.querySelector('.leg-arr-time').value,
        provider: row.querySelector('.leg-provider').value.trim(),
        routeCode: row.querySelector('.leg-route').value.trim()
      });
    });
  }

  if (editId) {
    updateJourney(editId, formData);
  } else {
    createJourney(formData);
  }

  closeAddJourneyModal();
  buildTransportTab();
}

// Build the Transport tab with journey display
function buildTransportTab() {
  const container = document.getElementById('transport-table-container');
  if (!container) return;

  const sorted = getSortedJourneys();

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
              <span class="journey-date">${formatJourneyDate(journey.departureDate)}</span>
              ${journey.departureTime ? `<span class="journey-time">${formatJourneyTime(journey.departureTime)}</span>` : ''}
              ${duration ? `<span class="journey-duration">${duration}</span>` : ''}
              <span class="journey-status" style="background: ${statusColor};">${statusIcon} ${journey.status}</span>
              <span class="journey-chevron">▼</span>
            </div>
          </div>
          <div class="journey-card-details">
            <div class="journey-detail-grid">
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
                <div><span class="status-badge" style="background: ${statusColor};">${statusIcon} ${journey.status}</span></div>
              </div>
              <div class="journey-detail-item">
                <label>Cost</label>
                <div class="journey-cost">$${journey.cost || '0'}</div>
              </div>
            </div>

            ${journey.bookingReference ? `
              <div class="journey-booking-ref">
                <label>Booking Reference:</label>
                <span class="booking-ref-code">${journey.bookingReference}</span>
              </div>
            ` : ''}

            ${journey.notes ? `
              <div class="journey-notes">
                <label>Notes:</label>
                <p>${journey.notes}</p>
              </div>
            ` : ''}

            ${journey.isMultiLeg && journey.legs && journey.legs.length > 0 ? renderMultiLegDetails(journey) : ''}

            <div class="journey-actions">
              <button class="action-btn small" onclick="event.stopPropagation(); openAddJourneyModal('${journey.id}')">Edit</button>
              <button class="action-btn small danger" onclick="event.stopPropagation(); confirmDeleteJourney('${journey.id}')">Delete</button>
            </div>
          </div>
        </div>
      `;
    });

    html += '</div>';
  }

  container.innerHTML = html;
}

function renderMultiLegDetails(journey) {
  let html = '<div class="journey-legs-section">';
  html += '<h5>Journey Legs</h5>';
  html += '<div class="journey-legs-list">';

  journey.legs.forEach((leg, idx) => {
    html += `
      <div class="journey-leg-item">
        <span class="leg-sequence">${idx + 1}</span>
        <div class="leg-route">
          <strong>${leg.fromLocation} → ${leg.toLocation}</strong>
          <span class="leg-times">${leg.departureTime || '??:??'} → ${leg.arrivalTime || '??:??'}</span>
        </div>
        <div class="leg-provider">
          ${leg.provider || '—'} ${leg.routeCode ? `(${leg.routeCode})` : ''}
        </div>
      </div>
    `;
  });

  html += '</div></div>';
  return html;
}

function toggleJourneyCard(header) {
  const card = header.closest('.journey-card');
  card.classList.toggle('expanded');
}

// Initialize on load
if (typeof appData !== 'undefined') {
  initJourneys();
}
