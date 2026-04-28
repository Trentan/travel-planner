# UNFINISHED.md

## 🔄 Active
none

## 👀 Awaiting Review / Merge
none

## ✅ Recently Completed (pre-merge summary)

### Item 7d: Fix Guide Button
**File:** `js/guide.js`
- Added missing `window.*` exports for guide functions: `buildGuideSteps`, `toggleGuideStep`, `markStepComplete`, `resetTutorialSeen`, `startTutorial`, `skipTutorial`, `nextTutorialStep`, `prevTutorialStep`
- Guide button now opens the interactive tutorial dialog

### Item 7e: DEFAULT_LEAVE_HOME on Empty
**File:** `js/data.js`
- Extended logic to apply defaults when saved array is empty (not just when localStorage key is missing)
- Users who delete all tasks will now get defaults back on reload

### Item 7f: Packing Guides
**Files:** `js/tabs.js`
- Restored working buildPackingTab() from backup after corruption during edit
- Uses collapsible guide sections (<details>) with packing list grid below
- All three guides functional: Pre-Departure, Sink Washing, Capsule Wardrobe

---

*Last updated: 2026-04-28 — all items merged and verified per VERIFIED.md*
