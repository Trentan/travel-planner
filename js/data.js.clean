// IndexedDB Storage Implementation
let db = null;
const DB_NAME = 'travelApp_v2026';
const DB_VERSION = 1;
const STORE_NAME = 'appData';

// Open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      console.log('IndexedDB opened successfully');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      db = event.target.result;
      console.log('Creating IndexedDB object store...');

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('key', 'key', { unique: true });
      }
    };
  });
}

// Save data to IndexedDB
function saveToIndexedDB(key, data) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
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

// Migrate data from localStorage to IndexedDB
async function migrateFromLocalStorage() {
  console.log('Checking for localStorage data to migrate...');

  const migrations = [
    { lsKey: 'travelApp_v2026_template', dbKey: 'itinerary' },
    { lsKey: 'travelApp_packing_v3', dbKey: 'packing' },
    { lsKey: 'travelApp_leavehome_v3', dbKey: 'leaveHome' },
    { lsKey: 'travelApp_cities_v1', dbKey: 'cities' },
    { lsKey: 'travelApp_meta_template', dbKey: 'meta' },
    { lsKey: 'travelApp_filename_v2026', dbKey: 'filename' },
    { lsKey: 'travelApp_journeys_v1', dbKey: 'journeys' },
    { lsKey: 'travelApp_stays_v1', dbKey: 'stays' },
    { lsKey: 'travelApp_userCities_v1', dbKey: 'userCities' },
    { lsKey: 'travelApp_userCountries_v1', dbKey: 'userCountries' },
    { lsKey: 'travelApp_last_export_v2026', dbKey: 'lastExport' },
    { lsKey: 'travelApp_last_import_v2026', dbKey: 'lastImport' }
  ];

  let migratedCount = 0;

  for (const { lsKey, dbKey } of migrations) {
    const lsData = localStorage.getItem(lsKey);
    if (lsData !== null) {
      try {
        const parsedData = JSON.parse(lsData);
        await saveToIndexedDB(dbKey, parsedData);
        console.log(`Migrated ${dbKey} from localStorage to IndexedDB`);
        migratedCount++;
        // Don't remove from localStorage yet - keep as fallback
      } catch (e) {
        console.error(`Failed to migrate ${dbKey}:`, e);
      }
    }
  }

  if (migratedCount > 0) {
    console.log(`Successfully migrated ${migratedCount} data stores to IndexedDB`);
    // Mark migration as complete
    await saveToIndexedDB('_migration_complete', { version: DB_VERSION, date: new Date().toISOString() });
  }

  return migratedCount;
}

// Check if we should use IndexedDB (migration complete and DB available)
async function shouldUseIndexedDB() {
  try {
    if (!window.indexedDB) {
      console.log('IndexedDB not supported, falling back to localStorage');
      return false;
    }

    const migrationStatus = await loadFromIndexedDB('_migration_complete');
    return migrationStatus !== null;
  } catch (e) {
    console.error('Error checking IndexedDB status:', e);
    return false;
  }
}

// Fallback to localStorage if IndexedDB fails
function fallbackToLocalStorage() {
  console.warn('IndexedDB not available, falling back to localStorage');
  // localStorage functions will be used automatically in the updated code
}

let appData = [];
let packingData = [];
let leaveHomeData = [];
let citiesData = []; // City entities for filtering/grouping - { id, name, code, countryCode, country, dateFrom, dateTo, colour }

// ISO Country codes for travel destinations
const COUNTRY_DATA = [
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
  { code: 'IS', name: 'Iceland', flag: '🇮🇸' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'ZZ', name: 'Other', flag: '🌐' }
];

