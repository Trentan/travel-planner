function getAiFieldValue(id, fallback) {
  const el = document.getElementById(id);
  const value = el && typeof el.value === 'string' ? el.value.trim() : '';
  return value || fallback;
}

function buildAiPrompt({ title, dates, citiesInput, cities, vibe }) {
  const cityCount = cities.length;

  return `I am building a travel itinerary app and need a complete JSON dataset for an upcoming trip.

TRIP DETAILS:
- Title: ${title}
- Dates & Flights: ${dates}
- Cities/Locations: ${citiesInput}
- Travel Vibe & Preferences: ${vibe}

YOUR TASK:
Generate a detailed daily itinerary tailored to my preferences. Output the entire trip as a single JSON object.

The JSON must exactly match this structure. Do not wrap it in markdown. Output raw JSON only.

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
      "dateFrom": "YYYY-MM-DD",
      "dateTo": "YYYY-MM-DD",
      "colour": "#HEXCOLOR"
    }
  ],
  "itinerary": [
    {
      "id": "leg-start",
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
          "to": "Departure City",
          "completed": false,
          "desc": "Travel day",
          "activityItems": []
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
      "legs": [
        {
          "type": "flight",
          "fromCityId": "city-home",
          "toCityId": "city-firstcity",
          "departureDate": "YYYY-MM-DD",
          "departureTime": "HH:MM",
          "arrivalDate": "YYYY-MM-DD",
          "arrivalTime": "HH:MM",
          "provider": "Airline Name",
          "routeCode": "FL123",
          "cost": 500,
          "status": "confirmed",
          "bookingRef": "ABC123"
        }
      ]
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
      "notes": "Near city center, late check-in available"
    }
  ],
  "packing": [],
  "leaveHome": [
    {"text": "Lock all doors and windows", "done": false},
    {"text": "Set security alarm", "done": false},
    {"text": "Charge all devices", "done": false}
  ]
}

INSTRUCTIONS FOR GENERATION:

1. CITIES: Create cities array based on the user's input (${cities.join(', ')}). Auto-generate city IDs as "city-[lowercase-city-name]" and assign distinct colors from: #E74C3C, #3498DB, #27AE60, #F39C12, #9B59B6, #1ABC9C, #E91E63, #795548.

2. ITINERARY LEGS: Create these leg types in order:
   - "leg-start": Departure from home
   - One leg per city
   - "leg-travel-X" between cities if multiple cities
   - "leg-return": Return to home

3. CITYID ASSIGNMENT: Every tip, food item, activity, and accommodation must include the cityId matching its city.

4. JOURNEYS: Create transport entries for outbound travel, inter-city travel, and the return journey. Use ISO date format (YYYY-MM-DD) for all dates.

5. STAYS: Create accommodation entries matching the itinerary. Calculate nights from checkIn to checkOut dates.

6. ACTIVITIES: Include variety from these categories:
   - "fitness" (runs, walks, gym)
   - "sight" (museums, landmarks)
   - "attraction" (tours, shows)
   - "wellness" (spa, yoga)
   - "food" (restaurants, markets)

7. Match the pacing and budget to the user's preferences.

8. Make the JSON valid, complete, and ready to import into the app.`;
}

function generatePrompt() {
  const title = getAiFieldValue('aiTripTitle', 'Europe Summer Trip');
  const dates = getAiFieldValue('aiTripDates', '14 days');
  const citiesInput = getAiFieldValue('aiTripCities', 'London, Paris, Rome');
  const vibe = getAiFieldValue('aiTripVibe', 'Relaxed pacing, great food, no early mornings.');
  const cities = citiesInput.split(',').map(city => city.trim()).filter(Boolean);
  const promptText = buildAiPrompt({ title, dates, citiesInput, cities, vibe });

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

    alert('Prompt copied to clipboard! Paste this into an AI to generate your trip JSON.');
    return true;
  } catch (error) {
    if (promptArea && typeof promptArea.select === 'function' && typeof document.execCommand === 'function') {
      promptArea.select();
      const copied = document.execCommand('copy');
      if (copied) {
        alert('Prompt copied to clipboard! Paste this into an AI to generate your trip JSON.');
        return true;
      }
    }

    alert('Could not copy automatically. Select the prompt and copy it manually.');
    return false;
  }
}

globalThis.buildAiPrompt = buildAiPrompt;
globalThis.generatePrompt = generatePrompt;
globalThis.copyPrompt = copyPrompt;
