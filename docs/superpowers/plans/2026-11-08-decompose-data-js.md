# Decompose `js/data.js` into Domain Subsystems Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decompose the 9,750-line `js/data.js` god module into cohesive, single-responsibility domain subsystems (`js/storage-db.js`, `js/city-matcher.js`, `js/trip-onboarding.js`, `js/file-io.js`) with zero regression in storage persistence, file I/O, city geocoding, or onboarding.

**Architecture:** Extract four self-contained modules loaded via `<script>` tags in `index.html` before `js/data.js`, exposing explicit window/global APIs. `js/data.js` retains core data structures, history (undo/redo), schema normalizers, and save coordination. Test helpers and harnesses are updated to load new modules into VM sandboxes.

**Tech Stack:** Vanilla JavaScript (ES6+), IndexedDB API, File System Access API, DOM APIs, Service Worker (`sw.js`), Node.js VM test harnesses.

**Spec:** GitHub Issue #650 ([Audit]: Decompose 9,700-Line js/data.js God Module into Domain Subsystems)

## Global Constraints
- `AGENTS.md` rules: Incremental commits, conventional commit messages, launch-and-inspect tests (no verbose synchronous dumps into context).
- Standard UI viewports: `DESKTOP` (1440 x 900) and `MOBILE` (390 x 844).
- Service worker cache: Update `sw.js` `ASSETS` and bump cache version.
- Backwards compatibility: All exported functions, globals, and constants (`CITY_DATABASE`, `COUNTRY_DATA`, `saveToIndexedDB`, `saveFileToDisk`, `startOnboardingWizard`, etc.) remain identical on `window` and global context.
- Zero runtime overhead or dependency additions.

## Review Focus
1. **IndexedDB Multi-Tab & Storage Persistence**: Trips, active trip document, and app data must persist and retrieve cleanly without schema errors.
2. **City Matching & Coordinates**: `resolveCityLocation`, `CITY_DATABASE`, and Levenshtein fuzzy search must return accurate coordinates and codes for trip legs and AI builder imports.
3. **Onboarding Wizard Flow**: Path A (blank itinerary) and Path B (flight import preview) must initialize, advance steps, and seed starter itineraries accurately.
4. **File System Access API & JSON Disk Saves**: `saveFileToDisk`, `exportJSON`, and `importJSON` must retain active file handle permission and error handling.
5. **Test Harness Compatibility**: Node VM unit test harnesses (`browser-harness.js`, `run-tests.js`) must evaluate extracted modules in proper dependency order.

---

## File Structure & Module Responsibilities

| File | Target Responsibility | Estimated Lines |
|------|------------------------|-----------------|
| `js/storage-db.js` | IndexedDB initialization, store schema, active trip document persistence, offline sync queue | ~950 |
| `js/city-matcher.js` | `CITY_DATABASE`, `COUNTRY_DATA`, fuzzy Levenshtein search, diacritics stripping, IATA/ICAO code resolution | ~2,400 |
| `js/trip-onboarding.js` | Onboarding wizard modal, vibe questionnaire, multi-step progress, starter itinerary generation | ~1,650 |
| `js/file-io.js` | File System Access API handles, `saveFileToDisk()`, JSON import/export, warning state | ~800 |
| `js/data.js` | Core reactive state, data normalizers, undo/redo history stack, `initData()`, save coordination (`saveData()`) | ~3,950 (reduced from 9,750) |
| `index.html` | Updated `<script>` load sequence | - |
| `sw.js` | Added module cache paths | - |
| `tests/lib/browser-harness.js` | Updated mock VM script load list | - |

---

### Task 1: Extract `js/storage-db.js` (IndexedDB & Offline Sync)

**Files:**
- Create: `js/storage-db.js`
- Modify: `js/data.js`
- Modify: `index.html`
- Modify: `sw.js`
- Modify: `tests/lib/browser-harness.js`

- [ ] **Step 1: Extract IndexedDB module**
  - Create `js/storage-db.js` containing `DB_NAME`, `DB_VERSION`, `STORES`, `openDatabase()`, `initIndexedDB()`, `saveToIndexedDB()`, `getFromIndexedDB()`, `getAllFromIndexedDB()`, `deleteFromIndexedDB()`, `saveActiveTripToStore()`, `getTripsFromStore()`, `deleteTripFromStore()`, `saveTripToIndexedDB()`, `offlineSyncQueue`, `enqueueOfflineSyncOperation()`, `flushOfflineSyncQueue()`, and `shouldUseIndexedDB()`.
  - Export functions to `window`.
  - Remove extracted code from `js/data.js`.
- [ ] **Step 2: Update script tags and service worker**
  - Insert `<script src="./js/storage-db.js"></script>` before `./js/data.js` in `index.html`.
  - Add `'./js/storage-db.js'` to `sw.js` `ASSETS` and bump cache version.
  - Add `'./js/storage-db.js'` to `tests/lib/browser-harness.js`.
- [ ] **Step 3: Verify storage tests**
  - Run targeted storage tests: `node tests/frictionless-persistence.test.js`.
  - Confirm all storage assertions pass cleanly.
