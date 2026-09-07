---
title: "feat(timezone): Timezone calculations with IANA identifiers, dual timezone display, and transit shift badges"
labels: ["feat", "area: itinerary", "area: transport", "priority: important", "jules-suggested"]
estimate: "M"
milestone: "Sprint 2: Destination Management & Timeline Intelligence (v1.4.0)"
---

# feat(timezone): Timezone calculations with IANA identifiers, dual timezone display, and transit shift badges

## Before
When planning multi-week international journeys across multiple countries and timezones, departure and arrival times frequently clash or confuse travelers because calculations depend on the client's current device clock rather than the local venue timezone. For example, a flight leaving Tokyo (JST UTC+9) and arriving in Paris (CEST UTC+2) lacks explicit timezone offset visualization, causing miscalculated connection buffers and missed check-ins.

## Evidence
- Grep for `timeZone` in the codebase finds only a single usage in `js/tabs.js:377` for month formatting.
- Cities in `appData` do not store or resolve standard IANA timezone identifiers (e.g., `Asia/Tokyo`, `Europe/Paris`, `America/New_York`).
- Transit segments show departure/arrival strings without showing cross-timezone shifts (`+7 hrs`, `-5 hrs`) or dual time display.

## Proposed
1. Create a dedicated timezone helper utility module (`js/timezone.js` or within `js/utils.js`) using modern browser `Intl.DateTimeFormat` with IANA timezone strings.
2. Associate default IANA timezones with destination cities in the city database.
3. Add a dual timezone option in itinerary day headers and activity modals (e.g., Local Venue Time vs Home Timezone).
4. Compute and display prominent Timezone Transition Badges on inter-city transit journeys (e.g., `🕐 +7 hrs Timezone Change` or `🕐 -1 hr`).

## After
Travelers can reliably view local schedules in the actual timezone of each destination city, anticipate jet lag/schedule shifts with clear transit badges, and keep track of home time for communicating with family/work.

## Estimate
- Effort estimate: M (3-5 hours)

## Files impacted
- `js/utils.js`
- `js/data.js`
- `js/transport.js`
- `js/itinerary.js`

## Acceptance criteria
- [ ] City database supports or derives IANA timezone identifiers.
- [ ] Inter-city transport cards calculate and render timezone delta badges (e.g. `+1 hr`, `-2 hrs`).
- [ ] Optional dual-time display allows travelers to view events in local destination time alongside home time.
- [ ] Calculations use standard `Intl.DateTimeFormat` without external heavy moment/luxon dependencies.

## Verification plan
- Automated tests: Unit tests for cross-timezone duration and offset calculation between JST, UTC, CEST, and EST.
- Manual verification: Add a flight from London to Bangkok; verify `+6 hrs` shift badge appears on the transport connector.
