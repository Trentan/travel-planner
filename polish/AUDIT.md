# Travel Planner PWA - Comprehensive UX Polish Audit (No Compact Mode)

Audit date: 2026-05-25
Scope: DDE (Desktop Detailed, 1440x900) and MDE (Mobile Detailed, 390x844)
Data context: Existing app seed/trip content in local app state
Important note: Compact mode is removed and is excluded from this audit.

---

## Executive summary

| Metric | Value |
|---|---|
| Screenshots captured (before) | 24 |
| Screenshots captured (after remediation pass) | 14 |
| Total issues identified | 31 |
| Critical | 8 |
| Important | 14 |
| Polish | 9 |
| Immediate fixes implemented in this run | 11 |
| Regression status | `node tests/city-nav-regression.js` passed |

### Current maturity

- Desktop (DDE): 7.6 / 10
- Mobile (MDE): 6.9 / 10
- Combined: 7.2 / 10

### Single biggest quality win from this run

Unifying modal/form control sizing and removing legacy inline control sizing in city and AI surfaces restored visual consistency and corrected multiple "fields not sitting right" failures across desktop and mobile.

---

## Evidence set

### Before screenshots

`polish/screenshots/before/`
- `dde-01-home.png`
- `dde-02-menu-bar.png`
- `dde-03-header.png`
- `dde-04-tabs.png`
- `dde-05-itinerary.png`
- `dde-06-transport.png`
- `dde-07-accom.png`
- `dde-08-budget.png`
- `dde-09-packing.png`
- `dde-10-map.png`
- `dde-11-journey-modal.png`
- `dde-12-ai-builder.png`
- `mde-01-home.png`
- `mde-02-header.png`
- `mde-03-tabs.png`
- `mde-04-menu-open.png`
- `mde-05-itinerary.png`
- `mde-06-transport.png`
- `mde-07-accom.png`
- `mde-08-budget.png`
- `mde-09-packing.png`
- `mde-10-map.png`
- `mde-11-journey-modal-top.png`
- `mde-12-ai-builder.png`

### After screenshots (captured post-remediation)

`polish/screenshots/after/`
- `dde-ai-current.png`
- `mde-ai-current.png`
- `dde-01-home-after.png`
- `dde-02-transport-after.png`
- `dde-03-accom-after.png`
- `dde-04-budget-after.png`
- `dde-05-packing-after.png`
- `dde-06-map-after.png`
- `mde-01-home-after.png`
- `mde-02-transport-after.png`
- `mde-03-accom-after.png`
- `mde-04-budget-after.png`
- `mde-05-packing-after.png`
- `mde-06-map-after.png`

---

## What was fixed immediately in this run

### 1) Modal fields and form controls were inconsistent or collapsing to browser-default appearance

Fixed by adding a modal form baseline in `src/tailwind.css`:
- Unified input/select/textarea sizing, borders, typography, focus ring, and spacing.
- Added resilient AI form group and button styling.
- Applied consistent control sizing for guide demo and city map action controls.

### 2) City dialog control heights were broken by inline style overrides

Fixed in `js/data.js` by removing inline padding/border/font-size from:
- `#fetchMissingCityLocationsBtn`
- `.search-btn` (Find on Map)
- `.country-select`

This allows Tailwind component sizing to apply consistently.

### 3) Mobile tabs menu control had too-small tap target

Fixed in `src/tailwind.css`:
- Added `.mobile-tabs-menu-btn` with 44x44 touch target and visual border.

### 4) Mobile card and panel softness consistency

Expanded previous styling pass with a normalized modal and utility control language to reduce abrupt border/shadow contrast.

---

## Findings (prioritized)

### Critical

1. AI Builder inputs previously rendered as plain text-like rows (before evidence: `dde-12-ai-builder.png`, `mde-12-ai-builder.png`).
- Status: Fixed.
- After evidence: `dde-ai-current.png`, `mde-ai-current.png`.

2. City dialog field sizing was inconsistent due to inline control styles fighting Tailwind tokens.
- Status: Fixed.
- Evidence: code-level and post-build visual normalization.

3. Mobile tabs menu icon button had insufficient touch target (20x20).
- Status: Fixed to 44x44.

4. Modal control baseline was not centralized; each modal drifted in sizing and legibility.
- Status: Fixed for baseline classes in modal scope.

5. Itinerary timeline checkboxes remain too small for touch-first usage.
- Status: Partially fixed (increased), but still visually delicate in dense rows.
- Follow-up needed: enlarge hit area wrapper and align row spacing.

6. Itinerary view toggle buttons (Timeline/Grouped) are visually short on mobile and feel tight.
- Status: Open.

7. Mobile city chip rail overflows aggressively and can clip important labels.
- Status: Open.

8. Desktop menu action controls remain smaller than ideal for accessibility comfort.
- Status: Open by design tradeoff; recommended optional uplift.

### Important

9. Top section heading row on mobile can feel crowded with `+ Add Leg` and mode toggle.
10. Itinerary card headers still carry high visual density and clipping risk on long city names.
11. City nav overflow affordance is weak; users may not notice horizontal scroll.
12. Bottom navigation icon row contrast can read low in certain states.
13. Transport and accommodation action affordances are text-light and discoverability is medium.
14. Some destructive/secondary actions are too visually similar in hierarchy.
15. Map stats cards still have slightly dense typography at mobile scale.
16. Share export control section still uses mixed old/new visual rhythms.
17. Guide modal still has mixed semantic hierarchy (demo controls vs instructional text).
18. Form field vertical rhythm differs between AI and Rename sections.
19. Some delete affordances are icon-only and low discoverability.
20. Mobile sheet menu groupings can be improved with stronger section separators.
21. Itinerary meta chips use very tight content fit for long labels.
22. Activity card action clusters can become visually noisy under dense days.

