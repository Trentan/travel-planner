# Travel Planner TODO

Active work items for the Travel Planner PWA.

Read this file at the start of every session. When using Claude Code, read from the main branch before relying on the local copy.

---

## Active Work

### Item 13: Other improvements
- [x] 13a. Compact view is busted
- [x] 13b. All dates handling from json / to json need to be in yyyy-mm-dd format so they cannot be mixed up (and ensure items loading dates can handle that format)
- [x] 13c. Fun mode can be removed and force refresh can be removed (reset app should handle it)
- [x] 13d. Calculation in budget is wrong (has accommodation as $4816.4) and looks to have included a rogue trip leg 'return' flight in that total of $1700 (which anyway should be in the flight totals)
- [x] 13e. Fix the broken "Generate AI prompt" button.


### Item 14: Mobile app shell polish
- [x] 14a. Consolidate the top menu into a mobile action sheet.
- [x] 14b. Make compact view meaningfully reduce chrome on phones.
- [x] 14c. Keep the city filter sticky on mobile.
- [x] 14d. Improve the reset experience on mobile.
- [x] 14e. Remove the home / destination clocks from the mobile shell.
- [x] 14f. Unify transport and accommodation mobile table rendering, shared action buttons, and modal delete actions.
- [ ] 14g. Final mobile visual review for the table parity work.

### Item 16: File storage, sharing, and export
~~- [ ] 16a. Trip sharing/export formats such as PDF or Google Docs / Excel.~~ Abandoned
- [x] 16b. Export all content into an easily interpreted text itinerary for AI review or sharing, including a nice text-based / ASCII-art version.
- [x] 16c. Printing the itinerary needs BIG clean up (perhaps can be removed now the file share and text export options)
- [x] 16c. Maybe create a share button? - Export a filtered JSON file share file with private data hidden, so someone can load it into the site. Perhaps have a dialog with options ofwhat you want to hide (eg costs, pnr/booking numbers). You could either save it or have the option to email There should be a way to email some with a filtered json - saying "hey check out my cool itinerary, just launch the site and load my attached file" with a link to the github hosted site and the filtered json file (depending on how you want to filter it)
- [x] 16d. Ensure the AI Builder /  Generate AI prompt is now handling the new json formatting for EVERYTHING
- [x] 16e Share Export should have the ability to email people directly from the app, and it send a link to the app location (https://trentan.github.io/travel-planner/) with the json attached and check out my cool app / itinerary and load the attached file from your friend etc.

### Item 17: Trip editing and planning workflow
- [x] 17a. Search/filter functionality.
  - Resolved: generic search is probably not required right now; the existing city filters and quick actions cover most of the workflow.
- [x] 17b. Change the cost or duration of an activity in the itinerary tab.
  - Resolved: use an edit dialog from the itinerary item instead of cramped inline fields.
- [x] 17c. Add or subtract a day to an existing leg, with a warning if it causes conflicts.
  - Resolution: any leg should be able to add or subtract days from itself.
  - Conflict handling: warn and confirm if proceeding would overwrite the current leg; the user can adjust it or abort.
- [x] 17d. Undo/redo system.
  - Resolution: should cover anything in case of accidental changes, not just itinerary edits.
- [ ] 17e. Add a Notes tab with a generic checklist.
  - Resolution: make it similar to Packing, but still editable to personal needs.
- [ ] 17f. Activity time planning / schedule, so added items can start at a chosen time and avoid overlaps.
  - Resolution: suggested scheduling only, with warnings rather than hard overlap blocking.

### Item 18: Presentation, maps, and trip analytics
- [ ] 18a. Change colors for cities.
- [ ] 18b. Dark mode toggle.
- [ ] 18c. Flight miles tracking / estimates in the budget.
- [ ] 18d. Budget category breakdown.
- [ ] 18e. Image upload for receipts.
- [ ] 18f. Improve the map icon and the map view so it is clearer and more usable.

## Noticed

Add bugs or improvements spotted during work here. Do not fix unless they are part of the active task.

- [ ] None currently.


## Future
- [ ] If a proper hosted app - -Multi-user collaboration potential? + file backups etc
---

