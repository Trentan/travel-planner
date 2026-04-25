## Session State

- **Item/sub-task:** 6e
- **Branch:** item-6a
- **Last commit:** — (in progress)
- **What was done:** Fixed city filter state synchronization across modules. Made currentCityFilter a global variable in data.js and updated itinerary.js to sync with window.currentCityFilter. switchTab already passes cityFilter to buildTransportTab and buildAccomTab functions which already contain filtering logic.
- **Next step:** Test the implementation - click on Transport/Accommodation tabs, select different cities in the filter, verify only matching entries are shown
- **Files touched:** js/data.js (added global currentCityFilter), js/itinerary.js (updated buildCityNav and selectCityFilter to use window.currentCityFilter)
- **Known blockers / risks:** Need to test on actual data with journeys and accommodation entries
- **Noticed (unscheduled):** None
