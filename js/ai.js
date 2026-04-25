function generatePrompt() {
  const title = document.getElementById('aiTripTitle').value || "Europe Summer Trip";
  const dates = document.getElementById('aiTripDates').value || "14 days";
  const cities = document.getElementById('aiTripCities').value || "London, Paris, Rome";
  const vibe = document.getElementById('aiTripVibe').value || "Relaxed pacing, great food, no early mornings.";

  const promptText = `I am building a travel itinerary app and need a complete JSON dataset for an upcoming trip.

TRIP DETAILS:
- Title: ${title}
- Dates & Flights: ${dates}
- Cities/Locations: ${cities}
- Travel Vibe & Preferences: ${vibe}

YOUR TASK:
Generate a detailed, daily itinerary tailored to my preferences. Then, output the ENTIRE itinerary as a single JSON object.

The JSON must exactly match this structure. Do not use markdown blocks around the JSON. Output raw JSON only.

EXPECTED JSON SCHEMA:
{
  "meta": {
    "title": "${title}",
    "subtitle": "Generated Itinerary"
  },
  "packing": [],
  "leaveHome": [],
  "itinerary": [
    {
      "id": "leg_id_string",
      "label": "City Name/Label",
      "colour": "#HEXCODE",
      "cityFood": [ {"text": "Food Idea", "done": false} ],
      "suggestedActivities": [
        {"title": "5km run in Central Park", "category": "fitness", "estTime": "1 hr", "estCost": "0", "assignedDayIdx": null},
        {"title": "Visit the Louvre Museum", "category": "sight", "estTime": "3 hrs", "estCost": "17", "assignedDayIdx": null},
        {"title": "Taste authentic Italian gelato", "category": "food", "estTime": "1 hr", "estCost": "10", "assignedDayIdx": null},
        {"title": "Spa treatment at hotel", "category": "wellness", "estTime": "2 hrs", "estCost": "80", "assignedDayIdx": null}
      ],
      "legTips": [ "General city tip 1", "General city tip 2" ],
      "days": [
        {
          "date": "DD Mmm",
          "day": "Mon",
          "from": "Start City",
          "to": "End City",
          "completed": false,
          "desc": "Short day description",
          "transportItems": [ {"text": "Flight/Train details", "cost": "0"} ],
          "accomItems": [ {"text": "Hotel name/address", "cost": "0"} ],
          "activityItems": [ {"text": "Main planned activity", "cost": "0", "time": "1 hr", "done": false} ]
        }
      ]
    }
  ]
}

CATEGORY OPTIONS for suggestedActivities:
- "fitness" (running, gym, hiking, sports)
- "sight" (museums, landmarks, monuments)
- "attraction" (theme parks, tours, shows)
- "wellness" (spa, yoga, meditation, relax)
- "food" (restaurants, food tours, markets)`;

  document.getElementById('aiOutputBox').style.display = 'block';
  document.getElementById('aiPromptOutput').value = promptText;
}

function copyPrompt() {
  const promptArea = document.getElementById('aiPromptOutput');
  promptArea.select(); document.execCommand('copy');
  alert("Prompt copied to clipboard! Paste this into an AI to generate your trip JSON.");
}
