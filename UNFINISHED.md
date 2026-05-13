# UNFINISHED.md

## 🔄 Active
- **Item/sub-task:** 13a
- **Branch:** item-13a-compact-view  
- **Last commit:** none yet
- **What was done:** Investigating compact view issue - found `buildCompactItinerary()` at lines 1-89 of js/itinerary.js
- **Next step:** Create branch and test compact view in browser
- **Files touched:** none yet
- **Noticed (unscheduled):** None

## 👀 Awaiting Review / Merge
- **Item:** 9e — branch `item-9e-import-transit-cities` — PR needs to be created
  - Import now extracts cities from leg labels (e.g., Verona when not in day.from/to)
  - Transit cities marked with `isTransit` flag and styled differently in city nav  
  - Transit cities appear in separate "✈ Transit" section with dashed borders
  - Fixed: Taiwan added to COUNTRY_DATA so Taipei shows country correctly