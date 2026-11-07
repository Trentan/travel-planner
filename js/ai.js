function getAiFieldValue(id, fallback) {
  const el = document.getElementById(id);
  const value = el && typeof el.value === 'string' ? el.value.trim() : '';
  return value || fallback;
}

function _buildAiPromptHeader({ title, regions, dates, citiesInput, junctions, vibe }) {
  return `I am building a travel itinerary app and need a complete JSON dataset for an upcoming trip.

TRIP DETAILS:
- Title: ${title}
- Target Regions / Countries: ${regions || 'Not specified (Choose logical countries based on vibe)'}
- Specific Cities: ${citiesInput || 'None specified (AI should select 3-5 logical destination cities in the target region)'}
- Fixed Pre-booked Flights & Junctions: ${junctions || 'None (Flexible travel junctions)'}
- Dates & Duration: ${dates}
- Travel Vibe & Preferences: ${vibe}

YOUR TASK:
Generate a detailed daily itinerary tailored to my preferences. If specific cities are not specified above, select 3-5 logical destination cities within the requested regions/countries that fit the pre-booked flight junctions. Create the result as a downloadable .json file that I can save and import into the app.

The downloadable file must contain one JSON object that exactly matches this structure. Do not wrap it in markdown, commentary, or code fences.`;
}

function _getAiPromptSchema(title, cityCount) {
  return `EXPECTED JSON SCHEMA:
{
  "meta": {
    "title": "${title}",
    "subtitle": "Generated ${cityCount}-city itinerary"
  },
  "cities": [
    {
      "id": "city-cityname",
      "name": "City Name",
      "country": "Country Name",
      "countryCode": "ISO-3166-1 alpha-2 code (e.g. ID, FR, JP)",
      "code": "IATA city or airport code where known (e.g. DPS, CDG)",
      "lat": -8.4095,
      "lng": 115.1889,
      "dateFrom": "YYYY-MM-DD",
      "dateTo": "YYYY-MM-DD",
      "colour": "#1ABC9C"
    }
  ],
  "itinerary": [
    {
      "id": "leg-start",
      "cityId": "city-home",
      "label": "🏠 Start (Home City)",
      "colour": "#2C3E50",
      "cityFood": [],
      "suggestedActivities": [],
      "legTips": [],
      "days": [
        {
          "date": "YYYY-MM-DD",
          "day": "Mon",
          "from": "Home",
          "to": "First City",
          "completed": false,
          "desc": "Departure flight and travel day",
          "activityItems": [
            {
              "text": "Outbound Flight to First City",
              "time": "09:30",
              "startTime": "09:30",
              "cost": "0",
              "done": false,
              "category": "transport",
              "notes": "Have passport, e-tickets, and travel documents ready.",
              "location": "Airport",
              "lat": -27.3842,
              "lng": 153.1175,
              "cityId": "city-home"
            }
          ]
        }
      ]
    },
    {
      "id": "leg-cityname",
      "cityId": "city-cityname",
      "label": "🌴 City Name",
      "colour": "#1ABC9C",
      "cityFood": [
        {
          "text": "Restaurant or Cafe Name - signature dishes or specialties",
          "location": "Venue Address or Neighborhood, City Name",
          "lat": -8.6500,
          "lng": 115.1300,
          "done": false,
          "cityId": "city-cityname"
        }
      ],
      "suggestedActivities": [
        {
          "id": "act-cityname-1",
          "title": "Suggested Activity or Highlight",
          "category": "fitness",
          "estTime": "1.5 hrs",
          "estCost": "0",
          "notes": "Brief notes on why this is recommended.",
          "location": "Specific Venue or Landmark, Area, City Name",
          "lat": -8.6543,
          "lng": 115.1258,
          "cityId": "city-cityname"
        }
      ],
      "legTips": [
        {
          "text": "Practical local tip (e.g. visa requirement, transport card, safety, local etiquette).",
          "cityId": "city-cityname"
        }
      ],
      "days": [
        {
          "date": "YYYY-MM-DD",
          "day": "Tue",
          "from": "City Name",
          "to": "City Name",
          "completed": false,
          "desc": "Morning workout, cultural sights, and sunset dining",
          "activityItems": [
            {
              "text": "Morning Run or Fitness Session",
              "time": "07:00",
              "startTime": "07:00",
              "cost": "0",
              "done": false,
              "category": "fitness",
              "notes": "Scenic seaside or park loop.",
              "location": "Specific Beach, Park, or Landmark, City Name",
              "lat": -8.6543,
              "lng": 115.1258,
              "cityId": "city-cityname"
            },
            {
              "text": "Brunch at Local Cafe",
              "time": "09:30",
              "startTime": "09:30",
              "cost": "20",
              "done": false,
              "category": "food",
              "notes": "Healthy bowls and local coffee.",
              "location": "Cafe Name & Street/Area, City Name",
              "lat": -8.6512,
              "lng": 115.1324,
              "cityId": "city-cityname"
            }
          ]
        }
      ]
    },
    {
      "id": "leg-return",
      "cityId": "city-home",
      "label": "🛫 Return Home",
      "colour": "#2C3E50",
      "cityFood": [],
      "suggestedActivities": [],
      "legTips": [],
      "days": [
        {
          "date": "YYYY-MM-DD",
          "day": "Sun",
          "from": "Last City",
          "to": "Home",
          "completed": false,
          "desc": "Check-out and flight home",
          "activityItems": [
            {
              "text": "Return Flight Home",
              "time": "14:15",
              "startTime": "14:15",
              "cost": "0",
              "done": false,
              "category": "transport",
              "notes": "Arrive at airport 3 hours before departure.",
              "location": "Airport",
              "lat": -8.7482,
              "lng": 115.1672,
              "cityId": "city-cityname"
            }
          ]
        }
      ]
    }
  ],
  "journeys": [
    {
      "id": "journey-1",
      "journeyId": "journey-outbound",
      "journeyName": "Home to First City",
      "isMultiLeg": false,
      "segmentOrder": 1,
      "fromLocation": "Home City",
      "toLocation": "First City",
      "fromCityId": "city-home",
      "toCityId": "city-cityname",
      "fromLat": -27.3842,
      "fromLng": 153.1175,
      "toLat": -8.7482,
      "toLng": 115.1672,
      "departureDate": "YYYY-MM-DD",
      "departureTime": "09:30",
      "arrivalDate": "YYYY-MM-DD",
      "arrivalTime": "14:30",
      "transportType": "flight",
      "provider": "Airline Name",
      "routeCode": "FL123",
      "cost": 500,
      "status": "confirmed",
      "bookingReference": "ABC123"
    }
  ],
  "stays": [
    {
      "id": "stay-1",
      "cityId": "city-cityname",
      "city": "City Name",
      "propertyName": "Hotel Name",
      "location": "Hotel Address or Neighborhood, City Name",
      "lat": -8.6521,
      "lng": 115.1310,
      "checkIn": "YYYY-MM-DD",
      "checkOut": "YYYY-MM-DD",
      "nights": 3,
      "status": "confirmed",
      "provider": "Booking.com",
      "bookingRef": "ABC123",
      "totalCost": 450,
      "notes": "Near city center, pool and gym"
    }
  ],
  "packing": [
    {
      "areaName": "🚶 Walk-on Gear (Wear onto plane)",
      "areaColor": "#E67E22",
      "categories": [
        {
          "title": "Plane Outfit",
          "items": [
            { "text": "Underwear", "done": false },
            { "text": "Jeans / Comfortable Pants", "done": false },
            { "text": "Sports shoes", "done": false },
            { "text": "Socks", "done": false },
            { "text": "Activewear shirt", "done": false },
            { "text": "Hoodie / Layer", "done": false }
          ]
        }
      ]
    },
    {
      "areaName": "🧳 Carry-on Packed Bag (Main Luggage)",
      "areaColor": "#2980B9",
      "categories": [
        {
          "title": "Clothes",
          "items": [
            { "text": "T-shirts & Tank Tops", "done": false },
            { "text": "Shorts & Pants", "done": false },
            { "text": "Swimwear", "done": false },
            { "text": "Underwear & Socks", "done": false },
            { "text": "Workout outfit", "done": false }
          ]
        },
        {
          "title": "Toiletries",
          "items": [
            { "text": "Toothbrush & Toothpaste", "done": false },
            { "text": "Deodorant", "done": false },
            { "text": "Sunscreen", "done": false }
          ]
        }
      ]
    },
    {
      "areaName": "🎒 Personal Item Bag (Under Seat)",
      "areaColor": "#8E44AD",
      "categories": [
        {
          "title": "Essentials",
          "items": [
            { "text": "Passport", "done": false },
            { "text": "Wallet & Cards", "done": false },
            { "text": "Phone", "done": false },
            { "text": "Headphones", "done": false },
            { "text": "Phone charger & Power bank", "done": false },
            { "text": "Universal Power Adapter", "done": false }
          ]
        }
      ]
    }
  ],
  "leaveHome": [
    { "text": "Lock all doors and windows", "done": false },
    { "text": "Set security alarm", "done": false },
    { "text": "Charge all devices", "done": false }
  ]
}`;
}

