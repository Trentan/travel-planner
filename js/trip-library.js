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
      if (typeof window.isGoogleDriveConnected === 'function' && window.isGoogleDriveConnected()) {
        if (typeof window.syncAllTripsFromGoogleDrive === 'function') {
          // Pass isSilent = true so status pill does not flicker
          window.syncAllTripsFromGoogleDrive(true).then(() => {
            window.renderHeaderTripSwitcher();
          });
        }
      }
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

  // Render Header Trip Switcher button and unified trips list
  window.renderHeaderTripSwitcher = async function() {
    const titleEl = document.getElementById('currentTripTitle');
    const recentListEl = document.getElementById('recentTripsList');

    if (typeof window.getAllTripsFromIndexedDB !== 'function') return;

    const trips = await window.getAllTripsFromIndexedDB();
    const cloudFiles = window.__gdriveCloudFiles || [];
    const activeTripId = window.getActiveTripId ? window.getActiveTripId() : 'trip_default';
    const isDriveConnected = typeof window.isGoogleDriveConnected === 'function' && window.isGoogleDriveConnected();
    const fileMap = typeof window.getGDriveFileMap === 'function' ? window.getGDriveFileMap() : {};

    // Update active trip title & icon in top header, hero section, and mobile action card
    const activeTrip = trips.find(t => t.id === activeTripId) || trips[0];
    if (activeTrip) {
      const displayTitle = activeTrip.title || (activeTrip.data && activeTrip.data.meta && activeTrip.data.meta.title) || 'My Trip';
      const activeEmoji = activeTrip.flags || (activeTrip.data && activeTrip.data.meta && activeTrip.data.meta.icon) || '✈️';
      const cleanFilename = typeof window.formatHumanFilename === 'function' ? window.formatHumanFilename(activeTrip) : 'my_trip.json';

      if (titleEl) titleEl.innerText = displayTitle;

      const headerIconEl = document.getElementById('currentTripIcon');
      if (headerIconEl) headerIconEl.innerText = activeEmoji.split(' ')[0] || '✈️';

      const heroEmojiEl = document.getElementById('heroTripEmoji');
      if (heroEmojiEl) heroEmojiEl.innerText = activeEmoji.split(' ')[0] || '✈️';

      const heroTitleTextEl = document.getElementById('heroTripTitleText');
      if (heroTitleTextEl) heroTitleTextEl.innerText = displayTitle;

      const mobileEmojiEl = document.getElementById('mobileActiveTripEmoji');
      if (mobileEmojiEl) mobileEmojiEl.innerText = activeEmoji.split(' ')[0] || '✈️';

      const mobileTitleEl = document.getElementById('mobileActiveTripTitle');
      if (mobileTitleEl) mobileTitleEl.innerText = displayTitle;

      const mobileFilenameEl = document.getElementById('mobileActiveTripFilename');
      if (mobileFilenameEl) mobileFilenameEl.innerText = cleanFilename;
    }

    if (!recentListEl) return;
    recentListEl.innerHTML = '';

    // Render Top-Level Action Controls Header inside Dropdown Menu
    const actionControlsHeader = document.createElement('div');
    actionControlsHeader.className = 'p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 flex items-center justify-between gap-1.5 mb-1';
    actionControlsHeader.innerHTML = `
      <button class="flex-1 py-1.5 px-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all shadow-sm" onclick="window.closeTripDropdown(); if (typeof openCreateNewTripWizard === 'function') openCreateNewTripWizard(); else window.createNewTripFromLibrary();">
        <span>➕</span> <span>New</span>
      </button>
      <button class="py-1.5 px-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all" onclick="event.stopPropagation(); window.uploadLocalJsonFileToDrive();" title="Upload local JSON file">
        <span>📥</span> <span>Upload</span>
      </button>
      <button class="py-1.5 px-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all text-blue-600 dark:text-blue-400" onclick="event.stopPropagation(); window.refreshGoogleDriveFolder(false);" title="Rescan Google Drive folder">
        <span>🔄</span> <span>Refresh</span>
      </button>
    `;
    recentListEl.appendChild(actionControlsHeader);

    // Reconcile & Deduplicate IndexedDB Trips + Google Drive Cloud Files into a Single List
    const cloudFileIdMap = new Map();
    cloudFiles.forEach(cf => cloudFileIdMap.set(cf.id, cf));

    const cloudFileNameMap = new Map();
    cloudFiles.forEach(cf => cloudFileNameMap.set(cf.name.toLowerCase(), cf));

    const unifiedList = [];
    const matchedCloudFileIds = new Set();

    trips.forEach(trip => {
      const rawTitle = trip.title || (trip.data && trip.data.meta && trip.data.meta.title) || 'My Trip';
      const cleanFilename = typeof window.formatHumanFilename === 'function'
        ? window.formatHumanFilename(trip)
        : `${rawTitle.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_')}.json`;

      const mappedFileId = fileMap[trip.id];
      let matchedCloudFile = null;

      if (mappedFileId && cloudFileIdMap.has(mappedFileId)) {
        matchedCloudFile = cloudFileIdMap.get(mappedFileId);
      } else if (cloudFileNameMap.has(cleanFilename.toLowerCase())) {
        matchedCloudFile = cloudFileNameMap.get(cleanFilename.toLowerCase());
      }

      if (matchedCloudFile) {
        matchedCloudFileIds.add(matchedCloudFile.id);
      }

      unifiedList.push({
        id: trip.id,
        cloudFileId: matchedCloudFile ? matchedCloudFile.id : null,
        title: rawTitle,
        filename: matchedCloudFile ? matchedCloudFile.name : cleanFilename,
        dateRange: trip.dateRange || (trip.data && trip.data.meta && trip.data.meta.dates) || 'Flex dates',
        flags: trip.flags || '✈️',
        storageState: isDriveConnected ? (matchedCloudFile ? 'synced' : 'local_only') : 'local_only',
        isCurrent: trip.id === activeTripId,
        source: 'local'
      });
    });

    // Include cloud-only files (residing on Google Drive, not loaded locally yet)
    if (isDriveConnected) {
      cloudFiles.forEach(cf => {
        if (!matchedCloudFileIds.has(cf.id)) {
          unifiedList.push({
            id: `cloud_${cf.id}`,
            cloudFileId: cf.id,
            title: cf.name.replace(/\.json$/i, '').replace(/_/g, ' '),
            filename: cf.name,
            dateRange: cf.modifiedTime ? new Date(cf.modifiedTime).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Google Drive File',
            flags: '☁️',
            storageState: 'cloud_only',
            isCurrent: false,
            source: 'cloud'
          });
        }
      });
    }

    if (unifiedList.length === 0) {
      const emptyItem = document.createElement('div');
      emptyItem.className = 'p-3 text-xs text-slate-500 italic text-center';
      emptyItem.innerText = 'No saved trips found.';
      recentListEl.appendChild(emptyItem);
      return;
    }

    // Render Unified Deduplicated Trip Items List
    unifiedList.slice(0, 8).forEach(item => {
      const isCurrent = item.isCurrent;
      const isCloudSynced = item.storageState === 'synced';
      const isCloudOnly = item.storageState === 'cloud_only';

      let badgeHtml = '';
      if (isCloudSynced) {
        badgeHtml = '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">☁️ Synced</span>';
      } else if (isCloudOnly) {
        badgeHtml = '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300">☁️ Remote</span>';
      } else {
        badgeHtml = '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">⚡ Local</span>';
      }

      const elem = document.createElement('div');
      elem.className = `trip-dropdown-item group flex items-center justify-between py-2 px-2.5 rounded-lg my-0.5 ${isCurrent ? 'active bg-teal-50/90 dark:bg-teal-950/50 font-semibold border-l-2 border-teal-500' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'}`;

      const clickHandler = isCloudOnly
        ? `window.closeTripDropdown(); window.loadTripFromGoogleDrive('${item.cloudFileId}');`
        : `window.closeTripDropdown(); ${!isCurrent ? `window.switchActiveTrip('${item.id}')` : ''}`;

      elem.innerHTML = `
        <div class="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer" onclick="${clickHandler}">
          <span class="trip-item-icon shrink-0 text-sm">${isCurrent ? '✓' : item.flags}</span>
          <div class="trip-item-info min-w-0 flex-1">
            <div class="trip-item-title truncate text-xs flex items-center gap-1.5">
              <span class="truncate ${isCurrent ? 'font-bold text-teal-900 dark:text-teal-200' : ''}">${escapeHtml(item.title)}</span>
              ${badgeHtml}
            </div>
            <div class="trip-item-sub text-[10px] text-slate-400 dark:text-slate-500 truncate font-mono mt-0.5">${escapeHtml(item.filename)}</div>
          </div>
        </div>
        <div class="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
          ${!isCloudOnly ? `
            <button class="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-xs" onclick="window.renameTripFromDropdown(event, '${item.id}', '${escapeHtml(item.title)}')" title="Rename trip">✏️</button>
          ` : `
            <button class="p-1 hover:bg-blue-200 dark:hover:bg-blue-900 rounded text-xs" onclick="window.renameCloudFileFromDropdown(event, '${item.cloudFileId}', '${escapeHtml(item.filename)}')" title="Rename cloud file">✏️</button>
          `}
          ${item.cloudFileId ? `
            <a href="https://drive.google.com/file/d/${item.cloudFileId}/view" target="_blank" rel="noopener noreferrer" class="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-xs text-slate-500" title="View physical file in Google Drive" onclick="event.stopPropagation();">↗</a>
          ` : ''}
          ${!isCloudOnly && trips.length > 1 ? `
            <button class="p-1 hover:bg-red-100 dark:hover:bg-red-950/60 rounded text-xs text-red-600" onclick="window.deleteTripFromDropdown(event, '${item.id}', '${escapeHtml(item.title)}')" title="Delete trip">🗑️</button>
          ` : ''}
          ${isCloudOnly ? `
            <button class="p-1 hover:bg-red-100 dark:hover:bg-red-950/60 rounded text-xs text-red-600" onclick="window.deleteTripFromGoogleDrive('${item.cloudFileId}', '${escapeHtml(item.filename)}')" title="Delete cloud file">🗑️</button>
          ` : ''}
        </div>
      `;
      recentListEl.appendChild(elem);
    });
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

  let currentTripLibraryTab = 'local';

  window.switchTripLibraryTab = function(tabName) {
    currentTripLibraryTab = tabName;
    const tabLocal = document.getElementById('tripLibraryTabLocal');
    const tabCloud = document.getElementById('tripLibraryTabCloud');

    if (tabLocal) {
      tabLocal.className = tabName === 'local'
        ? 'pb-2 border-b-2 border-teal-600 text-teal-700 dark:text-teal-400 font-bold transition-all'
        : 'pb-2 border-b-2 border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all';
    }
    if (tabCloud) {
      tabCloud.className = tabName === 'cloud'
        ? 'pb-2 border-b-2 border-blue-600 text-blue-700 dark:text-blue-400 font-bold transition-all flex items-center gap-1.5'
        : 'pb-2 border-b-2 border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all flex items-center gap-1.5';
    }

    window.renderTripGalleryGrid();
  };

  // Render Grid of Trip Cards in Library Modal
  window.renderTripGalleryGrid = async function() {
    const grid = document.getElementById('tripGalleryGrid');
    if (!grid) return;

    grid.innerHTML = '<div class="trip-loading p-4 text-center text-xs text-slate-500">Loading trips...</div>';

    // Update cloud badge count if connected
    const cloudFiles = window.__gdriveCloudFiles || [];
    const badgeCount = document.getElementById('cloudFileBadgeCount');
    if (badgeCount) {
      if (cloudFiles.length > 0) {
        badgeCount.innerText = String(cloudFiles.length);
        badgeCount.style.display = 'inline-block';
      } else {
        badgeCount.style.display = 'none';
      }
    }

    if (currentTripLibraryTab === 'cloud') {
      grid.innerHTML = '';
      if (!window.isGoogleDriveConnected || !window.isGoogleDriveConnected()) {
        grid.innerHTML = `
          <div class="col-span-full p-6 text-center bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div class="text-3xl mb-2">☁️</div>
            <h4 class="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">Google Drive Not Connected</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400 mb-3 max-w-sm mx-auto">Sign in with Google to automatically back up and view all your <code>.json</code> trip files from your <strong>Google Drive / TrenscendsTravelPlanner</strong> folder.</p>
            <button class="action-btn action-btn-primary text-xs" onclick="window.closeTripLibraryModal(); window.openCloudSyncModal();">🔑 Connect Google Drive</button>
          </div>
        `;
        return;
      }

      if (cloudFiles.length === 0) {
        grid.innerHTML = `
          <div class="col-span-full p-6 text-center bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div class="text-3xl">📁</div>
            <h4 class="font-bold text-slate-800 dark:text-slate-200 text-sm">No Cloud Trips Found</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400">Click below to upload all your current trips or sync your Google Drive folder.</p>
            <div class="flex justify-center gap-2 pt-1">
              <button class="action-btn action-btn-secondary text-xs" onclick="window.syncAllTripsFromGoogleDrive()">🔄 Sync Drive Now</button>
              <button class="action-btn action-btn-primary text-xs" onclick="window.uploadAllLocalTripsToDrive()">⬆️ Upload Local Trips</button>
            </div>
          </div>
        `;
        return;
      }

      grid.innerHTML = `
        <div class="col-span-full mb-2 flex flex-wrap items-center justify-between gap-2 p-3 bg-blue-50/80 dark:bg-blue-950/40 rounded-xl border border-blue-200/70 dark:border-blue-800/70">
          <span class="text-xs font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1">
            <span>☁️ Drive Folder: <strong>Google Drive / TrenscendsTravelPlanner</strong></span>
            <span class="text-[11px] opacity-80">(${cloudFiles.length} files)</span>
          </span>
          <div class="flex flex-wrap items-center gap-2">
            <button class="action-btn action-btn-primary text-xs py-1 px-3 flex items-center gap-1" onclick="window.createNewTripInGoogleDrive()">
              <span>➕</span>
              <span>New Cloud Trip</span>
            </button>
            <button class="action-btn action-btn-secondary text-xs py-1 px-2.5 flex items-center gap-1" onclick="window.uploadLocalJsonFileToDrive()" title="Upload a local JSON trip file directly into Google Drive">
              <span>📥</span>
              <span>Upload JSON</span>
            </button>
            <button class="action-btn action-btn-secondary text-xs py-1 px-2.5 flex items-center gap-1" onclick="window.refreshGoogleDriveFolder()" title="Rescan Google Drive folder for newly pasted JSON files">
              <span>🔄</span>
              <span>Refresh Drive</span>
            </button>
          </div>
        </div>
      `;

      const activeTripId = typeof window.getActiveTripId === 'function' ? window.getActiveTripId() : '';
      const fileMap = typeof window.getGDriveFileMap === 'function' ? window.getGDriveFileMap() : {};

      cloudFiles.forEach(file => {
        const sizeKb = file.size ? `${(parseInt(file.size, 10) / 1024).toFixed(1)} KB` : 'JSON Document';
        const modTime = file.modifiedTime ? new Date(file.modifiedTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Synced';
        const isActiveFile = fileMap[activeTripId] === file.id;

        const card = document.createElement('div');
        card.className = `trip-gallery-card p-4 ${isActiveFile ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700' : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700'} rounded-2xl border flex flex-col justify-between space-y-3`;
        card.innerHTML = `
          <div>
            <div class="flex items-center justify-between gap-2 mb-1.5">
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/70">☁️ Google Drive File</span>
              ${isActiveFile ? `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">● Active</span>` : `<span class="text-[11px] text-slate-400">🕒 ${modTime}</span>`}
            </div>
            <h3 class="font-bold text-slate-800 dark:text-slate-100 text-sm truncate flex items-center gap-1.5">
              <span>📄</span>
              <span class="truncate">${escapeHtml(file.name)}</span>
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 pt-1">Size: ${sizeKb} • Modified: ${modTime}</p>
          </div>
          <div class="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
            <button class="action-btn ${isActiveFile ? 'action-btn-primary' : 'action-btn-secondary'} text-xs flex-1" onclick="window.loadTripFromGoogleDrive('${file.id}')">
              ${isActiveFile ? '✓ Currently Open' : '📥 Load & Open'}
            </button>
            <a href="https://drive.google.com/file/d/${file.id}/view" target="_blank" rel="noopener noreferrer" class="action-btn action-btn-secondary text-xs" title="Open file in Google Drive">↗ Drive</a>
            <button class="action-btn action-btn-danger text-xs px-2.5" onclick="window.deleteTripFromGoogleDrive('${file.id}', '${escapeHtml(file.name)}')" title="Delete file from Google Drive">🗑️</button>
          </div>
        `;
        grid.appendChild(card);
      });
      return;
    }

    // Local Trips rendering
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

  // Rename Trip directly from Dropdown
  window.renameTripFromDropdown = async function(event, tripId, currentTitle) {
    if (event) event.stopPropagation();
    const newTitle = prompt('Enter new trip title:', currentTitle || 'My Trip');
    if (!newTitle || !newTitle.trim() || newTitle.trim() === currentTitle) return;

    const cleanTitle = newTitle.trim();
    const trips = typeof window.getAllTripsFromIndexedDB === 'function' ? await window.getAllTripsFromIndexedDB() : [];
    const targetTrip = trips.find(t => t.id === tripId);

    if (targetTrip) {
      if (targetTrip.data && targetTrip.data.meta) {
        targetTrip.data.meta.title = cleanTitle;
      }
      targetTrip.title = cleanTitle;
      if (typeof window.saveTripToIndexedDB === 'function') {
        await window.saveTripToIndexedDB(targetTrip);
      }
    }

    const activeTripId = typeof window.getActiveTripId === 'function' ? window.getActiveTripId() : '';
    if (activeTripId === tripId) {
      if (typeof window.tripData !== 'undefined' && window.tripData && window.tripData.meta) {
        window.tripData.meta.title = cleanTitle;
      }
      const titleEl = document.getElementById('currentTripTitle');
      if (titleEl) titleEl.innerText = cleanTitle;
    }

    if (typeof window.isGoogleDriveConnected === 'function' && window.isGoogleDriveConnected() && targetTrip) {
      if (typeof window.uploadTripToGoogleDrive === 'function') {
        await window.uploadTripToGoogleDrive(targetTrip, true);
      }
    }

    if (typeof window.renderHeaderTripSwitcher === 'function') window.renderHeaderTripSwitcher();
    if (typeof window.renderTripGalleryGrid === 'function') window.renderTripGalleryGrid();
    if (typeof window.showToast === 'function') window.showToast(`✏️ Renamed trip to "${cleanTitle}"`);
  };

  // Delete Trip directly from Dropdown
  window.deleteTripFromDropdown = async function(event, tripId, tripTitle) {
    if (event) event.stopPropagation();
    const cleanTitle = tripTitle || 'this trip';
    if (!confirm(`Are you sure you want to delete "${cleanTitle}"?`)) return;

    if (typeof window.deleteTripDocument === 'function') {
      await window.deleteTripDocument(tripId);
    }
    if (typeof window.renderHeaderTripSwitcher === 'function') window.renderHeaderTripSwitcher();
    if (typeof window.renderTripGalleryGrid === 'function') window.renderTripGalleryGrid();
    if (typeof window.showToast === 'function') window.showToast(`🗑️ Deleted "${cleanTitle}"`);
  };

  // Rename Cloud File directly from Dropdown
  window.renameCloudFileFromDropdown = async function(event, fileId, currentName) {
    if (event) event.stopPropagation();
    const cleanCurrent = currentName.replace(/\.json$/i, '');
    const newTitle = prompt('Enter new trip title:', cleanCurrent);
    if (!newTitle || !newTitle.trim() || newTitle.trim() === cleanCurrent) return;

    const cleanTitle = newTitle.trim();
    if (typeof window.loadTripFromGoogleDrive === 'function') {
      const loaded = await window.loadTripFromGoogleDrive(fileId);
      if (loaded) {
        if (typeof window.tripData !== 'undefined' && window.tripData && window.tripData.meta) {
          window.tripData.meta.title = cleanTitle;
        }
        const activeTripId = typeof window.getActiveTripId === 'function' ? window.getActiveTripId() : '';
        const trips = typeof window.getAllTripsFromIndexedDB === 'function' ? await window.getAllTripsFromIndexedDB() : [];
        const activeTrip = trips.find(t => t.id === activeTripId);
        if (activeTrip) {
          activeTrip.title = cleanTitle;
          if (activeTrip.data && activeTrip.data.meta) activeTrip.data.meta.title = cleanTitle;
          await window.saveTripToIndexedDB(activeTrip);
          await window.uploadTripToGoogleDrive(activeTrip, true);
        }
      }
    }

    if (typeof window.renderHeaderTripSwitcher === 'function') window.renderHeaderTripSwitcher();
    if (typeof window.renderTripGalleryGrid === 'function') window.renderTripGalleryGrid();
    if (typeof window.showToast === 'function') window.showToast(`✏️ Renamed cloud trip to "${cleanTitle}"`);
  };

  // Notion-Style Trip Emoji Customizer Functions
  window.openTripEmojiPicker = function(event) {
    if (event) event.stopPropagation();
    const modal = document.getElementById('tripEmojiPickerModal');
    if (!modal) return;

    const popover = modal.querySelector('.modal-container');
    const searchInput = document.getElementById('notionEmojiSearchInput');
    if (searchInput) {
      searchInput.value = '';
      if (typeof window.filterNotionEmojiPicker === 'function') window.filterNotionEmojiPicker('');
    }

    modal.style.display = 'flex';

    if (popover) {
      popover.style.position = 'relative';
      popover.style.top = 'auto';
      popover.style.left = 'auto';
      popover.style.backgroundColor = '#222222';
      popover.style.opacity = '1';
    }

    setTimeout(() => {
      if (searchInput) searchInput.focus();
    }, 100);
  };

  window.closeTripEmojiPicker = function() {
    const modal = document.getElementById('tripEmojiPickerModal');
    if (modal) modal.style.display = 'none';
  };

  window.selectTripEmoji = async function(emoji) {
    if (!emoji) return;
    const cleanEmoji = emoji.trim();
    const activeTripId = typeof window.getActiveTripId === 'function' ? window.getActiveTripId() : '';

    if (typeof window.tripData !== 'undefined' && window.tripData) {
      if (!window.tripData.meta) window.tripData.meta = {};
      window.tripData.meta.icon = cleanEmoji;
    }

    const trips = typeof window.getAllTripsFromIndexedDB === 'function' ? await window.getAllTripsFromIndexedDB() : [];
    const activeTrip = trips.find(t => t.id === activeTripId);

    if (activeTrip) {
      activeTrip.flags = cleanEmoji;
      if (!activeTrip.data) activeTrip.data = {};
      if (!activeTrip.data.meta) activeTrip.data.meta = {};
      activeTrip.data.meta.icon = cleanEmoji;

      if (typeof window.saveTripToIndexedDB === 'function') {
        await window.saveTripToIndexedDB(activeTrip);
      }

      if (typeof window.isGoogleDriveConnected === 'function' && window.isGoogleDriveConnected()) {
        if (typeof window.uploadTripToGoogleDrive === 'function') {
          await window.uploadTripToGoogleDrive(activeTrip, true);
        }
      }
    }

    window.closeTripEmojiPicker();
    if (typeof window.renderHeaderTripSwitcher === 'function') window.renderHeaderTripSwitcher();
    if (typeof window.renderTripGalleryGrid === 'function') window.renderTripGalleryGrid();
    if (typeof window.showToast === 'function') window.showToast(`🎨 Trip icon updated to ${cleanEmoji}`);
  };

  window.autoDetectAndApplyTripEmoji = async function() {
    if (typeof window.getCurrentAppData !== 'function') return;
    const appData = window.getCurrentAppData();
    const summary = typeof window.extractTripSummary === 'function' ? window.extractTripSummary(appData) : null;
    const autoEmoji = (summary && summary.flags) ? summary.flags.split(' ')[0] : '✈️';
    await window.selectTripEmoji(autoEmoji);
  };

  window.filterNotionEmojiPicker = function(query) {
    const q = (query || '').toLowerCase().trim();
    const buttons = document.querySelectorAll('#notionEmojiGridContainer .emoji-item-btn');
    buttons.forEach(btn => {
      if (!q) {
        btn.style.display = 'block';
      } else {
        const text = btn.innerText.toLowerCase();
        const parentCategory = btn.closest('.emoji-category-block');
        const catName = parentCategory ? (parentCategory.dataset.category || '').toLowerCase() : '';
        if (text.includes(q) || catName.includes(q)) {
          btn.style.display = 'block';
        } else {
          btn.style.display = 'none';
        }
      }
    });
  };

  window.scrollToEmojiCategory = function(category) {
    const block = document.querySelector(`#notionEmojiGridContainer [data-category="${category}"]`);
    if (block) {
      block.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  window.selectRandomTripEmoji = async function() {
    const funEmojis = ['🧭', '✈️', '🌍', '🏝️', '🧳', '🏕️', '🏔️', '🗺️', '🗼', '🏯', '⛩️', '🗿', '🎡', '🏰', '🗽', '🌋', '⛷️', '🏖️', '⛵', '🌊', '☀️', '🌴', '🌸', '🍁', '🍷', '🍜', '🍕', '🍣', '🥐', '☕', '🍺', '🍹', '🇯🇵', '🇨🇭', '🇮🇹', '🇫🇷', '🇹🇭', '🇦🇺', '🇦🇹', '🇹🇼', '🇬🇧', '🇺🇸', '🇪🇸', '🇩🇪', '🇸🇬', '🇮🇩', '🇳🇿', '🇻🇳', '🇨🇦', '🇬🇷', '🇲🇽', '🇧🇷'];
    const randomEmoji = funEmojis[Math.floor(Math.random() * funEmojis.length)];
    await window.selectTripEmoji(randomEmoji);
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
