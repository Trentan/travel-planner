# UNFINISHED.md

## Active
none

## Awaiting Review / Merge
- **Item:** 12a, 12b, 12c, 12d — branch `item-12-packing-improvements` — commit `dd2d6b5`
  - Reworked the default Before Leaving Home checklist into grouped sections and merged legacy saved/imported items into the new defaults.
  - Allowed packing category blocks to be deleted fully instead of recreating a placeholder block.
  - Expanded "Restore Packing to Default" so it resets packing lists and the Before Leaving Home checklist together.
  - Replaced the old 3-column packing guide experience with a single-open guide shell and cleaner leave-home layout.
  - Follow-up refinement applied: removed the packing guide summary banner and removed explicit close-guide buttons so the guide pills are the only show/hide control.
  - Follow-up refinement applied: removed the empty-state guide panel so no placeholder shows when all guide pills are collapsed.
  - Verification run: `node --check js/utils.js`, `node --check js/packing.js`
  - Pending: browser smoke test and user review
- **Item:** 9e — branch `item-9e-import-transit-cities` — PR needs to be created
  - Import now extracts cities from leg labels (e.g., Verona when not in day.from/to)
  - Transit cities marked with `isTransit` flag and styled differently in city nav
  - Transit cities appear in separate "✈ Transit" section with dashed borders
  - Fixed: Taiwan added to COUNTRY_DATA so Taipei shows country correctly