- [ ] **Step 4: Commit**
  - `git commit -am "refactor(data): extract IndexedDB and offline sync into js/storage-db.js (#650)"`

---

### Task 2: Extract `js/city-matcher.js` (City Database & Geocoding)

**Files:**
- Create: `js/city-matcher.js`
- Modify: `js/data.js`
- Modify: `index.html`
- Modify: `sw.js`
- Modify: `tests/lib/browser-harness.js`

- [ ] **Step 1: Extract city database and fuzzy matching**
  - Create `js/city-matcher.js` containing `CITY_DATABASE`, `COUNTRY_DATA`, `POPULAR_CITY_DESTINATIONS`, `CITY_COORDINATES`, `ALL_CITIES_BY_CITY_ID_MAP`, `calculateLevenshteinDistance()`, `stripDiacritics()`, `findCityFuzzyMatch()`, `resolveCityLocation()`, `CITY_TO_CODE`, and `getCityIataCode()`.
  - Export functions and constants to `window`.
  - Remove extracted definitions from `js/data.js`.
- [ ] **Step 2: Update script tags and service worker**
  - Insert `<script src="./js/city-matcher.js"></script>` before `./js/data.js` in `index.html`.
  - Add `'./js/city-matcher.js'` to `sw.js` `ASSETS`.
  - Add `'./js/city-matcher.js'` to `tests/lib/browser-harness.js`.
- [ ] **Step 3: Verify city matching tests**
  - Run `node tests/city-fuzzy-matching.test.js`.
  - Run `node tests/city-disambiguation.test.js`.
  - Run `node tests/rebuild-itinerary-airport-codes.test.js`.
  - Confirm all city resolution assertions pass cleanly.
- [ ] **Step 4: Commit**
  - `git commit -am "refactor(data): extract static city database and fuzzy matching into js/city-matcher.js (#650)"`

---

### Task 3: Extract `js/trip-onboarding.js` (Wizard & Starter Generator)

**Files:**
- Create: `js/trip-onboarding.js`
- Modify: `js/data.js`
- Modify: `index.html`
- Modify: `sw.js`
- Modify: `tests/lib/browser-harness.js`

- [ ] **Step 1: Extract onboarding wizard logic**
  - Create `js/trip-onboarding.js` containing `tripStartStep`, `tripStartAnswers`, `startOnboardingWizard()`, `renderTripStartStep()`, `selectTripStartPath()`, `generateStarterTrip()`, and wizard modal DOM handlers.
  - Export functions to `window`.
  - Remove extracted code from `js/data.js`.
- [ ] **Step 2: Update script tags and service worker**
  - Insert `<script src="./js/trip-onboarding.js"></script>` after `./js/data.js` in `index.html`.
  - Add `'./js/trip-onboarding.js'` to `sw.js` `ASSETS`.
  - Add `'./js/trip-onboarding.js'` to `tests/lib/browser-harness.js`.
- [ ] **Step 3: Verify onboarding tests**
  - Run `node tests/dual-path-wizard.test.js`.
  - Confirm wizard step navigation and starter generation pass cleanly.
- [ ] **Step 4: Commit**
  - `git commit -am "refactor(data): extract onboarding wizard and starter generator into js/trip-onboarding.js (#650)"`

---

### Task 4: Extract `js/file-io.js` (FSA API & JSON Import/Export)

**Files:**
- Create: `js/file-io.js`
- Modify: `js/data.js`
- Modify: `index.html`
- Modify: `sw.js`
- Modify: `tests/lib/browser-harness.js`

- [ ] **Step 1: Extract File System Access API and file saving**
  - Create `js/file-io.js` containing active file handle DB persistence, `saveFileToDisk()`, `exportJSON()`, `importJSON()`, `hasActiveFileHandle()`, `isSavingToFile()`, `isJsonWriteWarningActive()`, `syncJsonWriteWarning()`, and file input handlers.
  - Export functions to `window`.
  - Remove extracted code from `js/data.js`.
- [ ] **Step 2: Update script tags and service worker**
  - Insert `<script src="./js/file-io.js"></script>` before `./js/data.js` in `index.html`.
  - Add `'./js/file-io.js'` to `sw.js` `ASSETS`.
  - Add `'./js/file-io.js'` to `tests/lib/browser-harness.js`.
- [ ] **Step 3: Verify file I/O tests**
  - Run `node tests/file-io-robustness-suite.js`.
  - Confirm file handle saving and import/export pass cleanly.
- [ ] **Step 4: Commit**
  - `git commit -am "refactor(data): extract File System Access API and JSON export/import into js/file-io.js (#650)"`

---

### Task 5: Full Regression Testing & Verification

**Files:**
- Verify all modified files

- [ ] **Step 1: Run city navigation regression suite**
  - `node tests/city-nav-regression.js`
- [ ] **Step 2: Run full automated test suite**
  - `npm test > test.log 2>&1`
  - Verify exit code 0 and all 43 browser tests passed across Desktop (1440x900) and Mobile (390x844).
- [ ] **Step 3: Push branch and create Pull Request**
  - `git push -u origin issue/650-decompose-data-js`
  - Create Pull Request linking Issue #650.
