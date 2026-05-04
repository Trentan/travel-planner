# UNFINISHED.md

## 🔄 Active

- **Item/sub-task:** 8a-viii
- **Branch:** item-8a-viii-journey-desc
- **What will be done:** Implement auto-updating journey descriptions when legs/segments change. When a journey's start/end cities change (or intermediate legs are added), the description should update to show "City A to City B (via City C, City D)".
- **Next step:** Find where journey descriptions are generated and add auto-update logic
- **Files to touch:** js/crud.js (journey/leg update handlers), js/transport.js (description display)
- **Estimated commits:** 2-3 commits

## 👀 Awaiting Review / Merge

- **Item/Feature:** 8a-vii — Branch `item-8a-vii-country-entry` — PR #12 open
- **Summary:** Custom country entry feature - users can type any country name when adding cities

**What was done for 8a-vii:**
- Users can now type any country name directly in the country input field
- If country doesn't exist in built-in list, it's automatically created
- Generates a 2-letter country code from the name
- New country saved to localStorage and immediately available in dropdowns
- PR #12: https://github.com/Trentan/travel-planner/pull/12

## Completed (to be merged to main)

none

## Archived (merged to main, awaiting user verification)

none

---

*Last updated: 2026-05-04 — Starting 8a-viii: Auto-update journey descriptions*
