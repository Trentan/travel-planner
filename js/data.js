let appData = [];
let packingData = [];
let leaveHomeData = [];
let citiesData = []; // City entities for filtering/grouping - { id, name, country, dateFrom, dateTo }
let titleData = { title: "✈ New Trip Plan", subtitle: "Click here to add your trip subtitle/description" };
let currentFileName = "Default Template";

// Journeys data - make global so all modules can access
var journeys = [];
window.journeys = journeys;

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

// Get city name by ID
function getCityNameById(cityId) {
  if (!cityId) return '';
  const city = citiesData.find(c => c.id === cityId);
  return city ? city.name : '';
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
  const exportObj = { meta: titleData, itinerary: appData, packing: packingData, leaveHome: leaveHomeData, journeys: journeysData };
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
