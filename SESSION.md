## Session State

- **Item/sub-task:** 7d
- **Branch:** item-7d
- **Last commit:** `Not yet committed`
- **What was done:** Fixed the guide button not working by adding missing `window.*` exports for guide functions at the end of `js/guide.js`. The functions `buildGuideSteps`, `toggleGuideStep`, `markStepComplete`, `resetTutorialSeen`, `startTutorial`, `skipTutorial`, `nextTutorialStep`, `prevTutorialStep` are now exposed to global scope so HTML onclick handlers can find them.
- **Next step:** Open index.html in browser and test that the 📖 Guide button opens the dialog. If working, commit and move to 7e.
- **Files touched:** `js/guide.js`
- **Known blockers / risks:** None — this fix should restore guide functionality
- **Noticed (unscheduled):** None