function _getAiPromptRules(cities) {
  const cityRuleText = cities.length
    ? `Use specified cities: ${cities.join(', ')}.`
    : 'Choose 3-5 logical cities in the requested regions.';

  return `CRITICAL RULES FOR GENERATION:

1. CITIES: Create the cities array. ${cityRuleText}
   - For multi-base regions or island hubs (e.g. Bali, Phuket, Hawaii), create separate entries for each major hub/area (e.g. "Canggu", "Ubud", "Uluwatu") rather than collapsing into a single generic region name.
   - Auto-generate city IDs as "city-[lowercase-city-name]" (e.g. "city-canggu", "city-ubud").
   - City "name" must be the clean standard city name (e.g. "Canggu", NOT "Canggu Bali").
   - Assign distinct colors from: #E74C3C, #3498DB, #27AE60, #F39C12, #9B59B6, #1ABC9C, #E91E63, #795548.
   - Include country, countryCode, code, and accurate decimal "lat" and "lng" coordinates for every city.

2. ITINERARY LEGS & CLEAN LABELS: Create legs in chronological order:
   - "leg-start": Departure from home (cityId: "city-home", label: "🏠 Start (Home City)").
   - One leg per destination hub/city (id: "leg-[cityname]", cityId: "city-[cityname]").
   - The leg "label" for each destination leg MUST BE "[Emoji] [City Name]" (e.g. "🌴 Canggu" or "🌿 Ubud"). DO NOT append long itinerary descriptions or theme text (e.g. NEVER "🌴 Bali Wellness, Diving & Fitness"). Put themes/descriptions in day "desc".
   - "leg-return": Return to home (cityId: "city-home", label: "🛫 Return Home").

3. DAYS & ACTIVITY ITEMS ("text", "location", "lat", "lng" FIELDS):
   - Every day must have "date" (YYYY-MM-DD), "day" (Mon, Tue, etc.), "from", "to", "completed": false, "desc", and "activityItems".
   - In "activityItems", each item MUST have the property "text" containing the activity name/title (e.g. "text": "Morning Run along Echo Beach"). NEVER use "title" instead of "text" for activityItems!
   - Every item MUST include a non-empty, mappable "location" specifying the actual venue name, area, or landmark (e.g. "location": "Echo Beach, Canggu", "location": "Pyramids of Chi, Ubud") AND actual (or close approximate) decimal "lat" and "lng" coordinates so every activity can be plotted at its true map position. NEVER omit location, lat, or lng, or leave location as empty string ""!
   - Include "time", "cost", "category", "notes", "location", "lat", "lng", "done": false, and "cityId".
   - Category must be one of: "fitness", "sight", "attraction", "wellness", "food", "transport".

4. SUGGESTED ACTIVITIES & POOL:
   - In each destination leg, include 3-5 suggestedActivities in the pool with "id", "title", "category", "estTime", "estCost", "notes", "location", "lat", "lng", and "cityId".
   - Always include a specific mappable "location" and actual (or close approximate) decimal "lat" and "lng" coordinates for every suggested activity.

5. CITY FOOD & TIPS ("text" FIELD):
   - In "cityFood", every item must have "text" (e.g. "text": "Crate Cafe - healthy breakfast bowls"), "location", "lat", "lng", "done": false, and "cityId".
   - In "legTips", every item must have "text" (e.g. "text": "Apply for e-VoA online before flying"), and "cityId". DO NOT use object with { title, note }; put the full tip in "text".

6. STAYS & JOURNEYS (MAP COORDINATES & LOCATIONS):
   - In "stays", the "city" property MUST EXACTLY match the "name" in "cities" (e.g. "city": "Bali"), and "cityId" must match "id" in "cities" (e.g. "city-bali"). Include a specific mappable "location" (hotel street address or neighborhood) and actual (or close approximate) decimal "lat" and "lng" coordinates for every accommodation stay. Calculate nights = checkOut - checkIn.
   - In "journeys", provide flights/transport matching the booked junctions. Set "fromCityId", "toCityId", "fromLocation", "toLocation", and include actual (or close approximate) decimal coordinates "fromLat", "fromLng", "toLat", and "toLng" for the departure and arrival airports, stations, or cities.

7. PACKING & CHECKLIST:
   - "packing" MUST strictly follow the 3-area nested structure with "areaName", "categories", and "items" (each item has "text" and "done": false). NEVER put loose strings directly into the "packing" array.
   - "leaveHome" should include pre-trip tasks, visa reminders, tourist tax payments, and home security.

8. Make the JSON valid, complete, and ready to import into the app without manual restructuring.

9. Deliver the final answer as an attached/downloadable .json file. If your interface cannot attach files, output only the raw JSON object so I can save it as a .json file.`;
}

