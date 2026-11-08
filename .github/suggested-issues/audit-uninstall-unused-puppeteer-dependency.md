---
title: "[Audit]: Uninstall Unused Puppeteer Dependency to Save 300MB in node_modules and CI"
labels: ["enhancement", "effort: quick-win"]
estimate: "S"
---

# [Audit]: Uninstall Unused Puppeteer Dependency to Save 300MB in node_modules and CI

## Before
In `package.json:L34`, `"puppeteer": "^25.0.2"` is listed in `devDependencies`. The entire end-to-end browser test suite in `tests/` uses Playwright (`const { chromium } = require('playwright');`). Puppeteer is never required or invoked across the entire codebase.

## Evidence
`git grep -i "puppeteer"` only finds `package.json` and `package-lock.json`.

## Proposed
1. Run `npm uninstall puppeteer`.
2. Confirm all test suites pass with Playwright.

## After
Developers and CI pipelines save over 300MB of download volume and disk footprint during `npm install`.

## Estimate
- Effort estimate: S

## Files impacted
- `package.json`
- `package-lock.json`

## Acceptance criteria
- [ ] `puppeteer` is removed from `devDependencies`.
- [ ] `npm test` runs and passes completely.

## Verification plan
- Automated tests: `npm test`
