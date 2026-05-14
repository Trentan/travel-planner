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

### Item 15: Convert the testing checklist into structured TODO items and add an actual testing suite for actual smoke / unit tests to be used between changes for core functionality.
- [ ] 15a. Open `index.html` in a browser and confirm the app loads without errors.
- [ ] 15b. Create, edit, and delete items in all tabs.
- [ ] 15c. Drag sights/runs from the pool to day cards.
- [ ] 15d. Toggle Fun Mode and Read Only Mode; confirm the UI updates correctly.
- [ ] 15e. Toggle Compact View; confirm layout switches and checkboxes still work.
- [ ] 15f. Export JSON; confirm the file downloads with correct data.
- [ ] 15g. Import JSON; confirm data loads and renders properly.
- [ ] 15h. Change budget costs; confirm calculations update.
- [ ] 15i. Check and uncheck packing items; confirm state persists after refresh.
- [ ] 15j. Confirm the Service Worker registers in browser DevTools.
- [ ] 15k. Test print views for both Summary and Detailed modes.
- [ ] 15l. Run `node scripts/smoke-core.js` to cover date normalization, transport display dates, and AI prompt generation.

### Item 16: Convert the Future Enhancements checklist into structured backlog items, checking whether any are already resolved.
- [ ] 16a. Cloud file management and autosave or backup instead of keeping everything in browser memory. - Cloud sync, for example Firebase or Dropbox or Google Drive?
- [ ] 16b. Search/filter functionality.
- [ ] 16c. Undo/redo system.
- [ ] 16d. Trip sharing/export formats such as PDF or Google Docs.
- [ ] 16e. Change colors for cities.
- [ ] 16g. Add or subtract a day to an existing leg. (but maybe warn if conflict)
- [ ] 16h. Add a Notes tab with a generic checklist.
- [ ] 16i. Dark mode toggle.
- [ ] 16j. Activity time planning / schedule (when added to doing can set the time to start eg 9am and make sure no overlaps other activities) .
- [ ] 16k. Flight miles tracking / estimates (in budget)
- [ ] 16l. Budget category breakdown.
- [ ] 16m. Image upload for receipts.
- [ ] 16n. Multi-user collaboration.
- [ ] 16o. Ability to export trip, hide private data like booking references and share with other people to view
- [ ] 16p. The map / legs are kinda useless, the map is not that clear to see / realistic and can't really move through it - needs improvement
## Noticed

Add bugs or improvements spotted during work here. Do not fix unless they are part of the active task.

- [ ] None currently.

---
