# VERIFIED.md

Confirmed completed items. Append-only archive — do not edit existing entries.

---

### Item 1: Layout Issue ✅
**Completed:** 2026-04-25 — branch `item-1b-sync-fixes` merged

- Three-column layout: Tips, Food Quests, Suggested Activities
- Collapsible action button bug fixed; tab synchronization working

---

### Item 2: Resolve Journey/Transport Integration ✅
**Completed:** 2026-04-26

- Transport tab reverted to table format with correct columns
- Journeys import from JSON, saved to localStorage and loaded in initData
- Journeys have fromCityId/toCityId linking to defined cities
- Journey/transport refactored with journeyName and journeyId
- Add journey dialog fixed

---

### Item 3: Multi-leg Journey Object & Table Redesign ✅
**Completed:** 2026-04-26

- Journey object extended: `legs[]`, `isMultiLeg`, `journeyName`, `journeyId`
- `saveJourneyFromModal()` — multiple segments before saving
- `buildTransportTab()` — rows grouped by journeyId with expand toggle
- `getDayJourneys()` — matches multi-leg journeys by departureDate
- Itinerary transport block displays `journeyName` and full route chain
- `getSortedJourneys()` — sorts by first segment's departureDate/Time
- `openAddJourneyModal()` — pre-populates journeyId for segments

---

### Item 4: Style.css Issues ✅
**Completed:** 2026-04-27 — branch `item-4a`

- style.css errors fixed, tidied, layout confirmed good
- Title and subtitle from .json now applied and editable (white on white resolved)
- Country flags now display correctly in PC browser (city submenu)

---

### Item 6: Database Alignment (Cities) ✅
**Completed:** 2026-04-27 — branch `item-6a`

- Cities field added to all entities: tips, food, accom, journey, sights
- Trip JSON converted to new structure
- "All" option added to city filter (default)
- City filter applied to Accommodation and Transport tabs
- City management dialog: add new or select existing, Start/Return handling
- City subheadings sticky below main tab bar, flag/country label in menu
- Tips "[object Object]" display fixed
- Itinerary city scroll adjusted — day and city name stays in view
- City color randomization — submenu and map match city color
- Departure leg renamed/handled as Start; Return as special option
- Add leg dialog: city from/to, days/dates, conflict warning

---

### Item 6: Packing Fixes ✅
**Completed:** 2026-04-28

- Packing guides ("Before leaving home", "Sink washing", "Capsule") in 3-column grid, collapsed by default
- DEFAULT_LEAVE_HOME checklist applied on blank or initial load
- "Before leaving home" removed from Carry-on Packed Bag defaults

---

### Item 7: Interactive How-To Guide ✅
**Completed:** 2026-04-28 — branch `item-7a`

- Interactive guide fixed and updated to reflect latest app changes
- Default JSON example updated for all changes
- AI script generator updated: cities as multi-add, assigns cityId to tips/food/activities
- Guide button fixed (was doing nothing — missing `window.*` exports in `guide.js`)
- DEFAULT_LEAVE_HOME applied when content blank or on initial load
- Packing guides redesigned: tab-style pill navigation, badge on Pre-Departure, hidden by default with close buttons
---

### Item 8a: Improve Journey Table Layout ✅
**Completed:** 2026-05-01 — branch `item-8a-transport-table-layout` merged via PR #9

- 8a-i: Booking reference displays under status badge (removed separate Ref column)
- 8a-ii: Journey dialog captures and saves booking reference values
- 8a-iii: Departs column combined date and time (e.g., "15 Jun 14:30")
- 8a-iv: Journey names use arrow notation (→ instead of "to"), including multi-leg journeys
- 8a-v: Total journey travel time calculated and displayed under journey name (e.g., "11hrs")

---

### Item 9a: Title/Subtitle JSON Loading ✅
**Completed:** 2026-05-12 — branch `item-9a-title-subtitle-fix` merged via PR #14

- Added blur handlers to save title/subtitle on edit
- Fixed empty title/subtitle validation on save
- Fixed title/subtitle loading from imported JSON meta
- Pre-empted blank title/subtitle saves to preserve existing values

---

### Item 9b: Autopopulate Accommodation Stays ✅
**Completed:** 2026-05-12 — branch `item-9b-autopopulate-stays` merged via PR #16

- Auto-populate stays feature: scans itinerary for missing accommodation entries
- Creates missing accommodation slots for each city based on nights stayed
- Button only appears when gaps are detected between accommodation and itinerary length
- Fixed: Excludes 'In transit' nights from accommodation night calculation
- Fixed config issues for proper integration

