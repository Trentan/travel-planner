# UNFINISHED.md

## 🔄 Active

- **Item/sub-task:** 8a-vi
- **Branch:** item-8a-vi-edit-segment-refactor
- **Last commit:** `7cac620` - Item 8a-vi [1 of 2]: Fix segment editing in multi-leg journey dialog
- **What was done:** 
  - All segments now loaded into pending array when editing journey
  - Segment pills at top are clickable to switch between segments
  - Fixed bug where segments disappeared when clicked (removed splice)
  - Fixed removePendingSegment to adjust active index after deletion
  - SaveJourneyFromModal now correctly saves form data back to array
- **Next step:** MANUALLY TEST the edit journey dialog with a multi-leg journey (3+ segments):
  1. Click each segment pill and verify it loads into form without disappearing
  2. Delete a segment and verify it's removed from JSON/page calculations
  3. Check the journey name displays correctly at top of edit dialog
  4. Switch between segments multiple times and verify data persists
- **Files touched:** `js/transport.js`, `style.css`, `TODO.md`
- **Known blockers / risks:** None - requires manual testing to verify fixes work

## 👀 Awaiting Review / Merge

none

## Completed (to be merged to main)

none

## Archived (merged to main, awaiting user verification)

none

---

*Last updated: 2026-05-01 — 8a-vi commit pushed, awaiting manual testing*
