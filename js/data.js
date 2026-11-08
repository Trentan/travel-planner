/* ==========================================================================
   MODULE: Data & State Management (js/data.js)
   Responsibilities: Trip Data Normalization, Undo/Redo History, State Coordination
   ========================================================================== */

if (typeof require === 'function' && typeof module !== 'undefined' && module.exports) {
  try {
    require('./city-matcher.js');
  } catch (_) {}
}

function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  return JSON.parse(JSON.stringify(obj));
}
if (typeof window !== 'undefined') window.deepClone = deepClone;

function escapeTripStartText(value) {
  if (typeof escapeHtmlText === 'function') return escapeHtmlText(value);
  return String(value || '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}
if (typeof window !== 'undefined') window.escapeTripStartText = escapeTripStartText;
if (typeof global !== 'undefined') global.escapeTripStartText = escapeTripStartText;


// Scope aliases from js/city-matcher.js
var userCities = (typeof window !== 'undefined' && window.userCities) || (typeof global !== 'undefined' && global.userCities) || (typeof userCities !== 'undefined' ? userCities : []);
var userCountries = (typeof window !== 'undefined' && window.userCountries) || (typeof global !== 'undefined' && global.userCountries) || (typeof userCountries !== 'undefined' ? userCountries : []);
var getUserCities = (typeof window !== 'undefined' && window.getUserCities) || (typeof global !== 'undefined' && global.getUserCities) || (typeof getUserCities !== 'undefined' ? getUserCities : (() => []));
var COUNTRY_DATA = (typeof window !== 'undefined' && window.COUNTRY_DATA) || (typeof global !== 'undefined' && global.COUNTRY_DATA) || (typeof COUNTRY_DATA !== 'undefined' ? COUNTRY_DATA : []);
var CITY_DATABASE = (typeof window !== 'undefined' && window.CITY_DATABASE) || (typeof global !== 'undefined' && global.CITY_DATABASE) || (typeof CITY_DATABASE !== 'undefined' ? CITY_DATABASE : []);
var ALL_CITIES = (typeof window !== 'undefined' && window.ALL_CITIES) || (typeof global !== 'undefined' && global.ALL_CITIES) || (typeof ALL_CITIES !== 'undefined' ? ALL_CITIES : []);
var ALL_CITIES_BY_NAME_MAP = (typeof window !== 'undefined' && window.ALL_CITIES_BY_NAME_MAP) || (typeof global !== 'undefined' && global.ALL_CITIES_BY_NAME_MAP) || (typeof ALL_CITIES_BY_NAME_MAP !== 'undefined' ? ALL_CITIES_BY_NAME_MAP : new Map());
var ALL_CITIES_BY_NAME_COUNTRY_MAP = (typeof window !== 'undefined' && window.ALL_CITIES_BY_NAME_COUNTRY_MAP) || (typeof global !== 'undefined' && global.ALL_CITIES_BY_NAME_COUNTRY_MAP) || (typeof ALL_CITIES_BY_NAME_COUNTRY_MAP !== 'undefined' ? ALL_CITIES_BY_NAME_COUNTRY_MAP : new Map());
var ALL_CITIES_BY_CODE_MAP = (typeof window !== 'undefined' && window.ALL_CITIES_BY_CODE_MAP) || (typeof global !== 'undefined' && global.ALL_CITIES_BY_CODE_MAP) || (typeof ALL_CITIES_BY_CODE_MAP !== 'undefined' ? ALL_CITIES_BY_CODE_MAP : new Map());
// (with resilient fallbacks for isolated test runners)
var normalizeCityLocationData = (typeof window !== 'undefined' && window.normalizeCityLocationData) || (typeof global !== 'undefined' && global.normalizeCityLocationData) || (typeof normalizeCityLocationData !== 'undefined' ? normalizeCityLocationData : ((c) => c));
var getCityLocationDatabaseMatch = (typeof window !== 'undefined' && window.getCityLocationDatabaseMatch) || (typeof global !== 'undefined' && global.getCityLocationDatabaseMatch) || (typeof getCityLocationDatabaseMatch !== 'undefined' ? getCityLocationDatabaseMatch : (() => null));
var findFuzzyCityCandidate = (typeof window !== 'undefined' && window.findFuzzyCityCandidate) || (typeof global !== 'undefined' && global.findFuzzyCityCandidate) || (typeof findFuzzyCityCandidate !== 'undefined' ? findFuzzyCityCandidate : (() => null));
var getCountryName = (typeof window !== 'undefined' && window.getCountryName) || (typeof global !== 'undefined' && global.getCountryName) || (typeof getCountryName !== 'undefined' ? getCountryName : ((c) => c));
var getCountryFlag = (typeof window !== 'undefined' && window.getCountryFlag) || (typeof global !== 'undefined' && global.getCountryFlag) || (typeof getCountryFlag !== 'undefined' ? getCountryFlag : (() => '🌍'));
var getAllCountries = (typeof window !== 'undefined' && window.getAllCountries) || (typeof global !== 'undefined' && global.getAllCountries) || (typeof getAllCountries !== 'undefined' ? getAllCountries : (() => []));
var formatCityTitleCase = (typeof window !== 'undefined' && window.formatCityTitleCase) || (typeof global !== 'undefined' && global.formatCityTitleCase) || (typeof formatCityTitleCase !== 'undefined' ? formatCityTitleCase : ((s) => s));
var cityHasStoredCoords = (typeof window !== 'undefined' && window.cityHasStoredCoords) || (typeof global !== 'undefined' && global.cityHasStoredCoords) || (typeof cityHasStoredCoords !== 'undefined' ? cityHasStoredCoords : (() => false));
var getCityIataCode = (typeof window !== 'undefined' && window.getCityIataCode) || (typeof global !== 'undefined' && global.getCityIataCode) || (typeof getCityIataCode !== 'undefined' ? getCityIataCode : (() => ''));
var getCityIcaoCode = (typeof window !== 'undefined' && window.getCityIcaoCode) || (typeof global !== 'undefined' && global.getCityIcaoCode) || (typeof getCityIcaoCode !== 'undefined' ? getCityIcaoCode : (() => ''));
var getCityAirportCodesDisplay = (typeof window !== 'undefined' && window.getCityAirportCodesDisplay) || (typeof global !== 'undefined' && global.getCityAirportCodesDisplay) || (typeof getCityAirportCodesDisplay !== 'undefined' ? getCityAirportCodesDisplay : (() => ''));
var searchCityOnline = (typeof window !== 'undefined' && window.searchCityOnline) || (typeof global !== 'undefined' && global.searchCityOnline) || (typeof searchCityOnline !== 'undefined' ? searchCityOnline : (async () => null));
var resolveCityLocation = (typeof window !== 'undefined' && window.resolveCityLocation) || (typeof global !== 'undefined' && global.resolveCityLocation) || (typeof resolveCityLocation !== 'undefined' ? resolveCityLocation : (async () => null));
var applyCityLocation = (typeof window !== 'undefined' && window.applyCityLocation) || (typeof global !== 'undefined' && global.applyCityLocation) || (typeof applyCityLocation !== 'undefined' ? applyCityLocation : (() => false));

// Scope aliases from js/storage-db.js (with resilient fallbacks for isolated test runners)
var openDB = (typeof window !== 'undefined' && window.openDB) || (async () => null);
var saveToIndexedDB = (typeof window !== 'undefined' && window.saveToIndexedDB) || (async () => {});
var loadFromIndexedDB = (typeof window !== 'undefined' && window.loadFromIndexedDB) || (async () => null);
var deleteFromIndexedDB = (typeof window !== 'undefined' && window.deleteFromIndexedDB) || (async () => {});
var shouldUseIndexedDB = (typeof window !== 'undefined' && window.shouldUseIndexedDB) || (async () => false);
var fallbackToLocalStorage = (typeof window !== 'undefined' && window.fallbackToLocalStorage) || (() => {});
var getActiveTripId = (typeof window !== 'undefined' && window.getActiveTripId) || (() => 'trip_default');
var setActiveTripId = (typeof window !== 'undefined' && window.setActiveTripId) || (() => {});
var saveActiveTripToStore = (typeof window !== 'undefined' && window.saveActiveTripToStore) || (async () => {});
var loadTripFromStore = (typeof window !== 'undefined' && window.loadTripFromStore) || (async () => false);
var getAllTripsFromIndexedDB = (typeof window !== 'undefined' && window.getAllTripsFromIndexedDB) || (async () => []);
var saveTripToIndexedDB = (typeof window !== 'undefined' && window.saveTripToIndexedDB) || (async () => {});
var deleteTripFromIndexedDB = (typeof window !== 'undefined' && window.deleteTripFromIndexedDB) || (async () => {});
var deleteTripDocument = (typeof window !== 'undefined' && window.deleteTripDocument) || (async () => {});
var createNewTripDocument = (typeof window !== 'undefined' && window.createNewTripDocument) || (async () => {});
var duplicateTripDocument = (typeof window !== 'undefined' && window.duplicateTripDocument) || (async () => {});
var extractTripSummary = (typeof window !== 'undefined' && window.extractTripSummary) || ((d, id) => ({ id, title: 'Trip', data: d }));
var enqueueOfflineSyncMutation = (typeof window !== 'undefined' && window.enqueueOfflineSyncMutation) || (async () => {});
var getOfflineSyncQueue = (typeof window !== 'undefined' && window.getOfflineSyncQueue) || (async () => []);
var removeOfflineSyncMutation = (typeof window !== 'undefined' && window.removeOfflineSyncMutation) || (async () => {});
var clearOfflineSyncQueue = (typeof window !== 'undefined' && window.clearOfflineSyncQueue) || (async () => {});
var getOfflineSyncQueueCount = (typeof window !== 'undefined' && window.getOfflineSyncQueueCount) || (async () => 0);
var jsonSafeClone = (typeof window !== 'undefined' && window.jsonSafeClone) || deepClone;
var isStoragePersisted = (typeof window !== 'undefined' && window.isStoragePersisted) || (async () => false);
var requestStoragePersistence = (typeof window !== 'undefined' && window.requestStoragePersistence) || (async () => false);
var formatBytes = (typeof window !== 'undefined' && window.formatBytes) || ((b) => b + ' B');
var getStorageTelemetry = (typeof window !== 'undefined' && window.getStorageTelemetry) || (async () => ({ supported: false }));
var broadcastTripsCacheInvalidation = (typeof window !== 'undefined' && window.broadcastTripsCacheInvalidation) || (() => {});

let appData = [];
let packingData = [];
let leaveHomeData = [];
let hotelCheckoutData = typeof DEFAULT_HOTEL_CHECKOUT !== 'undefined' ? JSON.parse(JSON.stringify(DEFAULT_HOTEL_CHECKOUT)) : [];
let citiesData = typeof DEFAULT_CITIES !== 'undefined' ? JSON.parse(JSON.stringify(DEFAULT_CITIES)) : []; // City entities for filtering/grouping - { id, name, code, countryCode, country, dateFrom, dateTo, colour }



let historyBaselineSnapshot = null;
let historyBaselineSignature = '';
let historyUndoStack = [];
let historyRedoStack = [];
const HISTORY_STACK_LIMIT = 50;
let historyTrackingSuspended = false;
let historyRestoreInProgress = false;

// Country and static city database extracted to js/city-matcher.js

// City color palette - warm, distinctive travel colors
const CITY_COLORS = [
  '#2C3E50', // Midnight blue (default)
  '#E74C3C', // Coral red
  '#3498DB', // Ocean blue
  '#27AE60', // Emerald
  '#F39C12', // Amber
  '#9B59B6', // Amethyst
  '#1ABC9C', // Turquoise
  '#E91E63', // Pink
  '#795548', // Brown
  '#607D8B', // Blue grey
  '#FF5722', // Deep orange
  '#8BC34A', // Light green
  '#3F51B5', // Indigo
  '#009688', // Teal
  '#FF9800', // Orange
  '#CDDC39', // Lime
  '#9C27B0', // Purple
  '#00BCD4', // Cyan
  '#FFC107', // Gold
  '#FF4081'  // Hot pink
];
let titleData = { title: "✈ New Trip Plan", subtitle: "Click here to add your trip subtitle/description" };
let currentFileName = "Default Template";
let activeFileHandle = null;
let activeFileHandleName = null;
let pendingFileHandle = null;
let fileWriteFailed = false;
let importedJsonWithoutWriteAccess = localStorage.getItem('travelApp_json_write_warning') === 'true';
const ACTIVE_FILE_HANDLE_DB_KEY = 'activeFileHandle';
let saveQueuePromise = null;
let saveQueued = false;
let saveQueuedShowTick = false;

// Journeys data - make global so all modules can access
let journeys = [];
window.journeys = journeys;

let stays = [];

// Sync core reactive state pointers for cross-module accessibility
function defineGlobalProp(name, getter, setter) {
  const g = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : null);
  if (g) {
    try {
      Object.defineProperty(g, name, {
        get: getter,
        set: setter,
        configurable: true,
        enumerable: true
      });
    } catch (_) {
      g[name] = getter();
    }
  }
}

defineGlobalProp('appData', () => appData, (v) => { appData = v; });
defineGlobalProp('citiesData', () => citiesData, (v) => { citiesData = v; });
defineGlobalProp('journeys', () => journeys, (v) => { journeys = v; });
defineGlobalProp('stays', () => stays, (v) => { stays = v; });
defineGlobalProp('titleData', () => titleData, (v) => { titleData = v; });
defineGlobalProp('packingData', () => packingData, (v) => { packingData = v; });
defineGlobalProp('leaveHomeData', () => leaveHomeData, (v) => { leaveHomeData = v; });

function syncGlobalStatePointers() {
  const g = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : null);
  if (g) {
    try {
      g.appData = appData;
      g.titleData = titleData;
      g.journeys = journeys;
      g.stays = stays;
      g.citiesData = citiesData;
      g.packingData = packingData;
      g.leaveHomeData = leaveHomeData;
    } catch (_) {}
  }
}
syncGlobalStatePointers();
window.stays = stays;

// Current city filter - 'all' or city ID (global for cross-module access)
let currentCityFilter = 'all';
window.currentCityFilter = currentCityFilter;

function calculateDjb2Hash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return hash >>> 0; // Return unsigned 32-bit integer
}
window.calculateDjb2Hash = calculateDjb2Hash;

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

function getCurrentAppData() {
  let journeysData = [];
  if (typeof journeys !== 'undefined') journeysData = normalizeTripJourneysData(deepClone(journeys));
  let staysData = [];
  if (typeof stays !== 'undefined') staysData = normalizeTripStaysData(deepClone(stays));
  let citiesDataToExport = [];
  if (typeof citiesData !== 'undefined') citiesDataToExport = normalizeTripCitiesDateData(deepClone(citiesData));
  let userCitiesData = [];
  if (typeof userCities !== 'undefined') userCitiesData = userCities;
  let userCountriesData = [];
  if (typeof userCountries !== 'undefined') userCountriesData = userCountries;
  const itineraryData = normalizeTripLegsData(deepClone(appData));
  return {
    meta: titleData,
    itinerary: itineraryData,
    packing: packingData,
    leaveHome: leaveHomeData,
    hotelCheckout: hotelCheckoutData,
    journeys: journeysData,
    stays: staysData,
    cities: citiesDataToExport,
    userCities: userCitiesData,
    userCountries: userCountriesData
  };
}

function cloneHistorySnapshot() {
  return deepClone(getCurrentAppData());
}

function getHistorySnapshotSignature(snapshot) {
  return JSON.stringify(snapshot);
}

function syncHistoryControls() {
  const canUndo = historyUndoStack.length > 0;
  const canRedo = historyRedoStack.length > 0;
  const controlIds = [
    ['undoBtn', canUndo],
    ['redoBtn', canRedo],
    ['mobileUndoBtn', canUndo],
    ['mobileRedoBtn', canRedo]
  ];

  controlIds.forEach(([id, enabled]) => {
    const button = document.getElementById(id);
    if (!button) return;
    button.disabled = !enabled;
    button.setAttribute('aria-disabled', String(!enabled));
  });

  if (typeof window.syncMobileMenuControls === 'function') {
    window.syncMobileMenuControls();
  }
}

function resetHistoryState(snapshot = cloneHistorySnapshot()) {
  historyBaselineSnapshot = snapshot;
  historyBaselineSignature = getHistorySnapshotSignature(snapshot);
  historyUndoStack = [];
  historyRedoStack = [];
  syncHistoryControls();
}

function captureHistoryBeforeSave() {
  if (historyTrackingSuspended) {
    return;
  }

  if (historyRestoreInProgress) {
    const currentSnapshot = cloneHistorySnapshot();
    historyBaselineSnapshot = currentSnapshot;
    historyBaselineSignature = getHistorySnapshotSignature(currentSnapshot);
    syncHistoryControls();
    return;
  }

  const currentSnapshot = cloneHistorySnapshot();
  const currentSignature = getHistorySnapshotSignature(currentSnapshot);

  if (!historyBaselineSnapshot) {
    historyBaselineSnapshot = currentSnapshot;
    historyBaselineSignature = currentSignature;
    syncHistoryControls();
    return;
  }

  if (currentSignature === historyBaselineSignature) {
    syncHistoryControls();
    return;
  }

  historyUndoStack.push(historyBaselineSnapshot);
  if (historyUndoStack.length > HISTORY_STACK_LIMIT) {
    historyUndoStack.shift();
  }

  historyBaselineSnapshot = currentSnapshot;
  historyBaselineSignature = currentSignature;
  historyRedoStack = [];
  syncHistoryControls();
}

function restoreHistorySnapshot(snapshot) {
  if (!snapshot) return false;
  historyRestoreInProgress = true;

  try {
    titleData = deepClone(snapshot.meta || titleData);
    appData = normalizeTripLegsData(deepClone(snapshot.itinerary || []));
    packingData = ensureDefaultPackingAreas(snapshot.packing || []);
    leaveHomeData = deepClone(snapshot.leaveHome || []);
    hotelCheckoutData = deepClone(snapshot.hotelCheckout || []);
    journeys = normalizeTripJourneysData(deepClone(snapshot.journeys || []));
    stays = normalizeTripStaysData(deepClone(snapshot.stays || []));
    citiesData = normalizeTripCitiesDateData(deepClone(snapshot.cities || []));
    userCities = deepClone(snapshot.userCities || []);
    userCountries = deepClone(snapshot.userCountries || []);

    window.journeys = journeys;
    window.stays = stays;

    const title = document.getElementById('mainTitle');
    const subtitle = document.getElementById('mainSubtitle');
    if (title) title.innerText = titleData.title || '';
    if (subtitle) subtitle.innerText = titleData.subtitle || '';

    if (typeof syncActiveFileDisplay === 'function') syncActiveFileDisplay();
    if (typeof buildNav === 'function') buildNav();
    if (typeof rebuildCurrentView === 'function') rebuildCurrentView();
    else if (typeof buildItinerary === 'function') buildItinerary();
    if (typeof buildTransportTab === 'function') buildTransportTab();
    if (typeof buildAccomTab === 'function') buildAccomTab();
    if (typeof buildBudgetTab === 'function') buildBudgetTab();
    if (typeof buildPackingTab === 'function') buildPackingTab();
    if (typeof buildJourneyMap === 'function') buildJourneyMap();
    if (typeof populateCityList === 'function') populateCityList();
  } finally {}

  return true;
}

async function undoTripChange() {
  if (historyUndoStack.length === 0) return false;

  const snapshot = historyUndoStack.pop();
  historyRedoStack.push(cloneHistorySnapshot());
  try {
    const restored = restoreHistorySnapshot(snapshot);
    if (!restored) return false;

    await saveData(false);
  } finally {
    historyRestoreInProgress = false;
    syncHistoryControls();
  }
  return true;
}

async function redoTripChange() {
  if (historyRedoStack.length === 0) return false;

  const snapshot = historyRedoStack.pop();
  historyUndoStack.push(cloneHistorySnapshot());
  try {
    const restored = restoreHistorySnapshot(snapshot);
    if (!restored) return false;

    await saveData(false);
  } finally {
    historyRestoreInProgress = false;
    syncHistoryControls();
  }
  return true;
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

// Extract unique cities from itinerary data (including journeys, stays, and cityId references)
function extractCitiesFromItinerary() {
  const cityMap = new Map();

  // Pre-build O(1) lookup maps for userCities to avoid repeated linear scans
  const userCitiesByNameMap = new Map();
  const userCitiesByIdMap = new Map();
  if (Array.isArray(userCities)) {
    userCities.forEach(uCity => {
      if (uCity && uCity.name) {
        const lowerName = uCity.name.toLowerCase();
        userCitiesByNameMap.set(lowerName, uCity);
        const cityId = 'city-' + lowerName.replace(/[^a-z0-9]/g, '-');
        userCitiesByIdMap.set(cityId, uCity);
      }
    });
  }

  // Helper to add/update city
  const addCity = (cityName, sourceDate = null, source = 'itinerary') => {
    if (!cityName) return;

    // Normalize city name - strip emojis, parentheses (like (Trip Start) or (1)), and trim
    let normalized = cityName
      .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '')
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .replace(/[\u{2600}-\u{26FF}]/gu, '')
      .replace(/[\u{2700}-\u{27BF}]/gu, '')
      .replace(/\p{Emoji}/gu, '')
      .replace(/\s*\([^)]*\)/gu, '')
      .replace(/[^\w\s-]/gu, '')
      .trim();

    const skipList = ['Home', 'In transit', 'Between cities', 'TBC', '', 'Return', 'Departure', 'Arrival'];
    if (skipList.some(skipName => skipName.toLowerCase() === normalized.toLowerCase())) return;

    // Try to look up the city to get country info
    let existing = cityMap.get(normalized);

    if (!existing) {
      const nameMatches = ALL_CITIES_BY_NAME_MAP.get(normalized.toLowerCase());
      const dbMatch = nameMatches ? nameMatches[0] : null;
      let country = '';
      let countryCode = '';
      let formattedName = dbMatch ? dbMatch.name : formatCityTitleCase(normalized);

      if (dbMatch) {
        country = getCountryName(dbMatch.countryCode);
        countryCode = dbMatch.countryCode;
      }

      existing = {
        id: 'city-' + formattedName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: formattedName,
        country: country,
        countryCode: countryCode,
        dateFrom: sourceDate || '',
        dateTo: sourceDate || '',
        colour: getRandomCityColor()
      };
      cityMap.set(normalized, existing);
    } else if (sourceDate) {
      if (!existing.dateFrom || sourceDate < existing.dateFrom) existing.dateFrom = sourceDate;
      if (!existing.dateTo || sourceDate > existing.dateTo) existing.dateTo = sourceDate;
    }
  };

  // Helper to add city by ID only (used when stay has only cityId)
  const addCityById = (cityId, sourceDate = null) => {
    if (!cityId) return;
    // Extract city slug from ID like city-vienna for cities not in built-in database
    const slug = cityId.replace('city-', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    // Check if this city exists in ALL_CITIES database
    const slugLower = slug.toLowerCase();
    const nameMatches = ALL_CITIES_BY_NAME_MAP.get(slugLower);
    let dbMatch = nameMatches ? nameMatches[0] : null;
    if (!dbMatch) {
      const slugClean = slugLower.replace(/-/g, '');
      dbMatch = ALL_CITIES_BY_CLEAN_NAME_MAP.get(slugClean) || null;
    }
    if (dbMatch) {
      addCity(dbMatch.name, sourceDate);
    } else {
      // Also check userCities
      const userMatch = userCitiesByNameMap.get(slugLower) || userCitiesByIdMap.get(cityId);
      if (userMatch) {
        // For user cities, try to look up the city for country info
        const countryMatch = COUNTRY_DATA.find(c => c.code === userMatch.countryCode);
        addCity(userMatch.name, sourceDate);
      } else {
        // Parse from stays propertyName which often has full city info like "ibis Styles Bangkok Sukhumvit..."
        citiesData.forEach(c => {
          if (c.id === cityId) {
            addCity(c.name, sourceDate);
          }
        });
      }
    }
  };

  // 1. Extract from itinerary days (day.from/to) with date information
  appData.forEach(leg => {
    if (!leg || !Array.isArray(leg.days)) return;
    leg.days.forEach(day => {
      addCity(day.from, day.date);
      addCity(day.to, day.date);
    });
  });

  // 2. Extract from journeys
  if (Array.isArray(journeys)) {
    journeys.forEach(j => {
      addCity(j.fromLocation);
      addCity(j.toLocation);
    });
  }

  // 3. Extract from stays - use cityId to get city info
  if (Array.isArray(stays)) {
    stays.forEach(s => {
      if (s.cityId) {
        // First try to find existing city by ID
        let cityFound = false;
        // Check in ALL_CITIES (built-in + extended)
        const dbCity = ALL_CITIES_BY_CITY_ID_MAP.get(s.cityId);
        if (dbCity) {
          addCity(dbCity.name, s.checkIn);
          cityFound = true;
        }
        // Check in userCities
        if (!cityFound) {
          const uCity = userCitiesByIdMap.get(s.cityId);
          if (uCity) {
            addCity(uCity.name, s.checkIn);
            cityFound = true;
          }
        }
        // Last resort: parse from cityId slug
        if (!cityFound) {
          addCityById(s.cityId, s.checkIn);
        }
      } else if (s.city) {
        // Legacy format with city name directly
        addCity(s.city, s.checkIn);
      }
    });
  }

  // 4. Extract from cityId references in trip data
  appData.forEach(leg => {
    if (!leg || !Array.isArray(leg.days)) return;
    (leg.cityFood || []).forEach(item => {
      if (item.cityId) addCityById(item.cityId);
    });
    (leg.suggestedActivities || []).forEach(act => {
      if (act.cityId) addCityById(act.cityId);
    });
    (leg.legTips || []).forEach(tip => {
      if (tip.cityId) addCityById(tip.cityId);
    });
    leg.days.forEach(day => {
      (day.accomItems || []).forEach(item => {
        if (item.cityId) addCityById(item.cityId);
      });
      (day.activityItems || []).forEach(item => {
        if (item.cityId) addCityById(item.cityId);
      });
    });
  });

  const result = Array.from(cityMap.values());

  // Final pass: look up country data for any remaining unknown cities
  result.forEach(city => {
    normalizeCityLocationData(city);
    if (!city.country && !city.countryCode) {
      const nameMatches = ALL_CITIES_BY_NAME_MAP.get(city.name.toLowerCase());
      const dbMatch = nameMatches ? nameMatches[0] : null;
      if (dbMatch) {
        city.countryCode = dbMatch.countryCode;
        city.country = getCountryName(dbMatch.countryCode);
      }
    }
  });

  return result;
}

// Get city ID by name (case insensitive)
function getCityIdByName(cityName) {
  if (!cityName) return '';
  const city = citiesData.find(c => c.name.toLowerCase() === cityName.toLowerCase().trim());
  return city ? city.id : '';
}

// Get a random city color from the palette (avoids using the same color as recently used)
function getRandomCityColor(usedColorsSet = null) {
  // Check which colors are already in use
  const usedColors = usedColorsSet || new Set(citiesData.map(c => c.colour));
  const availableColors = CITY_COLORS.filter(c => !usedColors.has(c));

  // Use available colors first, fall back to any color if all are used
  const palette = availableColors.length > 0 ? availableColors : CITY_COLORS;
  const randomIndex = Math.floor(Math.random() * palette.length);
  const color = palette[randomIndex];
  if (usedColorsSet) usedColorsSet.add(color);
  return color;
}

// Add or update a city with ISO/ICAO standards
function addOrUpdateCity(cityNameOrOptions, country = '', dateFrom = '', dateTo = '', cityCode = '', countryCode = '', lat = null, lng = null) {
  let cityName = '';
  if (typeof cityNameOrOptions === 'object' && cityNameOrOptions !== null) {
    cityName = cityNameOrOptions.cityName || cityNameOrOptions.name || '';
    country = cityNameOrOptions.country ?? country;
    dateFrom = cityNameOrOptions.dateFrom ?? dateFrom;
    dateTo = cityNameOrOptions.dateTo ?? dateTo;
    cityCode = cityNameOrOptions.cityCode ?? cityNameOrOptions.code ?? cityCode;
    countryCode = cityNameOrOptions.countryCode ?? countryCode;
    lat = cityNameOrOptions.lat ?? lat;
    lng = cityNameOrOptions.lng ?? lng;
  } else {
    cityName = cityNameOrOptions || '';
  }

  if (!cityName) return null;

  const normalizedName = cityName.trim();

  // Check if city already exists
  const existing = citiesData.find(c => c.name.toLowerCase() === normalizedName.toLowerCase());
  if (existing) {
    // Update existing city
    if (country) existing.country = country;
    if (countryCode) existing.countryCode = countryCode;
    if (cityCode) existing.code = cityCode;
    if (lat !== null) existing.lat = lat;
    if (lng !== null) existing.lng = lng;
    if (dateFrom && dateFrom < existing.dateFrom) existing.dateFrom = dateFrom;
    if (dateTo && dateTo > existing.dateTo) existing.dateTo = dateTo;
    return existing;
  }

  // Look up city in databases
  let cCode = countryCode;
  let cName = country;
  let cityLat = lat;
  let cityLng = lng;

  // First: look up city from built-in database or user cities
  const nameMatches = ALL_CITIES_BY_NAME_MAP.get(normalizedName.toLowerCase());
  let dbMatch = nameMatches ? nameMatches[0] : null;
  if (!dbMatch && cityCode) {
    dbMatch = ALL_CITIES_BY_CODE_MAP.get(cityCode.toUpperCase()) || null;
  }

  let formattedName = formatCityTitleCase(normalizedName);

  if ((cityLat === null || cityLat === undefined || cityLat === '') && typeof window !== 'undefined' && window.__dynamicCityCoordsCache) {
    const cached = window.__dynamicCityCoordsCache.get(normalizedName.toLowerCase());
    if (cached && cached.lat !== undefined && cached.lng !== undefined) {
      cityLat = cached.lat;
      cityLng = cached.lng;
    }
  }

  if (dbMatch) {
    // City found in database - use its country and coordinates if missing
    if (!cCode) cCode = dbMatch.countryCode;
    if ((cityLat === null || cityLat === undefined || cityLat === '') && dbMatch.lat !== undefined) cityLat = dbMatch.lat;
    if ((cityLng === null || cityLng === undefined || cityLng === '') && dbMatch.lng !== undefined) cityLng = dbMatch.lng;
    
    // Look up the full country name from the country code
    const countryMatch = COUNTRY_DATA.find(c => c.code === dbMatch.countryCode);
    if (countryMatch) {
      cName = countryMatch.name;
    }
  }

  // Create new city with ISO structure
  const iataCode = cityCode || (dbMatch ? dbMatch.code : '') || '';
  const newCity = {
    id: 'city-' + formattedName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    name: formattedName,
    code: iataCode,
    countryCode: cCode || '',
    country: cName || country,
    lat: cityLat,
    lng: cityLng,
    dateFrom: dateFrom,
    dateTo: dateTo,
    colour: getRandomCityColor()
  };
  normalizeCityLocationData(newCity);
  if (cityHasStoredCoords(newCity)) {
    if (typeof window !== 'undefined') {
      window.__dynamicCityCoordsCache = window.__dynamicCityCoordsCache || new Map();
      window.__dynamicCityCoordsCache.set(formattedName.toLowerCase(), { lat: Number(newCity.lat), lng: Number(newCity.lng) });
    }
  }
  citiesData.push(newCity);
  return newCity;
}

