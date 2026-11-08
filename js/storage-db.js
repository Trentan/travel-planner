/* ==========================================================================
   MODULE: Storage & IndexedDB (js/storage-db.js)
   Responsibilities: IndexedDB schema, multi-trip documents, cross-tab cache, offline sync
   ========================================================================== */

/* ==========================================================================
   MODULE: Data & State Management (js/data.js)
   Responsibilities: IndexedDB storage, Trip Data Normalization, City & Date logic
   ========================================================================== */

// IndexedDB Storage Implementation
let db = null;
const DB_NAME = 'travelApp_v2026';
const DB_VERSION = 3;
const STORE_NAME = 'appData';
const TRIPS_STORE_NAME = 'trips';
const SYNC_QUEUE_STORE_NAME = 'offlineSyncQueue';
let activeTripId = localStorage.getItem('travelApp_active_trip_id') || 'trip_default';

// Cross-Tab In-Memory Cache & BroadcastChannel Synchronization (Issue #296)
let tripsCache = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 15000;

let tripsBroadcastChannel = null;
if (typeof window !== 'undefined' && typeof window.BroadcastChannel !== 'undefined') {
  try {
    tripsBroadcastChannel = new window.BroadcastChannel('travelApp_trips_sync');
    tripsBroadcastChannel.onmessage = (event) => {
      const msg = event.data;
      if (!msg) return;
      if (msg.type === 'TRIP_UPDATED' || msg.type === 'TRIP_DELETED' || msg.type === 'INVALIDATE_CACHE') {
        tripsCache = null;
        lastCacheTime = 0;
        if (typeof window.renderHeaderTripSwitcher === 'function') {
          window.renderHeaderTripSwitcher();
        }
      }
    };
  } catch (e) {
    console.warn('Could not initialize BroadcastChannel for trips sync:', e);
  }
}

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'travelApp_trips_cache_invalidator' || e.key === 'travelApp_active_trip_id') {
      tripsCache = null;
      lastCacheTime = 0;
      if (typeof window.renderHeaderTripSwitcher === 'function') {
        window.renderHeaderTripSwitcher();
      }
    }
  });
}

function broadcastTripsCacheInvalidation(type, payload = {}) {
  tripsCache = null;
  lastCacheTime = 0;
  if (tripsBroadcastChannel) {
    try {
      tripsBroadcastChannel.postMessage({ type, ...payload, timestamp: Date.now() });
    } catch (e) {}
  }
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('travelApp_trips_cache_invalidator', Date.now().toString());
    }
  } catch (e) {}
}
window.broadcastTripsCacheInvalidation = broadcastTripsCacheInvalidation;

// Storage Persistence & Quota Telemetry (Issues #288 & #301)
async function isStoragePersisted() {
  if (typeof navigator !== 'undefined' && navigator.storage && typeof navigator.storage.persisted === 'function') {
    try {
      return await navigator.storage.persisted();
    } catch (e) {
      console.warn('Failed to check storage persistence:', e);
      return false;
    }
  }
  return false;
}
window.isStoragePersisted = isStoragePersisted;

async function requestStoragePersistence() {
  if (typeof navigator !== 'undefined' && navigator.storage && typeof navigator.storage.persist === 'function') {
    try {
      const persisted = await navigator.storage.persist();
      return persisted;
    } catch (e) {
      console.warn('Failed to request storage persistence:', e);
      return false;
    }
  }
  return false;
}
window.requestStoragePersistence = requestStoragePersistence;

function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
window.formatBytes = formatBytes;

