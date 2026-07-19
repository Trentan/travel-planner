## Completed: Issue #184 — File setup and persistence onboarding UX

### Before
- The app silently loaded a "Default Template" and saved to `localStorage` without explaining that data could be lost if browser caches are cleared.
- New users were not prompted to save their file to a safe location (e.g., iCloud/Google Drive).

### After
- Added a `#file-setup-modal` on first launch that actively explains the local-first architecture.
- Recommends saving to a cloud drive.
- Provides clear actions:
  - **Create New Trip (Save As...)**: Immediately prompts for a file save location and boots a fresh, blank itinerary.
  - **Open Existing Trip**: Prompts to load an existing JSON file.
  - **Try it out first**: Dismisses the modal and lets the user explore the default template ephemerally.
- These flows are excluded during automated UI tests via `navigator.webdriver`.

### Estimate
Original: Medium (2-8 hrs) — completed much faster.

### Files changed
- `index.html` — added `#file-setup-modal`
- `js/data.js` — added logic for `onboardCreateNewTrip`, `onboardOpenExistingTrip`, `startBlankTrip`, and DOMContentLoaded trigger.

### Labels
area: data, area: docs, effort: medium, polish, priority: important, ux

### Verification
- 19/19 UI tests passing (including modal exclusions)
- Branch: codex/184-file-setup-onboarding
