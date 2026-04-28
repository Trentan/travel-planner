let appData = [];
let packingData = [];
let leaveHomeData = [];
let citiesData = []; // City entities for filtering/grouping - { id, name, country, dateFrom, dateTo, colour }

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

// Add or update a city
function addOrUpdateCity(cityName, country = '', dateFrom = '', dateTo = '') {
  if (!cityName) return null;

  // Check if city already exists
  const existing = citiesData.find(c => c.name.toLowerCase() === cityName.toLowerCase().trim());
  if (existing) {
    // Update existing city
    if (country) existing.country = country;
    if (dateFrom && dateFrom < existing.dateFrom) existing.dateFrom = dateFrom;
    if (dateTo && dateTo > existing.dateTo) existing.dateTo = dateTo;
    return existing;
  }

  // Create new city with random color
  const newCity = {
    id: 'city-' + cityName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    name: cityName,
    country: country,
    dateFrom: dateFrom,
    dateTo: dateTo,
    colour: getRandomCityColor()
  };
  citiesData.push(newCity);
  return newCity;
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
    populateCityList();
    modal.style.display = 'flex';
  }
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

  citiesData.forEach(city => {
    const flag = getCityFlag(city.name);
    const isHome = isHomeCity(city.name);
    const homeBadge = isHome ? ' <span style="background: #27AE60; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem;">🏠 Home</span>' : '';

    // Get city color from matching leg, or use city's stored color
    let cityColor = city.colour || '#2C3E50';
    if (!city.colour) {
      // Find matching leg for color
      const matchingLeg = appData.find(leg => leg.days.some(day => day.to === city.name || day.from === city.name));
      if (matchingLeg) {
        cityColor = matchingLeg.colour || '#2C3E50';
      }
    }

    const row = document.createElement('div');
    row.style.cssText = `display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; border-bottom: 1px solid #eee; border-left: 4px solid ${cityColor};`;
    row.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.75rem; flex: 1;">
        <span style="font-size: 1.5rem;">${flag}</span>
        <div style="flex: 1;">
          <div style="font-weight: 500;">${city.name}${homeBadge}</div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 4px;">
            <input type="text" value="${city.country}" placeholder="Country"
              onchange="updateCityCountry('${city.id}', this.value)"
              style="padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.85rem; width: 120px;">
          </div>
        </div>
      </div>
      <button class="del-btn" title="Delete City" onclick="deleteCityFromDialog('${city.id}')">×</button>
    `;
    container.appendChild(row);
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
  const countryInput = document.getElementById('newCityCountry');

  const name = nameInput?.value?.trim();
  const country = countryInput?.value?.trim();

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

  const newCity = addOrUpdateCity(name, country);
  if (newCity) {
    saveData(false);
    nameInput.value = '';
    countryInput.value = '';
    populateCityList();
    if (typeof buildCityNav === 'function') {
      buildCityNav();
    }
  }
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
  if (savedLeaveHome) { leaveHomeData = JSON.parse(savedLeaveHome); }
  else { leaveHomeData = JSON.parse(JSON.stringify(DEFAULT_LEAVE_HOME)); }

  const savedCities = localStorage.getItem('travelApp_cities_v1');
  if (savedCities) {
    try {
      citiesData = JSON.parse(savedCities);
    } catch (e) {
      console.error('[Cities] Failed to parse saved cities:', e);
      citiesData = [];
    }
  }

  const savedMeta = localStorage.getItem('travelApp_meta_template');
  if (savedMeta) { titleData = JSON.parse(savedMeta); }

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

function saveData(showTick = true) {
  titleData.title = document.getElementById('mainTitle').innerText;
  titleData.subtitle = document.getElementById('mainSubtitle').innerText;
  localStorage.setItem('travelApp_meta_template', JSON.stringify(titleData));
  localStorage.setItem('travelApp_v2026_template', JSON.stringify(appData));
  localStorage.setItem('travelApp_packing_v3', JSON.stringify(packingData));
  localStorage.setItem('travelApp_leavehome_v3', JSON.stringify(leaveHomeData));
  localStorage.setItem('travelApp_stays_v1', JSON.stringify(stays));

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
        titleData = importedData.meta;
      }

      // Import journeys if present
      if (importedData.journeys && Array.isArray(importedData.journeys)) {
        localStorage.setItem('travelApp_journeys_v1', JSON.stringify(importedData.journeys));
        console.log(`[Import] Saved ${importedData.journeys.length} journeys to localStorage`);
      } else {
        console.log('[Import] No journeys found in imported data');
      }

      if (importedData.stays && Array.isArray(importedData.stays)) {
        stays = importedData.stays;
        window.stays = stays;
      }

      currentFileName = file.name;
      localStorage.setItem('travelApp_filename_v2026', currentFileName);
      localStorage.setItem('travelApp_last_import_v2026', new Date().toISOString());

      saveData(false);
      location.reload();
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