---

### Item 9c: Packing Tab Walk-on Gear Fix ✅
**Completed:** 2026-05-12 — branch `item-9c-packing-defaults` merged via PR #17

- Restored "Walk-on Gear (Wear onto plane)" area in packing tab
- Walk-on gear now always displays with default checklist on load
- Fixed missing rendering of primary packing category

---

### Item 10a: Backup Reminder & Export Improvements ✅
**Completed:** 2026-05-12 — branch `item-10a-indexeddb-storage` merged via PR #15

- Added backup reminder system tracking exports
- Shows reminder after 7 days or 10 edits since last export
- Enhanced export button with filename memory
- Visual export confirmation showing filename
- Enhanced export in data.js with user feedback
- Added edit tracking hooks in ui.js
- Export indicator UI added to index.html
- Reverted to localStorage approach (IndexedDB over-engineering)
- Clean, user-friendly backup workflow

---

### Item 11: City Submenu Navigation and Timeline Mapping
**Completed:** 2026-05-13 - branch `item-11-city-nav-timeline`

- Fixed city submenu clicks for transit/stopover cities such as Verona and London.
- Sorted the city submenu using itinerary and transport timeline data.
- Improved journey-to-leg mapping by filling city IDs, leg IDs, and normalized day dates.
- Isolated imported city state so stale browser cities do not leak into new imports.
- Added `tests/city-nav-regression.js` using `backups/2026_June_July_Europe_Thailand.json`.
- Repeated cities now keep one submenu entry mapped to the best/longest accommodation stay when available.
- Verification covered: Return excluded, Verona/London transit handling, city order, click targets, journey leg IDs, and Bangkok longest-stay placement.

---

### Item 12: Packing Improvements
**Completed:** 2026-05-13 - branch `item-11-city-nav-timeline`

- Expanded the default Before Leaving Home checklist to include the user's house-leaving tasks.
- Added checklist merging so saved/imported packing data picks up new defaults without losing custom or checked items.
- Added category-block deletion in Packing.
- Added a Restore Packing to Default action for both packing lists and the leave-home checklist.
- Reworked the packing guide UI into a single-panel picker with one guide open at a time.

---

### Item 9: Stable Release Polish
**Completed:** 2026-05-13 - confirmed complete by user

- 9a: Fixed trip title and subtitle persistence.
- 9b: Added accommodation auto-populate for missing nights.
- 9c: Restored the "Walk-on Gear (Wear onto plane)" packing area.
- 9d: Added an easy way to force a complete site refresh on mobile app and website.

---

### Item 13: Other improvements
**Completed:** 2026-05-14 - branch `item-13a-13c-core-fixes`

- 13a: Fixed compact view.
- 13b: Normalized date handling to ISO-style JSON paths and display logic.
- 13c: Removed Fun Mode and Force Refresh from the top-level UI.
- Reset App now handles the full clear path for browser data and cache state.
- User-tested after mobile theme tweaks and confirmed working.

---

### Item 15: Testing checklist converted into automated browser and unit coverage
**Completed:** 2026-05-15 - branch `item-14-mobile-shell-polish` merged as `fc34c66`

- Added a dedicated `tests/` folder for the suite entry points and shared helpers.
- Added `npm test`, `npm run test:browser`, and `npm run test:browser:headed`.
- Added click-to-run launchers for terminal and visible browser runs.
- Added real Chromium desktop and mobile browser coverage with headed mode support.
- Added modal, CRUD, drag-and-drop, export/import, packing, print, service worker, and file save/load coverage.
- Updated the README with the test-running workflow so changes can be validated before commit or push.

---

### Compact Itinerary Mobile Polish
**Completed:** 2026-05-16

- Reworked compact itinerary day cards into modular transport, accommodation, and activities blocks.
- Hid compact-mode costs and kept durations visible as muted bracketed suffixes.
- Removed duplicate emoji and transport status glyphs from compact itinerary rows.
- Added mobile-focused compact styling so the blocks stack cleanly on small screens.

---

### Item 14: Mobile app shell polish
**Completed:** 2026-05-16

- Consolidated the top menu into a mobile action sheet.
- Made compact view meaningfully reduce chrome on phones.
- Kept the city filter sticky on mobile.
- Improved the reset experience on mobile.
- Removed the home / destination clocks from the mobile shell.
- Unified transport and accommodation mobile table rendering, shared action buttons, and modal delete actions.