// City location matching and fuzzy geocoding extracted to js/city-matcher.js

function promptCityDisambiguation(cityId, candidates) {
  const city = citiesData.find(c => c.id === cityId);
  if (!city || !Array.isArray(candidates) || candidates.length === 0) return;

  const existingModal = document.getElementById('city-disambiguation-modal');
  if (existingModal) existingModal.remove();

  const overlay = document.createElement('div');
  overlay.id = 'city-disambiguation-modal';
  overlay.className = 'modal-overlay';
  overlay.style.cssText = 'display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 9999; align-items: center; justify-content: center;';

  const choicesHtml = candidates.map(cand => {
    const flag = getCountryFlag(cand.countryCode);
    const dbMatch = ALL_CITIES_BY_NAME_COUNTRY_MAP.get(`${city.name.toLowerCase()}|${cand.countryCode.toUpperCase()}`) || null;
    const icaoCode = dbMatch ? (dbMatch.icaoCode || dbMatch.icao || '') : '';
    
    return `
      <button class="trip-start-choice" type="button" style="display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1.1rem; border: 1px solid #c8d6d0; border-radius: 0.75rem; background: #fff; text-align: left; cursor: pointer; margin-bottom: 0.65rem; width: 100%;" onclick="selectCityDisambiguationChoice({ cityId: '${cityId}', countryCode: '${cand.countryCode}', lat: ${cand.lat}, lng: ${cand.lng}, icaoCode: '${icaoCode}' })">
        <div>
          <strong style="font-size: 1.05rem; color: #162c3b;">${flag} ${city.name}, ${cand.countryName}</strong>
          <p style="margin: 0.2rem 0 0; font-size: 0.82rem; color: #60717b;">${cand.displayName}</p>
        </div>
        <span style="font-size: 1.1rem; color: #176e67; font-weight: 700;">Select →</span>
      </button>
    `;
  }).join('');

  overlay.innerHTML = `
    <div class="modal-content" style="max-width: 520px; width: 90%; background: #fff; border-radius: 1rem; padding: 1.5rem; box-shadow: 0 10px 25px rgba(0,0,0,0.25);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 0.75rem;">
        <h3 style="margin: 0; font-size: 1.25rem; color: #2C3E50;">❓ Which "${escapeTripStartText(city.name)}" are you visiting?</h3>
        <button type="button" class="modal-close" style="border: none; background: transparent; font-size: 1.5rem; cursor: pointer;" onclick="document.getElementById('city-disambiguation-modal').remove()">&times;</button>
      </div>
      <p style="font-size: 0.9rem; color: #556677; margin-top: 0; margin-bottom: 1.25rem;">
        Multiple cities named <strong>${escapeTripStartText(city.name)}</strong> were found. Select your destination country:
      </p>
      <div class="disambiguation-choices">${choicesHtml}</div>
      <button type="button" class="action-btn" style="width: 100%; margin-top: 0.75rem;" onclick="document.getElementById('city-disambiguation-modal').remove()">Cancel</button>
    </div>
  `;

  document.body.appendChild(overlay);
}

function selectCityDisambiguationChoice(options = {}) {
  let cityId, countryCode, lat, lng, iataCode, icaoCode;
  if (typeof options === 'object' && options !== null && !Array.isArray(options)) {
    ({ cityId, countryCode, lat, lng, iataCode = '', icaoCode = '' } = options);
  } else {
    cityId = arguments[0];
    countryCode = arguments[1];
    lat = arguments[2];
    lng = arguments[3];
    iataCode = arguments[4] || '';
    icaoCode = arguments[5] || '';
  }

  const city = citiesData.find(c => c.id === cityId);
  if (!city) return;

  city.countryCode = countryCode;
  city.country = getCountryName(countryCode);
  city.lat = lat;
  city.lng = lng;
  if (iataCode) city.code = iataCode;
  if (icaoCode) city.icaoCode = icaoCode;

  saveData(true);
  const modal = document.getElementById('city-disambiguation-modal');
  if (modal) modal.remove();

  populateCityList();
  if (typeof buildNav === 'function') buildNav();
  if (typeof buildItinerary === 'function') buildItinerary();
  if (typeof buildJourneyMap === 'function') buildJourneyMap();
  showToast(`Updated location for ${city.name} (${city.country})`);
}

window.promptCityDisambiguation = promptCityDisambiguation;
window.selectCityDisambiguationChoice = selectCityDisambiguationChoice;

function applySuggestedCityCorrection(cityId, canonicalName) {
  const city = citiesData.find(c => c.id === cityId);
  if (!city || !canonicalName) return;

  renameCityInDialog(cityId, canonicalName);
  const match = getCityLocationDatabaseMatch(city);
  if (match) {
    city.countryCode = match.countryCode;
    city.country = getCountryName(match.countryCode);
    if (match.lat !== undefined && match.lng !== undefined) {
      city.lat = match.lat;
      city.lng = match.lng;
    }
    if (match.code) {
      city.code = match.code;
    }
    if (match.icaoCode || match.icao) {
      city.icaoCode = match.icaoCode || match.icao;
    }
  }
  saveData(true);
  populateCityList();
  if (typeof buildNav === 'function') buildNav();
  if (typeof buildItinerary === 'function') buildItinerary();
  if (typeof buildJourneyMap === 'function') buildJourneyMap();
  if (typeof showToast === 'function') showToast(`Updated city to "${canonicalName}"`);
}
window.applySuggestedCityCorrection = applySuggestedCityCorrection;

async function triggerOnlineSearch(cityId) {
  const city = citiesData.find(c => c.id === cityId);
  if (!city) return;

  const btn = document.querySelector(`[data-search-btn="${cityId}"]`);
  if (btn) btn.disabled = true;

  if (!city.countryCode) {
    const candidates = await searchCityOnlineCandidates(city.name);
    if (candidates.length > 1) {
      if (btn) btn.disabled = false;
      await promptCityDisambiguation(cityId, candidates);
      return;
    }
  }

  const result = await resolveCityLocation(city);
  if (result) {
    applyCityLocation(city, result);
    saveData(true);
    if (typeof populateCityList === 'function') populateCityList();
    if (typeof buildNav === 'function') buildNav();
    if (typeof buildItinerary === 'function') buildItinerary();
    if (typeof buildJourneyMap === 'function') buildJourneyMap();
  } else {
    alert(`Could not find coordinates for "${city.name}" online.`);
    if (btn) btn.disabled = false;
  }
}

window.triggerOnlineSearch = triggerOnlineSearch;

async function fetchAllMissingCityLocations() {
  const missingCities = citiesData.filter(city => !cityHasStoredCoords(city) || !city.countryCode);
  if (missingCities.length === 0) return;

  const btn = document.getElementById('fetchMissingCityLocationsBtn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = `Finding 0/${missingCities.length}...`;
  }

  let foundCount = 0;
  const onlineCities = [];

  // Phase 1: Fast local resolution for cities matching local database/aliases
  for (let i = 0; i < missingCities.length; i++) {
    const city = missingCities[i];
    const localResult = resolveCityLocationLocal(city);
    if (localResult && applyCityLocation(city, localResult)) {
      foundCount++;
    } else {
      onlineCities.push(city);
    }
    if (btn) {
      btn.textContent = `Finding ${foundCount}/${missingCities.length}...`;
    }
  }

  // Phase 2: Sequential rate-limited geocoding for remaining online cities
  for (let i = 0; i < onlineCities.length; i++) {
    const city = onlineCities[i];
    if (btn) {
      btn.textContent = `Finding ${foundCount + 1}/${missingCities.length}...`;
    }

    const onlineMatch = await searchCityOnline(city.name, city.countryCode || '', city.country || '');
    if (onlineMatch) {
      const result = {
        lat: onlineMatch.lat,
        lng: onlineMatch.lng,
        countryCode: onlineMatch.countryCode || city.countryCode || '',
        countryName: onlineMatch.countryName || city.country || '',
        code: '',
        icaoCode: ''
      };
      if (applyCityLocation(city, result)) {
        foundCount++;
      }
    }

    if (i < onlineCities.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1100));
    }
  }

  saveData(true);
  populateCityList();
  if (typeof buildCityNav === 'function') buildCityNav();
  if (typeof buildItinerary === 'function') buildItinerary();
  if (typeof buildJourneyMap === 'function') buildJourneyMap();

  if (foundCount < missingCities.length) {
    alert(`Found locations for ${foundCount} of ${missingCities.length} cities. Check the remaining cities manually.`);
  }
}

window.fetchAllMissingCityLocations = fetchAllMissingCityLocations;

// Load user-extensible country database
const savedUserCountries = localStorage.getItem('travelApp_userCountries_v1');
if (savedUserCountries) {
  try {
    userCountries = JSON.parse(savedUserCountries);
  } catch (e) {
    console.error('[Countries] Failed to parse user countries:', e);
    userCountries = [];
  }
}

// Create datalists for city and country selection
function createCityDatalists() {
  // Remove existing datalists if present
  ['cities-datalist', 'countries-datalist'].forEach(id => {
    const existing = document.getElementById(id);
    if (existing) existing.remove();
  });

  // Create combined city datalist (built-in + user cities)
  const citiesList = document.createElement('datalist');
  citiesList.id = 'cities-datalist';

  const combinedCities = [...ALL_CITIES, ...userCities];
  // Remove duplicates by name in O(N) time using a Set
  const seenCityNames = new Set();
  const uniqueCities = combinedCities.filter(c => {
    if (!c || !c.name) return false;
    const lowerName = c.name.toLowerCase();
    if (seenCityNames.has(lowerName)) {
      return false;
    }
    seenCityNames.add(lowerName);
    return true;
  });

  uniqueCities
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach(city => {
      const option = document.createElement('option');
      option.value = city.name;
      const flag = city.countryCode ? getCountryFlag(city.countryCode) : '🌍';
      const cName = getCountryName(city.countryCode);
      option.textContent = cName ? `${flag} ${cName}` : flag;
      citiesList.appendChild(option);
    });

  // Create country datalist
  const countriesList = document.createElement('datalist');
  countriesList.id = 'countries-datalist';
  getAllCountries().forEach(country => {
    const option = document.createElement('option');
    option.value = country.name;
    option.textContent = `${country.flag} ${country.code}`;
    countriesList.appendChild(option);
  });

  document.body.appendChild(citiesList);
  document.body.appendChild(countriesList);
}

// Set up country select change handler for custom country entry
setupCountrySelectHandler();

// Set up change handler for country select to show custom country inputs when "Other" selected
function setupCountrySelectHandler() {
  const select = document.getElementById('newCityCountrySelect');
  if (!select) return;

  // Remove existing handler to avoid duplicates
  const clone = select.cloneNode(true);
  select.parentNode.replaceChild(clone, select);

  clone.addEventListener('change', function() {
    const customDiv = document.getElementById('customCountryDiv');
    if (this.value === 'ZZ') {
      if (customDiv) customDiv.style.display = 'block';
      // Focus on the custom country name input
      const nameInput = document.getElementById('customCountryName');
      if (nameInput) nameInput.focus();
    } else {
      if (customDiv) customDiv.style.display = 'none';
    }
  });
}

// City title casing and country management extracted to js/city-matcher.js

// Delete a city by ID
function deleteCity(cityId) {
  if (!cityId) return false;

  const index = citiesData.findIndex(c => c.id === cityId);
  if (index === -1) return false;

  // Remove from cities array
  citiesData.splice(index, 1);

  // Clear cityId references from all entities
  appData.forEach(leg => {
    // Clear legTips cityId
    (leg.legTips || []).forEach(tip => {
      if (tip.cityId === cityId) tip.cityId = '';
    });
    // Clear cityFood cityId
    (leg.cityFood || []).forEach(item => {
      if (item.cityId === cityId) item.cityId = '';
    });
    // Clear suggestedActivities cityId
    (leg.suggestedActivities || []).forEach(act => {
      if (act.cityId === cityId) act.cityId = '';
    });
    // Clear day items cityId
    leg.days.forEach(day => {
      (day.accomItems || []).forEach(item => {
        if (item.cityId === cityId) item.cityId = '';
      });
      (day.activityItems || []).forEach(item => {
        if (item.cityId === cityId) item.cityId = '';
      });
      // Clear transport items (accomItems array check above)
    });
  });

  // Clear from journeys
  (journeys || []).forEach(j => {
    if (j.fromCityId === cityId) j.fromCityId = '';
    if (j.toCityId === cityId) j.toCityId = '';
  });

  (stays || []).forEach(s => {
    if (s.cityId === cityId) s.cityId = '';
  });

  return true;
}

// Get home location (departure/arrival city)
function getHomeLocation() {
  // 1. Explicitly configured home city in trip metadata
  const explicitHome = (typeof titleData !== 'undefined' && titleData && titleData.homeCity) ? String(titleData.homeCity).trim() : '';
  if (explicitHome) {
    return {
      departure: explicitHome,
      return: explicitHome,
      isExplicit: true
    };
  }

  // 2. Infer from legs containing 'Home' or 'Start' / 'Finish' labels
  let homeDeparture = null;
  let homeReturn = null;

  appData.forEach(leg => {
    const lbl = String(leg.label || '').toLowerCase();
    const cleanLbl = typeof cleanCityNavLabel === 'function' ? cleanCityNavLabel(leg.label) : '';

    (leg.days || []).forEach(day => {
      if (day.from === 'Home' || String(day.from || '').toLowerCase() === 'home') {
        homeDeparture = day.to;
      }
      if (day.to === 'Home' || String(day.to || '').toLowerCase() === 'home') {
        homeReturn = day.from;
      }
    });

    if (!homeDeparture && lbl.includes('start') && cleanLbl && !['start', 'trip start', 'home'].includes(cleanLbl.toLowerCase())) {
      homeDeparture = cleanLbl;
    }
    if (!homeReturn && (lbl.includes('return') || lbl.includes('finish')) && cleanLbl && !['return', 'trip finish', 'trip return', 'home'].includes(cleanLbl.toLowerCase())) {
      homeReturn = cleanLbl;
    }
  });

  return {
    departure: homeDeparture,
    return: homeReturn,
    isExplicit: false
  };
}

// Check if a city is the home location (explicit or first departure / last return)
function isHomeCity(cityName) {
  if (!cityName) return false;
  const home = getHomeLocation();
  const cleanTarget = String(cityName).trim().toLowerCase();
  if (home.departure && String(home.departure).trim().toLowerCase() === cleanTarget) return true;
  if (home.return && String(home.return).trim().toLowerCase() === cleanTarget) return true;
  return false;
}

// Explicitly set or toggle a city as Home
function setHomeCity(cityName) {
  if (typeof titleData === 'undefined' || !titleData) titleData = {};
  const currentHome = titleData.homeCity ? String(titleData.homeCity).trim() : '';
  const cleanTarget = String(cityName || '').trim();

  if (!cleanTarget || (currentHome && currentHome.toLowerCase() === cleanTarget.toLowerCase())) {
    // Unmark home if same city is clicked again
    delete titleData.homeCity;
  } else {
    titleData.homeCity = cleanTarget;
  }

  if (typeof rebuildItineraryAndDataMappings === 'function') {
    rebuildItineraryAndDataMappings({
      showToast: true,
      message: cleanTarget ? `Marked ${cleanTarget} as Home & rebuilt itinerary` : 'Unmarked Home & rebuilt itinerary'
    });
  } else {
    if (typeof saveData === 'function') saveData(false);
    if (typeof populateCityList === 'function') populateCityList();
    if (typeof buildJourneyMap === 'function') buildJourneyMap();
    if (typeof buildCityNav === 'function') buildCityNav();
  }
  return true;
}

window.setHomeCity = setHomeCity;

// Get city name by ID
function getCityNameById(cityId) {
  if (!cityId) return '';
  const city = citiesData.find(c => c.id === cityId);
  return city ? city.name : '';
}

// Country flag emoji mapping (common travel destinations)
const COUNTRY_FLAGS = {
  'Australia': '🇦🇺',
  'Austria': '🇦🇹',
  'Bangkok': '🇹🇭',  // Thailand
  'Thailand': '🇹🇭',
  'Indonesia': '🇮🇩',
  'Denpasar': '🇮🇩',
  'Denpasar Bali': '🇮🇩',
  'Bali': '🇮🇩',
  'Bratislava': '🇸🇰', // Slovakia
  'Slovakia': '🇸🇰',
  'Brisbane': '🇦🇺',
  'Czech Republic': '🇨🇿',
  'Czechia': '🇨🇿',
  'Prague': '🇨🇿',
  'Germany': '🇩🇪',
  'Munich': '🇩🇪',
  'Nuremberg': '🇩🇪',
  'Italy': '🇮🇹',
  'Milan': '🇮🇹',
  'Innsbruck': '🇦🇹',
  'Bolzano': '🇮🇹',
  'Switzerland': '🇨🇭',
  'Zurich': '🇨🇭',
  'Taiwan': '🇹🇼',
  'Taipei': '🇹🇼',
  'Vienna': '🇦🇹',
  'Austria': '🇦🇹',
  'Koh Samui': '🇹🇭',
  'Samui': '🇹🇭',
  'UK': '🇬🇧',
  'United Kingdom': '🇬🇧',
  'London': '🇬🇧',
  'England': '🇬🇧',
  'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'France': '🇫🇷',
  'Paris': '🇫🇷',
  'Spain': '🇪🇸',
  'Barcelona': '🇪🇸',
  'Netherlands': '🇳🇱',
  'Amsterdam': '🇳🇱',
  'Greece': '🇬🇷',
  'Athens': '🇬🇷',
  'Japan': '🇯🇵',
  'Tokyo': '🇯🇵',
  'USA': '🇺🇸',
  'United States': '🇺🇸',
  'New York': '🇺🇸',
  'Portugal': '🇵🇹',
  'Lisbon': '🇵🇹',
  'Turkey': '🇹🇷',
  'Kuşadası': '🇹🇷',
  'Kusadasi': '🇹🇷',
  'Home': '🏠',
  'Dubai': '🇦🇪',
  'Abu Dhabi': '🇦🇪',
  'UAE': '🇦🇪',
  'United Arab Emirates': '🇦🇪'
};

// City/country name -> ISO-2 code for flagcdn.com images
const CITY_TO_CODE = {
  'australia': 'au', 'brisbane': 'au',
  'austria': 'at', 'vienna': 'at', 'innsbruck': 'at',
  'thailand': 'th', 'bangkok': 'th', 'kohsamui': 'th', 'samui': 'th',
  'indonesia': 'id', 'denpasar': 'id', 'denpasarbali': 'id', 'bali': 'id',
  'slovakia': 'sk', 'bratislava': 'sk',
  'czechrepublic': 'cz', 'czechia': 'cz', 'prague': 'cz',
  'germany': 'de', 'munich': 'de', 'nuremberg': 'de',
  'italy': 'it', 'milan': 'it', 'bolzano': 'it',
  'switzerland': 'ch', 'zurich': 'ch',
  'taiwan': 'tw', 'taipei': 'tw',
  'uk': 'gb', 'unitedkingdom': 'gb', 'london': 'gb', 'england': 'gb', 'scotland': 'gb',
  'france': 'fr', 'paris': 'fr',
  'spain': 'es', 'barcelona': 'es',
  'netherlands': 'nl', 'amsterdam': 'nl',
  'greece': 'gr', 'athens': 'gr',
  'japan': 'jp', 'tokyo': 'jp',
  'usa': 'us', 'unitedstates': 'us', 'newyork': 'us',
  'verona': 'it',
  'dubai': 'ae',
  'abudhabi': 'ae',
  'uae': 'ae',
  'unitedarabemirates': 'ae',
  'portugal': 'pt', 'lisbon': 'pt',
  'turkey': 'tr', 'kusadasi': 'tr', 'kuşadası': 'tr'
};

// Country name to ISO code mapping
const COUNTRY_TO_CODE = {
  'Australia': 'AU',
  'Austria': 'AT',
  'Thailand': 'TH',
  'Indonesia': 'ID',
  'Slovakia': 'SK',
  'Czech Republic': 'CZ',
  'Czechia': 'CZ',
  'Germany': 'DE',
  'Italy': 'IT',
  'Switzerland': 'CH',
  'Taiwan': 'TW',
  'UK': 'GB',
  'United Kingdom': 'GB',
  'Scotland': 'GB',
  'France': 'FR',
  'Spain': 'ES',
  'Netherlands': 'NL',
  'Greece': 'GR',
  'Japan': 'JP',
  'USA': 'US',
  'United States': 'US',
  'Portugal': 'PT',
  'Turkey': 'TR',
  'UAE': 'AE',
  'United Arab Emirates': 'AE'
};

// Precomputed reverse map from flag emoji to country name for O(1) lookups
const FLAG_TO_COUNTRY_MAP = new Map();
for (const [cName, cFlag] of Object.entries(COUNTRY_FLAGS)) {
  if (COUNTRY_TO_CODE[cName] && !FLAG_TO_COUNTRY_MAP.has(cFlag)) {
    FLAG_TO_COUNTRY_MAP.set(cFlag, cName);
  }
}

// Get flag emoji for a city (based on city name or country)
function getCityFlag(cityName) {
  if (!cityName) return '📍';
  const nameTrimmed = String(cityName).trim();
  if (!nameTrimmed) return '📍';

  // 1. If COUNTRY_FLAGS[cityName], return it
  if (COUNTRY_FLAGS[nameTrimmed]) {
    return COUNTRY_FLAGS[nameTrimmed];
  }
  const nameLower = nameTrimmed.toLowerCase();
  const cfKey = Object.keys(COUNTRY_FLAGS).find(k => k.toLowerCase() === nameLower);
  if (cfKey && COUNTRY_FLAGS[cfKey]) {
    return COUNTRY_FLAGS[cfKey];
  }

  // 2 & 3. Check citiesData
  if (typeof citiesData !== 'undefined' && Array.isArray(citiesData)) {
    const city = citiesData.find(c => c && c.name && (c.name.toLowerCase() === nameLower || c.name === nameTrimmed));
    if (city) {
      if (city.countryCode) {
        const flag = getCountryFlag(city.countryCode) || (typeof getCountryFlagEmoji === 'function' ? getCountryFlagEmoji(city.countryCode) : '');
        if (flag && flag !== '🌐') return flag;
      }
      if (city.country) {
        if (COUNTRY_FLAGS[city.country]) {
          return COUNTRY_FLAGS[city.country];
        }
        if (typeof COUNTRY_DATA !== 'undefined' && Array.isArray(COUNTRY_DATA)) {
          const countryMatch = COUNTRY_DATA.find(c => c && c.name && c.name.toLowerCase() === city.country.toLowerCase());
          if (countryMatch && countryMatch.flag && countryMatch.flag !== '🌐') {
            return countryMatch.flag;
          }
        }
      }
    }
  }

  // 4. If not in citiesData: check ALL_CITIES_BY_NAME_MAP or getCityLocationDatabaseMatch
  if (typeof ALL_CITIES_BY_NAME_MAP !== 'undefined') {
    const nameMatches = ALL_CITIES_BY_NAME_MAP.get(nameLower);
    if (nameMatches && nameMatches.length > 0 && nameMatches[0].countryCode) {
      const flag = getCountryFlag(nameMatches[0].countryCode) || (typeof getCountryFlagEmoji === 'function' ? getCountryFlagEmoji(nameMatches[0].countryCode) : '');
      if (flag && flag !== '🌐') return flag;
    }
  }

  if (typeof getCityLocationDatabaseMatch === 'function') {
    const dbMatch = getCityLocationDatabaseMatch({ name: nameTrimmed });
    if (dbMatch && dbMatch.countryCode) {
      const flag = getCountryFlag(dbMatch.countryCode) || (typeof getCountryFlagEmoji === 'function' ? getCountryFlagEmoji(dbMatch.countryCode) : '');
      if (flag && flag !== '🌐') return flag;
    }
  }

  // 5. Fallback to '📍'
  return '📍';
}

// Get flag as flagcdn.com img tag (works on Windows Chrome/Edge)
function getCityFlagHTML(cityName) {
  if (!cityName) return '<span class="city-flag">📍</span>';

  const cleanStr = (typeof cleanCityNavLabel === 'function' ? cleanCityNavLabel(cityName) : String(cityName)).trim() || String(cityName).trim();
  const lowerName = cleanStr.toLowerCase();
  const cityEntry = typeof citiesData !== 'undefined' && Array.isArray(citiesData)
    ? (citiesData.find(c => c && c.name && c.name.toLowerCase() === lowerName) || (typeof getCityByName === 'function' ? getCityByName(cleanStr) : null))
    : null;
  const lookupCity = lowerName.replace(/\s+/g, '');
  const lookupCountry = cityEntry?.country?.replace(/\s+/g, '').toLowerCase();
  let code = CITY_TO_CODE[lookupCity] || (lookupCountry ? (CITY_TO_CODE[lookupCountry] || COUNTRY_TO_CODE[lookupCountry]) : '');

  if (!code && cityEntry?.countryCode && cityEntry.countryCode.length === 2) {
    code = cityEntry.countryCode.toLowerCase();
  }
  if (!code && cityEntry?.country && Array.isArray(COUNTRY_DATA)) {
    const countryObj = COUNTRY_DATA.find(cd => cd.name.toLowerCase() === cityEntry.country.trim().toLowerCase());
    if (countryObj && countryObj.code) code = countryObj.code.toLowerCase();
  }
  if (!code && typeof ALL_CITIES_BY_NAME_MAP !== 'undefined') {
    const aliasName = CITY_ALIASES[lowerName] ? CITY_ALIASES[lowerName].toLowerCase() : lowerName;
    const dbMatch = ALL_CITIES_BY_NAME_MAP.get(aliasName) || (typeof getCityLocationDatabaseMatch === 'function' ? getCityLocationDatabaseMatch({ name: cleanStr }) : null);
    if (dbMatch && dbMatch.countryCode && dbMatch.countryCode.length === 2) {
      code = dbMatch.countryCode.toLowerCase();
    }
  }

  if (code) {
    return `<img src="https://flagcdn.com/w20/${code}.png" srcset="https://flagcdn.com/w40/${code}.png 2x" class="city-flag-img" alt="${cleanStr} flag" onerror="this.style.display='none'">`;
  }

  return '<span class="city-flag">📍</span>';
}

// Airport code lookups extracted to js/city-matcher.js

// Set country for a city
function setCityCountry(cityId, country) {
  const city = citiesData.find(c => c.id === cityId);
  if (city) {
    city.country = country;
    return true;
  }
  return false;
}

// City Management Dialog Functions
function openCityDialog() {
  const modal = document.getElementById('city-modal');
  if (modal) {
    // Keep Cities above other open modal workflows, such as Edit journey.
    modal.style.zIndex = '2200';
    modal.style.display = 'flex';
    createCityDatalists(); // Ensure datalists exist
    populateCityList();
    populateCountrySelect();
    setupCityAutocomplete();

    // Scroll active inputs into view when focused on mobile soft keyboard
    modal.querySelectorAll('input, select').forEach(input => {
      if (!input.dataset.scrollBound) {
        input.dataset.scrollBound = 'true';
        input.addEventListener('focus', function() {
          if (window.innerWidth <= 768) {
            setTimeout(() => {
              this.scrollIntoView({ block: 'center', behavior: 'smooth' });
            }, 300);
          }
        });
      }
    });
  }
}

