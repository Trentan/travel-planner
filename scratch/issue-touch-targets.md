### Before
Some interactive elements (like the small action buttons in day cards, the edit icons, or modal close buttons) might have touch targets smaller than the recommended 44x44px. This can lead to "fat finger" mis-clicks on smaller mobile screens, frustrating users who might accidentally delete an item or close a menu unintentionally.

### Before screenshot
Not UI-specific (Accessibility/sizing issue).

### Evidence
Mobile viewports (`MDE`, `MCO`). CSS padding on `.action-btn` and `.icon-btn` may not enforce minimum hit areas.

### Proposed
Perform a comprehensive audit of all interactive elements on the itinerary view, map view, and modals. Ensure that all buttons, icons, and toggles have a minimum tap area of 44x44px, either by increasing visual padding or by using transparent borders/padding to extend the hit area without changing the visual design significantly.

### Proposed screenshot / mockup
Not UI-specific

### After
Users can easily tap buttons on mobile devices without precise aiming or accidental mis-clicks, resulting in a fluid and accessible experience.

### Estimate
Quick Win (<1 hr)

### Files impacted
- `src/tailwind.css`
- `js/ui.js` (inline templates)

### Tags
area: mobile, priority: polish, ux, effort: quick-win

### Acceptance criteria
- All primary interactive elements have a 44x44px minimum hit area.
- Visual layout is not broken by the increased hit areas.

### Verification plan
- Run the app on a mobile device or emulator.
- Attempt to tap closely spaced buttons (e.g., inside day cards) and verify they are easily selectable.
