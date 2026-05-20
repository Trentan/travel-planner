# APP_POLISH_AUDIT_v2.md

## Travel Planner PWA - UI/UX & Mobile Polish Audit (Post-Advances)

**Audit date:** 2026-05-18  
**Last sync:** 2026-05-20
**Viewports tested:** DDE (1440x900) / DCO (1440x900) / MDE (390x844) / MCO (390x844)  
**Real data used:** 2026_June_July_Europe_Thailand.json  
**Tracker sync:** 33/33 complete, 0 in Review, 0 Todo backlog rows.

---

## Critical Items

1. **[WI-029] Touch-Friendly Suggested Activity Assignment.** Status: Done. Drag-and-drop is unusable on mobile. Implemented a touch-friendly Assign picker with large day targets and success feedback.

---

## Important Items

1. **[WI-017] AI Builder Trip Context Pre-fill.** Status: Done. Fields now pre-fill with current trip title, date/flight summary, and destination cities.
2. **[WI-030] Mobile Menu Scannability and Hierarchy.** Status: Done. Mobile menu is grouped into logical sections with headers and primary action emphasis.
3. **[WI-031] Compact Mode Visual Unification.** Status: Done. Desktop compact now uses the shared compact card/pager renderer.
4. **[WI-035] Map Geocoding & Marker Refinement.** Status: Done. Map marker order now matches the city submenu sequence, uses contiguous marker numbering, keeps route lines in trip order, and includes local coordinate coverage for the trip cities that were previously omitted.

---

## Polish Items

1. **[WI-021] Desktop Itinerary Is Visually Busy.** Status: Done. Desktop itinerary panels are calmer, with edit chrome de-emphasized until hover/focus.
2. **[WI-032] Global Currency Formatting Consistency.** Status: Done. Shared currency formatter now drives visible budget, itinerary, accommodation, and transport cost displays.
3. **[WI-034] Activity Assignment Emoji Retention.** Status: Done. Assigned suggested activities now retain their category emoji in planned day items.

---

## Audit Checklist (v2)

- [x] All modes (DDE, DCO, MDE, MCO) screenshotted.
- [x] Critical items resolved.
- [x] Important items resolved.
- [x] WI-035 targeted regression passing: `node tests/city-nav-regression.js`.
- [x] TRACKER.md updated with WI-035 completed status and after screenshot.

## Verification Notes

- 2026-05-18 / WI-028: Mobile Playwright verification at 390x844 with real trip data passed the revised compact chrome checks and saved [WI-028-after-2.png](./screenshots/after/WI-028-after-2.png). Supplemental menu sheet screenshot: [WI-028-after-2-menu.png](./screenshots/after/WI-028-after-2-menu.png).
- 2026-05-18 / WI-028: `node tests/run-tests.js` currently passes core smoke and city nav before stopping on the existing map harness issue `L is not defined`.
- 2026-05-18 / WI-028: User approved final review; WI-028 moved to Done/Completed.
- 2026-05-18 / WI-029: Mobile Playwright verification at 390x844 with real trip data passed the touch assignment checks and saved [WI-029-after-4.png](./screenshots/after/WI-029-after-4.png). Assign is 44x44 on mobile, the unassigned action uses the suggested-activity thumbtack, the assigned action stays as a chevron, and assigned status uses a soft green check instead of a yellow hourglass. `node tests/city-nav-regression.js` passed; `node tests/run-tests.js` still stops on the existing map harness issue `L is not defined`.
- 2026-05-18 / WI-029: User approved final review; WI-029 moved to Done/Completed.
- 2026-05-18 / WI-017: Desktop Playwright verification at 1440x900 with real trip data passed AI Builder pre-fill checks and saved [WI-017-after.png](./screenshots/after/WI-017-after.png). Confirmed title, dates/flights, and city fields are pre-filled and editable. `node tests/city-nav-regression.js` passed.
- 2026-05-18 / WI-030: Mobile Playwright verification at 390x844 with real trip data passed menu hierarchy checks and saved [WI-030-after.png](./screenshots/after/WI-030-after.png). Confirmed section headers, primary action emphasis, and >=44px visible menu buttons. `node tests/city-nav-regression.js` passed.
- 2026-05-18 / WI-031: Desktop compact Playwright verification at 1440x900 with real trip data passed shared renderer checks and saved [WI-031-after.png](./screenshots/after/WI-031-after.png). Confirmed 15 compact cards render and the legacy list is not used; mobile compact sanity check confirmed 15 cards/chips still render. `node tests/city-nav-regression.js` passed.
- 2026-05-18 / WI-021: Desktop Playwright verification at 1440x900 with real trip data passed itinerary visual-busy checks and saved [WI-021-after.png](./screenshots/after/WI-021-after.png). Confirmed styled leg panels, stronger day hierarchy, and low-opacity edit chrome until interaction. `node tests/city-nav-regression.js` passed.
- 2026-05-18 / WI-032: Mobile Playwright verification at 390x844 with real trip data passed currency-format checks and saved [WI-032-after.png](./screenshots/after/WI-032-after.png). Confirmed budget KPI/table values use shared currency symbols, thousands separators, and decimal precision. `node --check` passed for changed JS files and `node tests/city-nav-regression.js` passed.
- 2026-05-18 / WI-017, WI-021, WI-030, WI-031, WI-032: User approved final review after the combined commit landed on `main`; items moved to Done/Completed.
- 2026-05-18 / WI-034: Focused activity assignment harness check passed for assigning, moving, and clearing emoji-prefixed day items. `node --check js/crud.js`, `node --check tests/item15-suite.js`, and `node tests/city-nav-regression.js` passed. `node tests/item15-suite.js` still stops on the existing Leaflet harness issue `L is not defined` before reaching activity assignment tests.
- 2026-05-18 / WI-034: User approved final review; WI-034 moved to Done/Completed.
- 2026-05-20 / WI-035: Desktop Playwright verification at 1440x900 with real trip data passed map order checks and saved [WI-035-after-2.png](./screenshots/after/WI-035-after-2.png). Confirmed city nav order and map legend both use Brisbane, Taipei, Vienna, Bratislava, Prague, Nuremberg, Munich, Innsbruck, Bolzano, Verona, Milan, Zurich, London, Bangkok, Koh Samui; marker labels are contiguous 1-15; route polyline order includes Bolzano, Verona, Milan and the return through Koh Samui, Bangkok, Brisbane. Supplemental Cities dialog screenshot: [WI-035-after-2-cities.png](./screenshots/after/WI-035-after-2-cities.png). Bulk missing-location action filled all missing trip city coordinates into local trip storage. `node --check js/data.js`, `node --check js/itinerary.js`, `node --check js/map.js`, and `node tests/city-nav-regression.js` passed.
- 2026-05-20 / WI-035: User approved final review; WI-035 moved to Done/Completed.
