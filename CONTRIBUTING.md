# Contributing

Thanks for helping improve Travel Planner PWA.

## Workflow

1. Find or open a GitHub Issue that describes the work.
2. Comment on the issue if you plan to pick it up.
3. Create a focused branch from `main`.
4. Make the smallest coherent change that solves the issue.
5. Run the relevant tests.
6. Open a pull request and link the issue.

## Local Development

Install dependencies:

```powershell
npm install
```

Start a local static server:

```powershell
npx serve . --listen 3000
```

Open [http://localhost:3000](http://localhost:3000). For realistic testing, load:

```text
backups/2026_June_July_Europe_Thailand.json
```

## Checks

Run the full suite:

```powershell
npm test
```

Run browser coverage only:

```powershell
npm run test:browser
```

Run the city navigation regression directly:

```powershell
node tests\city-nav-regression.js
```

Please include the commands you ran in your pull request.

## Pull Request Guidelines

- Keep pull requests focused on one issue.
- Include screenshots or short screen recordings for visual changes.
- Note any browser/device coverage for mobile or PWA behavior.
- Avoid unrelated formatting churn.
- Preserve offline-first behavior.

## Issue Labels

- `bug`: broken behavior.
- `enhancement`: new capability or meaningful improvement.
- `documentation`: docs-only changes.
- `ux`: interaction, layout, accessibility, or visual polish.
- `polish`: small product refinements.
- `good first issue`: scoped work suitable for newer contributors.

## Archived Polish Sprint

The original private polish sprint lives in `docs/archive/polish-sprint/` for historical context. New work should use GitHub Issues instead of adding files to that archive.