// Setup live autocomplete and candidate search for city name input
function setupCityAutocomplete() {
  const nameInput = document.getElementById('newCityName');
  const countrySelect = document.getElementById('newCityCountrySelect');
  const countryInput = document.getElementById('newCityCountry');
  const codeDisplay = document.getElementById('cityCodeDisplay');
  const codeInfo = document.getElementById('cityCodeInfo');
  const resultsContainer = document.getElementById('cityLiveSearchResults');

  if (!nameInput) return;

  if (typeof window !== 'undefined') {
    window.__dynamicCityCoordsCache = window.__dynamicCityCoordsCache || new Map();
  }

  let debounceTimer = null;
  let activeIndex = -1;
  let currentQuery = '';
  let activeCandidates = [];

  function hideDropdown() {
    if (resultsContainer) {
      resultsContainer.style.display = 'none';
      resultsContainer.innerHTML = '';
    }
    activeIndex = -1;
    activeCandidates = [];
  }

  function selectCandidate(candidate) {
    if (!candidate) return;
    nameInput.value = candidate.name;
    if (candidate.countryCode && countrySelect) {
      countrySelect.value = candidate.countryCode;
    }
    if (candidate.countryName && countryInput) {
      countryInput.value = candidate.countryName;
    }

    if (typeof window !== 'undefined') {
      window.__stagedCityCoords = {
        name: candidate.name,
        lat: candidate.lat,
        lng: candidate.lng,
        countryCode: candidate.countryCode || '',
        countryName: candidate.countryName || ''
      };
      if (candidate.lat !== undefined && candidate.lng !== undefined && !isNaN(candidate.lat) && !isNaN(candidate.lng)) {
        window.__dynamicCityCoordsCache.set(candidate.name.toLowerCase(), { lat: Number(candidate.lat), lng: Number(candidate.lng) });
      }
    }

    if (codeDisplay && codeInfo) {
      const flag = candidate.countryCode ? getCountryFlag(candidate.countryCode) : '📍';
      const cName = candidate.countryName || (candidate.countryCode ? getCountryName(candidate.countryCode) : '');
      const coordStr = (candidate.lat !== undefined && candidate.lng !== undefined && !isNaN(candidate.lat) && !isNaN(candidate.lng))
        ? ` · 📍 ${candidate.lat.toFixed(4)}, ${candidate.lng.toFixed(4)}`
        : '';
      codeInfo.textContent = `${flag} ${cName}${coordStr} · Verified`;
      codeDisplay.style.display = 'block';
    }

    hideDropdown();
  }

  function renderDropdown(candidates) {
    if (!resultsContainer) return;
    activeCandidates = candidates || [];
    activeIndex = -1;

    if (activeCandidates.length === 0) {
      hideDropdown();
      return;
    }

    resultsContainer.innerHTML = '';
    activeCandidates.forEach((cand, idx) => {
      const item = document.createElement('div');
      item.className = 'city-live-search-item';
      item.setAttribute('role', 'option');
      item.dataset.index = String(idx);

      const flag = cand.countryCode ? getCountryFlag(cand.countryCode) : '📍';
      const flagSpan = document.createElement('span');
      flagSpan.className = 'city-live-search-flag';
      flagSpan.textContent = flag;

      const detailsDiv = document.createElement('div');
      detailsDiv.className = 'city-live-search-details';

      const nameDiv = document.createElement('div');
      nameDiv.className = 'city-live-search-name';
      nameDiv.textContent = cand.name || '';

      if (cand.source) {
        const sourceSpan = document.createElement('span');
        sourceSpan.className = 'city-live-search-badge-source';
        sourceSpan.textContent = cand.source;
        nameDiv.appendChild(sourceSpan);
      }

      const sub = cand.region ? `${cand.region}, ${cand.countryName}` : (cand.countryName || '');
      const subDiv = document.createElement('div');
      subDiv.className = 'city-live-search-sub';
      subDiv.textContent = sub;

      detailsDiv.appendChild(nameDiv);
      detailsDiv.appendChild(subDiv);

      item.appendChild(flagSpan);
      item.appendChild(detailsDiv);

      const hasCoords = cand.lat !== undefined && cand.lng !== undefined && !isNaN(Number(cand.lat)) && !isNaN(Number(cand.lng));
      if (hasCoords) {
        const coordSpan = document.createElement('span');
        coordSpan.className = 'city-live-search-coords-pill';
        coordSpan.textContent = `📍 ${Number(cand.lat).toFixed(2)}, ${Number(cand.lng).toFixed(2)}`;
        item.appendChild(coordSpan);
      }

      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        selectCandidate(cand);
      });

      resultsContainer.appendChild(item);
    });

    resultsContainer.style.display = 'block';
  }

  function updateHighlightedItem() {
    if (!resultsContainer) return;
    const items = resultsContainer.querySelectorAll('.city-live-search-item');
    items.forEach((item, idx) => {
      if (idx === activeIndex) {
        item.classList.add('is-selected');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('is-selected');
      }
    });
  }

  async function searchCandidates(query) {
    const clean = String(query || '').trim();
    if (clean.length < 2) {
      hideDropdown();
      return;
    }
    currentQuery = clean;
    const cleanLower = clean.toLowerCase();

    // 1. Gather local matches (built-in, user cities, extended database)
    const localCandidates = [];
    const seenKeys = new Set();

    function addCandidate({ name, countryCode, lat, lng, source, region = '' } = {}) {
      if (!name) return;
      const key = `${name.toLowerCase()}|${(countryCode || '').toUpperCase()}`;
      if (seenKeys.has(key)) return;
      seenKeys.add(key);
      localCandidates.push({
        name: formatCityTitleCase(name),
        countryCode: (countryCode || '').toUpperCase(),
        countryName: countryCode ? getCountryName(countryCode) : '',
        lat: lat !== undefined && lat !== null && !isNaN(Number(lat)) ? Number(lat) : undefined,
        lng: lng !== undefined && lng !== null && !isNaN(Number(lng)) ? Number(lng) : undefined,
        region: region,
        source: source
      });
    }

    if (typeof userCities !== 'undefined' && Array.isArray(userCities)) {
      userCities.forEach(uc => {
        if (uc.name && uc.name.toLowerCase().includes(cleanLower)) {
          addCandidate({ name: uc.name, countryCode: uc.countryCode, lat: uc.lat, lng: uc.lng, source: 'custom' });
        }
      });
    }

    if (typeof ALL_CITIES !== 'undefined' && Array.isArray(ALL_CITIES)) {
      ALL_CITIES.forEach(c => {
        if (c.name && (c.name.toLowerCase().startsWith(cleanLower) || (c.name.toLowerCase().includes(cleanLower) && cleanLower.length >= 4))) {
          if (localCandidates.length < 8) {
            addCandidate({ name: c.name, countryCode: c.countryCode, lat: c.lat, lng: c.lng, source: 'database' });
          }
        }
      });
    }

    if (typeof EXTENDED_CITY_DATABASE !== 'undefined') {
      for (const [extName, extData] of Object.entries(EXTENDED_CITY_DATABASE)) {
        if (extName.toLowerCase().startsWith(cleanLower) || (extName.toLowerCase().includes(cleanLower) && cleanLower.length >= 4)) {
          if (localCandidates.length < 10) {
            addCandidate({ name: extName, countryCode: extData.countryCode, lat: extData.lat, lng: extData.lng, source: 'database' });
          }
        }
      }
    }

    if (currentQuery === clean && localCandidates.length > 0) {
      renderDropdown(localCandidates.slice(0, 6));
    }

    // 2. Fetch live online candidates via OpenStreetMap Nominatim
    try {
      const onlineResults = await searchCityOnlineCandidates(clean);
      if (currentQuery !== clean) return;

      const merged = [...localCandidates];
      if (Array.isArray(onlineResults)) {
        onlineResults.forEach(item => {
          const existing = merged.find(m => m.name.toLowerCase() === item.name.toLowerCase() && (!m.countryCode || m.countryCode === item.countryCode));
          if (existing) {
            if (existing.lat === undefined && item.lat !== undefined) {
              existing.lat = item.lat;
              existing.lng = item.lng;
            }
            if (!existing.region && item.region) existing.region = item.region;
          } else {
            merged.push({
              name: item.name,
              countryCode: item.countryCode,
              countryName: item.countryName || (item.countryCode ? getCountryName(item.countryCode) : ''),
              region: item.region || '',
              lat: item.lat,
              lng: item.lng,
              source: 'live'
            });
          }
        });
      }

      if (currentQuery === clean) {
        renderDropdown(merged.slice(0, 8));
      }
    } catch (e) {
      console.warn('[setupCityAutocomplete] Online candidate fetch error:', e);
    }
  }

  nameInput.addEventListener('input', function() {
    const val = this.value;
    clearTimeout(debounceTimer);
    if (!val || val.trim().length < 2) {
      hideDropdown();
      if (codeDisplay) codeDisplay.style.display = 'none';
      if (typeof window !== 'undefined') window.__stagedCityCoords = null;
      return;
    }

    debounceTimer = setTimeout(() => {
      searchCandidates(val);
    }, 200);
  });

  nameInput.addEventListener('keydown', function(e) {
    if (!resultsContainer || resultsContainer.style.display === 'none') {
      if (e.key === 'Enter') {
        e.preventDefault();
        addNewCityFromDialog();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, activeCandidates.length - 1);
      updateHighlightedItem();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      updateHighlightedItem();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < activeCandidates.length) {
        selectCandidate(activeCandidates[activeIndex]);
      } else if (activeCandidates.length > 0) {
        selectCandidate(activeCandidates[0]);
      } else {
        addNewCityFromDialog();
      }
    } else if (e.key === 'Escape') {
      hideDropdown();
    }
  });

  document.addEventListener('click', function(e) {
    if (resultsContainer && !resultsContainer.contains(e.target) && e.target !== nameInput) {
      hideDropdown();
    }
  });
}