async function getStorageTelemetry() {
  if (typeof navigator !== 'undefined' && navigator.storage && typeof navigator.storage.estimate === 'function') {
    try {
      const estimate = await Promise.race([
        navigator.storage.estimate(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Storage estimate timeout')), 2500))
      ]);
      const usage = (estimate && estimate.usage) || 0;
      const quota = (estimate && estimate.quota) || 0;
      const percent = quota > 0 ? Math.min(100, Math.round((usage / quota) * 100)) : 0;
      const persisted = await Promise.race([
        isStoragePersisted(),
        new Promise(resolve => setTimeout(() => resolve(false), 1500))
      ]);
      return {
        supported: true,
        usage,
        quota,
        usageFormatted: formatBytes(usage),
        quotaFormatted: formatBytes(quota),
        percent,
        persisted
      };
    } catch (e) {
      console.warn('Failed to get storage estimate:', e);
    }
  }
  return {
    supported: false,
    usage: 0,
    quota: 0,
    usageFormatted: 'Active',
    quotaFormatted: 'Local Device',
    percent: 0,
    persisted: false
  };
}
window.getStorageTelemetry = getStorageTelemetry;

function getActiveTripId() {
  return activeTripId || localStorage.getItem('travelApp_active_trip_id') || 'trip_default';
}
window.getActiveTripId = getActiveTripId;

function setActiveTripId(tripId) {
  activeTripId = tripId;
  localStorage.setItem('travelApp_active_trip_id', tripId);
}
window.setActiveTripId = setActiveTripId;

function getCountryFlagEmoji(countryCode) {
  if (!countryCode || typeof countryCode !== 'string' || countryCode.length !== 2) return '';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
window.getCountryFlagEmoji = getCountryFlagEmoji;

function jsonSafeClone(value) {
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'number' && !Number.isFinite(value)) {
      return null;
    }
    return value;
  }

  if (typeof value.toJSON === 'function') {
    try {
      return jsonSafeClone(value.toJSON());
    } catch (e) {
      // Fallback
    }
  }

  if (Array.isArray(value)) {
    const len = value.length;
    const copy = new Array(len);
    for (let i = 0; i < len; i++) {
      const item = value[i];
      if (item === undefined || typeof item === 'function' || typeof item === 'symbol') {
        copy[i] = null;
      } else {
        copy[i] = jsonSafeClone(item);
      }
    }
    return copy;
  }

  const proto = Object.getPrototypeOf(value);
  if (proto !== null && proto !== Object.prototype) {
    return JSON.parse(JSON.stringify(value));
  }

  const copy = {};
  const keys = Object.keys(value);
  const keyCount = keys.length;
  for (let i = 0; i < keyCount; i++) {
    const key = keys[i];
    const val = value[key];
    if (val !== undefined && typeof val !== 'function' && typeof val !== 'symbol') {
      copy[key] = jsonSafeClone(val);
    }
  }
  return copy;
}

function deepClone(obj) {
  if (obj === null || obj === undefined) return obj;
  try {
    return jsonSafeClone(obj);
  } catch (e) {
    return JSON.parse(JSON.stringify(obj));
  }
}
window.jsonSafeClone = jsonSafeClone;
window.deepClone = deepClone;

// Open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    let settled = false;
    const timeoutTimer = setTimeout(() => {
      if (!settled) {
        settled = true;
        console.warn('IndexedDB open timed out (possibly blocked by another open tab). Resolving with fallback.');
        resolve(db || null);
      }
    }, 3500);

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutTimer);
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };

    request.onblocked = () => {
      console.warn('IndexedDB upgrade blocked by an open connection in another tab.');
    };

    request.onsuccess = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutTimer);
      db = request.result;
      db.onversionchange = () => {
        console.log('IndexedDB version changed elsewhere. Closing stale connection.');
        db.close();
        db = null;
      };
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const upgradeDb = event.target.result;

      if (!upgradeDb.objectStoreNames.contains(STORE_NAME)) {
        const store = upgradeDb.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('key', 'key', { unique: true });
      }
      if (!upgradeDb.objectStoreNames.contains(TRIPS_STORE_NAME)) {
        const tripsStore = upgradeDb.createObjectStore(TRIPS_STORE_NAME, { keyPath: 'id' });
        tripsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
      if (!upgradeDb.objectStoreNames.contains(SYNC_QUEUE_STORE_NAME)) {
        const queueStore = upgradeDb.createObjectStore(SYNC_QUEUE_STORE_NAME, { keyPath: 'id', autoIncrement: true });
        queueStore.createIndex('tripId', 'tripId', { unique: false });
        queueStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Multi-Trip IndexedDB Helpers
function getAllTripsFromIndexedDB(forceRefresh = false) {
  if (!forceRefresh && tripsCache && (Date.now() - lastCacheTime < CACHE_TTL_MS)) {
    return Promise.resolve(jsonSafeClone(tripsCache));
  }
  return openDB().then(dbInstance => {
    return new Promise((resolve) => {
      if (!dbInstance || !dbInstance.objectStoreNames || !dbInstance.objectStoreNames.contains(TRIPS_STORE_NAME)) {
        resolve(tripsCache || []);
        return;
      }
      let settled = false;
      const timeoutTimer = setTimeout(() => {
        if (!settled) {
          settled = true;
          console.warn('getAllTripsFromIndexedDB timed out after 4000ms, resolving with cache fallback.');
          resolve(tripsCache || []);
        }
      }, 4000);

      try {
        const transaction = dbInstance.transaction([TRIPS_STORE_NAME], 'readonly');
        const store = transaction.objectStore(TRIPS_STORE_NAME);
        const request = store.getAll();

        transaction.onerror = () => {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutTimer);
          console.error('Failed transaction in getAllTripsFromIndexedDB:', transaction.error);
          resolve(tripsCache || []);
        };

        transaction.onabort = () => {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutTimer);
          console.warn('Transaction aborted in getAllTripsFromIndexedDB');
          resolve(tripsCache || []);
        };

        request.onsuccess = () => {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutTimer);
          const trips = (request.result || []).sort((a, b) => {
            return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
          });
          tripsCache = jsonSafeClone(trips);
          lastCacheTime = Date.now();
          resolve(trips);
        };

        request.onerror = () => {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutTimer);
          console.error('Failed to load trips from IndexedDB:', request.error);
          resolve(tripsCache || []);
        };
      } catch (txErr) {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutTimer);
        console.error('Transaction creation error in getAllTripsFromIndexedDB:', txErr);
        resolve(tripsCache || []);
      }
    });
  }).catch(err => {
    console.warn('getAllTripsFromIndexedDB error fallback:', err);
    return tripsCache || [];
  });
}
window.getAllTripsFromIndexedDB = getAllTripsFromIndexedDB;

