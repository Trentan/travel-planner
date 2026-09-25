// ============================================================================
// MODULE: Stays & Accommodation Management (js/stays.js)
// Handlers for Add/Edit Stay modals, stay CRUD, check-in/out night calculations.
// ============================================================================

// Add Stay Modal Functions
let editingStayId = null; // Track if we're editing an existing stay

function _syncStayModalActions() {
  const deleteBtn = document.getElementById('stayDeleteBtn');
  if (deleteBtn) deleteBtn.style.display = editingStayId ? 'inline-flex' : 'none';
}

function calcStayNights() {
  const checkIn = document.getElementById('stayCheckIn');
  const checkOut = document.getElementById('stayCheckOut');
  const nights = document.getElementById('stayNights');

  if (checkIn && checkOut && nights && checkIn.value && checkOut.value) {
    const start = new Date(checkIn.value);
    const end = new Date(checkOut.value);
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
    nights.value = diff > 0 ? diff : 0;
  }
}

function setupStayNightsAutoCalc() {
  const checkIn = document.getElementById('stayCheckIn');
  const checkOut = document.getElementById('stayCheckOut');

  if (checkIn && checkOut) {
    checkIn.onchange = calcStayNights;
    checkOut.onchange = calcStayNights;
  }
}

function openAddStayModal(defaultCityId, defaultCheckIn) {
  const modal = document.getElementById('stay-modal');
  if (!modal) return;

  editingStayId = null; // Reset editing state
  window._currentStayAttachments = [];
  window._currentAttachments = window._currentStayAttachments;
  if (typeof renderStayAttachmentsList === 'function') renderStayAttachmentsList();

  // Update modal title
  const title = modal.querySelector('h2');
  if (title) title.textContent = '🏨 Add Stay';

  // Populate city dropdown
  const citySelect = document.getElementById('stayCitySelect');
  if (citySelect) {
    citySelect.innerHTML = '<option value="">-- Select city --</option>';
    (citiesData || []).forEach(city => {
      const option = document.createElement('option');
      option.value = city.id;
      option.textContent = city.name + (city.country ? ` (${city.country})` : '');
      citySelect.appendChild(option);
    });
  }

  // Clear form fields
  document.getElementById('stayPropertyName').value = '';
  document.getElementById('stayLocation').value = '';
  document.getElementById('stayCheckIn').value = defaultCheckIn || '';
  document.getElementById('stayCheckInTime').value = '';
  document.getElementById('stayCheckOut').value = '';
  document.getElementById('stayCheckOutTime').value = '';
  document.getElementById('stayNights').value = '';
  document.getElementById('stayStatus').value = 'planned';
  document.getElementById('stayProvider').value = '';
  document.getElementById('stayBookingRef').value = '';
  document.getElementById('stayTotalCost').value = '';
  document.getElementById('stayNotes').value = '';

  // Set up auto-calc for nights
  setupStayNightsAutoCalc();

  _syncStayModalActions();
  modal.style.display = 'flex';
}

function _getStays() {
  return (typeof window !== 'undefined' && Array.isArray(window.stays)) ? window.stays : stays;
}