// Extended city database with IATA codes for Eastern Europe and additional destinations
// Users can still add their own cities via the city dialog
const EXTENDED_CITY_DATABASE = [
{ code: 'BTS', name: 'Bratislava', countryCode: 'SK' },
{ code: 'SKP', name: 'Skopje', countryCode: 'MK' },
{ code: 'TIA', name: 'Tirana', countryCode: 'AL' },
{ code: 'TGD', name: 'Podgorica', countryCode: 'ME' },
{ code: 'PRN', name: 'Pristina', countryCode: 'XK' },
{ code: 'SJJ', name: 'Sarajevo', countryCode: 'BA' },
{ code: 'SPU', name: 'Split', countryCode: 'HR' },
{ code: 'DBV', name: 'Dubrovnik', countryCode: 'HR' },
{ code: 'ZAG', name: 'Zagreb', countryCode: 'HR' },
{ code: 'LJU', name: 'Ljubljana', countryCode: 'SI' },
{ code: 'OTP', name: 'Bucharest', countryCode: 'RO' },
{ code: 'CLJ', name: 'Cluj-Napoca', countryCode: 'RO' },
{ code: 'TSR', name: 'Timisoara', countryCode: 'RO' },
{ code: 'SOF', name: 'Sofia', countryCode: 'BG' },
{ code: 'VAR', name: 'Varna', countryCode: 'BG' },
{ code: 'TLL', name: 'Tallinn', countryCode: 'EE' },
{ code: 'RIX', name: 'Riga', countryCode: 'LV' },
{ code: 'VNO', name: 'Vilnius', countryCode: 'LT' },
{ code: 'KRK', name: 'Krakow', countryCode: 'PL' },
{ code: 'POZ', name: 'Poznan', countryCode: 'PL' },
{ code: 'WAW', name: 'Warsaw', countryCode: 'PL' },
{ code: 'BEG', name: 'Belgrade', countryCode: 'RS' },
{ code: 'SKG', name: 'Thessaloniki', countryCode: 'GR' },
{ code: 'HER', name: 'Heraklion', countryCode: 'GR' },
{ code: 'SIP', name: 'Istanbul Sabiha', countryCode: 'TR' },
{ code: 'SAW', name: 'Istanbul Sabiha', countryCode: 'TR' },
{ code: 'IZM', name: 'Izmir', countryCode: 'TR' },
{ code: 'HTY', name: 'Antalya', countryCode: 'TR' },
{ code: 'BOJ', name: 'Burgas', countryCode: 'BG' },
{ code: 'TBS', name: 'Tbilisi', countryCode: 'GE' },
{ code: 'EVN', name: 'Yerevan', countryCode: 'AM' },
{ code: 'KIV', name: 'Chisinau', countryCode: 'MD' },
{ code: 'MOW', name: 'Moscow', countryCode: 'RU' },
{ code: 'LED', name: 'St Petersburg', countryCode: 'RU' },
{ code: 'IEV', name: 'Kyiv', countryCode: 'UA' },
{ code: 'ODS', name: 'Odessa', countryCode: 'UA' },
{ code: 'CAI', name: 'Cairo', countryCode: 'EG' },
{ code: 'HRG', name: 'Hurghada', countryCode: 'EG' },
{ code: 'SSH', name: 'Sharm El-Sheikh', countryCode: 'EG' },
{ code: 'AMM', name: 'Amman', countryCode: 'JO' },
{ code: 'AQJ', name: 'Aqaba', countryCode: 'JO' },
{ code: 'TLV', name: 'Tel Aviv', countryCode: 'IL' },
{ code: 'BEY', name: 'Beirut', countryCode: 'LB' },
{ code: 'BAH', name: 'Manama', countryCode: 'BH' },
{ code: 'DOH', name: 'Doha', countryCode: 'QA' },
{ code: 'KWI', name: 'Kuwait City', countryCode: 'KW' },
{ code: 'MCT', name: 'Muscat', countryCode: 'OM' },
{ code: 'DMM', name: 'Dammam', countryCode: 'SA' },
{ code: 'JED', name: 'Jeddah', countryCode: 'SA' },
{ code: 'RUH', name: 'Riyadh', countryCode: 'SA' },
{ code: 'ALG', name: 'Algiers', countryCode: 'DZ' },
{ code: 'TUN', name: 'Tunis', countryCode: 'TN' },
{ code: 'CMN', name: 'Casablanca', countryCode: 'MA' },
{ code: 'RAK', name: 'Marrakech', countryCode: 'MA' },
{ code: 'FIH', name: 'Kinshasa', countryCode: 'CD' },
{ code: 'LOS', name: 'Lagos', countryCode: 'NG' },
{ code: 'NBO', name: 'Nairobi', countryCode: 'KE' },
{ code: 'JNB', name: 'Johannesburg', countryCode: 'ZA' },
{ code: 'CPT', name: 'Cape Town', countryCode: 'ZA' },
{ code: 'DPS', name: 'Denpasar Bali', countryCode: 'ID' },
{ code: 'CGK', name: 'Jakarta', countryCode: 'ID' },
{ code: 'SUB', name: 'Surabaya', countryCode: 'ID' },
{ code: 'RGN', name: 'Yangon', countryCode: 'MM' },
{ code: 'PNH', name: 'Phnom Penh', countryCode: 'KH' },
{ code: 'REP', name: 'Siem Reap', countryCode: 'KH' },
{ code: 'VTE', name: 'Vientiane', countryCode: 'LA' },
{ code: 'LPQ', name: 'Luang Prabang', countryCode: 'LA' },
{ code: 'HAN', name: 'Hanoi', countryCode: 'VN' },
{ code: 'SGN', name: 'Ho Chi Minh City', countryCode: 'VN' },
{ code: 'DAD', name: 'Da Nang', countryCode: 'VN' },
{ code: 'CXR', name: 'Nha Trang', countryCode: 'VN' },
{ code: 'CEB', name: 'Cebu', countryCode: 'PH' },
{ code: 'MNL', name: 'Manila', countryCode: 'PH' },
{ code: 'DMK', name: 'Bangkok Don Mueang', countryCode: 'TH' },
{ code: 'CNX', name: 'Chiang Mai', countryCode: 'TH' },
{ code: 'KBV', name: 'Krabi', countryCode: 'TH' },
{ code: 'USM', name: 'Koh Samui', countryCode: 'TH' },
{ code: 'IST', name: 'Istanbul', countryCode: 'TR' },
{ code: 'TPE', name: 'Taipei', countryCode: 'TW' },
];

