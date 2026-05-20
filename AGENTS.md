# AGENTS.md

## Source Of Truth

Use GitHub Issues as the active source of truth for all new work.

The old polish sprint tracker has been retired and migrated into closed GitHub Issues with the `migrated` and `archive` labels. Do not create new `WI-XXX` files, do not add local tracker rows, and do not recreate the old polish archive.

## Session Start

1. Check `git status --short --branch`.
2. Identify the GitHub issue being worked on. If the user did not name one, inspect open issues and pick the next appropriate issue by priority, label, or user direction.
3. Create or switch to a focused branch named for the issue, using the default prefix `codex/`, for example `codex/42-desktop-compact-review`.
4. Verify the local app can run at `http://localhost:3000` when visual or browser work is needed.
5. Use realistic trip data from `backups/2026_June_July_Europe_Thailand.json` for visual testing.
6. Preserve unrelated local changes. If the worktree contains changes from another task that would interfere with the issue, stop and report the conflict.

## Development Workflow

1. Keep each branch scoped to one GitHub issue or one small maintenance task.
2. Reference the issue number in commits and pull requests.
3. Prefer existing app patterns over introducing new dependencies or broad rewrites.
4. Update documentation when behavior, setup, or contributor workflow changes.
5. Add or update focused tests when behavior changes.
6. For UI changes, verify the relevant desktop and mobile states with real data.
7. For city import/navigation, transport, itinerary mapping, or map behavior, run:

```bash
node tests/city-nav-regression.js
```

8. For general changes, run:

```bash
npm test
```

## Completion

Before reporting done:

1. Run the relevant checks and record the results.
2. Update or close the GitHub issue as appropriate.
3. If the issue still needs review, leave it open and summarize what remains.
4. Commit the completed work on the issue branch with the issue number in the commit message.
5. Push the branch.
6. Summarize changed files, verification, branch name, commit hash, and issue links.

## Archived Polish Sprint

Historical polish work lives in closed GitHub Issues. Search for labels `migrated` and `archive`, or search by the original `WI-XXX` identifier.
