/* ==========================================================================
   MODULE: Timezone Utilities (js/timezone.js)
   Responsibilities: IANA timezone resolution, UTC offset calculations,
                     cross-timezone shift badges, dual timezone conversions
   ========================================================================== */

const COUNTRY_DEFAULT_TIMEZONES = {
  AF: 'Asia/Kabul',
  AL: 'Europe/Tirane',
  DZ: 'Africa/Algiers',
  AD: 'Europe/Andorra',
  AO: 'Africa/Luanda',
  AG: 'America/Antigua',
  AR: 'America/Argentina/Buenos_Aires',
  AM: 'Asia/Yerevan',
  AU: 'Australia/Sydney',
  AT: 'Europe/Vienna',
  AZ: 'Asia/Baku',
  BS: 'America/Nassau',
  BH: 'Asia/Bahrain',
  BD: 'Asia/Dhaka',
  BB: 'America/Barbados',
  BY: 'Europe/Minsk',
  BE: 'Europe/Brussels',
  BZ: 'America/Belize',
  BJ: 'Africa/Porto-Novo',
  BT: 'Asia/Thimphu',
  BO: 'America/La_Paz',
  BA: 'Europe/Sarajevo',
  BW: 'Africa/Gaborone',
  BR: 'America/Sao_Paulo',
  BN: 'Asia/Brunei',
  BG: 'Europe/Sofia',
  BF: 'Africa/Ouagadougou',
  BI: 'Africa/Bujumbura',
  KH: 'Asia/Phnom_Penh',
  CM: 'Africa/Douala',
  CA: 'America/Toronto',
  CV: 'Atlantic/Cape_Verde',
  KY: 'America/Cayman',
  CL: 'America/Santiago',
  CN: 'Asia/Shanghai',
  CO: 'America/Bogota',
  CR: 'America/Costa_Rica',
  HR: 'Europe/Zagreb',
  CU: 'America/Havana',
  CY: 'Asia/Nicosia',
  CZ: 'Europe/Prague',
  DK: 'Europe/Copenhagen',
  DJ: 'Africa/Djibouti',
  DM: 'America/Dominica',
  DO: 'America/Santo_Domingo',
  EC: 'America/Guayaquil',
  EG: 'Africa/Cairo',
  SV: 'America/El_Salvador',
  EE: 'Europe/Tallinn',
  ET: 'Africa/Addis_Ababa',
  FJ: 'Pacific/Fiji',
  FI: 'Europe/Helsinki',
  FR: 'Europe/Paris',
  GA: 'Africa/Libreville',
  GM: 'Africa/Banjul',
  GE: 'Asia/Tbilisi',
  DE: 'Europe/Berlin',
  GH: 'Africa/Accra',
  GR: 'Europe/Athens',
  GD: 'America/Grenada',
  GT: 'America/Guatemala',
  GN: 'Africa/Conakry',
  GY: 'America/Guyana',
  HT: 'America/Port-au-Prince',
  HN: 'America/Tegucigalpa',
  HK: 'Asia/Hong_Kong',
  HU: 'Europe/Budapest',
  IS: 'Atlantic/Reykjavik',
  IN: 'Asia/Kolkata',
  ID: 'Asia/Jakarta',
  IR: 'Asia/Tehran',
  IQ: 'Asia/Baghdad',
  IE: 'Europe/Dublin',
  IL: 'Asia/Tel_Aviv',
  IT: 'Europe/Rome',
  JM: 'America/Jamaica',
  JP: 'Asia/Tokyo',
  JO: 'Asia/Amman',
  KZ: 'Asia/Almaty',
  KE: 'Africa/Nairobi',
  XK: 'Europe/Pristina',
  KW: 'Asia/Kuwait',
  KG: 'Asia/Bishkek',
  LA: 'Asia/Vientiane',
  LV: 'Europe/Riga',
  LB: 'Asia/Beirut',
  LY: 'Africa/Tripoli',
  LI: 'Europe/Vaduz',
  LT: 'Europe/Vilnius',
  LU: 'Europe/Luxembourg',
  MO: 'Asia/Macau',
  MK: 'Europe/Skopje',
  MG: 'Indian/Antananarivo',
  MW: 'Africa/Blantyre',
  MY: 'Asia/Kuala_Lumpur',
  MV: 'Indian/Maldives',
  MT: 'Europe/Malta',
  MU: 'Indian/Mauritius',
  MX: 'America/Mexico_City',
  MD: 'Europe/Chisinau',
  MC: 'Europe/Monaco',
  MN: 'Asia/Ulaanbaatar',
  ME: 'Europe/Podgorica',
  MA: 'Africa/Casablanca',
  MZ: 'Africa/Maputo',
  MM: 'Asia/Yangon',
  NA: 'Africa/Windhoek',
  NP: 'Asia/Kathmandu',
  NL: 'Europe/Amsterdam',
  NZ: 'Pacific/Auckland',
  NI: 'America/Managua',
  NG: 'Africa/Lagos',
  NO: 'Europe/Oslo',
  OM: 'Asia/Muscat',
  PK: 'Asia/Karachi',
  PS: 'Asia/Gaza',
  PA: 'America/Panama',
  PG: 'Pacific/Port_Moresby',
  PY: 'America/Asuncion',
  PE: 'America/Lima',
  PH: 'Asia/Manila',
  PL: 'Europe/Warsaw',
  PT: 'Europe/Lisbon',
  PR: 'America/Puerto_Rico',
  QA: 'Asia/Qatar',
  RO: 'Europe/Bucharest',
  RU: 'Europe/Moscow',
  RW: 'Africa/Kigali',
  WS: 'Pacific/Apia',
  SM: 'Europe/San_Marino',
  SA: 'Asia/Riyadh',
  SN: 'Africa/Dakar',
  RS: 'Europe/Belgrade',
  SG: 'Asia/Singapore',
  SK: 'Europe/Bratislava',
  SI: 'Europe/Ljubljana',
  ZA: 'Africa/Johannesburg',
  KR: 'Asia/Seoul',
  ES: 'Europe/Madrid',
  LK: 'Asia/Colombo',
  SE: 'Europe/Stockholm',
  CH: 'Europe/Zurich',
  TW: 'Asia/Taipei',
  TZ: 'Africa/Dar_es_Salaam',
  TH: 'Asia/Bangkok',
  TN: 'Africa/Tunis',
  TR: 'Europe/Istanbul',
  UG: 'Africa/Kampala',
  UA: 'Europe/Kyiv',
  AE: 'Asia/Dubai',
  GB: 'Europe/London',
  US: 'America/New_York',
  UY: 'America/Montevideo',
  UZ: 'Asia/Tashkent',
  VA: 'Europe/Vatican',
  VE: 'America/Caracas',
  VN: 'Asia/Ho_Chi_Minh',
  ZM: 'Africa/Lusaka',
  ZW: 'Africa/Harare'
};