// Built-in city database with IATA codes
const CITY_DATABASE = [
  { code: 'ADL', name: 'Adelaide', countryCode: 'AU' },
  { code: 'AMS', name: 'Amsterdam', countryCode: 'NL' },
  { code: 'ATH', name: 'Athens', countryCode: 'GR' },
  { code: 'BCN', name: 'Barcelona', countryCode: 'ES' },
  { code: 'BKK', name: 'Bangkok', countryCode: 'TH' },
  { code: 'BNE', name: 'Brisbane', countryCode: 'AU' },
  { code: 'BRU', name: 'Brussels', countryCode: 'BE' },
  { code: 'BUD', name: 'Budapest', countryCode: 'HU' },
  { code: 'CAI', name: 'Cairo', countryCode: 'EG' },
  { code: 'CAN', name: 'Guangzhou', countryCode: 'CN' },
  { code: 'CDG', name: 'Paris', countryCode: 'FR' },
  { code: 'CGN', name: 'Cologne', countryCode: 'DE' },
  { code: 'CPH', name: 'Copenhagen', countryCode: 'DK' },
  { code: 'DRS', name: 'Dresden', countryCode: 'DE' },
  { code: 'DUB', name: 'Dublin', countryCode: 'IE' },
  { code: 'DUS', name: 'Dusseldorf', countryCode: 'DE' },
  { code: 'FCO', name: 'Rome', countryCode: 'IT' },
  { code: 'FRA', name: 'Frankfurt', countryCode: 'DE' },
  { code: 'GVA', name: 'Geneva', countryCode: 'CH' },
  { code: 'HAM', name: 'Hamburg', countryCode: 'DE' },
  { code: 'HEL', name: 'Helsinki', countryCode: 'FI' },
  { code: 'HKG', name: 'Hong Kong', countryCode: 'HK' },
  { code: 'HKT', name: 'Phuket', countryCode: 'TH' },
  { code: 'HND', name: 'Tokyo', countryCode: 'JP' },
  { code: 'IST', name: 'Istanbul', countryCode: 'TR' },
  { code: 'JFK', name: 'New York', countryCode: 'US' },
  { code: 'KUL', name: 'Kuala Lumpur', countryCode: 'MY' },
  { code: 'LAS', name: 'Las Vegas', countryCode: 'US' },
  { code: 'LAX', name: 'Los Angeles', countryCode: 'US' },
  { code: 'LHR', name: 'London', countryCode: 'GB' },
  { code: 'LIS', name: 'Lisbon', countryCode: 'PT' },
  { code: 'MAD', name: 'Madrid', countryCode: 'ES' },
  { code: 'MAN', name: 'Manchester', countryCode: 'GB' },
  { code: 'MEL', name: 'Melbourne', countryCode: 'AU' },
  { code: 'MEX', name: 'Mexico City', countryCode: 'MX' },
  { code: 'MIL', name: 'Milan', countryCode: 'IT' },
  { code: 'MUC', name: 'Munich', countryCode: 'DE' },
  { code: 'MXP', name: 'Milan', countryCode: 'IT' },
  { code: 'NCE', name: 'Nice', countryCode: 'FR' },
  { code: 'NRT', name: 'Tokyo Narita', countryCode: 'JP' },
  { code: 'OSL', name: 'Oslo', countryCode: 'NO' },
  { code: 'OSL', name: 'Oslo', countryCode: 'NO' },
  { code: 'PER', name: 'Perth', countryCode: 'AU' },
  { code: 'PRG', name: 'Prague', countryCode: 'CZ' },
  { code: 'PVG', name: 'Shanghai', countryCode: 'CN' },
  { code: 'REK', name: 'Reykjavik', countryCode: 'IS' },
  { code: 'RIO', name: 'Rio de Janeiro', countryCode: 'BR' },
  { code: 'SFO', name: 'San Francisco', countryCode: 'US' },
  { code: 'SIN', name: 'Singapore', countryCode: 'SG' },
  { code: 'STO', name: 'Stockholm', countryCode: 'SE' },
  { code: 'STR', name: 'Stuttgart', countryCode: 'DE' },
  { code: 'SYD', name: 'Sydney', countryCode: 'AU' },
  { code: 'TPE', name: 'Taipei', countryCode: 'TW' },
  { code: 'VCE', name: 'Venice', countryCode: 'IT' },
  { code: 'VIE', name: 'Vienna', countryCode: 'AT' },
  { code: 'YVR', name: 'Vancouver', countryCode: 'CA' },
  { code: 'ZRH', name: 'Zurich', countryCode: 'CH' }
];

// Combine all city databases for lookups (built-in + extended + user-extensible)
const ALL_CITIES = [...CITY_DATABASE, ...EXTENDED_CITY_DATABASE];

// User-extensible cities (persisted to localStorage)
let userCities = []; // { code, name, countryCode }

// User-extensible countries (persisted to localStorage)
let userCountries = []; // { code, name, flag }

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

// Journeys data - make global so all modules can access
var journeys = [];
window.journeys = journeys;

var stays = [];
window.stays = stays;

// Current city filter - 'all' or city ID (global for cross-module access)
var currentCityFilter = 'all';
window.currentCityFilter = currentCityFilter;

// Extract unique cities from itinerary data
function extractCitiesFromItinerary() {
  const cityMap = new Map();

  appData.forEach(leg => {
    leg.days.forEach(day => {
      const from = day.from?.trim() || '';
      const to = day.to?.trim() || '';
      const date = day.date;

      // Skip generic/placeholder values
      const skipList = ['Home', 'In transit', 'Between cities', 'TBC', ''];

      [from, to].forEach(cityName => {
        if (!skipList.includes(cityName) && !cityMap.has(cityName)) {
          cityMap.set(cityName, {
            id: 'city-' + cityName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            name: cityName,
            country: '',
            dateFrom: date,
            dateTo: date
          });
        }
      });

      // Update date ranges for existing cities
      [from, to].forEach(cityName => {
        if (cityMap.has(cityName)) {
          const city = cityMap.get(cityName);
          if (date < city.dateFrom) city.dateFrom = date;
          if (date > city.dateTo) city.dateTo = date;
        }
      });
    });
  });

  return Array.from(cityMap.values());
}

// Get city ID by name (case insensitive)
function getCityIdByName(cityName) {
  if (!cityName) return '';
  const city = citiesData.find(c => c.name.toLowerCase() === cityName.toLowerCase().trim());
  return city ? city.id : '';
}

// Get a random city color from the palette (avoids using the same color as recently used)
function getRandomCityColor() {
  // Check which colors are already in use
  const usedColors = new Set(citiesData.map(c => c.colour));
  const availableColors = CITY_COLORS.filter(c => !usedColors.has(c));

  // Use available colors first, fall back to any color if all are used
  const palette = availableColors.length > 0 ? availableColors : CITY_COLORS;
  const randomIndex = Math.floor(Math.random() * palette.length);
  return palette[randomIndex];
}