function saveTripToIndexedDB(tripRecord) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      if (!db || !db.objectStoreNames || !db.objectStoreNames.contains(TRIPS_STORE_NAME)) {
        reject(new Error('IndexedDB not available'));
        return;
      }
      const transaction = db.transaction([TRIPS_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(TRIPS_STORE_NAME);
      const request = store.put(tripRecord);

      request.onsuccess = () => {
        broadcastTripsCacheInvalidation('TRIP_UPDATED', { tripId: tripRecord.id });
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  });
}
window.saveTripToIndexedDB = saveTripToIndexedDB;

function deleteTripFromIndexedDB(tripId) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      if (!db || !db.objectStoreNames || !db.objectStoreNames.contains(TRIPS_STORE_NAME)) {
        resolve();
        return;
      }
      const transaction = db.transaction([TRIPS_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(TRIPS_STORE_NAME);
      const request = store.delete(tripId);

      request.onsuccess = () => {
        broadcastTripsCacheInvalidation('TRIP_DELETED', { tripId });
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  });
}
window.deleteTripFromIndexedDB = deleteTripFromIndexedDB;

// Persistent Offline Mutation Queue Helpers (Issue #297)
function enqueueOfflineSyncMutation(mutation) {
  if (!mutation || !mutation.tripId) return Promise.resolve(null);
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE_NAME)) {
        resolve(null);
        return;
      }
      const transaction = db.transaction([SYNC_QUEUE_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(SYNC_QUEUE_STORE_NAME);
      
      const record = {
        tripId: mutation.tripId,
        action: mutation.action || 'UPSERT',
        data: mutation.data ? jsonSafeClone(mutation.data) : null,
        timestamp: mutation.timestamp || Date.now(),
        retryCount: mutation.retryCount || 0
      };
      
      const req = store.add(record);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  });
}
window.enqueueOfflineSyncMutation = enqueueOfflineSyncMutation;

function getOfflineSyncQueue() {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE_NAME)) {
        resolve([]);
        return;
      }
      const transaction = db.transaction([SYNC_QUEUE_STORE_NAME], 'readonly');
      const store = transaction.objectStore(SYNC_QUEUE_STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = (request.result || []).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        resolve(items);
      };
      request.onerror = () => resolve([]);
    });
  });
}
window.getOfflineSyncQueue = getOfflineSyncQueue;