function buildAiPrompt({ title, regions, dates, citiesInput, cities, junctions, vibe }) {
  const cityCount = cities.length || 3;
  const header = _buildAiPromptHeader({ title, regions, dates, citiesInput, junctions, vibe });
  const schema = _getAiPromptSchema(title, cityCount);
  const rules = _getAiPromptRules(cities);

  return `${header}\n\n${schema}\n\n${rules}`;
}

function getAiTripTitlePrefill() {
  const title = typeof titleData !== 'undefined' && titleData ? titleData.title : '';
  return String(title || '').trim();
}

function getAiTripDatesPrefill() {
  const dates = [];
  if (typeof appData !== 'undefined' && Array.isArray(appData)) {
    appData.forEach(leg => {
      (leg.days || []).forEach(day => {
        if (day && day.date) dates.push(day.date);
      });
    });
  }

  const sortedDates = dates
    .map(date => (typeof normalizeTripDateValue === 'function' ? normalizeTripDateValue(date) : date))
    .filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort();

  if (!sortedDates.length) return '';

  const firstDate = sortedDates[0];
  const lastDate = sortedDates[sortedDates.length - 1];
  const formatDate = date => (typeof formatTripDateForDisplay === 'function' ? formatTripDateForDisplay(date) : date);
  const range = firstDate === lastDate ? formatDate(firstDate) : `${formatDate(firstDate)} - ${formatDate(lastDate)}`;

  const flights = Array.isArray(window.journeys)
    ? window.journeys.flatMap(journey => {
        const legs = Array.isArray(journey.legs) && journey.legs.length ? journey.legs : [journey];
        return legs
          .filter(leg => String(leg.type || leg.transportType || '').toLowerCase() === 'flight')
          .map(leg => leg.routeCode || leg.provider || '')
          .filter(Boolean);
      })
    : [];

  return flights.length ? `${range}. Flights: ${[...new Set(flights)].join(', ')}` : range;
}