// Add or update a city with ISO/ICAO standards
function addOrUpdateCity(cityName, country = '', dateFrom = '', dateTo = '', cityCode = '', countryCode = '') {
  if (!cityName) return null;

  const normalizedName = cityName.trim();

  // Check if city already exists
  const existing = citiesData.find(c => c.name.toLowerCase() === normalizedName.toLowerCase());
  if (existing) {
    // Update existing city
    if (country) existing.country = country;
    if (countryCode) existing.countryCode = countryCode;
    if (cityCode) existing.code = cityCode;
    if (dateFrom && dateFrom < existing.dateFrom) existing.dateFrom = dateFrom;
    if (dateTo && dateTo > existing.dateTo) existing.dateTo = dateTo;
    return existing;
  }

  // Look up city in databases (IATA lookup) - this works even for "Other" country
  let code = cityCode;
  let cCode = countryCode;
  let cName = country;

  // First: look up city code from built-in database or user cities
  const dbMatch = ALL_CITIES.find(c =>
    c.name.toLowerCase() === normalizedName.toLowerCase()
  );

  if (dbMatch) {
    // City found in database - use its IATA code and country
    code = dbMatch.code;
    cCode = dbMatch.countryCode;
    // Look up the full country name from the country code
    const countryMatch = COUNTRY_DATA.find(c => c.code === dbMatch.countryCode);
    if (countryMatch) {
      cName = countryMatch.name;
    }
  } else if (!code) {
    // City not in database but cityCode provided (e.g., user entered 3-letter code)
    // Try to match by cityCode to find country
    const codeMatch = ALL_CITIES.find(c =>
      c.code.toUpperCase() === cityCode.toUpperCase()
    );
    if (codeMatch) {
      cCode = codeMatch.countryCode;
      const countryMatch = COUNTRY_DATA.find(c => c.code === codeMatch.countryCode);
      if (countryMatch) {
        cName = countryMatch.name;
      }
    }
  }

  // If still no country code, try to infer from the provided country name
  if (!cCode && country) {
    const countryMatch = COUNTRY_DATA.find(c =>
      c.name.toLowerCase() === country.toLowerCase() ||
      c.code.toLowerCase() === country.toLowerCase()
    );
    if (countryMatch) {
      cCode = countryMatch.code;
      cName = countryMatch.name;
    }
  }

  // Create new city with ISO structure
  const newCity = {
    id: 'city-' + normalizedName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    name: normalizedName,
    code: code || '',
    countryCode: cCode || '',
    country: cName || country,
    dateFrom: dateFrom,
    dateTo: dateTo,
    colour: getRandomCityColor()
  };
  citiesData.push(newCity);
  return newCity;
}

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
  // Remove duplicates by name
  const uniqueCities = combinedCities.filter((c, i, arr) =>
    arr.findIndex(t => t.name.toLowerCase() === c.name.toLowerCase()) === i
  );

  uniqueCities
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach(city => {
      const option = document.createElement('option');
      option.value = city.name;
      option.textContent = `${city.code} - ${getCountryName(city.countryCode)}`;
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

// Get country name by code
function getCountryName(countryCode) {
  if (!countryCode) return '';
  // First check built-in countries
  const country = COUNTRY_DATA.find(c => c.code === countryCode.toUpperCase());
  if (country) return country.name;
  // Then check user countries
  const userCountry = userCountries.find(c => c.code === countryCode.toUpperCase());
  if (userCountry) return userCountry.name;
  return countryCode;
}

// Get country flag by code
function getCountryFlag(countryCode) {
  if (!countryCode) return '';
  // First check built-in countries
  const country = COUNTRY_DATA.find(c => c.code === countryCode.toUpperCase());
  if (country) return country.flag;
  // Then check user countries
  const userCountry = userCountries.find(c => c.code === countryCode.toUpperCase());
  if (userCountry) return userCountry.flag;
  return '🌐';
}

// Get all countries (built-in + user countries)
function getAllCountries() {
  // Filter out "Other" from built-in countries since we're adding custom ones
  const builtinCountries = COUNTRY_DATA.filter(c => c.code !== 'ZZ');
  return [...builtinCountries, ...userCountries];
}

// Add a user-defined city to the extensible database
function addUserCity(cityCode, cityName, countryCode) {
  if (!cityCode || !cityName) return null;

  // Check for duplicate code or name
  const existing = userCities.find(c =>
    c.code.toUpperCase() === cityCode.toUpperCase() ||
    c.name.toLowerCase() === cityName.toLowerCase()
  );
  if (existing) return existing;

  const newCity = {
    code: cityCode.toUpperCase(),
    name: cityName.trim(),
    countryCode: countryCode.toUpperCase()
  };
  userCities.push(newCity);
  localStorage.setItem('travelApp_userCities_v1', JSON.stringify(userCities));

  // Refresh datalists
  createCityDatalists();

  return newCity;
}

// Add a user-defined country
function addUserCountry(countryCode, countryName, flag = '??') {
  if (!countryCode || !countryName) return null;

  // Check for duplicate code
  const existing = userCountries.find(c => c.code.toUpperCase() === countryCode.toUpperCase());
  if (existing) return existing;

  const newCountry = {
    code: countryCode.toUpperCase(),
    name: countryName.trim(),
    flag: flag
  };
  userCountries.push(newCountry);
  localStorage.setItem('travelApp_userCountries_v1', JSON.stringify(userCountries));

  // Refresh country datalist and dropdown
  createCityDatalists();
  if (typeof populateCountrySelect === 'function') {
    populateCountrySelect();
  }

  return newCountry;
}

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
  // Find first day with 'Home' in from location
  let homeDeparture = null;
  let homeReturn = null;

  // Check all legs for Home references
  appData.forEach(leg => {
    leg.days.forEach(day => {
      if (day.from === 'Home') {
        homeDeparture = day.to;
      }
      if (day.to === 'Home') {
        homeReturn = day.from;
      }
    });
  });

  return {
    departure: homeDeparture,
    return: homeReturn
  };
}

// Check if a city is the home location (first departure or last return)
function isHomeCity(cityName) {
  const home = getHomeLocation();
  return cityName === home.departure || cityName === home.return;
}

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
  'Home': '🏠'
};

// City/country name -> ISO-2 code for flagcdn.com images
const CITY_TO_CODE = {
  'australia': 'au', 'brisbane': 'au',
  'austria': 'at', 'vienna': 'at', 'innsbruck': 'at',
  'thailand': 'th', 'bangkok': 'th', 'kohsamui': 'th', 'samui': 'th',
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
  'verona': 'it'
};

// Country name to ISO code mapping
const COUNTRY_TO_CODE = {
  'Australia': 'AU',
  'Austria': 'AT',
  'Thailand': 'TH',
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
  'United States': 'US'
};

