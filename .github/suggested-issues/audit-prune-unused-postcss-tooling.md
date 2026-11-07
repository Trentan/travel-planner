---
title: "[Audit]: Remove Redundant PostCSS & Autoprefixer Configuration for Tailwind CSS v4"
labels: ["enhancement", "effort: quick-win"]
estimate: "S"
---

# [Audit]: Remove Redundant PostCSS & Autoprefixer Configuration for Tailwind CSS v4

## Before
In `package.json:L31-33`, `"autoprefixer": "^10.5.0"` and `"postcss": "^8.5.15"` are installed, and `postcss.config.js` exists. Tailwind CSS v4 uses `@tailwindcss/cli`, which includes built-in LightningCSS vendor prefixing and bundling. PostCSS is never executed in any build script.

## Evidence
In `package.json`:
```json
"build:css": "npx @tailwindcss/cli -i ./src/tailwind.css -o ./dist/tailwind.css --minify",
"watch:css": "npx @tailwindcss/cli -i ./src/tailwind.css -o ./dist/tailwind.css --watch",
```
PostCSS is unused.

## Proposed
1. Remove `postcss.config.js`.
2. Uninstall `postcss` and `autoprefixer` (`npm uninstall postcss autoprefixer`).
3. Verify CSS build outputs identical dist files (`npm run build:css`).

## After
Removes 2 unused build dependencies and dead configuration file without changing generated CSS output.

## Estimate
- Effort estimate: S

## Files impacted
- `package.json`
- `package-lock.json`
- `postcss.config.js`

## Acceptance criteria
- [ ] `postcss.config.js` removed.
- [ ] `postcss` and `autoprefixer` uninstalled.
- [ ] `npm run build:css` runs successfully.
- [ ] Regression tests pass (`npm test`).

## Verification plan
- Automated tests: `npm test`