function getAiTripCitiesPrefill() {
  const cityNames = [];
  const addCity = value => {
    const city = String(value || '').trim();
    if (!city || /^in transit$/i.test(city) || city === '—') return;
    if (!cityNames.some(existing => existing.toLowerCase() === city.toLowerCase())) cityNames.push(city);
  };

  if (typeof citiesData !== 'undefined' && Array.isArray(citiesData) && citiesData.length) {
    citiesData.filter(city => !city.isTransit).forEach(city => addCity(city.name));
  } else if (typeof appData !== 'undefined' && Array.isArray(appData)) {
    appData.forEach(leg => {
      const label = String(leg.label || '').replace(/[^\w\s.'&-]/g, '').trim();
      addCity(label);
      (leg.days || []).forEach(day => {
        addCity(day.from);
        addCity(day.to);
      });
    });
  }

  return cityNames.join(', ');
}

function setAiFieldIfEmpty(id, value) {
  const field = document.getElementById(id);
  if (!field || !value || String(field.value || '').trim()) return;
  field.value = value;
}

function prefillAIDialogFields() {
  setAiFieldIfEmpty('aiTripTitle', getAiTripTitlePrefill());
  setAiFieldIfEmpty('aiTripDates', getAiTripDatesPrefill());
  setAiFieldIfEmpty('aiTripCities', getAiTripCitiesPrefill());

  let vibePrefill = '';
  try {
    const savedVibe = JSON.parse(localStorage.getItem('travelApp_vibeProfile') || 'null');
    if (savedVibe) {
      const parts = [];
      if (savedVibe.party) parts.push(`Party: ${savedVibe.party}`);
      if (savedVibe.pacing) parts.push(`Pacing: ${savedVibe.pacing}`);
      if (savedVibe.interests && savedVibe.interests.length) parts.push(`Interests: ${savedVibe.interests.join(', ')}`);
      if (savedVibe.notes) parts.push(`Notes: ${savedVibe.notes}`);
      vibePrefill = parts.join('. ');
    }
  } catch (e) {}

  if (vibePrefill) {
    setAiFieldIfEmpty('aiTripVibe', vibePrefill);
  }
}

function generatePrompt() {
  let promptText = '';
  if (currentAiScope && (currentAiScope.type === 'DAY' || currentAiScope.type === 'CITY')) {
    const scopedInput = document.getElementById('aiScopedInstruction');
    const instruction = scopedInput ? scopedInput.value.trim() : '';
    promptText = buildScopedAiPrompt({
      scope: currentAiScope,
      instruction,
      existingActivities: currentAiScope.existingActivities || []
    });
  } else {
    const title = getAiFieldValue('aiTripTitle', 'New Travel Adventure');
    const regions = getAiFieldValue('aiTripRegions', '');
    const dates = getAiFieldValue('aiTripDates', '14 days');
    const citiesInput = getAiFieldValue('aiTripCities', '');
    const junctions = getAiFieldValue('aiTripBookedJunctions', '');
    const vibe = getAiFieldValue('aiTripVibe', 'Relaxed pacing, great food, local culture, walking friendly.');
    const cities = citiesInput ? citiesInput.split(',').map(city => city.trim()).filter(Boolean) : [];
    promptText = buildAiPrompt({ title, regions, dates, citiesInput, cities, junctions, vibe });
  }

  const outputBox = document.getElementById('aiOutputBox');
  const promptArea = document.getElementById('aiPromptOutput');

  if (outputBox) outputBox.style.display = 'block';
  if (promptArea) promptArea.value = promptText;

  return promptText;
}

async function copyPrompt() {
  const promptArea = document.getElementById('aiPromptOutput');
  const promptText = promptArea ? promptArea.value : '';

  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(promptText);
    } else if (promptArea && typeof promptArea.select === 'function' && typeof document.execCommand === 'function') {
      promptArea.select();
      document.execCommand('copy');
    } else {
      throw new Error('Clipboard API unavailable');
    }

    if (typeof showToast === 'function') {
      showToast('Prompt copied to clipboard! Paste this into an AI to generate your trip JSON.');
    } else if (typeof alert === 'function') {
      alert('Prompt copied to clipboard! Paste this into an AI to generate your trip JSON.');
    }
    return true;
  } catch (error) {
    if (promptArea && typeof promptArea.select === 'function' && typeof document.execCommand === 'function') {
      promptArea.select();
      const copied = document.execCommand('copy');
      if (copied) {
        if (typeof showToast === 'function') {
          showToast('Prompt copied to clipboard! Paste this into an AI to generate your trip JSON.');
        } else if (typeof alert === 'function') {
          alert('Prompt copied to clipboard! Paste this into an AI to generate your trip JSON.');
        }
        return true;
      }
    }

    if (typeof showToast === 'function') {
      showToast('Could not copy automatically. Select the prompt and copy it manually.');
    } else if (typeof alert === 'function') {
      alert('Could not copy automatically. Select the prompt and copy it manually.');
    }
    return false;
  }
}

globalThis._getAiPromptSchema = _getAiPromptSchema;
globalThis.buildAiPrompt = buildAiPrompt;
globalThis.prefillAIDialogFields = prefillAIDialogFields;
globalThis.generatePrompt = generatePrompt;
globalThis.copyPrompt = copyPrompt;

// -------------------------------------------------------------
// Interactive Two-Way AI Co-Pilot & Diff Ingestion Engine (Issue #632)
// -------------------------------------------------------------

let currentAiScope = { type: 'FULL_TRIP', legIndex: null, dayIndex: null, date: null, cityName: null };

function setAiScope(scope) {
  currentAiScope = Object.assign({ type: 'FULL_TRIP', legIndex: null, dayIndex: null, date: null, cityName: null }, scope);
  updateAiModalScopeUi();
}

function getAiScope() {
  return currentAiScope;
}

function updateAiModalScopeUi() {
  const scopeBadge = document.getElementById('aiScopeBadge');
  const scopeNotice = document.getElementById('aiScopeNotice');
  const scopeQuickChips = document.getElementById('aiScopeQuickChips');
  const formFullTrip = document.getElementById('aiFullTripFormFields');
  const formScoped = document.getElementById('aiScopedFormFields');

  if (!scopeBadge) return;

  if (currentAiScope.type === 'DAY') {
    scopeBadge.textContent = 'Modifying Day: ' + (currentAiScope.date || 'Selected') + ' (' + (currentAiScope.cityName || 'City') + ')';
    scopeBadge.className = 'px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800';
    if (scopeNotice) {
      scopeNotice.style.display = 'block';
      scopeNotice.textContent = 'Targeting Day ' + (typeof currentAiScope.dayIndex === 'number' ? currentAiScope.dayIndex + 1 : '') + ' in ' + (currentAiScope.cityName || 'current city') + '. AI modifications will apply to this day only.';
    }
    if (scopeQuickChips) scopeQuickChips.style.display = 'flex';
    if (formFullTrip) formFullTrip.style.display = 'none';
    if (formScoped) formScoped.style.display = 'block';
  } else if (currentAiScope.type === 'CITY') {
    const daysCount = Array.isArray(currentAiScope.cityDays) ? currentAiScope.cityDays.length : (currentAiScope.daysCount || 'multi-day');
    scopeBadge.textContent = 'Modifying City Stay: ' + (currentAiScope.cityName || 'City') + ' (' + daysCount + ' Days)';
    scopeBadge.className = 'px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 border border-purple-300 dark:border-purple-800';
    if (scopeNotice) {
      scopeNotice.style.display = 'block';
      scopeNotice.textContent = 'Targeting entire stay in ' + (currentAiScope.cityName || 'current city') + ' across all ' + daysCount + ' days. AI modifications will optimize the full multi-day pacing, food quests, and daily activities.';
    }
    if (scopeQuickChips) scopeQuickChips.style.display = 'flex';
    if (formFullTrip) formFullTrip.style.display = 'none';
    if (formScoped) formScoped.style.display = 'block';
  } else {
    scopeBadge.textContent = 'Full Trip Builder';
    scopeBadge.className = 'px-2.5 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200 border border-teal-300 dark:border-teal-800';
    if (scopeNotice) scopeNotice.style.display = 'none';
    if (scopeQuickChips) scopeQuickChips.style.display = 'none';
    if (formFullTrip) formFullTrip.style.display = 'block';
    if (formScoped) formScoped.style.display = 'none';
  }
}

