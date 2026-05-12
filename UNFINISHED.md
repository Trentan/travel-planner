# UNFINISHED.md

## Active
none

## Awaiting Review / Merge
- **Item:** 9d — branch `item-9d-force-refresh` — PR #18 open, waiting merge
  - Added Force Refresh button and dialog to clear caches and reload
  - Implemented resilient service worker unregistration with error handling
  - Cache clearing, IndexedDB deletion, localStorage wipe implemented
  - Added manual clear instructions for different platforms (iOS, Android, Desktop)
  - Updated service worker cache version v7->v8
  - **Also fixed - Import Issues:**
    - Import not displaying until manual refresh
    - Cities not mapping/extracting correctly
    - Custom cities and transit cities missing
    - Budget calculation not working (journeys/stays not syncing)
  - **Commits:**
    - `17327` - Import: cities extraction and UI rebuild
    - `58dc5d3` - Budget: imported journeys and stays variables
    - `c52decd` - Fix indentation in import code  
    - `bdbe40f` - Enhance cities extraction (journeys, stays, country lookup)