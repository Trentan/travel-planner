# APP_POLISH_AUDIT_v2.md
## Travel Planner PWA - UI/UX & Mobile Polish Audit (Post-Advances)

**Audit date:** 2026-05-18  
**Viewports tested:** DDE (1440x900) · DCO (1440x900) · MDE (390x844) · MCO (390x844)  
**Real data used:** 2026_June_July_Europe_Thailand.json  

---

## 🔴 Critical Items (Must fix before launch)

1. **[WI-028] Map is a static SVG approximation.** The current SVG map lacks interactivity and accuracy. Replace with Leaflet.js and OSM tiles.
2. **[WI-029] Suggested Activities have no touch path.** Drag-and-drop is unusable on mobile. Implement a tap-to-assign flow.
3. **[WI-033] Sticky Header Viewport Pressure on Mobile.** Navigation elements consume too much space. Implement condensed chrome on scroll.

---

## 🟡 Important Items (High impact UX)

1. **[WI-030] AI Builder Trip Context Pre-fill.** Fields open blank. Pre-fill with current trip data (Title, Dates, Cities).
2. **[WI-032] Mobile Menu Hierarchy.** Dense grid of buttons is hard to scan. Reorganize into logical sections with headers.
3. **[WI-034] Compact Mode Visual Unification.** Align the legacy list (DCO) with the modern card pager (MCO).

---

## 🟢 Polish (Visual & consistency)

1. **[WI-031] Global Currency Formatting Consistency.** Centralize currency rendering to ensure consistent symbols and decimal places.
2. **[Polish] Modal Close Tap Targets.** Ensure all close buttons are ≥44px. (Included in WI-032 or separate).

---

## Audit Checklist (v2)

- [x] All modes (DDE, DCO, MDE, MCO) screenshotted.
- [ ] 🔴 Critical items resolved
- [ ] 🟡 Important items resolved
- [x] Regression check passing: `node tests/run-tests.js` (Note: Run after each fix)
- [x] TRACKER.md updated with 7 new items.
