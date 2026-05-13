# UNFINISHED.md

## Awaiting Review / Merge
- **Branch:** `item-13a-13c-core-fixes`
- **Status:** ready for PR
- **What changed:** Completed item 13a, 13b, and 13c. Compact view now behaves correctly, dates are normalized to ISO handling across import/export and rendering, and Fun Mode / Force Refresh were removed in favor of Reset App handling the full reset path.
- **Verification:** User-tested and reported good, including the recent mobile theme tweaks.

- **Item:** Item 14: Mobile app shell polish
- **Branch:** `item-14-mobile-shell-polish`
- **Status:** ready for review
- **What changed:** Consolidated the mobile top-menu controls into the action sheet, added mobile-specific mode toggles, made compact mode hide the mobile header and tighten the phone layout, improved the mobile reset confirmation flow, kept the city filter sticky through the responsive shell offsets, left the "Before Leaving Home" packing guide collapsed by default, converted transport/accommodation into condensed tables with expandable detail rows on mobile, and hardened reset/import so they replace in-memory state instead of carrying old sample data forward.
- **Commits:** `3ce59c9` start handoff, `7ca4fb8` implementation, `2b6feb0` packing-state tweak, `3bcde03` condensed-table follow-on, follow-up reset/import fix pending.

## Active
- none
