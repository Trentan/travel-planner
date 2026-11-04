---
title: "[Audit]: Mobile Navigation Consolidation & Bottom-Sheet Trip Switcher"
labels: ["jules-suggested", "triage", "mobile-ux"]
estimate: "M"
---

# [Audit]: Mobile Navigation Consolidation & Bottom-Sheet Trip Switcher

## Before
Managing and switching trips is fragmented across multiple redundant UI components:
1. Header switcher dropdown (`#currentTripBtn` and `#tripDropdownMenu`).
2. Top header cloud sync pill and save status indicators.
3. Desktop actions menu (`#desktopActionsMenu`).
4. Mobile menu drawer with 4 stacked sections and over 15 buttons.
5. Modal Trip Library (`openTripLibraryModal()`).
On mobile viewports (390x844), the mobile header and actions bar consume excessive vertical height (~140px), and users must navigate multi-level menus just to switch between itineraries.

## Evidence
- `index.html`: lines 36-60 (header trip switcher), lines 400-530 (mobile drawer with 4 sections).
- `docs/screenshots/argon-audit/01_mobile_home_itinerary.png`: shows dense top bar consuming valuable screen space.

## Proposed
1. **Consolidated Bottom-Sheet Trip Switcher**:
   - Tapping the active trip title in the top bar opens a native-feeling mobile bottom sheet.
   - Displays the 3 most recently accessed trips with trip icons, date ranges, and cloud sync status.
   - Includes a prominent `+ New Trip` action and a `View All Trips` link to the gallery.
2. **Streamlined Mobile Top Bar**:
   - Reduce mobile top bar height to 56px: `[ Trip Title ▾ ] [ Cloud Sync Pill ] [ ⋯ More ]`.
   - Remove redundant quick-action buttons from the sticky top bar.
3. **Consolidated "⋯ More" Modal**:
   - Replace the 15-button drawer with a clean, grouped modal:
     - *Share & Export*: PDF Print, Share Link, JSON Backup.
     - *Tools*: Import Bookings, Map View, AI Co-Pilot.
     - *Settings*: Appearance, Cloud Sync Settings.

## After
Mobile travelers can switch trips effortlessly with one thumb tap, and screen real estate is maximized for timeline content.

## Estimate
- Effort estimate: M

## Files impacted
- `index.html`
- `src/css/components.css`
- `src/css/mobile-features.css`
- `js/ui.js`

## Acceptance criteria
- [ ] Tapping trip title on mobile opens a clean bottom sheet switcher.
- [ ] Mobile header height is optimized to <= 56px.
- [ ] Destructive and rare actions are removed from the primary mobile drawer.
- [ ] Regression tests pass (`npm test`).

## Verification plan
- Automated tests: `npm test`
- Interactive mobile verification at 390x844 in Chrome DevTools.
