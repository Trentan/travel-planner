/* ==========================================================================
   MODULE: Multi-Trip Library & Switcher (js/trip-library.js)
   Responsibilities: Multi-trip gallery UI, header trip switcher dropdown,
                     trip duplication, deletion, creation, and switching.
   ========================================================================== */

(function() {
  'use me strict';

  // Toggle Header Trip Dropdown Menu
  window.toggleTripDropdown = function(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('tripDropdownMenu');
    if (!dropdown) return;

    const isHidden = dropdown.hidden;
    dropdown.hidden = !isHidden;

    if (!dropdown.hidden) {
      window.renderHeaderTripSwitcher();
      // Click outside listener to close dropdown
      const closeListener = (e) => {
        if (!e.target.closest('#headerTripSwitcher')) {
          dropdown.hidden = true;
          document.removeEventListener('click', closeListener);
        }
      };
      setTimeout(() => document.addEventListener('click', closeListener), 10);
    }
  };

  window.closeTripDropdown = function() {
    const dropdown = document.getElementById('tripDropdownMenu');
    if (dropdown) dropdown.hidden = true;
  };

  // Render Header Trip Switcher button and recent trips list
  window.renderHeaderTripSwitcher = async function() {
    const titleEl = document.getElementById('currentTripTitle');
    const recentListEl = document.getElementById('recentTripsList');

    if (typeof window.getAllTripsFromIndexedDB !== 'function') return;

    const trips = await window.getAllTripsFromIndexedDB();
    const activeTripId = window.getActiveTripId ? window.getActiveTripId() : 'trip_default';

    const activeTrip = trips.find(t => t.id === activeTripId) || trips[0];
    if (titleEl && activeTrip) {
      const displayTitle = activeTrip.title || (activeTrip.data && activeTrip.data.meta && activeTrip.data.meta.title) || 'My Trip';
      titleEl.innerText = displayTitle;
    }

    if (recentListEl) {
      recentListEl.innerHTML = '';
      if (!trips || trips.length === 0) {
        recentListEl.innerHTML = '<div class="trip-dropdown-empty">No saved trips found</div>';
        return;
      }

      trips.slice(0, 6).forEach(trip => {
        const isCurrent = trip.id === activeTripId;
        const tripTitle = trip.title || (trip.data && trip.data.meta && trip.data.meta.title) || 'Untitled Trip';
        const dateRange = trip.dateRange || 'Flex dates';
        const flags = trip.flags || '';

        const item = document.createElement('button');
        item.className = `trip-dropdown-item ${isCurrent ? 'active' : ''}`;
        item.innerHTML = `
          <span class="trip-item-icon">${isCurrent ? '✓' : '✈️'}</span>
          <div class="trip-item-info">
            <div class="trip-item-title">${flags} ${escapeHtml(tripTitle)}</div>
            <div class="trip-item-sub">${escapeHtml(dateRange)}</div>
          </div>
        `;
        item.onclick = async function() {
          window.closeTripDropdown();
          if (!isCurrent) {
            await window.switchActiveTrip(trip.id);
          }
        };
        recentListEl.appendChild(item);
      });
    }
  };

  // Open Visual Trip Library Modal
  window.openTripLibraryModal = async function() {
    window.closeTripDropdown();
    if (typeof window.closeDesktopActionsMenu === 'function') window.closeDesktopActionsMenu();

    const modal = document.getElementById('tripLibraryModal');
    if (!modal) return;

    modal.hidden = false;
    modal.style.display = 'flex';
    modal.classList.add('active');
    await window.renderTripGalleryGrid();
  };

  window.closeTripLibraryModal = function() {
    const modal = document.getElementById('tripLibraryModal');
    if (modal) {
      modal.hidden = true;
      modal.style.display = 'none';
      modal.classList.remove('active');
    }
  };

  // Render Grid of Trip Cards in Library Modal
  window.renderTripGalleryGrid = async function() {
    const grid = document.getElementById('tripGalleryGrid');
    if (!grid) return;

    grid.innerHTML = '<div class="trip-loading">Loading trips...</div>';
    const trips = await window.getAllTripsFromIndexedDB();
    const activeTripId = window.getActiveTripId ? window.getActiveTripId() : 'trip_default';

    grid.innerHTML = '';
    if (!trips || trips.length === 0) {
      grid.innerHTML = `
        <div class="trip-empty-state">
          <p>No saved trips in your library.</p>
          <button class="btn btn-primary" onclick="window.createNewTripFromLibrary()">✦ Create Your First Trip</button>
        </div>
      `;
      return;
    }

    const fileMap = (function() {
      try { return JSON.parse(localStorage.getItem('travelApp_gdrive_file_map') || '{}'); } catch(e) { return {}; }
    })();

    trips.forEach(trip => {
      const isCurrent = trip.id === activeTripId;
      const isDriveSynced = !!fileMap[trip.id];
      const title = trip.title || (trip.data && trip.data.meta && trip.data.meta.title) || 'Untitled Trip';
      const subtitle = trip.subtitle || (trip.data && trip.data.meta && trip.data.meta.subtitle) || '';
      const flags = trip.flags || '🌍';
      const dates = trip.dateRange || 'Flexible Dates';
      const legCount = trip.legCount || 0;
      const stayCount = trip.stayCount || 0;
      const updatedDate = trip.updatedAt ? new Date(trip.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently';

      const card = document.createElement('div');
      card.className = `trip-gallery-card ${isCurrent ? 'active-card' : ''}`;
      card.innerHTML = `
        <div class="trip-card-header">
          <div class="trip-card-badges flex flex-wrap gap-1.5 items-center mb-1">
            ${isCurrent ? '<span class="active-badge">● Active Trip</span>' : ''}
            ${isDriveSynced
              ? '<span class="cloud-badge text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">☁️ Drive Synced</span>'
              : '<span class="cloud-badge text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">⚡ Local Only</span>'
            }
            <span class="updated-badge text-[10px]">Updated ${updatedDate}</span>
          </div>
          <h3 class="trip-card-title">${flags} ${escapeHtml(title)}</h3>
          ${subtitle ? `<p class="trip-card-subtitle">${escapeHtml(subtitle)}</p>` : ''}
        </div>
        <div class="trip-card-body">
          <div class="trip-card-stats">
            <span class="stat-pill">📅 ${escapeHtml(dates)}</span>
            <span class="stat-pill">📍 ${legCount} legs</span>
            <span class="stat-pill">🏨 ${stayCount} stays</span>
          </div>
        </div>
        <div class="trip-card-actions">
          ${isCurrent
            ? `<button class="trip-btn trip-btn-active" disabled>Currently Open</button>`
            : `<button class="trip-btn trip-btn-primary" onclick="window.switchActiveTrip('${trip.id}')">Switch to Trip</button>`
          }
          <button class="trip-btn trip-btn-secondary" onclick="window.duplicateTripFromLibrary('${trip.id}')" title="Duplicate trip">📋 Duplicate</button>
          <button class="trip-btn trip-btn-secondary" onclick="window.exportTripFromLibrary('${trip.id}')" title="Export JSON backup">📥 Export</button>
          ${trips.length > 1
            ? `<button class="trip-btn trip-btn-danger" onclick="window.deleteTripFromLibrary('${trip.id}')" title="Delete trip">🗑️</button>`
            : ''
          }
        </div>
      `;
      grid.appendChild(card);
    });
  };

  // Switch Active Trip
  window.switchActiveTrip = async function(targetTripId) {
    if (typeof window.saveActiveTripToStore === 'function') {
      await window.saveActiveTripToStore();
    }

    if (typeof window.loadTripFromStore === 'function') {
      const loaded = await window.loadTripFromStore(targetTripId);
      if (loaded) {
        window.closeTripLibraryModal();
        await window.renderHeaderTripSwitcher();
        if (typeof window.rebuildCurrentView === 'function') window.rebuildCurrentView();
        else if (typeof window.buildItinerary === 'function') window.buildItinerary();
      }
    }
  };

  // Create New Trip from Library
  window.createNewTripFromLibrary = async function() {
    window.closeTripLibraryModal();
    if (typeof window.openCreateNewTripWizard === 'function') {
      window.openCreateNewTripWizard();
    } else if (typeof window.createNewTripDocument === 'function') {
      await window.createNewTripDocument('New Trip', 'Click here to add subtitle');
      await window.renderHeaderTripSwitcher();
    }
  };

  // Import Trip File from Library
  window.importTripFromLibrary = function() {
    window.closeTripLibraryModal();
    if (typeof window.openExistingTripFile === 'function') {
      window.openExistingTripFile();
    } else {
      const input = document.getElementById('importFile');
      if (input) input.click();
    }
  };

  // Duplicate Trip
  window.duplicateTripFromLibrary = async function(tripId) {
    if (typeof window.duplicateTripDocument === 'function') {
      await window.duplicateTripDocument(tripId);
      await window.renderTripGalleryGrid();
      await window.renderHeaderTripSwitcher();
    }
  };

  // Delete Trip
  window.deleteTripFromLibrary = async function(tripId) {
    const trips = await window.getAllTripsFromIndexedDB();
    const targetTrip = trips.find(t => t.id === tripId);
    const title = targetTrip ? (targetTrip.title || 'this trip') : 'this trip';

    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    if (typeof window.deleteTripDocument === 'function') {
      await window.deleteTripDocument(tripId);
      await window.renderTripGalleryGrid();
      await window.renderHeaderTripSwitcher();
    }
  };

  // Export Trip from Library
  window.exportTripFromLibrary = async function(tripId) {
    const trips = await window.getAllTripsFromIndexedDB();
    const targetTrip = trips.find(t => t.id === tripId);
    if (!targetTrip || !targetTrip.data) return;

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(targetTrip.data, null, 2));
    const dlAnchorElem = document.createElement('a');
    const safeTitle = (targetTrip.title || 'trip').toLowerCase().replace(/[^a-z0-9]/g, '_');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `${safeTitle}_backup.json`);
    document.body.appendChild(dlAnchorElem);
    dlAnchorElem.click();
    dlAnchorElem.remove();
  };

  // Helper escape HTML string
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initialize Header Trip Switcher on DOM load
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (typeof window.renderHeaderTripSwitcher === 'function') {
        window.renderHeaderTripSwitcher();
      }
    }, 500);
  });
})();