function switchAiTab(tabName) {
  const generateTabBtn = document.getElementById('aiTabBtnGenerate');
  const ingestTabBtn = document.getElementById('aiTabBtnIngest');
  const generateView = document.getElementById('aiTabContentGenerate');
  const ingestView = document.getElementById('aiTabContentIngest');

  if (!generateTabBtn || !ingestTabBtn || !generateView || !ingestView) return;

  if (tabName === 'ingest') {
    generateTabBtn.classList.remove('active', 'border-teal-600', 'text-teal-600', 'dark:text-teal-400');
    generateTabBtn.classList.add('border-transparent', 'text-slate-500');
    ingestTabBtn.classList.add('active', 'border-teal-600', 'text-teal-600', 'dark:text-teal-400');
    ingestTabBtn.classList.remove('border-transparent', 'text-slate-500');
    generateView.style.display = 'none';
    ingestView.style.display = 'block';
  } else {
    ingestTabBtn.classList.remove('active', 'border-teal-600', 'text-teal-600', 'dark:text-teal-400');
    ingestTabBtn.classList.add('border-transparent', 'text-slate-500');
    generateTabBtn.classList.add('active', 'border-teal-600', 'text-teal-600', 'dark:text-teal-400');
    generateTabBtn.classList.remove('border-transparent', 'text-slate-500');
    generateView.style.display = 'block';
    ingestView.style.display = 'none';
  }
}

function sanitizeAiResponseText(rawText) {
  if (typeof rawText !== 'string') return '';
  let cleaned = rawText.trim();

  // If wrapped in markdown code fence, extract interior
  const fenceRegex = /^```(?:json)?\s*([\s\S]*?)\s*```$/m;
  const match = cleaned.match(fenceRegex);
  if (match && match[1]) {
    cleaned = match[1].trim();
  } else {
    // Check if code fence exists somewhere in the text
    const anyFence = cleaned.indexOf('```');
    if (anyFence !== -1) {
      const parts = cleaned.split('```');
      if (parts.length >= 3) {
        let inside = parts[1].trim();
        if (inside.toLowerCase().startsWith('json')) {
          inside = inside.substring(4).trim();
        }
        cleaned = inside;
      }
    }
  }

  // Find outermost JSON brackets
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1).trim();
  }

  return cleaned;
}

function parseAndValidateAiPayload(rawText, scope = { type: 'FULL_TRIP' }) {
  const cleaned = sanitizeAiResponseText(rawText);
  if (!cleaned) {
    return { valid: false, data: null, error: 'Empty or invalid response. No JSON object found.' };
  }

  try {
    const parsed = JSON.parse(cleaned);

    if (scope && scope.type === 'CITY') {
      if (!parsed || (typeof parsed !== 'object')) {
        return { valid: false, data: null, error: 'Expected JSON object for city stay modification.' };
      }

      const rawDays = Array.isArray(parsed.days) ? parsed.days : [];
      if (rawDays.length === 0) {
        return { valid: false, data: null, error: 'Missing "days" array in city modification response.' };
      }

      const normalizedDays = rawDays.map((d, idx) => {
        const rawActivities = Array.isArray(d.activities) ? d.activities : (Array.isArray(d.activityItems) ? d.activityItems : []);
        const normalizedActivities = rawActivities.map(act => {
          if (typeof act === 'string') return { text: act, time: '09:00', cost: '0' };
          return {
            text: act.text || act.title || act.name || 'Activity',
            time: act.time || act.startTime || '09:00',
            cost: act.cost ? String(act.cost).replace(/[^0-9.]/g, '') : '0',
            notes: act.notes || '',
            category: act.category || 'sightseeing'
          };
        });

        const matchedDate = d.date || (scope.cityDays && scope.cityDays[idx] ? scope.cityDays[idx].date : '');
        return {
          date: matchedDate,
          desc: d.desc || d.description || '',
          activities: normalizedActivities
        };
      });

      const normalizedFood = Array.isArray(parsed.cityFood)
        ? parsed.cityFood.map(f => (typeof f === 'string' ? { text: f } : { text: f.text || f.name || 'Food item' }))
        : [];

      const normalizedTips = Array.isArray(parsed.legTips)
        ? parsed.legTips.map(t => (typeof t === 'string' ? { text: t } : { text: t.text || t.tip || 'Travel tip' }))
        : [];

      return {
        valid: true,
        data: {
          city: parsed.city || scope.cityName || '',
          days: normalizedDays,
          cityFood: normalizedFood,
          legTips: normalizedTips
        },
        error: null
      };
    }

    if (scope && scope.type === 'DAY') {
      let activities = [];
      if (Array.isArray(parsed.activities)) {
        activities = parsed.activities;
      } else if (Array.isArray(parsed.activityItems)) {
        activities = parsed.activityItems;
      } else if (Array.isArray(parsed)) {
        activities = parsed;
      } else {
        return { valid: false, data: null, error: 'Expected JSON object with "activities" or "activityItems" array.' };
      }

      const normalizedActivities = activities.map(act => {
        if (typeof act === 'string') {
          return { text: act, time: '09:00', cost: '0' };
        }
        return {
          text: act.text || act.title || act.name || 'Activity',
          time: act.time || act.startTime || '09:00',
          cost: act.cost ? String(act.cost).replace(/[^0-9.]/g, '') : '0',
          notes: act.notes || '',
          category: act.category || 'sightseeing'
        };
      });

      return {
        valid: true,
        data: {
          date: parsed.date || scope.date || '',
          desc: parsed.desc || parsed.description || '',
          activities: normalizedActivities
        },
        error: null
      };
    }

    if (!parsed || (typeof parsed !== 'object')) {
      return { valid: false, data: null, error: 'Invalid JSON root. Must be a JSON object.' };
    }

    if (!parsed.cities && !parsed.itinerary && !parsed.meta) {
      return { valid: false, data: null, error: 'Invalid travel trip schema: missing meta, cities, or itinerary.' };
    }

    return { valid: true, data: parsed, error: null };
  } catch (err) {
    return { valid: false, data: null, error: 'JSON Parse Error: ' + err.message };
  }
}