function closeCityDialog() {
  const modal = document.getElementById('city-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function populateCityList() {
  const container = document.getElementById('cityListContainer');
  if (!container) return;

  container.innerHTML = '';

  if (citiesData.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No cities defined yet.</p>';
    return;
  }

  const health = typeof auditCityHealth === 'function' ? auditCityHealth() : { totalIssues: 0 };
  const toolbar = document.createElement('div');
  toolbar.className = 'manage-cities-toolbar';
  toolbar.style.cssText = 'display:flex; align-items:center; justify-content:space-between; gap:0.5rem; flex-wrap:wrap; padding:0.75rem 1rem; background:#f0f7f4; border-bottom:1px solid #d0e5dc;';
  toolbar.innerHTML = `
    <div style="font-size:0.85rem; color:#176e67; font-weight:600;">
      🌍 Manage Cities (${citiesData.length} total ${health.totalIssues > 0 ? `· ⚠️ ${health.totalIssues} unmapped/missing flags` : '· ✅ All mapped'})
    </div>
    <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
      <button id="refetchAllCitiesBtn"
              data-alias="autoRepairAllCitiesBtn"
              class="search-btn refetch-all-cities-btn"
              style="color: #fff; background: #176e67; border:none; cursor: pointer; border-radius: 0.4rem; padding: 0.4rem 0.85rem; font-size: 0.85rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.35rem;"
              onclick="repairAllCityMetadata()"
              title="Auto-repair map coordinates and country flags for all cities">
        🔄 Refetch All Flags & Coordinates
      </button>
      <button class="search-btn"
              style="color: #2C3E50; background: #fff; border:1px solid #cbd5e1; cursor: pointer; border-radius: 0.4rem; padding: 0.4rem 0.75rem; font-size: 0.85rem; font-weight: 600;"
              onclick="openAllInGoogleMaps()"
              title="Open all mapped cities in Google Maps">
        🗺️ View All on Map
      </button>
    </div>
  `;
  container.appendChild(toolbar);

  // Sort cities alphabetically by name
  const sortedCities = [...citiesData].sort((a, b) => a.name.localeCompare(b.name));

  sortedCities.forEach(city => {
    const flag = getCityFlag(city.name);
    const isHome = isHomeCity(city.name);
    const escapedCityId = escapeTripStartText(city.id);
    const escapedCityName = escapeTripStartText(city.name);
    const escapedCityCode = escapeTripStartText(city.code || city.iata || '');
    const escapedCityIcao = escapeTripStartText(city.icaoCode || city.icao || '');
    const homeBadge = isHome
      ? `<button type="button" class="city-home-toggle-btn active" data-city-name="${escapedCityName}" title="Currently set as Home. Click to unmark." style="background: #27AE60; color: white; border: none; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 3px;">🏠 Home ✓</button>`
      : `<button type="button" class="city-home-toggle-btn" data-city-name="${escapedCityName}" title="Set ${escapedCityName} as your Home base" style="background: #f1f5f9; color: #64748b; border: 1px dashed #cbd5e1; padding: 2px 7px; border-radius: 12px; font-size: 0.73rem; cursor: pointer; display: inline-flex; align-items: center; gap: 3px;" onmouseenter="this.style.background='#e2e8f0';this.style.color='#334155'" onmouseleave="this.style.background='#f1f5f9';this.style.color='#64748b'">🏠 Mark as Home</button>`;

    // Get city color from matching leg, or use city's stored color
    let cityColor = city.colour || '#2C3E50';
    if (!city.colour) {
      const matchingLeg = appData.find(leg => leg.days.some(day => day.to === city.name || day.from === city.name));
      if (matchingLeg) {
        cityColor = matchingLeg.colour || '#2C3E50';
      }
    }

    const hasCoords = cityHasStoredCoords(city);
    const cityLat = hasCoords ? Number.parseFloat(city.lat) : null;
    const cityLng = hasCoords ? Number.parseFloat(city.lng) : null;
    const mapsUrl = hasCoords
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${cityLat},${cityLng}`)}`
      : '';
    const coordinateDisplay = hasCoords
      ? `<a class="city-coordinates" href="${mapsUrl}" target="_blank" rel="noopener noreferrer" title="Open ${escapedCityName} coordinates in Google Maps">${cityLat.toFixed(4)}, ${cityLng.toFixed(4)}</a>`
      : '';
    const resetLocationBtn = hasCoords ? `
      <button class="city-reset-location-btn"
              type="button"
              data-city-id="${escapedCityId}"
              title="Clear this city's saved map location">
        Reset
      </button>
    ` : '';
    const searchBtn = !hasCoords ? `
      <button class="search-btn" data-search-btn="${escapedCityId}" data-city-id="${escapedCityId}"
              style="color: #3498DB; background: white; cursor: pointer;">
        🔍 Find on Map
      </button>
    ` : `<span class="city-location-status">📍 Mapped</span>`;

    let suggestionPill = '';
    if (!hasCoords || !city.countryCode) {
      const fuzzy = typeof findFuzzyCityCandidate === 'function' ? findFuzzyCityCandidate(city.name) : null;
      if (fuzzy && fuzzy.score >= 0.75 && fuzzy.candidate && fuzzy.candidate.name.toLowerCase() !== city.name.toLowerCase()) {
        const candFlag = getCountryFlag(fuzzy.candidate.countryCode);
        const escapedCandName = escapeTripStartText(fuzzy.candidate.name);
        suggestionPill = `
          <div class="city-candidate-suggestion" style="margin-top: 6px; font-size: 0.8rem; color: #176e67; background: #e8f5f1; border-radius: 4px; padding: 3px 8px; display: inline-flex; align-items: center; gap: 6px;">
            <span>Did you mean <strong>${escapeTripStartText(candFlag)} ${escapedCandName}</strong>?</span>
            <button type="button" class="apply-suggestion-btn" data-city-id="${escapedCityId}" data-canonical-name="${escapedCandName}" style="background: #176e67; color: white; border: none; border-radius: 3px; padding: 2px 8px; font-size: 0.75rem; font-weight: 600; cursor: pointer;">Apply</button>
          </div>
        `;
      }
    }

    const row = document.createElement('div');
    row.className = 'city-list-item';
    row.style.cssText = `display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border-bottom: 1px solid #eee; border-left: 4px solid ${cityColor}; background: white;`;
    row.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1;">
        <span style="font-size: 1.5rem;">${escapeTripStartText(flag)}</span>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 500; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <input class="city-rename-input" data-city-id="${escapedCityId}" value="${escapedCityName}" style="font: inherit; font-size: 1rem; font-weight: 700; border: 1px solid #c8d6d0; border-radius: 0.4rem; padding: 0.2rem 0.4rem; max-width: 170px;" title="Click to rename city">
            ${homeBadge}
            <div style="display: inline-flex; align-items: center; gap: 3px;">
              <span style="font-size: 0.72rem; font-weight: 700; color: #64748b;" title="IATA Airport Code (3 letters)">IATA:</span>
              <input class="city-iata-input" data-city-id="${escapedCityId}" value="${escapedCityCode}" placeholder="IATA" maxlength="3" style="font-family: monospace; font-size: 0.82rem; font-weight: 700; width: 48px; border: 1px solid #c8d6d0; border-radius: 0.3rem; padding: 0.15rem 0.3rem; text-transform: uppercase;" title="IATA airport code (3 letters, e.g. BNE)">
              <span style="font-size: 0.72rem; font-weight: 700; color: #64748b; margin-left: 2px;" title="ICAO Airport Code (4 letters)">ICAO:</span>
              <input class="city-icao-input" data-city-id="${escapedCityId}" value="${escapedCityIcao}" placeholder="ICAO" maxlength="4" style="font-family: monospace; font-size: 0.82rem; font-weight: 700; width: 56px; border: 1px solid #c8d6d0; border-radius: 0.3rem; padding: 0.15rem 0.3rem; text-transform: uppercase;" title="ICAO airport code (4 letters, e.g. YBBN)">
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-top: 6px;">
            <select class="country-select" data-city-id="${escapedCityId}"
              style="min-width: 140px;">
              <option value="">Select country...</option>
              ${COUNTRY_DATA.map(c => {
              const cityCode = (city.countryCode || '').toUpperCase();
              const isSelected = c.code === cityCode;
              return `<option value="${escapeTripStartText(c.code)}"${isSelected ? ' selected' : ''}>${escapeTripStartText(c.flag)} ${escapeTripStartText(c.name)}</option>`;
            }).join('')}
            </select>
            ${searchBtn}
            ${coordinateDisplay}
            ${resetLocationBtn}
          </div>
          ${suggestionPill}
        </div>
      </div>
      <button class="del-btn" data-city-id="${escapedCityId}" title="Delete City">×</button>
    `;
    container.appendChild(row);
  });

  // Attach change handlers to country selects, rename inputs, IATA inputs, and ICAO inputs
  container.querySelectorAll('.country-select').forEach(select => {
    select.addEventListener('change', function() {
      const cityId = this.dataset.cityId;
      const countryCode = this.value;
      updateCityCountryCode(cityId, countryCode);
    });
  });

  container.querySelectorAll('.city-rename-input').forEach(input => {
    input.addEventListener('change', function() {
      const cityId = this.dataset.cityId;
      const newName = this.value.trim();
      if (newName) {
        renameCityInDialog(cityId, newName);
      }
    });
  });

  container.querySelectorAll('.city-iata-input').forEach(input => {
    input.addEventListener('change', function() {
      const cityId = this.dataset.cityId;
      const val = this.value.trim().toUpperCase();
      const city = citiesData.find(c => c.id === cityId);
      if (city) {
        city.code = val;
        saveData(false);
        if (typeof rebuildItineraryAndDataMappings === 'function') {
          rebuildItineraryAndDataMappings({ showToast: false });
        }
      }
    });
  });

  container.querySelectorAll('.city-icao-input').forEach(input => {
    input.addEventListener('change', function() {
      const cityId = this.dataset.cityId;
      const val = this.value.trim().toUpperCase();
      const city = citiesData.find(c => c.id === cityId);
      if (city) {
        city.icaoCode = val;
        saveData(false);
        if (typeof rebuildItineraryAndDataMappings === 'function') {
          rebuildItineraryAndDataMappings({ showToast: false });
        }
      }
    });
  });

  container.querySelectorAll('.city-home-toggle-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const cityName = this.dataset.cityName;
      if (cityName) {
        setHomeCity(cityName);
      }
    });
  });

  container.querySelectorAll('.city-reset-location-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const cityId = this.dataset.cityId;
      if (cityId && typeof resetCityLocation === 'function') {
        resetCityLocation(cityId);
      }
    });
  });

  container.querySelectorAll('.search-btn[data-search-btn]').forEach(btn => {
    btn.addEventListener('click', function() {
      const cityId = this.dataset.cityId;
      if (cityId && typeof triggerOnlineSearch === 'function') {
        triggerOnlineSearch(cityId);
      }
    });
  });

  container.querySelectorAll('.apply-suggestion-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const cityId = this.dataset.cityId;
      const canonicalName = this.dataset.canonicalName;
      if (cityId && canonicalName && typeof applySuggestedCityCorrection === 'function') {
        applySuggestedCityCorrection(cityId, canonicalName);
      }
    });
  });

  container.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const cityId = this.dataset.cityId;
      if (cityId && typeof deleteCityFromDialog === 'function') {
        deleteCityFromDialog(cityId);
      }
    });
  });
}

async function resetCityLocation(cityId) {
  const city = citiesData.find(c => c.id === cityId);
  if (!city) return;

  delete city.lat;
  delete city.lng;
  await saveData(true);
  populateCityList();
  if (typeof buildJourneyMap === 'function') buildJourneyMap();
}

window.resetCityLocation = resetCityLocation;

function updateCityCountry(cityId, country) {
  if (setCityCountry(cityId, country)) {
    saveData(false);
    // Rebuild city nav to reflect changes
    if (typeof buildCityNav === 'function') {
      buildCityNav();
    }
  }
}

function deleteCityFromDialog(cityId) {
  const cityName = getCityNameById(cityId);
  if (!confirm(`Delete city "${cityName}"? Items associated with this city will lose their city assignment.`)) {
    return;
  }

  if (deleteCity(cityId)) {
    if (typeof rebuildItineraryAndDataMappings === 'function') {
      rebuildItineraryAndDataMappings({ showToast: true, message: `Deleted city "${cityName}" & rebuilt itinerary` });
    } else {
      saveData(false);
      populateCityList(); // Refresh dialog
      if (typeof buildCityNav === 'function') {
        buildCityNav();
      }
      if (typeof buildItinerary === 'function') {
        buildItinerary();
      }
      if (typeof buildJourneyMap === 'function') {
        buildJourneyMap();
      }
      if (typeof buildDesktopSplitMap === 'function') {
        buildDesktopSplitMap();
      }
    }
  }
}

function renameCityInDialog(cityId, newName) {
  const city = citiesData.find(c => c.id === cityId);
  if (!city || !newName) return;
  const oldName = city.name;
  if (oldName === newName) return;

  city.name = newName;

  const match = getCityLocationDatabaseMatch({ name: newName });
  if (match) {
    if (match.code) city.code = match.code;
    city.countryCode = match.countryCode;
    city.country = getCountryName(match.countryCode);
    if (!cityHasStoredCoords(city) && match.lat !== undefined && match.lng !== undefined) {
      city.lat = match.lat;
      city.lng = match.lng;
    }
    if (!city.icaoCode && (match.icaoCode || match.icao)) {
      city.icaoCode = match.icaoCode || match.icao;
    }
  }

  (appData || []).forEach(leg => {
    if (leg.cityId === cityId || leg.label === oldName) {
      leg.label = newName;
    }
    (leg.days || []).forEach(day => {
      if (day.from === oldName) day.from = newName;
      if (day.to === oldName) day.to = newName;
    });
  });

  (window.journeys || []).forEach(j => {
    if (j.fromCityId === cityId || j.fromLocation === oldName) {
      j.fromLocation = newName;
    }
    if (j.toCityId === cityId || j.toLocation === oldName) {
      j.toLocation = newName;
    }
    if (j.journeyName && j.journeyName.includes(oldName)) {
      j.journeyName = j.journeyName.replace(new RegExp(oldName, 'g'), newName);
    }
  });

  (window.stays || []).forEach(s => {
    if (s.cityId === cityId || s.cityName === oldName) {
      s.cityName = newName;
    }
  });

  if (typeof rebuildItineraryAndDataMappings === 'function') {
    rebuildItineraryAndDataMappings({ showToast: true, message: `Renamed city to "${newName}" & rebuilt itinerary` });
  } else {
    saveData(true);
    populateCityList();
    if (typeof buildNav === 'function') buildNav();
    if (typeof buildItinerary === 'function') buildItinerary();
    if (typeof buildTransportTab === 'function') buildTransportTab();
    if (typeof buildAccomTab === 'function') buildAccomTab();
    if (typeof buildJourneyMap === 'function') buildJourneyMap();
    if (typeof buildDesktopSplitMap === 'function') buildDesktopSplitMap();
    if (typeof showToast === 'function') showToast(`Renamed city to "${newName}"`);
  }
}

async function refetchCityLocationAndFlag(cityId) {
  const city = citiesData.find(c => c.id === cityId);
  if (!city) return;

  const cityName = city.name;
  const nameMatches = typeof ALL_CITIES_BY_NAME_MAP !== 'undefined' ? ALL_CITIES_BY_NAME_MAP.get(cityName.toLowerCase()) : null;
  const dbMatch = (nameMatches && nameMatches.length > 0 ? nameMatches[0] : null) || (typeof getCityLocationDatabaseMatch === 'function' ? getCityLocationDatabaseMatch(city) : null);

  if (dbMatch) {
    if (dbMatch.code && !city.code) city.code = dbMatch.code;
    if ((dbMatch.icaoCode || dbMatch.icao) && !city.icaoCode) city.icaoCode = dbMatch.icaoCode || dbMatch.icao;
    if (dbMatch.countryCode) {
      city.countryCode = dbMatch.countryCode.toUpperCase();
      city.country = getCountryName(dbMatch.countryCode);
    }
    if (dbMatch.lat !== undefined && dbMatch.lng !== undefined) {
      city.lat = dbMatch.lat;
      city.lng = dbMatch.lng;
    }
  } else if (typeof triggerOnlineSearch === 'function') {
    await triggerOnlineSearch(cityId);
    return;
  }

  if (city.countryCode && !city.country) {
    city.country = getCountryName(city.countryCode);
  }

  saveData(true);
  if (typeof populateCityList === 'function') populateCityList();
  if (typeof buildNav === 'function') buildNav();
  if (typeof buildItinerary === 'function') buildItinerary();
  if (typeof buildJourneyMap === 'function') buildJourneyMap();
  if (typeof showToast === 'function') showToast(`Refetched location & flag for ${cityName}`);
}

function auditCityHealth() {
  if (!Array.isArray(citiesData) || citiesData.length === 0) {
    return { missingCoords: 0, missingCountry: 0, totalIssues: 0 };
  }

  let missingCoords = 0;
  let missingCountry = 0;

  citiesData.forEach(city => {
    if (!cityHasStoredCoords(city)) missingCoords++;
    if (!city.countryCode || !city.country) missingCountry++;
  });

  return { missingCoords, missingCountry, totalIssues: missingCoords + missingCountry };
}

function checkAndPromptCityAudit(isSilent = false) {
  const health = auditCityHealth();
  if (health.totalIssues > 0 && !isSilent) {
    const existing = document.querySelector('.toast-city-audit');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-city-audit';
    toast.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 3000; background: #2C3E50; color: white; padding: 0.75rem 1.25rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); display: flex; align-items: center; gap: 1rem; font-size: 0.9rem; border-left: 4px solid #E67E22;';
    toast.innerHTML = `
      <span>⚠️ <strong>${health.totalIssues} ${health.totalIssues === 1 ? 'city needs' : 'cities need'} location or flag updates</strong></span>
      <button style="background: #E67E22; color: white; border: none; padding: 0.35rem 0.75rem; border-radius: 4px; font-weight: 600; cursor: pointer;" onclick="this.parentElement.remove(); openCityDialog();">
        Review & Repair
      </button>
      <button style="background: transparent; color: #BDC3C7; border: none; font-size: 1.1rem; cursor: pointer; padding: 0 0.25rem;" onclick="this.parentElement.remove();">×</button>
    `;
    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 12000);
  }
  return health;
}

async function repairAllCityMetadata() {
  if (!Array.isArray(citiesData) || citiesData.length === 0) return;

  let repairedCount = 0;
  for (const city of citiesData) {
    let modified = false;

    if (city.code && String(city.code).trim().length === 2 && !city.countryCode) {
      city.countryCode = String(city.code).trim().toUpperCase();
      delete city.code;
      modified = true;
    }

    const nameMatches = city && city.name ? ALL_CITIES_BY_NAME_MAP.get(city.name.toLowerCase()) : null;
    const match = (nameMatches && nameMatches.length > 0 ? nameMatches[0] : null) ||
                  (typeof getCityLocationDatabaseMatch === 'function' ? getCityLocationDatabaseMatch(city) : null);
    if (match) {
      if (!city.code && match.code) { city.code = match.code; modified = true; }
      if (!city.icaoCode && (match.icaoCode || match.icao)) { city.icaoCode = match.icaoCode || match.icao; modified = true; }
      if (!city.countryCode && match.countryCode) { city.countryCode = match.countryCode.toUpperCase(); modified = true; }
      if (!city.country && (match.countryCode || city.countryCode)) { city.country = getCountryName(match.countryCode || city.countryCode); modified = true; }
      if (!cityHasStoredCoords(city) && match.lat !== undefined && match.lng !== undefined) {
        city.lat = match.lat;
        city.lng = match.lng;
        modified = true;
      }
    } else if (city.countryCode && !city.country) {
      city.country = getCountryName(city.countryCode);
      modified = true;
    }

    if (!cityHasStoredCoords(city) && typeof triggerOnlineSearch === 'function') {
      try {
        await triggerOnlineSearch(city.id);
        modified = true;
      } catch (e) {
        console.warn(`[City Audit] Could not geocode city "${city.name}":`, e);
      }
    }

    if (modified) repairedCount++;
  }

  // Check for any unresolved cities (missing coordinates or missing country)
  const unresolved = [];
  for (const city of citiesData) {
    if (!cityHasStoredCoords(city) || !city.countryCode) {
      unresolved.push(city.name || 'Unnamed');
    }
  }

  saveData(true);
  populateCityList();
  if (typeof buildNav === 'function') buildNav();
  if (typeof buildItinerary === 'function') buildItinerary();
  if (typeof buildJourneyMap === 'function') buildJourneyMap();

  if (unresolved.length > 0) {
    const unresolvedNames = unresolved.slice(0, 4).join(', ') + (unresolved.length > 4 ? ` and ${unresolved.length - 4} more` : '');
    showToast(`⚠️ Checked ${citiesData.length} destinations. ${unresolved.length} ${unresolved.length === 1 ? 'city needs' : 'cities need'} manual details: ${unresolvedNames}`, 7000);
  } else {
    showToast(`✨ Successfully checked & updated flags and coordinates for all cities!`);
  }
}

async function addNewCityFromDialog() {
  const nameInput = document.getElementById('newCityName');
  const countrySelect = document.getElementById('newCityCountrySelect');
  const countryInput = document.getElementById('newCityCountry');
  const codeInfo = document.getElementById('cityCodeInfo');
  const customCountryDiv = document.getElementById('customCountryDiv');
  const customCountryName = document.getElementById('customCountryName');
  const customCountryCode = document.getElementById('customCountryCode');

  const name = nameInput?.value?.trim();
  let countryCode = countrySelect?.value;
  let countryName = '';

  // Handle custom country entry when "Other" is selected
  if (countryCode === 'ZZ' && customCountryDiv?.style.display === 'block') {
    const enteredCountryName = customCountryName?.value?.trim();
    const enteredCountryCode = customCountryCode?.value?.trim().toUpperCase();

    if (!enteredCountryName) {
      alert('Please enter a country name.');
      return;
    }

    // If no code entered, generate a simple code from the name
    let codeFromName = enteredCountryName.toUpperCase().slice(0, 2);
    if (!enteredCountryCode) {
      countryCode = codeFromName;
    } else {
      countryCode = enteredCountryCode;
    }
    countryName = enteredCountryName;

    // Add the custom country to user countries
    addUserCountry(enteredCountryCode || codeFromName, enteredCountryName);
  } else if (!countryCode && countryInput?.value?.trim()) {
    const typedCountry = countryInput.value.trim();
    const match = COUNTRY_DATA.find(c =>
      c.name.toLowerCase() === typedCountry.toLowerCase()
    );
    if (match) {
      countryCode = match.code;
      countryName = match.name;
    } else {
      // Country not found - automatically create it!
      countryName = typedCountry;
      // Generate a 2-letter code from the country name
      const generatedCode = typedCountry.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
      countryCode = generatedCode || 'XX';
      // Add the new country to user countries
      addUserCountry(countryCode, countryName);
    }
  } else if (countryCode) {
    const match = COUNTRY_DATA.find(c => c.code === countryCode);
    countryName = match ? match.name : '';
  }

  if (!name) {
    alert('Please enter a city name.');
    return;
  }

  // Check if city already exists
  const existing = citiesData.find(c => c.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    alert(`City "${name}" already exists.`);
    return;
  }

  // Check staged coordinates from live autocomplete
  const staged = (typeof window !== 'undefined' && window.__stagedCityCoords &&
                 (window.__stagedCityCoords.name.toLowerCase() === name.toLowerCase() ||
                  window.__stagedCityCoords.name.toLowerCase().includes(name.toLowerCase()) ||
                  name.toLowerCase().includes(window.__stagedCityCoords.name.toLowerCase())))
                 ? window.__stagedCityCoords : null;

  let initialLat = staged ? staged.lat : null;
  let initialLng = staged ? staged.lng : null;
  if (staged && staged.countryCode && !countryCode) {
    countryCode = staged.countryCode;
    countryName = staged.countryName || (countryCode ? getCountryName(countryCode) : '');
  }

  // If still no coords, check dynamic cache
  if ((initialLat === null || initialLng === null) && typeof window !== 'undefined' && window.__dynamicCityCoordsCache) {
    const cached = window.__dynamicCityCoordsCache.get(name.toLowerCase());
    if (cached && cached.lat !== undefined && cached.lng !== undefined) {
      initialLat = cached.lat;
      initialLng = cached.lng;
    }
  }

  const nameMatches = ALL_CITIES_BY_NAME_MAP.get(name.toLowerCase());
  const dbMatch = (nameMatches && nameMatches[0]) ||
                  (typeof getCityLocationDatabaseMatch === 'function' ? getCityLocationDatabaseMatch({ name }) : null);
  if (dbMatch) {
    // Verify country matches
    if (!countryCode && dbMatch.countryCode) {
      countryCode = dbMatch.countryCode;
      const countryMatch = COUNTRY_DATA.find(c => c.code === countryCode);
      countryName = countryMatch ? countryMatch.name : (getCountryName(countryCode) || '');
    }
    if ((initialLat === null || initialLng === null) && dbMatch.lat !== undefined && dbMatch.lng !== undefined) {
      initialLat = dbMatch.lat;
      initialLng = dbMatch.lng;
    }
  }

  const newCity = addOrUpdateCity({ cityName: name, country: countryName, countryCode, lat: initialLat, lng: initialLng });
  if (newCity) {
    if (typeof refreshJourneyCityDropdowns === 'function') {
      refreshJourneyCityDropdowns(newCity.name);
    }

    if (!cityHasStoredCoords(newCity)) {
      const addBtn = document.getElementById('addNewCityBtn') || document.querySelector('.city-add-stack button.action-btn');
      const origBtnText = addBtn ? addBtn.textContent : '';
      if (addBtn) {
        addBtn.disabled = true;
        addBtn.textContent = 'Locating on map...';
      }
      try {
        const location = await resolveCityLocation(newCity);
        if (location) applyCityLocation(newCity, location);
      } finally {
        if (addBtn) {
          addBtn.disabled = false;
          addBtn.textContent = origBtnText;
        }
      }
    }

    // Persist as user city so it is recognized across the entire app
    addUserCity(newCity.id, newCity.name, newCity.countryCode, newCity.lat, newCity.lng);

    if (cityHasStoredCoords(newCity) && typeof window !== 'undefined') {
      window.__dynamicCityCoordsCache = window.__dynamicCityCoordsCache || new Map();
      window.__dynamicCityCoordsCache.set(newCity.name.toLowerCase(), { lat: Number(newCity.lat), lng: Number(newCity.lng) });
    }

    if (typeof window !== 'undefined') {
      window.__stagedCityCoords = null;
    }

    saveData(false);
    nameInput.value = '';
    if (countryInput) countryInput.value = '';
    if (countrySelect) countrySelect.value = '';
    if (codeInfo && codeInfo.parentElement && codeInfo.parentElement.style) codeInfo.parentElement.style.display = 'none';
    const liveResults = document.getElementById('cityLiveSearchResults');
    if (liveResults) { liveResults.style.display = 'none'; liveResults.innerHTML = ''; }
    populateCityList();
    if (typeof buildCityNav === 'function') {
      buildCityNav();
    }
    if (typeof buildItinerary === 'function') {
      buildItinerary();
    }
    if (typeof buildJourneyMap === 'function') {
      buildJourneyMap();
    }
    if (typeof buildDesktopSplitMap === 'function') {
      buildDesktopSplitMap();
    }
    if (typeof showToast === 'function') {
      const flag = newCity.countryCode ? getCountryFlag(newCity.countryCode) : '📍';
      showToast(`Added ${newCity.name} ${flag} to trip destinations`);
    }
  }
}

// Automatically resolves coordinates and country flags in the background for any trip cities missing location or countryCode data
async function autoResolveMissingTripCities() {
  if (typeof citiesData === 'undefined' || !Array.isArray(citiesData) || citiesData.length === 0) return;
  const unmapped = citiesData.filter(c => !cityHasStoredCoords(c) || !c.countryCode);
  if (unmapped.length === 0) return;

  if (typeof window !== 'undefined') {
    window.__dynamicCityCoordsCache = window.__dynamicCityCoordsCache || new Map();
  }

  let resolvedCount = 0;
  for (const city of unmapped) {
    if (cityHasStoredCoords(city) && city.countryCode) continue;

    // 1. Check dynamic cache
    const cached = window.__dynamicCityCoordsCache?.get(city.name.toLowerCase());
    if (cached && cityHasStoredCoords(cached) && (city.countryCode || cached.countryCode)) {
      if (!cityHasStoredCoords(city)) {
        city.lat = Number(cached.lat);
        city.lng = Number(cached.lng);
      }
      if (!city.countryCode && cached.countryCode) city.countryCode = cached.countryCode;
      if (!city.country && city.countryCode) city.country = getCountryName(city.countryCode);
      resolvedCount++;
      continue;
    }

    // 2. Check local database
    const local = resolveCityLocationLocal(city);
    if (local && cityHasStoredCoords(local)) {
      if (!cityHasStoredCoords(city)) {
        city.lat = Number(local.lat);
        city.lng = Number(local.lng);
      }
      if (!city.countryCode && local.countryCode) city.countryCode = local.countryCode;
      if (!city.country && city.countryCode) city.country = getCountryName(city.countryCode);
      window.__dynamicCityCoordsCache?.set(city.name.toLowerCase(), { lat: city.lat, lng: city.lng, countryCode: city.countryCode || '' });
      resolvedCount++;
      continue;
    }

    // 3. Live online search
    try {
      const searchFn = (typeof window !== 'undefined' && typeof window.searchCityOnline === 'function') ? window.searchCityOnline : searchCityOnline;
      const online = await searchFn(city.name, city.countryCode || '', city.country || '');
      if (online && cityHasStoredCoords(online)) {
        if (!cityHasStoredCoords(city)) {
          city.lat = Number(online.lat);
          city.lng = Number(online.lng);
        }
        if (!city.countryCode && online.countryCode) city.countryCode = online.countryCode;
        if (!city.country && city.countryCode) {
          const mappedName = getCountryName(city.countryCode);
          city.country = (mappedName && mappedName !== city.countryCode) ? mappedName : (online.countryName || mappedName);
        }
        window.__dynamicCityCoordsCache?.set(city.name.toLowerCase(), { lat: city.lat, lng: city.lng, countryCode: city.countryCode || '' });
        addUserCity(city.id, city.name, city.countryCode, city.lat, city.lng);
        resolvedCount++;
      }
    } catch (e) {
      console.warn(`[Auto-resolve] Could not resolve ${city.name}:`, e);
    }
  }

  if (resolvedCount > 0) {
    try {
      if (typeof saveData === 'function') saveData(false);
      if (typeof buildCityNav === 'function') buildCityNav();
      if (typeof buildItinerary === 'function') buildItinerary();
      if (typeof buildJourneyMap === 'function') buildJourneyMap();
      if (typeof buildDesktopSplitMap === 'function') buildDesktopSplitMap();
      const modal = document.getElementById('city-modal');
      if (modal && modal.style.display !== 'none' && typeof populateCityList === 'function') {
        populateCityList();
      }
    } catch (err) {
      console.warn('[Auto-resolve] Error updating map after resolution:', err);
    }
  }
}
window.autoResolveMissingTripCities = autoResolveMissingTripCities;

// Update city country code from dropdown
function updateCityCountryCode(cityId, countryCode) {
  const city = citiesData.find(c => c.id === cityId);
  if (!city) return;

  city.countryCode = countryCode;
  const countryMatch = COUNTRY_DATA.find(c => c.code === countryCode);
  if (countryMatch) {
    city.country = countryMatch.name;
  }

  resolveCityLocation(city).then(result => {
    if (result) {
      applyCityLocation(city, result);
    }
    saveData(false);
    populateCityList();
    if (typeof buildCityNav === 'function') buildCityNav();
    if (typeof buildItinerary === 'function') buildItinerary();
    if (typeof buildJourneyMap === 'function') buildJourneyMap();
    if (typeof buildDesktopSplitMap === 'function') buildDesktopSplitMap();
  });
}

// Populate country dropdown in the add city form
function populateCountrySelect() {
  const select = document.getElementById('newCityCountrySelect');
  if (!select) return;

  select.innerHTML = '<option value="">Select country...</option>' +
    getAllCountries()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(c => `<option value="${c.code}">${c.flag} ${c.name}</option>`)
      .join('') +
    '<option value="ZZ">🌐 Other (enter custom)</option>';

  // Set up the change handler for custom country input
  setupCountrySelectHandler();
}

// Migration: Convert old city format to new ISO/ICAO standard format
// Old: { id, name, country, dateFrom, dateTo }
// New: { id, name, countryCode, country, dateFrom, dateTo, colour }
function migrateCitiesToISOFormat() {
  if (!citiesData || !Array.isArray(citiesData)) return;

  const citiesNeedingMigration = citiesData.filter(city => !city.countryCode || (city.code && String(city.code).trim().length === 2));
  if (citiesNeedingMigration.length === 0) return;

  console.log(`[Migration] Converting ${citiesNeedingMigration.length} cities to ISO format...`);

  const usedColorsSet = new Set(citiesData.map(c => c.colour).filter(Boolean));

  const countryByCodeMap = new Map();
  const countryByNameMap = new Map();
  COUNTRY_DATA.forEach(c => {
    if (c.code) {
      const codeKey = c.code.toUpperCase();
      if (!countryByCodeMap.has(codeKey)) countryByCodeMap.set(codeKey, c);
    }
    if (c.name) {
      const nameKey = c.name.toLowerCase();
      if (!countryByNameMap.has(nameKey)) countryByNameMap.set(nameKey, c);
    }
  });

  citiesNeedingMigration.forEach(city => {
    const normalizedName = city.name?.trim();
    if (!normalizedName) return;

    if (city.code && String(city.code).trim().length === 2) {
      if (!city.countryCode) city.countryCode = String(city.code).trim().toUpperCase();
      delete city.code;
    }

    // Look up city in ALL city databases (built-in + extended)
    const nameMatches = ALL_CITIES_BY_NAME_MAP.get(normalizedName.toLowerCase());
    const dbMatch = nameMatches ? nameMatches[0] : null;

    if (dbMatch) {
      if (!city.code && dbMatch.code) city.code = dbMatch.code;
      if (!city.icaoCode && (dbMatch.icaoCode || dbMatch.icao)) city.icaoCode = dbMatch.icaoCode || dbMatch.icao;
      city.countryCode = dbMatch.countryCode;
      const countryMatch = dbMatch.countryCode ? countryByCodeMap.get(dbMatch.countryCode.toUpperCase()) : null;
      if (countryMatch) {
        city.country = countryMatch.name;
      }
    } else {
      // For cities not in database, try to infer country from city name or existing country field
      const cityNameLower = normalizedName.toLowerCase().replace(/\s+/g, '');
      const inferredCode = CITY_TO_CODE[cityNameLower];

      if (inferredCode) {
        const countryMatch = countryByCodeMap.get(inferredCode.toUpperCase());
        if (countryMatch) {
          city.countryCode = countryMatch.code;
          city.country = countryMatch.name;
        }
      }

      // If we have a country string but no code, try to match it
      if (!city.countryCode && city.country) {
        const countryMatch = countryByNameMap.get(city.country.toLowerCase());
        if (countryMatch) {
          city.countryCode = countryMatch.code;
        }
      }
    }

    // Assign a color if missing
    if (!city.colour) {
      city.colour = getRandomCityColor(usedColorsSet);
    }

    console.log(`[Migration] City "${city.name}" → country: ${city.country || 'none'} (${city.countryCode || 'none'})`);
  });

  // Update any cities that have custom codes in userCities
  if (userCities.length > 0) {
    const citiesDataMap = new Map();
    citiesData.forEach(c => {
      if (c.name) {
        const key = c.name.toLowerCase();
        if (!citiesDataMap.has(key)) citiesDataMap.set(key, c);
      }
    });

    userCities.forEach(userCity => {
      if (!userCity.name) return;
      const existingCity = citiesDataMap.get(userCity.name.toLowerCase());
      if (existingCity) {
        if ('code' in existingCity) delete existingCity.code;
        existingCity.countryCode = userCity.countryCode;
      }
    });
  }

  console.log('[Migration] City ISO format migration complete');
}

// Migrate leg-level entities to include cityId
// Migrate Departure and Return legs to City (Trip Start) and City (Trip Finish)
function migrateDepartureReturnLegs() {
  if (typeof appData === 'undefined' || !Array.isArray(appData)) return;

  const jArr = (typeof window !== 'undefined' && window.journeys && Array.isArray(window.journeys))
    ? window.journeys : [];

  // --- Trip Start leg ---
  // Find by original id OR by previously-migrated id/label
  let depLeg = appData.find(l => l.id === 'departure');
  if (!depLeg) depLeg = appData.find(l => String(l.label || '').includes('(Trip Start)'));
  if (!depLeg) depLeg = appData.find(l => String(l.id || '').endsWith('-start'));

  if (depLeg) {
    const oldId = depLeg.id;
    let fromCity = 'Departure';

    // Look at ALL journeys whose legId matches the old id OR 'departure'
    const candidateIds = new Set(['departure', oldId]);
    const outbound = jArr.filter(j =>
      candidateIds.has(j.legId) || candidateIds.has(j._inferredFromLegId)
    );
    if (outbound.length > 0) {
      outbound.sort((a, b) => {
        const orderA = Number(a.segmentOrder) || 1;
        const orderB = Number(b.segmentOrder) || 1;
        if (orderA !== orderB) return orderA - orderB;

        const dateA = a.departureDate || a.dayDate || '';
        const dateB = b.departureDate || b.dayDate || '';
        if (dateA !== dateB) return dateA.localeCompare(dateB);

        const timeA = a.departureTime || '';
        const timeB = b.departureTime || '';
        return timeA.localeCompare(timeB);
      });
      if (outbound[0].fromLocation) fromCity = outbound[0].fromLocation;
    }

    const cleanCity = (typeof cleanCityNavLabel === 'function'
      ? cleanCityNavLabel(fromCity)
      : fromCity.replace(/[^\x00-\x7F]/g, '').trim()) || 'Departure';
    const newId = 'city-' + cleanCity.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-start';
    depLeg.id = newId;
    depLeg.label = `${cleanCity} (Trip Start)`;

    // Update all journey references from old id → new id
    jArr.forEach(j => {
      if (j.legId === oldId || j.legId === 'departure') j.legId = newId;
      if (j._inferredFromLegId === oldId || j._inferredFromLegId === 'departure') j._inferredFromLegId = newId;
      if (j._inferredToLegId === oldId || j._inferredToLegId === 'departure') j._inferredToLegId = newId;
    });
  }

  // --- Trip Finish leg ---
  let retLeg = appData.find(l => l.id === 'return');
  if (!retLeg) retLeg = appData.find(l => String(l.label || '').includes('(Trip Finish)'));
  if (!retLeg) retLeg = appData.find(l => String(l.id || '').endsWith('-finish'));

  if (retLeg) {
    const oldId = retLeg.id;
    let toCity = 'Return';

    const candidateIds = new Set(['return', oldId]);
    const returns = jArr.filter(j =>
      candidateIds.has(j.legId) || candidateIds.has(j._inferredToLegId)
    );
    if (returns.length > 0) {
      returns.sort((a, b) => {
        const orderA = Number(a.segmentOrder) || 1;
        const orderB = Number(b.segmentOrder) || 1;
        if (orderA !== orderB) return orderA - orderB;

        const dateA = a.departureDate || a.dayDate || '';
        const dateB = b.departureDate || b.dayDate || '';
        if (dateA !== dateB) return dateA.localeCompare(dateB);

        const timeA = a.departureTime || '';
        const timeB = b.departureTime || '';
        return timeA.localeCompare(timeB);
      });
      const lastJ = returns[returns.length - 1];
      if (lastJ.toLocation) toCity = lastJ.toLocation;
    }

    const cleanCity = (typeof cleanCityNavLabel === 'function'
      ? cleanCityNavLabel(toCity)
      : toCity.replace(/[^\x00-\x7F]/g, '').trim()) || 'Return';
    const newId = 'city-' + cleanCity.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-finish';
    retLeg.id = newId;
    retLeg.label = `${cleanCity} (Trip Finish)`;

    jArr.forEach(j => {
      if (j.legId === oldId || j.legId === 'return') j.legId = newId;
      if (j._inferredFromLegId === oldId || j._inferredFromLegId === 'return') j._inferredFromLegId = newId;
      if (j._inferredToLegId === oldId || j._inferredToLegId === 'return') j._inferredToLegId = newId;
    });
  }
}

function migrateLegCityIds() {
  appData.forEach(leg => {
    if (!leg || !Array.isArray(leg.days)) return;
    // Determine the primary city for this leg from the days
    let primaryCityId = '';
    const cityNames = new Set();
    leg.days.forEach(day => {
      if (day.to && !['Home', 'In transit', 'Between cities', 'TBC', ''].includes(day.to)) {
        cityNames.add(day.to);
      }
      if (day.from && !['Home', 'In transit', 'Between cities', 'TBC', ''].includes(day.from)) {
        cityNames.add(day.from);
      }
    });
    // Use the first city name found
    if (cityNames.size > 0) {
      primaryCityId = getCityIdByName(Array.from(cityNames)[0]);
    }

    // Migrate legTips - add cityId if not present
    if (leg.legTips) {
      leg.legTips = leg.legTips.map(tip => {
        if (typeof tip === 'string') {
          return { text: tip, cityId: primaryCityId };
        }
        if (!tip.cityId) tip.cityId = primaryCityId;
        return tip;
      });
    }

    // Migrate cityFood - add cityId if not present
    if (leg.cityFood) {
      leg.cityFood = leg.cityFood.map(item => {
        if (!item.cityId) item.cityId = primaryCityId;
        return item;
      });
    }

    // Migrate suggestedActivities - add cityId if not present
    if (leg.suggestedActivities) {
      leg.suggestedActivities = leg.suggestedActivities.map(act => {
        if (!act.cityId) act.cityId = primaryCityId;
        return act;
      });
    }

    // Migrate day-level items (accomItems, activityItems)
    if (leg.days) {
      leg.days.forEach(day => {
        const dayCityId = getCityIdByName(day.to) || primaryCityId;

        if (day.accomItems) {
          day.accomItems.forEach(item => {
            if (!item.cityId) item.cityId = dayCityId;
          });
        }

        if (day.activityItems) {
          day.activityItems.forEach(item => {
            if (!item.cityId) item.cityId = dayCityId;
          });
        }
      });
    }
  });
}

function _initLoadJourneysAndStays() {
  // Load journeys first, before any rendering happens
  const savedJourneys = localStorage.getItem('travelApp_journeys_v1');
  if (savedJourneys) {
    try {
      const parsed = JSON.parse(savedJourneys);
      if (Array.isArray(parsed)) {
        journeys = normalizeTripJourneysData(parsed);
        window.journeys = journeys; // sync to window for other modules
        console.log(`[Journeys] Loaded ${journeys.length} journeys from localStorage`);
      }
    } catch (e) {
      console.error('[Journeys] Failed to parse:', e);
      journeys = JSON.parse(JSON.stringify(DEFAULT_TRIP_DATA.journeys));
      window.journeys = journeys;
    }
  } else {
    journeys = JSON.parse(JSON.stringify(DEFAULT_TRIP_DATA.journeys));
    window.journeys = journeys;
  }

  const savedStays = localStorage.getItem('travelApp_stays_v1');
  if (savedStays) {
    try {
      const parsed = JSON.parse(savedStays);
      if (Array.isArray(parsed)) {
        stays = normalizeTripStaysData(parsed);
        window.stays = stays;
      }
    } catch (e) {
      stays = JSON.parse(JSON.stringify(DEFAULT_TRIP_DATA.stays));
      window.stays = stays;
    }
  } else {
    stays = JSON.parse(JSON.stringify(DEFAULT_TRIP_DATA.stays));
    window.stays = stays;
  }
}

function _initLoadItineraryData() {
  const saved = localStorage.getItem('travelApp_v2026_template');
  if (saved) {
    try {
      appData = normalizeTripLegsData(JSON.parse(saved));
      appData.forEach(leg => {
        if (!leg.legTips) {
          leg.legTips = [];
          leg.days.forEach(day => {
            if (day.tips && day.tips.length > 0) leg.legTips.push(...day.tips);
            delete day.tips;
          });
        }
        // Migrate legacy cityRun and suggestedSights to unified suggestedActivities
        if (!leg.suggestedActivities) {
          leg.suggestedActivities = [];
          // Migrate cityRun items to fitness category
          if (leg.cityRun && leg.cityRun.length > 0) {
            if (typeof leg.cityRun[0] === 'string') {
              leg.cityRun.forEach(r => {
                leg.suggestedActivities.push({
                  title: r,
                  category: 'fitness',
                  estTime: '1 hr',
                  estCost: '0',
                  assignedDayIdx: null
                });
              });
            } else {
              leg.cityRun.forEach(r => {
                leg.suggestedActivities.push({
                  title: r.title,
                  category: 'fitness',
                  estTime: r.estTime || '1 hr',
                  estCost: r.estCost || '0',
                  assignedDayIdx: r.assignedDayIdx !== undefined ? r.assignedDayIdx : null
                });
              });
            }
          }
          // Migrate suggestedSights items to sight category
          if (leg.suggestedSights && leg.suggestedSights.length > 0) {
            leg.suggestedSights.forEach(s => {
              leg.suggestedActivities.push({
                title: s.title,
                category: 'sight',
                estTime: s.estTime || '1 hr',
                estCost: s.estCost || '0',
                assignedDayIdx: s.assignedDayIdx !== undefined ? s.assignedDayIdx : null
              });
            });
          }
          // Clean up legacy properties
          delete leg.cityRun;
          delete leg.suggestedSights;
        }
        leg.days.forEach(day => {
          if (day.activityItems) {
            day.activityItems.forEach(act => {
              if (act.time === undefined) act.time = "1 hr";
            });
          }
        });
      });
    } catch (e) {
      console.error('[Itinerary] Failed to parse itinerary template:', e);
      appData = JSON.parse(JSON.stringify(DEFAULT_TRIP_DATA.itinerary));
    }
  } else {
    appData = JSON.parse(JSON.stringify(DEFAULT_TRIP_DATA.itinerary));
  }

  appData = normalizeTripLegsData(appData);
}

function _initLoadChecklistsAndCities() {
  const savedPacking = localStorage.getItem('travelApp_packing_v3');
  if (savedPacking) {
    try {
      packingData = ensureDefaultPackingAreas(JSON.parse(savedPacking));
    } catch (e) {
      console.error('[Packing] Failed to parse packing template:', e);
      packingData = typeof DEFAULT_PACKING !== 'undefined' ? JSON.parse(JSON.stringify(DEFAULT_PACKING)) : [];
    }
  } else {
    packingData = typeof DEFAULT_PACKING !== 'undefined' ? JSON.parse(JSON.stringify(DEFAULT_PACKING)) : [];
  }

  const savedLeaveHome = localStorage.getItem('travelApp_leavehome_v3');
  if (savedLeaveHome) {
    try {
      const parsedLeaveHome = JSON.parse(savedLeaveHome);
      leaveHomeData = mergeChecklistWithDefaults(parsedLeaveHome);
    } catch (e) {
      console.error('[LeaveHome] Failed to parse saved checklist:', e);
      leaveHomeData = JSON.parse(JSON.stringify(DEFAULT_LEAVE_HOME));
      hotelCheckoutData = JSON.parse(JSON.stringify(DEFAULT_HOTEL_CHECKOUT));
    }
  } else {
    leaveHomeData = JSON.parse(JSON.stringify(DEFAULT_LEAVE_HOME));
  }

  const savedCities = localStorage.getItem('travelApp_cities_v1');
  if (savedCities) {
    try {
      citiesData = JSON.parse(savedCities);
      normalizeTripCitiesDateData(citiesData);
      // Migrate existing cities to include code if missing
      citiesData.forEach(city => {
        if (!city.code) {
          const nameMatches = ALL_CITIES_BY_NAME_MAP.get(city.name.toLowerCase());
          const match = nameMatches ? nameMatches[0] : null;
          city.code = match ? match.code : '';
        }
        if (!city.countryCode && city.country) {
          const countryMatch = COUNTRY_DATA.find(c =>
            c.name.toLowerCase() === city.country.toLowerCase()
          );
          city.countryCode = countryMatch ? countryMatch.code : '';
        }
      });
    } catch (e) {
      console.error('[Cities] Failed to parse saved cities:', e);
      citiesData = typeof DEFAULT_CITIES !== 'undefined' ? JSON.parse(JSON.stringify(DEFAULT_CITIES)) : [];
    }
  }

  // Load user-extensible city database
  const savedUserCities = localStorage.getItem('travelApp_userCities_v1');
  if (savedUserCities) {
    try {
      userCities = JSON.parse(savedUserCities);
    } catch (e) {
      console.error('[Cities] Failed to parse user cities:', e);
      userCities = [];
    }
  }

  // Create datalists for city and country selection
  createCityDatalists();
}

function _initLoadMetaAndUI() {
  const savedMeta = localStorage.getItem('travelApp_meta_template');
  if (savedMeta) {
    try {
      const parsed = JSON.parse(savedMeta);
      if (parsed.title && parsed.title.trim()) titleData.title = parsed.title;
      if (parsed.subtitle && parsed.subtitle.trim()) titleData.subtitle = parsed.subtitle;
    } catch (e) {
      console.error('Meta load error:', e);
    }
  }

  const savedFile = localStorage.getItem('travelApp_filename_v2026');
  if (savedFile) { currentFileName = savedFile; }
  seedDefaultDerivedTravelData();

  const mainTitleEl = document.getElementById('mainTitle');
  if (mainTitleEl) mainTitleEl.innerText = titleData.title;
  const mainSubEl = document.getElementById('mainSubtitle');
  if (mainSubEl) mainSubEl.innerText = titleData.subtitle;

  syncActiveFileDisplay();
  configureFileActionButtons();
  restorePersistedActiveFileHandle();

  // Display last export/import timestamp
  displayTimestampStatus();
}

function _initRunDataMigrations() {
  // Auto-extract cities if none exist
  if (!citiesData || citiesData.length === 0) {
    citiesData = extractCitiesFromItinerary();
    console.log(`[Cities] Auto-extracted ${citiesData.length} cities from itinerary`);
  }

  // Migrate cities to ISO format (8b-v)
  migrateCitiesToISOFormat();

  // Migrate journeys to link city IDs (if migration function exists)
  if (typeof migrateJourneyCityIds === 'function') {
    migrateJourneyCityIds();
  }

  if (typeof migrateDepartureReturnLegs === 'function') {
    migrateDepartureReturnLegs();
  }

  // Migrate leg-level entities with city IDs
  migrateLegCityIds();

  if (typeof initializeItineraryPositionForToday === 'function') {
    initializeItineraryPositionForToday();
  }
}

async function initData() {
  const previousSuppress = window.__suppressBackupTracking;
  window.__suppressBackupTracking = true;
  historyTrackingSuspended = true;

  _initLoadJourneysAndStays();
  _initLoadItineraryData();
  _initLoadChecklistsAndCities();
  _initLoadMetaAndUI();
  _initRunDataMigrations();

  try {
    await saveData(false);
  } finally {
    window.__suppressBackupTracking = previousSuppress;
    historyTrackingSuspended = false;
  }
  resetHistoryState(cloneHistorySnapshot());

  const activeTab = document.querySelector('.app-tab-btn.active');
  const activeTabId = activeTab?.getAttribute('data-tab') || 'itinerary';
  if (typeof applyCurrentTripPositionForTab === 'function') {
    applyCurrentTripPositionForTab(activeTabId);
  }

  // Journeys loaded at start of initData(), no additional init needed
}

function displayTimestampStatus() {
  const lastExport = localStorage.getItem('travelApp_last_export_v2026');
  const lastImport = localStorage.getItem('travelApp_last_import_v2026');
  const timestampEl = document.getElementById('timestampStatus');

  if (!timestampEl) return;

  let message = '';

  if (lastExport || lastImport) {
    let latest = lastExport || lastImport;
    let label = lastExport && lastImport
      ? (new Date(lastExport) > new Date(lastImport) ? 'Exported' : 'Imported')
      : (lastExport ? 'Exported' : 'Imported');

    const date = new Date(latest);
    const formatted = date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
    const time = date.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });

    message = `${label}: ${formatted} ${time}`;
  }

  timestampEl.textContent = message;
}

async function runSaveData(showTick = true) {
    const t = document.getElementById('mainTitle');
    const s = document.getElementById('mainSubtitle');
    if (t && (t.innerText || t.textContent || t.value) && String(t.innerText || t.textContent || t.value).trim()) {
      titleData.title = String(t.innerText || t.textContent || t.value).trim();
    }
    if (s && (s.innerText || s.textContent || s.value) && String(s.innerText || s.textContent || s.value).trim()) {
      titleData.subtitle = String(s.innerText || s.textContent || s.value).trim();
    }

    normalizeTripLegsData(appData);
    normalizeTripJourneysData(journeys);
    normalizeTripStaysData(stays);

    captureHistoryBeforeSave();

    // Create automated emergency backup snapshot in localStorage before overwrite
    try {
      if (Array.isArray(appData) && appData.length > 0) {
        localStorage.setItem('travelApp_last_known_good_backup', JSON.stringify({
          meta: titleData,
          itinerary: appData,
          journeys,
          stays,
          savedAt: new Date().toISOString()
        }));
      }
    } catch (err) {
      console.warn('Could not write emergency local backup:', err);
    }

    const useIndexedDB = await shouldUseIndexedDB();

  if (useIndexedDB) {
    try {
      await Promise.all([
        saveToIndexedDB('meta', titleData),
        saveToIndexedDB('itinerary', appData),
        saveToIndexedDB('packing', packingData),
        saveToIndexedDB('leaveHome', leaveHomeData),
        saveToIndexedDB('hotelCheckout', hotelCheckoutData),
        saveToIndexedDB('cities', citiesData),
        saveToIndexedDB('journeys', journeys),
        saveToIndexedDB('stays', stays),
        saveToIndexedDB('userCities', userCities),
        saveToIndexedDB('userCountries', userCountries),
        saveToIndexedDB('filename', currentFileName),
        saveActiveTripToStore()
      ]);
      console.log('Data saved to IndexedDB (including active trip document)');
      if (typeof window.renderHeaderTripSwitcher === 'function') {
        window.renderHeaderTripSwitcher();
      }
      if (typeof window.autoSyncActiveTripToCloud === 'function') {
        window.autoSyncActiveTripToCloud();
      }
    } catch (e) {
      console.error('Failed to save to IndexedDB, falling back to localStorage:', e);
      fallbackToLocalStorage();
      // Continue with localStorage save below
    }
  }

  // Always also save to localStorage as fallback (guarded against QuotaExceededError - Issue #643)
  try {
    localStorage.setItem('travelApp_meta_template', JSON.stringify(titleData));
    localStorage.setItem('travelApp_v2026_template', JSON.stringify(appData));
    localStorage.setItem('travelApp_packing_v3', JSON.stringify(packingData));
    localStorage.setItem('travelApp_leavehome_v3', JSON.stringify(leaveHomeData));
    localStorage.setItem('travelApp_hotelCheckout_v1', JSON.stringify(hotelCheckoutData));
    localStorage.setItem('travelApp_stays_v1', JSON.stringify(stays));
    localStorage.setItem('travelApp_cities_v1', JSON.stringify(citiesData));
    localStorage.setItem('travelApp_journeys_v1', JSON.stringify(journeys));
    localStorage.setItem('travelApp_userCities_v1', JSON.stringify(userCities));
    localStorage.setItem('travelApp_userCountries_v1', JSON.stringify(userCountries));
    localStorage.setItem('travelApp_filename_v2026', currentFileName);
  } catch (storageErr) {
    console.warn('LocalStorage quota exceeded or restricted; skipping fallback serialization:', storageErr);
  }
  const savedToFile = await saveFileToDisk();
  if (savedToFile) {
    setImportedJsonWithoutWriteAccess(false);
  } else {
    syncJsonWriteWarning();
  }

  if (showTick) {
    const status = document.getElementById('saveStatus');
    if (status) {
      if (savedToFile) {
        status.textContent = '✓ Saved to JSON file';
        status.style.color = '#16a34a';
      } else if (hasActiveFileHandle()) {
        status.textContent = 'Save failed - file not updated';
        status.style.color = '#dc2626';
      } else if (isJsonWriteWarningActive()) {
        status.textContent = 'Saved locally - JSON file not updated';
        status.style.color = '#d97706';
      } else {
        status.textContent = 'Saved locally';
        status.style.color = '#64748b';
      }
      if (typeof window.syncMobileMenuStatus === 'function') window.syncMobileMenuStatus();
      setTimeout(() => {
        status.textContent = '';
        status.style.color = '';
        if (typeof window.syncMobileMenuStatus === 'function') window.syncMobileMenuStatus();
      }, 2500);
    }
  }

  if (!hasActiveFileHandle() && !localStorage.getItem('travelApp_file_handle_name') && typeof window.checkBackupReminder === 'function') {
    setTimeout(() => window.checkBackupReminder(), 250);
  }

  return savedToFile;
}

async function saveData(showTick = true) {
  saveQueued = true;
  saveQueuedShowTick = saveQueuedShowTick || !!showTick;

  if (saveQueuePromise) return saveQueuePromise;

  saveQueuePromise = (async () => {
    while (saveQueued) {
      const shouldShowTick = saveQueuedShowTick;
      saveQueued = false;
      saveQueuedShowTick = false;
      await runSaveData(shouldShowTick);
    }
    return true;
  })().finally(() => {
    saveQueuePromise = null;
  });

  return saveQueuePromise;
}

const TRIP_DATE_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function normalizeTripDateValue(dateStr, fallbackYear = (new Date().getFullYear())) {
  if (!dateStr || typeof dateStr !== 'string') return '';

  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const shortMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]{3,})$/);
  if (!shortMatch) return trimmed;

  const months = {
    jan: '01', january: '01',
    feb: '02', february: '02',
    mar: '03', march: '03',
    apr: '04', april: '04',
    may: '05',
    jun: '06', june: '06',
    jul: '07', july: '07',
    aug: '08', august: '08',
    sep: '09', sept: '09', september: '09',
    oct: '10', october: '10',
    nov: '11', november: '11',
    dec: '12', december: '12'
  };

  const monthKey = shortMatch[2].toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(months, monthKey)) return trimmed;

  const day = shortMatch[1].padStart(2, '0');
  return `${fallbackYear}-${months[monthKey]}-${day}`;
}

function formatTripDateForDisplay(dateStr) {
  const normalized = normalizeTripDateValue(dateStr);
  if (!normalized || !/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return dateStr || '—';

  const date = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr || '—';
  return `${date.getDate()} ${TRIP_DATE_MONTHS[date.getMonth()]}`;
}

function toLocalIsoDate(dateValue) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeTripLegsData(legs) {
  if (!Array.isArray(legs)) return [];
  
  const _ACTIVITY_TITLE_SEP_REGEX = /\s+(?:—|–|-|\||@)\s+/;
  function _localSplitActivityTitle(title) {
    const raw = (title || '').trim();
    if (!raw) return { title: '', location: '' };
    const match = _ACTIVITY_TITLE_SEP_REGEX.exec(raw);
    if (match) {
      const idx = match.index;
      return {
        title: raw.slice(0, idx).trim(),
        location: raw.slice(idx + match[0].length).trim()
      };
    }
    return { title: raw, location: '' };
  }

  function normalizeActivityMatchText(value) {
    let text = String(value || '').trim().toLowerCase();
    if (!text) return '';

    // Remove leading emoji/icon markers used by UI renderers.
    text = text.replace(/^[\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\s]+/gu, '').trim();
    // Strip common inline metadata that can leak into saved activity text.
    text = text.replace(/\s*[⏱🕒]\s*[^$|•]+/gu, '');
    text = text.replace(/\s*\$\s*\d[\d.,]*/gu, '');
    text = text.replace(/\s*[›»]\s*$/gu, '');
    // Remove common action-label text if present in pasted/legacy rows.
    text = text.replace(/\bmove to another day\b/gi, '').trim();

    text = text.replace(/\s+/g, ' ').trim();
    // Collapse common "title - details" variants to a base title for matching/dedupe.
    const separators = [' — ', ' – ', ' - ', ' | ', ' @ '];
    for (const separator of separators) {
      const idx = text.indexOf(separator);
      if (idx > 0) {
        text = text.slice(0, idx).trim();
        break;
      }
    }
    return text;
  }

  function buildActivityDedupKey(value) {
    const normalized = normalizeActivityMatchText(value);
    if (!normalized) return '';
    return normalized
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function isItemMatchingActivity(itemText, activity) {
    if (!activity || !itemText) return false;
    const cleanItem = buildActivityDedupKey(itemText);
    const cleanTitle = buildActivityDedupKey(activity.title || '');
    if (cleanItem === cleanTitle) return true;

    const emojiPattern = /^[\u{1F300}-\u{1F9FF}\u{2700}-\u{27BF}\u{2600}-\u{26FF}\u{1F1E6}-\u{1F1FF}]\s*/gu;
    const cleanItemNoEmoji = cleanItem.replace(emojiPattern, '').trim();
    const cleanTitleNoEmoji = cleanTitle.replace(emojiPattern, '').trim();
    if (cleanItemNoEmoji === cleanTitleNoEmoji) return true;

    if (typeof getSuggestedActivityMatchTexts === 'function') {
      const matchTexts = getSuggestedActivityMatchTexts(activity)
        .map(t => buildActivityDedupKey(t))
        .filter(Boolean);
      if (matchTexts.includes(cleanItem)) return true;
    }
    return false;
  }

  legs.forEach(leg => {
    if (!leg || typeof leg !== 'object') return;
    if (!Array.isArray(leg.days)) leg.days = [];
    if (!Array.isArray(leg.suggestedActivities)) leg.suggestedActivities = [];
    if (Array.isArray(leg.cityRun) && leg.cityRun.length > 0) {
      leg.cityRun.forEach(r => {
        if (typeof r === 'string') {
          leg.suggestedActivities.push({ title: r, category: 'fitness', estTime: '1 hr', estCost: '0', assignedDayIdx: null });
        } else if (r && typeof r === 'object') {
          leg.suggestedActivities.push({
            ...r,
            title: r.title || r.text || r.name || '',
            category: r.category || 'fitness',
            estTime: r.estTime || r.time || '1 hr',
            estCost: r.estCost || r.cost || '0',
            assignedDayIdx: r.assignedDayIdx !== undefined ? r.assignedDayIdx : null
          });
        }
      });
    }
    if (Array.isArray(leg.suggestedSights) && leg.suggestedSights.length > 0) {
      leg.suggestedSights.forEach(s => {
        if (typeof s === 'string') {
          leg.suggestedActivities.push({ title: s, category: 'sight', estTime: '1 hr', estCost: '0', assignedDayIdx: null });
        } else if (s && typeof s === 'object') {
          leg.suggestedActivities.push({
            ...s,
            title: s.title || s.text || s.name || '',
            category: s.category || 'sight',
            estTime: s.estTime || s.time || '1 hr',
            estCost: s.estCost || s.cost || '0',
            assignedDayIdx: s.assignedDayIdx !== undefined ? s.assignedDayIdx : null
          });
        }
      });
    }

    // Step 1: Infer and persist leg.type: start/return for terminal legs, transit for same-day intermediate, city for multi-day
    const lid = String(leg.id || '').toLowerCase();
    const lbl = String(leg.label || '').toLowerCase();
    const isExplicitStart = leg.type === 'start' || lid === 'departure' || lid.endsWith('-start') || lbl.includes('(trip start)') || (lbl.includes('start') && !lbl.includes('breakfast') && !lbl.includes('kickstart'));
    const isExplicitReturn = leg.type === 'return' || lid === 'return' || lid.endsWith('-finish') || lid.endsWith('-end') || lbl.includes('(trip finish)') || lbl.includes('(trip end)') || (lbl.includes('return') && !lbl.includes('restaurant'));

    const days = leg.days || [];
    const isSameDay = days.length === 1 || (days.length > 0 && days[0].date && days[days.length - 1].date && days[0].date === days[days.length - 1].date);

    if (isExplicitStart) {
      leg.type = 'start';
    } else if (isExplicitReturn) {
      leg.type = 'return';
    } else if (isSameDay || lbl.includes('transit') || leg.type === 'travel' || leg.type === 'transit') {
      leg.type = 'transit';
    } else {
      leg.type = 'city';
    }

    const suggested = leg.suggestedActivities;

    function _parseCoord(val) {
      if (val === undefined || val === null || val === '') return undefined;
      const num = Number.parseFloat(val);
      return Number.isFinite(num) ? num : undefined;
    }

    function _normalizeEntityCoords(obj) {
      if (!obj || typeof obj !== 'object') return;
      const rawLat = obj.lat !== undefined ? obj.lat : (obj.latitude !== undefined ? obj.latitude : (obj.coords && obj.coords.lat));
      const rawLng = obj.lng !== undefined ? obj.lng : (obj.longitude !== undefined ? obj.longitude : (obj.lon !== undefined ? obj.lon : (obj.coords && obj.coords.lng)));
      const lat = _parseCoord(rawLat);
      const lng = _parseCoord(rawLng);
      if (lat !== undefined && lng !== undefined && !(lat === 0 && lng === 0)) {
        obj.lat = lat;
        obj.lng = lng;
      }
    }

    function _parseClockTimeValue(val) {
      const raw = String(val || '').trim();
      const m = raw.match(/^([01]?\d|2[0-3]):([0-5]\d)(?:\s*([AaPp][Mm]))?$/);
      if (!m) return '';
      let h = parseInt(m[1], 10);
      const min = m[2];
      const ampm = m[3] ? m[3].toUpperCase() : '';
      if (ampm === 'PM' && h < 12) h += 12;
      else if (ampm === 'AM' && h === 12) h = 0;
      if (h > 23) return '';
      return `${String(h).padStart(2, '0')}:${min}`;
    }

    // Guarantee unique IDs and valid titles for all suggested activities
    suggested.forEach(act => {
      if (!act || typeof act !== 'object') return;
      if (!act.id) {
        act.id = 'act-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36);
      }
      if (!act.title && act.name) act.title = act.name;
      if (!act.cityId && leg.cityId) act.cityId = leg.cityId;
      if (!act.startTime) {
        const parsedClock = _parseClockTimeValue(act.estTime || act.time);
        if (parsedClock) act.startTime = parsedClock;
      }
      _normalizeEntityCoords(act);
    });

    const usedSuggestionIndices = new Set();

    (leg.days || []).forEach((day, dayIdx) => {
      day.date = normalizeTripDateValue(day.date);
      // Strip (Trip Start/Finish/End) suffix from day.from and day.to
      if (day.from && /\(trip (start|finish|end)\)/i.test(day.from)) {
        const cleanedFrom = typeof cleanCityNavLabel === 'function' ? cleanCityNavLabel(day.from) : day.from.replace(/\s*\(trip (start|finish|end)\)/i, '').trim();
        if (cleanedFrom) day.from = cleanedFrom;
      }
      if (day.to && /\(trip (start|finish|end)\)/i.test(day.to)) {
        const cleanedTo = typeof cleanCityNavLabel === 'function' ? cleanCityNavLabel(day.to) : day.to.replace(/\s*\(trip (start|finish|end)\)/i, '').trim();
        if (cleanedTo) day.to = cleanedTo;
      }
      // Strip trailing numbered suffixes e.g. "Brisbane (1)" or "Bangkok (2)" injected by leg numbering
      const _numSuffixRe = /\s*\(\d+\)$/;
      if (day.from && _numSuffixRe.test(day.from)) day.from = day.from.replace(_numSuffixRe, '').trim();
      if (day.to && _numSuffixRe.test(day.to)) day.to = day.to.replace(_numSuffixRe, '').trim();

      if (Array.isArray(day.accomItems)) {
        day.accomItems.forEach(ai => _normalizeEntityCoords(ai));
      }
      if (Array.isArray(day.transportItems)) {
        day.transportItems.forEach(ti => {
          _normalizeEntityCoords(ti);
          if (ti && typeof ti === 'object') {
            const fLat = _parseCoord(ti.fromLat);
            const fLng = _parseCoord(ti.fromLng);
            if (fLat !== undefined && fLng !== undefined && !(fLat === 0 && fLng === 0)) {
              ti.fromLat = fLat;
              ti.fromLng = fLng;
            }
            const tLat = _parseCoord(ti.toLat);
            const tLng = _parseCoord(ti.toLng);
            if (tLat !== undefined && tLng !== undefined && !(tLat === 0 && tLng === 0)) {
              ti.toLat = tLat;
              ti.toLng = tLng;
            }
          }
        });
      }

      if ((!Array.isArray(day.activityItems) || day.activityItems.length === 0) && Array.isArray(day.activities) && day.activities.length > 0) {
        day.activityItems = day.activities;
      }
      if (!Array.isArray(day.activityItems)) day.activityItems = [];
      (day.activityItems || []).forEach(item => {
        if (!item || typeof item !== 'object') return;
        _normalizeEntityCoords(item);
        // Fallback title / name / desc to text if text is missing or empty
        if (!item.text && (item.title || item.name || item.desc)) {
          item.text = String(item.title || item.name || item.desc).trim();
        }
        if (!item.cityId && leg.cityId) item.cityId = leg.cityId;
        item.startDate = normalizeTripDateValue(item.startDate || day.date);
        item.endDate = normalizeTripDateValue(item.endDate || item.startDate || day.date);
        if (item.startTime === undefined) item.startTime = '';
        if (item.endTime === undefined) item.endTime = '';
        if (!item.startTime && item.time) {
          const clockFromTime = _parseClockTimeValue(item.time);
          if (clockFromTime) {
            item.startTime = clockFromTime;
          }
        }
        if (!item.location) {
          const rawText = String(item.text || item.title || item.name || '').trim();
          const splitLoc = typeof _localSplitActivityTitle === 'function' ? _localSplitActivityTitle(rawText).location : '';
          if (splitLoc) {
            item.location = splitLoc;
          } else {
            const venueMatch = rawText.match(/\b(?:at|near)\s+([A-Z0-9][A-Za-z0-9\s'&.-]+)$/i);
            if (venueMatch && venueMatch[1] && !/^(the\s+local|a\s+local|the\s+area|local\s+area)\b/i.test(venueMatch[1].trim())) {
              item.location = venueMatch[1].trim();
            }
          }
        }

        // Skip placeholders
        const text = String(item.text || '').trim();
        const isPlaceholder = /^[-—]$/.test(text) || text === 'Explore local area' || text === 'Add item...' || text === 'New item...';
        if (isPlaceholder) return;

        // Try to find a match in the suggested pool
        let matchIdx = -1;
        // Priority 1: Match by ID if timeline item already has activityId
        if (item.activityId) {
          for (let i = 0; i < suggested.length; i++) {
            if (suggested[i] && suggested[i].id === item.activityId) {
              matchIdx = i;
              break;
            }
          }
        }

        // Single pass for title-based priorities (Priority 2, 3, 4) if ID match failed
        if (matchIdx === -1) {
          let p2Idx = -1;
          let p3Idx = -1;
          let p4Idx = -1;

          for (let i = 0; i < suggested.length; i++) {
            if (usedSuggestionIndices.has(i)) continue;
            const act = suggested[i];
            if (!act) continue;

            const isSameDay = act.assignedDayIdx === dayIdx;
            const isUnassigned = act.assignedDayIdx === null || act.assignedDayIdx === undefined;

            if (isSameDay) {
              if (isItemMatchingActivity(text, act)) {
                p2Idx = i;
                break; // Highest priority title match found!
              }
            } else if (p3Idx === -1 && isUnassigned) {
              if (isItemMatchingActivity(text, act)) {
                p3Idx = i;
              }
            } else if (p3Idx === -1 && p4Idx === -1) {
              if (isItemMatchingActivity(text, act)) {
                p4Idx = i;
              }
            }
          }

          matchIdx = p2Idx !== -1 ? p2Idx : (p3Idx !== -1 ? p3Idx : p4Idx);
        }

        if (matchIdx !== -1) {
          // Sync scheduling fields
          const act = suggested[matchIdx];
          item.activityId = act.id;
          if (!act.title && (item.text || item.title)) {
            act.title = item.text || item.title;
          }
          if (!item.text && act.title) {
            item.text = act.title;
          }
          if (!item.startTime && act.startTime) {
            item.startTime = act.startTime;
          }
          if (!item.endTime && act.endTime) {
            item.endTime = act.endTime;
          }
          act.assignedDayIdx = dayIdx;
          act.assignedDate = day.date || '';
          act.startDate = item.startDate || day.date || '';
          act.startTime = item.startTime || act.startTime || '';
          act.endDate = item.endDate || day.date || '';
          act.endTime = item.endTime || act.endTime || '';
          if (item.cost && item.cost !== '0' && (!act.estCost || act.estCost === '0')) act.estCost = item.cost;
          if (item.time && item.time !== '1 hr' && (!act.estTime || act.estTime === '1 hr')) act.estTime = item.time;
          
          // Bidirectional sync for notes
          if (item.notes && !act.notes) {
            act.notes = item.notes;
          } else if (act.notes && !item.notes) {
            item.notes = act.notes;
          }

          // Bidirectional sync for location
          if (item.location && !act.location) {
            act.location = item.location;
          } else if (act.location && !item.location) {
            item.location = act.location;
          } else if (!item.location && !act.location) {
            const splitFn = typeof _splitActivityTitle === 'function' ? _splitActivityTitle : _localSplitActivityTitle;
            const splitItem = splitFn(text);
            const splitAct = splitFn(act.title);
            const resolvedLoc = splitItem.location || splitAct.location || '';
            if (resolvedLoc) {
              item.location = resolvedLoc;
              act.location = resolvedLoc;
            }
          }

          // Bidirectional sync for coordinates (lat / lng)
          if (item.lat !== undefined && item.lng !== undefined && (act.lat === undefined || act.lng === undefined)) {
            act.lat = item.lat;
            act.lng = item.lng;
          } else if (act.lat !== undefined && act.lng !== undefined && (item.lat === undefined || item.lng === undefined)) {
            item.lat = act.lat;
            item.lng = act.lng;
          }

          // Bidirectional sync for status
          if (item.status && !act.status) {
            act.status = item.status;
          } else if (act.status && !item.status) {
            item.status = act.status;
          }

          // Bidirectional sync for bookingRef
          if (item.bookingRef && !act.bookingRef) {
            act.bookingRef = item.bookingRef;
          } else if (act.bookingRef && !item.bookingRef) {
            item.bookingRef = act.bookingRef;
          }

          if ((item.externalLink || item.audioRef || item.audioUrl) && !act.externalLink) {
            act.externalLink = item.externalLink || item.audioRef || item.audioUrl;
          } else if ((act.externalLink || act.audioRef || act.audioUrl) && !item.externalLink) {
            item.externalLink = act.externalLink || act.audioRef || act.audioUrl;
          }
          
          usedSuggestionIndices.add(matchIdx);
        } else {
          // No match found - create a new suggested activity entry!
          let category = 'sight';
          if (item.category) category = item.category;
          else if (/food|restaurant|eat|dinner|lunch|breakfast|cafe/i.test(text)) category = 'food';
          else if (/run|fitness|jog|workout|gym/i.test(text)) category = 'fitness';
          else if (/wellness|yoga|spa|massage/i.test(text)) category = 'wellness';
          else if (/event|meet|meeting|family|catchup|catch-up|appointment|reservation|date|hookup/i.test(text)) category = 'event';
          else if (/tour|guide|bus/i.test(text)) category = 'tour';
          else if (/attraction|park|ride/i.test(text)) category = 'attraction';

          const splitFn = typeof _splitActivityTitle === 'function' ? _splitActivityTitle : _localSplitActivityTitle;
          const splitItem = splitFn(text);
          let cleanTitle = splitItem.title || text;
          const emojiPattern = /^[\u{1F300}-\u{1F9FF}\u{2700}-\u{27BF}\u{2600}-\u{26FF}\u{1F1E6}-\u{1F1FF}]\s*/gu;
          if (emojiPattern.test(cleanTitle)) {
            cleanTitle = cleanTitle.replace(emojiPattern, '').trim();
          }

          const resolvedLoc = item.location || splitItem.location || '';
          if (resolvedLoc && !item.location) {
            item.location = resolvedLoc;
          }

          const newActivity = {
            id: 'act-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36),
            title: cleanTitle || text || 'Activity',
            category: category,
            estTime: item.time || '1 hr',
            estCost: item.cost || '0',
            notes: item.notes || '',
            location: resolvedLoc,
            cityId: item.cityId || leg.cityId || '',
            status: item.status || '',
            bookingRef: item.bookingRef || '',
            externalLink: item.externalLink || item.audioRef || item.audioUrl || '',
            assignedDayIdx: dayIdx,
            assignedDate: day.date || '',
            startDate: item.startDate || day.date || '',
            startTime: item.startTime || '',
            endDate: item.endDate || day.date || '',
            endTime: item.endTime || ''
          };
          if (item.lat !== undefined && item.lng !== undefined) {
            newActivity.lat = item.lat;
            newActivity.lng = item.lng;
          }
          suggested.push(newActivity);
          item.activityId = newActivity.id;
          usedSuggestionIndices.add(suggested.length - 1);
        }
      });

      // Deduplicate duplicate day activity rows by normalized text on the same day.
      if (Array.isArray(day.activityItems) && day.activityItems.length > 1) {
        const dedupedDayItems = [];
        const seenDayItems = new Map();
        day.activityItems.forEach(item => {
          if (!item || typeof item !== 'object') return;
          const key = buildActivityDedupKey(item.text || '');
          if (!key) {
            dedupedDayItems.push(item);
            return;
          }
          const existingIndex = seenDayItems.get(key);
          if (existingIndex === undefined) {
            seenDayItems.set(key, dedupedDayItems.length);
            dedupedDayItems.push(item);
            return;
          }
          const existing = dedupedDayItems[existingIndex];
          if ((!existing.notes || existing.notes === '') && item.notes) existing.notes = item.notes;
          if ((!existing.location || existing.location === '') && item.location) existing.location = item.location;
          if ((existing.lat === undefined || existing.lng === undefined) && item.lat !== undefined && item.lng !== undefined) {
            existing.lat = item.lat;
            existing.lng = item.lng;
          }
          if ((!existing.time || existing.time === '1 hr') && item.time) existing.time = item.time;
          if ((!existing.cost || existing.cost === '0') && item.cost) existing.cost = item.cost;
          if ((!existing.externalLink || existing.externalLink === '') && (item.externalLink || item.audioRef || item.audioUrl)) existing.externalLink = item.externalLink || item.audioRef || item.audioUrl;
          if ((existing.startTime || '') === '' && item.startTime) existing.startTime = item.startTime;
          if ((existing.endTime || '') === '' && item.endTime) existing.endTime = item.endTime;
        });
        day.activityItems = dedupedDayItems;
      }
    });

    // Reverse-sync: ensure any suggestedActivities with a day assignment or date
    // are present in their respective day.activityItems (e.g., if leg.days was rebuilt or shifted).
    suggested.forEach((act, sIdx) => {
      if (!act || typeof act !== 'object') return;
      if (!act.title && act.notes) {
        const noteTitle = act.notes.split('.')[0].trim();
        if (noteTitle) act.title = noteTitle.length > 50 ? noteTitle.substring(0, 47) + '...' : noteTitle;
      }
      if (usedSuggestionIndices.has(sIdx)) return;

      const normAssignedDate = normalizeTripDateValue(act.assignedDate || act.startDate || '');
      let targetDayIdx = -1;
      if (normAssignedDate && Array.isArray(leg.days)) {
        targetDayIdx = leg.days.findIndex(d => d && normalizeTripDateValue(d.date) === normAssignedDate);
      }
      if (targetDayIdx === -1 && Number.isInteger(act.assignedDayIdx) && act.assignedDayIdx >= 0 && Array.isArray(leg.days) && act.assignedDayIdx < leg.days.length) {
        targetDayIdx = act.assignedDayIdx;
      }
      if (targetDayIdx === -1 || !leg.days || !leg.days[targetDayIdx]) return;

      const targetDay = leg.days[targetDayIdx];
      if (!Array.isArray(targetDay.activityItems)) targetDay.activityItems = [];

      const alreadyInDay = targetDay.activityItems.some(item => {
        if (!item || typeof item !== 'object') return false;
        if (act.id && item.activityId && item.activityId === act.id) return true;
        return isItemMatchingActivity(String(item.text || item.title || '').trim(), act);
      });

      act.assignedDayIdx = targetDayIdx;
      act.assignedDate = targetDay.date || normAssignedDate || '';

      if (!alreadyInDay && act.title) {
        targetDay.activityItems = targetDay.activityItems.filter(item => {
          const t = String(item?.text || '').trim();
          return !(/^[-—]$/.test(t) || t === 'Explore local area' || t === 'Add item...' || t === 'New item...');
        });
        const clockTime = _parseClockTimeValue(act.startTime || act.estTime || act.time);
        const itemStartTime = act.startTime || clockTime || '';
        const restoredItem = {
          text: act.title,
          time: act.estTime || act.time || '1 hr',
          cost: act.estCost || act.cost || '0',
          done: Boolean(act.done),
          category: act.category || 'sight',
          notes: act.notes || '',
          location: act.location || '',
          status: act.status || '',
          bookingRef: act.bookingRef || '',
          externalLink: act.externalLink || act.audioRef || act.audioUrl || '',
          cityId: act.cityId || leg.cityId || '',
          activityId: act.id,
          startDate: targetDay.date || act.startDate || '',
          startTime: itemStartTime,
          endDate: targetDay.date || act.endDate || '',
          endTime: act.endTime || ''
        };
        if (act.lat !== undefined && act.lng !== undefined) {
          restoredItem.lat = act.lat;
          restoredItem.lng = act.lng;
        }
        targetDay.activityItems.push(restoredItem);
      }
    });

    // Normalize cityFood: ensure text, done, cityId, location, and coordinates
    if (Array.isArray(leg.cityFood)) {
      leg.cityFood = leg.cityFood.map(food => {
        if (typeof food === 'string') {
          return { text: food, done: false, cityId: leg.cityId || '' };
        }
        if (food && typeof food === 'object') {
          if (!food.text && (food.name || food.title)) {
            const extra = [food.cuisine, food.area, food.recommended, food.notes].filter(Boolean).join(' · ');
            food.text = extra ? `${food.name || food.title} (${extra})` : (food.name || food.title);
          }
          if (!food.location && food.area) food.location = food.area;
          _normalizeEntityCoords(food);
          if (food.done === undefined) food.done = false;
          if (!food.cityId && leg.cityId) food.cityId = leg.cityId;
        }
        return food;
      });
    }

    // Normalize legTips: preserve strings and ensure text/cityId on objects
    if (Array.isArray(leg.legTips)) {
      leg.legTips = leg.legTips.map(tip => {
        if (typeof tip === 'string') {
          return tip;
        }
        if (tip && typeof tip === 'object') {
          if (!tip.text) {
            const parts = [tip.title, tip.note, tip.notes, tip.desc].filter(Boolean);
            tip.text = parts.length ? parts.join(': ') : (tip.name || '');
          }
          if (!tip.cityId && leg.cityId) tip.cityId = leg.cityId;
        }
        return tip;
      });
    }

    (leg.suggestedActivities || []).forEach(activity => {
      if (!activity || typeof activity !== 'object') return;
      activity.assignedDate = normalizeTripDateValue(activity.assignedDate || activity.startDate || '');
      activity.startDate = normalizeTripDateValue(activity.startDate || activity.assignedDate || '');
      activity.endDate = normalizeTripDateValue(activity.endDate || activity.startDate || '');
      if (activity.startTime === undefined) activity.startTime = '';
      if (activity.endTime === undefined) activity.endTime = '';
      _normalizeEntityCoords(activity);
    });

    // Deduplicate activities that share the same normalized title + assignment target.
    const deduped = [];
    const seen = new Map();
    (leg.suggestedActivities || []).forEach(activity => {
      if (!activity || typeof activity !== 'object') return;
      const titleKey = buildActivityDedupKey(activity.title || '');
      const dayKey = activity.assignedDayIdx === null || activity.assignedDayIdx === undefined
        ? 'unassigned'
        : String(activity.assignedDayIdx);
      const key = `${titleKey}__${dayKey}`;
      const existingIndex = seen.get(key);
      if (existingIndex === undefined) {
        seen.set(key, deduped.length);
        deduped.push(activity);
        return;
      }
      const existing = deduped[existingIndex];
      // Keep richer fields when collapsing duplicates.
      if ((!existing.notes || existing.notes === '') && activity.notes) existing.notes = activity.notes;
      if ((!existing.location || existing.location === '') && activity.location) existing.location = activity.location;
      if ((existing.lat === undefined || existing.lng === undefined) && activity.lat !== undefined && activity.lng !== undefined) {
        existing.lat = activity.lat;
        existing.lng = activity.lng;
      }
      if ((!existing.estTime || existing.estTime === '1 hr') && activity.estTime) existing.estTime = activity.estTime;
      if ((!existing.estCost || existing.estCost === '0') && activity.estCost) existing.estCost = activity.estCost;
      if ((!existing.externalLink || existing.externalLink === '') && (activity.externalLink || activity.audioRef || activity.audioUrl)) existing.externalLink = activity.externalLink || activity.audioRef || activity.audioUrl;
      if ((existing.startTime || '') === '' && activity.startTime) existing.startTime = activity.startTime;
      if ((existing.endTime || '') === '' && activity.endTime) existing.endTime = activity.endTime;
    });
    leg.suggestedActivities = deduped;
  });

  // Self-healing pass: remove bogus auto-generated #808080 duplicate transit legs and clean up stale (1)/(2) label suffixes
  const _extractBaseCity = (lbl) => {
    if (!lbl) return '';
    return String(lbl)
      .replace(/[^\x00-\x7F]/g, '')
      .replace(/\s*\(trip\s*(start|finish|end)\)/gi, '')
      .replace(/\s*\((return|departure|transit)\)/gi, '')
      .replace(/\s*return\s*home/gi, '')
      .replace(/\s*\([^)]*\)/g, '')
      .replace(/\s*\d+\s*$/, '')
      .trim()
      .toLowerCase();
  };

  const _isBogusAutoTransitLeg = (leg, idx) => {
    if (!leg || typeof leg !== 'object') return false;
    const lid = String(leg.id || '');
    const col = String(leg.colour || '').toLowerCase();
    if (!/^leg-\d+/.test(lid) || col !== '#808080') return false;
    if (leg.type === 'start' || leg.type === 'return') return false;
    if (Array.isArray(leg.cityFood) && leg.cityFood.length > 0) return false;
    if (Array.isArray(leg.suggestedActivities) && leg.suggestedActivities.length > 0) return false;
    const hasRealDayActivity = (leg.days || []).some(d =>
      Array.isArray(d?.activityItems) && d.activityItems.some(it => {
        const t = String(it?.text || it?.title || '').trim();
        return t && !(/^[-—]$/.test(t) || t === 'Explore local area' || t === 'Add item...' || t === 'New item...');
      })
    );
    if (hasRealDayActivity) return false;
    const base = _extractBaseCity(leg.label);
    if (!base) return false;
    return legs.some((other, oIdx) => {
      if (oIdx === idx || !other) return false;
      const otherId = String(other.id || '');
      const otherCol = String(other.colour || '').toLowerCase();
      if (/^leg-\d+/.test(otherId) && otherCol === '#808080') return false;
      return _extractBaseCity(other.label) === base;
    });
  };

  for (let idx = legs.length - 1; idx >= 0; idx--) {
    if (_isBogusAutoTransitLeg(legs[idx], idx)) {
      legs.splice(idx, 1);
    }
  }

  const _nonTerminalCityCounts = {};
  legs.forEach(leg => {
    if (!leg || !leg.label) return;
    if (leg.type === 'start' || leg.type === 'return') {
      leg.label = String(leg.label).replace(/\s*\(\d+\)\s*$/, '').trim();
      return;
    }
    const base = _extractBaseCity(leg.label);
    if (base) _nonTerminalCityCounts[base] = (_nonTerminalCityCounts[base] || 0) + 1;
  });

  legs.forEach(leg => {
    if (!leg || !leg.label || leg.type === 'start' || leg.type === 'return') return;
    const base = _extractBaseCity(leg.label);
    if (base && (_nonTerminalCityCounts[base] || 0) <= 1 && /\s*\(\d+\)\s*$/.test(leg.label)) {
      leg.label = String(leg.label).replace(/\s*\(\d+\)\s*$/, '').trim();
    }
  });

  return legs;
}
if (typeof window !== 'undefined') {
  window.normalizeTripLegsData = normalizeTripLegsData;
}

function normalizeTripJourneysData(items) {
  if (!Array.isArray(items)) return [];

  function _parseNum(val) {
    if (val === undefined || val === null || val === '') return undefined;
    const n = Number.parseFloat(val);
    return Number.isFinite(n) ? n : undefined;
  }

  const flatItems = [];
  items.forEach(item => {
    if (Array.isArray(item.legs) && item.legs.length > 0 && !item.transportType) {
      item.legs.forEach((leg, idx) => {
        const flatLeg = {
          id: item.id ? `${item.id}_${idx}` : undefined,
          journeyId: item.journeyId || item.id,
          journeyName: item.journeyName || '',
          isMultiLeg: item.legs.length > 1,
          segmentOrder: idx + 1,
          fromCityId: leg.fromCityId || '',
          toCityId: leg.toCityId || '',
          fromLocation: leg.fromLocation || leg.fromCityId || '',
          toLocation: leg.toLocation || leg.toCityId || '',
          departureDate: leg.departureDate || '',
          departureTime: leg.departureTime || '',
          arrivalDate: leg.arrivalDate || '',
          arrivalTime: leg.arrivalTime || '',
          transportType: leg.type || leg.transportType || 'flight',
          provider: leg.provider || '',
          routeCode: leg.routeCode || '',
          cost: leg.cost || '',
          status: leg.status || 'suggested',
          bookingReference: leg.bookingRef || leg.bookingReference || '',
          notes: leg.notes || ''
        };
        if (leg.fromLat !== undefined) flatLeg.fromLat = leg.fromLat;
        if (leg.fromLng !== undefined) flatLeg.fromLng = leg.fromLng;
        if (leg.toLat !== undefined) flatLeg.toLat = leg.toLat;
        if (leg.toLng !== undefined) flatLeg.toLng = leg.toLng;
        if (leg.lat !== undefined) flatLeg.lat = leg.lat;
        if (leg.lng !== undefined) flatLeg.lng = leg.lng;
        flatItems.push(flatLeg);
      });
    } else {
      flatItems.push(item);
    }
  });
  items = flatItems;

  items.forEach(item => {
    if (!item.id) {
      item.id = 'journey-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36);
    }
    if (!item.journeyId) {
      item.journeyId = item.id;
    }
  });

  const groups = {};
  items.forEach(item => {
    item.dayDate = normalizeTripDateValue(item.dayDate || item.startDate);
    item.departureDate = normalizeTripDateValue(item.departureDate || item.startDate || item.dayDate);
    item.arrivalDate = normalizeTripDateValue(item.arrivalDate || item.endDate || item.departureDate || item.dayDate);
    item.departureTime = item.departureTime || item.startTime || '';
    item.arrivalTime = item.arrivalTime || item.endTime || '';
    item.startDate = item.departureDate || item.dayDate || '';
    item.endDate = item.arrivalDate || item.startDate || '';
    item.startTime = item.departureTime || '';
    item.endTime = item.arrivalTime || '';
    item.fromAddress = item.fromAddress || '';
    item.toAddress = item.toAddress || '';
    item.notes = item.notes || '';

    const fLat = _parseNum(item.fromLat !== undefined ? item.fromLat : (item.fromCoords && item.fromCoords.lat));
    const fLng = _parseNum(item.fromLng !== undefined ? item.fromLng : (item.fromCoords && item.fromCoords.lng));
    if (fLat !== undefined && fLng !== undefined && !(fLat === 0 && fLng === 0)) {
      item.fromLat = fLat;
      item.fromLng = fLng;
    }
    const tLat = _parseNum(item.toLat !== undefined ? item.toLat : (item.toCoords && item.toCoords.lat));
    const tLng = _parseNum(item.toLng !== undefined ? item.toLng : (item.toCoords && item.toCoords.lng));
    if (tLat !== undefined && tLng !== undefined && !(tLat === 0 && tLng === 0)) {
      item.toLat = tLat;
      item.toLng = tLng;
    }
    const jLat = _parseNum(item.lat !== undefined ? item.lat : item.latitude);
    const jLng = _parseNum(item.lng !== undefined ? item.lng : (item.longitude !== undefined ? item.longitude : item.lon));
    if (jLat !== undefined && jLng !== undefined && !(jLat === 0 && jLng === 0)) {
      item.lat = jLat;
      item.lng = jLng;
    }

    const gid = item.journeyId || item.id;
    if (gid) {
      if (!groups[gid]) groups[gid] = [];
      groups[gid].push(item);
    }
  });

  const statusPriority = { 'cancelled': 4, 'confirmed': 3, 'booked': 2, 'planned': 1, '': 0 };
  Object.values(groups).forEach(segs => {
    if (segs.length > 1) {
      let bestStatus = 'planned';
      let maxPriority = 0;
      segs.forEach(s => {
        const p = statusPriority[s.status] || 0;
        if (p > maxPriority) {
          maxPriority = p;
          bestStatus = s.status;
        }
      });
      if (bestStatus) {
        segs.forEach(s => s.status = bestStatus);
      }
    }
  });

  return items;
}

function normalizeTripStaysData(items) {
  if (!Array.isArray(items)) return [];
  items.forEach(item => {
    if (!item.id) {
      item.id = 'stay-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36);
    }
    item.checkIn = normalizeTripDateValue(item.checkIn || item.startDate);
    item.checkOut = normalizeTripDateValue(item.checkOut || item.endDate || item.checkIn);
    item.checkInTime = item.checkInTime || item.startTime || '';
    item.checkOutTime = item.checkOutTime || item.endTime || '';
    item.startDate = item.checkIn || '';
    item.endDate = item.checkOut || item.startDate || '';
    item.startTime = item.checkInTime || '';
    item.endTime = item.checkOutTime || '';
    item.location = item.location || item.address || '';

    const rawLat = item.lat !== undefined ? item.lat : (item.latitude !== undefined ? item.latitude : (item.coords && item.coords.lat));
    const rawLng = item.lng !== undefined ? item.lng : (item.longitude !== undefined ? item.longitude : (item.lon !== undefined ? item.lon : (item.coords && item.coords.lng)));
    if (rawLat !== undefined && rawLat !== null && rawLat !== '' && rawLng !== undefined && rawLng !== null && rawLng !== '') {
      const lat = Number.parseFloat(rawLat);
      const lng = Number.parseFloat(rawLng);
      if (Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)) {
        item.lat = lat;
        item.lng = lng;
      }
    }
  });
  return items;
}

function normalizeTripCitiesDateData(items) {
  if (!Array.isArray(items)) return [];
  items.forEach(item => {
    normalizeCityLocationData(item);
    item.dateFrom = normalizeTripDateValue(item.dateFrom);
    item.dateTo = normalizeTripDateValue(item.dateTo);
  });
  return items;
}

function addDaysToIsoDate(dateStr, days) {
  if (!dateStr) return '';
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  date.setDate(date.getDate() + days);
  return toLocalIsoDate(date);
}
if (typeof window !== 'undefined') window.addDaysToIsoDate = addDaysToIsoDate;

function stripCityLabel(cityName) {
  // Strip emoji, flag sequences, and parenthetical suffixes like (Trip Start)
  // This mirrors cleanCityNavLabel so map matching and departure blocks work correctly
    let cleanValue = String(cityName || '');
  const commaIdx = cleanValue.indexOf(',');
  if (commaIdx !== -1) {
    cleanValue = cleanValue.slice(0, commaIdx);
  } else {
    const splitMatch = cleanValue.match(/ (—|–|-) /);
    if (splitMatch) {
      cleanValue = cleanValue.slice(0, splitMatch.index);
    }
  }
  return cleanValue
    .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '')
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/\p{Emoji}/gu, '')
    .replace(/\s*\([^)]*\)/gu, '')
    .replace(/[^\w\s-]/gu, '')
    .trim();
}

function calculateNightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

if (typeof window !== 'undefined') {
  window.stripCityLabel = stripCityLabel;
  window.calculateNightsBetween = calculateNightsBetween;
}

function seedDefaultDerivedTravelData() {
  // Not needed anymore since default data provides journeys and stays natively.
  return false;
}

function resetAppStateToDefaults() {
  appData = JSON.parse(JSON.stringify(DEFAULT_TRIP_DATA.itinerary));
  packingData = JSON.parse(JSON.stringify(DEFAULT_PACKING));
  leaveHomeData = JSON.parse(JSON.stringify(DEFAULT_LEAVE_HOME));
  citiesData = typeof DEFAULT_CITIES !== 'undefined' ? JSON.parse(JSON.stringify(DEFAULT_CITIES)) : [];
  userCities = [];
  userCountries = [];
  journeys = JSON.parse(JSON.stringify(DEFAULT_TRIP_DATA.journeys));
  window.journeys = journeys;
  stays = JSON.parse(JSON.stringify(DEFAULT_TRIP_DATA.stays));
  window.stays = stays;
  titleData = {
    title: DEFAULT_TRIP_DATA.meta.title,
    subtitle: DEFAULT_TRIP_DATA.meta.subtitle
  };
  const mainTitleEl = document.getElementById("mainTitle");
  if (mainTitleEl) mainTitleEl.innerText = titleData.title;
  const mainSubEl = document.getElementById("mainSubtitle");
  if (mainSubEl) mainSubEl.innerText = titleData.subtitle;
  currentFileName = "Default Template";
  currentCityFilter = 'all';

  window.journeys = journeys;
  window.stays = stays;
  window.currentCityFilter = currentCityFilter;
}

/**
 * Hard restart reloads the app and clears temporary caches
 * but preserves user trip data in localStorage and IndexedDB.
 */
async function hardRestartApp() {
  if(!confirm("Restart app and clear temporary caches? Your trip data will be preserved.")) {
    return;
  }

  try { sessionStorage.clear(); } catch (e) { console.warn('Hard restart: sessionStorage cleanup skipped', e); }

  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister().catch(() => false)));
    }
  } catch (e) {
    console.warn('Hard restart: service worker cleanup skipped', e);
  }

  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
    }
  } catch (e) {
    console.warn('Hard restart: cache cleanup skipped', e);
  }

  location.reload();
}

/**
 * Factory reset wipes ALL data, clears caches, and reverts to the default template.
 */
async function factoryResetData(options = {}) {
  const confirmMessage = options.confirmMessage || "⚠️ DANGER: Wipe ALL trip data and custom settings? This will revert everything to the default template and cannot be undone.";
  if(!confirm(confirmMessage)) {
    return;
  }

  // Clear in-memory active file handle and write flags
  activeFileHandle = null;
  fileWriteFailed = false;
  importedJsonWithoutWriteAccess = false;

  resetAppStateToDefaults();

  // Wipe ALL localStorage and sessionStorage completely
  try {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("travelApp_factory_reset_triggered", "true");
  } catch (e) {
    console.warn('Factory reset: storage cleanup skipped', e);
  }

  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister().catch(() => false)));
    }
  } catch (e) {
    console.warn('Factory reset: service worker cleanup skipped', e);
  }

  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
    }
  } catch (e) {
    console.warn('Factory reset: cache cleanup skipped', e);
  }

  try {
    if (window.indexedDB && typeof DB_NAME !== 'undefined') {
      await new Promise(resolve => {
        const request = window.indexedDB.deleteDatabase(DB_NAME);
        request.onsuccess = request.onerror = request.onblocked = () => resolve();
      });
    }
  } catch (e) {
    console.warn('Factory reset: IndexedDB cleanup skipped', e);
  }

  location.reload();
}

function migratePacking(data) {
  if (!Array.isArray(data) || data.length === 0) return null;

  const looseStrings = [];
  const objectEntries = [];
  data.forEach(item => {
    if (typeof item === 'string' && item.trim()) {
      looseStrings.push({ text: item.trim(), done: false });
    } else if (item && typeof item === 'object') {
      objectEntries.push(item);
    }
  });

  const hasAreas = objectEntries.some(e => e.areaName && Array.isArray(e.categories));
  if (hasAreas) {
    const resultAreas = objectEntries;
    if (looseStrings.length > 0) {
      const targetArea = resultAreas.find(a => String(a.areaName).includes('Carry-on')) || resultAreas[0];
      if (targetArea) {
        if (!Array.isArray(targetArea.categories)) targetArea.categories = [];
        let targetCat = targetArea.categories.find(c => /essentials|clothes|general/i.test(c.title)) || targetArea.categories[0];
        if (!targetCat) {
          targetCat = { title: 'Trip Essentials', items: [] };
          targetArea.categories.unshift(targetCat);
        }
        if (!Array.isArray(targetCat.items)) targetCat.items = [];
        targetCat.items.push(...looseStrings);
      }
    }
    return resultAreas;
  }

  const isOldFormat = objectEntries.length > 0 && objectEntries[0].hasOwnProperty('title') && !objectEntries[0].hasOwnProperty('areaName');
  if (isOldFormat || looseStrings.length > 0) {
    const areas = [
      { areaName: '🚶 Walk-on Gear (Wear onto plane)', areaColor: '#E67E22', categories: [] },
      { areaName: '🧳 Carry-on Packed Bag (Main Luggage)', areaColor: '#2980B9', categories: [] },
      { areaName: '🎒 Personal Item Bag (Under Seat)', areaColor: '#8E44AD', categories: [] }
    ];
    if (looseStrings.length > 0) {
      areas[1].categories.push({ title: 'Trip Essentials', items: looseStrings });
    }
    objectEntries.forEach(cat => {
      const t = cat.title || '';
      const entry = { title: t.replace(/^(🧳|🎒|🚶|💧)\s*/,'').replace(/^(Carry-On: |Personal Item: )/,''), items: cat.items || [] };
      if (t.includes('Walk-on') || t.includes('Plane Outfit')) { areas[0].categories.push(entry); }
      else if (t.includes('Personal Item') || t.includes('Flight Items') || t.includes('Tech') || t.includes('Essentials')) { areas[2].categories.push(entry); }
      else { areas[1].categories.push(entry); }
    });
    return areas.filter(a => a.categories.length > 0);
  }

  return data;
}

function ensureDefaultPackingAreas(data) {
  const areas = Array.isArray(data) ? JSON.parse(JSON.stringify(data)) : [];
  const hasArea = (areaName) => areas.some(area => {
    const currentName = String(area?.areaName || '').trim();
    const targetName = String(areaName || '').trim();
    if (!currentName || !targetName) return false;
    if (currentName === targetName) return true;
    return currentName.includes('Trip Notes') && targetName.includes('Trip Notes');
  });

  DEFAULT_PACKING.forEach(defaultArea => {
    if (!hasArea(defaultArea.areaName)) {
      areas.push(JSON.parse(JSON.stringify(defaultArea)));
    }
  });

  return areas;
}

function getImportedDestinationCityNames(importedData) {
  const destinationNames = new Set();
  const cityIdToName = new Map();
  const skipNames = new Set([
    'home', 'in transit', 'between cities', 'tbc', '', 'return', 'departure', 'arrival',
    'start', 'return home', 'trip start', 'trip finish', 'trip return', 'home departure',
    'departure from home', 'flight home', 'travel day'
  ]);

  const addName = (name) => {
    if (!name || typeof name !== 'string') return;
    const normalized = name.trim();
    if (!normalized || skipNames.has(normalized.toLowerCase())) return;
    destinationNames.add(normalized.toLowerCase());
  };

  const cleanLegLabel = (label) => {
    if (!label || typeof label !== 'string') return '';
    let cleanValue = String(label || '');
  const commaIdx = cleanValue.indexOf(',');
  if (commaIdx !== -1) {
    cleanValue = cleanValue.slice(0, commaIdx);
  } else {
    const splitMatch = cleanValue.match(/ (—|–|-) /);
    if (splitMatch) {
      cleanValue = cleanValue.slice(0, splitMatch.index);
    }
  }
  return cleanValue
      .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '')
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .replace(/[\u{2600}-\u{26FF}]/gu, '')
      .replace(/[\u{2700}-\u{27BF}]/gu, '')
      .replace(/\p{Emoji}/gu, '')
      .replace(/\s*\([^)]*\)/gu, '')
      .replace(/[^\w\s-]/gu, '')
      .trim();
  };

  if (Array.isArray(importedData.cities)) {
    importedData.cities.forEach(city => {
      if (city && city.id && city.name) cityIdToName.set(city.id, city.name);
    });
  }

  if (Array.isArray(importedData.itinerary)) {
    importedData.itinerary.forEach(leg => {
      const labelName = cleanLegLabel(leg.label);
      let labelMatchesDayCity = false;

      if (leg.cityId && cityIdToName.has(leg.cityId)) {
        addName(cityIdToName.get(leg.cityId));
      }

      if (leg.id) {
        const cleanSlug = leg.id.replace(/^leg-/, '');
        const directCityName = cityIdToName.get(leg.id) || cityIdToName.get('city-' + leg.id) || cityIdToName.get('city-' + cleanSlug) || cityIdToName.get(cleanSlug);
        if (directCityName) {
          addName(directCityName);
        } else if (directCityName && labelName && directCityName.toLowerCase() === labelName.toLowerCase()) {
          labelMatchesDayCity = (leg.days || []).some(day =>
            (day.to && labelName.toLowerCase() === day.to.toLowerCase()) ||
            (day.from && labelName.toLowerCase() === day.from.toLowerCase())
          );
          if (labelMatchesDayCity) addName(directCityName);
        }
      }

      (leg.days || []).forEach((day, dayIdx) => {
        if (day.from && day.to && day.from === day.to) addName(typeof stripCityLabel === 'function' ? stripCityLabel(day.to) : cleanLegLabel(day.to));

        (day.accomItems || []).forEach(item => {
          if (item.cityId && cityIdToName.has(item.cityId)) addName(cityIdToName.get(item.cityId));
        });
      });
    });
  }

  if (Array.isArray(importedData.stays)) {
    importedData.stays.forEach(stay => {
      if (stay.city) addName(stay.city);
      if (stay.cityId && cityIdToName.has(stay.cityId)) addName(cityIdToName.get(stay.cityId));
    });
  }

  return destinationNames;
}

function normalizeImportedCities(importedData) {
  if (!Array.isArray(importedData.cities)) return [];

  const destinationNames = getImportedDestinationCityNames(importedData);
  const allCitiesMarkedTransit = importedData.cities.length > 0 && importedData.cities.every(city => city && city.isTransit === true);
  const skipNames = new Set([
    'home', 'in transit', 'between cities', 'tbc', '', 'return', 'departure', 'arrival',
    'start', 'return home', 'trip start', 'trip finish', 'trip return', 'home departure',
    'departure from home', 'flight home', 'travel day'
  ]);
  const seenCityIds = new Set();
  const seenCityNames = new Set();

  return importedData.cities.filter(city => {
    const cityName = city && city.name ? city.name.trim().toLowerCase() : '';
    if (!city || !city.name || skipNames.has(cityName)) return false;

    const cityId = city.id || 'city-' + cityName.replace(/[^a-z0-9]/g, '-');
    if (seenCityIds.has(cityId) || seenCityNames.has(cityName)) return false;

    seenCityIds.add(cityId);
    seenCityNames.add(cityName);
    return true;
  }).map(city => {
    const normalizedCity = { ...city };
    const isDestination = normalizedCity.name && destinationNames.has(normalizedCity.name.trim().toLowerCase());

    if ((allCitiesMarkedTransit && isDestination) || isDestination) {
      delete normalizedCity.isTransit;
      if (normalizedCity.colour === '#95a5a6') normalizedCity.colour = getRandomCityColor();
    } else if (normalizedCity.isTransit === true && !normalizedCity.colour) {
      normalizedCity.colour = '#95a5a6';
    }

    return normalizeCityLocationData(normalizedCity);
  });
}

function getIntermediateJourneyCities(journeysData) {
  if (!Array.isArray(journeysData)) return [];

  const grouped = new Map();
  journeysData.forEach((journey, index) => {
    const groupId = journey.journeyId || journey.id || `journey-${index}`;
    if (!grouped.has(groupId)) grouped.set(groupId, []);
    grouped.get(groupId).push(journey);
  });

  const transitCities = [];
  grouped.forEach(segments => {
    const sortedSegments = [...segments].sort((a, b) => {
      const aOrder = Number.isFinite(Number(a.segmentOrder)) ? Number(a.segmentOrder) : 0;
      const bOrder = Number.isFinite(Number(b.segmentOrder)) ? Number(b.segmentOrder) : 0;
      return aOrder - bOrder;
    });

    if (sortedSegments.length <= 1) return;

    const finalDestination = sortedSegments[sortedSegments.length - 1].toLocation;
    sortedSegments.slice(0, -1).forEach(segment => {
      if (segment.toLocation && segment.toLocation !== finalDestination) {
        transitCities.push(segment.toLocation);
      }
    });
  });

  return [...new Set(transitCities)];
}

const SHARE_APP_URL = 'https://trentan.github.io/travel-planner/';

function cloneExportValue(value) {
  return deepClone(value ?? null);
}

function getDownloadName(baseName, fallbackName, suffix, extension) {
  if (!baseName || baseName === 'Default Template') {
    return fallbackName.endsWith(extension) ? fallbackName : `${fallbackName}${extension}`;
  }
  const stripped = String(baseName).replace(/\.json$/i, '');
  return `${stripped}${suffix}${extension}`;
}

function buildExportPayload() {
  let journeysData = [];
  if (typeof journeys !== 'undefined') journeysData = normalizeTripJourneysData(cloneExportValue(journeys));
  let staysData = [];
  if (typeof stays !== 'undefined') staysData = normalizeTripStaysData(cloneExportValue(stays));
  let citiesDataToExport = [];
  if (typeof citiesData !== 'undefined') citiesDataToExport = normalizeTripCitiesDateData(cloneExportValue(citiesData));
  let userCitiesData = [];
  if (typeof userCities !== 'undefined') userCitiesData = cloneExportValue(userCities);
  let userCountriesData = [];
  if (typeof userCountries !== 'undefined') userCountriesData = cloneExportValue(userCountries);
  const itineraryData = normalizeTripLegsData(cloneExportValue(appData));

  return {
    meta: cloneExportValue(titleData),
    itinerary: itineraryData,
    packing: cloneExportValue(packingData),
    leaveHome: cloneExportValue(leaveHomeData),
    hotelCheckout: cloneExportValue(hotelCheckoutData),
    journeys: journeysData,
    stays: staysData,
    cities: citiesDataToExport,
    userCities: userCitiesData,
    userCountries: userCountriesData
  };
}

function redactShareExportPayload(exportObj, options = {}) {
  const payload = cloneExportValue(exportObj) || {};
  const redactCosts = !!options.redactCosts;
  const redactRefs = !!options.redactRefs;
  const redactNotes = !!options.redactNotes;

  const redactBookingFields = item => {
    if (!item || typeof item !== 'object') return;
    if (redactCosts && 'cost' in item) item.cost = '';
    if (redactCosts && 'totalCost' in item) item.totalCost = '';
    if (redactRefs) {
      if ('bookingRef' in item) item.bookingRef = '';
      if ('bookingReference' in item) item.bookingReference = '';
      if ('pnr' in item) item.pnr = '';
      if ('confirmationNumber' in item) item.confirmationNumber = '';
    }
    if (redactNotes && 'notes' in item) item.notes = '';
  };

  if (Array.isArray(payload.itinerary)) {
    payload.itinerary.forEach(leg => {
      if (!leg || typeof leg !== 'object') return;
      if (redactNotes) {
        if ('notes' in leg) leg.notes = '';
        if (Array.isArray(leg.legTips)) {
          leg.legTips = leg.legTips.map(() => '').filter(Boolean);
        }
        (leg.days || []).forEach(day => {
          if (day && typeof day === 'object' && 'desc' in day) day.desc = '';
        });
      }

      (leg.days || []).forEach((day, dayIdx) => {
        (day.transportItems || []).forEach(redactBookingFields);
        (day.accomItems || []).forEach(redactBookingFields);
        (day.activityItems || []).forEach(redactBookingFields);
      });
    });
  }

  if (Array.isArray(payload.journeys)) {
    payload.journeys.forEach(redactBookingFields);
  }

  if (Array.isArray(payload.stays)) {
    payload.stays.forEach(redactBookingFields);
  }

  payload.meta = payload.meta || {};
  payload.meta.exportKind = 'share';
  payload.meta.redactions = {
    costs: redactCosts,
    bookingRefs: redactRefs,
    notes: redactNotes
  };

  return payload;
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

function applySharePreset(presetName) {
  const hideCosts = document.getElementById('shareHideCosts');
  const hideRefs = document.getElementById('shareHideRefs');
  const hideNotes = document.getElementById('shareHideNotes');

  if (presetName === 'co-traveler') {
    if (hideCosts) hideCosts.checked = false;
    if (hideRefs) hideRefs.checked = false;
    if (hideNotes) hideNotes.checked = false;
  } else if (presetName === 'family') {
    if (hideCosts) hideCosts.checked = false;
    if (hideRefs) hideRefs.checked = true;
    if (hideNotes) hideNotes.checked = false;
  } else if (presetName === 'public') {
    if (hideCosts) hideCosts.checked = true;
    if (hideRefs) hideRefs.checked = true;
    if (hideNotes) hideNotes.checked = false;
  } else if (presetName === 'confidential') {
    if (hideCosts) hideCosts.checked = true;
    if (hideRefs) hideRefs.checked = true;
    if (hideNotes) hideNotes.checked = true;
  }

  syncPresetHighlightingFromCheckboxes();
  if (typeof refreshShareEmailDraft === 'function') refreshShareEmailDraft();
}

function syncPresetHighlightingFromCheckboxes() {
  const hideCosts = document.getElementById('shareHideCosts')?.checked ?? false;
  const hideRefs = document.getElementById('shareHideRefs')?.checked ?? false;
  const hideNotes = document.getElementById('shareHideNotes')?.checked ?? false;

  let activePreset = 'custom';
  if (!hideCosts && !hideRefs && !hideNotes) {
    activePreset = 'co-traveler';
  } else if (!hideCosts && hideRefs && !hideNotes) {
    activePreset = 'family';
  } else if (hideCosts && hideRefs && !hideNotes) {
    activePreset = 'public';
  } else if (hideCosts && hideRefs && hideNotes) {
    activePreset = 'confidential';
  }

  const presets = ['co-traveler', 'family', 'public', 'confidential', 'custom'];
  presets.forEach(p => {
    const btn = document.getElementById(`share-preset-${p}`);
    if (btn) {
      if (p === activePreset) {
        btn.classList.add('border-teal-600');
        btn.classList.add('dark:border-cyan-400');
        btn.classList.add('bg-teal-50/50');
        btn.classList.add('dark:bg-slate-800/50');
        btn.classList.add('ring-2');
        btn.classList.add('ring-teal-600/20');
        btn.classList.remove('border-slate-200');
        btn.classList.remove('dark:border-slate-700');
        btn.classList.remove('bg-white');
        btn.classList.remove('dark:bg-slate-900');
      } else {
        btn.classList.remove('border-teal-600');
        btn.classList.remove('dark:border-cyan-400');
        btn.classList.remove('bg-teal-50/50');
        btn.classList.remove('dark:bg-slate-800/50');
        btn.classList.remove('ring-2');
        btn.classList.remove('ring-teal-600/20');
        btn.classList.add('border-slate-200');
        btn.classList.add('dark:border-slate-700');
        btn.classList.add('bg-white');
        btn.classList.add('dark:bg-slate-900');
      }
    }
  });

  const customBadge = document.getElementById('share-preset-custom-wrap');
  if (customBadge) {
    customBadge.style.display = activePreset === 'custom' ? 'flex' : 'none';
  }
}

function getShareExportOptions() {
  return {
    redactCosts: document.getElementById('shareHideCosts')?.checked ?? false,
    redactRefs: document.getElementById('shareHideRefs')?.checked ?? true,
    redactNotes: document.getElementById('shareHideNotes')?.checked ?? false
  };
}

function openShareExportDialog() {
  const modal = document.getElementById('share-export-modal');
  if (modal) modal.style.display = 'flex';
  syncPresetHighlightingFromCheckboxes();
  if (typeof refreshShareEmailDraft === 'function') refreshShareEmailDraft();
}

function closeShareExportDialog() {
  const modal = document.getElementById('share-export-modal');
  if (modal) modal.style.display = 'none';
}

function buildShareEmailSubject(tripTitle) {
  return `Travel Planner itinerary: ${formatTextValue(tripTitle, 'Travel Planner')}`;
}

function buildShareEmailBody({ tripTitle, downloadName, redactions = {}, includeAttachmentNote = false }) {
  const lines = [
    `Check out my Travel Planner itinerary: ${formatTextValue(tripTitle, 'Travel Planner')}.`,
    SHARE_APP_URL,
    '',
    `Open the app above and load the attached JSON file (${formatTextValue(downloadName, 'travel_planner_share.json')}).`
  ];

  if (redactions.costs || redactions.bookingRefs || redactions.notes) {
    const parts = [];
    if (redactions.costs) parts.push('costs');
    if (redactions.bookingRefs) parts.push('booking refs / PNRs');
    if (redactions.notes) parts.push('notes');
    lines.push('', `This share export hides: ${parts.join(', ')}.`);
  }

  if (includeAttachmentNote) {
    lines.push('', 'If your mail app does not attach the JSON automatically, use the downloaded file and attach it before sending.');
  }

  return lines.join('\n');
}

function buildShareMailtoHref(recipient, subject, body) {
  const safeRecipient = escapeTextValue(recipient);
  const params = [
    `subject=${encodeURIComponent(subject)}`,
    `body=${encodeURIComponent(body)}`
  ].join('&');
  return `mailto:${safeRecipient}?${params}`;
}

function openMailtoLink(mailtoHref) {
  const link = document.createElement('a');
  link.setAttribute('href', mailtoHref);
  link.setAttribute('rel', 'noreferrer');
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function buildShareEmailDraft() {
  const exportObj = redactShareExportPayload(buildExportPayload(), getShareExportOptions());
  const dlName = getDownloadName(currentFileName, 'travel_planner_share', '_share', '.json');
  const tripTitle = formatTextValue(titleData?.title, 'Travel Planner');
  const subject = buildShareEmailSubject(tripTitle);
  const body = buildShareEmailBody({
    tripTitle,
    downloadName: dlName,
    redactions: exportObj.meta?.redactions || {},
    includeAttachmentNote: false
  });

  return `Subject: ${subject}\n\n${body}`;
}

function refreshShareEmailDraft() {
  const draftArea = document.getElementById('shareEmailDraft');
  if (!draftArea) return '';
  const draft = buildShareEmailDraft();
  draftArea.value = draft;
  return draft;
}

async function copyShareEmailDraft() {
  const draftArea = document.getElementById('shareEmailDraft');
  const draft = draftArea && typeof draftArea.value === 'string' ? draftArea.value : refreshShareEmailDraft();

  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(draft);
    } else if (draftArea && typeof draftArea.select === 'function' && typeof document.execCommand === 'function') {
      draftArea.select();
      document.execCommand('copy');
    } else {
      throw new Error('Clipboard API unavailable');
    }

    alert('Email draft copied to clipboard.');
    return true;
  } catch (error) {
    if (draftArea && typeof draftArea.select === 'function' && typeof document.execCommand === 'function') {
      draftArea.select();
      const copied = document.execCommand('copy');
      if (copied) {
        alert('Email draft copied to clipboard.');
        return true;
      }
    }

    alert('Could not copy automatically. Select the draft and copy it manually.');
    return false;
  }
}

const SHARE_KEY_MAP = {
  meta: 'm',
  title: 't',
  subtitle: 's',
  startDate: 'sd',
  endDate: 'ed',
  startCity: 'sc',
  endCity: 'ec',
  exportKind: 'ek',
  redactions: 'r',
  costs: 'c',
  bookingRefs: 'br',
  notes: 'n',
  itinerary: 'i',
  id: 'id',
  label: 'l',
  days: 'd',
  date: 'dt',
  day: 'dy',
  from: 'f',
  to: 'to',
  desc: 'de',
  suggestedActivities: 'sa',
  transportItems: 'ti',
  accomItems: 'ai',
  activityItems: 'ac',
  text: 'tx',
  time: 'tm',
  cost: 'co',
  status: 'st',
  bookingRef: 'bref',
  externalLink: 'el',
  bookingReference: 'bref_ref',
  provider: 'pr',
  routeCode: 'rc',
  propertyName: 'pn',
  city: 'cy',
  cityName: 'cn',
  cityId: 'cid',
  checkIn: 'chin',
  checkOut: 'chout',
  checkInTime: 'cit',
  checkOutTime: 'cot',
  nights: 'ni',
  totalCost: 'tc',
  journeys: 'j',
  journeyName: 'jn',
  transportType: 'tt',
  fromLocation: 'fl',
  toLocation: 'tl',
  departureDate: 'dd',
  departureTime: 'dtm',
  arrivalDate: 'ad',
  arrivalTime: 'atm',
  cities: 'cs',
  name: 'nm',
  country: 'ct',
  packing: 'pk',
  leaveHome: 'lh'
};

const REVERSE_SHARE_KEY_MAP = {};
for (const [k, v] of Object.entries(SHARE_KEY_MAP)) {
  REVERSE_SHARE_KEY_MAP[v] = k;
}

function isPlaceholderShareItem(item) {
  if (!item || typeof item !== 'object') return false;
  const text = String(item.text || item.title || '').trim();
  if (/^[-—]$/.test(text)) return true;
  if (text === 'Add transport...' || text === 'Add accommodation...' || text === 'Explore local area' || text === 'Add item...' || text === 'New item...') {
    return true;
  }
  return false;
}

function minifySharePayload(obj) {
  if (Array.isArray(obj)) {
    return obj
      .filter(item => {
        if (isPlaceholderShareItem(item)) return false;
        return true;
      })
      .map(minifySharePayload)
      .filter(x => x !== null && x !== undefined && (typeof x !== 'object' || Object.keys(x).length > 0));
  }
  if (obj !== null && typeof obj === 'object') {
    const minified = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val === "" || val === null || val === undefined) continue;
      if (Array.isArray(val) && val.length === 0) continue;
      if (typeof val === 'object' && Object.keys(val).length === 0) continue;
      
      if ((key === 'cost' || key === 'estCost' || key === 'totalCost') && (val === '0' || val === 0 || val === '0.00')) continue;
      if (key === 'status' && val === 'pending') continue;
      if (key === 'done' && val === false) continue;
      if (key === 'completed' && val === false) continue;
      if (key === 'assignedDayIdx' && val === null) continue;

      const newKey = SHARE_KEY_MAP[key] || key;
      const minVal = minifySharePayload(val);

      if (minVal !== null && minVal !== undefined && (typeof minVal !== 'object' || Array.isArray(minVal) || Object.keys(minVal).length > 0)) {
        minified[newKey] = minVal;
      }
    }
    return minified;
  }
  return obj;
}

function expandSharePayload(obj) {
  if (Array.isArray(obj)) {
    return obj.map(expandSharePayload);
  }
  if (obj !== null && typeof obj === 'object') {
    const expanded = {};
    for (const [key, val] of Object.entries(obj)) {
      const originalKey = REVERSE_SHARE_KEY_MAP[key] || key;
      expanded[originalKey] = expandSharePayload(val);
    }
    return expanded;
  }
  return obj;
}

async function compressStringToGzipBase64(str) {
  const bytes = new TextEncoder().encode(str);
  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  writer.write(bytes);
  writer.close();
  
  const chunks = [];
  const reader = cs.readable.getReader();
  while (true) {
    const { value, done } = await reader.read();
    if (value) chunks.push(value);
    if (done) break;
  }
  
  const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const c of chunks) {
    result.set(c, offset);
    offset += c.length;
  }
  
  return btoa(String.fromCharCode(...result));
}

async function decompressGzipBase64ToString(base64) {
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array([...binary].map(c => c.charCodeAt(0)));
    
    const ds = new DecompressionStream('gzip');
    const writer = ds.writable.getWriter();
    writer.write(bytes).catch(() => {});
    writer.close().catch(() => {});
    
    const chunks = [];
    const reader = ds.readable.getReader();
    while (true) {
      const { value, done } = await reader.read();
      if (value) chunks.push(value);
      if (done) break;
    }
    
    const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const c of chunks) {
      result.set(c, offset);
      offset += c.length;
    }
    
    return new TextDecoder().decode(result);
  } catch (err) {
    console.warn('Decompression error caught:', err);
    return null;
  }
}

async function generateShareLink(exportObj) {
  const minified = minifySharePayload(exportObj);
  const jsonStr = JSON.stringify(minified);
  const compressedBase64 = await compressStringToGzipBase64(jsonStr);
  const urlSafe = compressedBase64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  return `${window.location.origin}${window.location.pathname}#trip=${urlSafe}`;
}

async function copyShareLink() {
  const exportObj = redactShareExportPayload(buildExportPayload(), getShareExportOptions());
  try {
    const shareLink = await generateShareLink(exportObj);
    if (shareLink.length > 3500) {
      const confirmDownload = confirm(
        `⚠️ This itinerary is detailed and the generated share URL is too long for standard link sharing (${shareLink.length} characters).\n\n` +
        `Would you like to download the filtered Share JSON file instead? (You can send this JSON file directly to your co-traveler).`
      );
      if (confirmDownload) {
        await exportShareJSON();
      }
      return;
    }
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(shareLink);
    } else {
      const tempInput = document.createElement('input');
      tempInput.value = shareLink;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      tempInput.remove();
    }
    alert('Share link copied to clipboard successfully!');
  } catch (error) {
    console.error('Failed to generate/copy share link:', error);
    alert('Failed to generate share link. Please try standard download or email export.');
  }
}

async function checkUrlForImportedTrip() {
  if (typeof window === 'undefined' || !window.location) return;
  
  let tripBase64 = null;
  
  if (window.location.search) {
    const params = new URLSearchParams(window.location.search);
    tripBase64 = params.get('trip');
  }
  
  if (!tripBase64 && window.location.hash) {
    const hash = window.location.hash.slice(1);
    if (hash.startsWith('trip=')) {
      tripBase64 = hash.slice(5);
    }
  }
  
  if (!tripBase64) return;

  try {
    let base64 = tripBase64.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    
    const jsonStr = await decompressGzipBase64ToString(base64);
    if (!jsonStr) throw new Error('Decompressed share link returned empty payload');

    const importedData = JSON.parse(jsonStr);
    
    let expandedData = importedData;
    if (importedData && (importedData.m || !importedData.meta)) {
      expandedData = expandSharePayload(importedData);
    }
    
    // Safety Snapshot before loading external imported trip (Issues #285 & #298)
    try {
      if (typeof getCurrentAppData === 'function') {
        const currentData = getCurrentAppData();
        const currentItinerary = (currentData && currentData.itinerary) || [];
        const hasValidLegs = Array.isArray(currentItinerary) && currentItinerary.length > 0 &&
          currentItinerary.some(leg => (leg.cityName && leg.cityName.trim() !== '') || (Array.isArray(leg.days) && leg.days.length > 0));
        
        if (hasValidLegs) {
          const currentId = (typeof getActiveTripId === 'function') ? getActiveTripId() : 'trip_default';
          if (typeof saveActiveTripToStore === 'function') {
            await saveActiveTripToStore();
          }
          if (typeof localStorage !== 'undefined') {
            try {
              localStorage.setItem('travelApp_pre_hash_backup', JSON.stringify({
                tripId: currentId,
                data: currentData,
                savedAt: new Date().toISOString()
              }));
            } catch (e) {}
          }
          if (typeof window.showToast === 'function') {
            window.showToast('🛡️ Your previous trip was safely backed up to My Trips Gallery.');
          }
        }
      }
    } catch (snapshotErr) {
      console.warn('Could not snapshot active trip before loading external hash:', snapshotErr);
    }

    clearActiveFileHandle();
    setImportedJsonWithoutWriteAccess(true);
    const importedTripId = 'trip_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    setActiveTripId(importedTripId);
    await loadImportedPayload(expandedData, 'URL Shared Trip');
    await saveActiveTripToStore();
    
    alert('🌍 Shared Travel Planner itinerary loaded successfully!');
    if (window.history && typeof window.history.replaceState === 'function') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  } catch (err) {
    console.error("Failed to decode share link:", err);
    alert('⚠️ Failed to load the shared trip link. The URL might be incomplete or corrupted.');
    if (window.history && typeof window.history.replaceState === 'function') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    checkUrlForImportedTrip();
  }, 150);
});