function openEditStayModal(stayId) {
  const modal = document.getElementById('stay-modal');
  if (!modal) return;

  const stay = _getStays().find(s => s.id === stayId);
  if (!stay) return;

  editingStayId = stayId; // Set editing state
  window._currentStayAttachments = stay.attachments ? [...stay.attachments] : [];
  window._currentAttachments = window._currentStayAttachments;
  if (typeof renderStayAttachmentsList === 'function') renderStayAttachmentsList();

  // Update modal title
  const title = modal.querySelector('h2');
  if (title) title.textContent = '🏨 Edit Stay';

  // Populate city dropdown and select current
  const citySelect = document.getElementById('stayCitySelect');
  if (citySelect) {
    citySelect.innerHTML = '<option value="">-- Select city --</option>';
    (citiesData || []).forEach(city => {
      const option = document.createElement('option');
      option.value = city.id;
      option.textContent = city.name + (city.country ? ` (${city.country})` : '');
      if (city.id === stay.cityId) option.selected = true;
      citySelect.appendChild(option);
    });
  }

  // Populate form fields
  document.getElementById('stayPropertyName').value = stay.propertyName || '';
  document.getElementById('stayLocation').value = stay.location || '';
  document.getElementById('stayCheckIn').value = stay.checkIn || '';
  document.getElementById('stayCheckInTime').value = stay.checkInTime || '';
  document.getElementById('stayCheckOut').value = stay.checkOut || '';
  document.getElementById('stayCheckOutTime').value = stay.checkOutTime || '';
  document.getElementById('stayNights').value = stay.nights || '';
  document.getElementById('stayStatus').value = normalizeItemStatus(stay.status);
  document.getElementById('stayProvider').value = stay.provider || '';
  document.getElementById('stayBookingRef').value = stay.bookingRef || '';
  document.getElementById('stayTotalCost').value = stay.totalCost || '';
  document.getElementById('stayNotes').value = stay.notes || '';

  // Set up auto-calc for nights
  setupStayNightsAutoCalc();

  _syncStayModalActions();
  modal.style.display = 'flex';
}

function closeAddStayModal() {
  const modal = document.getElementById('stay-modal');
  if (modal) modal.style.display = 'none';
  editingStayId = null;
  _syncStayModalActions();
}

function saveStayFromModal() {
  const citySelect = document.getElementById('stayCitySelect');
  const propInput = document.getElementById('stayPropertyName');
  const checkInInput = document.getElementById('stayCheckIn');
  const checkOutInput = document.getElementById('stayCheckOut');

  const cityId = citySelect.value;
  const propertyName = propInput.value.trim();
  const location = document.getElementById('stayLocation').value.trim();
  const checkIn = checkInInput.value;
  const checkInTime = document.getElementById('stayCheckInTime').value;
  const checkOut = checkOutInput.value;

  const checkOutTime = document.getElementById('stayCheckOutTime').value;
  const nights = parseInt(document.getElementById('stayNights').value) || 0;
  const status = document.getElementById('stayStatus').value || 'planned';
  const provider = document.getElementById('stayProvider').value.trim();
  const bookingRef = document.getElementById('stayBookingRef').value.trim();
  const totalCost = document.getElementById('stayTotalCost').value.trim() || '0';
  const notes = document.getElementById('stayNotes').value.trim();

  // Reset visual error state
  [citySelect, propInput, checkInInput, checkOutInput].forEach(el => {
    if (el) el.classList.remove('border-rose-500', 'bg-rose-50', 'dark:bg-rose-950/20');
  });

  let hasError = false;
  if (!cityId) {
    citySelect.classList.add('border-rose-500', 'bg-rose-50', 'dark:bg-rose-950/20');
    hasError = true;
  }
  if (!propertyName) {
    propInput.classList.add('border-rose-500', 'bg-rose-50', 'dark:bg-rose-950/20');
    hasError = true;
  }
  if (!checkIn) {
    checkInInput.classList.add('border-rose-500', 'bg-rose-50', 'dark:bg-rose-950/20');
    hasError = true;
  }
  if (!checkOut) {
    checkOutInput.classList.add('border-rose-500', 'bg-rose-50', 'dark:bg-rose-950/20');
    hasError = true;
  }

  if (hasError) {
    alert('Please fill in all mandatory stay fields (City, Property Name, Check-in, and Check-out dates).');
    return;
  }

  const currentStays = _getStays();

  if (editingStayId) {
    // Editing existing stay
    const stay = currentStays.find(s => s.id === editingStayId);
    if (stay) {
      stay.cityId = cityId;
      stay.propertyName = propertyName;
      stay.location = location;
      stay.checkIn = checkIn;
      stay.checkInTime = checkInTime;
      stay.checkOut = checkOut;
      stay.checkOutTime = checkOutTime;
      stay.nights = nights;
      stay.status = status;
      stay.provider = provider;
      stay.bookingRef = bookingRef;
      stay.totalCost = totalCost;
      stay.notes = notes;
      stay.attachments = typeof window._currentAttachments !== 'undefined' ? [...window._currentAttachments] : [];
    }
    editingStayId = null; // Reset editing state
  } else {
    // Creating new stay
    const stay = {
      id: 'stay_' + Date.now(),
      cityId: cityId,
      propertyName: propertyName,
      location: location,
      checkIn: checkIn,
      checkInTime: checkInTime,
      checkOut: checkOut,
      checkOutTime: checkOutTime,
      nights: nights,
      status: status,
      provider: provider,
      bookingRef: bookingRef,
      totalCost: totalCost,
      notes: notes,
      attachments: typeof window._currentAttachments !== 'undefined' ? [...window._currentAttachments] : []
    };
    currentStays.push(stay);
  }

  closeAddStayModal();
  if (typeof rebuildItineraryAndDataMappings === 'function') {
    rebuildItineraryAndDataMappings({ showToast: false });
  } else {
    saveData();
    if (typeof rebuildCurrentView === 'function') {
      rebuildCurrentView();
    } else {
      buildItinerary();
    }
  }
}