function computeAiDiffSummary(existingItems = [], newItems = []) {
  const safeExisting = Array.isArray(existingItems) ? existingItems : [];
  const safeNew = Array.isArray(newItems) ? newItems : [];

  const added = [];
  const modified = [];
  const removed = [];

  const existingMap = new Map();
  safeExisting.forEach(item => {
    const key = (item.text || item.title || '').trim().toLowerCase();
    if (key) existingMap.set(key, item);
  });

  const matchedKeys = new Set();

  safeNew.forEach(newItem => {
    const key = (newItem.text || newItem.title || '').trim().toLowerCase();
    if (existingMap.has(key)) {
      matchedKeys.add(key);
      const oldItem = existingMap.get(key);
      const timeChanged = (oldItem.time || '') !== (newItem.time || '');
      const costChanged = String(oldItem.cost || '0') !== String(newItem.cost || '0');
      if (timeChanged || costChanged) {
        modified.push(newItem);
      }
    } else {
      added.push(newItem);
    }
  });

  safeExisting.forEach(oldItem => {
    const key = (oldItem.text || oldItem.title || '').trim().toLowerCase();
    if (key && !matchedKeys.has(key)) {
      removed.push(oldItem);
    }
  });

  return { added, modified, removed };
}

function buildScopedAiPrompt({ scope, instruction, existingActivities = [] }) {
  const cityName = scope.cityName || 'Destination City';

  if (scope.type === 'CITY') {
    const days = Array.isArray(scope.cityDays) ? scope.cityDays : [];
    const daysContextStr = days.map((d, idx) => {
      const acts = Array.isArray(d.activities) && d.activities.length > 0
        ? d.activities.map(a => '    * ' + (a.time ? '[' + a.time + '] ' : '') + (a.text || a.title || 'Activity') + (a.cost ? ' ($' + a.cost + ')' : '')).join('\n')
        : '    * (No activities planned yet)';
      return '  - Day ' + (idx + 1) + ' (' + (d.date || 'Undated') + '):\n' + acts;
    }).join('\n\n');

    return 'I am updating the entire multi-day itinerary for a city stay in my travel plan.\n\n' +
      'TARGET CITY CONTEXT: ' + cityName + '\n' +
      'TOTAL STAY DURATION: ' + days.length + ' Days\n\n' +
      'CURRENT MULTI-DAY SCHEDULE:\n' +
      daysContextStr + '\n\n' +
      'USER REQUEST / MODIFICATION:\n' +
      (instruction || 'Re-architect and balance activities across all days for logical pacing, authentic food, and neighborhood clusters.') + '\n\n' +
      'YOUR TASK:\n' +
      'Generate an updated multi-day schedule for ' + cityName + ' covering all ' + days.length + ' days.\n' +
      'Provide 2-4 key food quests for the city, 1-2 local transit/safety tips, and daily activity items.\n' +
      'Return ONLY a valid JSON object matching the schema below without markdown code fences or conversational commentary.\n\n' +
      'EXPECTED JSON SCHEMA:\n' +
      '{\n' +
      '  "city": "' + cityName + '",\n' +
      '  "days": [\n' +
      '    {\n' +
      '      "date": "YYYY-MM-DD",\n' +
      '      "desc": "Daily theme or focus area",\n' +
      '      "activities": [\n' +
      '        {\n' +
      '          "text": "Name of activity",\n' +
      '          "time": "HH:MM",\n' +
      '          "cost": "0",\n' +
      '          "notes": "Helpful tips, transit, or location",\n' +
      '          "category": "sightseeing"\n' +
      '        }\n' +
      '      ]\n' +
      '    }\n' +
      '  ],\n' +
      '  "cityFood": [\n' +
      '    { "text": "Must-try dish and recommended spot or neighborhood" }\n' +
      '  ],\n' +
      '  "legTips": [\n' +
      '    { "text": "Helpful city tip (e.g. transit pass or booking recommendation)" }\n' +
      '  ]\n' +
      '}';
  }

  const dateStr = scope.date || 'Selected Day';

  const activityListStr = existingActivities.length > 0
    ? existingActivities.map(a => '- ' + (a.time ? '[' + a.time + '] ' : '') + (a.text || a.title || 'Activity') + (a.cost ? ' ($' + a.cost + ')' : '')).join('\n')
    : '(No activities currently planned)';

  return 'I am updating a travel itinerary for a specific day in my trip.\n\n' +
    'TARGET DAY CONTEXT:\n' +
    '- City: ' + cityName + '\n' +
    '- Date: ' + dateStr + '\n' +
    '- Currently Planned Activities:\n' + activityListStr + '\n\n' +
    'USER REQUEST / MODIFICATION:\n' +
    (instruction || 'Optimize route pacing and add logical local sights/food spots.') + '\n\n' +
    'YOUR TASK:\n' +
    'Provide an updated schedule of activities for this day that addresses the user request.\n' +
    'Create the result as a downloadable or pasteable JSON object. Do not wrap in markdown or conversational commentary.\n\n' +
    'EXPECTED JSON SCHEMA:\n' +
    '{\n' +
    '  "date": "' + dateStr + '",\n' +
    '  "desc": "Short overview of the day theme",\n' +
    '  "activities": [\n' +
    '    {\n' +
    '      "text": "Name of activity",\n' +
    '      "time": "HH:MM",\n' +
    '      "cost": "0",\n' +
    '      "notes": "Helpful tips, location, or transit instructions",\n' +
    '      "category": "sightseeing"\n' +
    '    }\n' +
    '  ]\n' +
    '}';
}

