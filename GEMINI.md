# GEMINI.md

## Workflow

Use the polish sprint files as the source of truth.

1. Open `polish/TRACKER.md`.
2. Pick the next `Todo` item in priority order unless the user names a specific `WI-XXX`.
3. Create or switch to a branch named for the work item, for example `WI-001_Desktop-App-Menu-Wraps`.
4. Open `polish/items/WI-XXX.md`.
5. Implement only that work item.
6. Run the relevant checks. If available, run:

```powershell
node scripts/regression-city-nav.js
```

7. Capture the real review screenshot to:

```text
polish/screenshots/after/WI-XXX-after.png
```

8. If the item is already in `Review` and the user requests another change, capture the next screenshot with an incremented suffix such as `polish/screenshots/after/WI-XXX-after-2.png`, `WI-XXX-after-3.png`, and so on. Do not overwrite prior review screenshots.
9. Update the work item and `polish/TRACKER.md`, and make the latest after screenshot a clickable markdown link in the work item file.
10. In the final response, include direct clickable links to the before image, proposal image, and latest after image for immediate review.
11. When the WI is in `Review`, capture the user's latest feedback in the work item's `Review Notes` section as a running log before making the next revision.
12. When multiple WIs are active, keep branch ownership strict: one WI per branch, no cross-WI tracker edits, and no reverting another WI's changes.
13. Use separate worktrees for parallel WIs when possible; if you cannot, re-check the current branch before every edit.

## Session Start

1. Read `polish/TRACKER.md`.
2. Read the next Todo `polish/items/WI-XXX.md` unless the user names one.
3. Check `git status --short`.
4. Start or verify the dev server at `http://localhost:3000`.
5. Load real data from `backups/2026_June_July_Europe_Thailand.json` for visual work.
6. If another WI's edits are already present, pause and verify the branch before making changes so you do not overwrite a teammate's work.
7. If a different WI is already checked out, do not touch its files or tracker rows until you have switched context cleanly.

## Completion

Before reporting done:

1. Run relevant tests/checks.
2. Capture `polish/screenshots/after/WI-XXX-after.png`.
3. If the user requests another revision while the WI is still in `Review`, capture the next pass as `polish/screenshots/after/WI-XXX-after-2.png`, then `-3.png`, and so on. Preserve all earlier review screenshots.
4. Update the WI status to `Review` after capturing the review screenshot.
5. Update `polish/TRACKER.md` with the latest after screenshot link, but do not move the WI to Completed or mark it Done until the user explicitly confirms final review.
6. Make sure the work item's after screenshot field links directly to the latest review screenshot path.
7. Update the `Before`, `Proposed`, and `After` columns in `polish/TRACKER.md` so the row stays compact and clickable.
8. Capture any user feedback from the review pass in the work item's `Review Notes` section before the next revision.
9. Wait for the user's explicit final-review confirmation before changing the status to Done and moving the row to Completed.
10. Commit the completed WI on the WI branch with the WI referenced in the commit message, then push that same branch.
11. Summarize changed files, verification, branch name, and commit hash.
12. Include direct clickable links to the before image, proposal image, and latest after image in the completion response.
13. When concurrent work is happening, commit and push the current WI as soon as it is verified so the branch tip is safe before you switch tasks.
14. Never carry a verified WI forward into another task without committing it first.

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
- If the item is still in `Review` and the user requests more changes, capture a new incremented after screenshot instead of overwriting the previous one.
- Update the tracker and work item so the latest screenshot link points at the newest review image while keeping older review images available.
- After moving a WI to Done, create a git commit on the WI branch that references the WI number, then push that same branch before reporting completion.

## App

Run locally with:

```powershell
npx serve . --listen 3000
```

Use real data from:

```text
backups/2026_June_July_Europe_Thailand.json
```
