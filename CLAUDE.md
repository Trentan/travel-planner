# CLAUDE.md

## Workflow

Use the polish sprint files as the source of truth.

1. Open `polish/TRACKER.md`.
2. Pick the next `Todo` item in priority order unless the user names a specific `WI-XXX`.
3. Create or switch to a branch named for the work item, for example `WI-001_Desktop-App-Menu-Wraps`.
4. Open `polish/items/WI-XXX.md`.
5. Implement only that work item.
6. Run the relevant checks. If available, run:

```bash
node scripts/regression-city-nav.js
```

7. Capture the real completed screenshot to:

```text
polish/screenshots/after/WI-XXX-after.png
```

8. Update the work item and `polish/TRACKER.md`.

## Session Start

1. Read `polish/TRACKER.md`.
2. Read the next Todo `polish/items/WI-XXX.md` unless the user names one.
3. Check `git status --short`.
4. Start or verify the dev server at `http://localhost:3000`.
5. Load real data from `backups/2026_June_July_Europe_Thailand.json` for visual work.

## Completion

Before reporting done:

1. Run relevant tests/checks.
2. Capture `polish/screenshots/after/WI-XXX-after.png`.
3. Update the WI status to Done.
4. Update `polish/TRACKER.md`.
5. Commit the completed WI on the WI branch with the WI referenced in the commit message, then push that same branch.
6. Summarize changed files, verification, branch name, and commit hash.

## File Map

- `polish/TRACKER.md` - backlog and progress.
- `polish/AUDIT.md` - full audit and recommended order.
- `polish/items/WI-XXX.md` - individual work item specs.
- `polish/items/proposals/` - proposal mockups and notes.
- `polish/screenshots/before/` - audit screenshots.
- `polish/screenshots/after/` - actual screenshots after fixes are implemented.

## Rules

- Do not use the old task files for active work.
- Keep each change scoped to one work item unless the user says otherwise.
- Preserve unrelated local changes.
- If a new issue is found, add a new `WI-XXX.md` and update `TRACKER.md`.
- When an item is done, mark it `Done`, add the date, and move it to Completed in `TRACKER.md`.
- After moving a WI to Done, create a git commit on the WI branch that references the WI number, then push that same branch before reporting completion.

## App

Run locally with:

```bash
npx serve . --listen 3000
```

Use real data from:

```text
backups/2026_June_July_Europe_Thailand.json
```
