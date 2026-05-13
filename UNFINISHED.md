# UNFINISHED.md

## Active
- **Item/sub-task:** 12
- **Branch:** item-12-packing-improvements
- **Last commit:** none for Item 12 yet
- **What was done:** Session start prepared for Item 12; sub-task breakdown captured from TODO and likely packing-related touch points identified
- **Next step:** User to proceed with `Confirm 12a`, `Confirm 12b`, `Confirm 12c`, or `Confirm 12d`
- **Files touched:** expected: js/packing.js, js/data.js, js/guide.js, index.html, style.css
- **Estimated commits:** 12a: 1 to 2, 12b: 1, 12c: 1, 12d: 1 to 2
- **Sub-task breakdown:** 12a checklist/default leave-home merge, 12b delete sub-category blocks, 12c restore all packing defaults, 12d packing hints/guides UI improvements
- **Noticed (unscheduled):** None

## Active
- **Item/sub-task:** 13a
- **Branch:** item-13a-compact-view
- **Last commit:** `Item 13a [2 of 2]: fixed compact view variable references`
- **What was done:** Fixed `getDayJourneys` and `getStayDisplayForDay` to safely handle undefined variables; exposed `getDayTotal` and `getStayDisplayForDay` to window
- **Next step:** Test in browser to verify compact view works
- **Files touched:** js/utils.js, js/itinerary.js, js/transport.js
- **Noticed (unscheduled):** None

## Awaiting Review / Merge
- **Item:** 9e — branch `item-9e-import-transit-cities` — PR needs to be created
  - Import now extracts cities from leg labels (e.g., Verona when not in day.from/to)
  - Transit cities marked with `isTransit` flag and styled differently in city nav
  - Transit cities appear in separate "✈ Transit" section with dashed borders
  - Fixed: Taiwan added to COUNTRY_DATA so Taipei shows country correctly