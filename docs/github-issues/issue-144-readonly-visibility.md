# GitHub Issue: Improve Read-Only Mode Visibility & Ease of Use

**Title:** Improve Read-Only Mode Visibility and Toggle Ease-of-Use on Mobile and Web

## Before
Edit/read-only mode is toggled via "Lock" / "Unlock" controls that are located in the desktop top-right header and hidden inside the mobile drawer menu. When the app is in read-only mode, there is no prominent visual indicator on the tabs or content pane explaining *why* add/edit actions are hidden (leaving first-time users confused about missing buttons), nor is there an inline helper to unlock editing.

## Before screenshot
Not UI-specific

## Evidence
- `js/ui.js` hides `#editToggleBtn` on mobile (`body.mobile-app-mode #editToggleBtn { display: none !important; }`).
- The mobile edit toggle is located inside `mobileMenuSheet` which is opened via `☰` button on bottom-right of tab nav bar.
- Empty placeholders (e.g., "No stays found" or "No journeys planned yet") do not mention that the user is in Read-Only mode or explain how to unlock editing.

## Proposed
- Add a prominent, dismissible banner or status indicator when in read-only mode, with a quick-link button to "Unlock Editing".
- Update empty state placeholders (like "No stays found" or "No journeys planned yet") to explicitly display a helper note: "Unlock editing to add entries." if currently in read-only mode.
- Highlight the Lock/Unlock toggle inside the mobile actions menu or add a toggle shortcut somewhere on the main interface.

## Proposed screenshot / mockup
Not UI-specific

## After
Users on both web and mobile will immediately see a clear indicator when they are in read-only mode, along with an easy, prominent way to unlock editing, eliminating any confusion about hidden buttons.

## Estimate
`Medium (2-8 hrs)`

## Files impacted
- [MODIFY] [`index.html`](file:///c:/Apps/Projects/travel-planner/index.html)
- [MODIFY] [`js/ui.js`](file:///c:/Apps/Projects/travel-planner/js/ui.js)
- [MODIFY] [`js/transport.js`](file:///c:/Apps/Projects/travel-planner/js/transport.js)
- [MODIFY] [`js/tabs.js`](file:///c:/Apps/Projects/travel-planner/js/tabs.js)
- [MODIFY] [`src/tailwind.css`](file:///c:/Apps/Projects/travel-planner/src/tailwind.css)

## Tags
`priority: important`, `effort: medium`, `area: mobile`, `area: ux`, `enhancement`

## Acceptance criteria
1. Read-only banner/indicator is shown when `isEditMode === false`.
2. Empty state placeholders clearly instruct the user how to unlock edit mode.
3. A simple button to toggle edit mode is accessible from the main UI on mobile without diving into the menu drawer.

## Verification plan
- Load app on mobile viewport and verify read-only indicator is visible.
- Verify that unlocking edit mode hides the read-only banner and displays add buttons immediately.