function openScopedCityAiCoPilot(legIndex) {
  let cityName = 'Current City';
  let cityDays = [];

  if (typeof itineraryData !== 'undefined' && Array.isArray(itineraryData) && itineraryData[legIndex]) {
    const leg = itineraryData[legIndex];
    cityName = (typeof cleanCityNavLabel === 'function' ? cleanCityNavLabel(leg.label || leg.cityId || 'City') : (leg.label || 'City')).trim();
    if (Array.isArray(leg.days)) {
      cityDays = leg.days.map((day, idx) => ({
        dayIndex: idx,
        date: day.date || '',
        activities: Array.isArray(day.activityItems) ? day.activityItems : []
      }));
    }
  }

  setAiScope({
    type: 'CITY',
    legIndex,
    cityName,
    cityDays
  });

  const modal = document.getElementById('ai-modal');
  if (modal) {
    modal.style.display = 'flex';
    switchAiTab('generate');
    const scopedInput = document.getElementById('aiScopedInstruction');
    if (scopedInput) {
      scopedInput.value = '';
      scopedInput.focus();
    }
    const outputBox = document.getElementById('aiOutputBox');
    if (outputBox) outputBox.style.display = 'none';
  }
}

function openScopedAiCoPilot(legIndex, dayIndex) {
  let cityName = 'Current City';
  let dateStr = '';
  let existingActivities = [];

  if (typeof itineraryData !== 'undefined' && Array.isArray(itineraryData) && itineraryData[legIndex]) {
    const leg = itineraryData[legIndex];
    cityName = leg.label || leg.cityId || 'Current City';
    if (Array.isArray(leg.days) && leg.days[dayIndex]) {
      const day = leg.days[dayIndex];
      dateStr = day.date || '';
      existingActivities = Array.isArray(day.activityItems) ? day.activityItems : [];
    }
  }

  setAiScope({
    type: 'DAY',
    legIndex,
    dayIndex,
    date: dateStr,
    cityName,
    existingActivities
  });

  const modal = document.getElementById('ai-modal');
  if (modal) {
    modal.style.display = 'flex';
    switchAiTab('generate');
    const scopedInput = document.getElementById('aiScopedInstruction');
    if (scopedInput) {
      scopedInput.value = '';
      scopedInput.focus();
    }
    const outputBox = document.getElementById('aiOutputBox');
    if (outputBox) outputBox.style.display = 'none';
  }
}

function applyAiQuickChip(text) {
  const scopedInput = document.getElementById('aiScopedInstruction');
  if (scopedInput) {
    scopedInput.value = text;
    generatePrompt();
  }
}

function previewPastedAiResponse() {
  const pasteArea = document.getElementById('aiPasteResponseInput');
  const previewBox = document.getElementById('aiDiffPreviewBox');
  const rawText = pasteArea ? pasteArea.value : '';

  if (!rawText.trim()) {
    if (typeof showToast === 'function') showToast('Please paste the AI JSON response first.');
    return;
  }

  const result = parseAndValidateAiPayload(rawText, currentAiScope);
  if (!result.valid) {
    if (typeof showToast === 'function') showToast('❌ ' + result.error);
    else alert(result.error);
    return;
  }

  if (previewBox) {
    previewBox.style.display = 'block';

    if (currentAiScope.type === 'CITY') {
      const totalActivities = result.data.days.reduce((acc, d) => acc + (d.activities ? d.activities.length : 0), 0);
      previewBox.innerHTML =
        '<div class="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 text-sm">' +
          '<div class="font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center justify-between">' +
            '<span>✨ Diff Preview for ' + currentAiScope.cityName + ' (' + result.data.days.length + ' Days)</span>' +
            '<span class="text-xs px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200">' + totalActivities + ' activities, ' + result.data.cityFood.length + ' food quests</span>' +
          '</div>' +
          '<div class="flex flex-col gap-1.5 mb-3 text-xs">' +
            result.data.days.map((d, i) => '<div class="text-slate-700 dark:text-slate-300"><strong>Day ' + (i + 1) + ' (' + (d.date || 'Date') + '):</strong> ' + (d.desc ? d.desc + ' — ' : '') + d.activities.map(a => a.text).join(', ') + '</div>').join('') +
            (result.data.cityFood.length > 0 ? '<div class="text-amber-700 dark:text-amber-400 font-semibold mt-1">🍜 Food: ' + result.data.cityFood.map(f => f.text).join(' | ') + '</div>' : '') +
          '</div>' +
          '<div class="flex gap-2">' +
            '<button type="button" class="action-btn action-btn-primary flex-1 text-xs py-1.5" onclick="applyAiParsedData()">Apply Entire City Stay</button>' +
            '<button type="button" class="action-btn action-btn-secondary text-xs py-1.5" onclick="document.getElementById(\'aiDiffPreviewBox\').style.display=\'none\'">Discard</button>' +
          '</div>' +
        '</div>';
    } else if (currentAiScope.type === 'DAY') {
      const diff = computeAiDiffSummary(currentAiScope.existingActivities || [], result.data.activities || []);
      const addedHtml = diff.added.length > 0 ? '<div class="text-emerald-700 dark:text-emerald-400 font-semibold">➕ ' + diff.added.length + ' Added: ' + diff.added.map(a => a.text).join(', ') + '</div>' : '';
      const modHtml = diff.modified.length > 0 ? '<div class="text-blue-700 dark:text-blue-400 font-semibold">🔄 ' + diff.modified.length + ' Updated: ' + diff.modified.map(a => a.text).join(', ') + '</div>' : '';
      const remHtml = diff.removed.length > 0 ? '<div class="text-rose-700 dark:text-rose-400 font-semibold">➖ ' + diff.removed.length + ' Replaced: ' + diff.removed.map(a => a.text).join(', ') + '</div>' : '';
      const noChangeHtml = (diff.added.length === 0 && diff.modified.length === 0 && diff.removed.length === 0) ? '<div class="text-slate-500">Activities match existing schedule.</div>' : '';

      previewBox.innerHTML =
        '<div class="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 text-sm">' +
          '<div class="font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center justify-between">' +
            '<span>✨ Diff Preview for ' + currentAiScope.cityName + ' (' + currentAiScope.date + ')</span>' +
            '<span class="text-xs px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200">' + result.data.activities.length + ' total activities</span>' +
          '</div>' +
          '<div class="flex flex-col gap-1.5 mb-3 text-xs">' +
            addedHtml + modHtml + remHtml + noChangeHtml +
          '</div>' +
          '<div class="flex gap-2">' +
            '<button type="button" class="action-btn action-btn-primary flex-1 text-xs py-1.5" onclick="applyAiParsedData()">Apply Changes to Day</button>' +
            '<button type="button" class="action-btn action-btn-secondary text-xs py-1.5" onclick="document.getElementById(\'aiDiffPreviewBox\').style.display=\'none\'">Discard</button>' +
          '</div>' +
        '</div>';
    } else {
      const cityCount = Array.isArray(result.data.cities) ? result.data.cities.length : 0;
      const legCount = Array.isArray(result.data.itinerary) ? result.data.itinerary.length : 0;
      const tripTitle = (result.data.meta && result.data.meta.title) || result.data.title || 'Generated Trip';
      previewBox.innerHTML =
        '<div class="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 text-sm">' +
          '<div class="font-bold text-slate-800 dark:text-slate-100 mb-1">✨ Full Trip Payload Validated!</div>' +
          '<p class="text-xs text-slate-600 dark:text-slate-300 mb-3">' +
            '<strong>' + tripTitle + '</strong> with ' + cityCount + ' cities and ' + legCount + ' itinerary legs.' +
          '</p>' +
          '<div class="flex gap-2">' +
            '<button type="button" class="action-btn action-btn-primary flex-1 text-xs py-1.5" onclick="applyAiParsedData()">Import Trip Data</button>' +
            '<button type="button" class="action-btn action-btn-secondary text-xs py-1.5" onclick="document.getElementById(\'aiDiffPreviewBox\').style.display=\'none\'">Discard</button>' +
          '</div>' +
        '</div>';
    }
  }
}

