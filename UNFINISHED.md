# UNFINISHED.md

## 🔄 Active

- **Item/sub-task:** 8a-viii
- **Branch:** item-8a-vi
- **What will be done:** Implement auto-updating journey descriptions when legs/segments change. When a journey's start/end cities change (or intermediate legs are added), the description should update to show "City A to City B (via City C, City D)".
- **Next step:** Create new branch and begin implementation
- **Files to touch:** js/crud.js (journey/leg update handlers), js/transport.js (description display)
- **Estimated commits:** 2-3 commits

## 👀 Awaiting Review / Merge

- **Item/Feature:** 8a-vii — Branch `item-8a-vii-country-entry` — PR #12 open
- **Summary:** Custom country entry feature

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

*Last updated: 2026-05-04 — 8a-vii complete, starting 8a-viii*
