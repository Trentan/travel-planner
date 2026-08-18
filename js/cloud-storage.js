/* ==========================================================================
   MODULE: Cloud Storage & Google Drive Dedicated Folder Adapter (js/cloud-storage.js)
   Responsibilities: Google Drive dedicated folder ("TrenscendsTravelPlanner"),
                     human-readable JSON file sync, local directory sync folder,
                     and background auto-save to cloud/local folders.
   ========================================================================== */

(function() {
  'use strict';

  const PROD_CLIENT_ID = '253620621116-u76e3v3e2qv6ffq9b58re4l4bbqs1e3g.apps.googleusercontent.com';
  const LOCAL_CLIENT_ID = '253620621116-cq4mtef5e2nvt0kc7pbcs4t1rdblg7q5.apps.googleusercontent.com';
  const DRIVE_FOLDER_NAME = 'TrenscendsTravelPlanner';
  const DRIVE_SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';

  let accessToken = null;
  let tokenExpiry = 0;
  let gdriveFolderId = null;
  let userProfile = null;
  let syncDebounceTimer = null;

  // Helper to detect native platform execution (Capacitor Android/iOS, local file protocol, or mock)
  function isNativePlatform() {
    if (window.__mockGoogleDriveAPI) return true;
    if (window.location && window.location.protocol === 'file:') return true;
    if (window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()) return true;
    if (window.Capacitor && typeof window.Capacitor.getPlatform === 'function' && window.Capacitor.getPlatform() !== 'web') return true;
    if (window.isCapacitorNative) return true;
    return false;
  }
  window.isNativePlatform = isNativePlatform;

  try {
    accessToken = localStorage.getItem('travelApp_gdrive_token') || null;
    tokenExpiry = parseInt(localStorage.getItem('travelApp_gdrive_token_expiry') || '0', 10);
    gdriveFolderId = localStorage.getItem('travelApp_gdrive_folder_id') || null;
    userProfile = JSON.parse(localStorage.getItem('travelApp_user_profile') || 'null');

    // Unconditionally purge any legacy mock tokens or mock profile data across all platforms
    if ((accessToken && accessToken.startsWith('token_')) || (userProfile && (userProfile.email === 'account@google.com' || userProfile.name.includes('Mobile App')))) {
      accessToken = null;
      tokenExpiry = 0;
      gdriveFolderId = null;
      userProfile = null;
      localStorage.removeItem('travelApp_gdrive_connected');
      localStorage.removeItem('travelApp_gdrive_token');
      localStorage.removeItem('travelApp_gdrive_token_expiry');
      localStorage.removeItem('travelApp_gdrive_folder_id');
      localStorage.removeItem('travelApp_user_profile');
    }
  } catch (e) {
    userProfile = null;
  }

  // Get/Set User Profile
  function getUserProfile() {
    return userProfile;
  }
  window.getUserProfile = getUserProfile;

  window.openCloudSyncModal = function() {
    const modal = document.getElementById('cloudSyncModal');
    if (!modal) return;
    modal.hidden = false;
    modal.style.display = 'flex';
    modal.classList.add('active');
    if (typeof updateCloudSyncModalState === 'function') updateCloudSyncModalState();
  };

  window.closeCloudSyncModal = function() {
    const modal = document.getElementById('cloudSyncModal');
    if (modal) {
      modal.hidden = true;
      modal.style.display = 'none';
      modal.classList.remove('active');
    }
  };

  function setUserProfile(profile) {
    userProfile = profile;
    if (profile) {
      localStorage.setItem('travelApp_user_profile', JSON.stringify(profile));
    } else {
      localStorage.removeItem('travelApp_user_profile');
    }
  }

  // Helper to get active Client ID (auto-detects local vs production Client IDs)
  function getGoogleClientId() {
    const custom = localStorage.getItem('travelApp_gdrive_client_id');
    if (custom) return custom;

    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return LOCAL_CLIENT_ID;
    }
    return PROD_CLIENT_ID;
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
    const isConnectedFlag = localStorage.getItem('travelApp_gdrive_connected') === 'true';
    return isConnectedFlag || (!!accessToken && (Date.now() < tokenExpiry || (accessToken && accessToken.startsWith('token_'))));
  }
  window.isGoogleDriveConnected = isGoogleDriveConnected;

  // Ensure valid active Google OAuth access token (performs silent refresh if expired)
  async function ensureValidAccessToken() {
    if (accessToken && Date.now() < tokenExpiry) return accessToken;
    const isConnectedFlag = localStorage.getItem('travelApp_gdrive_connected') === 'true';
    if (!isConnectedFlag && !accessToken) return null;

    if (window.__mockGoogleDriveAPI || (accessToken && accessToken.startsWith('token_'))) {
      return accessToken || 'token_mock_123';
    }

    try {
      console.log('[GoogleDrive Silent Token Refresh] Requesting silent background access token update...');
      const ok = await window.authenticateGoogleDrive(false);
      if (ok) return accessToken;
    } catch (err) {
      console.warn('Silent Google token refresh attempted:', err);
    }
    return accessToken;
  }
  window.ensureValidAccessToken = ensureValidAccessToken;

  // Get Google Drive folder URL for user convenience
  function getGoogleDriveFolderUrl() {
    if (gdriveFolderId && !gdriveFolderId.startsWith('mock_')) {
      return `https://drive.google.com/drive/folders/${gdriveFolderId}`;
    }
    return 'https://drive.google.com/drive/my-drive';
  }
  window.getGoogleDriveFolderUrl = getGoogleDriveFolderUrl;

  // Ensure "TrenscendsTravelPlanner" folder exists in user's Google Drive root
  async function ensureDriveFolder() {
    if (!isGoogleDriveConnected() || (accessToken && accessToken.startsWith('token_')) || window.__mockGoogleDriveAPI) {
      return 'mock_folder_id_123';
    }

    if (gdriveFolderId && !gdriveFolderId.startsWith('mock_')) return gdriveFolderId;
    if (gdriveFolderId && gdriveFolderId.startsWith('mock_')) {
      gdriveFolderId = null;
      localStorage.removeItem('travelApp_gdrive_folder_id');
    }

    try {
      // 1. Search for existing "TrenscendsTravelPlanner" folder
      const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`;
      const searchResp = await fetch(searchUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (searchResp.ok) {
        const searchData = await searchResp.json();
        if (searchData.files && searchData.files.length > 0) {
          gdriveFolderId = searchData.files[0].id;
          localStorage.setItem('travelApp_gdrive_folder_id', gdriveFolderId);
          return gdriveFolderId;
        }
      }

      // 2. Create "TrenscendsTravelPlanner" folder if not found in root My Drive
      const createResp = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: DRIVE_FOLDER_NAME,
          mimeType: 'application/vnd.google-apps.folder',
          parents: ['root']
        })
      });

      if (createResp.ok) {
        const folderData = await createResp.json();
        gdriveFolderId = folderData.id;
        localStorage.setItem('travelApp_gdrive_folder_id', gdriveFolderId);
        return gdriveFolderId;
      }
    } catch (err) {
      console.warn('Failed to ensure TrenscendsTravelPlanner folder in Google Drive:', err);
    }
    return null;
  }

  // Authenticate with Google Drive via Native GoogleAuth Plugin (Mobile) or Google Identity Services Token Client (Web)
  async function authenticateGoogleDrive(interactive = true) {
    const clientId = getGoogleClientId();

    const connectBtn = document.getElementById('gdriveConnectBtn');
    const originalBtnHtml = connectBtn ? connectBtn.innerHTML : '';
    const statusTextEl = document.getElementById('gdriveModalStatusText');

    const setLoadingUI = (isLoading, message = 'Connecting to Google...') => {
      if (connectBtn) {
        connectBtn.disabled = isLoading;
        if (isLoading) {
          connectBtn.classList.add('opacity-80', 'cursor-wait');
          connectBtn.innerHTML = `
            <svg class="animate-spin w-4 h-4 text-white shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>${message}</span>
          `;
        } else {
          connectBtn.classList.remove('opacity-80', 'cursor-wait');
          connectBtn.innerHTML = originalBtnHtml;
        }
      }
      if (statusTextEl && isLoading) {
        statusTextEl.innerText = 'Connecting to Google Drive and syncing your itineraries...';
      }
      if (isLoading) {
        updateCloudSyncStatusPill('⏳ Connecting...', 'syncing');
      }
    };

    if (interactive) setLoadingUI(true, 'Connecting...');

    // 1. Check Native Android/iOS GoogleAuth Plugin
    const isNative = window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform();
    const nativeAuthPlugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.GoogleAuth;

    if (isNative) {
      if (nativeAuthPlugin && typeof nativeAuthPlugin.signIn === 'function') {
        try {
          console.log('[GoogleAuth Native] Initializing & launching native Android Google Account picker...');
          if (typeof nativeAuthPlugin.initialize === 'function') {
            try {
              await nativeAuthPlugin.initialize({
                clientId: clientId,
                scopes: ['profile', 'email', 'https://www.googleapis.com/auth/drive.file'],
                grantOfflineAccess: false
              });
            } catch (initErr) {
              console.warn('[GoogleAuth Native] initialize notice:', initErr);
            }
          }
          const user = await nativeAuthPlugin.signIn();
          if (user) {
            if (interactive) setLoadingUI(true, 'Syncing trips...');
            accessToken = (user.authentication && user.authentication.accessToken) || (user.authentication && user.authentication.idToken) || '';
            tokenExpiry = Date.now() + (3600 * 1000) - 60000;

            setUserProfile({
              name: user.name || user.givenName || 'Google Traveler',
              email: user.email || '',
              picture: user.imageUrl || ''
            });

            localStorage.setItem('travelApp_gdrive_connected', 'true');
            if (accessToken) {
              localStorage.setItem('travelApp_gdrive_token', accessToken);
              localStorage.setItem('travelApp_gdrive_token_expiry', String(tokenExpiry));
            }

            await ensureDriveFolder();
            updateCloudSyncStatusPill();
            updateCloudSyncModalState();

            if (typeof window.renderHeaderTripSwitcher === 'function') window.renderHeaderTripSwitcher();
            await window.uploadAllLocalTripsToDrive();
            await window.syncAllTripsFromGoogleDrive();
            setLoadingUI(false);
            return true;
          }
        } catch (nativeErr) {
          console.error('[GoogleAuth Native] Native sign-in error:', nativeErr);
          setLoadingUI(false);
          if (String(nativeErr).toLowerCase().includes('cancel') || String(nativeErr).includes('12501')) {
            return false;
          }
          if (typeof showToast === 'function') {
            showToast(`⚠️ Google Sign-In: ${nativeErr?.message || nativeErr || 'Authentication failed'}`);
          }
          return false;
        }
      } else {
        console.error('[GoogleAuth Native] Native GoogleAuth plugin not available on device.');
        setLoadingUI(false);
        if (typeof showToast === 'function') {
          showToast('⚠️ Google Sign-In is unavailable on this build.');
        }
        return false;
      }
    }

    // 2. Web Google Identity Services (GIS) / Token Client Flow
    return new Promise((resolve, reject) => {
      const proceedOAuth = () => {
        try {
          const client = google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: DRIVE_SCOPES,
            callback: async (response) => {
              if (response && response.access_token) {
                accessToken = response.access_token;
                const expiresIn = parseInt(response.expires_in || '3600', 10);
                tokenExpiry = Date.now() + (expiresIn * 1000) - 60000;

                localStorage.setItem('travelApp_gdrive_connected', 'true');
                localStorage.setItem('travelApp_gdrive_token', accessToken);
                localStorage.setItem('travelApp_gdrive_token_expiry', String(tokenExpiry));

                // Fetch User Profile from Google UserInfo API
                try {
                  const userResp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                  });
                  if (userResp.ok) {
                    const user = await userResp.json();
                    setUserProfile({
                      name: user.name || user.email || 'Google Traveler',
                      email: user.email || '',
                      picture: user.picture || ''
                    });
                  }
                } catch (e) {
                  setUserProfile({ name: 'Google Traveler', email: '', picture: '' });
                }

                await ensureDriveFolder();
                updateCloudSyncStatusPill();
                updateCloudSyncModalState();

                // Sync all trips: Push local trips & pull remote trips
                await window.uploadAllLocalTripsToDrive();
                await window.syncAllTripsFromGoogleDrive();
                resolve(true);
                return;
              }

              if (response && response.error) {
                console.error('Google OAuth Error:', response);
                if (String(response.error).includes('origin') || String(response.error).includes('mismatch')) {
                  showOriginMismatchNotice('origin_mismatch');
                } else if (interactive) {
                  alert(`Google OAuth Notice: ${response.error}`);
                }
                resolve(false);
              }
            },
            error_callback: (err) => {
              console.error('Google OAuth Popup Error:', err);
              const errStr = JSON.stringify(err || {});
              if (errStr.includes('origin') || errStr.includes('mismatch') || errStr.includes('400')) {
                showOriginMismatchNotice('origin_mismatch');
              } else if (interactive) {
                showOriginMismatchNotice('origin_mismatch');
              }
              resolve(false);
            }
          });

          client.requestAccessToken({ prompt: interactive ? undefined : '' });
        } catch (err) {
          console.error('Failed to launch Google OAuth Client:', err);
          showOriginMismatchNotice('origin_mismatch');
          resolve(false);
        }
      };

      if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
        if (typeof document !== 'undefined' && !document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
          const s = document.createElement('script');
          s.src = 'https://accounts.google.com/gsi/client';
          s.async = true;
          s.defer = true;
          document.head.appendChild(s);
        }
        let retries = 0;
        const checkInterval = setInterval(() => {
          retries++;
          if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
            clearInterval(checkInterval);
            proceedOAuth();
          } else if (retries >= 10) {
            clearInterval(checkInterval);
            // Fallback for Android WebViews & environments where GIS client is blocked:
            const redirectUri = window.location.origin + window.location.pathname;
            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(DRIVE_SCOPES)}&include_granted_scopes=true&prompt=select_account`;
            if (interactive) {
              window.location.href = authUrl;
            }
            resolve(false);
          }
        }, 150);
        return;
      }

      proceedOAuth();
    });
  }

  // Process OAuth Access Token returned in URL hash from standard OAuth redirect
  async function processOAuthCallbackFromUrl() {
    if (typeof window === 'undefined' || !window.location) return false;
    const hash = window.location.hash || '';
    if (!hash || !hash.includes('access_token=')) return false;

    const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : hash);
    const token = hashParams.get('access_token');
    const expiresIn = parseInt(hashParams.get('expires_in') || '3600', 10);

    if (token) {
      accessToken = token;
      tokenExpiry = Date.now() + (expiresIn * 1000) - 60000;
      localStorage.setItem('travelApp_gdrive_connected', 'true');
      localStorage.setItem('travelApp_gdrive_token', accessToken);
      localStorage.setItem('travelApp_gdrive_token_expiry', String(tokenExpiry));

      if (window.history && window.history.replaceState) {
        const cleanUrl = window.location.pathname + window.location.search;
        window.history.replaceState(null, '', cleanUrl);
      }

      try {
        const userResp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (userResp.ok) {
          const user = await userResp.json();
          setUserProfile({
            name: user.name || user.email || 'Google Traveler',
            email: user.email || '',
            picture: user.picture || ''
          });
        }
      } catch (e) {
        setUserProfile({ name: 'Google Traveler', email: '', picture: '' });
      }

      await ensureDriveFolder();
      updateCloudSyncStatusPill();
      updateCloudSyncModalState();

      if (typeof window.renderHeaderTripSwitcher === 'function') window.renderHeaderTripSwitcher();
      await window.uploadAllLocalTripsToDrive();
      await window.syncAllTripsFromGoogleDrive();
      return true;
    }
    return false;
  }
  window.processOAuthCallbackFromUrl = processOAuthCallbackFromUrl;
  window.authenticateGoogleDrive = authenticateGoogleDrive;

  function showOriginMismatchNotice(errorType) {
    const notice = document.getElementById('gdriveOriginMismatchNotice');
    if (!notice) return;

    const currentOrigin = window.location.origin;
    const clientId = getGoogleClientId();

    notice.style.display = 'block';
    notice.innerHTML = `
      <div class="font-bold text-amber-900 dark:text-amber-200 text-xs flex items-center gap-1.5">
        <span>⚠️ Google OAuth Origin Mismatch (Error 400: origin_mismatch)</span>
      </div>
      <p class="pt-1">Google Cloud blocked sign-in from <code class="bg-amber-100 dark:bg-amber-900/80 px-1.5 py-0.5 rounded font-mono font-bold">${escapeHtml(currentOrigin)}</code> because this domain/port is not registered under Authorized JavaScript Origins for Client ID <code class="bg-amber-100 dark:bg-amber-900/80 px-1.5 py-0.5 rounded font-mono text-[11px] block mt-1">${escapeHtml(clientId)}</code>.</p>
      
      <div class="font-bold pt-1.5 text-amber-900 dark:text-amber-200 text-xs">How to Resolve This:</div>
      <ul class="list-disc pl-4 space-y-1 pt-0.5 text-slate-700 dark:text-amber-100">
        <li><strong>Option A (Use Live Production Domain)</strong>: Open the live site at <a href="https://trentan.github.io/travel-planner/" target="_blank" class="underline font-bold text-blue-600 dark:text-blue-400">https://trentan.github.io/travel-planner/</a> (where <code>https://trentan.github.io</code> is authorized).</li>
        <li><strong>Option B (Update Google Cloud Console)</strong>:
          Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" class="underline font-bold text-blue-600 dark:text-blue-400">Google Cloud Credentials Console ↗</a>, open OAuth 2.0 Client ID, and under <strong>Authorized JavaScript origins</strong> add:<br>
          <code class="bg-amber-100 dark:bg-amber-900/80 px-1.5 py-0.5 rounded font-mono select-all text-[11px] block mt-1">${escapeHtml(currentOrigin)}</code>
        </li>
      </ul>
    `;
  }
  window.showOriginMismatchNotice = showOriginMismatchNotice;

  function completeSeamlessSignIn() {
    return window.authenticateGoogleDrive(true);
  }

  // Disconnect Google Drive & Sign Out
  window.disconnectGoogleDrive = function() {
    window.__mockGoogleDriveAPI = false;
    accessToken = null;
    tokenExpiry = 0;
    gdriveFolderId = null;
    setUserProfile(null);
    localStorage.removeItem('travelApp_gdrive_connected');
    localStorage.removeItem('travelApp_gdrive_token');
    localStorage.removeItem('travelApp_gdrive_token_expiry');
    localStorage.removeItem('travelApp_gdrive_folder_id');
    localStorage.removeItem('travelApp_gdrive_file_map');
    updateCloudSyncStatusPill();
    updateCloudSyncModalState();
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

  // Sanitize trip title for human-readable filename (e.g. "Europe_Summer_2026.json")
  function formatHumanFilename(tripRecord) {
    const rawTitle = tripRecord.title || (tripRecord.data && tripRecord.data.title) || (tripRecord.data && tripRecord.data.meta && tripRecord.data.meta.title) || 'My Trip';
    const cleanName = rawTitle.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_');
    return `${cleanName || 'Trip'}.json`;
  }

  // Upload or Update a Trip JSON file inside Google Drive / TrenscendsTravelPlanner
  window.uploadTripToGoogleDrive = async function(tripRecord, isSilent = false) {
    if (!isGoogleDriveConnected() || !tripRecord || !tripRecord.id) return false;
    await ensureValidAccessToken();

    if ((accessToken && accessToken.startsWith('token_')) || window.__mockGoogleDriveAPI) {
      const fileName = formatHumanFilename(tripRecord);
      console.log(`[GoogleDrive Sync] Simulated sync of "${fileName}" to Google Drive / ${DRIVE_FOLDER_NAME}`);
      const map = getGDriveFileMap();
      map[tripRecord.id] = 'gdrive_file_' + tripRecord.id;
      setGDriveFileMap(map);
      if (!isSilent) {
        updateCloudSyncStatusPill(`☁️ Synced to Drive / ${DRIVE_FOLDER_NAME}`, 'connected');
      }
      return true;
    }

    try {
      if (!isSilent) {
        updateCloudSyncStatusPill('⏳ Syncing to Google Drive...', 'syncing');
      }
      const folderId = await ensureDriveFolder();
      const fileMap = getGDriveFileMap();
      let existingFileId = fileMap[tripRecord.id];

      // Purge fake mock file IDs on real API calls
      if (existingFileId && (existingFileId.startsWith('gdrive_file_') || existingFileId.startsWith('mock_'))) {
        existingFileId = null;
        delete fileMap[tripRecord.id];
        setGDriveFileMap(fileMap);
      }

      const fileName = formatHumanFilename(tripRecord);
      const payloadStr = JSON.stringify(tripRecord, null, 2);

      let response;
      if (existingFileId) {
        // PATCH existing file content in TrenscendsTravelPlanner folder
        response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: payloadStr
        });

        // Also update filename in case title changed
        fetch(`https://www.googleapis.com/drive/v3/files/${existingFileId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name: fileName })
        }).catch(() => {});

        // Fallback: If file was deleted on Google Drive (HTTP 404), re-create file
        if (response.status === 404) {
          console.warn(`File ${existingFileId} not found in Google Drive. Re-creating "${fileName}"...`);
          existingFileId = null;
          delete fileMap[tripRecord.id];
          setGDriveFileMap(fileMap);
        }
      }

      if (!existingFileId) {
        // Prevent duplicate files: Query Google Drive folder for an existing file with the exact same filename
        try {
          const checkQuery = encodeURIComponent(`'${folderId}' in parents and name = '${fileName.replace(/'/g, "\\'")}' and trashed = false`);
          const checkResp = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=${checkQuery}&fields=files(id,name)`,
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
          );
          if (checkResp.ok) {
            const checkData = await checkResp.json();
            if (checkData.files && checkData.files.length > 0) {
              existingFileId = checkData.files[0].id;
              fileMap[tripRecord.id] = existingFileId;
              setGDriveFileMap(fileMap);

              // PATCH existing duplicate file instead of creating another copy
              response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`, {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                },
                body: payloadStr
              });
            }
          }
        } catch (e) {
          console.warn('Duplicate check query warning:', e);
        }
      }

      if (!existingFileId) {
        // Multipart POST new file to TrenscendsTravelPlanner folder using MIME RFC 2046 format
        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        const metadata = {
          name: fileName,
          mimeType: 'application/json'
        };
        if (folderId) {
          metadata.parents = [folderId];
        }

        const multipartRequestBody =
          delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          'Content-Type: application/json\r\n\r\n' +
          payloadStr +
          close_delim;

        response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary="${boundary}"`
          },
          body: multipartRequestBody
        });
      }

      if (!response.ok) {
        if (response.status === 401) {
          updateCloudSyncStatusPill('🔑 Google Sign-In Required', 'error');
          await window.authenticateGoogleDrive(false);
        }
        throw new Error(`Google Drive API HTTP error ${response.status}`);
      }

      const result = await response.json();
      if (result && result.id) {
        fileMap[tripRecord.id] = result.id;
        setGDriveFileMap(fileMap);
      }

      updateCloudSyncStatusPill(`☁️ Synced to Drive / ${DRIVE_FOLDER_NAME}`, 'connected');
      return true;
    } catch (err) {
      console.error('Failed to upload trip to Google Drive:', err);
      updateCloudSyncStatusPill('⚡ Local Only (Sync Failed)', 'error');
      return false;
    }
  }
  window.uploadTripToGoogleDrive = uploadTripToGoogleDrive;

  // Upload all local trips to Google Drive
  window.uploadAllLocalTripsToDrive = async function() {
    if (!isGoogleDriveConnected() || typeof window.getAllTripsFromIndexedDB !== 'function') return;
    try {
      const trips = await window.getAllTripsFromIndexedDB();
      for (const trip of trips) {
        await window.uploadTripToGoogleDrive(trip);
      }
    } catch (err) {
      console.warn('Failed to upload local trips to Google Drive:', err);
    }
  };

  // Upload Active Trip to Google Drive
  window.uploadActiveTripToGoogleDrive = async function() {
    if (!isGoogleDriveConnected()) {
      window.openCloudSyncModal();
      return false;
    }
    const activeTripId = typeof window.getActiveTripId === 'function' ? window.getActiveTripId() : 'trip_default';
    const trips = typeof window.getAllTripsFromIndexedDB === 'function' ? await window.getAllTripsFromIndexedDB() : [];
    const activeTrip = trips.find(t => t.id === activeTripId) || (typeof window.buildActiveTripRecord === 'function' ? window.buildActiveTripRecord() : null);

    if (activeTrip) {
      updateCloudSyncStatusPill('⏳ Uploading to Drive...', 'syncing');
      const ok = await window.uploadTripToGoogleDrive(activeTrip);
      if (ok) {
        if (typeof window.showToast === 'function') window.showToast(`☁️ Backed up "${activeTrip.title || 'Trip'}" to Google Drive!`);
        updateCloudSyncStatusPill('☁️ Synced to Drive', 'connected');
        if (typeof window.renderHeaderTripSwitcher === 'function') window.renderHeaderTripSwitcher();
        if (typeof window.renderTripGalleryGrid === 'function') window.renderTripGalleryGrid();
        return true;
      }
    }
    return false;
  };

  // Upload any Trip by ID to Google Drive
  window.uploadTripByIdToDrive = async function(tripId) {
    if (!isGoogleDriveConnected()) {
      window.openCloudSyncModal();
      return false;
    }
    const trips = typeof window.getAllTripsFromIndexedDB === 'function' ? await window.getAllTripsFromIndexedDB() : [];
    const targetTrip = trips.find(t => t.id === tripId);
    if (targetTrip) {
      updateCloudSyncStatusPill('⏳ Syncing Trip...', 'syncing');
      const ok = await window.uploadTripToGoogleDrive(targetTrip);
      if (ok) {
        if (typeof window.showToast === 'function') window.showToast(`☁️ Synced "${targetTrip.title || 'Trip'}" to Google Drive!`);
        updateCloudSyncStatusPill('☁️ Synced', 'connected');
        if (typeof window.renderTripGalleryGrid === 'function') window.renderTripGalleryGrid();
        if (typeof window.renderHeaderTripSwitcher === 'function') window.renderHeaderTripSwitcher();
        return true;
      }
    }
    return false;
  };

  // Sync All Trips from Google Drive / TrenscendsTravelPlanner into local IndexedDB
  window.syncAllTripsFromGoogleDrive = async function(isSilent = false) {
    if (!isGoogleDriveConnected()) return [];
    await ensureValidAccessToken();

    if ((accessToken && accessToken.startsWith('token_')) || window.__mockGoogleDriveAPI) {
      console.log(`[GoogleDrive Sync] Simulated fetch of all trips from Google Drive / ${DRIVE_FOLDER_NAME}`);
      const localTrips = typeof window.getAllTripsFromIndexedDB === 'function' ? await window.getAllTripsFromIndexedDB() : [];
      window.__gdriveCloudFiles = localTrips.map(t => ({
        id: t.id || ('gdrive_file_' + Math.random().toString(36).substr(2, 6)),
        name: formatHumanFilename(t),
        modifiedTime: t.updatedAt || t.lastSaved || new Date().toISOString(),
        size: JSON.stringify(t).length
      }));
      if (!isSilent) updateCloudSyncStatusPill(`☁️ Synced to Drive / ${DRIVE_FOLDER_NAME}`, 'connected');
      if (typeof window.renderHeaderTripSwitcher === 'function') window.renderHeaderTripSwitcher();
      if (typeof window.renderTripGalleryGrid === 'function') window.renderTripGalleryGrid();
      return window.__gdriveCloudFiles;
    }

    try {
      if (!isSilent) updateCloudSyncStatusPill('⏳ Fetching Cloud Trips...', 'syncing');
      const folderId = await ensureDriveFolder();
      // Search dedicated folder as well as any .json files in user's Google Drive
      const query = folderId
        ? `('${folderId}' in parents or name contains '.json' or mimeType='application/json') and trashed=false`
        : `(name contains '.json' or mimeType='application/json') and trashed=false`;
      const listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,modifiedTime,size)&pageSize=50`;
      const listResp = await fetch(listUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!listResp.ok) return [];

      const data = await listResp.json();
      const files = data.files || [];
      window.__gdriveCloudFiles = files;
      const fileMap = getGDriveFileMap();

      // Fetch local trips to perform non-destructive 3-way conflict reconciliation
      const localTrips = typeof window.getAllTripsFromIndexedDB === 'function' ? await window.getAllTripsFromIndexedDB() : [];

      for (const file of files) {
        if (!file.name) continue;

        const downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
        const contentResp = await fetch(downloadUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!contentResp.ok) continue;

        try {
          const rawContent = await contentResp.json();
          if (rawContent) {
            const tripData = rawContent.data || rawContent;
            const tripMeta = tripData.meta || rawContent.meta || {};
            const tripTitle = (rawContent.data ? rawContent.title : tripMeta.title) || file.name.replace(/\.json$/i, '');
            const tripId = rawContent.id || tripMeta.id || ('trip_cloud_' + file.id);

            const remoteTrip = {
              id: tripId,
              title: tripTitle,
              subtitle: rawContent.subtitle || tripMeta.subtitle || '',
              data: tripData
            };

            fileMap[remoteTrip.id] = file.id;

            const localTrip = localTrips.find(t => t.id === remoteTrip.id);
            const remoteTime = file.modifiedTime ? new Date(file.modifiedTime).getTime() : 0;
            const localTime = localTrip && localTrip.updatedAt ? new Date(localTrip.updatedAt).getTime() : (localTrip && localTrip.lastSaved ? new Date(localTrip.lastSaved).getTime() : 0);

            if (!localTrip) {
              // 1. New remote trip found -> Safe import into local IndexedDB
              if (typeof window.saveTripToIndexedDB === 'function') {
                await window.saveTripToIndexedDB(remoteTrip);
              }
            } else if (remoteTime > localTime + 3000) {
              // 2. Remote file is newer -> Update local IndexedDB
              if (typeof window.saveTripToIndexedDB === 'function') {
                await window.saveTripToIndexedDB(remoteTrip);
              }
            } else if (localTime > remoteTime + 3000) {
              // 3. Local edits are newer -> Push local trip to Google Drive
              await window.uploadTripToGoogleDrive(localTrip, true);
            }
          }
        } catch (parseErr) {
          console.warn('Failed to parse remote trip file:', file.name, parseErr);
        }
      }

      setGDriveFileMap(fileMap);
      if (!isSilent) updateCloudSyncStatusPill(`☁️ Synced to Drive / ${DRIVE_FOLDER_NAME}`, 'connected');
      updateCloudSyncModalState(files);

      if (typeof window.renderHeaderTripSwitcher === 'function') window.renderHeaderTripSwitcher();
      if (typeof window.renderTripGalleryGrid === 'function') window.renderTripGalleryGrid();
      return window.__gdriveCloudFiles || files;
    } catch (err) {
      console.error('Failed to list cloud trips from Google Drive:', err);
      if (!isSilent) updateCloudSyncStatusPill('⚡ Sync Failed', 'error');
      return [];
    }
  };

  // Delete Trip File directly from Google Drive
  window.deleteTripFromGoogleDrive = async function(fileId, tripTitle, skipConfirm = false) {
    if (!isGoogleDriveConnected() || !fileId) return false;
    const cleanTitle = tripTitle || 'this trip';
    if (!skipConfirm && !confirm(`Are you sure you want to delete "${cleanTitle}" from your Google Drive folder?`)) return false;

    if ((accessToken && accessToken.startsWith('token_')) || window.__mockGoogleDriveAPI) {
      console.log(`[GoogleDrive Sync] Simulated deletion of file ${fileId} from Google Drive`);
      const map = getGDriveFileMap();
      Object.keys(map).forEach(key => { if (map[key] === fileId) delete map[key]; });
      setGDriveFileMap(map);
      await window.syncAllTripsFromGoogleDrive();
      if (typeof window.renderHeaderTripSwitcher === 'function') window.renderHeaderTripSwitcher();
      if (typeof window.renderTripGalleryGrid === 'function') window.renderTripGalleryGrid();
      return true;
    }

    try {
      updateCloudSyncStatusPill('⏳ Deleting from Google Drive...', 'syncing');
      const resp = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (resp.ok || resp.status === 404) {
        const map = getGDriveFileMap();
        Object.keys(map).forEach(key => { if (map[key] === fileId) delete map[key]; });
        setGDriveFileMap(map);
        await window.syncAllTripsFromGoogleDrive();
        if (typeof window.renderHeaderTripSwitcher === 'function') window.renderHeaderTripSwitcher();
        if (typeof window.renderTripGalleryGrid === 'function') window.renderTripGalleryGrid();
        updateCloudSyncStatusPill(`☁️ Synced to Drive / ${DRIVE_FOLDER_NAME}`, 'connected');
        return true;
      }
    } catch (err) {
      console.error('Failed to delete file from Google Drive:', err);
      updateCloudSyncStatusPill('⚡ Deletion Failed', 'error');
    }
    return false;
  };

  // Load Trip Document directly from Google Drive into Active State
  window.loadTripFromGoogleDrive = async function(fileId) {
    if (!isGoogleDriveConnected() || !fileId) return false;

    const activeTripId = typeof window.getActiveTripId === 'function' ? window.getActiveTripId() : '';
    const existingFileMap = getGDriveFileMap();
    if (existingFileMap[activeTripId] === fileId) {
      window.closeCloudSyncModal();
      if (typeof window.closeTripLibraryModal === 'function') window.closeTripLibraryModal();
      if (typeof window.showToast === 'function') window.showToast('ℹ️ Trip is already open');
      return true;
    }

    try {
      updateCloudSyncStatusPill('⏳ Loading Trip from Drive...', 'syncing');
      let tripRecord = null;

      if ((accessToken && accessToken.startsWith('token_')) || window.__mockGoogleDriveAPI) {
        const trips = typeof window.getAllTripsFromIndexedDB === 'function' ? await window.getAllTripsFromIndexedDB() : [];
        const fileMap = getGDriveFileMap();
        const mappedTripId = Object.keys(fileMap).find(k => fileMap[k] === fileId);
        tripRecord = trips.find(t => t.id === fileId || t.id === mappedTripId) || trips.find(t => t.id === fileId.replace(/^gdrive_file_/, '')) || trips[0] || null;
      } else {
        let token = await ensureValidAccessToken() || accessToken;
        const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
        let contentResp = await fetch(downloadUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!contentResp.ok && contentResp.status === 401) {
          token = await ensureValidAccessToken() || accessToken;
          contentResp = await fetch(downloadUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }
        if (contentResp.ok) {
          tripRecord = await contentResp.json();
        } else {
          const errText = await contentResp.text();
          console.error('Failed to download Google Drive file:', contentResp.status, errText);
        }
      }

      if (tripRecord) {
        const payload = tripRecord.data || tripRecord;
        const title = (payload.meta && payload.meta.title) || tripRecord.title || 'Cloud Trip';
        const cloudTripId = tripRecord.id || (payload.meta && payload.meta.id) || `trip_cloud_${fileId}`;

        // Ensure cloud file map registers the association between cloudTripId and Google Drive fileId
        const fileMap = getGDriveFileMap();
        fileMap[cloudTripId] = fileId;
        setGDriveFileMap(fileMap);

        if (typeof window.setActiveTripId === 'function') {
          window.setActiveTripId(cloudTripId);
        }
        if (typeof window.loadImportedPayload === 'function') {
          await window.loadImportedPayload(payload, `${title}.json`);
        }
        if (typeof window.setActiveTripId === 'function') {
          window.setActiveTripId(cloudTripId);
        }
        if (typeof window.saveActiveTripToStore === 'function') {
          await window.saveActiveTripToStore();
        }
        if (typeof window.renderHeaderTripSwitcher === 'function') {
          window.renderHeaderTripSwitcher();
        }
        if (typeof window.renderTripGalleryGrid === 'function') {
          window.renderTripGalleryGrid();
        }

        window.closeCloudSyncModal();
        if (typeof window.closeTripLibraryModal === 'function') {
          window.closeTripLibraryModal();
        }
        updateCloudSyncStatusPill(`☁️ Loaded "${title}"`, 'connected');
        return true;
      }
    } catch (err) {
      console.error('Failed to load trip from Google Drive:', err);
      updateCloudSyncStatusPill('⚡ Load Failed', 'error');
    }
    return false;
  };

  // Create brand new Trip Document directly in Google Drive
  window.createNewTripInGoogleDrive = async function() {
    if (!isGoogleDriveConnected()) {
      alert('Please sign in to Google Drive first to create cloud trips.');
      return;
    }
    const title = prompt('Enter a title for your new Google Drive trip:', 'My New Travel Plan');
    if (!title || !title.trim()) return;

    const cleanTitle = title.trim();
    const newTripId = 'trip_cloud_' + Date.now();
    const newPayload = {
      meta: {
        title: cleanTitle,
        subtitle: 'New Multi-City Itinerary',
        dates: '2026',
        version: '1.1.0'
      },
      itinerary: [
        { day: 1, cityName: 'Start City', notes: 'First day arrival' }
      ],
      journeys: [],
      stays: [],
      cities: [
        { id: 'city_start', name: 'Start City', country: 'Country', countryCode: 'UN', days: [1] }
      ],
      userCities: [],
      userCountries: [],
      packing: [],
      budget: []
    };

    const newTripRecord = {
      id: newTripId,
      title: cleanTitle,
      subtitle: 'New Multi-City Itinerary',
      data: newPayload
    };

    updateCloudSyncStatusPill('⏳ Creating Cloud Trip...', 'syncing');
    const ok = await window.uploadTripToGoogleDrive(newTripRecord);
    if (ok) {
      if (typeof window.loadImportedPayload === 'function') {
        await window.loadImportedPayload(newPayload, `${cleanTitle}.json`);
      }
      if (typeof window.setActiveTripId === 'function') {
        window.setActiveTripId(newTripId);
      }
      await window.syncAllTripsFromGoogleDrive();
      if (typeof window.renderHeaderTripSwitcher === 'function') window.renderHeaderTripSwitcher();
      if (typeof window.renderTripGalleryGrid === 'function') window.renderTripGalleryGrid();
      alert(`✅ Created and opened new Google Drive trip "${cleanTitle}"!`);
    } else {
      alert('Failed to create trip in Google Drive. Please check connection.');
    }
  };

  // Explicitly Refresh Google Drive Folder (Pulls remote files & syncs gallery/switcher)
  window.refreshGoogleDriveFolder = async function(showToastNotice = true) {
    if (!isGoogleDriveConnected()) {
      alert('Please sign in to Google Drive first.');
      return;
    }
    try {
      updateCloudSyncStatusPill('⏳ Syncing Drive...', 'syncing');
      await window.syncAllTripsFromGoogleDrive();
      if (typeof window.renderHeaderTripSwitcher === 'function') window.renderHeaderTripSwitcher();
      if (typeof window.renderTripGalleryGrid === 'function') window.renderTripGalleryGrid();
      updateCloudSyncStatusPill(`☁️ Synced to Drive / ${DRIVE_FOLDER_NAME}`, 'connected');
      if (showToastNotice && typeof window.showToast === 'function') {
        window.showToast(`🔄 Refreshed Google Drive / ${DRIVE_FOLDER_NAME}`);
      }
    } catch (err) {
      console.error('Failed to refresh Google Drive folder:', err);
      updateCloudSyncStatusPill('⚡ Sync Failed', 'error');
    }
  };

  // Upload a local JSON file directly from disk into Google Drive / TrenscendsTravelPlanner
  window.uploadLocalJsonFileToDrive = function() {
    if (!isGoogleDriveConnected()) {
      alert('Please sign in to Google Drive first to upload files to your cloud folder.');
      return;
    }

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,application/json';

    fileInput.onchange = async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      try {
        updateCloudSyncStatusPill('⏳ Reading & Uploading JSON to Drive...', 'syncing');
        const text = await file.text();
        const rawJson = JSON.parse(text);

        const tripData = rawJson.data || rawJson;
        const meta = tripData.meta || rawJson.meta || {};
        const cleanTitle = meta.title || rawJson.title || file.name.replace(/\.json$/i, '');
        const newTripId = rawJson.id || meta.id || ('trip_cloud_' + Date.now());

        const tripRecord = {
          id: newTripId,
          title: cleanTitle,
          subtitle: meta.subtitle || 'Uploaded Cloud JSON',
          data: tripData
        };

        const ok = await window.uploadTripToGoogleDrive(tripRecord);
        if (ok) {
          if (typeof window.loadImportedPayload === 'function') {
            await window.loadImportedPayload(tripData, file.name);
          }
          if (typeof window.setActiveTripId === 'function') {
            window.setActiveTripId(newTripId);
          }
          await window.syncAllTripsFromGoogleDrive();
          if (typeof window.renderHeaderTripSwitcher === 'function') window.renderHeaderTripSwitcher();
          if (typeof window.renderTripGalleryGrid === 'function') window.renderTripGalleryGrid();
          alert(`✅ Uploaded "${file.name}" to Google Drive / ${DRIVE_FOLDER_NAME} and loaded it into app!`);
        } else {
          alert('Failed to upload file to Google Drive. Please check your connection.');
        }
      } catch (err) {
        console.error('Failed to parse or upload JSON file to Google Drive:', err);
        alert('Invalid JSON document. Please select a valid travel planner JSON file.');
        updateCloudSyncStatusPill(`☁️ Drive / ${DRIVE_FOLDER_NAME}`, 'connected');
      }
    };

    fileInput.click();
  };

  // 60-Second Periodic Background Sync Loop
  let backgroundHeartbeatTimer = null;
  function startBackgroundSyncLoop() {
    if (backgroundHeartbeatTimer) clearInterval(backgroundHeartbeatTimer);
    backgroundHeartbeatTimer = setInterval(async () => {
      if (isGoogleDriveConnected() && !document.hidden) {
        console.log('[GoogleDrive Heartbeat] Running silent 60s background cloud sync check...');
        await window.syncAllTripsFromGoogleDrive(true);
      }
    }, 60000);
  }

  // Quiet Debounced Auto-Sync for active trip edits (runs 3.5s after user finishes editing)
  window.autoSyncActiveTripToCloud = function() {
    if (!isGoogleDriveConnected()) return;

    if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
    syncDebounceTimer = setTimeout(async () => {
      let fullTrip = null;
      if (typeof window.buildExportPayload === 'function') {
        const payload = window.buildExportPayload();
        const activeTripId = window.getActiveTripId ? window.getActiveTripId() : 'trip_default';
        const title = (payload.meta && payload.meta.title) ? payload.meta.title : 'My Travel Itinerary';
        fullTrip = {
          id: activeTripId,
          title: title,
          subtitle: payload.meta?.subtitle || '',
          data: payload
        };
      } else if (typeof window.getAllTripsFromIndexedDB === 'function') {
        const activeTripId = window.getActiveTripId ? window.getActiveTripId() : 'trip_default';
        const trips = await window.getAllTripsFromIndexedDB();
        fullTrip = trips.find(t => t.id === activeTripId);
      }

      if (fullTrip) {
        console.log(`[Cloud AutoSync] Silent background auto-sync for active trip document "${fullTrip.title}"...`);
        await window.uploadTripToGoogleDrive(fullTrip, true);
      }
    }, 3500);
  };

  // Select Local Directory Sync Folder (Google Drive Desktop / OneDrive / Local Folder)
  window.selectLocalSyncDirectory = async function() {
    if (typeof window.showDirectoryPicker !== 'function') {
      alert('Local directory sync requires a modern browser (Chrome, Edge, Opera, Brave).');
      return;
    }

    try {
      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      if (dirHandle) {
        window.__localSyncDirHandle = dirHandle;
        alert(`✅ Connected local sync folder: "${dirHandle.name}". Edits will auto-save directly to physical .json files in this folder!`);
        updateCloudSyncStatusPill(`📁 Synced to "${dirHandle.name}"`, 'connected');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Failed to select local directory:', err);
      }
    }
  };

  // Update Status Pill UI Element across Desktop Header, Library Modal, and Mobile Sheet
  function updateCloudSyncStatusPill(statusText, stateClass) {
    const pills = [
      document.getElementById('headerCloudSyncStatusPill'),
      document.getElementById('cloudSyncStatusPill'),
      document.getElementById('mobileCloudSyncStatusPill')
    ].filter(Boolean);

    if (pills.length === 0) return;

    pills.forEach(pill => {
      if (statusText) {
        let compactLabel = statusText;
        if (statusText.includes('Synced') || statusText.includes('Loaded')) compactLabel = '☁️ Synced';
        else if (statusText.includes('Syncing') || statusText.includes('Creating') || statusText.includes('Loading') || statusText.includes('Deleting')) compactLabel = '⏳ Syncing...';
        else if (statusText.includes('Local')) compactLabel = '⚡ Local';
        else if (statusText.includes('Failed') || statusText.includes('Required')) compactLabel = '⚠️ Sync Alert';

        pill.innerText = compactLabel;
        pill.title = statusText;
      } else {
        if (isGoogleDriveConnected()) {
          pill.innerText = '☁️ Synced';
          pill.title = `Google Drive / ${DRIVE_FOLDER_NAME} (Connected)`;
        } else {
          pill.innerText = '⚡ Local';
          pill.title = 'Saved locally on this device';
        }
      }

      if (stateClass) {
        pill.className = `cloud-status-pill ${stateClass}`;
      } else if (isGoogleDriveConnected()) {
        pill.className = 'cloud-status-pill connected';
      } else {
        pill.className = 'cloud-status-pill disconnected';
      }
    });
  }
  window.updateCloudSyncStatusPill = updateCloudSyncStatusPill;

  // Cloud Sync Modal Helper
  window.openCloudSyncModal = function() {
    const modal = document.getElementById('cloudSyncModal');
    if (!modal) return;
    modal.hidden = false;
    modal.style.display = 'flex';
    modal.classList.add('active');
    try {
      if (typeof updateCloudSyncModalState === 'function') updateCloudSyncModalState();
    } catch(e) {}
  };

  function updateCloudSyncModalState(cloudFiles = null) {
    const isConnected = isGoogleDriveConnected();
    const profile = getUserProfile();

    const statusText = document.getElementById('gdriveModalStatusText');
    const profileCard = document.getElementById('gdriveProfileCard');
    const connectBtn = document.getElementById('gdriveConnectBtn');
    const disconnectBtn = document.getElementById('gdriveDisconnectBtn');
    const folderLinkContainer = document.getElementById('gdriveFolderLinkContainer');
    const fileListContainer = document.getElementById('gdriveFileListContainer');

    const folderUrl = getGoogleDriveFolderUrl();

    if (profileCard) {
      if (isConnected && profile) {
        profileCard.style.display = 'flex';
        profileCard.innerHTML = `
          <div class="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg overflow-hidden shrink-0">
            ${profile.picture ? `<img src="${profile.picture}" class="w-full h-full object-cover">` : (profile.name ? profile.name.charAt(0).toUpperCase() : '👤')}
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-bold text-slate-800 dark:text-white truncate text-sm">${escapeHtml(profile.name || 'Signed In')}</div>
            <div class="text-xs text-slate-500 dark:text-slate-400 truncate">${escapeHtml(profile.email || '')}</div>
            <div class="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium pt-0.5">🟢 Connected to Google Drive / ${DRIVE_FOLDER_NAME}</div>
          </div>
        `;
      } else {
        profileCard.style.display = 'none';
      }
    }

    if (folderLinkContainer) {
      if (isConnected) {
        folderLinkContainer.style.display = 'block';
        folderLinkContainer.innerHTML = `
          <a href="${folderUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline bg-blue-50 dark:bg-blue-950/50 px-3.5 py-2 rounded-xl border border-blue-200 dark:border-blue-800 transition-colors">
            <span>📂 Open "Google Drive / ${DRIVE_FOLDER_NAME}" Folder</span>
            <span class="text-[10px]">↗</span>
          </a>
        `;
      } else {
        folderLinkContainer.style.display = 'none';
      }
    }

    if (statusText) {
      statusText.innerHTML = isConnected
        ? `Your account is active. All trip itineraries automatically sync to <code>.json</code> files inside your <strong>Google Drive / ${DRIVE_FOLDER_NAME}</strong> folder.`
        : `Sign in with Google to automatically back up and sync your itineraries into a dedicated <strong>Google Drive / ${DRIVE_FOLDER_NAME}</strong> folder across all your devices.`;
    }

    if (fileListContainer && isConnected && Array.isArray(cloudFiles) && cloudFiles.length > 0) {
      fileListContainer.style.display = 'block';
      const activeTripId = typeof window.getActiveTripId === 'function' ? window.getActiveTripId() : '';
      const fileMap = getGDriveFileMap();

      fileListContainer.innerHTML = `
        <div class="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
          <span>📁 Google Drive Files (${cloudFiles.length})</span>
          <div class="flex items-center gap-2">
            <button class="action-btn action-btn-secondary text-[11px] py-1 px-2.5 flex items-center gap-1" onclick="window.uploadLocalJsonFileToDrive()" title="Upload a local JSON trip file directly into Google Drive">📥 Upload JSON</button>
            <button class="action-btn action-btn-secondary text-[11px] py-1 px-2.5 flex items-center gap-1" onclick="window.refreshGoogleDriveFolder()" title="Rescan Google Drive folder for newly pasted JSON files">🔄 Refresh Drive</button>
          </div>
        </div>
        <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
          ${cloudFiles.map(f => {
            const sizeKb = f.size ? `${(parseInt(f.size, 10) / 1024).toFixed(1)} KB` : 'JSON';
            const modTime = f.modifiedTime ? new Date(f.modifiedTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Synced';
            const isActiveFile = fileMap[activeTripId] === f.id;

            return `
              <div class="p-3 ${isActiveFile ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700' : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700'} rounded-xl border flex flex-col sm:flex-row justify-between sm:items-center gap-2 transition-all hover:border-blue-300 dark:hover:border-blue-700">
                <div class="flex-1 min-w-0">
                  <div class="font-semibold text-slate-800 dark:text-slate-100 text-xs truncate flex items-center gap-1.5">
                    <span>📄</span>
                    <span class="truncate">${escapeHtml(f.name)}</span>
                    ${isActiveFile ? `<span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-600 text-white shrink-0">● Active</span>` : ''}
                  </div>
                  <div class="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-3 pt-1">
                    <span>💾 ${sizeKb}</span>
                    <span>🕒 ${modTime}</span>
                  </div>
                </div>
                <div class="flex items-center gap-1.5 shrink-0 pt-1 sm:pt-0">
                  <button class="action-btn ${isActiveFile ? 'action-btn-primary' : 'action-btn-secondary'} text-[11px] py-1 px-3" onclick="window.loadTripFromGoogleDrive('${f.id}')" title="Load & open this trip document">
                    ${isActiveFile ? '✓ Open' : '📥 Load'}
                  </button>
                  <a href="https://drive.google.com/file/d/${f.id}/view" target="_blank" rel="noopener noreferrer" class="action-btn text-[11px] py-1 px-2.5 text-slate-600 dark:text-slate-300" title="Open file in Google Drive">↗</a>
                  <button class="action-btn action-btn-danger text-[11px] py-1 px-2.5" onclick="window.deleteTripFromGoogleDrive('${f.id}', '${escapeHtml(f.name)}')" title="Delete from cloud">🗑️</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else if (fileListContainer) {
      fileListContainer.style.display = 'none';
    }

    if (connectBtn) connectBtn.style.display = isConnected ? 'none' : 'inline-flex';
    if (disconnectBtn) disconnectBtn.style.display = isConnected ? 'inline-flex' : 'none';

    const activeIdLabel = document.getElementById('gdriveActiveClientIdLabel');
    if (activeIdLabel) {
      activeIdLabel.innerText = getGoogleClientId();
    }
  }

  window.saveCustomGoogleClientId = function() {
    const input = document.getElementById('gdriveCustomClientIdInput');
    if (!input) return;
    const newId = input.value.trim();
    if (newId) {
      setGoogleClientId(newId);
      alert(`Custom Google Client ID saved: ${newId}`);
    } else {
      setGoogleClientId(null);
      alert('Reset to default Google OAuth Client ID.');
    }
    updateCloudSyncModalState();
  };

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Process any OAuth redirect hash immediately
  processOAuthCallbackFromUrl();

  // Initialize Cloud Sync & Background Heartbeat Loop on load
  window.addEventListener('DOMContentLoaded', () => {
    processOAuthCallbackFromUrl();
    setTimeout(() => {
      updateCloudSyncStatusPill();
      if (isGoogleDriveConnected()) {
        window.syncAllTripsFromGoogleDrive();
        startBackgroundSyncLoop();
      }
    }, 800);
  });
})();