/**
 * Get client browser default timezone
 */
function getClientBrowserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch (e) {
    return 'UTC';
  }
}

/**
 * Clean location/city string by stripping emoji, suffixes like (Trip Start), etc.
 */
function cleanCityTimezoneName(locationName) {
  if (!locationName || typeof locationName !== 'string') return '';
  let cleanValue = String(locationName);
  const commaIdx = cleanValue.indexOf(',');
  if (commaIdx !== -1) cleanValue = cleanValue.slice(0, commaIdx);
  const dashMatch = cleanValue.match(/ (—|–|-) /);
  if (dashMatch) cleanValue = cleanValue.slice(0, dashMatch.index);

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

/**
 * Resolve standard IANA timezone string for a city or location name.
 */
function getCityTimezone(cityName) {
  if (!cityName) return getClientBrowserTimezone();
  const cleanName = cleanCityTimezoneName(cityName);
  if (!cleanName || cleanName.toLowerCase() === 'home') {
    return getHomeTimezone();
  }

  // 1. Check citiesData in active trip
  if (typeof citiesData !== 'undefined' && Array.isArray(citiesData)) {
    const city = citiesData.find(c => c.name && c.name.toLowerCase() === cleanName.toLowerCase());
    if (city) {
      if (city.timezone) return city.timezone;
      if (city.countryCode && COUNTRY_DEFAULT_TIMEZONES[city.countryCode.toUpperCase()]) {
        return COUNTRY_DEFAULT_TIMEZONES[city.countryCode.toUpperCase()];
      }
    }
  }

  // 2. Check built-in ALL_CITIES database
  if (typeof ALL_CITIES !== 'undefined' && Array.isArray(ALL_CITIES)) {
    const dbCity = ALL_CITIES.find(c => c.name && c.name.toLowerCase() === cleanName.toLowerCase());
    if (dbCity) {
      if (dbCity.timezone) return dbCity.timezone;
      if (dbCity.countryCode && COUNTRY_DEFAULT_TIMEZONES[dbCity.countryCode.toUpperCase()]) {
        return COUNTRY_DEFAULT_TIMEZONES[dbCity.countryCode.toUpperCase()];
      }
    }
  }

  // 3. Fallback: check if cleanName itself is a valid IANA identifier
  try {
    Intl.DateTimeFormat(undefined, { timeZone: cleanName });
    return cleanName;
  } catch (e) {}

  return getClientBrowserTimezone();
}

/**
 * Get home timezone for current trip
 */
function getHomeTimezone() {
  if (typeof getHomeLocation === 'function') {
    const home = getHomeLocation();
    const homeCity = home.departure || home.return;
    if (homeCity && homeCity !== 'Home') {
      if (typeof citiesData !== 'undefined' && Array.isArray(citiesData)) {
        const city = citiesData.find(c => c.name && c.name.toLowerCase() === homeCity.toLowerCase());
        if (city && city.timezone) return city.timezone;
        if (city && city.countryCode && COUNTRY_DEFAULT_TIMEZONES[city.countryCode.toUpperCase()]) {
          return COUNTRY_DEFAULT_TIMEZONES[city.countryCode.toUpperCase()];
        }
      }
    }
  }
  return getClientBrowserTimezone();
}

/**
 * Calculate UTC offset in minutes for an IANA timezone string on a specific date.
 */
function getTimezoneOffsetMinutes(timeZone, dateInput = new Date()) {
  if (!timeZone) timeZone = getClientBrowserTimezone();
  let date;
  if (typeof dateInput === 'string' && dateInput.trim()) {
    const str = dateInput.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      date = new Date(`${str}T12:00:00Z`);
    } else {
      date = new Date(str);
    }
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    date = new Date();
  }

  if (isNaN(date.getTime())) date = new Date();

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false
    });

    const parts = formatter.formatToParts(date);
    let year, month, day, hour = 0, minute = 0, second = 0;
    for (const p of parts) {
      if (p.type === 'year') year = parseInt(p.value, 10);
      if (p.type === 'month') month = parseInt(p.value, 10);
      if (p.type === 'day') day = parseInt(p.value, 10);
      if (p.type === 'hour') hour = parseInt(p.value, 10) % 24;
      if (p.type === 'minute') minute = parseInt(p.value, 10);
      if (p.type === 'second') second = parseInt(p.value, 10);
    }

    const utcWallClock = Date.UTC(year, month - 1, day, hour, minute, second);
    const actualUtc = date.getTime();
    return Math.round((utcWallClock - actualUtc) / 60000);
  } catch (e) {
    console.warn(`[Timezone] Failed to compute offset for ${timeZone}:`, e);
    return 0;
  }
}

