### Before
The current file setup and persistence mechanism is complicated and opaque to new users. By default, the app loads a "Default Template", but it is not clear that users need to save this to a safe location (e.g., a cloud drive folder like iCloud or Google Drive) to ensure they don't lose their work or to sync across devices. Users might mistakenly edit the default template or rely solely on browser local storage, which can be cleared.

### Before screenshot
Not UI-specific (Flow/Conceptual issue).

### Evidence
When a user launches the app, they see the "Trip file: Default Template" badge. However, there's no proactive guidance on how the local-first architecture works, nor a clear prompt recommending them to "Save As..." to a persistent directory.

### Proposed
Design and implement a clearer file setup and onboarding UX. 
- Introduce a "First Save / File Setup" onboarding step or modal that explicitly explains the local-first file architecture.
- Strongly recommend saving the trip JSON to a cloud-synced folder (iCloud, OneDrive, Google Drive) for cross-device access and safety.
- Provide a clear "Start New Trip" vs "Open Existing Trip" choice early in the UX.
- Consider adding an explicit "Save As" button to the main UI or empty states to encourage proper file creation.

### Proposed screenshot / mockup
Not UI-specific

### After
Users will clearly understand where their data lives and how to keep it safe. The risk of data loss due to browser storage clearing or confusion over the default template will be significantly reduced.

### Estimate
Medium (2-8 hrs)

### Files impacted
- `index.html` (new onboarding modals/UX)
- `js/ui.js` (onboarding logic)
- `js/data.js` (file handling hooks)

### Tags
area: data, ux, effort: medium, polish, priority: important

### Acceptance criteria
- New users are guided on how to properly save their trip file.
- The distinction between the "Default Template" and a user's own file is clear.
- Guidance is provided on using cloud drives for sync.

### Verification plan
- Launch app as a new user (clear localStorage) and verify the onboarding flow.
- Ensure the flow encourages "Save As" and successfully transitions from the default template to a custom file.
