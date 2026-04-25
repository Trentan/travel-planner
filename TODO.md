# TODO.md

All active work items for Travel Planner PWA.
Read this file at the start of every session. Update status blocks and checkboxes as work progresses.

---

## Completed

### ~~Item 1: Layout issue~~ ✅ COMPLETED
**Status:** Completed — branch `item-1b-sync-fixes` merged
**Completed:** 2026-04-25 — three-column layout + collapsible tab sync + button fix

- [x] a) Three-column layout: Tips, Food Quests, Suggested Activities
- [x] b) Collapsible action button bug fixed; tab synchronization working

---

## Active

### Item 2: Resolve Journey/Transport integration
**Status:** Completed — branch `item-2a` pushed for review
**Last completed:** `81150e4` — item-2a: Fix budget tab to use journeys array
**Next:** —

- [x] a) Transport used to work flawlessly in itinerary and display correctly in the Transport tab. Items have all transitioned to Journeys and are not being handled or displayed correctly — resolve.
- [ ] b) Journeys are in json backups/2026_June_July_Europe_Thailand.json - but not loading / viewing in itinerary or transport. Need to intersperse from itinerary or transport the journeys to pair with each other and display in tables / itinerary where possible. It is not displaying anything from json.

**Summary:** Budget tab was still calculating transport costs from obsolete `day.transportItems`. Fixed by using `journeys.filter()` matched against `day.date`, `day.from`, and `day.to`.

---

### Item 3: Convert Accommodation
**Status:** Not started
**Last completed:** —
**Next:** `item-3a`
**Spec:** `todo/accomodation-spec-conversion.md`

- [ ] a) Accommodation needs fixing — read and work through `todo/accomodation-spec-conversion.md` before starting

---

### Item 4: Database alignment (city grouping)
**Status:** Not started
**Last completed:** —
**Next:** `item-4a`

- [ ] a) Tips, suggested activities, food quests, accommodation, and transport should all be alignable to cities — add a `cities` field stored on each entity in the JSON, usable for filtering and future display in individual tabs outside itinerary mode
- [ ] b) Convert the current trip file `2026_June_July_Europe_Thailand.json` to handle this new structure
- [ ] c) City subheadings (currently above the main tabs) disappear on scroll — they should remain visible and interactive when scrolling, and appear below the main tab bar
- [ ] d) Add an "All" option (default) to the cities subheading filter
- [ ] e) When a city is selected in the subheading filter: show only that city's entries in the Accommodation and Transport tabs; jump to that city in the Itinerary view (already implemented)

---

### Item 5: Interactive How-To Guide
**Status:** Not started
**Last completed:** —
**Next:** `item-5a`

- [ ] a) The interactive guide on how to use the app is not working — fix and improve it to reflect the latest changes

---

## Noticed (unscheduled)

<!-- Claude: add any bugs or improvements spotted during work here. Do not fix them — flag only. -->

---

## Testing Checklist

Before considering any work complete:
- [ ] Open index.html in browser - app loads without errors
- [ ] Create/edit/delete items in all tabs
- [ ] Drag sights/runs from pool to day cards
- [ ] Toggle Fun Mode and Read Only Mode - UI updates correctly
- [ ] Toggle Compact View - layout switches, checkboxes work
- [ ] Export JSON - file downloads with correct data
- [ ] Import JSON - data loads and renders properly
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
