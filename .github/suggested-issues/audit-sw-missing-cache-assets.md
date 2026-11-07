---
title: "[Audit]: Service Worker Pre-Cache Missing 9 Core JavaScript Modules Causing Offline Crashes"
labels: ["bug", "priority: critical", "area: mobile"]
estimate: "S"
---

# [Audit]: Service Worker Pre-Cache Missing 9 Core JavaScript Modules Causing Offline Crashes

## Before
In `sw.js:L2-29`, the service worker pre-cache `ASSETS` list has not been updated to include newly introduced modules:
- `./js/default-data.js`
- `./js/timezone.js`
- `./js/attachments.js`
- `./js/trip-library.js`
- `./js/cloud-storage.js`
- `./js/weather.js`
- `./js/mappr-import.js`
- `./js/pwa-prompt.js`
Additionally, `map.js` is requested as `./js/map.js?v=7` in `index.html`, which misses the cached `./js/map.js` because `caches.match()` checks exact URL queries unless `ignoreSearch: true` is configured. When a user opens the PWA offline, the missing scripts fail to load, causing uncaught runtime errors and a blank application screen.

## Evidence
In `index.html`:
```html
<script src="./js/default-data.js"></script>
<script src="./js/timezone.js"></script>
<script src="./js/attachments.js"></script>
<script src="./js/trip-library.js"></script>
<script src="./js/cloud-storage.js"></script>
<script src="./js/map.js?v=7"></script>
<script src="./js/weather.js"></script>
<script src="./js/mappr-import.js"></script>
<script src="./js/pwa-prompt.js"></script>
```
In `sw.js`:
```javascript
const ASSETS = [
  './index.html',
  './manifest.json',
  ...
  './js/map.js' // Missing default-data, timezone, attachments, trip-library, cloud-storage, weather, mappr-import, pwa-prompt
];
```

## Proposed
1. Add the missing 8 scripts to `ASSETS` in `sw.js`.
2. Update `caches.match(e.request)` in `sw.js` to `{ ignoreSearch: true }` so cache matching works regardless of cache-busting query strings.
3. Bump `CACHE_NAME` in `sw.js`.

## After
The PWA installs and caches all required runtime modules, allowing full offline operation without 404 script errors.

## Estimate
- Effort estimate: S

## Files impacted
- `sw.js`

## Acceptance criteria
- [ ] All runtime scripts from `index.html` are included in `sw.js` `ASSETS`.
- [ ] `caches.match(e.request, { ignoreSearch: true })` matches files even with version query parameters.
- [ ] Regression tests pass (`npm test`).

## Verification plan
- Automated tests: `npm test`
- Manual verification: Inspect Cache Storage in DevTools Application tab and verify all script assets are present.
