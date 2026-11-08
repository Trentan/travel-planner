---
title: "[Audit]: Decompose 9,700-Line js/data.js God Module into Domain Subsystems"
labels: ["enhancement", "area: data", "effort: major"]
estimate: "L"
---

# [Audit]: Decompose 9,700-Line js/data.js God Module into Domain Subsystems

## Before
`js/data.js` has grown to 9,751 lines (approx 400KB). It combines multiple separate architectural concerns into a single file:
1. IndexedDB persistence & multi-tab cache invalidation
2. File System Access API saving and handles
3. Undo / redo history state snapshots
4. City geolocation matching and Levenshtein fuzzy search
5. Itinerary data schema normalization
6. Gzip base64 share link export & decompression
7. ICS calendar and plain text export generators
8. Onboarding wizard modal and starter trip generator

## Evidence
`js/data.js` line count: 9,751 lines. Developers must navigate thousands of lines of unrelated domain logic when maintaining file storage or city matching.

## Proposed
Extract cohesive modules into discrete files:
1. `js/storage-db.js`: IndexedDB open, stores, trips store, offline sync queue.
2. `js/file-io.js`: FSA API handle persistence, saveFileToDisk, exportJSON, importJSON.
3. `js/city-matcher.js`: `COUNTRY_DATA`, `CITY_DATABASE`, fuzzy search, diacritics stripping.
4. `js/trip-onboarding.js`: Wizard dialog steps, vibe profile, starter template generation.
5. Retain data structures and normalization in `js/data.js`.

## After
Clear architectural boundaries, reduced cognitive load, faster targeted unit testing, and fewer merge conflicts.

## Estimate
- Effort estimate: L

## Files impacted
- `js/data.js`
- `index.html`
- `sw.js`

## Acceptance criteria
- [ ] Subsystems separated with explicit public interfaces on `window`.
- [ ] No regression in storage, import/export, fuzzy city search, or wizard.
- [ ] Regression tests pass (`npm test`).

## Verification plan
- Automated tests: `npm test`
- Manual verification across desktop and mobile.