/**
 * Calculate timezone shift in hours between two cities on a date.
 * Returns delta in hours (e.g. +7, -2, +5.5, 0).
 */
function getTimezoneDeltaHours(fromCity, toCity, dateInput = new Date()) {
  if (!fromCity || !toCity) return 0;
  const fromTz = getCityTimezone(fromCity);
  const toTz = getCityTimezone(toCity);
  if (fromTz === toTz) return 0;

  const offsetFrom = getTimezoneOffsetMinutes(fromTz, dateInput);
  const offsetTo = getTimezoneOffsetMinutes(toTz, dateInput);

  const deltaMinutes = offsetTo - offsetFrom;
  return deltaMinutes / 60;
}

/**
 * Format Timezone Transition Delta Badge string.
 * Example outputs:
 *   "🕐 +7 hrs"
 *   "🕐 -2 hrs"
 *   "🕐 +1 hr"
 * Returns empty string if no change or same timezone.
 */
function formatTimezoneDeltaBadge(fromCity, toCity, dateInput = new Date()) {
  if (!fromCity || !toCity) return '';
  const delta = getTimezoneDeltaHours(fromCity, toCity, dateInput);
  if (delta === 0) return '';

  const sign = delta > 0 ? '+' : '';
  const unit = Math.abs(delta) === 1 ? 'hr' : 'hrs';
  return `🕐 ${sign}${delta} ${unit}`;
}

