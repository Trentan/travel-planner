# TODO.md

All active work items for Travel Planner PWA.
Read this file at the start of every session. Claude Code: read from main branch before local copy.

---

## Active


---

### Item 9: Minor fixes for stable release
**Status:** Done ✅
**Next:** `item-9d`
- [x] a) The heading when entered (New Trip Plan) and Click here to add your trip subtitle - are not loading from json / saving correctly? ✅ **COMPLETE - PR #14 merged**
- [x] b) In the accommodation tab, if the stays have gaps for the nights and itinerary length, Add an autopopulate stays feature button action - scan itinerary and automatically create missing accommodation entries for each city based on nights stayed. This button should only appear when nights are missing in the accomodation tab compared to the itinerary. ✅ **COMPLETE - PR #16 merged**
- [x] c) areaName: "Walk-on Gear (Wear onto plane)" - this area is not appearing anymore in the packing tab? (it should always be displayed and with the default checklist for walk on gear) ✅ **COMPLETE - PR #17 merged**
- [ ] d) Need a way to enable the user to force a complete site refresh on mobile app / website on the app easily 
- [ ] e) Go through and convert the testing checklist into new items and sub items in this todo list + create actual smoke tests and tests for all the functionality
- [ ] f) Go through and convert the Future Enhancements checklist into new items and sub items in this todo list (some may already be resolved)
- [ ] g) Add a new notes tab - where you can add a generic checklist (eg get gifts for wife, don;t forget to take photo of x, important things to consider on your trip, unresolved items)
- [ ] h) Improve leaving home checklist, I have a notion checklist to merge/compare (ask for this if needed) - https://www.notion.so/trentan/afd1a6b4feb14fa38065515dbacbd676?v=d157c05db95048cbaffc6eb2645367a4&p=d4d390afce8b45fabdd8782b55fb3971&pm=s
- [ ] i) You cannot delete category blocks in packing - you should be able to - ALSO - should be able to RESTORE PACKING to DEFAULT (wiping all changes)
- [ ] i) The single dropdowns in the packing tab for the constant hints/guides are a bit clunky / could be better (eg only open one at a time) - they are in a row 1 with 3 column formation, but there might be a better design for this? (or potentially just make handy buttons in the packing tab and they just launch dialogs???)
- [ ] k) The cities submenu should list the cities in ORDER of the journey timeline (eg London should not be last, based on my current json, it should be before Bangkok)
- [ ] l) The cities submenu / cities should only apply to what is saved in the json, not in browser memory (eg on intial load london and paris load, this stays in subsequent trips / import json where those cities are not listed)
- [ ] m) Generate AI prompt button broken not working
---

### Item 10: Backup reminder and export improvements (REVISED - HYBRID APPROACH)
**Status:** Done ✅
**Next:** none
**Decision:** **Hybrid approach** - Stay in browser, improve UX. Reverted IndexedDB as it was over-engineering.

**What we're doing:**
- Keep simple localStorage (works perfectly)
- Make export/import super user-friendly with clear UI
- Add reminding system for backups
- Improve visual feedback
- **NOT building desktop app** (Electron/Tauri) - too much effort for value

**Completed work:**
- ✓ Added backup reminder system tracking exports
- ✓ Shows reminder after 7 days or 10 edits
- ✓ Enhanced export button with filename memory
- ✓ Visual export confirmation with filename
- ✓ Clean, user-friendly workflow

**Files changed:**
- `js/data.js` - Enhanced exportJSON with feedback
- `js/ui.js` - Added edit tracking hooks  
- `index.html` - Added export indicator UI

**User benefits:**
- Clear when data was last saved to file
- Gentle reminders to backup
- One-click export from reminder
- No confusion about browser vs file storage
## Noticed (unscheduled)

<!-- Claude: add bugs or improvements spotted during work here. Do not fix — flag only. -->

---

## Testing Checklist

Before considering any work complete:
- [ ] Open index.html in browser — app loads without errors
- [ ] Create/edit/delete items in all tabs
- [ ] Drag sights/runs from pool to day cards
- [ ] Toggle Fun Mode and Read Only Mode — UI updates correctly
- [ ] Toggle Compact View — layout switches, checkboxes work
- [ ] Export JSON — file downloads with correct data
- [ ] Import JSON — data loads and renders properly
- [ ] Budget calculations update when costs change
- [ ] Packing items check/uncheck and persist after refresh
- [ ] Service Worker registers (check browser DevTools)
- [ ] Print views render correctly (test both Summary and Detailed)

---

## Future Enhancements (Unscheduled)

- Dark mode toggle
- Search/filter functionality
- Undo/redo system
- Image upload for receipts
- Cloud sync (Firebase/Dropbox)
- Multi-user collaboration
- Trip sharing/export formats (PDF, Google Docs)
- Activity duration tracking
- Flight miles tracking
- Budget categories breakdown
- Change colors for cities
- Add multiple cities to a leg
- Add or subtract a day to an existing leg
