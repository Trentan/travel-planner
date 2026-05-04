# TODO.md

All active work items for Travel Planner PWA.
Read this file at the start of every session. Claude Code: read from main branch before local copy.

---

## Active

### Item 5: Convert Accommodation
**Status:** Complete - awaiting merge
**Next:** `none`
**Note:** No migration of old accomItems — new stays model only going forward.

- [x] a) Data model: add top-level `stays []` global in `data.js`
- [x] b) Add Stay dialog: build modal, `openAddStayModal()`, `saveStayFromModal()`, `deleteStay()`, `toggleStayStatus()`
- [x] c) Accommodation tab: rewrite `buildAccomTab()` to render from `stays[]`
- [x] d) Itinerary day card: replace `accomItems` block with derived stay display
- [x] e) Add accommodation button to launch add dialog
- [x] f) Edit stays from itinerary and table — launch dialog and save
- [x] g) Move add stay button to top with heading, like transport page
- [x] h) Convert old accommodation in `backups/2026_June_July_Europe_Thailand.json` to new stays format

---

### Item 8: Improve Country and City Standards
**Status:** 8a complete (merged), 8b merged — viii pending refinements
**Next:** `item-8a-viii-ix`

- [x] a) Improve journey table layout to display fields better
  - [x] i) Make Status like the one in Accommodation table where the booking id (reference) is nicely under the pending / confirmed - nice touch
  - [x] ii) Reference field needs to be in the add/edit dialog for journey
  - [x] iii) Departs should have the date and time combined like arrives
  - [x] iv) Make sure instead of 'to' it is an '→' arrow
  - [x] v) You can calculate total travel time and display under the journey description in a smaller italic font (eg 11hrs)
  - [x] vi) Edit journey dialog: segments clickable, journey title shows
  - [x] vii) In Manage cities for countries - can enter/create custom countries when "other" selected
  - [ ] viii) Transport table refinement: Remove duplicate date column (keep departs only)
  - [ ] ix) Transport table refinement: Expanded leg rows show "Leg X: City A → City B"
  - [ ] x) Transport table refinement: Standardize fonts across transport table
- [x] b) New city dialog: country dropdowns, ISO/ICAO standards, built-in list with user-extensible JSON. Cities stored as `{code, name, countryCode}` eg `BNE, Brisbane, AU`
  - [x] i) Add trip leg dialog not showing - loads new leg straight into itinerary instead of opening dialog
  - [x] ii) City selection dropdowns should populate to their pre-selected countries by default (currently not populating)
  - [x] iii) Select Existing City: populate dropdown with user-entered/created cities from itinerary (currently empty)
  - [x] iv) Create New City: country should be dropdown select (with "enter your own" option), and should default to selected city's country when editing
  - [x] v) do all the cities in my json need converting now to new standards(iso/icao/iata)
  - [x] vi) here is no real display benefits yet - implement (eg perhaps the transport tab should have the iso codes displayed for from and to (and a hover text of the full city name and country) + all the drop downs etc could have the city or country code additionally in brackets
  - [x] vii) Make a way to check IATA for the country name when other is selected in cities and allocate that to the city when fetched (eg Bratislava should be Solvakia) - this will also resolve it so in all the other displays the city info is fixed (because Bratislava for me is currently busted / no hover text, no 3 char etc)

---

### Item 9: Trip plan name not saving & packing tab fix & other minor fixes
**Status:** Not started
**Next:** `item-9a`
- [ ] a) The heading when entered (New Trip Plan) and Click here to add your trip subtitle - are not loading from json / saving correctly?
- [ ] b) areaName: "Walk-on Gear (Wear onto plane)" - this area is not appearing anymore in the packing tab?
- [ ] e) Need a way to enable the user to force a complete site refresh on mobile app / website on the app
- [ ] f) Go through and convert the testing checklist into new items and sub items in this todo list
- [ ] g) Go through and convert the Future Enhancements checklist into new items and sub items in this todo list (some may already be resolved)
- [ ] h) Add a new notes tab - where you can add a generic checklist (eg get gifts for wife, don;t forget to take photo of x, important things to consider on your trip, unresolved items)
- [ ] i) Improve leaving home checklist, I have a notion checklist to merge/compare - https://www.notion.so/trentan/afd1a6b4feb14fa38065515dbacbd676?v=d157c05db95048cbaffc6eb2645367a4&p=d4d390afce8b45fabdd8782b55fb3971&pm=s

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