// Get flag emoji for a city (based on city name or country)
function getCityFlag(cityName) {
  if (!cityName) return '📍';

  // Get country from city mapping or direct match
  let country = null;
  if (COUNTRY_FLAGS[cityName]) {
    // Direct city match - reverse lookup country
    const flag = COUNTRY_FLAGS[cityName];
    // Find which country this flag belongs to
    for (const [cName, cFlag] of Object.entries(COUNTRY_FLAGS)) {
      if (cFlag === flag && COUNTRY_TO_CODE[cName]) {
        country = cName;
        break;
      }
    }
    // Return original emoji
    return flag;
  }

  // Check citiesData for country
  const city = citiesData.find(c => c.name === cityName);
  if (city && city.country) {
    country = city.country;
    if (COUNTRY_FLAGS[country]) {
      return COUNTRY_FLAGS[country];
    }
  }

  return '📍';
}

// Get flag as flagcdn.com img tag (works on Windows Chrome/Edge)
function getCityFlagHTML(cityName) {
  if (!cityName) return '<span class="city-flag">📍</span>';

  const cityEntry = typeof citiesData !== 'undefined' ? citiesData.find(c => c.name === cityName) : null;
  const lookupCity = cityName.replace(/\s+/g, '').toLowerCase();
  const lookupCountry = cityEntry?.country?.replace(/\s+/g, '').toLowerCase();
  const code = CITY_TO_CODE[lookupCity] || CITY_TO_CODE[lookupCountry];

  if (code) {
    return `<img src="https://flagcdn.com/w20/${code}.png" srcset="https://flagcdn.com/w40/${code}.png 2x" class="city-flag-img" alt="${cityName} flag" onerror="this.style.display='none'">`;
  }

  return '<span class="city-flag">📍</span>';
}

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
    // Give the city modal a higher z-index than journey modal (which uses default 1000 from CSS)
    modal.style.zIndex = '1100';
    modal.style.display = 'flex';
    createCityDatalists(); // Ensure datalists exist
    populateCityList();
    populateCountrySelect();
    setupCityAutocomplete();
  }
}

