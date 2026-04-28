# UNFINISHED.md

## 🔄 Active
none

## 👀 Awaiting Review / Merge
- **Item:** 7d, 7e, 7f — branch `item-7a` — all sub-tasks done, ready for merge
- **Next after merge:** Item 8 (City/Country standards)

## ✅ Recently Completed (pre-merge summary)

### Item 7d: Fix Guide Button
**File:** `js/guide.js`
- Added missing `window.*` exports for guide functions: `buildGuideSteps`, `toggleGuideStep`, `markStepComplete`, `resetTutorialSeen`, `startTutorial`, `skipTutorial`, `nextTutorialStep`, `prevTutorialStep`
- Guide button now opens the interactive tutorial dialog

### Item 7e: DEFAULT_LEAVE_HOME on Empty
**File:** `js/data.js`
- Extended logic to apply defaults when saved array is empty (not just when localStorage key is missing)
- Users who delete all tasks will now get defaults back on reload

### Item 7f: Redesigned Packing Guides
**Files:** `js/tabs.js`, `js/packing.js`, `style.css`
- Replaced 3-column collapsibles grid with tab-style navigation
- Three pill buttons toggle guides: Pre-Departure, Sink Washing, Capsule Wardrobe
- Badge shows pending task count on Pre-Departure tab
- Guides hidden by default, panel appears below active tab
- Added proper close buttons and simplified guide content for readability
- Exposed packing functions to window scope for HTML handlers