window.applySharePreset = applySharePreset;
window.copyShareLink = copyShareLink;
window.checkUrlForImportedTrip = checkUrlForImportedTrip;
window.loadImportedPayload = loadImportedPayload;



async function exportShareJSON() {
  const previousSuppress = window.__suppressBackupTracking;
  window.__suppressBackupTracking = true;
  try {
    await saveData(false);
  } finally {
    window.__suppressBackupTracking = previousSuppress;
  }

  const exportObj = redactShareExportPayload(buildExportPayload(), getShareExportOptions());
  const dlName = getDownloadName(currentFileName, 'travel_planner_share', '_share', '.json');
  const content = JSON.stringify(exportObj, null, 2);
  const title = formatTextValue(titleData?.title, 'Travel Planner');

  if (typeof navigator !== 'undefined' && navigator && typeof navigator.share === 'function' && typeof File === 'function') {
    try {
      const file = new File([content], dlName, { type: 'application/json' });
      if (typeof navigator.canShare !== 'function' || navigator.canShare({ files: [file] })) {
        await navigator.share({
          title,
          text: 'Shared Travel Planner itinerary',
          files: [file]
        });
        localStorage.setItem('travelApp_last_export_v2026', new Date().toISOString());
        localStorage.setItem('travelApp_last_export_filename', dlName);
        closeShareExportDialog();
        return true;
      }
    } catch (error) {
      console.warn('Native share failed, falling back to download:', error);
    }
  }

  downloadTextFile(content, dlName, 'application/json');
  localStorage.setItem('travelApp_last_export_v2026', new Date().toISOString());
  localStorage.setItem('travelApp_last_export_filename', dlName);
  closeShareExportDialog();
  return true;
}

