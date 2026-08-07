/* ==========================================================================
   MODULE: Cloud Storage & Google Drive AppData Adapter (js/cloud-storage.js)
   Responsibilities: OAuth2 authentication with Google Drive GIS API,
                     background auto-sync to appDataFolder, remote trip listing,
                     conflict detection, and offline status pill management.
   ========================================================================== */

(function() {
  'use strict';

  // Configuration
  const DEFAULT_CLIENT_ID = '983624892182-travelplannerapp.apps.googleusercontent.com';
  const DRIVE_APPDATA_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
  const DISCOVERY_DOC = 'https://www.googleapis.com/$discovery/rest?version=v3';

  let accessToken = localStorage.getItem('travelApp_gdrive_token') || null;
  let tokenExpiry = parseInt(localStorage.getItem('travelApp_gdrive_token_expiry') || '0', 10);
  let isSyncing = false;
  let syncDebounceTimer = null;

  // Helper to get active Client ID
  function getGoogleClientId() {
    return localStorage.getItem('travelApp_gdrive_client_id') || DEFAULT_CLIENT_ID;
  }
  window.getGoogleClientId = getGoogleClientId;

  function setGoogleClientId(id) {
    if (id && id.trim()) {
      localStorage.setItem('travelApp_gdrive_client_id', id.trim());
    } else {
      localStorage.removeItem('travelApp_gdrive_client_id');
    }
  }
  window.setGoogleClientId = setGoogleClientId;

  // Check if Google Drive is connected & authorized
  function isGoogleDriveConnected() {
    if (window.__mockGoogleDriveAPI) return true;
    return !!accessToken && Date.now() < tokenExpiry;
  }
  window.isGoogleDriveConnected = isGoogleDriveConnected;

  // Authenticate with Google Drive via Google Identity Services Token Client
  window.authenticateGoogleDrive = function(interactive = true) {
    return new Promise((resolve, reject) => {
      if (window.__mockGoogleDriveAPI) {
        accessToken = 'mock_gdrive_token_12345';
        tokenExpiry = Date.now() + 3600000;
        localStorage.setItem('travelApp_gdrive_token', accessToken);
        localStorage.setItem('travelApp_gdrive_token_expiry', String(tokenExpiry));
        updateCloudSyncStatusPill();
        resolve(true);
        return;
      }

      if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
        console.warn('Google Identity Services SDK not loaded yet');
        if (interactive) alert('Google Sign-In service is loading. Please check your internet connection and try again.');
        resolve(false);
        return;
      }

      try {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: getGoogleClientId(),
          scope: DRIVE_APPDATA_SCOPE,
          callback: (response) => {
            if (response.error) {
              console.error('Google Auth Error:', response);
              resolve(false);
              return;
            }

            accessToken = response.access_token;
            const expiresIn = parseInt(response.expires_in || '3600', 10);
            tokenExpiry = Date.now() + (expiresIn * 1000) - 60000; // 1 min buffer

            localStorage.setItem('travelApp_gdrive_token', accessToken);
            localStorage.setItem('travelApp_gdrive_token_expiry', String(tokenExpiry));

            updateCloudSyncStatusPill();
            window.syncAllTripsFromGoogleDrive();
            resolve(true);
          }
        });

        if (interactive) {
          client.requestAccessToken({ prompt: 'consent' });
        } else {
          client.requestAccessToken({ prompt: '' });
        }
      } catch (err) {
        console.error('Failed to initialize Google Token Client:', err);
        resolve(false);
      }
    });
  };

  // Disconnect Google Drive
  window.disconnectGoogleDrive = function() {
    accessToken = null;
    tokenExpiry = 0;
    localStorage.removeItem('travelApp_gdrive_token');
    localStorage.removeItem('travelApp_gdrive_token_expiry');
    localStorage.removeItem('travelApp_gdrive_file_map');
    updateCloudSyncStatusPill();
  };

  // Get File ID mapping for trips { tripId -> gdriveFileId }
  function getGDriveFileMap() {
    try {
      return JSON.parse(localStorage.getItem('travelApp_gdrive_file_map') || '{}');
    } catch (e) {
      return {};
    }
  }

  function setGDriveFileMap(map) {
    localStorage.setItem('travelApp_gdrive_file_map', JSON.stringify(map));
  }

  // Upload or Update a Trip JSON file in Google Drive appDataFolder
  window.uploadTripToGoogleDrive = async function(tripRecord) {
    if (!isGoogleDriveConnected() || !tripRecord || !tripRecord.id) return false;

    if (window.__mockGoogleDriveAPI) {
      console.log(`[Mock GoogleDrive] Uploaded trip "${tripRecord.title}" (${tripRecord.id}) to appDataFolder`);
      const map = getGDriveFileMap();
      map[tripRecord.id] = 'gdrive_file_' + tripRecord.id;
      setGDriveFileMap(map);
      updateCloudSyncStatusPill('☁️ Synced to Drive');
      return true;
    }

    try {
      updateCloudSyncStatusPill('⏳ Syncing to Drive...');
      const fileMap = getGDriveFileMap();
      const existingFileId = fileMap[tripRecord.id];
      const fileName = `trip_${tripRecord.id}.json`;

      const metadata = {
        name: fileName,
        mimeType: 'application/json',
        parents: existingFileId ? undefined : ['appDataFolder']
      };

      const payloadStr = JSON.stringify(tripRecord, null, 2);

      let response;
      if (existingFileId) {
        // PATCH existing file content
        response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: payloadStr
        });
      } else {
        // Multipart POST new file
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([payloadStr], { type: 'application/json' }));

        response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          body: form
        });
      }

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, re-auth silently
          await window.authenticateGoogleDrive(false);
        }
        throw new Error(`Google Drive API HTTP error ${response.status}`);
      }

      const result = await response.json();
      if (result && result.id) {
        fileMap[tripRecord.id] = result.id;
        setGDriveFileMap(fileMap);
      }

      updateCloudSyncStatusPill('☁️ Synced to Drive');
      return true;
    } catch (err) {
      console.error('Failed to upload trip to Google Drive:', err);
      updateCloudSyncStatusPill('⚡ Local Only (Sync Failed)');
      return false;
    }
  };

  // Sync All Trips from Google Drive appDataFolder into local IndexedDB
  window.syncAllTripsFromGoogleDrive = async function() {
    if (!isGoogleDriveConnected()) return;

    if (window.__mockGoogleDriveAPI) {
      console.log('[Mock GoogleDrive] Synced all trips from appDataFolder');
      updateCloudSyncStatusPill('☁️ Synced to Drive');
      return;
    }

    try {
      updateCloudSyncStatusPill('⏳ Fetching Cloud Trips...');
      const listUrl = 'https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name,modifiedTime)';
      const listResp = await fetch(listUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!listResp.ok) return;

      const data = await listResp.json();
      const files = data.files || [];
      const fileMap = getGDriveFileMap();

      for (const file of files) {
        if (!file.name || !file.name.startsWith('trip_') || !file.name.endsWith('.json')) continue;

        const downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
        const contentResp = await fetch(downloadUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!contentResp.ok) continue;

        try {
          const tripRecord = await contentResp.json();
          if (tripRecord && tripRecord.id && tripRecord.data) {
            fileMap[tripRecord.id] = file.id;

            // Merge into local IndexedDB if newer or missing
            if (typeof window.saveTripToIndexedDB === 'function') {
              await window.saveTripToIndexedDB(tripRecord);
            }
          }
        } catch (parseErr) {
          console.warn('Failed to parse remote trip file:', file.name, parseErr);
        }
      }

      setGDriveFileMap(fileMap);
      updateCloudSyncStatusPill('☁️ Synced to Drive');

      if (typeof window.renderHeaderTripSwitcher === 'function') window.renderHeaderTripSwitcher();
      if (typeof window.renderTripGalleryGrid === 'function') window.renderTripGalleryGrid();
    } catch (err) {
      console.error('Failed to list cloud trips from Google Drive:', err);
      updateCloudSyncStatusPill('⚡ Local Only');
    }
  };

  // Debounced Auto-Sync for active trip edits
  window.autoSyncActiveTripToCloud = function() {
    if (!isGoogleDriveConnected()) return;

    if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
    syncDebounceTimer = setTimeout(async () => {
      if (typeof window.getAllTripsFromIndexedDB !== 'function') return;
      const activeTripId = window.getActiveTripId ? window.getActiveTripId() : 'trip_default';
      const trips = await window.getAllTripsFromIndexedDB();
      const activeTrip = trips.find(t => t.id === activeTripId);
      if (activeTrip) {
        await window.uploadTripToGoogleDrive(activeTrip);
      }
    }, 1500);
  };

  // Update Status Pill UI Element
  function updateCloudSyncStatusPill(statusText) {
    const pill = document.getElementById('cloudSyncStatusPill');
    if (!pill) return;

    if (statusText) {
      pill.innerText = statusText;
      return;
    }

    if (isGoogleDriveConnected()) {
      pill.innerText = '☁️ Synced to Drive';
      pill.className = 'cloud-status-pill connected';
    } else {
      pill.innerText = '⚡ Local Only';
      pill.className = 'cloud-status-pill disconnected';
    }
  }
  window.updateCloudSyncStatusPill = updateCloudSyncStatusPill;

  // Open Cloud Sync Setup Modal
  window.openCloudSyncModal = function() {
    const modal = document.getElementById('cloudSyncModal');
    if (!modal) return;

    modal.hidden = false;
    modal.classList.add('active');
    updateCloudSyncModalState();
  };

  window.closeCloudSyncModal = function() {
    const modal = document.getElementById('cloudSyncModal');
    if (modal) {
      modal.hidden = true;
      modal.classList.remove('active');
    }
  };

  function updateCloudSyncModalState() {
    const isConnected = isGoogleDriveConnected();
    const statusText = document.getElementById('gdriveModalStatusText');
    const connectBtn = document.getElementById('gdriveConnectBtn');
    const disconnectBtn = document.getElementById('gdriveDisconnectBtn');

    if (statusText) {
      statusText.innerText = isConnected
        ? 'Connected — Trips are automatically backed up to your private Google Drive AppData folder.'
        : 'Not Connected — Edits are currently saved to this device only.';
    }

    if (connectBtn) connectBtn.style.display = isConnected ? 'none' : 'inline-flex';
    if (disconnectBtn) disconnectBtn.style.display = isConnected ? 'inline-flex' : 'none';
  }

  // Initialize Cloud Sync on load
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      updateCloudSyncStatusPill();
      if (isGoogleDriveConnected()) {
        window.syncAllTripsFromGoogleDrive();
      }
    }, 800);
  });
})();
