# APP_POLISH_AUDIT_v2.md

## Travel Planner PWA - UI/UX & Mobile Polish Audit (Post-Advances)

**Audit date:** 2026-05-18  
**Last sync:** 2026-05-18  
**Viewports tested:** DDE (1440x900) / DCO (1440x900) / MDE (390x844) / MCO (390x844)  
**Real data used:** 2026_June_July_Europe_Thailand.json  
**Tracker sync:** 24/32 complete, 1 in Review, 7 active backlog rows.

---

## Critical Items

1. **[WI-028] Condensed Mobile Chrome on Scroll.** Status: Review. Mobile chrome is now condensed by default: the persistent top menu bar is removed on mobile, the menu button is integrated into the tab navigation, and file/status plus compact controls live in the menu sheet. Latest after screenshot: [WI-028-after-2.png](./screenshots/after/WI-028-after-2.png).
2. **[WI-029] Touch-Friendly Suggested Activity Assignment.** Status: Todo. Drag-and-drop is unusable on mobile. Implement a tap-to-assign flow.

---

## Important Items

1. **[WI-017] AI Builder Trip Context Pre-fill.** Status: Todo. Fields open blank. Pre-fill with current trip data (Title, Dates, Cities).
2. **[WI-030] Mobile Menu Scannability and Hierarchy.** Status: Todo. Dense grid of buttons is hard to scan. Reorganize into logical sections with headers.
3. **[WI-031] Compact Mode Visual Unification.** Status: Todo. Align the legacy list (DCO) with the modern card pager (MCO).

---

## Polish Items

1. **[WI-021] Desktop Itinerary Is Visually Busy.** Status: Todo.
2. **[WI-032] Global Currency Formatting Consistency.** Status: Todo. Centralize currency rendering to ensure consistent symbols and decimal places.

---

## Audit Checklist (v2)

- [x] All modes (DDE, DCO, MDE, MCO) screenshotted.
- [ ] Critical items resolved.
- [ ] Important items resolved.
- [x] WI-028 targeted regression passing: `node tests/city-nav-regression.js`.
- [x] TRACKER.md updated with current Review status and after screenshot.

## Verification Notes

- 2026-05-18 / WI-028: Mobile Playwright verification at 390x844 with real trip data passed the revised compact chrome checks and saved [WI-028-after-2.png](./screenshots/after/WI-028-after-2.png). Supplemental menu sheet screenshot: [WI-028-after-2-menu.png](./screenshots/after/WI-028-after-2-menu.png).
- 2026-05-18 / WI-028: `node tests/run-tests.js` currently passes core smoke and city nav before stopping on the existing map harness issue `L is not defined`.