async function exportShareEmail() {
  const previousSuppress = window.__suppressBackupTracking;
  window.__suppressBackupTracking = true;
  try {
    await saveData(false);
  } finally {
    window.__suppressBackupTracking = previousSuppress;
  }

  const exportObj = redactShareExportPayload(buildExportPayload(), getShareExportOptions());
  const dlName = getDownloadName(currentFileName, 'travel_planner_share', '_share', '.json');
  const content = JSON.stringify(exportObj, null, 2);
  const title = formatTextValue(titleData?.title, 'Travel Planner');
  const subject = buildShareEmailSubject(title);
  const body = buildShareEmailBody({
    tripTitle: title,
    downloadName: dlName,
    redactions: exportObj.meta?.redactions || {},
    includeAttachmentNote: true
  });
  const mailtoHref = buildShareMailtoHref('', subject, body);

  if (typeof navigator !== 'undefined' && navigator && typeof navigator.share === 'function' && typeof File === 'function') {
    try {
      const file = new File([content], dlName, { type: 'application/json' });
      if (typeof navigator.canShare !== 'function' || navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: subject,
          text: buildShareEmailBody({
            tripTitle: title,
            downloadName: dlName,
            redactions: exportObj.meta?.redactions || {},
            includeAttachmentNote: false
          }),
          files: [file]
        });
        localStorage.setItem('travelApp_last_export_v2026', new Date().toISOString());
        localStorage.setItem('travelApp_last_export_filename', dlName);
        closeShareExportDialog();
        return true;
      }
    } catch (error) {
      console.warn('Native email share failed, falling back to mailto:', error);
    }
  }

  downloadTextFile(content, dlName, 'application/json');
  openMailtoLink(mailtoHref);
  localStorage.setItem('travelApp_last_export_v2026', new Date().toISOString());
  localStorage.setItem('travelApp_last_export_filename', dlName);
  closeShareExportDialog();
  return true;
}

