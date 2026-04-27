## Session State

- **Item/sub-task:** 5b
- **Branch:** item-5b
- **Last commit:** `Item 5b [1 of 1]: Add Stay modal HTML + CRUD functions + wire itinerary button`
- **What was done:** Replaced old stay-modal with comprehensive Add Stay modal in index.html (fields: city dropdown, property name, check-in/out dates, auto-calc nights, status, provider, booking ref, total cost, notes). Added new CRUD functions in js/crud.js: openAddStayModal(), closeAddStayModal(), saveStayFromModal(), deleteStay(), toggleStayStatus(), updateStayField(). Wired itinerary.js "Add Accom" button to call openAddStayModal().
- **Next step:** Test the implementation - verify modal opens, validates fields, saves to stays[], re-renders correctly. Then commit and update TODO.md to mark 5b complete.
- **Files touched:** `index.html`, `js/crud.js`, `js/itinerary.js`
- **Known blockers / risks:** None - ready for testing
- **Noticed (unscheduled):** 
