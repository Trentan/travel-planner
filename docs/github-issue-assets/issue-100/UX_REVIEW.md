# Issue 100 UX Review: Chronological Day Planning

## Research basis

- Apple Human Interface Guidelines: [Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets) support focused, temporary task flows and progressive disclosure on iPhone-sized screens.
- Material Design: [Bottom sheets](https://m1.material.io/components/bottom-sheets.html) are appropriate for contextual mobile actions without sending users to a separate page.
- Material Design: [Lists](https://m1.material.io/components/lists.html) emphasize compact scannable rows with primary text first and secondary controls kept subordinate.
- Material Design: [Lists with controls](https://m1.material.io/components/lists-controls.html) supports placing controls alongside list rows, but the primary row content should remain readable.
- Travel-planning product pattern reference: [Koder.ai travel itinerary UX overview](https://koder.ai/blog/build-mobile-app-travel-planning-itineraries) describes the day view as the heart of a travel planner, combining timeline, duration, and travel time.

## Design decision

The day planner now uses two complementary views:

- **Timeline** answers "What order does this day happen in?"
- **Grouped** answers "What are my transport, stay, and activity buckets?"

This avoids forcing all use cases into one overloaded mobile card. The timeline is best for sequencing and suggested scheduling; grouped mode is best for quick checklist-style review.

## Scheduling model

Activity assignment has three schedule choices:

- **Anytime**: leaves `startTime` and `endTime` blank, so the activity appears in the Anytime section.
- **Suggested**: computes the best day-specific open slot.
- **Fixed time**: uses the user's explicit start/end inputs only.

Suggested scheduling is deterministic rather than opaque. It considers:

- Existing scheduled activity intervals.
- Transport departure and arrival times for the day.
- Stay check-in/check-out times.
- Activity duration parsed from labels such as `45 min`, `1 hr`, `1 hr 30 min`, and `2 hr`.
- A 15-minute buffer around busy intervals.
- Broad day bounds of `08:00-22:00`.
- Simple food/time-of-day preferences, such as breakfast/coffee in the morning and dinner/night activities in the evening.

If no clean slot exists, the dialog says so and keeps the user in control with Anytime or Fixed time.

## Mode review

### DDE: Desktop / Detailed

Screenshot: [after-suggested-DDE.png](after-suggested-DDE.png)

Why it works:

- The full-width timeline has enough room for labels, time pills, type markers, and inline controls.
- Scheduled rows remain readable because controls sit below or beside the main title/meta rather than replacing it.
- The suggested item lands between existing commitments, proving the computed slot is visible in the same place the user will manage it.
- The Timeline / Grouped selector now uses a high-contrast active state in the itinerary header, so the user can understand and change the mode before opening an individual day.
- The Timeline / Grouped control is now global at the itinerary header rather than repeated inside every day, preserving vertical space and making the chosen planning mode consistent across the whole itinerary.

Usability notes:

- Use Timeline for sequencing.
- Use Grouped when reviewing bookings and activity buckets.
- Use inline Scheduled/Anytime controls for quick corrections.
- Schedule edits now preserve the open day and selected Timeline/Grouped view instead of resetting the planner context.
- The redundant `Day Timeline` header/copy has been removed so the card starts with the actual schedule, reducing dead space above the first row.

### DCO: Desktop / Compact

Screenshot: [after-suggested-DCO.png](after-suggested-DCO.png)

Why it works:

- The same information density is preserved, but chrome is reduced.
- Timeline rows still show the scheduled order and editable times without requiring a modal.
- Grouped Plan remains visible below the timeline for checklist review.

Usability notes:

- Best for power users who want dense planning while still seeing the chronological shape.
- The compact view keeps enough spacing to avoid turning the timeline into a spreadsheet.

### MDE: Mobile / Detailed

Screenshot: [after-suggested-MDE.png](after-suggested-MDE.png)

Why it works:

- The vertical timeline uses the phone's natural scroll direction.
- Time, marker, and content stay in separate columns, so schedule scanning is still possible.
- Editing controls are available, but the row still leads with the activity title and time.
- Long time ranges reserve a wider column and can wrap inside the time pill, avoiding overlap with the marker and activity card.
- The Scheduled heading is explicit above timed rows, so the switch from scheduled items to Anytime items is visible without relying on spacing alone.
- The time column is wider and the center marker/line column is clearer, keeping long time ranges readable while preserving the description column.
- Activity rows now show a single Anytime/Scheduled action instead of inline radio buttons and time inputs, keeping the timeline readable and moving heavier editing into a focused dialog.

Usability notes:

- Detailed mobile is the best mode for reviewing and lightly editing a day's flow.
- The assignment dialog stacks schedule choices vertically to preserve tap target size and readability.

### MCO: Mobile / Compact

Screenshot: [after-suggested-MCO.png](after-suggested-MCO.png)

Why it works:

- Compact mobile prioritizes the timeline sequence and hides broader page noise.
- The same suggested-time result is visible without introducing a separate mobile-only data model.
- Grouped mode remains available for simple transport/stay/activity review.
- Wrapped time pills preserve legibility for ranges such as `09:45-11:45` without shrinking the activity title column too aggressively.

Usability notes:

- Best for on-trip usage where the traveler needs "what is next?" more than full editing.
- Heavy edits should continue to flow through the assignment dialog rather than adding more inline controls.

## Assignment dialog review

Desktop screenshot: [after-assign-suggested.png](after-assign-suggested.png)  
Mobile screenshot: [after-assign-suggested-mobile.png](after-assign-suggested-mobile.png)

Why it works:

- The user chooses scheduling intent before choosing a day.
- Each day row explains the suggestion, e.g. `Suggested 09:45-11:45 · Fits between Breakfast booking and Lunch hold`.
- Mobile keeps the three choices stacked rather than compressing them into small controls.
- Fixed time no longer falls back to Suggested if the fixed inputs are blank.

## Interaction polish

Screenshots: [after-schedule-preserve-DDE.png](after-schedule-preserve-DDE.png), [after-schedule-preserve-DCO.png](after-schedule-preserve-DCO.png), [after-schedule-preserve-MDE.png](after-schedule-preserve-MDE.png), [after-schedule-preserve-MCO.png](after-schedule-preserve-MCO.png)

Polish screenshots: [after-timeline-polish-DDE.png](after-timeline-polish-DDE.png), [after-timeline-polish-DCO.png](after-timeline-polish-DCO.png), [after-timeline-polish-MDE.png](after-timeline-polish-MDE.png), [after-timeline-polish-MCO.png](after-timeline-polish-MCO.png)

Global view screenshots: [after-global-view-toggle-DDE.png](after-global-view-toggle-DDE.png), [after-global-view-toggle-DCO.png](after-global-view-toggle-DCO.png), [after-global-view-toggle-MDE.png](after-global-view-toggle-MDE.png), [after-global-view-toggle-MCO.png](after-global-view-toggle-MCO.png)

Schedule dialog screenshots: [after-schedule-dialog-DDE.png](after-schedule-dialog-DDE.png), [after-schedule-dialog-DCO.png](after-schedule-dialog-DCO.png), [after-schedule-dialog-MDE.png](after-schedule-dialog-MDE.png), [after-schedule-dialog-MCO.png](after-schedule-dialog-MCO.png), [after-schedule-dialog-dialog-DDE.png](after-schedule-dialog-dialog-DDE.png), [after-schedule-dialog-dialog-MDE.png](after-schedule-dialog-dialog-MDE.png)

Why it works:

- Schedule mode and time edits rebuild the itinerary while preserving the open day card.
- The selected Timeline or Grouped view is restored after the rebuild.
- When a visible timeline row moves between Scheduled and Anytime, the row is centered and briefly highlighted so the user can see where it landed.
- Compact and mobile captures confirm the Scheduled section label does not add overlap or crowd the time column.
- Inline activity delete, completion, cost, text, time, Scheduled, and Anytime edits use the preserve-state rebuild path where they affect itinerary layout, so interactions inside an open day do not collapse the day or change the selected view.
- The global Timeline / Grouped preference is persisted with UI settings and is shared by detailed, compact, desktop, and mobile itinerary renderers.
- Activity scheduling stores only the necessary structured fields: `startTime` and `endTime` when scheduled, blank values for Anytime, and the containing day remains the date source in the exported JSON.

## Verification

- `npm.cmd test`
- `tests/suggested-scheduling-regression.js`
- Playwright screenshots captured for DDE, DCO, MDE, MCO.
- Playwright screenshot captured for desktop and mobile assignment dialog.
- Playwright screenshots captured for schedule preserve/heading checks across DDE, DCO, MDE, MCO.
- Playwright screenshots captured for timeline polish checks across DDE, DCO, MDE, MCO.
- Playwright screenshots captured for global Timeline / Grouped control across DDE, DCO, MDE, MCO.
- Playwright screenshots captured for simplified activity row scheduling and the schedule dialog.

## Remaining UX recommendation

The current implementation is reviewable for #100. The next dedicated UX issue should move mobile timeline editing into a bottom-sheet style detail editor so mobile day cards can become more read-focused while preserving editing power.