function removeOfflineSyncMutation(id) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE_NAME)) {
        resolve();
        return;
      }
      const transaction = db.transaction([SYNC_QUEUE_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(SYNC_QUEUE_STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}
window.removeOfflineSyncMutation = removeOfflineSyncMutation;

function clearOfflineSyncQueue() {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE_NAME)) {
        resolve();
        return;
      }
      const transaction = db.transaction([SYNC_QUEUE_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(SYNC_QUEUE_STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}
window.clearOfflineSyncQueue = clearOfflineSyncQueue;

function getOfflineSyncQueueCount() {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE_NAME)) {
        resolve(0);
        return;
      }
      const transaction = db.transaction([SYNC_QUEUE_STORE_NAME], 'readonly');
      const store = transaction.objectStore(SYNC_QUEUE_STORE_NAME);
      const request = store.count();

      request.onsuccess = () => resolve(request.result || 0);
      request.onerror = () => resolve(0);
    });
  });
}
window.getOfflineSyncQueueCount = getOfflineSyncQueueCount;

function extractTripSummary(tripData, tripId) {
  const meta = tripData.meta || {};
  const itinerary = tripData.itinerary || [];
  const staysData = tripData.stays || [];
  const cities = tripData.cities || [];

  let startDate = '';
  let endDate = '';
  if (itinerary.length > 0) {
    const firstLeg = itinerary[0];
    const lastLeg = itinerary[itinerary.length - 1];
    if (firstLeg.days && firstLeg.days.length > 0) startDate = firstLeg.days[0].date || '';
    if (lastLeg.days && lastLeg.days.length > 0) endDate = lastLeg.days[lastLeg.days.length - 1].date || '';
  }

  const flagsSet = new Set();
  cities.forEach(c => {
    if (c.countryCode) {
      const flag = getCountryFlagEmoji(c.countryCode);
      if (flag) flagsSet.add(flag);
    }
  });
  const flags = Array.from(flagsSet).slice(0, 5).join(' ');

  let dateRange = 'Flexible Dates';
  if (startDate && endDate) {
    dateRange = `${startDate} — ${endDate}`;
  }

  return {
    id: tripId || 'trip_default',
    title: meta.title || 'My Trip',
    subtitle: meta.subtitle || '',
    flags: flags || '✈️',
    dateRange: dateRange,
    legCount: itinerary.length,
    stayCount: staysData.length,
    updatedAt: new Date().toISOString(),
    data: tripData
  };
}
window.extractTripSummary = extractTripSummary;

async function saveActiveTripToStore() {
  if (typeof getCurrentAppData !== 'function') return;
  const currentData = getCurrentAppData();
  const currentId = getActiveTripId();
  const summary = extractTripSummary(currentData, currentId);
  await saveTripToIndexedDB(summary);
}
window.saveActiveTripToStore = saveActiveTripToStore;

async function loadTripFromStore(tripId) {
  const trips = await getAllTripsFromIndexedDB();
  const target = trips.find(t => t.id === tripId);
  if (!target || !target.data) return false;

  setActiveTripId(tripId);
  if (typeof loadImportedPayload === 'function') {
    await loadImportedPayload(target.data, target.title || 'Trip');
  }
  return true;
}
window.loadTripFromStore = loadTripFromStore;

async function createNewTripDocument(title = 'New Trip', subtitle = 'Click here to add subtitle') {
  const newId = 'trip_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  let baseData = typeof DEFAULT_TRIP_DATA !== 'undefined' ? JSON.parse(JSON.stringify(DEFAULT_TRIP_DATA)) : {};
  baseData.meta = { title, subtitle };

  const summary = extractTripSummary(baseData, newId);
  await saveTripToIndexedDB(summary);
  await loadTripFromStore(newId);
}
window.createNewTripDocument = createNewTripDocument;

async function duplicateTripDocument(tripId) {
  const trips = await getAllTripsFromIndexedDB();
  const source = trips.find(t => t.id === tripId);
  if (!source || !source.data) return;

  const newId = 'trip_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  const dupPayload = JSON.parse(JSON.stringify(source.data));
  dupPayload.meta = dupPayload.meta || {};
  dupPayload.meta.title = (dupPayload.meta.title || 'Trip') + ' (Copy)';

  const summary = extractTripSummary(dupPayload, newId);
  await saveTripToIndexedDB(summary);
}
window.duplicateTripDocument = duplicateTripDocument;

async function deleteTripDocument(tripId) {
  await deleteTripFromIndexedDB(tripId);
  if (getActiveTripId() === tripId) {
    const remaining = await getAllTripsFromIndexedDB();
    if (remaining.length > 0) {
      await loadTripFromStore(remaining[0].id);
    } else {
      await createNewTripDocument('My First Trip', 'Click here to add description');
    }
  }
}
window.deleteTripDocument = deleteTripDocument;

