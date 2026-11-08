/* ==========================================================================
   MODULE: File System Access & JSON I/O (js/file-io.js)
   Responsibilities: File System Access API handles, disk saves, JSON import/export,
                     disconnected file warnings, and file connection badges
   ========================================================================== */

// Scope aliases from js/storage-db.js
var saveToIndexedDB = (typeof window !== 'undefined' && window.saveToIndexedDB) || (typeof global !== 'undefined' && global.saveToIndexedDB) || (async () => {});
var loadFromIndexedDB = (typeof window !== 'undefined' && window.loadFromIndexedDB) || (typeof global !== 'undefined' && global.loadFromIndexedDB) || (async () => null);
var deleteFromIndexedDB = (typeof window !== 'undefined' && window.deleteFromIndexedDB) || (typeof global !== 'undefined' && global.deleteFromIndexedDB) || (async () => {});
var calculateDjb2Hash = (typeof window !== 'undefined' && window.calculateDjb2Hash) || (typeof global !== 'undefined' && global.calculateDjb2Hash) || ((str) => 0);

// Global state getters from js/data.js
var getCurrentAppData = () => (typeof window !== 'undefined' && typeof window.getCurrentAppData === 'function' ? window.getCurrentAppData() : (typeof getCurrentAppData === 'function' ? getCurrentAppData() : {}));
var saveData = (showToast = false) => (typeof window !== 'undefined' && typeof window.saveData === 'function' ? window.saveData(showToast) : (typeof saveData === 'function' ? saveData(showToast) : Promise.resolve()));
var buildExportPayload = () => (typeof window !== 'undefined' && typeof window.buildExportPayload === 'function' ? window.buildExportPayload() : (typeof buildExportPayload === 'function' ? buildExportPayload() : {}));
var loadImportedPayload = (data, name) => (typeof window !== 'undefined' && typeof window.loadImportedPayload === 'function' ? window.loadImportedPayload(data, name) : (typeof loadImportedPayload === 'function' ? loadImportedPayload(data, name) : Promise.resolve()));

var currentFileName = (typeof window !== 'undefined' && window.currentFileName) || 'Default Template';

let activeFileHandle = null;
let activeFileHandleName = null;
let pendingFileHandle = null;
let fileWriteFailed = false;
let importedJsonWithoutWriteAccess = localStorage.getItem('travelApp_json_write_warning') === 'true';
const ACTIVE_FILE_HANDLE_DB_KEY = 'activeFileHandle';

function isFSASupported() {
  return !!(window.isSecureContext && 'showOpenFilePicker' in window);
}

function hasActiveFileHandle() {
  return !!activeFileHandle;
}

function hasFileWriteFailed() {
  return !!fileWriteFailed;
}

function isSavingToFile() {
  return hasActiveFileHandle() || (!!localStorage.getItem('travelApp_file_handle_name') && !fileWriteFailed);
}

function isJsonWriteWarningActive() {
  return importedJsonWithoutWriteAccess && !isSavingToFile();
}

function getJsonWriteWarningMessage() {
  return 'JSON file not connected. Edits are saved in this browser only until you Save As or Export JSON.';
}

function ensureJsonWriteWarningElement() {
  let warning = document.getElementById('jsonWriteWarning');
  if (warning) return warning;

  warning = document.createElement('div');
  warning.id = 'jsonWriteWarning';
  warning.className = 'json-write-warning';
  warning.hidden = true;
  const menuBar = document.querySelector('.app-menu-bar');
  if (menuBar && menuBar.parentNode) {
    menuBar.parentNode.insertBefore(warning, menuBar.nextSibling);
  } else if (document.body) {
    document.body.insertBefore(warning, document.body.firstChild);
  }
  return warning;
}

