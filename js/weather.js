/* ==========================================================================
   MODULE: Trip Day Weather Prediction & Context (js/weather.js)
   Responsibilities: Fetching, caching, and rendering city weather forecasts
   and seasonal context for trip days (Issue #79).
   ========================================================================== */

(function (window) {
  'use strict';

  // Weather Cache: in-memory map + sessionStorage persistence
  const WEATHER_CACHE_KEY = 'tp_weather_cache_v1';
  const CACHE_TTL_MS = 3 * 60 * 60 * 1000; // 3 hours

  function getLocalWeatherCache() {
    try {
      const stored = sessionStorage.getItem(WEATHER_CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {
      // sessionStorage unavailable or quota exceeded
    }
    return {};
  }

  function setLocalWeatherCache(cacheObj) {
    try {
      sessionStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(cacheObj));
    } catch (e) {
      // ignore
    }
  }

  const memoryWeatherCache = getLocalWeatherCache();

  /**
   * WMO Weather Code Mapping to Icons and User-Friendly Descriptions
   */
  function getWeatherInfoFromWmo(code) {
    const num = Number(code);
    switch (num) {
      case 0:
        return { icon: '☀️', label: 'Clear sky' };
      case 1:
        return { icon: '🌤️', label: 'Mainly clear' };
      case 2:
        return { icon: '⛅', label: 'Partly cloudy' };
      case 3:
        return { icon: '☁️', label: 'Overcast' };
      case 45:
      case 48:
        return { icon: '🌫️', label: 'Fog' };
      case 51:
      case 53:
      case 55:
        return { icon: '🌦️', label: 'Drizzle' };
      case 61:
      case 63:
      case 65:
        return { icon: '🌧️', label: 'Rain' };
      case 66:
      case 67:
        return { icon: '🌨️', label: 'Freezing rain' };
      case 71:
      case 73:
      case 75:
      case 77:
        return { icon: '❄️', label: 'Snow' };
      case 80:
      case 81:
      case 82:
        return { icon: '🌧️', label: 'Showers' };
      case 85:
      case 86:
        return { icon: '🌨️', label: 'Snow showers' };
      case 95:
      case 96:
      case 99:
        return { icon: '⛈️', label: 'Thunderstorm' };
      default:
        return { icon: '🌤️', label: 'Fair' };
    }
  }

  /**
   * Approximate seasonal summer/spring/winter temperatures for common destinations
   * when dates are beyond the live 16-day forecast horizon.
   */
  function getSeasonalEstimate(cityName, monthNum) {
    const name = String(cityName || '').toLowerCase();
    // Northern hemisphere summer (June-August: months 6,7,8)
    const isSummer = monthNum >= 6 && monthNum <= 8;
    const isWinter = monthNum === 12 || monthNum === 1 || monthNum === 2;

    if (name.includes('rome') || name.includes('florence') || name.includes('verona') || name.includes('milan') || name.includes('bolzano')) {
      return isSummer ? { icon: '☀️', high: 30, low: 19, label: 'Warm & sunny' } : { icon: '⛅', high: 14, low: 6, label: 'Mild' };
    }
    if (name.includes('vienna') || name.includes('bratislava') || name.includes('prague') || name.includes('munich') || name.includes('nuremberg') || name.includes('dresden')) {
      return isSummer ? { icon: '🌤️', high: 26, low: 15, label: 'Pleasant & sunny' } : { icon: '❄️', high: 4, low: -2, label: 'Chilly' };
    }
    if (name.includes('zurich') || name.includes('innsbruck') || name.includes('geneva')) {
      return isSummer ? { icon: '⛅', high: 24, low: 14, label: 'Mild & partly cloudy' } : { icon: '❄️', high: 3, low: -3, label: 'Alpine snow' };
    }
    if (name.includes('bangkok') || name.includes('phuket') || name.includes('samui') || name.includes('chiang')) {
      return { icon: '🌦️', high: 33, low: 26, label: 'Tropical & warm' };
    }
    if (name.includes('taipei') || name.includes('tokyo') || name.includes('kyoto') || name.includes('osaka')) {
      return isSummer ? { icon: '🌦️', high: 32, low: 25, label: 'Subtropical summer' } : { icon: '⛅', high: 12, low: 5, label: 'Cool' };
    }
    if (name.includes('london') || name.includes('dublin') || name.includes('edinburgh') || name.includes('paris')) {
      return isSummer ? { icon: '🌤️', high: 23, low: 14, label: 'Moderate summer' } : { icon: '🌧️', high: 9, low: 4, label: 'Cool & damp' };
    }
    return isSummer
      ? { icon: '🌤️', high: 25, low: 16, label: 'Seasonal climate' }
      : (isWinter ? { icon: '❄️', high: 6, low: 1, label: 'Seasonal climate' } : { icon: '⛅', high: 18, low: 10, label: 'Seasonal climate' });
  }

  /**
   * Resolve latitude and longitude coordinates for a city
   */
  function resolveCityCoordinates(cityName, fallbackLeg = null) {
    if (!cityName && fallbackLeg) {
      cityName = fallbackLeg.to || (typeof cleanCityNavLabel === 'function' ? cleanCityNavLabel(fallbackLeg.label || '') : fallbackLeg.label);
    }
    if (!cityName) return null;

    const clean = String(cityName)
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/gu, '')
      .replace(/📍|🌐/g, '')
      .trim();

    if (!clean) return null;

    // 1. Check user cities list
    const citiesList = (typeof cities !== 'undefined' && Array.isArray(cities))
      ? cities
      : (typeof window !== 'undefined' && Array.isArray(window.cities) ? window.cities : []);

    const userMatch = citiesList.find(c => c && c.name && c.name.toLowerCase() === clean.toLowerCase());
    if (userMatch && Number.isFinite(userMatch.lat) && Number.isFinite(userMatch.lng)) {
      return { lat: userMatch.lat, lng: userMatch.lng, name: userMatch.name };
    }

    // 2. Check local resolution via data.js if available
    if (typeof resolveCityLocationLocal === 'function') {
      const match = resolveCityLocationLocal({ name: clean });
      if (match && Number.isFinite(match.lat) && Number.isFinite(match.lng)) {
        return { lat: match.lat, lng: match.lng, name: clean };
      }
    }

    // 3. Check fallback in built-in databases if present
    if (typeof ALL_CITIES !== 'undefined' && Array.isArray(ALL_CITIES)) {
      const found = ALL_CITIES.find(c => c && c.name && c.name.toLowerCase() === clean.toLowerCase());
      if (found && Number.isFinite(found.lat) && Number.isFinite(found.lng)) {
        return { lat: found.lat, lng: found.lng, name: found.name };
      }
    }

    return null;
  }

  /**
   * Normalize an itinerary date string to YYYY-MM-DD
   */
  function getIsoDate(dateStr) {
    if (!dateStr) return '';
    if (typeof normalizeDate === 'function') {
      return normalizeDate(dateStr);
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const match = String(dateStr).match(/^(\d{1,2})\s+([A-Za-z]{3})/);
    if (!match) return '';
    const months = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
    const m = months[match[2].toLowerCase()] || '06';
    const d = match[1].padStart(2, '0');
    return `2026-${m}-${d}`;
  }

  /**
   * Fetch weather forecast for coordinates from Open-Meteo
   */
  async function fetchForecastData(lat, lng) {
    const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
    const now = Date.now();
    const cached = memoryWeatherCache[key];

    if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
      return cached.data;
    }

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      if (data && data.daily) {
        memoryWeatherCache[key] = {
          timestamp: now,
          data: data.daily
        };
        setLocalWeatherCache(memoryWeatherCache);
        return data.daily;
      }
    } catch (err) {
      // Network error or offline
    }
    return null;
  }

  /**
   * Resolve weather prediction for a specific date and city
   */
  async function getWeatherPrediction(dateStr, cityName, fallbackLeg = null) {
    const isoDate = getIsoDate(dateStr);
    const coords = resolveCityCoordinates(cityName, fallbackLeg);
    if (!coords) return null;

    if (!isoDate) return null;

    const targetDate = new Date(isoDate + 'T12:00:00Z');
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    const diffDays = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const monthNum = targetDate.getMonth() + 1;

    // If within active 16-day forecast horizon:
    if (diffDays >= -1 && diffDays <= 16) {
      const daily = await fetchForecastData(coords.lat, coords.lng);
      if (daily && Array.isArray(daily.time)) {
        const idx = daily.time.indexOf(isoDate);
        if (idx !== -1) {
          const wmo = daily.weathercode?.[idx] ?? 0;
          const info = getWeatherInfoFromWmo(wmo);
          const maxTemp = Math.round(daily.temperature_2m_max?.[idx] ?? 20);
          const minTemp = Math.round(daily.temperature_2m_min?.[idx] ?? 12);
          return {
            source: 'live',
            city: coords.name,
            icon: info.icon,
            high: maxTemp,
            low: minTemp,
            description: info.label,
            label: `${info.icon} ${maxTemp}° / ${minTemp}°C`
          };
        }
      }
    }

    // Outside active 16-day forecast window: graceful seasonal climate estimate
    const seasonal = getSeasonalEstimate(coords.name, monthNum);
    return {
      source: 'seasonal',
      city: coords.name,
      icon: seasonal.icon,
      high: seasonal.high,
      low: seasonal.low,
      description: `${seasonal.label} (Historical avg)`,
      label: `${seasonal.icon} ~${seasonal.high}°C`
    };
  }

  /**
   * Render HTML for the day weather badge.
   * Returns instant HTML (using cached forecast or seasonal climate fallback).
   */
  function renderDayWeatherBadgeHtml(dateStr, cityName, fallbackLeg = null) {
    const cleanCity = String(cityName || '').trim();
    const isoDate = getIsoDate(dateStr);
    if (!isoDate) return '';

    const coords = resolveCityCoordinates(cleanCity, fallbackLeg);
    const displayName = (coords && coords.name) || cleanCity || 'City';

    const targetDate = new Date(isoDate + 'T12:00:00Z');
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const diffDays = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Check cached live forecast first if in range
    if (coords && diffDays >= -1 && diffDays <= 16) {
      const key = `${coords.lat.toFixed(2)},${coords.lng.toFixed(2)}`;
      const cached = memoryWeatherCache[key];
      if (cached && cached.data && Array.isArray(cached.data.time)) {
        const idx = cached.data.time.indexOf(isoDate);
        if (idx !== -1) {
          const wmo = cached.data.weathercode?.[idx] ?? 0;
          const info = getWeatherInfoFromWmo(wmo);
          const maxTemp = Math.round(cached.data.temperature_2m_max?.[idx] ?? 20);
          const minTemp = Math.round(cached.data.temperature_2m_min?.[idx] ?? 12);
          const tooltip = `Live forecast for ${displayName}: ${maxTemp}°C / ${minTemp}°C · ${info.label}`;

          return `
            <span class="compact-day-weather-chip inline-flex items-center gap-1 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-semibold px-2 py-0.5 rounded-full text-[0.72rem] border border-sky-200/80 dark:border-sky-800/60 whitespace-nowrap shadow-2xs" title="${tooltip}" onclick="event.stopPropagation();">
              <span class="text-xs" aria-hidden="true">${info.icon}</span>
              <span>${maxTemp}° / ${minTemp}°C</span>
            </span>
          `;
        }
      }

      // Schedule background fetch and update DOM element if not cached
      setTimeout(() => {
        fetchForecastData(coords.lat, coords.lng).then(daily => {
          if (!daily || !Array.isArray(daily.time)) return;
          const idx = daily.time.indexOf(isoDate);
          if (idx === -1) return;
          const wmo = daily.weathercode?.[idx] ?? 0;
          const info = getWeatherInfoFromWmo(wmo);
          const maxTemp = Math.round(daily.temperature_2m_max?.[idx] ?? 20);
          const minTemp = Math.round(daily.temperature_2m_min?.[idx] ?? 12);
          const chipId = `weather-chip-${isoDate}-${coords.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
          const el = document.getElementById(chipId);
          if (el) {
            el.innerHTML = `<span class="text-xs" aria-hidden="true">${info.icon}</span> <span>${maxTemp}° / ${minTemp}°C</span>`;
            el.title = `Live forecast for ${displayName}: ${maxTemp}°C / ${minTemp}°C · ${info.label}`;
            el.className = 'compact-day-weather-chip inline-flex items-center gap-1 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-semibold px-2 py-0.5 rounded-full text-[0.72rem] border border-sky-200/80 dark:border-sky-800/60 whitespace-nowrap shadow-2xs transition-all duration-300';
          }
        }).catch(() => {});
      }, 50);
    }

    // Seasonal / climate context fallback
    const monthNum = targetDate.getMonth() + 1;
    const seasonal = getSeasonalEstimate(displayName, monthNum);
    const chipId = coords ? `weather-chip-${isoDate}-${coords.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : '';
    const tooltip = diffDays > 16
      ? `Estimated seasonal climate for ${displayName}: ~${seasonal.high}°C (Live forecast opens 14 days before trip)`
      : `Weather for ${displayName}: ~${seasonal.high}°C (${seasonal.label})`;

    return `
      <span ${chipId ? `id="${chipId}"` : ''} class="compact-day-weather-chip inline-flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 font-medium px-2 py-0.5 rounded-full text-[0.72rem] border border-slate-200 dark:border-slate-700/60 whitespace-nowrap shadow-2xs" title="${tooltip}" onclick="event.stopPropagation();">
        <span class="text-xs" aria-hidden="true">${seasonal.icon}</span>
        <span>~${seasonal.high}°C</span>
      </span>
    `;
  }

  // Exports for window and test suites
  const WeatherModule = {
    getWeatherInfoFromWmo,
    getSeasonalEstimate,
    resolveCityCoordinates,
    getIsoDate,
    fetchForecastData,
    getWeatherPrediction,
    renderDayWeatherBadgeHtml
  };

  if (typeof window !== 'undefined') {
    window.WeatherModule = WeatherModule;
    window.renderDayWeatherBadgeHtml = renderDayWeatherBadgeHtml;
    window.resolveCityCoordinates = resolveCityCoordinates;
    window.getWeatherPrediction = getWeatherPrediction;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeatherModule;
  }
})(typeof window !== 'undefined' ? window : globalThis);