/**
 * Dual Timezone preferences state
 */
function isDualTimeEnabled() {
  return localStorage.getItem('travelApp_dual_time_enabled') === 'true';
}

function setDualTimeEnabled(enabled) {
  if (enabled) {
    localStorage.setItem('travelApp_dual_time_enabled', 'true');
  } else {
    localStorage.removeItem('travelApp_dual_time_enabled');
  }
  if (typeof rebuildCurrentView === 'function') rebuildCurrentView();
  else if (typeof buildItinerary === 'function') buildItinerary();
}

function toggleDualTimeDisplay() {
  const current = isDualTimeEnabled();
  setDualTimeEnabled(!current);
  if (typeof showToast === 'function') {
    showToast(!current ? '🌐 Dual Timezone Display enabled' : '🌐 Dual Timezone Display disabled');
  }
}

/**
 * Convert local time in a venue/city timezone to home timezone time.
 * @param {string} timeStr - Local time e.g. "14:30"
 * @param {string} dateStr - Iso date e.g. "2026-06-15"
 * @param {string} localCityOrTz - City name or IANA timezone string
 * @param {string} homeCityOrTz - Home city name or IANA timezone string
 * @returns {string} Formatted home time string, e.g. "07:30 Home" or "" if invalid
 */
function convertLocalToHomeTime(timeStr, dateStr, localCityOrTz, homeCityOrTz) {
  if (!timeStr || !/^\d{1,2}:\d{2}$/.test(timeStr.trim())) return '';
  const localTz = getCityTimezone(localCityOrTz);
  const homeTz = homeCityOrTz ? getCityTimezone(homeCityOrTz) : getHomeTimezone();

  if (localTz === homeTz) return '';

  const cleanDate = dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim()) ? dateStr.trim() : '2026-06-15';
  const cleanTime = timeStr.trim();

  // Step 1: calculate offset of localTz on date
  const offsetLocalMin = getTimezoneOffsetMinutes(localTz, cleanDate);
  // Step 2: calculate offset of homeTz on date
  const offsetHomeMin = getTimezoneOffsetMinutes(homeTz, cleanDate);

  const [h, m] = cleanTime.split(':').map(Number);
  const localTotalMinutes = h * 60 + m;

  // Difference: homeOffset - localOffset
  const diffMin = offsetHomeMin - offsetLocalMin;
  let homeTotalMinutes = localTotalMinutes + diffMin;

  // Handle day wrap (-1, +1 day)
  let dayOffset = 0;
  while (homeTotalMinutes < 0) {
    homeTotalMinutes += 1440;
    dayOffset -= 1;
  }
  while (homeTotalMinutes >= 1440) {
    homeTotalMinutes -= 1440;
    dayOffset += 1;
  }

  const homeH = String(Math.floor(homeTotalMinutes / 60)).padStart(2, '0');
  const homeM = String(homeTotalMinutes % 60).padStart(2, '0');

  let dayOffsetLabel = '';
  if (dayOffset === 1) dayOffsetLabel = ' (+1d)';
  else if (dayOffset === -1) dayOffsetLabel = ' (-1d)';
  else if (dayOffset > 1) dayOffsetLabel = ` (+${dayOffset}d)`;
  else if (dayOffset < -1) dayOffsetLabel = ` (${dayOffset}d)`;

  return `${homeH}:${homeM}${dayOffsetLabel} Home`;
}

// Expose timezone helpers to window scope
window.cleanCityTimezoneName = cleanCityTimezoneName;
window.getCityTimezone = getCityTimezone;
window.getHomeTimezone = getHomeTimezone;
window.getTimezoneOffsetMinutes = getTimezoneOffsetMinutes;
window.getTimezoneDeltaHours = getTimezoneDeltaHours;
window.formatTimezoneDeltaBadge = formatTimezoneDeltaBadge;
window.isDualTimeEnabled = isDualTimeEnabled;
window.setDualTimeEnabled = setDualTimeEnabled;
window.toggleDualTimeDisplay = toggleDualTimeDisplay;
window.convertLocalToHomeTime = convertLocalToHomeTime;
