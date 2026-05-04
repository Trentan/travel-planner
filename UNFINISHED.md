# UNFINISHED.md

## 🔄 Active

none

## 👀 Awaiting Review / Merge

- **Item/Feature:** 8a-viii — Branch `item-8a-viii-journey-desc` 
- **Summary:** Journey description auto-update feature

**What was done for 8a-viii:**
- Analysis found this feature is already implemented
- `buildJourneyName()` at `js/transport.js:212` generates journey names with "via" notation
- When segments are edited and saved, the journey name is automatically recalculated
- Multi-leg journeys show format: "Zurich → Bangkok (via London)"
- Single-leg journeys show: "Zurich → Bangkok"
- PR link: To be created

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

*Last updated: 2026-05-04 — 8a-viii already implemented, 8a-vii awaiting review*
