---
title: "[Audit]: Check Leaflet Global Availability in buildJourneyMap to Prevent Offline Map Crash"
labels: ["bug", "priority: important", "area: map"]
estimate: "S"
---

# [Audit]: Check Leaflet Global Availability in buildJourneyMap to Prevent Offline Map Crash

## Before
In `js/map.js:L634`, `buildJourneyMap()` directly executes `mainMap = L.map(container, ...)`. If the device is offline and Leaflet's CDN script has not loaded or is unavailable, accessing `L` throws an uncaught `ReferenceError: L is not defined`. By contrast, `renderDesktopSplitMap()` (L965) properly guards against missing `L`.

## Evidence
In `js/map.js`:
```javascript
function buildJourneyMap() {
  const container = document.getElementById('journey-map-view');
  if (!container) return;
  ...
  mainMap = L.map(container, { trackResize: true }).setView([20, 0], 2);
```

## Proposed
1. Add `if (typeof window === 'undefined' || typeof L === 'undefined') return;` at the beginning of `buildJourneyMap()`.
2. Display a clean offline placeholder message in the map container when `L` is unavailable.

## After
Switching to the Map tab while offline degrades gracefully with an informational placeholder instead of crashing with a JavaScript runtime error.

## Estimate
- Effort estimate: S

## Files impacted
- `js/map.js`

## Acceptance criteria
- [ ] `buildJourneyMap()` does not throw when `window.L` is undefined.
- [ ] Regression tests pass (`npm test`).

## Verification plan
- Automated tests: `npm test`
- Manual verification: Disable network in DevTools, navigate to the Map tab, and confirm absence of console exceptions.
