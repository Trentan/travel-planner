---
title: "feat(itinerary): Visual transit connectors and layover transfer warnings between itinerary cards"
labels: ["feat", "area: itinerary", "area: transport", "ux", "priority: important", "jules-suggested"]
estimate: "M"
milestone: "Sprint 3: Leg Management & WYSIWYG Drag-and-Drop (v1.5.0)"
---

# feat(itinerary): Visual transit connectors and layover transfer warnings between itinerary cards

## Before
In the daily itinerary view, activities and scheduled transport legs are displayed as isolated cards. There is no clear visual continuity line connecting sequential events or transit hops. Travelers cannot easily distinguish between a tight 45-minute airport layover and a relaxed 3-hour transfer, nor do they see visual warnings when transit buffers are dangerously short (< 60 minutes for flights or < 15 minutes for trains).

## Evidence
- `js/itinerary.js` renders day cards and activities in stacked blocks without vertical visual connection paths or layover buffer calculations.
- While `js/transport.js` computes basic journey durations, it does not inject visual connector segments with transfer warnings into the itinerary timeline.
- Users have reported difficulty visualizing their journey transitions when scrolling through multi-segment travel days.

## Proposed
1. Design responsive visual transit connector lines between consecutive itinerary items and between inter-city travel legs.
2. In the connector line, display the transit mode icon (airplane, train, ferry, bus, walking), estimated duration, and transfer buffer.
3. Add intelligent buffer warnings:
   - Yellow advisory for tight layovers (e.g., flight layover < 90 mins or train transfer < 20 mins).
   - Red alert for critical clashes or negative buffers where arrival time is after the next departure time.
4. Provide expandable details showing carrier, flight/train number, and terminal/platform information.

## After
The itinerary presents a continuous visual timeline with clear transit conduits between activities, helping travelers instantly spot tight connections, layovers, and travel gaps.

## Estimate
- Effort estimate: M (3-5 hours)

## Files impacted
- `js/itinerary.js`
- `js/transport.js`
- `dist/tailwind.css`
- `index.html`

## Acceptance criteria
- [ ] Visual connecting lines link sequential activities and transit legs in the timeline.
- [ ] Layover durations between consecutive transit legs are automatically computed and displayed.
- [ ] Visual warnings highlight tight (< 90m flight, < 20m train) or impossible transfer buffers.
- [ ] Fully responsive on both desktop (1440x900) and mobile (390x844) viewports.

## Verification plan
- Automated tests: Unit tests for layover duration calculation and tight-connection alert thresholds.
- Manual verification: Inspect multi-leg journey in desktop and mobile viewports; verify connector lines and layover chips render cleanly in light and dark mode.