// Setup autocomplete behavior for city name input
function setupCityAutocomplete() {
  const nameInput = document.getElementById('newCityName');
  const countrySelect = document.getElementById('newCityCountrySelect');
  const codeDisplay = document.getElementById('cityCodeDisplay');
  const codeInfo = document.getElementById('cityCodeInfo');

  if (!nameInput) return;

  nameInput.addEventListener('input', function() {
    const value = this.value.trim();
    if (!value) {
      if (codeDisplay) codeDisplay.style.display = 'none';
      return;
    }

    // Look up city in databases
    const match = ALL_CITIES.find(c =>
      c.name.toLowerCase() === value.toLowerCase()
    );

    if (match && codeDisplay && codeInfo) {
      const country = COUNTRY_DATA.find(c => c.code === match.countryCode);
      codeInfo.textContent = `${match.code} — ${getCountryName(match.countryCode)}`;
      codeDisplay.style.display = 'block';

      // Auto-select country if not already selected
      if (countrySelect && !countrySelect.value) {
        countrySelect.value = match.countryCode;
      }
    } else if (codeDisplay) {
      codeDisplay.style.display = 'none';
    }
  });

  // Also handle selection from datalist
  nameInput.addEventListener('change', function() {
    const value = this.value.trim();
    if (!value) return;

    const match = ALL_CITIES.find(c =>
      c.name.toLowerCase() === value.toLowerCase()
    );

    if (match && countrySelect) {
      countrySelect.value = match.countryCode;
      if (codeDisplay && codeInfo) {
        codeInfo.textContent = `${match.code} — ${getCountryName(match.countryCode)}`;
        codeDisplay.style.display = 'block';
      }
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

  // Sort cities alphabetically by name
  const sortedCities = [...citiesData].sort((a, b) => a.name.localeCompare(b.name));

  sortedCities.forEach(city => {
    const flag = getCityFlag(city.name);
    const countryFlag = city.countryCode ? getCountryFlag(city.countryCode) : '';
    const isHome = isHomeCity(city.name);
    const homeBadge = isHome ? ' <span style="background: #27AE60; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem;">🏠 Home</span>' : '';

    // Get city color from matching leg, or use city's stored color
    let cityColor = city.colour || '#2C3E50';
    if (!city.colour) {
      const matchingLeg = appData.find(leg => leg.days.some(day => day.to === city.name || day.from === city.name));
      if (matchingLeg) {
        cityColor = matchingLeg.colour || '#2C3E50';
      }
    }

    // Build code display
    const codeDisplay = city.code ? `<span class="city-code">${city.code}</span>` : '';
    const countryLabel = city.countryCode ? `${countryFlag} ${city.countryCode}` : (city.country || '—');

    const row = document.createElement('div');
    row.className = 'city-list-item';
    row.style.cssText = `display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border-bottom: 1px solid #eee; border-left: 4px solid ${cityColor}; background: white;`;
    row.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1;">
        <span style="font-size: 1.5rem;">${flag}</span>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 500; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            ${city.name}${homeBadge}
            ${codeDisplay}
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 6px;">
            <select class="country-select" data-city-id="${city.id}"
              style="padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.85rem; min-width: 140px;">
              <option value="">Select country...</option>
              ${COUNTRY_DATA.map(c => {
              const cityCode = (city.countryCode || '').toUpperCase();
              const isSelected = c.code === cityCode;
              return `<option value="${c.code}"${isSelected ? ' selected' : ''}>${c.flag} ${c.name}</option>`;
            }).join('')}
            </select>
            ${city.code ? `<span style="font-family: 'DM Mono', monospace; font-size: 0.8rem; color: #666; background: #f5f5f5; padding: 2px 6px; border-radius: 4px;">IATA: ${city.code}</span>` : ''}
          </div>
        </div>
      </div>
      <button class="del-btn" title="Delete City" onclick="deleteCityFromDialog('${city.id}')">×</button>
    `;
    container.appendChild(row);
  });

  // Attach change handlers to country selects
  container.querySelectorAll('.country-select').forEach(select => {
    select.addEventListener('change', function() {
      const cityId = this.dataset.cityId;
      const countryCode = this.value;
      updateCityCountryCode(cityId, countryCode);
    });
  });
}

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
    saveData(false);
    populateCityList(); // Refresh dialog
    if (typeof buildCityNav === 'function') {
      buildCityNav();
    }
    if (typeof buildItinerary === 'function') {
      buildItinerary();
    }
  }
}

function addNewCityFromDialog() {
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

  // Look up city code from databases
  let cityCode = '';
  const dbMatch = ALL_CITIES.find(c =>
    c.name.toLowerCase() === name.toLowerCase()
  );
  if (dbMatch) {
    cityCode = dbMatch.code;
    // Verify country matches
    if (!countryCode && dbMatch.countryCode) {
      countryCode = dbMatch.countryCode;
      const countryMatch = COUNTRY_DATA.find(c => c.code === countryCode);
      countryName = countryMatch ? countryMatch.name : '';
    }
  }

  // If city not in database and it looks like an IATA code (3 uppercase letters), add to user cities
  if (!cityCode && name.length === 3 && /^[A-Z]{3}$/.test(name)) {
    cityCode = name;
    if (name && countryCode) {
      addUserCity(cityCode, name, countryCode);
    }
  }

  const newCity = addOrUpdateCity(name, countryName, '', '', cityCode, countryCode);
  if (newCity) {
    saveData(false);
    nameInput.value = '';
    if (countryInput) countryInput.value = '';
    if (countrySelect) countrySelect.value = '';
    if (codeInfo) codeInfo.parentElement.style.display = 'none';
    populateCityList();
    if (typeof buildCityNav === 'function') {
      buildCityNav();
    }
  }
}

// Update city country code from dropdown
function updateCityCountryCode(cityId, countryCode) {
  const city = citiesData.find(c => c.id === cityId);
  if (!city) return;

  city.countryCode = countryCode;
  const countryMatch = COUNTRY_DATA.find(c => c.code === countryCode);
  if (countryMatch) {
    city.country = countryMatch.name;
  }

  saveData(false);
  populateCityList();
  if (typeof buildCityNav === 'function') {
    buildCityNav();
  }
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

// Migration: Convert old city format to new ISO/ICAO/IATA standard format
// Old: { id, name, country, dateFrom, dateTo }
// New: { id, name, code, countryCode, country, dateFrom, dateTo, colour }
function migrateCitiesToISOFormat() {
  if (!citiesData || !Array.isArray(citiesData)) return;

  const citiesNeedingMigration = citiesData.filter(city => !city.code || !city.countryCode);
  if (citiesNeedingMigration.length === 0) return;

  console.log(`[Migration] Converting ${citiesNeedingMigration.length} cities to ISO format...`);

  citiesNeedingMigration.forEach(city => {
    const normalizedName = city.name?.trim();
    if (!normalizedName) return;

    // Look up city in ALL city databases (built-in + extended)
    const dbMatch = ALL_CITIES.find(c =>
      c.name.toLowerCase() === normalizedName.toLowerCase()
    );

    if (dbMatch) {
      city.code = dbMatch.code;
      city.countryCode = dbMatch.countryCode;
      const countryMatch = COUNTRY_DATA.find(c => c.code === dbMatch.countryCode);
      if (countryMatch) {
        city.country = countryMatch.name;
      }
    } else {
      // For cities not in database, try to infer country from city name or existing country field
      const cityNameLower = normalizedName.toLowerCase().replace(/\s+/g, '');
      const inferredCode = CITY_TO_CODE[cityNameLower];

      if (inferredCode) {
        const countryMatch = COUNTRY_DATA.find(c =>
          c.code.toLowerCase() === inferredCode.toLowerCase()
        );
        if (countryMatch) {
          city.countryCode = countryMatch.code;
          city.country = countryMatch.name;
          // Generate a code from city name (first 3 letters or first letters of words)
          const words = normalizedName.split(/\s+/);
          if (words.length === 1) {
            city.code = words[0].substring(0, 3).toUpperCase();
          } else {
            city.code = words.map(w => w[0]).join('').toUpperCase();
            if (city.code.length < 3) {
              city.code = normalizedName.substring(0, 3).toUpperCase();
            }
          }
        }
      }

      // If we have a country string but no code, try to match it
      if (!city.countryCode && city.country) {
        const countryMatch = COUNTRY_DATA.find(c =>
          c.name.toLowerCase() === city.country.toLowerCase()
        );
        if (countryMatch) {
          city.countryCode = countryMatch.code;
        }
      }
    }

    // Assign a color if missing
    if (!city.colour) {
      city.colour = getRandomCityColor();
    }

    console.log(`[Migration] City "${city.name}" → code: ${city.code || 'none'}, country: ${city.country || 'none'} (${city.countryCode || 'none'})`);
  });

  // Update any cities that have custom codes in userCities
  userCities.forEach(userCity => {
    const existingCity = citiesData.find(c =>
      c.name.toLowerCase() === userCity.name.toLowerCase()
    );
    if (existingCity) {
      existingCity.code = userCity.code;
      existingCity.countryCode = userCity.countryCode;
    }
  });

  console.log('[Migration] City ISO format migration complete');
}

// Migrate leg-level entities to include cityId
function migrateLegCityIds() {
  appData.forEach(leg => {
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

function initData() {
  // Load journeys first, before any rendering happens
  const savedJourneys = localStorage.getItem('travelApp_journeys_v1');
  if (savedJourneys) {
    try {
      const parsed = JSON.parse(savedJourneys);
      if (Array.isArray(parsed)) {
        journeys = parsed;
        window.journeys = journeys; // sync to window for other modules
        console.log(`[Journeys] Loaded ${journeys.length} journeys from localStorage`);
      }
    } catch (e) {
      console.error('[Journeys] Failed to parse:', e);
      journeys = [];
      window.journeys = journeys;
    }
  } else {
    journeys = [];
    window.journeys = journeys;
  }

  const savedStays = localStorage.getItem('travelApp_stays_v1');
  if (savedStays) {
    try {
      const parsed = JSON.parse(savedStays);
      if (Array.isArray(parsed)) {
        stays = parsed;
        window.stays = stays;
      }
    } catch (e) {
      stays = [];
      window.stays = stays;
    }
  } else {
    stays = [];
    window.stays = stays;
  }

  const saved = localStorage.getItem('travelApp_v2026_template');
  if (saved) {
    appData = JSON.parse(saved);
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
        if(day.activityItems) {
          day.activityItems.forEach(act => {
            if (act.time === undefined) act.time = "1 hr";
          });
        }
      });
    });
  }
  else { appData = JSON.parse(JSON.stringify(DEFAULT_DATA)); }

  const savedPacking = localStorage.getItem('travelApp_packing_v3');
  if (savedPacking) { packingData = JSON.parse(savedPacking); }
  else { packingData = JSON.parse(JSON.stringify(DEFAULT_PACKING)); }

  const savedLeaveHome = localStorage.getItem('travelApp_leavehome_v3');
  if (savedLeaveHome) {
    leaveHomeData = JSON.parse(savedLeaveHome);
    if (!leaveHomeData || leaveHomeData.length === 0) {
      leaveHomeData = JSON.parse(JSON.stringify(DEFAULT_LEAVE_HOME));
    }
  } else {
    leaveHomeData = JSON.parse(JSON.stringify(DEFAULT_LEAVE_HOME));
  }

  const savedCities = localStorage.getItem('travelApp_cities_v1');
  if (savedCities) {
    try {
      citiesData = JSON.parse(savedCities);
      // Migrate existing cities to include code if missing
      citiesData.forEach(city => {
        if (!city.code) {
          const match = ALL_CITIES.find(c => c.name.toLowerCase() === city.name.toLowerCase());
          city.code = match ? match.code : '';
        }
        if (!city.countryCode && city.country) {
          const countryMatch = COUNTRY_DATA.find(c =>
            c.name.toLowerCase() === city.country.toLowerCase()
          );
          city.countryCode = countryMatch ? countryMatch.code : '';
        }
      });
      saveData(false);
    } catch (e) {
      console.error('[Cities] Failed to parse saved cities:', e);
      citiesData = [];
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

  const savedMeta = localStorage.getItem('travelApp_meta_template');
if (savedMeta) { try { const parsed = JSON.parse(savedMeta); if (parsed.title && parsed.title.trim()) titleData.title = parsed.title; if (parsed.subtitle && parsed.subtitle.trim()) titleData.subtitle = parsed.subtitle; } catch(e) { console.error('Meta load error:', e); } }

  const savedFile = localStorage.getItem('travelApp_filename_v2026');
  if (savedFile) { currentFileName = savedFile; }

  document.getElementById('mainTitle').innerText = titleData.title;
  document.getElementById('mainSubtitle').innerText = titleData.subtitle;
  document.getElementById('activeFileDisplay').innerText = "📂 " + currentFileName;

  // Display last export/import timestamp
  displayTimestampStatus();

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

  // Migrate leg-level entities with city IDs
  migrateLegCityIds();

  saveData(false);

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

async function saveData(showTick = true) {
    const t = document.getElementById('mainTitle');
    const s = document.getElementById('mainSubtitle');
    if (t && t.innerText.trim()) titleData.title = t.innerText;
    if (s && s.innerText.trim()) titleData.subtitle = s.innerText;

    const useIndexedDB = await shouldUseIndexedDB();

  if (useIndexedDB) {
    try {
      await Promise.all([
        saveToIndexedDB('meta', titleData),
        saveToIndexedDB('itinerary', appData),
        saveToIndexedDB('packing', packingData),
        saveToIndexedDB('leaveHome', leaveHomeData),
        saveToIndexedDB('cities', citiesData),
        saveToIndexedDB('journeys', journeys),
        saveToIndexedDB('stays', stays),
        saveToIndexedDB('userCities', userCities),
        saveToIndexedDB('userCountries', userCountries),
        saveToIndexedDB('filename', currentFileName)
      ]);
      console.log('Data saved to IndexedDB');
    } catch (e) {
      console.error('Failed to save to IndexedDB, falling back to localStorage:', e);
      fallbackToLocalStorage();
      // Continue with localStorage save below
    }
  }

  // Always also save to localStorage as fallback
  localStorage.setItem('travelApp_meta_template', JSON.stringify(titleData));
  localStorage.setItem('travelApp_v2026_template', JSON.stringify(appData));
  localStorage.setItem('travelApp_packing_v3', JSON.stringify(packingData));
  localStorage.setItem('travelApp_leavehome_v3', JSON.stringify(leaveHomeData));
  localStorage.setItem('travelApp_stays_v1', JSON.stringify(stays));
  localStorage.setItem('travelApp_cities_v1', JSON.stringify(citiesData));
  localStorage.setItem('travelApp_journeys_v1', JSON.stringify(journeys));
  localStorage.setItem('travelApp_userCities_v1', JSON.stringify(userCities));
  localStorage.setItem('travelApp_userCountries_v1', JSON.stringify(userCountries));
  localStorage.setItem('travelApp_filename_v2026', currentFileName);

  if(showTick) {
    const status = document.getElementById('saveStatus');
    status.textContent = "✓ Saved";
    setTimeout(() => status.textContent = "", 2000);
  }
}

function resetData() {
  if(confirm("Reset all edits back to the default template? This will wipe current data.")) {
    localStorage.removeItem('travelApp_v2026_template');
    localStorage.removeItem('travelApp_packing_v3');
    localStorage.removeItem('travelApp_leavehome_v3');
    localStorage.removeItem('travelApp_meta_template');
    localStorage.removeItem('travelApp_filename_v2026');
    localStorage.removeItem('travelApp_journeys_v1');
    localStorage.removeItem('travelApp_stays_v1');
    localStorage.removeItem('travelApp_last_export_v2026');
    localStorage.removeItem('travelApp_last_import_v2026');
    location.reload();
  }
}

function migratePacking(data) {
  if (!Array.isArray(data) || data.length === 0) return null;
  const isOldFormat = data[0].hasOwnProperty('title') && !data[0].hasOwnProperty('areaName');
  if (!isOldFormat) return data;
  const areas = [
    { areaName: '🚶 Walk-on Gear (Wear onto plane)', areaColor: '#E67E22', categories: [] },
    { areaName: '🧳 Carry-on Packed Bag (Main Luggage)', areaColor: '#2980B9', categories: [] },
    { areaName: '🎒 Personal Item Bag (Under Seat)', areaColor: '#8E44AD', categories: [] }
  ];
  data.forEach(cat => {
    const t = cat.title || '';
    const entry = { title: t.replace(/^(🧳|🎒|🚶|💧)\s*/,'').replace(/^(Carry-On: |Personal Item: )/,''), items: cat.items || [] };
    if (t.includes('Walk-on') || t.includes('Plane Outfit')) { areas[0].categories.push(entry); }
    else if (t.includes('Personal Item') || t.includes('Flight Items') || t.includes('Tech') || t.includes('Essentials')) { areas[2].categories.push(entry); }
    else { areas[1].categories.push(entry); }
  });
  return areas.filter(a => a.categories.length > 0);
}

function exportJSON() {
  saveData(false);
  // Get journeys if they exist
  let journeysData = [];
  if (typeof journeys !== 'undefined') journeysData = journeys;
  let staysData = [];
  if (typeof stays !== 'undefined') staysData = stays;
  const exportObj = { meta: titleData, itinerary: appData, packing: packingData, leaveHome: leaveHomeData, journeys: journeysData, stays: staysData };
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);

  let dlName = currentFileName;
  if(dlName === "Default Template") dlName = "travel_planner_backup.json";

  downloadAnchorNode.setAttribute("download", dlName);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();

  // Record export timestamp
  localStorage.setItem('travelApp_last_export_v2026', new Date().toISOString());
}

// Expose city dialog functions to window scope
window.openCityDialog = openCityDialog;
window.closeCityDialog = closeCityDialog;
window.addNewCityFromDialog = addNewCityFromDialog;
window.updateCityCountry = updateCityCountry;
window.deleteCityFromDialog = deleteCityFromDialog;
window.populateCityList = populateCityList;

function importJSON(event) {
  const file = event.target.files[0];
  if (!file) {
    console.log('No file selected');
    return;
  }

  if (!file.name.endsWith('.json')) {
    alert('Please select a .json file. The file you selected is not valid JSON.');
    event.target.value = '';
    return;
  }

  const reader = new FileReader();

  reader.onerror = function() {
    alert('Error reading file. Please try again with a valid JSON file.');
    event.target.value = '';
  };

  reader.onload = function(e) {
    try {
      const content = e.target.result;

      if (!content || content.trim() === '') {
        alert('The file is empty. Please select a file with data.');
        event.target.value = '';
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

      if (!importedData.itinerary) {
        console.warn('Missing itinerary data in import, using default');
        importedData.itinerary = JSON.parse(JSON.stringify(DEFAULT_DATA));
      } else if (!Array.isArray(importedData.itinerary)) {
        alert('Invalid itinerary format. Expected an array of trip legs.');
        event.target.value = '';
        return;
      }

      appData = importedData.itinerary;

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
        // Migrate legacy cityRun and suggestedSights to unified suggestedActivities
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

      if (importedData.packing) {
        const migrated = migratePacking(importedData.packing);
        packingData = migrated || packingData;
      }
      if (importedData.leaveHome) leaveHomeData = importedData.leaveHome;
if (importedData.meta) {
  if (importedData.meta.title) titleData.title = importedData.meta.title;
  if (importedData.meta.subtitle) titleData.subtitle = importedData.meta.subtitle;
  const titleEl = document.getElementById('mainTitle');
  const subtitleEl = document.getElementById('mainSubtitle');
  if (titleEl) titleEl.innerText = titleData.title;
  if (subtitleEl) subtitleEl.innerText = titleData.subtitle;
  localStorage.setItem('travelApp_meta_template', JSON.stringify(titleData));
}

  // Import journeys if present - also create cities from journey references
  if (importedData.journeys && Array.isArray(importedData.journeys)) {
    // Extract cities from journey data that might not be in itinerary days
    importedData.journeys.forEach(journey => {
      [journey.fromLocation, journey.toLocation].forEach(cityName => {
        if (cityName && cityName !== 'Home' && cityName !== 'In transit' && cityName !== 'TBC' && cityName !== '') {
          const cityId = 'city-' + cityName.toLowerCase().replace(/[^a-z0-9]/g, '-');
          const existing = citiesData.find(c => c.id === cityId || c.name.toLowerCase() === cityName.toLowerCase());
          if (!existing) {
            addOrUpdateCity(cityName);
            const newCity = citiesData.find(c => c.name === cityName);
            if (newCity) { newCity.id = cityId; }
            console.log("[Import] Created city from journey: " + cityName);
          }
        }
      });
    });

    localStorage.setItem("travelApp_journeys_v1", JSON.stringify(importedData.journeys));
    console.log("[Import] Saved " + importedData.journeys.length + " journeys to localStorage");
  } else {
    console.log("[Import] No journeys found in imported data");
  }

      if (importedData.stays && Array.isArray(importedData.stays)) {
        stays = importedData.stays;
        window.stays = stays;
      }


currentFileName = file.name;
localStorage.setItem('travelApp_filename_v2026', currentFileName);
localStorage.setItem('travelApp_last_import_v2026', new Date().toISOString());

// Preserve titleData before saveData() runs, then restore after
const savedTitle = titleData.title;
const savedSubtitle = titleData.subtitle;
saveData(false);
if (savedTitle) { titleData.title = savedTitle; localStorage.setItem('travelApp_meta_template', JSON.stringify(titleData)); }
if (savedSubtitle) { titleData.subtitle = savedSubtitle; localStorage.setItem('travelApp_meta_template', JSON.stringify(titleData)); }
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
window.resetData = resetData;
window.importJSON = importJSON;
window.addOrUpdateCity = addOrUpdateCity;
window.saveData = saveData;
window.createCityDatalists = createCityDatalists;
window.getCountryName = getCountryName;
window.getCountryFlag = getCountryFlag;
window.addUserCity = addUserCity;
window.updateCityCountryCode = updateCityCountryCode;
window.populateCountrySelect = populateCountrySelect;
window.setupCityAutocomplete = setupCityAutocomplete;
