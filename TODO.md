# TODO.md

All active work items for Travel Planner PWA.
Read this file at the start of every session. Claude Code: read from main branch before local copy.

---

## Active


---

### Item 9: Minor fixes for stable release
**Status:** In progress
**Next:** `item-9b`
- [x] a) The heading when entered (New Trip Plan) and Click here to add your trip subtitle - are not loading from json / saving correctly?
- [ ] b) areaName: "Walk-on Gear (Wear onto plane)" - this area is not appearing anymore in the packing tab? (it should always be displayed and with the default checklist for walk on gear)
- [ ] e) Need a way to enable the user to force a complete site refresh on mobile app / website on the app easily 
- [ ] f) Go through and convert the testing checklist into new items and sub items in this todo list
- [ ] g) Go through and convert the Future Enhancements checklist into new items and sub items in this todo list (some may already be resolved)
- [ ] h) Add a new notes tab - where you can add a generic checklist (eg get gifts for wife, don;t forget to take photo of x, important things to consider on your trip, unresolved items)
- [ ] i) Improve leaving home checklist, I have a notion checklist to merge/compare - https://www.notion.so/trentan/afd1a6b4feb14fa38065515dbacbd676?v=d157c05db95048cbaffc6eb2645367a4&p=d4d390afce8b45fabdd8782b55fb3971&pm=s
- [ ] j) You cannot delete category blocks in packing - you should be able to
- [ ] k) The single dropdowns in the packing tab for the constant hints/guides are a bit clunky / could be better (eg only open one at a time) - they are in a row 1 with 3 column formation, but there might be a better design for this? (or potentially just make handy buttons in the packing tab and they just launch dialogs???)
- [ ] l) The cities submenu should list the cities in ORDER of the journey timeline (eg London should not be last, based on my current json, it should be before Bangkok)
---

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