function escapeTextValue(value) {
  return String(value ?? '')
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatTextValue(value, fallback = '—') {
  const text = escapeTextValue(value);
  return text || fallback;
}

function truncateText(value, maxLength = 180) {
  const text = escapeTextValue(value);
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength - 1) + '…' : text;
}

function parseSummaryCost(value) {
  const normalized = String(value ?? '').replace(/[^0-9.-]/g, '').trim();
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatSummaryMoney(value) {
  const parsed = parseSummaryCost(value);
  if (Number.isInteger(parsed)) return `$${parsed.toFixed(0)}`;
  return `$${parsed.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}`;
}


function getExportCityName(cityId) {
  if (!cityId || !Array.isArray(citiesData)) return '';
  const city = citiesData.find(c => c.id === cityId);
  return city ? city.name : '';
}

function getExportTimelineScore(dateValue, timeValue = '', fallback = Number.MAX_SAFE_INTEGER) {
  if (typeof getTimelineScore === 'function') return getTimelineScore(dateValue, timeValue, fallback);
  if (!dateValue) return fallback;
  const normalized = typeof normalizeTripDateValue === 'function' ? normalizeTripDateValue(dateValue) : dateValue;
  const time = String(timeValue || '').trim() || '12:00';
  const date = new Date(`${normalized}T${time}:00`);
  return Number.isNaN(date.getTime()) ? fallback : date.getTime() / 60000;
}

function buildExportDailyTimelineItems(options = {}, argDay, argLegIdx, argDayIdx, argJourneysData, argStaysData) {
  let leg, day, legIdx, dayIdx, journeysData, staysData;

  if (options && typeof options === 'object' && ('leg' in options || 'day' in options)) {
    ({ leg, day, legIdx, dayIdx, journeysData = [], staysData = [] } = options);
  } else {
    leg = options;
    day = argDay;
    legIdx = argLegIdx;
    dayIdx = argDayIdx;
    journeysData = argJourneysData || [];
    staysData = argStaysData || [];
  }

  if (!day) return [];

  const dayDate = normalizeTripDateValue(day.date);
  const timelineItems = [];
  const normalizeName = value => String(value || '').trim().toLowerCase();

  journeysData.forEach((journey, journeyIdx) => {
    const depDate = normalizeTripDateValue(journey.departureDate || journey.dayDate || '');
    const arrDate = normalizeTripDateValue(journey.arrivalDate || journey.dayDate || journey.departureDate || '');
    const legMatch = journey.legId && leg.id && journey.legId === leg.id;
    const dateMatch = depDate === dayDate || arrDate === dayDate;
    const routeMatch = (
      normalizeName(journey.fromLocation) === normalizeName(day.from) ||
      normalizeName(journey.toLocation) === normalizeName(day.to) ||
      normalizeName(journey.fromLocation) === normalizeName(day.to) ||
      normalizeName(journey.toLocation) === normalizeName(day.from)
    );
    if (!dateMatch || (!legMatch && !routeMatch)) return;

    const route = [journey.fromLocation, journey.toLocation].filter(Boolean).join(' -> ');
    const time = [journey.departureTime, journey.arrivalTime].filter(Boolean).join('-') || 'Anytime';
    const parts = [
      time,
      `Transport: ${formatTextValue(journey.journeyName || route, 'Journey')}`,
      formatTextValue(journey.provider, ''),
      formatTextValue(journey.routeCode, ''),
      journey.bookingReference ? `Ref ${formatTextValue(journey.bookingReference)}` : '',
      journey.cost ? formatSummaryMoney(journey.cost) : ''
    ].filter(Boolean);
    timelineItems.push({
      sortValue: getExportTimelineScore(depDate || dayDate, journey.departureTime, journeyIdx),
      text: parts.join(' | ')
    });
  });

  staysData.forEach((stay, stayIdx) => {
    const cityName = stay.city || stay.cityName || getExportCityName(stay.cityId);
    const cityMatches = !cityName || [day.from, day.to].some(name => normalizeName(name) === normalizeName(cityName));
    const checkIn = normalizeTripDateValue(stay.checkIn || '');
    const checkOut = normalizeTripDateValue(stay.checkOut || '');
    if (cityMatches && checkIn === dayDate) {
      const time = stay.checkInTime || '15:00';
      timelineItems.push({
        sortValue: getExportTimelineScore(dayDate, time, 2000 + stayIdx),
        text: [time, `Stay check-in: ${formatTextValue(stay.propertyName, 'Accommodation')}`, stay.provider, stay.bookingRef ? `Ref ${formatTextValue(stay.bookingRef)}` : '', stay.totalCost ? formatSummaryMoney(stay.totalCost) : ''].filter(Boolean).join(' | ')
      });
    }
    if (cityMatches && checkOut === dayDate) {
      const time = stay.checkOutTime || '11:00';
      timelineItems.push({
        sortValue: getExportTimelineScore(dayDate, time, 2500 + stayIdx),
        text: [time, `Stay check-out: ${formatTextValue(stay.propertyName, 'Accommodation')}`, stay.bookingRef ? `Ref ${formatTextValue(stay.bookingRef)}` : ''].filter(Boolean).join(' | ')
      });
    }
  });

  (day.activityItems || []).forEach((item, itemIdx) => {
    let time = 'Anytime';
    if (item.startTime) {
      time = item.endTime ? `${item.startTime}-${item.endTime}` : item.startTime;
    }
    timelineItems.push({
      sortValue: getExportTimelineScore(dayDate, item.startTime, 4000 + itemIdx),
      text: [time, `Activity: ${formatTextValue(item.text)}`, item.time ? `Duration ${formatTextValue(item.time)}` : '', item.cost ? formatSummaryMoney(item.cost) : ''].filter(Boolean).join(' | ')
    });
  });

  return timelineItems.sort((a, b) => a.sortValue - b.sortValue);
}

async function exportItineraryText() {
  const previousSuppress = window.__suppressBackupTracking;
  window.__suppressBackupTracking = true;
  try {
    await saveData(false);
  } finally {
    window.__suppressBackupTracking = previousSuppress;
  }

  const journeysData = typeof journeys !== 'undefined'
    ? normalizeTripJourneysData(JSON.parse(JSON.stringify(journeys)))
    : [];
  const staysData = typeof stays !== 'undefined'
    ? normalizeTripStaysData(JSON.parse(JSON.stringify(stays)))
    : [];
  const itineraryData = normalizeTripLegsData(JSON.parse(JSON.stringify(appData || [])));
  const packing = Array.isArray(packingData) ? packingData : [];
  const leaveHome = Array.isArray(leaveHomeData) ? leaveHomeData : [];
  const hotelCheckout = Array.isArray(hotelCheckoutData) ? hotelCheckoutData : [];

  const tripTitle = formatTextValue(titleData?.title, 'Untitled Trip');
  const tripSubtitle = formatTextValue(titleData?.subtitle, '');
  const generatedAt = new Date().toLocaleString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const sections = [];
  sections.push(`TRIP ITINERARY EXPORT`);
  sections.push(`Title: ${tripTitle}`);
  if (tripSubtitle) sections.push(`Subtitle: ${tripSubtitle}`);
  sections.push(`Generated: ${generatedAt}`);
  sections.push(`File: ${formatTextValue(currentFileName, 'Default Template')}`);
  sections.push('');

  if (Array.isArray(itineraryData) && itineraryData.length > 0) {
    sections.push(`LEG BREAKDOWN`);
    itineraryData.forEach((leg, legIdx) => {
      const legName = formatTextValue(leg.label, `Leg ${legIdx + 1}`);
      sections.push(`\n[Leg ${legIdx + 1}] ${legName}`);
      if (Array.isArray(leg.days) && leg.days.length > 0) {
        leg.days.forEach((day, dayIdx) => {
          const dayTitle = [day.date, day.day].filter(Boolean).join(' ');
          const dayParts = [
            `Day ${dayIdx + 1}: ${formatTextValue(dayTitle, '—')}`,
            `${formatTextValue(day.from)} -> ${formatTextValue(day.to)}`
          ];
          if (day.desc) dayParts.push(`Desc: ${truncateText(day.desc, 90)}`);
          sections.push(`  - ${dayParts.join(' | ')}`);
          const timelineItems = buildExportDailyTimelineItems({ leg, day, legIdx, dayIdx, journeysData, staysData });
          if (timelineItems.length > 0) {
            sections.push('    Agenda:');
            timelineItems.forEach(item => {
              sections.push(`      - ${item.text}`);
            });
          }
          if (Array.isArray(day.transportItems) && day.transportItems.length > 0) {
            day.transportItems.forEach(item => {
              const transportParts = [
                formatTextValue(item.text),
                `D ${formatTextValue(item.departureDate || day.date, '—')}${item.departureTime ? ` ${item.departureTime}` : ''}`,
                `A ${formatTextValue(item.arrivalDate || day.date, '—')}${item.arrivalTime ? ` ${item.arrivalTime}` : ''}`,
                `$${formatTextValue(item.cost, '0')}`,
                formatTextValue(item.status, 'planned')
              ];
              if (item.bookingRef) transportParts.push(`Ref ${formatTextValue(item.bookingRef)}`);
              sections.push(`    • ${transportParts.join(' | ')}`);
            });
          }
          if (Array.isArray(day.accomItems) && day.accomItems.length > 0) {
            day.accomItems.forEach(item => {
              const accomParts = [
                formatTextValue(item.text),
                `Check-in ${formatTextValue(day.date, '—')}`,
                `$${formatTextValue(item.cost, '0')}`,
                formatTextValue(item.status, 'planned')
              ];
              if (item.bookingRef) accomParts.push(`Ref ${formatTextValue(item.bookingRef)}`);
              sections.push(`    • ${accomParts.join(' | ')}`);
            });
          }
          if (Array.isArray(day.activityItems) && day.activityItems.length > 0) {
            day.activityItems.forEach(item => {
              sections.push(`    • ${formatTextValue(item.text)} | ${formatTextValue(item.time, '—')} | $${formatTextValue(item.cost, '0')}`);
            });
          }
        });
      }
    });
  }

  if (journeysData.length > 0) {
    sections.push(`\nTRANSPORT BOOKINGS`);
    journeysData.forEach((journey, idx) => {
      const route = [journey.fromLocation, journey.toLocation].filter(Boolean).join(' -> ');
      const dep = [journey.departureDate, journey.departureTime].filter(Boolean).join(' ');
      const arr = [journey.arrivalDate, journey.arrivalTime].filter(Boolean).join(' ');
      const journeyParts = [
        `${idx + 1}. ${formatTextValue(journey.journeyName || route, 'Journey')}`,
        formatTextValue(journey.transportType, '—'),
        formatTextValue(route),
        `D ${formatTextValue(dep)}`,
        `A ${formatTextValue(arr)}`,
        formatTextValue(journey.provider),
        formatTextValue(journey.routeCode),
        formatTextValue(journey.status, 'planned'),
        `$${formatTextValue(journey.cost, '0')}`
      ];
      if (journey.bookingReference) journeyParts.push(`Ref ${formatTextValue(journey.bookingReference)}`);
      if (journey.notes) journeyParts.push(`Notes ${truncateText(journey.notes, 80)}`);
      sections.push(`  - ${journeyParts.join(' | ')}`);
    });
  }

  if (staysData.length > 0) {
    sections.push(`\nACCOMMODATION BOOKINGS`);
    staysData.forEach((stay, idx) => {
      const stayParts = [
        `${idx + 1}. ${formatTextValue(stay.propertyName, 'Stay')}`,
        formatTextValue(stay.cityName || stay.city || stay.cityId),
        `In ${formatTextValue(stay.checkIn)}`,
        `Out ${formatTextValue(stay.checkOut)}`,
        `${formatTextValue(stay.nights, '0')} nights`,
        formatTextValue(stay.status, 'planned'),
        `$${formatTextValue(stay.totalCost, '0')}`
      ];
      if (stay.provider) stayParts.push(formatTextValue(stay.provider));
      if (stay.bookingRef) stayParts.push(`Ref ${formatTextValue(stay.bookingRef)}`);
      if (stay.notes) stayParts.push(`Notes ${truncateText(stay.notes, 80)}`);
      sections.push(`  - ${stayParts.join(' | ')}`);
    });
  }

  if (packing.length > 0) {
    sections.push(`\nPACKING`);
    packing.forEach((area, idx) => {
      const areaName = formatTextValue(area.areaName || area.label, `Packing Area ${idx + 1}`);
      sections.push(`  - ${areaName}`);
      (area.categories || []).forEach(category => {
        const itemNames = (category.items || [])
          .map(item => `${formatTextValue(item.text || item.title)}${item.done ? ' [done]' : ''}`)
          .filter(Boolean)
          .join(', ');
        if (itemNames) sections.push(`    ${formatTextValue(category.title, 'Category')}: ${itemNames}`);
      });
    });
  }

  if (leaveHome.length > 0) {
    sections.push(`\nBEFORE LEAVING HOME`);
    leaveHome.forEach((item, idx) => {
      if (item.kind === 'section') {
        sections.push(`  [${formatTextValue(item.text, `Section ${idx + 1}`)}]`);
      } else {
        sections.push(`  - ${formatTextValue(item.text)}${item.done ? ' [done]' : ''}`);
      }
    });
  }

  sections.push('');
  sections.push('END OF EXPORT');

  let dlName = currentFileName;
  if (dlName === 'Default Template') dlName = 'travel_planner_itinerary.txt';
  else dlName = dlName.replace(/\.json$/i, '') + '_itinerary.txt';

  downloadTextFile(sections.join('\n'), dlName);
}

async function exportItinerarySummaryText() {
  const previousSuppress = window.__suppressBackupTracking;
  window.__suppressBackupTracking = true;
  try {
    await saveData(false);
  } finally {
    window.__suppressBackupTracking = previousSuppress;
  }

  const journeysData = typeof journeys !== 'undefined'
    ? normalizeTripJourneysData(JSON.parse(JSON.stringify(journeys)))
    : [];
  const staysData = typeof stays !== 'undefined'
    ? normalizeTripStaysData(JSON.parse(JSON.stringify(stays)))
    : [];
  const itineraryData = normalizeTripLegsData(JSON.parse(JSON.stringify(appData || [])));

  const tripTitle = formatTextValue(titleData?.title, 'Untitled Trip');
  const tripSubtitle = formatTextValue(titleData?.subtitle, '');
  const generatedAt = new Date().toLocaleString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  let transportTotal = 0;
  let accomTotal = 0;
  let activityTotal = 0;

  itineraryData.forEach(leg => {
    (leg.days || []).forEach(day => {
      (day.activityItems || []).forEach(item => { activityTotal += parseSummaryCost(item.cost); });
    });
  });
  journeysData.forEach(journey => { transportTotal += parseSummaryCost(journey.cost); });
  staysData.forEach(stay => { accomTotal += parseSummaryCost(stay.totalCost); });

  const lines = [];
  lines.push('AI ITINERARY SUMMARY');
  lines.push(`Title: ${tripTitle}`);
  if (tripSubtitle) lines.push(`Subtitle: ${tripSubtitle}`);
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`File: ${formatTextValue(currentFileName, 'Default Template')}`);
  lines.push(`Budget: Transport ${formatSummaryMoney(transportTotal)} | Accommodation ${formatSummaryMoney(accomTotal)} | Activities ${formatSummaryMoney(activityTotal)} | Total ${formatSummaryMoney(transportTotal + accomTotal + activityTotal)}`);
  lines.push('');

  if (Array.isArray(itineraryData) && itineraryData.length > 0) {
    lines.push('ITINERARY');
    itineraryData.forEach((leg, legIdx) => {
      const legName = formatTextValue(leg.label, `Leg ${legIdx + 1}`);
      const dateList = (leg.days || []).map(day => formatTextValue(day.date)).filter(Boolean);
      const daySpan = dateList.length > 0 ? `${dateList[0]} -> ${dateList[dateList.length - 1]}` : '—';
      lines.push(`- ${legName} | ${daySpan}`);
      (leg.days || []).forEach((day, dayIdx) => {
        const dayLabel = [day.date, day.day].filter(Boolean).join(' ');
        const summaryBits = [];
        if (day.from || day.to) summaryBits.push(`${formatTextValue(day.from)} -> ${formatTextValue(day.to)}`);
        if (Array.isArray(day.transportItems) && day.transportItems.length > 0) summaryBits.push(`Transport ${day.transportItems.length}`);
        if (Array.isArray(day.accomItems) && day.accomItems.length > 0) summaryBits.push(`Stay ${day.accomItems.length}`);
        if (Array.isArray(day.activityItems) && day.activityItems.length > 0) summaryBits.push(`Activities ${day.activityItems.length}`);
        if (day.desc) summaryBits.push(`Note ${truncateText(day.desc, 60)}`);
        lines.push(`  ${formatTextValue(dayLabel)} | ${summaryBits.join(' | ') || 'No details'}`);
        const timelineItems = buildExportDailyTimelineItems({ leg, day, legIdx, dayIdx, journeysData, staysData });
        timelineItems.forEach(item => {
          lines.push(`    - ${item.text}`);
        });
      });
    });
  }

  if (journeysData.length > 0) {
    lines.push('');
    lines.push('TRANSPORT BOOKINGS');
    journeysData.forEach((journey, idx) => {
      const route = [journey.fromLocation, journey.toLocation].filter(Boolean).join(' -> ');
      const dep = [journey.departureDate, journey.departureTime].filter(Boolean).join(' ');
      const arr = [journey.arrivalDate, journey.arrivalTime].filter(Boolean).join(' ');
      const journeyParts = [
        `${idx + 1}. ${formatTextValue(journey.journeyName || route, 'Journey')}`,
        formatTextValue(journey.transportType, '—'),
        formatTextValue(route, '—'),
        `D ${formatTextValue(dep)}`,
        `A ${formatTextValue(arr)}`,
        formatTextValue(journey.provider, '—'),
        formatTextValue(journey.routeCode, '—'),
        formatTextValue(journey.status, 'planned'),
        formatSummaryMoney(journey.cost)
      ];
      if (journey.bookingReference) journeyParts.push(`Ref ${formatTextValue(journey.bookingReference)}`);
      lines.push(`- ${journeyParts.join(' | ')}`);
    });
  }

  if (staysData.length > 0) {
    lines.push('');
    lines.push('ACCOMMODATION BOOKINGS');
    staysData.forEach((stay, idx) => {
      const stayParts = [
        `${idx + 1}. ${formatTextValue(stay.propertyName, 'Stay')}`,
        formatTextValue(stay.cityName || stay.city || stay.cityId, '—'),
        `In ${formatTextValue(stay.checkIn)}`,
        `Out ${formatTextValue(stay.checkOut)}`,
        `${formatTextValue(stay.nights, '0')} nights`,
        formatTextValue(stay.status, 'planned'),
        formatSummaryMoney(stay.totalCost)
      ];
      if (stay.provider) stayParts.push(formatTextValue(stay.provider));
      if (stay.bookingRef) stayParts.push(`Ref ${formatTextValue(stay.bookingRef)}`);
      lines.push(`- ${stayParts.join(' | ')}`);
    });
  }

  lines.push('');
  lines.push('NOTES FOR AI REVIEW');
  lines.push('- This summary excludes packing and before-leaving-home checklists to keep the file compact.');
  lines.push('- Use this for a concise itinerary review prompt.');
  lines.push('');
  lines.push('END OF SUMMARY');

  let dlName = currentFileName;
  if (dlName === 'Default Template') dlName = 'travel_planner_ai_summary.txt';
  else dlName = dlName.replace(/\.json$/i, '') + '_ai_summary.txt';

  downloadTextFile(lines.join('\n'), dlName);

  localStorage.setItem('travelApp_last_export_v2026', new Date().toISOString());
  localStorage.setItem('travelApp_last_export_filename', dlName);
}