async function applyAiParsedData() {
  const pasteArea = document.getElementById('aiPasteResponseInput');
  const rawText = pasteArea ? pasteArea.value : '';
  const result = parseAndValidateAiPayload(rawText, currentAiScope);

  if (!result.valid) {
    if (typeof showToast === 'function') showToast('❌ ' + result.error);
    return;
  }

  if (typeof triggerAppStateChange === 'function') {
    triggerAppStateChange();
  }

  if (currentAiScope.type === 'CITY') {
    const legIdx = currentAiScope.legIndex;
    if (typeof itineraryData !== 'undefined' && Array.isArray(itineraryData) && itineraryData[legIdx]) {
      const leg = itineraryData[legIdx];

      if (Array.isArray(leg.days)) {
        result.data.days.forEach((newDay, idx) => {
          if (leg.days[idx]) {
            leg.days[idx].activityItems = newDay.activities;
            if (newDay.desc) leg.days[idx].desc = newDay.desc;
          }
        });
      }

      if (result.data.cityFood && result.data.cityFood.length > 0) {
        leg.cityFood = result.data.cityFood;
      }
      if (result.data.legTips && result.data.legTips.length > 0) {
        leg.legTips = result.data.legTips;
      }

      if (typeof saveData === 'function') await saveData(true);
      if (typeof buildItinerary === 'function') buildItinerary();
      if (typeof closeAIDialog === 'function') closeAIDialog();

      if (typeof showToast === 'function') {
        showToast('✨ Updated entire ' + currentAiScope.cityName + ' itinerary across all days!');
      }
    }
  } else if (currentAiScope.type === 'DAY') {
    const legIdx = currentAiScope.legIndex;
    const dayIdx = currentAiScope.dayIndex;
    if (typeof itineraryData !== 'undefined' && Array.isArray(itineraryData) && itineraryData[legIdx]) {
      const leg = itineraryData[legIdx];
      if (Array.isArray(leg.days) && leg.days[dayIdx]) {
        const day = leg.days[dayIdx];
        day.activityItems = result.data.activities;
        if (result.data.desc) day.desc = result.data.desc;

        if (typeof saveData === 'function') await saveData(true);
        if (typeof buildItinerary === 'function') buildItinerary();
        if (typeof closeAIDialog === 'function') closeAIDialog();

        if (typeof showToast === 'function') {
          showToast('✨ Updated Day ' + (dayIdx + 1) + ' with ' + result.data.activities.length + ' activities!');
        }
      }
    }
  } else {
    if (typeof importJSONData === 'function') {
      importJSONData(result.data);
    } else {
      if (result.data.meta && typeof titleData !== 'undefined') {
        titleData.title = result.data.meta.title || titleData.title;
        titleData.subtitle = result.data.meta.subtitle || titleData.subtitle;
      }
      if (Array.isArray(result.data.cities) && typeof citiesData !== 'undefined') {
        citiesData = result.data.cities;
      }
      if (Array.isArray(result.data.itinerary) && typeof itineraryData !== 'undefined') {
        itineraryData = result.data.itinerary;
      }
      if (typeof saveData === 'function') await saveData(true);
      if (typeof buildNav === 'function') buildNav();
      if (typeof buildItinerary === 'function') buildItinerary();
    }
    if (typeof closeAIDialog === 'function') closeAIDialog();
    if (typeof showToast === 'function') {
      showToast('✨ Successfully imported AI-generated trip!');
    }
  }
}

globalThis.setAiScope = setAiScope;
globalThis.getAiScope = getAiScope;
globalThis.switchAiTab = switchAiTab;
globalThis.sanitizeAiResponseText = sanitizeAiResponseText;
globalThis.parseAndValidateAiPayload = parseAndValidateAiPayload;
globalThis.computeAiDiffSummary = computeAiDiffSummary;
globalThis.buildScopedAiPrompt = buildScopedAiPrompt;
globalThis.openScopedAiCoPilot = openScopedAiCoPilot;
globalThis.openScopedCityAiCoPilot = openScopedCityAiCoPilot;
globalThis.applyAiQuickChip = applyAiQuickChip;
globalThis.previewPastedAiResponse = previewPastedAiResponse;
globalThis.applyAiParsedData = applyAiParsedData;
