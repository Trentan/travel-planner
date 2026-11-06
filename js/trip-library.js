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
          }).catch(err => {
            console.warn('Failed to sync trips from Google Drive in dropdown:', err);
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

  // Mobile Bottom-Sheet Trip Switcher Handler (Issue #634)
  window.handleTripSwitcherTap = function(event) {
    if (event) {
      if (typeof event.preventDefault === 'function') event.preventDefault();
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
    }
    const isMobile = (typeof window.isMobileViewport === 'function' && window.isMobileViewport()) ||
      (typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 768px)').matches);

    if (isMobile) {
      window.openTripBottomSheet();
    } else {
      window.toggleTripDropdown(event);
    }
  };

  // Open Mobile Bottom-Sheet Trip Switcher
  window.openTripBottomSheet = async function() {
    const sheet = document.getElementById('tripBottomSheet');
    if (!sheet) return;
    sheet.classList.add('open');
    sheet.setAttribute('aria-hidden', 'false');
    sheet.removeAttribute('inert');
    document.body.classList.add('trip-bottom-sheet-open');
    await window.renderTripBottomSheet();
    if (typeof window.isGoogleDriveConnected === 'function' && window.isGoogleDriveConnected()) {
      if (typeof window.syncAllTripsFromGoogleDrive === 'function') {
        window.syncAllTripsFromGoogleDrive(true).then(() => {
          window.renderTripBottomSheet();
        }).catch(err => {
          console.warn('Failed to sync trips in bottom sheet:', err);
        });
      }
    }
  };

  // Close Mobile Bottom-Sheet Trip Switcher
  window.closeTripBottomSheet = function(event) {
    if (event && typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }
    const sheet = document.getElementById('tripBottomSheet');
    if (!sheet) return;
    sheet.classList.remove('open');
    sheet.setAttribute('aria-hidden', 'true');
    sheet.setAttribute('inert', '');
    document.body.classList.remove('trip-bottom-sheet-open');
  };

  // Render Mobile Bottom-Sheet Switcher with Top 3 Recent Trips
  window.renderTripBottomSheet = async function() {
    const listEl = document.getElementById('tripBottomSheetRecentList');
    if (!listEl) return;
    if (typeof window.getAllTripsFromIndexedDB !== 'function') return;

    const trips = await window.getAllTripsFromIndexedDB();
    const cloudFiles = window.__gdriveCloudFiles || [];
    const activeTripId = window.getActiveTripId ? window.getActiveTripId() : 'trip_default';
    const isDriveConnected = typeof window.isGoogleDriveConnected === 'function' && window.isGoogleDriveConnected();
    const fileMap = typeof window.getGDriveFileMap === 'function' ? window.getGDriveFileMap() : {};

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
        dateRange: trip.dateRange || (trip.data && trip.data.meta && trip.data.meta.dates) || 'Flexible dates',
        flags: trip.flags || '✈️',
        storageState: isDriveConnected ? (matchedCloudFile ? 'synced' : 'local_only') : 'local_only',
        isCurrent: trip.id === activeTripId,
        source: 'local'
      });
    });

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
      const titleEl = document.getElementById('currentTripTitle');
      const iconEl = document.getElementById('currentTripIcon');
      const curTitle = (titleEl && titleEl.innerText) ? titleEl.innerText.trim() : 'My Trip';
      const curEmoji = (iconEl && iconEl.innerText) ? iconEl.innerText.trim() : '✈️';
      unifiedList.push({
        id: activeTripId || 'trip_default',
        cloudFileId: null,
        title: curTitle,
        filename: 'my_trip.json',
        dateRange: 'Current Itinerary',
        flags: curEmoji,
        storageState: 'local_only',
        isCurrent: true,
        source: 'local'
      });
    }

    listEl.innerHTML = '';
    const topTrips = unifiedList.slice(0, 3);
    if (topTrips.length === 0) {
      listEl.innerHTML = '<div class="p-3 text-xs text-slate-500 italic text-center">No recent trips found.</div>';
      return;
    }

    topTrips.forEach(item => {
      const isCurrent = item.isCurrent;
      const isCloudSynced = item.storageState === 'synced';
      const isCloudOnly = item.storageState === 'cloud_only';

      let badgeHtml = '';
      if (isCloudSynced) {
        badgeHtml = '<span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">☁️ Synced</span>';
      } else if (isCloudOnly) {
        badgeHtml = '<span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300">☁️ Remote</span>';
      } else {
        badgeHtml = '<span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">⚡ Local</span>';
      }

      const card = document.createElement('div');
      card.className = `trip-bottom-sheet-item p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
        isCurrent
          ? 'bg-teal-50/90 dark:bg-teal-950/50 border-teal-500 shadow-xs ring-1 ring-teal-500/30'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
      }`;
      card.onclick = () => {
        window.closeTripBottomSheet();
        if (isCloudOnly) {
          if (typeof window.loadTripFromGoogleDrive === 'function') {
            window.loadTripFromGoogleDrive(item.cloudFileId);
          }
        } else if (!isCurrent) {
          if (typeof window.switchActiveTrip === 'function') {
            window.switchActiveTrip(item.id);
          }
        }
      };

      const flagChar = item.flags ? item.flags.split(' ')[0] : '✈️';
      card.innerHTML = `
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <span class="text-2xl p-2 bg-slate-100 dark:bg-slate-700/60 rounded-xl shrink-0 select-none">${safeEscapeHtml(flagChar)}</span>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm truncate ${isCurrent ? 'text-teal-900 dark:text-teal-200' : 'text-slate-900 dark:text-slate-100'}">${safeEscapeHtml(item.title)}</span>
              ${badgeHtml}
            </div>
            <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 truncate">
              <span>📅 ${safeEscapeHtml(item.dateRange)}</span>
            </div>
          </div>
        </div>
        ${isCurrent ? '<span class="text-teal-600 dark:text-teal-400 font-bold text-base shrink-0 mr-1" aria-label="Active trip">✓</span>' : ''}
      `;
      listEl.appendChild(card);
    });
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
    const bottomSheetEl = document.getElementById('tripBottomSheet');
    const isSheetOpen = bottomSheetEl && bottomSheetEl.classList && typeof bottomSheetEl.classList.contains === 'function' && bottomSheetEl.classList.contains('open');
    if (isSheetOpen && typeof window.renderTripBottomSheet === 'function') {
      window.renderTripBottomSheet();
    }

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

      const safeItemIdJs = safeEscapeHtml(escapeJs(item.id));
      const safeCloudFileIdJs = safeEscapeHtml(escapeJs(item.cloudFileId));
      const safeCloudFileIdUrl = safeEscapeHtml(encodeURIComponent(item.cloudFileId || ''));
      const safeTitleJs = safeEscapeHtml(escapeJs(item.title));
      const safeFilenameJs = safeEscapeHtml(escapeJs(item.filename));

      const clickHandler = isCloudOnly
        ? `window.closeTripDropdown(); window.loadTripFromGoogleDrive('${safeCloudFileIdJs}');`
        : `window.closeTripDropdown(); ${!isCurrent ? `window.switchActiveTrip('${safeItemIdJs}')` : ''}`;

      elem.innerHTML = `
        <div class="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer" onclick="${clickHandler}">
          <span class="trip-item-icon shrink-0 text-sm">${isCurrent ? '✓' : safeEscapeHtml(item.flags)}</span>
          <div class="trip-item-info min-w-0 flex-1">
            <div class="trip-item-title truncate text-xs flex items-center gap-1.5">
              <span class="truncate ${isCurrent ? 'font-bold text-teal-900 dark:text-teal-200' : ''}">${safeEscapeHtml(item.title)}</span>
              ${badgeHtml}
            </div>
            <div class="trip-item-sub text-[10px] text-slate-400 dark:text-slate-500 truncate font-mono mt-0.5">${safeEscapeHtml(item.filename)}</div>
          </div>
        </div>
        <div class="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
          ${!isCloudOnly ? `
            <button class="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-xs" onclick="window.renameTripFromDropdown(event, '${safeItemIdJs}', '${safeTitleJs}')" title="Rename trip">✏️</button>
          ` : `
            <button class="p-1 hover:bg-blue-200 dark:hover:bg-blue-900 rounded text-xs" onclick="window.renameCloudFileFromDropdown(event, '${safeCloudFileIdJs}', '${safeFilenameJs}')" title="Rename cloud file">✏️</button>
          `}
          ${item.cloudFileId ? `
            <a href="https://drive.google.com/file/d/${safeCloudFileIdUrl}/view" target="_blank" rel="noopener noreferrer" class="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-xs text-slate-500" title="View physical file in Google Drive" onclick="event.stopPropagation();">↗</a>
          ` : ''}
          ${!isCloudOnly && trips.length > 1 ? `
            <button class="p-1 hover:bg-red-100 dark:hover:bg-red-950/60 rounded text-xs text-red-600" onclick="window.deleteTripFromDropdown(event, '${safeItemIdJs}', '${safeTitleJs}')" title="Delete trip">🗑️</button>
          ` : ''}
          ${isCloudOnly ? `
            <button class="p-1 hover:bg-red-100 dark:hover:bg-red-950/60 rounded text-xs text-red-600" onclick="window.deleteTripFromGoogleDrive('${safeCloudFileIdJs}', '${safeFilenameJs}')" title="Delete cloud file">🗑️</button>
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

    // Immediately trigger telemetry without waiting for gallery
    if (typeof window.renderStorageTelemetry === 'function') {
      window.renderStorageTelemetry();
    }

    // Trigger Google Drive sync in background if connected to pull latest cloud trips
    if (typeof window.isGoogleDriveConnected === 'function' && window.isGoogleDriveConnected() && typeof window.syncAllTripsFromGoogleDrive === 'function') {
      window.syncAllTripsFromGoogleDrive(true).catch(e => console.warn('Library background Drive sync notice:', e));
    }

    try {
      await window.renderTripGalleryGrid();
    } catch (err) {
      console.error('Failed to render trip gallery grid:', err);
    }
  };

  window.renderStorageTelemetry = async function() {
    const quotaText = document.getElementById('storageQuotaText');
    const persistBtn = document.getElementById('requestPersistStorageBtn');
    if (!quotaText) return;

    if (typeof window.getStorageTelemetry === 'function') {
      try {
        const telemetry = await window.getStorageTelemetry();
        if (telemetry && telemetry.supported && telemetry.quota > 0) {
          const persistStatus = telemetry.persisted ? '🟢 Persistent: Active' : '🟡 Persistent: Standard';
          quotaText.innerHTML = `💾 <strong>Storage:</strong> ${safeEscapeHtml(telemetry.usageFormatted)} used of ${safeEscapeHtml(telemetry.quotaFormatted)} (${persistStatus})`;
          if (persistBtn) {
            persistBtn.style.display = telemetry.persisted ? 'none' : 'inline-block';
          }
        } else {
          quotaText.innerText = '💾 Storage: Local Storage (Active)';
          if (persistBtn) persistBtn.style.display = 'none';
        }
      } catch (err) {
        quotaText.innerText = '💾 Storage: Local Storage (Active)';
        if (persistBtn) persistBtn.style.display = 'none';
      }
    } else {
      quotaText.innerText = '💾 Storage: Local Storage (Active)';
      if (persistBtn) persistBtn.style.display = 'none';
    }
  };

  window.requestPersistentStorageFromUI = async function() {
    if (typeof window.requestStoragePersistence === 'function') {
      const granted = await window.requestStoragePersistence();
      if (granted) {
        if (typeof window.showToast === 'function') {
          window.showToast('✅ Persistent storage granted! Your itineraries are safe from browser evictions.');
        } else {
          alert('Persistent storage granted!');
        }
      } else {
        if (typeof window.showToast === 'function') {
          window.showToast('ℹ️ Persistent storage was not granted by the browser.');
        }
      }
      if (typeof window.renderStorageTelemetry === 'function') {
        await window.renderStorageTelemetry();
      }
    }
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

    // If switching to Cloud tab and Drive is connected but no files cached yet, fetch automatically
    if (tabName === 'cloud' && typeof window.isGoogleDriveConnected === 'function' && window.isGoogleDriveConnected() && (!window.__gdriveCloudFiles || window.__gdriveCloudFiles.length === 0) && typeof window.syncAllTripsFromGoogleDrive === 'function') {
      const grid = document.getElementById('tripGalleryGrid');
      if (grid) {
        grid.innerHTML = '<div class="trip-loading p-8 text-center text-xs text-slate-500"><span>⏳ Fetching trips from Google Drive...</span></div>';
      }
      window.syncAllTripsFromGoogleDrive(false);
      return;
    }

    window.renderTripGalleryGrid();
  };

  // Render Consolidated Grid of Trip Cards in Library Modal
  window.renderTripGalleryGrid = async function() {
    const grid = document.getElementById('tripGalleryGrid');
    if (!grid) return;

    grid.innerHTML = '<div class="trip-loading p-8 text-center text-xs text-slate-500 font-medium">Loading your itineraries...</div>';

    const safeIsSafeUrl = (url) => {
      if (typeof window.isSafeUrl === 'function') return window.isSafeUrl(url);
      if (typeof isSafeUrl === 'function') return isSafeUrl(url);
      if (!url || typeof url !== 'string') return false;
      return /^(https?:|\/|data:image\/)/i.test(url.trim());
    };

    try {
      const isDriveConnected = typeof window.isGoogleDriveConnected === 'function' && window.isGoogleDriveConnected();
      const cloudFiles = window.__gdriveCloudFiles || [];
      const fileMap = typeof window.getGDriveFileMap === 'function'
        ? window.getGDriveFileMap()
        : (function() {
            try { return JSON.parse(localStorage.getItem('travelApp_gdrive_file_map') || '{}'); } catch(e) { return {}; }
          })();

      // Fetch local trips
      const trips = (typeof window.getAllTripsFromIndexedDB === 'function')
        ? await window.getAllTripsFromIndexedDB()
        : [];
      const activeTripId = typeof window.getActiveTripId === 'function'
        ? window.getActiveTripId()
        : 'trip_default';

      // Update sync pill text in modal header if present
      const syncPill = document.getElementById('cloudSyncStatusPill');
      const syncHint = document.getElementById('tripLibrarySyncHint');
      if (syncPill) {
        if (isDriveConnected) {
          syncPill.className = 'cloud-status-pill text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer shrink-0 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
          syncPill.innerHTML = '☁️ Google Drive Connected';
          if (syncHint) syncHint.innerText = 'Itineraries sync across your devices automatically.';
        } else {
          syncPill.className = 'cloud-status-pill text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer shrink-0 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
          syncPill.innerHTML = '⚡ Local Storage';
          if (syncHint) syncHint.innerText = 'Itineraries are saved safely to this device.';
        }
      }

      // Reconcile and unify Local Trips + Google Drive Cloud Files
      const cloudFileIdMap = new Map();
      cloudFiles.forEach(cf => cloudFileIdMap.set(cf.id, cf));

      const cloudFileNameMap = new Map();
      cloudFiles.forEach(cf => cloudFileNameMap.set(cf.name.toLowerCase(), cf));

      const unifiedList = [];
      const matchedCloudFileIds = new Set();

      trips.forEach(trip => {
        if (!trip) return;
        const rawTitle = trip.title || (trip.data && trip.data.meta && trip.data.meta.title) || 'Untitled Trip';
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

        const legCount = (typeof trip.legCount !== 'undefined' && trip.legCount !== null)
          ? trip.legCount
          : (trip.data && Array.isArray(trip.data.itinerary) ? trip.data.itinerary.length : (trip.data && Array.isArray(trip.data.legs) ? trip.data.legs.length : 0));
        const stayCount = (typeof trip.stayCount !== 'undefined' && trip.stayCount !== null)
          ? trip.stayCount
          : (trip.data && Array.isArray(trip.data.stays) ? trip.data.stays.length : (trip.data && Array.isArray(trip.data.accommodations) ? trip.data.accommodations.length : 0));

        const rawDate = trip.updatedAt ? new Date(trip.updatedAt) : null;
        const updatedDate = (rawDate && !isNaN(rawDate.getTime()))
          ? rawDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
          : (trip.updatedAt ? String(trip.updatedAt) : 'Recently');

        unifiedList.push({
          id: trip.id,
          cloudFileId: matchedCloudFile ? matchedCloudFile.id : null,
          title: rawTitle,
          subtitle: trip.subtitle || (trip.data && trip.data.meta && trip.data.meta.subtitle) || '',
          flags: trip.flags || (trip.data && trip.data.meta && trip.data.meta.icon) || '🌍',
          dates: trip.dateRange || (trip.data && trip.data.meta && trip.data.meta.dates) || 'Flexible Dates',
          legCount,
          stayCount,
          updatedAt: updatedDate,
          isCurrent: trip.id === activeTripId,
          isDriveSynced: isDriveConnected && !!matchedCloudFile,
          isCloudOnly: false
        });
      });

      // Include remote-only Google Drive files if connected
      if (isDriveConnected) {
        cloudFiles.forEach(cf => {
          if (!matchedCloudFileIds.has(cf.id)) {
            const rawTitle = cf.name.replace(/\.json$/i, '').replace(/_/g, ' ');
            unifiedList.push({
              id: `cloud_${cf.id}`,
              cloudFileId: cf.id,
              title: rawTitle,
              subtitle: 'Google Drive file',
              flags: '☁️',
              dates: cf.modifiedTime ? new Date(cf.modifiedTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Google Drive Itinerary',
              legCount: 0,
              stayCount: 0,
              isCurrent: false,
              isDriveSynced: true,
              isCloudOnly: true,
              updatedAt: cf.modifiedTime ? new Date(cf.modifiedTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'
            });
          }
        });
      }

      grid.innerHTML = '';

      if (unifiedList.length === 0) {
        const titleEl = document.getElementById('currentTripTitle') || document.getElementById('mainTitle');
        const curTitle = (titleEl && titleEl.innerText) ? titleEl.innerText.trim() : 'My Trip';
        const curIcon = document.getElementById('currentTripIcon') || document.getElementById('heroTripEmoji');
        const curEmoji = (curIcon && curIcon.innerText) ? curIcon.innerText.trim() : '✈️';
        const legCount = (typeof window.appData !== 'undefined' && Array.isArray(window.appData)) ? window.appData.length : 0;
        let stayCount = 0;
        if (typeof window.appData !== 'undefined' && Array.isArray(window.appData)) {
          window.appData.forEach(leg => {
            if (leg && Array.isArray(leg.stays)) stayCount += leg.stays.length;
          });
        }
        unifiedList.push({
          id: activeTripId || 'trip_default',
          cloudFileId: null,
          title: curTitle,
          subtitle: '',
          flags: curEmoji,
          dates: 'Current Itinerary',
          legCount,
          stayCount,
          isCurrent: true,
          isDriveSynced: false,
          isCloudOnly: false,
          updatedAt: 'Recently'
        });
      }

      unifiedList.forEach(item => {
        const isCurrent = item.isCurrent;
        const isCloudOnly = item.isCloudOnly;
        const isDriveSynced = item.isDriveSynced;
        const safeTripIdJs = safeEscapeHtml(escapeJs(item.id));
        const safeCloudFileIdJs = safeEscapeHtml(escapeJs(item.cloudFileId));

        const card = document.createElement('div');
        card.className = `trip-gallery-card p-4 md:p-5 rounded-2xl border transition-all ${
          isCurrent
            ? 'active-card ring-2 ring-teal-500/40 bg-teal-50/40 dark:bg-teal-950/30 border-teal-500 shadow-sm'
            : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-xs'
        }`;

        const flagChar = item.flags ? item.flags.split(' ')[0] : '✈️';

        const switchHandler = isCloudOnly
          ? `window.closeTripLibraryModal(); window.loadTripFromGoogleDrive('${safeCloudFileIdJs}');`
          : `window.switchActiveTrip('${safeTripIdJs}');`;

        card.innerHTML = `
          <div class="flex items-start justify-between gap-3 mb-2">
            <div class="flex items-start gap-3 min-w-0 flex-1">
              <span class="text-3xl p-2.5 bg-slate-100 dark:bg-slate-700/60 rounded-2xl shrink-0 select-none">${safeEscapeHtml(flagChar)}</span>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="font-bold text-base md:text-lg text-slate-900 dark:text-slate-100 truncate">${safeEscapeHtml(item.title)}</h3>
                  ${isCurrent ? '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300">● Active</span>' : ''}
                  ${isDriveSynced ? '<span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">☁️ Synced</span>' : ''}
                  ${isCloudOnly ? '<span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">☁️ Remote File</span>' : ''}
                </div>
                ${item.subtitle ? `<p class="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">${safeEscapeHtml(item.subtitle)}</p>` : ''}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-wrap text-xs text-slate-600 dark:text-slate-300 my-3 py-2 px-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl">
            <span class="font-medium">📅 ${safeEscapeHtml(item.dates)}</span>
            ${!isCloudOnly ? `
              <span class="text-slate-300 dark:text-slate-600">•</span>
              <span>📍 ${safeEscapeHtml(item.legCount)} legs</span>
              <span class="text-slate-300 dark:text-slate-600">•</span>
              <span>🏨 ${safeEscapeHtml(item.stayCount)} stays</span>
            ` : ''}
            ${item.updatedAt ? `
              <span class="text-slate-300 dark:text-slate-600">•</span>
              <span class="text-slate-500 dark:text-slate-400">🕒 Updated ${safeEscapeHtml(item.updatedAt)}</span>
            ` : ''}
          </div>

          <div class="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-700/60">
            <div>
              ${isCurrent
                ? '<span class="text-xs font-bold text-teal-700 dark:text-teal-400 py-1.5 px-3 rounded-lg bg-teal-100/60 dark:bg-teal-900/40 inline-flex items-center gap-1">✓ Currently Open</span>'
                : `<button class="action-btn action-btn-primary text-xs py-2 px-4 rounded-xl font-semibold shadow-xs" onclick="${switchHandler}">${isCloudOnly ? '📥 Load from Drive' : 'Open Itinerary'}</button>`
              }
            </div>
            <div class="flex items-center gap-1">
              ${!isCloudOnly ? `
                <button class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors" onclick="window.duplicateTripFromLibrary('${safeTripIdJs}')" title="Duplicate itinerary">
                  <span>📋</span> <span class="hidden sm:inline">Duplicate</span>
                </button>
                <button class="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors" onclick="window.exportTripFromLibrary('${safeTripIdJs}')" title="Export JSON backup">
                  <span>📥</span> <span class="hidden sm:inline">Export</span>
                </button>
                ${!isCurrent && trips.length > 1 ? `
                  <button class="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-medium transition-colors" onclick="window.deleteTripFromLibrary('${safeTripIdJs}')" title="Delete itinerary">
                    <span>🗑️</span>
                  </button>
                ` : ''}
              ` : `
                <button class="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-medium transition-colors" onclick="window.deleteTripFromGoogleDrive('${safeCloudFileIdJs}', '${safeEscapeHtml(escapeJs(item.title))}')" title="Delete from Drive">
                  <span>🗑️</span>
                </button>
              `}
            </div>
          </div>
        `;
        grid.appendChild(card);
      });
    } catch (err) {
      console.error('Failed to render trip gallery grid:', err);
      const isDriveConnected = typeof window.isGoogleDriveConnected === 'function' && window.isGoogleDriveConnected();
      const rawMsg = (err && typeof err.message === 'string' && err.message.trim()) ? err.message.trim() : 'Storage error';

      const errCard = document.createElement('div');
      errCard.className = 'col-span-full p-6 text-center bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-800 space-y-3';

      const iconDiv = document.createElement('div');
      iconDiv.className = 'text-3xl';
      iconDiv.textContent = '⚠️';

      const titleH4 = document.createElement('h4');
      titleH4.className = 'font-bold text-rose-900 dark:text-rose-200 text-sm';
      titleH4.textContent = 'Unable to Load Trips';

      const msgP = document.createElement('p');
      msgP.className = 'text-xs text-rose-700 dark:text-rose-300 max-w-sm mx-auto';
      msgP.textContent = `An error occurred while loading your saved itineraries (${rawMsg}).`;

      const btnGroup = document.createElement('div');
      btnGroup.className = 'flex justify-center gap-2 pt-1';

      const retryBtn = document.createElement('button');
      retryBtn.className = 'action-btn action-btn-primary text-xs';
      retryBtn.textContent = '🔄 Retry';
      retryBtn.onclick = function() { window.renderTripGalleryGrid(); };
      if (typeof retryBtn.setAttribute === 'function') {
        retryBtn.setAttribute('onclick', 'window.renderTripGalleryGrid()');
      }

      btnGroup.appendChild(retryBtn);

      if (isDriveConnected) {
        const syncBtn = document.createElement('button');
        syncBtn.className = 'action-btn action-btn-secondary text-xs';
        syncBtn.textContent = '☁️ Sync Drive';
        syncBtn.onclick = function() { window.syncAllTripsFromGoogleDrive(); };
        if (typeof syncBtn.setAttribute === 'function') {
          syncBtn.setAttribute('onclick', 'window.syncAllTripsFromGoogleDrive()');
        }
        btnGroup.appendChild(syncBtn);
      }

      errCard.appendChild(iconDiv);
      errCard.appendChild(titleH4);
      errCard.appendChild(msgP);
      errCard.appendChild(btnGroup);

      if (typeof grid.replaceChildren === 'function') {
        grid.replaceChildren(errCard);
      } else {
        grid.innerHTML = '';
        grid.appendChild(errCard);
      }
    }
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

  // Helper escape HTML string with fallback to global escapeHtmlText
  function safeEscapeHtml(str) {
    if (typeof escapeHtmlText === 'function') return escapeHtmlText(str);
    if (typeof window !== 'undefined' && typeof window.escapeHtmlText === 'function') return window.escapeHtmlText(str);
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeJs(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/</g, '\\x3c')
      .replace(/>/g, '\\x3e')
      .replace(/&/g, '\\x26');
  }

  // Initialize Header Trip Switcher on DOM load
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        if (typeof window.renderHeaderTripSwitcher === 'function') {
          window.renderHeaderTripSwitcher();
        }
      }, 500);
    });
  }
})();
