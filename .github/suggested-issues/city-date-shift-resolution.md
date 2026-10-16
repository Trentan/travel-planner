---
title: "[Audit]: Safe City Date-Shift Resolution (Prevent Ghost Activities & Orphaned Stays)"
labels: ["jules-suggested", "triage", "data-integrity"]
estimate: "L"
---

# [Audit]: Safe City Date-Shift Resolution (Prevent Ghost Activities & Orphaned Stays)

## Before
When a user shifts a city's dates (e.g. extending stay or delaying departure by 2 days), the itinerary timeline generator iterates strictly between `city.arrivalDate` and `city.departureDate`. Any activities that were scheduled on days outside this new window are silently omitted from the visual timeline, yet remain in the underlying `trip.activities` data array. They continue to count toward budget totals but become invisible "ghosts" that cannot be seen or deleted by the user.

## Evidence
- `js/itinerary.js`: Timeline building logic bounds activity rendering by city date ranges.
- `js/crud.js`: Modifying city dates does not reconcile activity dates or hotel stays.

## Proposed
1. Implement a **Date-Shift Resolution Dialog** whenever city arrival/departure dates change:
   - *Option A: Shift All Activities*: Automatically shift all activities in this city by ±N days (and offer to cascade downstream cities).
   - *Option B: Retain Dates & Flag Discrepancies*: Keep activity dates intact, but display any out-of-bounds items in an **"Unscheduled / Review Needed"** drawer at the top of the city view so no data is ever hidden.
2. Reconcile hotel stay check-in and check-out dates when city dates shift.

## After
Users can flexibly adjust city dates without losing visibility into booked activities or corrupting trip budget tallies.

## Estimate
- Effort estimate: L

## Files impacted
- `js/crud.js`
- `js/itinerary.js`
- `js/stays.js`

## Acceptance criteria
- [ ] Changing city dates never causes activities to disappear silently.
- [ ] Out-of-bounds activities are surfaced in an "Unscheduled / Review" tray.
- [ ] Option to batch-shift activities by ±N days works cleanly.
- [ ] Regression tests pass (`npm test`).

## Verification plan
- Automated tests: unit test shifting city dates with activities on boundary days.
- Manual test in browser: shift a 3-day city with activities on day 3 forward by 2 days.