// Expose city dialog functions to window scope
window.openCityDialog = openCityDialog;
window.closeCityDialog = closeCityDialog;
window.addNewCityFromDialog = addNewCityFromDialog;
window.updateCityCountry = updateCityCountry;
window.deleteCityFromDialog = deleteCityFromDialog;
window.populateCityList = populateCityList;

async function loadImportedPayload(importedData, fileName) {
  resetAppStateToDefaults();

  if (!importedData.itinerary) {
    if (Array.isArray(importedData)) {
      importedData = { itinerary: importedData };
    } else {
      console.warn('Missing itinerary data in import, using default');
      importedData.itinerary = JSON.parse(JSON.stringify(DEFAULT_TRIP_DATA.itinerary));
    }
  } else if (!Array.isArray(importedData.itinerary)) {
    throw new Error('Invalid itinerary format. Expected an array of trip legs.');
  }

  appData = normalizeTripLegsData(importedData.itinerary);

  appData.forEach(leg => {
    if (!leg.legTips) {
      leg.legTips = [];
      leg.days.forEach(day => {
        if (day.tips && day.tips.length > 0) leg.legTips.push(...day.tips);
        delete day.tips;
      });
    }
    if (leg.cityRun && leg.cityRun.length > 0 && typeof leg.cityRun[0] === 'string') {
      leg.cityRun = leg.cityRun.map(r => ({ title: r, estTime: '1 hr', estCost: '0', assignedDayIdx: null }));
    }
    if (!leg.suggestedActivities) {
      leg.suggestedActivities = [];
      if (leg.cityRun && leg.cityRun.length > 0) {
        leg.cityRun.forEach(r => {
          leg.suggestedActivities.push({
            title: r.title,
            category: 'fitness',
            estTime: r.estTime || '1 hr',
            estCost: r.estCost || '0',
            assignedDayIdx: r.assignedDayIdx !== undefined ? r.assignedDayIdx : null
          });
        });
      }
      if (leg.suggestedSights && leg.suggestedSights.length > 0) {
        leg.suggestedSights.forEach(s => {
          leg.suggestedActivities.push({
            title: s.title,
            category: 'sight',
            estTime: s.estTime || '1 hr',
            estCost: s.estCost || '0',
            assignedDayIdx: s.assignedDayIdx !== undefined ? s.assignedDayIdx : null
          });
        });
      }
      delete leg.cityRun;
      delete leg.suggestedSights;
    }
  });

  if (importedData.packing && Array.isArray(importedData.packing)) {
    const migrated = migratePacking(importedData.packing);
    packingData = ensureDefaultPackingAreas(migrated || DEFAULT_PACKING);
  } else {
    packingData = JSON.parse(JSON.stringify(DEFAULT_PACKING));
  }
  if (importedData.leaveHome && Array.isArray(importedData.leaveHome)) {
    leaveHomeData = mergeChecklistWithDefaults(importedData.leaveHome);
    hotelCheckoutData = mergeChecklistWithDefaults(importedData.hotelCheckout, DEFAULT_HOTEL_CHECKOUT);
  } else {
    leaveHomeData = JSON.parse(JSON.stringify(DEFAULT_LEAVE_HOME));
  }
  if (importedData.meta) {
    if (importedData.meta.title) titleData.title = importedData.meta.title;
    if (importedData.meta.subtitle) titleData.subtitle = importedData.meta.subtitle;
  } else if (fileName && fileName !== 'Default Template') {
    const cleanName = fileName.replace(/\.json$/i, '').replace(/[_-]/g, ' ');
    titleData.title = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
    titleData.subtitle = 'Imported trip file';
  }
  const titleEl = document.getElementById('mainTitle');
  const subtitleEl = document.getElementById('mainSubtitle');
  if (titleEl) titleEl.innerText = titleData.title;
  if (subtitleEl) subtitleEl.innerText = titleData.subtitle;
  localStorage.setItem('travelApp_meta_template', JSON.stringify(titleData));

  let transitCitiesToAdd = [];
  if (importedData.journeys && Array.isArray(importedData.journeys)) {
    transitCitiesToAdd = getIntermediateJourneyCities(importedData.journeys);
    journeys = normalizeTripJourneysData(importedData.journeys);
    window.journeys = journeys;
    localStorage.setItem("travelApp_journeys_v1", JSON.stringify(journeys));
  } else {
    journeys = [];
    window.journeys = journeys;
  }

  let stayCitiesToAdd = [];
  if (importedData.stays && Array.isArray(importedData.stays)) {
    stays = normalizeTripStaysData(importedData.stays);
    window.stays = stays;
    importedData.stays.forEach(stay => {
      if (stay.city || stay.cityId) {
        stayCitiesToAdd.push({ city: stay.city || '', cityId: stay.cityId || '' });
      }
    });
  } else {
    stays = [];
    window.stays = stays;
  }

  userCities = Array.isArray(importedData.userCities) ? importedData.userCities : [];
  userCountries = Array.isArray(importedData.userCountries) ? importedData.userCountries : [];
  localStorage.setItem('travelApp_userCities_v1', JSON.stringify(userCities));
  localStorage.setItem('travelApp_userCountries_v1', JSON.stringify(userCountries));

  if (importedData.cities && Array.isArray(importedData.cities)) {
    citiesData = normalizeImportedCities(importedData);
    normalizeTripCitiesDateData(citiesData);
    if (importedData.userCities && Array.isArray(importedData.userCities)) {
      userCities = importedData.userCities;
    } else {
      userCities = [];
    }
    localStorage.setItem('travelApp_userCities_v1', JSON.stringify(userCities));

    if (importedData.userCountries && Array.isArray(importedData.userCountries)) {
      userCountries = importedData.userCountries;
    } else {
      userCountries = [];
    }
    localStorage.setItem('travelApp_userCountries_v1', JSON.stringify(userCountries));
  } else {
    citiesData = typeof DEFAULT_CITIES !== 'undefined' ? JSON.parse(JSON.stringify(DEFAULT_CITIES)) : [];
    citiesData = extractCitiesFromItinerary();
    normalizeTripCitiesDateData(citiesData);
    if (importedData.userCities && Array.isArray(importedData.userCities)) {
      userCities = importedData.userCities;
    } else {
      userCities = [];
    }
    localStorage.setItem('travelApp_userCities_v1', JSON.stringify(userCities));

    if (importedData.userCountries && Array.isArray(importedData.userCountries)) {
      userCountries = importedData.userCountries;
    } else {
      userCountries = [];
    }
    localStorage.setItem('travelApp_userCountries_v1', JSON.stringify(userCountries));
  }

  if (typeof createCityDatalists === 'function') {
    createCityDatalists();
  }

  stayCitiesToAdd.forEach(stayInfo => {
    const cityName = typeof stayInfo === 'string' ? stayInfo : (stayInfo?.city || '');
    const cityId = typeof stayInfo === 'object' ? (stayInfo?.cityId || '') : '';

    let existing = null;
    if (cityId) {
      existing = citiesData.find(c => c.id === cityId);
    }
    if (!existing && cityName) {
      existing = citiesData.find(c => c.name.toLowerCase() === cityName.toLowerCase());
    }
    if (!existing && cityName) {
      // Reconcile alias or prefix match (e.g. "Bali" and "Denpasar Bali")
      const sLower = cityName.toLowerCase();
      existing = citiesData.find(c => {
        const cLower = (c.name || '').toLowerCase();
        return cLower.includes(sLower) || sLower.includes(cLower);
      });
    }

    if (!existing && cityName) {
      addOrUpdateCity({ cityName });
    } else if (existing && existing.isTransit === true) {
      delete existing.isTransit;
      if (existing.colour === '#95a5a6') existing.colour = getRandomCityColor();
    }
  });

  const transitSkipList = [
    'departure', 'arrival', 'in transit', 'between cities', 'tbc', 'return', 'home',
    'start', 'return home', 'trip start', 'trip finish', 'trip return', 'home departure',
    'departure from home', 'flight home', 'travel day'
  ];
  const legLabelCities = [];
  if (importedData.itinerary && Array.isArray(importedData.itinerary)) {
    importedData.itinerary.forEach(leg => {
      let label = leg.label || '';
      let cityFromLabel = label
        .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '')
        .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
        .replace(/[\u{2600}-\u{26FF}]/gu, '')
        .replace(/[\u{2700}-\u{27BF}]/gu, '')
        .replace(/\p{Emoji}/gu, '')
        .replace(/\s*\([^)]*\)/gu, '')
        .replace(/[^\w\s-]/gu, '')
        .trim();

      const lowerCityFromLabel = cityFromLabel.toLowerCase();
      const isSkip = transitSkipList.some(skip => lowerCityFromLabel === skip || lowerCityFromLabel.startsWith(skip) || lowerCityFromLabel.endsWith(skip));
      const isStartOrReturnLeg = leg.id && (leg.id === 'leg-start' || leg.id === 'leg-return' || leg.id.startsWith('leg-start') || leg.id.startsWith('leg-return'));

      // Also check if leg already maps to an existing city in citiesData
      const legMatchesExistingCity = citiesData.some(c => {
        if (leg.cityId && c.id === leg.cityId) return true;
        if (leg.id && (c.id === leg.id || c.id === 'city-' + leg.id.replace(/^leg-/, ''))) return true;
        const cNameLower = (c.name || '').toLowerCase();
        if (cNameLower && (lowerCityFromLabel === cNameLower || lowerCityFromLabel.startsWith(cNameLower) || cNameLower.startsWith(lowerCityFromLabel))) return true;
        return false;
      });

      if (cityFromLabel && !isSkip && !isStartOrReturnLeg && !legMatchesExistingCity) {
        let cityInDays = false;
        (leg.days || []).forEach(day => {
          if (day.from === cityFromLabel || day.to === cityFromLabel) cityInDays = true;
        });
        if (!cityInDays) {
          legLabelCities.push(cityFromLabel);
        }
      }
    });
  }

  const allTransitCities = [...new Set([...transitCitiesToAdd, ...legLabelCities])];
  allTransitCities.forEach(cityName => {
    let existing = citiesData.find(c => c.name.toLowerCase() === cityName.toLowerCase());

    if (!existing) {
      const newCity = {
        id: 'city-' + cityName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: cityName,
        country: '',
        code: '',
        countryCode: '',
        dateFrom: '',
        dateTo: '',
        colour: '#95a5a6',
        isTransit: true
      };
      normalizeCityLocationData(newCity);
      citiesData.push(newCity);
    }
  });

  if (typeof migrateJourneyCityIds === 'function') {
    migrateJourneyCityIds();
  }

  if (importedData.stays && Array.isArray(importedData.stays)) {
    stays = importedData.stays;
    window.stays = stays;
    localStorage.setItem('travelApp_stays_v1', JSON.stringify(importedData.stays));
  }

  currentFileName = fileName;
  localStorage.setItem('travelApp_filename_v2026', currentFileName);
  localStorage.setItem('travelApp_last_import_v2026', new Date().toISOString());

  if (typeof displayTimestampStatus === 'function') displayTimestampStatus();

  const savedTitle = titleData.title;
  const savedSubtitle = titleData.subtitle;
  const previousSuppress = window.__suppressBackupTracking;
  window.__suppressBackupTracking = true;
  try {
    await saveData(false);
  } finally {
    window.__suppressBackupTracking = previousSuppress;
  }
  if (savedTitle) { titleData.title = savedTitle; localStorage.setItem('travelApp_meta_template', JSON.stringify(titleData)); }
  if (savedSubtitle) { titleData.subtitle = savedSubtitle; localStorage.setItem('travelApp_meta_template', JSON.stringify(titleData)); }

  if (typeof buildNav === 'function') buildNav();
  if (typeof buildItinerary === 'function') buildItinerary();
  if (typeof buildAccomTab === 'function') buildAccomTab();
  if (typeof buildTransportTab === 'function') buildTransportTab();
  if (typeof buildBudgetTab === 'function') buildBudgetTab();
  if (typeof buildPackingTab === 'function') buildPackingTab();
  if (typeof buildCityNav === 'function') buildCityNav();
  if (typeof buildJourneyMap === 'function') buildJourneyMap();
  if (typeof populateCityList === 'function') populateCityList();
  if (typeof checkAndPromptCityAudit === 'function') checkAndPromptCityAudit();
  if (typeof autoResolveMissingTripCities === 'function') {
    setTimeout(() => { autoResolveMissingTripCities(); }, 100);
  }
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

// Expose data functions to window scope for HTML onclick handlers
window.exportJSON = exportJSON;
window.buildExportPayload = buildExportPayload;
window.loadImportedPayload = loadImportedPayload;
window.exportShareJSON = exportShareJSON;
window.exportShareEmail = exportShareEmail;
window.copyShareEmailDraft = copyShareEmailDraft;
window.refreshShareEmailDraft = refreshShareEmailDraft;
window.exportItineraryText = exportItineraryText;
window.exportItinerarySummaryText = exportItinerarySummaryText;
window.exportItineraryCalendar = exportItineraryCalendar;

window.openShareExportDialog = openShareExportDialog;
window.closeShareExportDialog = closeShareExportDialog;
window.hardRestartApp = hardRestartApp;
window.factoryResetData = factoryResetData;
window.importJSON = importJSON;
window.openTripFile = openTripFile;
window.openExistingTripFile = openExistingTripFile;
window.saveFileToDisk = saveFileToDisk;
window.getCurrentAppData = getCurrentAppData;
window.undoTripChange = undoTripChange;
window.redoTripChange = redoTripChange;
window.hasActiveFileHandle = hasActiveFileHandle;
window.hasFileWriteFailed = hasFileWriteFailed;
window.isSavingToFile = isSavingToFile;
window.isJsonWriteWarningActive = isJsonWriteWarningActive;
window.setImportedJsonWithoutWriteAccess = setImportedJsonWithoutWriteAccess;
window.syncJsonWriteWarning = syncJsonWriteWarning;
window.getActiveFileHandleName = getActiveFileHandleName;
window.setActiveFileHandle = setActiveFileHandle;
window.clearActiveFileHandle = clearActiveFileHandle;
window.isFSASupported = isFSASupported;
window.addOrUpdateCity = addOrUpdateCity;
window.saveData = saveData;
window.createCityDatalists = createCityDatalists;

window.addEventListener('DOMContentLoaded', syncJsonWriteWarning);
window.updateCityCountryCode = updateCityCountryCode;
window.populateCountrySelect = populateCountrySelect;
window.setupCityAutocomplete = setupCityAutocomplete;
window.renameCityInDialog = renameCityInDialog;
window.refetchCityLocationAndFlag = refetchCityLocationAndFlag;
window.auditCityHealth = auditCityHealth;
window.checkAndPromptCityAudit = checkAndPromptCityAudit;
window.repairAllCityMetadata = repairAllCityMetadata;
window.refetchAllCityMetadata = repairAllCityMetadata;





async function exportItineraryCalendar() {
  const previousSuppress = window.__suppressBackupTracking;
  window.__suppressBackupTracking = true;
  try {
    const title = (appData.length > 0 && titleData.tripTitle) ? titleData.tripTitle : 'Trip Itinerary';
    
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Trentan//Travel Planner//EN',
      'CALSCALE:GREGORIAN',
      'X-WR-CALNAME:' + title
    ];
    
    function addEvent(start, end, summary, description, location) {
      if (!start) return;
      const uid = Math.random().toString(36).substring(2) + '@travelplanner.local';
      const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      icsContent.push('BEGIN:VEVENT');
      icsContent.push('UID:' + uid);
      icsContent.push('DTSTAMP:' + dtstamp);
      
      if (start.includes('T')) {
        icsContent.push('DTSTART:' + start);
        if (end) icsContent.push('DTEND:' + end);
      } else {
        icsContent.push('DTSTART;VALUE=DATE:' + start);
        if (end) icsContent.push('DTEND;VALUE=DATE:' + end);
      }
      
      if (summary) icsContent.push('SUMMARY:' + summary);
      if (description) icsContent.push('DESCRIPTION:' + description.replace(/\n/g, '\\n'));
      if (location) icsContent.push('LOCATION:' + location);
      icsContent.push('END:VEVENT');
    }
    
    function formatIcsDate(dateStr, timeStr = '') {
      if (!dateStr) return '';
      const d = dateStr.replace(/-/g, '');
      if (!timeStr) return d;
      const t = timeStr.replace(/:/g, '');
      return d + 'T' + (t + '000000').substring(0,6);
    }
    
    if (appData && Array.isArray(appData)) {
      appData.forEach(leg => {
        if (!leg.days) return;
        leg.days.forEach(day => {
          if (!day.date) return;
          const start = formatIcsDate(day.date);
          
          const dObj = new Date(day.date);
          dObj.setDate(dObj.getDate() + 1);
          const end = dObj.toISOString().split('T')[0].replace(/-/g, '');
          
          let summary = day.to ? '📍 ' + day.to : (leg.city ? '📍 ' + leg.city : '📍 Destination');
          let desc = '';
          if (day.sights && day.sights.length > 0) {
            desc = "Planned Activities:\n" + day.sights.map(s => "- " + (s.name || s.title)).join('\n');
          }
          addEvent(start, end, summary, desc, day.to || leg.city);
        });
      });
    }
    
    if (typeof stays !== 'undefined' && Array.isArray(stays)) {
      stays.forEach(stay => {
        if (!stay.checkIn) return;
        
        let start = formatIcsDate(stay.checkIn, stay.checkInTime);
        let end = formatIcsDate(stay.checkOut, stay.checkOutTime);
        
        if (!stay.checkInTime && !stay.checkOutTime) {
          start = formatIcsDate(stay.checkIn);
          if (stay.checkOut) {
             const dObj = new Date(stay.checkOut);
             if (stay.checkOut === stay.checkIn) dObj.setDate(dObj.getDate() + 1);
             end = dObj.toISOString().split('T')[0].replace(/-/g, '');
          }
        }
        
        const summary = '🏨 ' + (stay.name || 'Accommodation');
        let desc = '';
        if (stay.bookingRef) desc += 'Booking Ref: ' + stay.bookingRef + '\n';
        if (stay.notes) desc += 'Notes: ' + stay.notes + '\n';
        if (stay.provider) desc += 'Provider: ' + stay.provider + '\n';
        
        let location = stay.location || stay.neighborhood || '';
        
        addEvent(start, end, summary, desc, location);
      });
    }
    
    if (typeof journeys !== 'undefined' && Array.isArray(journeys)) {
      journeys.forEach(journey => {
        const jDate = journey.departureDate || journey.dayDate;
        if (!jDate) return;
        
        const start = formatIcsDate(jDate, journey.departureTime);
        let end = formatIcsDate(journey.arrivalDate || jDate, journey.arrivalTime);
        
        if (start.includes('T') && !end) {
          end = start; 
        }
        
        const method = journey.method ? journey.method.charAt(0).toUpperCase() + journey.method.slice(1) : 'Transport';
        const summary = '🚆 ' + method + ': ' + (journey.fromLocation || '?') + ' to ' + (journey.toLocation || '?');
        
        let desc = '';
        if (journey.provider) desc += 'Provider: ' + journey.provider + '\n';
        if (journey.bookingReference) desc += 'Booking Ref: ' + journey.bookingReference + '\n';
        if (journey.departureStation) desc += 'Departs: ' + journey.departureStation + '\n';
        if (journey.arrivalStation) desc += 'Arrives: ' + journey.arrivalStation + '\n';
        if (journey.notes) desc += 'Notes: ' + journey.notes + '\n';
        
        addEvent(start, end, summary, desc, '');
      });
    }
    
    icsContent.push('END:VCALENDAR');
    const finalContent = icsContent.join('\r\n'); 
    
    let dlName = currentFileName || 'trip';
    dlName = dlName.replace(/\.json$/i, '') + '_calendar.ics';
    
    downloadTextFile(finalContent, dlName, 'text/calendar');
    
    localStorage.setItem('travelApp_last_export_v2026', new Date().toISOString());
    localStorage.setItem('travelApp_last_export_filename', dlName);
  } catch (err) {
    console.error('Error exporting calendar:', err);
    alert('Failed to generate calendar file.');
  } finally {
    window.__suppressBackupTracking = previousSuppress;
  }
}


if (typeof window !== 'undefined') {
  window.syncCurrentFileName = syncCurrentFileName;
  window.resetAppStateToDefaults = resetAppStateToDefaults;
  window.createFileOnDisk = createFileOnDisk;
  }
if (typeof global !== 'undefined') {
  global.syncCurrentFileName = syncCurrentFileName;
  global.resetAppStateToDefaults = resetAppStateToDefaults;
  global.createFileOnDisk = createFileOnDisk;
  global.findFuzzyCityCandidate = findFuzzyCityCandidate;
}
