### Before
The app relies solely on visual feedback when performing important actions (such as marking a day complete, dragging and dropping items, or finishing a checklist). On mobile, this can feel slightly disconnected compared to native apps which use subtle physical feedback.

### Before screenshot
Not UI-specific (Haptic feedback).

### Evidence
Mobile app on Android/iOS via Capacitor. Currently, no vibration or haptics are triggered.

### Proposed
Integrate `@capacitor/haptics` to provide subtle, native-feeling vibration feedback on key interactions. 
- Trigger a light haptic impact when dragging and dropping items in the itinerary.
- Trigger a success haptic impact when marking a day or checklist item as completed.
- Trigger a warning haptic impact if a destructive action (like deleting a leg) is initiated.

### Proposed screenshot / mockup
Not UI-specific.

### After
The app will feel much more responsive, premium, and native to the device.

### Estimate
Medium (2-8 hrs)

### Files impacted
- `package.json` (adding `@capacitor/haptics`)
- `js/ui.js` / `js/data.js` (wiring up haptic triggers to UI events)

### Tags
area: mobile, priority: polish, ux, enhancement, effort: medium

### Acceptance criteria
- Native haptics are triggered on key actions (drag-and-drop, completions) on mobile devices.
- Does not crash or throw errors on desktop web browsers (graceful fallback).

### Verification plan
- Build and deploy to an Android/iOS device.
- Perform the wired actions and verify the physical vibration occurs.
- Verify desktop browser functionality remains unaffected.
