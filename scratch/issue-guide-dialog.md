### Before
The Guide dialog (`#guide-modal`) looks messy because the dynamic step classes injected by `js/guide.js` (like `.guide-step-card`, `.guide-step-header`, `.guide-step-title`) have no corresponding CSS definitions in `src/tailwind.css`. The content is unstyled and hard to read.

### Before screenshot
Not UI-specific (missing styles cause raw layout).

### Evidence
Desktop and mobile viewport. The Guide dialog is accessed from the top menu or hamburger menu.
`js/guide.js` builds elements with `guide-step-card` but `src/tailwind.css` does not define it.

### Proposed
Implement missing CSS classes in `src/tailwind.css` for the guide steps to create a clean, modern accordion-style or list-style layout. 
- Style the step numbers as badges
- Improve spacing and typography for titles and descriptions
- Style the "Start Interactive Tutorial" buttons properly
- Ensure dark mode support for these new styles

### Proposed screenshot / mockup
Not UI-specific (Standard polished UI layout).

### After
The guide dialog will be visually appealing, organized, and easy to read, with clear step delineation.

### Estimate
Quick Win (<1 hr)

### Files impacted
- `src/tailwind.css`

### Tags
area: guide, effort: quick-win, polish, priority: polish, ux

### Acceptance criteria
- `.guide-step-card` and related classes are styled
- Guide dialog is readable and polished in both light and dark modes
- Interactive elements (toggle open/close) look clickable

### Verification plan
- Open guide dialog on desktop and mobile
- Toggle between light and dark modes
- Verify layout matches standard app aesthetics
