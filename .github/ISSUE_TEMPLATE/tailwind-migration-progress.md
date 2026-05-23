# Tailwind CSS v4 Migration Progress

## Current Status (Updated: 2026-05-23)

**Phase**: 2 Complete - Viewport-Driven Modes

**Next Phase**: Phase 3 - Component-by-Component Tailwind Migration

### What's Done

- [x] Tailwind v4 CLI configured in `package.json`
- [x] `src/tailwind.css` using v4 syntax (`@import "tailwindcss"`)
- [x] Design tokens added via `@theme` directive (colors, fonts, spacing, shadows)
- [x] Dark mode variant configured (`@custom-variant dark`)
- [x] Build succeeds: `npm run build:css` produces `dist/tailwind.css` (9KB minified)
- [x] Both stylesheets linked in `index.html` (style.css + tailwind.css)

### Phase 2 - Viewport-Driven Modes: COMPLETE

- [x] Removed compact/detailed toggle switch from desktop and mobile menus
- [x] Deprecated `toggleCompactView()` - now a no-op with console warning
- [x] Compact view automatically determined by viewport width (< 769px = compact)
- [x] Removed `isCompactView` from localStorage persistence
- [x] `syncResponsiveUi()` computes compact mode on-the-fly from viewport
- [x] Commit: `c5a890e`

### Next Steps: Phase 3 - Component Migration Batches

Planned batches (complete in order):

| Batch | Components | Est. Time | Priority |
|-------|------------|-----------|----------|
| A | Buttons, Forms, Modals, Section Headers | ~3.5 hours | Start here |
| B | Menu Bar, Header, City Nav, Tabs, Mobile Menu | ~9.5 hours | After Batch A |
| C | Itinerary, Timeline, Transport, Accommodation, Budget, Packing, Map | ~23.5 hours | After Batch B |
| D | Dark Mode Cleanup | ~1.5 hours | After Batch C |

### Session Notes

- Working on GitHub Issue #123
- "Open Questions" from plan need review:
  1. Delete `tailwind.config.js` and `postcss.config.js` in v4 since config is in CSS?
  2. Should we update GitHub Issue #123 description to reflect the Tailwind pivot?
  3. Print styles (~40 lines in style.css) - preserve or drop in migration?