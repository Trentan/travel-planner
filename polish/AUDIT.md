# APP_POLISH_AUDIT_v2.md

## Travel Planner PWA - UI/UX & Mobile Polish Audit (Post-Advances)

**Audit date:** 2026-05-18  
**Last sync:** 2026-05-18  
**Viewports tested:** DDE (1440x900) / DCO (1440x900) / MDE (390x844) / MCO (390x844)  
**Real data used:** 2026_June_July_Europe_Thailand.json  
**Tracker sync:** 26/32 complete, 1 in Review, 4 Todo backlog rows.

---

## Critical Items

1. **[WI-029] Touch-Friendly Suggested Activity Assignment.** Status: Done. Drag-and-drop is unusable on mobile. Implemented a touch-friendly Assign picker with large day targets and success feedback.

---

## Important Items

1. **[WI-017] AI Builder Trip Context Pre-fill.** Status: Review. Fields now pre-fill with current trip title, date/flight summary, and destination cities.
2. **[WI-030] Mobile Menu Scannability and Hierarchy.** Status: Todo. Dense grid of buttons is hard to scan. Reorganize into logical sections with headers.
3. **[WI-031] Compact Mode Visual Unification.** Status: Todo. Align the legacy list (DCO) with the modern card pager (MCO).

---

## Polish Items

1. **[WI-021] Desktop Itinerary Is Visually Busy.** Status: Todo.
2. **[WI-032] Global Currency Formatting Consistency.** Status: Todo. Centralize currency rendering to ensure consistent symbols and decimal places.

---

## Audit Checklist (v2)

- [x] All modes (DDE, DCO, MDE, MCO) screenshotted.
- [x] Critical items resolved.
- [ ] Important items resolved.
- [x] WI-028 targeted regression passing: `node tests/city-nav-regression.js`.
- [x] TRACKER.md updated with WI-028 completed status and after screenshot.

## Verification Notes

- 2026-05-18 / WI-028: Mobile Playwright verification at 390x844 with real trip data passed the revised compact chrome checks and saved [WI-028-after-2.png](./screenshots/after/WI-028-after-2.png). Supplemental menu sheet screenshot: [WI-028-after-2-menu.png](./screenshots/after/WI-028-after-2-menu.png).
- 2026-05-18 / WI-028: `node tests/run-tests.js` currently passes core smoke and city nav before stopping on the existing map harness issue `L is not defined`.
- 2026-05-18 / WI-028: User approved final review; WI-028 moved to Done/Completed.
- 2026-05-18 / WI-029: Mobile Playwright verification at 390x844 with real trip data passed the touch assignment checks and saved [WI-029-after-4.png](./screenshots/after/WI-029-after-4.png). Assign is 44x44 on mobile, the unassigned action uses the suggested-activity thumbtack, the assigned action stays as a chevron, and assigned status uses a soft green check instead of a yellow hourglass. `node tests/city-nav-regression.js` passed; `node tests/run-tests.js` still stops on the existing map harness issue `L is not defined`.
- 2026-05-18 / WI-029: User approved final review; WI-029 moved to Done/Completed.
- 2026-05-18 / WI-017: Desktop Playwright verification at 1440x900 with real trip data passed AI Builder pre-fill checks and saved [WI-017-after.png](./screenshots/after/WI-017-after.png). Confirmed title, dates/flights, and city fields are pre-filled and editable. `node tests/city-nav-regression.js` passed.