function syncJsonWriteWarning() {
  const warning = ensureJsonWriteWarningElement();
  const shouldShow = isJsonWriteWarningActive();
  warning.hidden = !shouldShow;
  if (!shouldShow) {
    warning.innerHTML = '';
    return;
  }

  const connectAction = isFSASupported()
    ? '<button type="button" class="json-write-warning-btn" onclick="openTripFile()">Save As</button>'
    : '';
  warning.innerHTML = `
    <span class="json-write-warning-text">${getJsonWriteWarningMessage()}</span>
    <span class="json-write-warning-actions">
      ${connectAction}
      <button type="button" class="json-write-warning-btn json-write-warning-btn-secondary" onclick="exportJSON()">Export JSON</button>
    </span>
  `;
}

function setImportedJsonWithoutWriteAccess(active) {
  importedJsonWithoutWriteAccess = !!active;
  if (importedJsonWithoutWriteAccess) {
    localStorage.setItem('travelApp_json_write_warning', 'true');
  } else {
    localStorage.removeItem('travelApp_json_write_warning');
  }
  syncJsonWriteWarning();
  if (typeof window.syncMobileMenuStatus === 'function') window.syncMobileMenuStatus();
}

function getActiveFileHandle() {
  return activeFileHandle;
}
window.getActiveFileHandle = getActiveFileHandle;

function getActiveFileHandleName() {
  return activeFileHandleName || currentFileName || 'Default Template';
}

function getFileConnectionStatusLabel() {
  if (hasActiveFileHandle()) return 'Connected';
  if (fileWriteFailed) return 'No access';
  if (localStorage.getItem('travelApp_file_handle_name')) return 'Disconnected';
  return '';
}

function syncActiveFileDisplay() {
  const fileDisplay = document.getElementById('activeFileDisplay');
  if (fileDisplay) {
    const status = getFileConnectionStatusLabel();
    const badgeText = status
      ? `${getActiveFileHandleName()} · ${status}`
      : getActiveFileHandleName();
    fileDisplay.innerText = badgeText;
    const badge = fileDisplay.closest('.file-badge');
    if (badge) badge.title = badgeText;
  }
}

function syncCurrentFileName(fileName) {
  currentFileName = fileName || 'Default Template';
  localStorage.setItem('travelApp_filename_v2026', currentFileName);
  syncActiveFileDisplay();
}

function setActiveFileHandle(handle) {
  activeFileHandle = handle || null;
  activeFileHandleName = handle ? handle.name : null;
  if (activeFileHandleName) {
    importedJsonWithoutWriteAccess = false;
    localStorage.removeItem('travelApp_json_write_warning');
    fileWriteFailed = false;
    syncCurrentFileName(activeFileHandleName);
    localStorage.setItem('travelApp_file_handle_name', activeFileHandleName);
    persistActiveFileHandle(handle);
    if (typeof window.resetEditTracking === 'function') window.resetEditTracking();
    if (typeof window.hideBackupReminder === 'function') window.hideBackupReminder();
    syncActiveFileDisplay();
    if (typeof window.updateExportIndicator === 'function') window.updateExportIndicator();
    configureFileActionButtons();
  } else {
    localStorage.removeItem('travelApp_file_handle_name');
    syncActiveFileDisplay();
    if (typeof window.updateExportIndicator === 'function') window.updateExportIndicator();
    configureFileActionButtons();
  }
  syncJsonWriteWarning();
}

function clearActiveFileHandle() {
  activeFileHandle = null;
  activeFileHandleName = null;
  fileWriteFailed = false;
  localStorage.removeItem('travelApp_file_handle_name');
  deleteFromIndexedDB(ACTIVE_FILE_HANDLE_DB_KEY).catch(e => {
    console.warn('Failed to clear persisted file handle:', e);
  });
  syncActiveFileDisplay();
  configureFileActionButtons();
}

function persistActiveFileHandle(handle) {
  if (!handle || !isFSASupported()) return Promise.resolve();
  return saveToIndexedDB(ACTIVE_FILE_HANDLE_DB_KEY, handle).catch(e => {
    console.warn('Failed to persist file handle:', e);
  });
}

