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

### Item 12: Packing improvements
- [ ] 12a. Improve the default Before Leaving Home checklist by merging/comparing the user's checklist below.
  - [ ]  Empty fridge and pantry perishables
  - [ ]  Turn power off everywhere not needed
  - [ ]  Check all lights and fans off
  - [ ]  Check CCTV on
  - [ ]  Empty coffee and compost bins and leave outside
  - [ ]  Close and check all windows
  - [ ]  Blinds partial down
  - [ ]  Empty Bins
  - [ ]  Water Off (including outdoor taps)
  - [ ]  Dog door panel / lock
  - [ ]  Automatic Fish feeder
  - [ ]  Security System On
  - [ ]  If Taking Dog
    - [ ]  Waste bags
      - [ ]  Water Bowl
      - [ ]  Food
      - [ ]  Toys
      - [ ]  Leash
      - [ ]  Treats
- [ ] 12b. Allow deleting sub category blocks in Packing.
- [ ] 12c. Add "Restore Packing to Default" to wipe ALL packing changes and reload defaults.
- [ ] 12d. Improve the packing hints/guides UI.
  - Current issue: single dropdowns are clunky in the 3-column row.
  - Possible approach: only one open at a time, or replace with buttons that launch dialogs.


### Item 13: Other improvements
- [ ] 13a. Fix the broken "Generate AI prompt" button.
- [ ] 13b. Convert the testing checklist into structured TODO items and add actual smoke tests for core functionality.
- [ ] 13c. Convert the Future Enhancements checklist into structured backlog items, checking whether any are already resolved.


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
