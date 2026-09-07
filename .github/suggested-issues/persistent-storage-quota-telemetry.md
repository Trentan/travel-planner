---
title: "feat(storage): Persistent storage quota request and quota telemetry display"
labels: ["feat", "area: data", "priority: important", "jules-suggested"]
estimate: "M"
milestone: "Sprint 5: Storage Engine & Cloud Sync Overhaul (v2.0.0)"
---

# feat(storage): Persistent storage quota request and quota telemetry display

## Before
Client-side trip databases in mobile browsers (iOS Safari, Android Chrome WebViews) are vulnerable to automatic browser storage eviction under device memory pressure. The application currently relies on standard IndexedDB storage without calling `navigator.storage.persist()`. Furthermore, users have no visibility into how much client storage their trips and attachments consume or how close they are to browser quota limits (`navigator.storage.estimate()` is not utilized).

## Evidence
- `js/data.js` initializes IndexedDB database `travelApp_v2026` (`openDB()`) without checking `navigator.storage.persisted()` or requesting `navigator.storage.persist()`.
- Search across the codebase reveals zero usages of `navigator.storage.persist` or `navigator.storage.estimate`.
- Mobile users with multi-week itineraries and binary attachments risk silent local data eviction if their browser enters low storage cleanup.

## Proposed
1. Implement a persistent storage helper in `js/data.js` that checks `navigator.storage.persisted()`.
2. Provide a non-blocking prompt or setting in the app settings / storage modal allowing users to grant persistent storage (`navigator.storage.persist()`).
3. Use `navigator.storage.estimate()` to query `usage` and `quota`, rendering a storage telemetry bar (e.g., `Storage: 14.2 MB used of 1.2 GB available (Persistent: Active)`).
4. Gracefully handle unsupported browsers without throwing exceptions.

## After
Users can verify and activate persistent storage protection to guarantee long-term itinerary preservation against browser cache evictions, accompanied by clear storage quota telemetry in settings.

## Estimate
- Effort estimate: M (2-4 hours)

## Files impacted
- `js/data.js`
- `index.html`
- `js/ui.js`

## Acceptance criteria
- [ ] `navigator.storage.persisted()` is checked on app initialization.
- [ ] When storage is not persistent and supported, a clear action in Settings allows users to request `navigator.storage.persist()`.
- [ ] `navigator.storage.estimate()` calculates current usage and quota, displayed in the Settings / Storage modal.
- [ ] Fallback gracefully on environments where `navigator.storage` is undefined or restricted.
- [ ] Regression tests pass (`npm test`).

## Verification plan
- Automated tests: Run `npm test`.
- Manual verification: Open app in Chrome and Safari; check Settings storage section; click "Enable Persistent Storage"; verify quota telemetry readout.
