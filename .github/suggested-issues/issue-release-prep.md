# GitHub Issue: Travel Planner Release & Open Source Preparation

**Title:** Prepare PWA for App Store Publishing & Open Source Transition

## Before
The repository is currently a private codebase with a bare-bones `.gitignore` file, no public community/security/conduct guidelines, and is configured purely as a client-side Progressive Web App (PWA) with no established packaging setups for the Google Play Store or Apple App Store.

## Before screenshot
Not UI-specific

## Evidence
- Lack of Capacitor configurations, Apple/Google icon sets, or Digital Asset Links inside the current main codebase.
- Lack of standard community metadata files (`CODE_OF_CONDUCT.md`, `SECURITY.md`) in root.

## Proposed
Execute a phased release and open-source migration:
1. Move release roadmap, tracking, and walkthrough logs into the repository at `docs/release-prep/` so they are version-controlled.
2. Clean up git hygiene by expanding `.gitignore` to cover build outputs (`dist/`), test runner logs (`test-results/`), and IDE configurations (`.idea/`).
3. Add open source safety documents (`SECURITY.md`, `CODE_OF_CONDUCT.md`) to define a clear, private vulnerability report path and contributor code of conduct.
4. Prepare mobile store wrapper configurations (Capacitor for iOS, Bubblewrap for Android TWAs).
5. Generate launcher and app icon raster assets (PNGs) and configure the app manifest (`manifest.json`) for stores.

## Proposed screenshot / mockup
Not UI-specific

## After
The codebase is clean, open-source compliant, and contains versioned roadmap guides, task lists, and wrappers configured to compile and package production-ready releases for the App Store and Google Play Store.

## Estimate
`Major (1-3 days)`

## Files impacted
- [x] [MODIFY] [`.gitignore`](file:///c:/Apps/Projects/travel-planner/.gitignore)
- [x] [NEW] [`SECURITY.md`](file:///c:/Apps/Projects/travel-planner/SECURITY.md)
- [x] [NEW] [`CODE_OF_CONDUCT.md`](file:///c:/Apps/Projects/travel-planner/CODE_OF_CONDUCT.md)
- [x] [NEW] [`docs/release-prep/release_and_open_source_roadmap.md`](file:///c:/Apps/Projects/travel-planner/docs/release-prep/release_and_open_source_roadmap.md)
- [x] [NEW] [`docs/release-prep/task.md`](file:///c:/Apps/Projects/travel-planner/docs/release-prep/task.md)
- [x] [NEW] [`docs/release-prep/walkthrough.md`](file:///c:/Apps/Projects/travel-planner/docs/release-prep/walkthrough.md)
- [ ] [MODIFY] [`manifest.json`](file:///c:/Apps/Projects/travel-planner/manifest.json)
- [ ] [NEW] Capacitor configs / icons (TBD)

## Tags
`priority: important`, `effort: major`, `area: docs`, `enhancement`

## Acceptance criteria
1. Standard open source community files are checked in and verified.
2. `.gitignore` cleanly prevents local build outputs and system configs from leaking into git.
3. Automated test suites (`npm test`) run and pass cleanly without failures.
4. Core PWA manifest has valid store-compliant raster icon entries.

## Verification plan
- Run `npm test` to verify that repository additions did not break the app.
- Run `git status` to ensure all generated test artifacts and build files are ignored.
