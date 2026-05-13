# UNFINISHED.md

## Awaiting Review / Merge
- **Branch:** `item-13a-13c-core-fixes`
- **Status:** ready for PR
- **What changed:** Completed item 13a, 13b, and 13c. Compact view now behaves correctly, dates are normalized to ISO handling across import/export and rendering, and Fun Mode / Force Refresh were removed in favor of Reset App handling the full reset path.
- **Verification:** User-tested and reported good, including the recent mobile theme tweaks.

## Active
- **Item:** Item 14: Mobile app shell polish
- **Branch:** `item-14-mobile-shell-polish`
- **Status:** started
- **Sub-task breakdown:**
  - 14a. Consolidate the top menu into a mobile action sheet.
  - 14b. Make compact view meaningfully reduce chrome on phones.
  - 14c. Keep the city filter sticky on mobile.
  - 14d. Improve the reset experience on mobile.
  - 14e. Remove the home / destination clocks from the mobile shell.
- **Expected files to touch:** `index.html`, `style.css`, `js/ui.js`, possibly `js/itinerary.js` and `js/data.js` if the sticky/filter/reset behavior needs deeper hooks.
- **Estimated commits:** 2-3
- **Next step:** Implement the mobile action sheet and then tighten the mobile compact-view, sticky filter, reset, and clock behavior.