async function restorePersistedActiveFileHandle() {
  if (!isFSASupported()) return null;

  try {
    const handle = await loadFromIndexedDB(ACTIVE_FILE_HANDLE_DB_KEY);
    if (!handle) return null;
    setActiveFileHandle(handle);
    return handle;
  } catch (e) {
    console.warn('Failed to restore persisted file handle:', e);
    return null;
  }
}

async function ensureActiveFileHandle() {
  if (activeFileHandle) return true;
  if (!isFSASupported()) return false;
  if (!localStorage.getItem('travelApp_file_handle_name')) return false;

  const handle = await restorePersistedActiveFileHandle();
  return !!handle;
}

function configureFileActionButtons() {
  const saveAsVisible = isFSASupported();
  ['saveAsBtn', 'mobileSaveAsBtn'].forEach(id => {
    const button = document.getElementById(id);
    if (button) button.style.display = saveAsVisible ? '' : 'none';
  });

  const openFileVisible = true;
  ['openFileBtn', 'mobileOpenFileBtn'].forEach(id => {
    const button = document.getElementById(id);
    if (button) button.style.display = openFileVisible ? '' : 'none';
  });
}



async function saveFileToDisk() {
  if (!await ensureActiveFileHandle()) return false;

  try {
    const payloadStr = JSON.stringify(getCurrentAppData(), null, 2);
    const writable = await activeFileHandle.createWritable();
    await writable.write(payloadStr);
    await writable.close();
    fileWriteFailed = false;
    localStorage.setItem('travelApp_file_handle_name', getActiveFileHandleName());
    
    // Store DJB2 hash of payload
    try {
      const hash = calculateDjb2Hash(payloadStr);
      localStorage.setItem('travelApp_last_known_hash', String(hash));
    } catch(err) {}

    configureFileActionButtons();
    const status = document.getElementById('saveStatus');
    if (status) status.textContent = '✓ Saved to file';
    syncActiveFileDisplay();
    return true;
  } catch (e) {
    console.error('Failed to save to selected file:', e);
    fileWriteFailed = true;
    configureFileActionButtons();
    syncActiveFileDisplay();
    return false;
  }
}

function openTripFile() {
  if (isFSASupported()) {
    createFileOnDisk();
    return;
  }

  const input = document.getElementById('importFile');
  if (input) input.click();
}

async function openExistingTripFile() {
  if (isFSASupported()) {
    try {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
      });

      if (!fileHandle) return;

      pendingFileHandle = fileHandle;
      const file = await fileHandle.getFile();
      importJSON({
        target: {
          files: [file],
          value: ''
        }
      });
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      console.error('Failed to open file picker:', e);
      alert('Could not open that file. Please try again or use Import JSON.');
      pendingFileHandle = null;
    }
    return;
  }

  const input = document.getElementById('importFile');
  if (input) input.click();
}

async function createFileOnDisk() {
  if (!isFSASupported()) return;

  try {
    const suggestedName = currentFileName && currentFileName !== 'Default Template'
      ? currentFileName.replace(/\.json$/i, '') + '.json'
      : 'travel_planner_backup.json';

    const fileHandle = await window.showSaveFilePicker({
      suggestedName,
      types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
    });

    if (!fileHandle) return;

    setActiveFileHandle(fileHandle);
    await saveData(false);
    if (typeof window.updateExportIndicator === 'function') window.updateExportIndicator();
  } catch (e) {
    if (e && e.name === 'AbortError') return;
    console.error('Failed to create file:', e);
    alert('Could not create a file location. You can still download a JSON copy.');
  }
}



function downloadTextFile(content, downloadName, mimeType = 'text/plain') {
  const downloadAnchorNode = document.createElement('a');
  const canUseBlobUrl = typeof Blob === 'function'
    && typeof URL !== 'undefined'
    && typeof URL.createObjectURL === 'function';
  let objectUrl = '';

  if (canUseBlobUrl) {
    const fileBlob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    objectUrl = URL.createObjectURL(fileBlob);
    downloadAnchorNode.setAttribute('href', objectUrl);
  } else {
    downloadAnchorNode.setAttribute('href', `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`);
  }

  downloadAnchorNode.setAttribute('download', downloadName);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();

  if (objectUrl) {
    setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  }

  return downloadAnchorNode;
}

