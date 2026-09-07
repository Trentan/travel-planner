---
title: "feat(desktop): Responsive desktop split-pane layout with itinerary feed and interactive map/detail drawer"
labels: ["feat", "area: desktop", "ux", "priority: important", "jules-suggested"]
estimate: "L"
milestone: "Sprint 6: Desktop Split-Pane & Print Productivity (v2.1.0)"
---

# feat(desktop): Responsive desktop split-pane layout with itinerary feed and interactive map/detail drawer

## Before
On large desktop and laptop viewports (>= 768px and up to 1440x900+), the application operates in a single-column, full-width tab structure. To cross-reference an activity with the map, check hotel locations, or inspect journey routes, users must constantly switch between the "Itinerary" tab and the "Map" or "Stays" tab. This leaves substantial widescreen display real estate unused and creates fragmented planning context.

## Evidence
- In `index.html` and `js/tabs.js`, switching tabs hides `#itineraryTabContent` and displays `#mapTabContent` in full page.
- On a 1440x900 desktop screen, the itinerary feed is centered with significant empty side margins.
- Standard modern desktop travel apps (e.g., Google Travel, TripMapper, Notion) provide a split-view balancing the chronological itinerary list on the left with an interactive map or detail drawer on the right.

## Proposed
1. Implement a responsive two-pane split layout for viewports >= 1024px (desktop mode):
   - **Left Pane (50-60% width)**: Scrollable chronological itinerary feed with city day slides, activities, and transport cards.
   - **Right Pane (40-50% width)**: Synchronized interactive map (Leaflet / CARTO) or expandable detail drawer for the selected item.
2. Clicking any activity or stay in the left pane centers and highlights its corresponding pin on the right-hand map.
3. Provide a quick toggle button to expand the itinerary or map to full width when desired (`[ ⛶ Full Map ]` / `[ ◨ Split View ]`).
4. Ensure mobile viewports (< 768px) preserve the focused single-column carousel view without regression.

## After
Desktop users can plan itineraries with an ergonomic split-screen experience, viewing their schedule and geographical pins simultaneously without tab switching.

## Estimate
- Effort estimate: L (1-2 days)

## Files impacted
- `index.html`
- `js/tabs.js`
- `js/map.js`
- `js/itinerary.js`
- `dist/tailwind.css`

## Acceptance criteria
- [ ] On viewports >= 1024px, user can activate the dual-pane split view.
- [ ] Left pane displays the active itinerary schedule while right pane displays the interactive map.
- [ ] Selecting an activity or stay focuses and zooms the map to its coordinate.
- [ ] Full-width and split-width toggle controls allow users to customize their workspace.
- [ ] Mobile viewports (390x844) remain unaffected and function in native single-column mode.

## Verification plan
- Automated tests: Regression tests for tab switching and map rendering (`npm test`).
- Manual verification: Test on Desktop Viewport (1440x900) across Chrome, Safari, and Firefox.
