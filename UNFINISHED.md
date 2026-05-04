# UNFINISHED.md

## 🔄 Active

none

## 👀 Awaiting Review / Merge

- **Item/Feature:** 9a — Branch `item-9a-title-subtitle-fix` — PR open, awaiting review
- **Summary:** Fixed title/subtitle not loading from JSON

**What was done for 9a:**

1. Added blur event listeners to save title/subtitle when edited
2. Fixed bug where empty title/subtitle from localStorage override defaults
3. Added validation to prevent saving empty title/subtitle
4. Added validation when importing JSON to preserve defaults if imported values are empty
5. Added migration that auto-fixes corrupted empty titleData on startup

**Files changed:**
- `js/data.js` - Blur handlers, validation, and migration for title/subtitle

- **Item/Feature:** 8a-viii — Branch `item-8a-viii-journey-desc` — **COMPLETE** (viii, ix, x all done)
- **Summary:** Transport table refinements complete

**What was done for 8a-viii:**

1. Journey description auto-update - already implemented (buildJourneyName function)
2. Removed duplicate Date column - kept only Departs column
3. Standardized fonts - removed monospace 'DM Mono' font from date columns
4. Expanded leg rows now show "Leg X: City A → City B" format

**Files changed:**
- js/transport.js - Column layout and data alignment
- style.css - Removed font-family override from .date-col

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

*Last updated: 2026-05-04 — Item 9a complete, awaiting review*
