### Before
Currently, if a user opens a modal (like the Guide, Add Leg, or File Setup modal) and presses the Android hardware back button (or uses the edge-swipe back gesture), it may exit the app or navigate away from the page rather than simply dismissing the overlay, leading to a frustrating user experience.

### Before screenshot
Not UI-specific (behavioral issue).

### Evidence
Mobile app on Android devices via Capacitor.

### Proposed
Integrate `@capacitor/app` and listen for the hardware back button event (`App.addListener('backButton')`). When fired, check if any custom modals, bottom sheets, or overlays are currently open. If they are, intercept the back event and dismiss the topmost overlay. If no overlays are open, allow the default behavior (e.g., exiting the app or navigating back).

### Proposed screenshot / mockup
Not UI-specific (behavioral enhancement).

### After
Pressing the hardware back button will intuitively close open menus and modals, matching native Android app expectations.

### Estimate
Quick Win (<1 hr)

### Files impacted
- `js/ui.js` (or a dedicated mobile handler file)
- `package.json` (if `@capacitor/app` is not already installed)

### Tags
area: mobile, priority: important, polish, enhancement, effort: quick-win

### Acceptance criteria
- When a modal is open, pressing the hardware back button closes the modal but keeps the app open.
- When no modal is open, the back button behaves normally.

### Verification plan
- Build and run the app on an Android device or emulator.
- Open the Guide modal and press the physical/gesture back button; verify the modal closes.