// Save data to IndexedDB
function saveToIndexedDB(key, data) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      if (!db || !db.objectStoreNames || !db.objectStoreNames.contains(STORE_NAME)) {
        reject(new Error('IndexedDB not available'));
        return;
      }
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const request = store.put({
        key: key,
        data: data,
        timestamp: new Date().toISOString()
      });

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error(`Failed to save ${key} to IndexedDB:`, request.error);
        reject(request.error);
      };
    });
  });
}

// Load data from IndexedDB
function loadFromIndexedDB(key) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      if (!db || !db.objectStoreNames || !db.objectStoreNames.contains(STORE_NAME)) {
        resolve(null);
        return;
      }
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.data);
        } else {
          resolve(null); // Key not found
        }
      };

      request.onerror = () => {
        console.error(`Failed to load ${key} from IndexedDB:`, request.error);
        reject(request.error);
      };
    });
  });
}

// Delete data from IndexedDB
function deleteFromIndexedDB(key) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      if (!db || !db.objectStoreNames || !db.objectStoreNames.contains(STORE_NAME)) {
        resolve();
        return;
      }
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error(`Failed to delete ${key} from IndexedDB:`, request.error);
        reject(request.error);
      };
    });
  });
}

// Check if we should use IndexedDB (migration complete and DB available)
async function shouldUseIndexedDB() {
  try {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return false;
    }
    const database = await openDB();
    if (!database) return false;

    // Ensure migration flag is set so subsequent checks are fast
    const migrationStatus = await loadFromIndexedDB('_migration_complete');
    if (!migrationStatus) {
      try {
        await saveToIndexedDB('_migration_complete', { version: DB_VERSION, date: new Date().toISOString() });
      } catch (err) {}
    }
    return true;
  } catch (e) {
    console.warn('IndexedDB status check fallback to localStorage:', e);
    return false;
  }
}

// Fallback to localStorage if IndexedDB fails
function fallbackToLocalStorage() {
  console.warn('IndexedDB not available, falling back to localStorage');
  // localStorage functions will be used automatically in the updated code
}

// Public window exports for storage subsystem
if (typeof window !== 'undefined') {
  window.DB_NAME = DB_NAME;
  window.DB_VERSION = DB_VERSION;
  window.STORE_NAME = STORE_NAME;
  window.TRIPS_STORE_NAME = TRIPS_STORE_NAME;
  window.SYNC_QUEUE_STORE_NAME = SYNC_QUEUE_STORE_NAME;
  window.openDB = openDB;
  window.saveToIndexedDB = saveToIndexedDB;
  window.loadFromIndexedDB = loadFromIndexedDB;
  window.deleteFromIndexedDB = deleteFromIndexedDB;
  window.shouldUseIndexedDB = shouldUseIndexedDB;
  window.fallbackToLocalStorage = fallbackToLocalStorage;
  window.getActiveTripId = getActiveTripId;
  window.setActiveTripId = setActiveTripId;
  window.saveActiveTripToStore = saveActiveTripToStore;
  window.loadTripFromStore = loadTripFromStore;
  window.getAllTripsFromIndexedDB = getAllTripsFromIndexedDB;
  window.saveTripToIndexedDB = saveTripToIndexedDB;
  window.deleteTripFromIndexedDB = deleteTripFromIndexedDB;
  window.deleteTripDocument = deleteTripDocument;
  window.createNewTripDocument = createNewTripDocument;
  window.duplicateTripDocument = duplicateTripDocument;
  window.extractTripSummary = extractTripSummary;
  window.enqueueOfflineSyncMutation = enqueueOfflineSyncMutation;
  window.getOfflineSyncQueue = getOfflineSyncQueue;
  window.removeOfflineSyncMutation = removeOfflineSyncMutation;
  window.clearOfflineSyncQueue = clearOfflineSyncQueue;
  window.getOfflineSyncQueueCount = getOfflineSyncQueueCount;
  window.jsonSafeClone = jsonSafeClone;
  window.deepClone = deepClone;
  window.isStoragePersisted = isStoragePersisted;
  window.requestStoragePersistence = requestStoragePersistence;
  window.formatBytes = formatBytes;
  window.getStorageTelemetry = getStorageTelemetry;
  window.broadcastTripsCacheInvalidation = broadcastTripsCacheInvalidation;
}
