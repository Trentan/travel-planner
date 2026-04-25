## Session State

- **Item/sub-task:** 6l
- **Branch:** item-6a
- **Last commit:** `Item 6l: Add leg type selector (Start/City/Return) to Add New Leg dialog`
- **What was done:** Added leg type dropdown Start/City/Return, updated dialog UI labels based on leg type, modified createNewLeg to handle different leg types with appropriate day structure (Start: Home→City, Return: City→Home, City: normal), labels show directional arrows (Start → City, City → Return)
- **Next step:** Commit changes
- **Files touched:** index.html (leg type dropdown), js/crud.js (onLegTypeChange, confirmAddLeg, createNewLeg, openAddLegDialog)
- **Known blockers / risks:** None
- **Noticed (unscheduled):**