async function exportJSON() {
  const previousSuppress = window.__suppressBackupTracking;
  window.__suppressBackupTracking = true;
  try {
    await saveData(false);
  } finally {
    window.__suppressBackupTracking = previousSuppress;
  }
  const exportObj = buildExportPayload();
  const dlName = currentFileName === 'Default Template' ? 'travel_planner_backup.json' : currentFileName;
  downloadTextFile(JSON.stringify(exportObj, null, 2), dlName, 'application/json');

  // Record export timestamp
  localStorage.setItem('travelApp_last_export_v2026', new Date().toISOString());
  localStorage.setItem('travelApp_last_export_filename', dlName);
  setImportedJsonWithoutWriteAccess(false);
}



async function importJSON(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  if (!String(file.name || '').toLowerCase().endsWith('.json')) {
    alert('Please select a .json file. The file you selected is not valid JSON.');
    event.target.value = '';
    pendingFileHandle = null;
    return;
  }

  const fileHandleForThisImport = pendingFileHandle;
  pendingFileHandle = null;

  const reader = new FileReader();

  reader.onerror = function() {
    alert('Error reading file. Please try again with a valid JSON file.');
    event.target.value = '';
    pendingFileHandle = null;
  };

  reader.onload = async function(e) {
    try {
      const content = e.target.result;

      if (!content || content.trim() === '') {
        alert('The file is empty. Please select a file with data.');
        event.target.value = '';
        pendingFileHandle = null;
        return;
      }

      let importedData;
      try {
        importedData = JSON.parse(content);
      } catch (parseErr) {
        const errorMsg = parseErr.message || 'Invalid JSON format';
        alert(`Failed to parse JSON: ${errorMsg}\n\nPlease ensure your file is valid JSON. Common issues:\n• Missing quotes around keys\n• Trailing commas\n• Unmatched brackets`);
        event.target.value = '';
        return;
      }

      if (!importedData || typeof importedData !== 'object') {
        alert('Invalid file format. Please select a JSON file exported from Travel Planner.');
        event.target.value = '';
        return;
      }

      if (fileHandleForThisImport) {
        setActiveFileHandle(fileHandleForThisImport);
      } else {
        clearActiveFileHandle();
        setImportedJsonWithoutWriteAccess(true);
      }

      // Store hash of imported content
      try {
        const hash = calculateDjb2Hash(content);
        localStorage.setItem('travelApp_last_known_hash', String(hash));
      } catch(err) {}

      // Assign a distinct trip ID for the imported file so it is saved as a document in My Trips Gallery
      const importedTripId = 'trip_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
      setActiveTripId(importedTripId);

      await loadImportedPayload(importedData, file.name);
      await saveActiveTripToStore();

      if (typeof window.renderHeaderTripSwitcher === 'function') {
        window.renderHeaderTripSwitcher();
      }
      if (typeof window.renderTripGalleryGrid === 'function') {
        window.renderTripGalleryGrid();
      }

      alert('Import successful! "' + (titleData.title || file.name) + '" added to your Trips Gallery.');
    } catch (err) {
      console.error('Import error:', err);
      alert(`Import failed: ${err.message || 'Unknown error'}. Your current data remains safe.`);
      event.target.value = '';
    }
  };

  reader.readAsText(file);
}




