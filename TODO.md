# Travel Planner TODO

Active work items for the Travel Planner PWA.

Read this file at the start of every session. When using Claude Code, read from the main branch before relying on the local copy.

---

## Active Work

### Item 9: Stable Release Polish

**Status:** In progress  
**Next:** 9d

- [x] 9a. Fix trip title and subtitle persistence.
  - Complete: PR #14 merged.
- [x] 9b. Add accommodation auto-populate for missing nights.
  - Complete: PR #16 merged.
- [x] 9c. Restore "Walk-on Gear (Wear onto plane)" packing area.
  - Complete: PR #17 merged.
- [x] 9d. Add an easy way for users to force a complete site refresh on mobile app and website.

### Item 13: Other improvements
- [ ] 13a. Compact view is busted
- [ ] 13b. All dates handling from json / to json need to be in yyyy-mm-dd format so they cannot be mixed up (and ensure items loading dates can handle that format)
- [ ] 13c. Fun mode can be removed and force refresh can be removed (reset app should handle it)
- [ ] 13d. For the guides in packing - These could be contained in a Helpful hints style dropdown (and then each clicked to load) so it takes up less screen space : Before Leaving Home, Hotel Sink Washing, Capsule Wardrobe Prompt - and close guide. 
- [ ] 13e. Fix the broken "Generate AI prompt" button.
- [ ] 13f. Convert the testing checklist into structured TODO items and add actual smoke tests for core functionality.
- [ ] 13g. Convert the Future Enhancements checklist into structured backlog items, checking whether any are already resolved.


## Noticed

Add bugs or improvements spotted during work here. Do not fix unless they are part of the active task.

- [ ] None currently.

---

## Verification Checklist

Run before considering implementation work complete:

- [ ] Open `index.html` in a browser and confirm the app loads without errors.
- [ ] Create, edit, and delete items in all tabs.
- [ ] Drag sights/runs from the pool to day cards.
- [ ] Toggle Fun Mode and Read Only Mode; confirm the UI updates correctly.
- [ ] Toggle Compact View; confirm layout switches and checkboxes still work.
- [ ] Export JSON; confirm the file downloads with correct data.
- [ ] Import JSON; confirm data loads and renders properly.
- [ ] Change budget costs; confirm calculations update.
- [ ] Check and uncheck packing items; confirm state persists after refresh.
- [ ] Confirm the Service Worker registers in browser DevTools.
- [ ] Test print views for both Summary and Detailed modes.

---

## Backlog

### UX and App Features

- [ ] Dark mode toggle.
- [ ] Search/filter functionality.
- [ ] Undo/redo system.
- [ ] Trip sharing/export formats such as PDF or Google Docs.
- [ ] Change colors for cities.
- [ ] Add multiple cities to a leg.
- [ ] Add or subtract a day to an existing leg.
- [ ] Add a Notes tab with a generic checklist
  - Example uses: gifts, photo reminders, important trip considerations, unresolved items.
- [ ] IS there a better way for file management/link to a cloud file and autosave / backup to that instead of keeping in browser memory and exporting the json?


### Travel Data

- [ ] Activity duration tracking.
- [ ] Flight miles tracking.
- [ ] Budget category breakdown.
- [ ] Image upload for receipts.

### Sync and Collaboration

- [ ] Cloud sync, for example Firebase or Dropbox.
- [ ] Multi-user collaboration.