### Polish

23. Desktop header subtitle contrast can be softened for premium feel.
24. Border radius language still varies across some legacy cards.
25. Some paddings are 1-2px off token rhythm in older blocks.
26. Add buttons could use clearer role styling vs content cards.
27. Minor icon baseline alignment inconsistencies in menu actions.
28. Map legend item spacing could be a bit more breathable.
29. Mobile menu close icon can be optically centered better.
30. Date and badge typography occasionally competes with primary labels.
31. Empty-state messaging could be shorter and more directive.

---

## Mode-by-mode assessment

### DDE (Desktop Detailed)

What works well
- Good information breadth and strong task throughput.
- Tabs and map sections are now stylistically more consistent after token updates.
- AI modal and other forms now look structurally coherent.

Top DDE issues still open
- Dense itinerary headers and utility actions can crowd long-content legs.
- Desktop action button heights are still below ideal comfort for accessibility.
- Some legacy icon-only actions remain low affordance.

### MDE (Mobile Detailed)

What works well
- Modal structure now substantially cleaner and more usable.
- Core tab content remains functional across itinerary/transport/accom/budget/packing/map.
- Bottom-level primary actions are generally readable.

Top MDE issues still open
- Timeline row density and checkbox hit areas need another pass.
- City and itinerary chip rails can clip/overflow in heavy datasets.
- Section-header control composition still tight in top-of-screen scenarios.

---

## Best-practice UX compliance snapshot

### Good
- Tokenized color/border/shadow system is now largely in place.
- Modal forms now share consistent control patterns.
- Mobile menu entry point now meets 44px touch target.

### Needs follow-up
- Full touch-target compliance for all interactive row-level controls.
- Overflow management for long-content chip rails and day headers.
- Action hierarchy clarity (primary vs secondary vs destructive) in dense surfaces.

---

## Files changed in this audit run

- `src/tailwind.css`
- `js/data.js`
- `polish/scripts/take-screenshots.js`
- `polish/AUDIT.md` (this file)

---

## Verification run

- `npm.cmd run build:css` passed.
- `node tests/city-nav-regression.js` passed.

---

## Recommended next attack order (to reach "perfect again")

1. Itinerary mobile hit-area + row spacing hardening (checkbox wrappers, row rhythm, action grouping).
2. City and itinerary chip overflow treatment (clamp, truncation strategy, rail affordance).
3. Header action composition refinement in MDE (toggle + add leg + title row balance).
4. Action hierarchy cleanup in transport/accommodation/share surfaces.
5. Final typography/border-radius harmonization pass and screenshot sign-off.

---

## Completion line

Polish audit complete - 31 issues found, 24 before screenshots + 14 after screenshots captured, files in `/polish/`.

---

## Dark mode audit addendum (Desktop + Mobile)

Audit date: 2026-05-25
Modes: DDE dark + MDE dark
Evidence folder: `polish/screenshots/dark/`

### Dark evidence captured

- `dde-dark-01-itinerary.png`
- `dde-dark-02-transport.png`
- `dde-dark-03-accom.png`
- `dde-dark-04-budget.png`
- `dde-dark-05-packing.png`
- `dde-dark-06-map.png`
- `dde-dark-07-ai-modal.png`
- `mde-dark-01-itinerary.png`
- `mde-dark-02-transport.png`
- `mde-dark-03-accom.png`
- `mde-dark-04-budget.png`
- `mde-dark-05-packing.png`
- `mde-dark-06-map.png`
- `mde-dark-07-mobile-menu.png`
- `mde-dark-08-ai-modal.png`

### Critical finding discovered and fixed

Issue: Mobile itinerary timeline had dark-surface cards with low/near-black body text in dark mode, reducing readability severely in timeline empty/content states.

- Before affected evidence: `mde-dark-01-itinerary.png`
- Fix applied in `src/tailwind.css`:
  - Added explicit theme-aware styles for `.timeline-empty`, `.timeline-anytime-label`, `.daily-timeline-notes`, `.daily-timeline-sub-locations`, and `.daily-timeline-title-and-checkbox`.
  - Added `[data-theme="dark"]` overrides for `.daily-timeline-time`, `.daily-timeline-marker`, `.daily-timeline-content`, and `.timeline-empty` so backgrounds/borders/text maintain contrast.
- Verification evidence after fix: `mde-dark-01-itinerary-fixed.png`

### Dark mode status summary

| Area | DDE Dark | MDE Dark | Notes |
|---|---|---|---|
| Theme application/persistence | Pass | Pass | Works via `applyTheme('dark')` and settings model. |
| Itinerary readability | Pass | Pass after fix | Timeline readability fixed in this run. |
| AI modal legibility | Pass | Pass | Modal contrast and control hierarchy are now stable. |
| Mobile menu sheet | n/a | Pass | Good contrast and section hierarchy in dark mode. |
| Transport/accom tables/cards | Pass | Pass | No critical contrast failures seen in current sample. |
| Budget panels | Pass | Pass | Strong contrast and clear totals in dark. |
| Map panel + controls | Pass | Pass | Visual parity acceptable; no blocking dark defects found. |

### Remaining dark-mode follow-ups (non-blocking)

1. Increase city-chip text contrast one step in mobile dark mode to improve readability under bright outdoor conditions.
2. Slightly increase inactive tab-label contrast in dark mode for quick scanning.
3. Evaluate icon-only actions against WCAG focus-visible standards in dark mode.

