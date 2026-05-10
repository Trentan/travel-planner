# UNFINISHED.md

## 🔄 Active

- **Item/Feature:** 10a — Branch `item-10a-indexeddb-storage` — starting implementation
- **Summary:** Implement IndexedDB storage layer

**Next step:** Create IndexedDB wrapper functions and integrate with save/load system

## 👀 Awaiting Review / Merge

- **Item/Feature:** 9a — Branch `item-9a-title-subtitle-fix` — PR #14 open
- **Summary:** Fixed title/subtitle not loading from JSON

## Completed

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

## Archived

none

---

*Last updated: 2026-05-10 — Item 10a starting, Item 9a complete awaiting PR review*