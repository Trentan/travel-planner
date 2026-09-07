---
title: "feat(storage): Automatic local backup snapshot prior to loading external hash-based trips"
labels: ["feat", "area: data", "priority: important", "jules-suggested"]
estimate: "S"
milestone: "Sprint 5: Storage Engine & Cloud Sync Overhaul (v2.0.0)"
---

# feat(storage): Automatic local backup snapshot prior to loading external hash-based trips

## Before
When a user opens a shared travel link with a `#trip=...` hash or `?trip=...` query parameter, `checkUrlForImportedTrip()` immediately loads the external trip into the active workspace. If the user previously had unexported local itinerary edits, those edits can be overwritten in memory without an automated safety snapshot saved to IndexedDB or local history.

## Evidence
- In `js/data.js:5136-5139`:
  ```javascript
  clearActiveFileHandle();
  setImportedJsonWithoutWriteAccess(true);
  await loadImportedPayload(expandedData, 'URL Shared Trip');
  ```
- No safety check or automated snapshot of existing `appData` into `trips` store or backup store occurs prior to `loadImportedPayload()`.
- If the imported URL link is corrupted, partial, or unwanted, the user's prior in-progress itinerary is displaced from the active view.

## Proposed
1. Before invoking `loadImportedPayload()` in `checkUrlForImportedTrip()`, check if the active trip contains user modifications or valid leg data.
2. Automatically snapshot the active trip into the IndexedDB multi-trip store (`saveTripToIndexedDB`) or a named recovery backup (`"Auto-Backup Prior to Shared Link Load"`).
3. If an existing trip with identical ID or name exists, ensure it is preserved with its timestamp.
4. Provide a notification to the user indicating their prior trip was backed up to the Trip Library.

## After
Users can click and open external shared itinerary links without anxiety of overwriting their personal in-progress travel plans.

## Estimate
- Effort estimate: S (1-2 hours)

## Files impacted
- `js/data.js`
- `js/backup.js`
- `js/trip-library.js`

## Acceptance criteria
- [ ] Active workspace data is snapshotted to IndexedDB prior to importing hash-based trips.
- [ ] Users can recover their prior trip from the Trip Library modal if desired.
- [ ] Loading shared URLs does not erase or corrupt pre-existing trips.
- [ ] Unit/regression tests verify safety snapshot behavior.

## Verification plan
- Automated tests: Add test case in `tests/multi-trip-library-suite.js` or `tests/share-presets-verify.js`.
- Manual verification: Create a trip with custom activities, open `#trip=...` URL, verify original trip is safely preserved in "My Trips".
