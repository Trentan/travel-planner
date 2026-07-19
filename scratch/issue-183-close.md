## Completed: Issue #183 — Guide dialog polish & Welcome UX

### Before
- The Guide dialog (`#guide-modal`) was completely unstyled because the `.guide-step-card`, `.guide-step-header`, etc., classes injected by `js/guide.js` were missing from `src/tailwind.css`.
- New users who hadn't seen the tutorial simply saw a pulsing button on the Guide tab (if they happened to find it) rather than being actively offered a tour.

### After
- Implemented full CSS styling for the guide steps in `src/tailwind.css`:
  - Beautiful accordion-style cards with hover states
  - Proper padding, borders, and typography
  - Circular blue step badges
  - Dark mode support
  - Distinct styling for completed steps
- Improved First-Launch UX: 
  - Added a `#welcome-tutorial-modal` that actively prompts new users with "Would you like a quick interactive tour to show you how to use the app?"
  - Offers "Yes, show me around" (launches tutorial) or "No thanks" (dismisses and marks as seen)
  - Replaced the old pulsing-button logic with this modal trigger.

### Estimate
Original: Quick Win (<1 hr) — held (~20 mins).

### Files changed
- `index.html` — added `#welcome-tutorial-modal`
- `js/guide.js` — added logic for `acceptWelcomeTutorial()` and `dismissWelcomeTutorial()`, and updated `DOMContentLoaded` to show the modal instead of pulsing
- `src/tailwind.css` — added all missing `.guide-*` CSS rules
- `dist/tailwind.css` — rebuilt

### Labels
area: guide, effort: quick-win, polish, priority: polish, ux

### Verification
- 19/19 automated checks passing
- Branch: codex/183-guide-polish
