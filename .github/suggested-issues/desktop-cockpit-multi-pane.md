---
title: "[Audit]: Desktop Cockpit 3-Pane Layout & Non-Modal Inspector"
labels: ["jules-suggested", "triage", "desktop-ux"]
estimate: "L"
---

# [Audit]: Desktop Cockpit 3-Pane Layout & Non-Modal Inspector

## Before
On desktop monitors (1440x900 and above), the UI renders as an overly wide single column. Action buttons sit up to 1000px away from the timeline content, causing saccadic eye fatigue. Additionally, modal dialogs centered on screen block visibility of the itinerary days beneath them, preventing users from cross-referencing their schedule while scheduling new events.

## Evidence
- `index.html`: single column container with max-width wrapper.
- Mouse-wheel users cannot scroll horizontal `#cityNav` rail without holding Shift.

## Proposed
1. At `@media (min-width: 1024px)`, introduce a responsive 3-pane layout:
   - Left Sidebar (260px): Vertical City Navigation tree and Trip switcher.
   - Center (minmax(520px, 1fr)): Continuous chronological day-by-day itinerary.
   - Right Inspector Pane (380px): Non-modal inspector for editing selected activities, transit legs, or notes while keeping the timeline in view.
2. Allow seamless toggling between compact single-column and expanded multi-pane view.

## After
Desktop trip planning transforms into an efficient, wide-screen cockpit workspace matching premier desktop productivity applications.

## Estimate
- Effort estimate: L

## Files impacted
- `index.html`
- `index.css`
- `js/ui.js`
- `js/itinerary.js`

## Acceptance criteria
- [ ] Desktop screens >= 1024px offer an expanded multi-column layout with vertical city navigation.
- [ ] Inspector pane allows viewing/editing items without blinding the timeline.
- [ ] Regression tests pass (`npm test`).

## Verification plan
- Automated tests: `npm test`
- Desktop browser verification at 1440x900.
