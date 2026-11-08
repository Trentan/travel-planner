---
title: "[Audit]: Remove Unused 87KB Dead default-app-data.json File from Runtime Distribution Assets"
labels: ["enhancement", "effort: quick-win"]
estimate: "S"
---

# [Audit]: Remove Unused 87KB Dead default-app-data.json File from Runtime Distribution Assets

## Before
`js/default-app-data.json` is a 2,905-line, 87KB static JSON file placed in the `js/` directory. The application exclusively uses `DEFAULT_TRIP_DATA` defined in `js/default-data.js` via a `<script>` tag. `default-app-data.json` is not referenced, fetched, or imported anywhere in the runtime codebase, but gets copied by `scripts/prepare-capacitor-web.js` into `.capacitor-web/js/` and bundled into APKs and PWA builds.

## Evidence
`git grep "default-app-data.json"` matches only historical research paper documentation. No code imports or fetches this file.

## Proposed
1. Delete `js/default-app-data.json`.
2. Verify build commands (`npm run build:css`, `npm run prepare:capacitor-web`) and tests pass.

## After
Runtime assets and mobile bundle size are reduced by 87KB of dead JSON code.

## Estimate
- Effort estimate: S

## Files impacted
- `js/default-app-data.json`

## Acceptance criteria
- [ ] `js/default-app-data.json` is removed.
- [ ] App initializes and resets cleanly without errors.
- [ ] Regression tests pass (`npm test`).

## Verification plan
- Automated tests: `npm test`
