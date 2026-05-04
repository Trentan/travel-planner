# UNFINISHED.md

## 🔄 Active

none

## 👀 Awaiting Review / Merge

- **Item/Feature:** 8a-viii — Branch `item-8a-viii-journey-desc`
- **Summary:** Transport table refinements complete

**What was done for 8a-viii:**
1. Journey description auto-update - already implemented (buildJourneyName function)
2. Removed duplicate date column (kept departs column only)
3. Standardized fonts across transport table (removed inconsistent font-size declarations)
4. Updated expanded leg rows to show "Leg X: City A → City B"

**Files changed:**
- js/transport.js - Removed duplicate date column, standardized fonts, added leg info with cities

## Awaiting Review / Merge

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

*Last updated: 2026-05-04 — 8a-vii and 8a-viii complete, awaiting review*
