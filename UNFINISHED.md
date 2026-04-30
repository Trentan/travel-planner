# UNFINISHED.md

## 🔄 Active

- **Item/sub-task:** 8a-i (REVERTED)
- **Branch:** item-8a-transport-table-layout
- **Last commit:** `Revert 8a-i changes - restore original 8a transport table code`
- **What was done:** Reverted the 8a-i changes that attempted to match accommodation table status style. The original 8a work appears to have issues that need investigation.
- **Next step:** Investigate original 8a issues - user reports "fields are all mucked up and look terrible plus all the hover text gone"
- **Files touched:** `js/transport.js` (reverted)

---

## 👀 Awaiting Review / Merge

- **Item 8a** — branch `item-8a-transport-table-layout` — HAS ISSUES - DO NOT REVIEW
  - User reports: "fields are all mucked up and look terrible plus all the hover text gone"
  - Need to investigate what's wrong with the original 8a transport table layout work
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

*Last updated: 2026-04-30 — Item 8a-i reverted, investigating original 8a issues*