function deleteStay(id) {
  if (!confirm('Delete this stay?')) return;
  const currentStays = _getStays();
  const idx = currentStays.findIndex(s => s.id === id);
  if (idx > -1) {
    currentStays.splice(idx, 1);
    if (typeof rebuildItineraryAndDataMappings === 'function') {
      rebuildItineraryAndDataMappings({ showToast: false });
    } else {
      saveData();
      if (typeof rebuildCurrentView === 'function') {
        rebuildCurrentView();
      } else {
        buildItinerary();
      }
    }
  }
}

function deleteStayFromModal() {
  if (!editingStayId) return;
  if (!confirm('Delete this stay?')) return;
  const id = editingStayId;
  editingStayId = null;
  const currentStays = _getStays();
  const idx = currentStays.findIndex(s => s.id === id);
  if (idx > -1) {
    currentStays.splice(idx, 1);
    closeAddStayModal();
    if (typeof rebuildItineraryAndDataMappings === 'function') {
      rebuildItineraryAndDataMappings({ showToast: false });
    } else {
      saveData();
      if (typeof rebuildCurrentView === 'function') {
        rebuildCurrentView();
      } else {
        buildItinerary();
      }
    }
  }
}

function toggleStayStatus(e, id) {
  if (e) e.stopPropagation();
  const s = _getStays().find(s => s.id === id);
  if (s) {
    const states = ['planned', 'booked', 'confirmed', 'cancelled'];
    if (s.status === 'pending') s.status = 'planned';
    const currentIdx = states.indexOf(s.status);
    s.status = states[(currentIdx + 1) % states.length];
    saveData();
    if (typeof rebuildCurrentView === 'function') {
      rebuildCurrentView();
    } else {
      buildItinerary();
    }
  }
}

function updateStayField(id, field, value) {
  const s = _getStays().find(s => s.id === id);
  if (s) {
    s[field] = value;
    saveData();
  }
}

// Backward compatibility - old function names for existing code
function openStayModal(l, d) { openAddStayModal(); }
function closeStayModal() { closeAddStayModal(); }


// Global & CommonJS Export Bridge
const _stayExports = {
  editingStayId: typeof editingStayId !== 'undefined' ? editingStayId : null,
  _syncStayModalActions,
  calcStayNights,
  setupStayNightsAutoCalc,
  openAddStayModal,
  openEditStayModal,
  closeAddStayModal,
  saveStayFromModal,
  deleteStay,
  deleteStayFromModal,
  toggleStayStatus,
  updateStayField,
  openStayModal,
  closeStayModal
};

if (typeof window !== 'undefined') {
  Object.assign(window, _stayExports);
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = _stayExports;
}