if (typeof window !== 'undefined') {
  window.currentFileName = currentFileName;
  window.isFSASupported = isFSASupported;
  window.hasActiveFileHandle = hasActiveFileHandle;
  window.hasFileWriteFailed = hasFileWriteFailed;
  window.isSavingToFile = isSavingToFile;
  window.isJsonWriteWarningActive = isJsonWriteWarningActive;
  window.getJsonWriteWarningMessage = getJsonWriteWarningMessage;
  window.ensureJsonWriteWarningElement = ensureJsonWriteWarningElement;
  window.syncJsonWriteWarning = syncJsonWriteWarning;
  window.setImportedJsonWithoutWriteAccess = setImportedJsonWithoutWriteAccess;
  window.getActiveFileHandle = getActiveFileHandle;
  window.getActiveFileHandleName = getActiveFileHandleName;
  window.getFileConnectionStatusLabel = getFileConnectionStatusLabel;
  window.syncActiveFileDisplay = syncActiveFileDisplay;
  window.syncCurrentFileName = syncCurrentFileName;
  window.setActiveFileHandle = setActiveFileHandle;
  window.clearActiveFileHandle = clearActiveFileHandle;
  window.persistActiveFileHandle = persistActiveFileHandle;
  window.restorePersistedActiveFileHandle = restorePersistedActiveFileHandle;
  window.ensureActiveFileHandle = ensureActiveFileHandle;
  window.configureFileActionButtons = configureFileActionButtons;
  window.saveFileToDisk = saveFileToDisk;
  window.openTripFile = openTripFile;
  window.openExistingTripFile = openExistingTripFile;
  window.createFileOnDisk = createFileOnDisk;
  window.downloadTextFile = downloadTextFile;
  window.exportJSON = exportJSON;
  window.importJSON = importJSON;
  window.addEventListener('DOMContentLoaded', syncJsonWriteWarning);
}

if (typeof global !== 'undefined') {
  global.currentFileName = currentFileName;
  global.isFSASupported = isFSASupported;
  global.hasActiveFileHandle = hasActiveFileHandle;
  global.hasFileWriteFailed = hasFileWriteFailed;
  global.isSavingToFile = isSavingToFile;
  global.isJsonWriteWarningActive = isJsonWriteWarningActive;
  global.getJsonWriteWarningMessage = getJsonWriteWarningMessage;
  global.ensureJsonWriteWarningElement = ensureJsonWriteWarningElement;
  global.syncJsonWriteWarning = syncJsonWriteWarning;
  global.setImportedJsonWithoutWriteAccess = setImportedJsonWithoutWriteAccess;
  global.getActiveFileHandle = getActiveFileHandle;
  global.getActiveFileHandleName = getActiveFileHandleName;
  global.getFileConnectionStatusLabel = getFileConnectionStatusLabel;
  global.syncActiveFileDisplay = syncActiveFileDisplay;
  global.syncCurrentFileName = syncCurrentFileName;
  global.setActiveFileHandle = setActiveFileHandle;
  global.clearActiveFileHandle = clearActiveFileHandle;
  global.persistActiveFileHandle = persistActiveFileHandle;
  global.restorePersistedActiveFileHandle = restorePersistedActiveFileHandle;
  global.ensureActiveFileHandle = ensureActiveFileHandle;
  global.configureFileActionButtons = configureFileActionButtons;
  global.saveFileToDisk = saveFileToDisk;
  global.openTripFile = openTripFile;
  global.openExistingTripFile = openExistingTripFile;
  global.createFileOnDisk = createFileOnDisk;
  global.downloadTextFile = downloadTextFile;
  global.exportJSON = exportJSON;
  global.importJSON = importJSON;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    currentFileName,
    isFSASupported,
    hasActiveFileHandle,
    hasFileWriteFailed,
    isSavingToFile,
    isJsonWriteWarningActive,
    getJsonWriteWarningMessage,
    syncJsonWriteWarning,
    setImportedJsonWithoutWriteAccess,
    getActiveFileHandle,
    getActiveFileHandleName,
    getFileConnectionStatusLabel,
    syncActiveFileDisplay,
    syncCurrentFileName,
    setActiveFileHandle,
    clearActiveFileHandle,
    persistActiveFileHandle,
    restorePersistedActiveFileHandle,
    ensureActiveFileHandle,
    configureFileActionButtons,
    saveFileToDisk,
    openTripFile,
    openExistingTripFile,
    createFileOnDisk,
    downloadTextFile,
    exportJSON,
    importJSON
  };
}
