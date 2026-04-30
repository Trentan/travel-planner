# UNFINISHED.md

## 🔄 Active

- **Item/sub-task:** 8a-i
- **Branch:** item-8a-transport-table-layout
- **Last commit:** `Item 8a-i [1 of 1]: Match accommodation table status style with booking reference below badge`
- **What was done:** Updated the Status column in transport table to match accommodation table styling - booking reference now uses `<br><span class="booking-ref">` format to stack it directly under the Pending/Confirmed status badge (matching the pattern in buildAccomTab)
- **Next step:** Push branch and move to awaiting review
- **Files touched:** `js/transport.js`

---

## 👀 Awaiting Review / Merge

- **Item 8a** — branch `item-8a-transport-table-layout` — pushed, ready for review
  - Redesigned transport table from 13 columns to 9 columns
  - Combined Provider/Route # into Service column
  - Stacked Date/Departs into Departure column
  - Added duration display per journey
  - Improved segment rows with cleaner layout
  - Better responsive breakpoints

---

## Archived (moved from Awaiting Review after merge)

- **Item 8b** — branch `item-8b-city-iso-standards` — merged
  - Sub-items i-ix complete
  - Migration function for city ISO standards
  - Display ISO codes in transport tab with hover tooltips
  - Journey names using arrow notation
  - Slovakia added to country data
  - IATA lookup for Other country selection

*Last updated: 2026-04-30 — Item 8a-i complete, awaiting review*
