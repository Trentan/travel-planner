# UNFINISHED.md

## 🔄 Active

- **Item/sub-task:** 8a-ii
- **Branch:** item-8a-transport-table-layout
- **Last commit:** Item 8a-ii [1 of 1]: Added booking reference field to journey dialog
- **What was done:** The journey dialog already had the Booking Ref input field in the HTML. Fixed the JavaScript to actually capture and save the value by: (1) reading the journeyBookingRef input value in _buildJourneyObject(), (2) using that variable instead of empty string for bookingReference, (3) clearing the field when opening the add dialog, (4) loading the bookingReference when editing a journey.
- **Next step:** Update UNFINISHED.md to mark this complete, commit and push
- **Files touched:** js/transport.js
- **Known blockers / risks:** none
- **Noticed (unscheduled):** Bugs or improvements spotted — copy to TODO.md Noticed too

## 👀 Awaiting Review

- **Item:** 8a-iv — branch `item-8a-transport-table-layout` — replaced "to" with "→" arrow in journey names
- Summary: Journey names now use arrow notation (e.g., "Brisbane → Vienna" instead of "Brisbane to Vienna") including multi-leg journeys with via cities

- **Item:** 8a-iii — branch `item-8a-transport-table-layout` — combined date and time in Departs column
- Summary: Departs column now shows "15 Jun 14:30" format matching Arrives column for both journey and segment rows

- **Item:** 8a-i — branch `item-8a-transport-table-layout` — booking reference now displays under status badge
- Summary: Removed separate Ref column, booking reference displays under status badge in transport table

## Completed (to be merged to main)

## Archived (moved from Awaiting Review after merge)

- **Item 8b** — branch `item-8b-city-iso-standards` — merged
- Sub-items i-viii complete
- Migration function for city ISO standards
- Display ISO codes in transport tab with hover tooltips
- Journey names using arrow notation (before 8a-iv enhanced this)
- Slovakia added to country data
- IATA lookup for Other country selection

*Last updated: 2026-05-01 — Items 8a-iv, 8a-iii, and 8a-i awaiting user review*
