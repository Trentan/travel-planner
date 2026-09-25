function getAiFieldValue(id, fallback) {
  const el = document.getElementById(id);
  const value = el && typeof el.value === 'string' ? el.value.trim() : '';
  return value || fallback;
}

function buildAiPrompt({ title, regions, dates, citiesInput, cities, junctions, vibe }) {
  const cityCount = cities.length || 3;

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

The downloadable file must contain one JSON object that exactly matches this structure. Do not wrap it in markdown, commentary, or code fences.

EXPECTED JSON SCHEMA:
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
              "cost": "0",
              "done": false,
              "category": "transport",
              "notes": "Have passport, e-tickets, and travel documents ready.",
              "location": "Airport",
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
          "location": "Area or Neighborhood",
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
              "cost": "0",
              "done": false,
              "category": "fitness",
              "notes": "Scenic seaside or park loop.",
              "location": "Neighborhood",
              "cityId": "city-cityname"
            },
            {
              "text": "Brunch at Local Cafe",
              "time": "09:30",
              "cost": "20",
              "done": false,
              "category": "food",
              "notes": "Healthy bowls and local coffee.",
              "location": "Cafe Address or Area",
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
              "cost": "0",
              "done": false,
              "category": "transport",
              "notes": "Arrive at airport 3 hours before departure.",
              "location": "Airport",
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
}

CRITICAL RULES FOR GENERATION:

1. CITIES: Create the cities array. ${cities.length ? `Use specified cities: ${cities.join(', ')}.` : 'Choose 3-5 logical cities in the requested regions.'}
   - For multi-base regions or island hubs (e.g. Bali, Phuket, Hawaii), create separate entries for each major hub/area (e.g. "Canggu", "Ubud", "Uluwatu") rather than collapsing into a single generic region name.
   - Auto-generate city IDs as "city-[lowercase-city-name]" (e.g. "city-canggu", "city-ubud").
   - City "name" must be the clean standard city name (e.g. "Canggu", NOT "Canggu Bali").
   - Assign distinct colors from: #E74C3C, #3498DB, #27AE60, #F39C12, #9B59B6, #1ABC9C, #E91E63, #795548.
   - Include country, countryCode, code, lat, and lng for every city whenever known.

2. ITINERARY LEGS & CLEAN LABELS: Create legs in chronological order:
   - "leg-start": Departure from home (cityId: "city-home", label: "🏠 Start (Home City)").
   - One leg per destination hub/city (id: "leg-[cityname]", cityId: "city-[cityname]").
   - The leg "label" for each destination leg MUST BE "[Emoji] [City Name]" (e.g. "🌴 Canggu" or "🌿 Ubud"). DO NOT append long itinerary descriptions or theme text (e.g. NEVER "🌴 Bali Wellness, Diving & Fitness"). Put themes/descriptions in day "desc".
   - "leg-return": Return to home (cityId: "city-home", label: "🛫 Return Home").

3. DAYS & ACTIVITY ITEMS ("text" FIELD):
   - Every day must have "date" (YYYY-MM-DD), "day" (Mon, Tue, etc.), "from", "to", "completed": false, "desc", and "activityItems".
   - In "activityItems", each item MUST have the property "text" containing the activity name/title (e.g. "text": "Morning Run along Echo Beach"). NEVER use "title" instead of "text" for activityItems!
   - Every item MUST include a non-empty "location" specifying the venue name, area, or landmark (e.g. "location": "Echo Beach, Canggu", "location": "Pyramids of Chi, Ubud"). NEVER omit location or leave it as empty string ""!
   - Include "time", "cost", "category", "notes", "location", "done": false, and "cityId".
   - Category must be one of: "fitness", "sight", "attraction", "wellness", "food", "transport".

4. SUGGESTED ACTIVITIES & POOL:
   - In each destination leg, include 3-5 suggestedActivities in the pool with "id", "title", "category", "estTime", "estCost", "notes", and "cityId".

5. CITY FOOD & TIPS ("text" FIELD):
   - In "cityFood", every item must have "text" (e.g. "text": "Crate Cafe - healthy breakfast bowls"), "done": false, and "cityId".
   - In "legTips", every item must have "text" (e.g. "text": "Apply for e-VoA online before flying"), and "cityId". DO NOT use object with { title, note }; put the full tip in "text".

6. STAYS & JOURNEYS:
   - In "stays", the "city" property MUST EXACTLY match the "name" in "cities" (e.g. "city": "Bali"), and "cityId" must match "id" in "cities" (e.g. "city-bali"). Calculate nights = checkOut - checkIn.
   - In "journeys", provide flights matching the booked junctions. Set "fromCityId" and "toCityId".

7. PACKING & CHECKLIST:
   - "packing" MUST strictly follow the 3-area nested structure with "areaName", "categories", and "items" (each item has "text" and "done": false). NEVER put loose strings directly into the "packing" array.
   - "leaveHome" should include pre-trip tasks, visa reminders, tourist tax payments, and home security.

8. Make the JSON valid, complete, and ready to import into the app without manual restructuring.

9. Deliver the final answer as an attached/downloadable .json file. If your interface cannot attach files, output only the raw JSON object so I can save it as a .json file.`;
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
  const title = getAiFieldValue('aiTripTitle', 'New Travel Adventure');
  const regions = getAiFieldValue('aiTripRegions', '');
  const dates = getAiFieldValue('aiTripDates', '14 days');
  const citiesInput = getAiFieldValue('aiTripCities', '');
  const junctions = getAiFieldValue('aiTripBookedJunctions', '');
  const vibe = getAiFieldValue('aiTripVibe', 'Relaxed pacing, great food, local culture, walking friendly.');
  const cities = citiesInput ? citiesInput.split(',').map(city => city.trim()).filter(Boolean) : [];
  const promptText = buildAiPrompt({ title, regions, dates, citiesInput, cities, junctions, vibe });

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

globalThis.buildAiPrompt = buildAiPrompt;
globalThis.prefillAIDialogFields = prefillAIDialogFields;
globalThis.generatePrompt = generatePrompt;
globalThis.copyPrompt = copyPrompt;
