---
title: "[Audit]: Deduplicate In-Flight Open-Meteo Weather API Requests to Prevent Render Flooding & HTTP 429"
labels: ["enhancement", "area: itinerary"]
estimate: "S"
---

# [Audit]: Deduplicate In-Flight Open-Meteo Weather API Requests to Prevent Render Flooding & HTTP 429

## Before
In `js/weather.js:L305-322`, when an itinerary renders multiple days in the same destination (e.g. 7 days in Paris), each day chip schedules a `fetchForecastData(lat, lng)` timeout. Because the in-memory cache has not yet received a response, 7 to 10 identical HTTP requests are dispatched to `api.open-meteo.com` in parallel, flooding the external API and risking HTTP 429 rate limits.

## Evidence
In `js/weather.js`:
```javascript
async function fetchForecastData(lat, lng) {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const now = Date.now();
  const cached = memoryWeatherCache[key];

  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }
  // Fetches network without checking if a fetch is already in flight
```

## Proposed
1. Maintain an `inFlightRequests` Map keyed by `${lat},${lng}`.
2. If a request for those coordinates is already pending, return the existing Promise instead of dispatching another network request.
3. Clean up the entry upon promise resolution or error.

## After
Only one network request per unique coordinate pair is sent during a full itinerary render, saving network bandwidth and eliminating rate limit risks.

## Estimate
- Effort estimate: S

## Files impacted
- `js/weather.js`

## Acceptance criteria
- [ ] Concurrent calls for identical coordinates resolve to the same underlying fetch Promise.
- [ ] Regression tests pass (`npm test`).

## Verification plan
- Automated tests: `npm test`
