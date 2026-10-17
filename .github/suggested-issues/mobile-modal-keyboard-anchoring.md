---
title: "[Audit]: Mobile Viewport Soft-Keyboard & Modal Header Action Anchoring"
labels: ["jules-suggested", "triage", "mobile-ux"]
estimate: "M"
---

# [Audit]: Mobile Viewport Soft-Keyboard & Modal Header Action Anchoring

## Before
On mobile devices (390x844), opening the virtual soft keyboard takes ~280-320px of height. In `activity-modal.js` and `leg-dialog.js`, action buttons ("Save", "Cancel") or form submission controls are located at the bottom of the modal form or inside sticky footers. When the keyboard raises, it either completely obscures the action controls or triggers jittering visualViewport collisions. Furthermore, text inputs and notes textareas at the bottom of the modal get pushed out of sight or obscured behind the predictive bar.

## Evidence
- `js/activity-modal.js`: Activity modal actions reside at the bottom of the modal content container.
- `js/leg-dialog.js`: Form submit/cancel buttons live at the bottom of the transit leg form.
- `index.html`: Modals use fixed overlays without dynamic `--vvh` binding to `window.visualViewport`.

## Proposed
1. Implement standard top-anchored header controls for mobile modal sheets: `[ Cancel ]  Title  [ Save ]` at the top bar of the sheet so action buttons remain 100% visible and accessible regardless of keyboard state.
2. Bind a global `window.visualViewport.addEventListener('resize', ...)` handler that sets CSS custom property `--vvh: ${visualViewport.height}px` on `:root` and adapt modal containers to use `max-height: var(--vvh, 100dvh)`.
3. Improve input focus scroll behavior so focusing any input/textarea scrolls it safely into view with bottom padding above the keyboard.

## After
Mobile travelers can comfortably edit activities, notes, and transit legs on any 390x844 device without their keyboard hiding the Save button or obscuring active inputs.

## Estimate
- Effort estimate: M

## Files impacted
- `js/activity-modal.js`
- `js/leg-dialog.js`
- `index.html`
- `index.css`

## Acceptance criteria
- [ ] Save and Cancel buttons are easily accessible at the top of mobile modals/sheets.
- [ ] Modals adapt smoothly when virtual keyboard opens without obscuring active fields.
- [ ] Regression tests pass (`npm test`).

## Verification plan
- Automated tests: `npm test`
- Visual & interactive checks in Chrome DevTools mobile mode (390x844).
