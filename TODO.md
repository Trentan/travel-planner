# Travel Planner TODO

Active work items for the Travel Planner PWA.

Read this file at the start of every session. When using Claude Code, read from the main branch before relying on the local copy.

---

## Active Work

### Item 9: Stable Release Polish

**Status:** In progress  
**Next:** 9d

- [x] 9a. Fix trip title and subtitle persistence.
  - Complete: PR #14 merged.
- [x] 9b. Add accommodation auto-populate for missing nights.
  - Complete: PR #16 merged.
- [x] 9c. Restore "Walk-on Gear (Wear onto plane)" packing area.
  - Complete: PR #17 merged.
- [ ] 9d. Add an easy way for users to force a complete site refresh on mobile app and website.
- [ ] 9e. Convert the testing checklist into structured TODO items and add actual smoke tests for core functionality.
- [ ] 9f. Convert the Future Enhancements checklist into structured backlog items, checking whether any are already resolved.
- [ ] 9g. Add a Notes tab with a generic checklist.
  - Example uses: gifts, photo reminders, important trip considerations, unresolved items.
- [ ] 9h. Improve the Leaving Home checklist by merging/comparing the user's Notion checklist.
  - Ask the user for access or content if needed.
  - Source: https://www.notion.so/trentan/afd1a6b4feb14fa38065515dbacbd676?v=d157c05db95048cbaffc6eb2645367a4&p=d4d390afce8b45fabdd8782b55fb3971&pm=s
- [ ] 9i. Allow deleting category blocks in Packing.
- [ ] 9j. Add "Restore Packing to Default" to wipe packing changes and reload defaults.
- [ ] 9k. Improve the packing hints/guides UI.
  - Current issue: single dropdowns are clunky in the 3-column row.
  - Possible approach: only one open at a time, or replace with buttons that launch dialogs.
- [ ] 9n. Fix the broken "Generate AI prompt" button.

### Item 11: City Submenu Navigation and Timeline Mapping

**Status:** In progress  
**Next:** 11f

Use `backups/2026_June_July_Europe_Thailand.json` as the primary regression fixture.

- [x] 11a. Fix city submenu click navigation for transit/stopover cities.
  - Current issue: clicking Verona or London in the city submenu does nothing.
  - Expected: clicking a city scrolls to the best matching itinerary position, even when the city is a transit/stopover rather than an overnight destination.
- [x] 11b. Sort the city submenu by first arrival / first itinerary appearance.
  - Expected order should start with the actual journey sequence, for example Brisbane, Taipei (transit), Bangkok (short stop), then onward cities.
  - Transit cities should remain visibly distinct but still appear in the correct timeline position.
- [x] 11c. Improve mapping between transport journeys and itinerary legs.
  - Use transport data to fill itinerary timeline blanks where useful.
  - Use itinerary legs to infer missing transport context where useful.
  - Avoid creating fake destination cities from labels such as Return, Departure, or generic travel labels.
- [x] 11d. Ensure the city submenu only uses cities from the imported/current JSON.
  - Current issue: default/browser-memory cities such as London and Paris can persist into later trips.
  - Imported cities, inferred itinerary cities, and transport-only transit cities should be merged without leaking stale browser state.
- [x] 11e. Add import/navigation regression checks for the Europe/Thailand backup.
  - Verify Verona and London appear as transit cities when applicable.
  - Verify Return is excluded from the city submenu.
  - Verify clicking each city nav item scrolls to a relevant itinerary leg/day.
- [ ] 11f. Clarify and implement repeated-city submenu behavior.
  - If a city is visited twice, make sure it appears in the submenu twice (eg one as a transit on the way and then secondly as an actual city visit - based on the itinerary and the transport - the city submenu should clearly map the journey path) - this might need further clarification - perhaps more important the city resides in the submenu where the MOST time in the city is spent as the best result

---

## Recently Completed

### Item 10: Backup Reminder and Export Improvements

**Status:** Done  
**Decision:** Hybrid approach. Keep browser storage and improve export/import UX. IndexedDB was reverted as over-engineering.

Completed:

- [x] Keep simple `localStorage`.
- [x] Add backup reminder tracking.
- [x] Show reminders after 7 days or 10 edits.
- [x] Enhance export button with filename memory.
- [x] Add visual export confirmation with filename.
- [x] Keep the app browser-based rather than building Electron/Tauri.

Files changed:

- `js/data.js`: enhanced `exportJSON` with feedback.
- `js/ui.js`: added edit tracking hooks.
- `index.html`: added export indicator UI.

User benefit:

- Clearer visibility into when data was last saved to file.
- Gentle backup reminders.
- One-click export from reminder.
- Less confusion about browser storage versus file storage.

---

## Noticed

Add bugs or improvements spotted during work here. Do not fix unless they are part of the active task.

- [ ] None currently.

---

## Verification Checklist

Run before considering implementation work complete:

- [ ] Open `index.html` in a browser and confirm the app loads without errors.
- [ ] Create, edit, and delete items in all tabs.
- [ ] Drag sights/runs from the pool to day cards.
- [ ] Toggle Fun Mode and Read Only Mode; confirm the UI updates correctly.
- [ ] Toggle Compact View; confirm layout switches and checkboxes still work.
- [ ] Export JSON; confirm the file downloads with correct data.
- [ ] Import JSON; confirm data loads and renders properly.
- [ ] Change budget costs; confirm calculations update.
- [ ] Check and uncheck packing items; confirm state persists after refresh.
- [ ] Confirm the Service Worker registers in browser DevTools.
- [ ] Test print views for both Summary and Detailed modes.

---

## Backlog

### UX and App Features

- [ ] Dark mode toggle.
- [ ] Search/filter functionality.
- [ ] Undo/redo system.
- [ ] Trip sharing/export formats such as PDF or Google Docs.
- [ ] Change colors for cities.
- [ ] Add multiple cities to a leg.
- [ ] Add or subtract a day to an existing leg.

### Travel Data

- [ ] Activity duration tracking.
- [ ] Flight miles tracking.
- [ ] Budget category breakdown.
- [ ] Image upload for receipts.

### Sync and Collaboration

- [ ] Cloud sync, for example Firebase or Dropbox.
- [ ] Multi-user collaboration.
