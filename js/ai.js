function generatePrompt() {
  const title = document.getElementById('aiTripTitle').value || "Europe Summer Trip";
  const dates = document.getElementById('aiTripDates').value || "14 days";
  const citiesInput = document.getElementById('aiTripCities').value || "London, Paris, Rome";
  const vibe = document.getElementById('aiTripVibe').value || "Relaxed pacing, great food, no early mornings.";

  // Parse cities for the prompt
  const cities = citiesInput.split(',').map(c => c.trim()).filter(c => c);

  const promptText = `I am building a travel itinerary app and need a complete JSON dataset for an upcoming trip.

TRIP DETAILS:
- Title: ${title}
- Dates & Flights: ${dates}
- Cities/Locations: ${citiesInput}
- Travel Vibe & Preferences: ${vibe}

YOUR TASK:
Generate a detailed, daily itinerary tailored to my preferences. Then, output the ENTIRE trip as a single JSON object.

The JSON must exactly match this structure. Do not use markdown blocks around the JSON. Output raw JSON only.

EXPECTED JSON SCHEMA:
{
  "meta": {
    "title": "${title}",
    "subtitle": "Generated ${cities.length}-city itinerary"
  },
  "cities": [
    {
      "id": "city-cityname",
      "name": "City Name",
      "country": "Country Name",
      "dateFrom": "DD Mmm",
      "dateTo": "DD Mmm",
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
          "date": "DD Mmm",
          "day": "Mon",
          "from": "Home",
          "to": "Departure City",
          "completed": false,
          "desc": "Travel day",
          "activityItems": []
        }
      ]
    },
    {
      "id": "leg-1",
      "label": "📍 City Name",
      "colour": "#HEXCOLOR",
      "cityFood": [
        {"text": "Try local dish", "done": false, "cityId": "city-cityname"},
        {"text": "Visit famous restaurant", "done": false, "cityId": "city-cityname"}
      ],
      "suggestedActivities": [
        {"title": "Morning run in park", "category": "fitness", "estTime": "1 hr", "estCost": "0", "assignedDayIdx": null, "cityId": "city-cityname"},
        {"title": "Visit famous museum", "category": "sight", "estTime": "3 hrs", "estCost": "15", "assignedDayIdx": null, "cityId": "city-cityname"},
        {"title": "Local food tour", "category": "food", "estTime": "2 hrs", "estCost": "50", "assignedDayIdx": null, "cityId": "city-cityname"}
      ],
      "legTips": [
        {"text": "Download local transit app", "cityId": "city-cityname"},
        {"text": "Book popular attractions in advance", "cityId": "city-cityname"}
      ],
      "days": [
        {
          "date": "DD Mmm",
          "day": "Tue",
          "from": "Previous City",
          "to": "Current City",
          "completed": false,
          "desc": "Arrival day",
          "accomItems": [{"text": "Hotel Name", "cost": "150", "status": "confirmed", "bookingRef": "ABC123", "cityId": "city-cityname"}],
          "activityItems": [{"text": "Check in and explore", "cost": "0", "time": "2 hrs", "done": false, "cityId": "city-cityname"}]
        },
        {
          "date": "DD Mmm",
          "day": "Wed",
          "from": "Current City",
          "to": "Current City",
          "completed": false,
          "desc": "Full day exploring",
          "accomItems": [{"text": "Hotel Name", "cost": "150", "status": "confirmed", "bookingRef": "ABC123", "cityId": "city-cityname"}],
          "activityItems": [
            {"text": "Morning activity", "cost": "25", "time": "3 hrs", "done": false, "cityId": "city-cityname"},
            {"text": "Lunch at local spot", "cost": "30", "time": "1.5 hrs", "done": false, "cityId": "city-cityname"}
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
    },
    {
      "id": "journey-2",
      "journeyId": "journey-city1-city2",
      "journeyName": "City 1 to City 2",
      "isMultiLeg": false,
      "legs": [
        {
          "type": "train",
          "fromCityId": "city-city1",
          "toCityId": "city-city2",
          "departureDate": "YYYY-MM-DD",
          "departureTime": "HH:MM",
          "arrivalDate": "YYYY-MM-DD",
          "arrivalTime": "HH:MM",
          "provider": "Train Company",
          "routeCode": "T123",
          "cost": 100,
          "status": "confirmed",
          "bookingRef": "XYZ789"
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
   - One leg per city (label: "📍 City Name")
   - "leg-travel-X" between cities if multiple cities
   - "leg-return": Return to home

3. CITYID ASSIGNMENT: Every tip, food item, activity, and accommodation MUST include the cityId matching its city.

4. JOURNEYS: Create transport entries for:
   - Outbound flight from home to first city
   - Any inter-city travel (train/flight/bus)
   - Return flight to home
   Use ISO date format (YYYY-MM-DD) for all dates.

5. STAYS: Create accommodation entries matching the itinerary. Calculate nights from checkIn to checkOut dates.

6. ACTIVITIES: Include variety from these categories:
   - "fitness" (runs, walks, gym)
   - "sight" (museums, landmarks)
   - "attraction" (tours, shows)
   - "wellness" (spa, yoga)
   - "food" (restaurants, markets)

7. Match the pacing and budget to the user's preferences.";

  document.getElementById('aiOutputBox').style.display = 'block';
  document.getElementById('aiPromptOutput').value = promptText;
}`

function copyPrompt() {
  const promptArea = document.getElementById('aiPromptOutput');
  promptArea.select(); document.execCommand('copy');
  alert("Prompt copied to clipboard! Paste this into an AI to generate your trip JSON.");
}}