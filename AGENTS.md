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

## GitHub Issue Workflow

Carry forward the useful parts of the retired polish tracker inside GitHub Issues. Do not create new `WI-XXX` files or tracker rows; the GitHub issue is now the work item, tracker row, proposal, and completion record.

### Creating Issues

When creating a GitHub Issue, use the tracker-style narrative shape:

1. `Before`: describe the current behavior, missing capability, bug, or user pain.
2. `Before screenshot`: link or attach the current-state screenshot for visual/UI work. If the issue is not UI-specific, write `Not UI-specific`. If a screenshot cannot be captured yet, explain why and state what must be captured before implementation starts.
3. `Evidence`: include viewport/mode, realistic trip data, reproduction notes, or source-code references.
4. `Proposed`: describe the intended change, design direction, or implementation approach.
5. `Proposed screenshot / mockup`: link or attach a proposed-state screenshot, mockup, wireframe, or visual spec for UI work. The mockup should be specific enough to show how the before state changes into the intended after state, even when simple. If the issue is not UI-specific, write `Not UI-specific`.
6. `After`: describe the expected user-visible result once the issue is complete.
7. `Estimate`: include effort using `Quick Win (<1 hr)`, `Medium (2-8 hrs)`, or `Major (1-3 days)`.
8. `Files impacted`: list expected files or modules likely to change, using `TBD` only when the code path is genuinely unknown.
9. `Tags`: list GitHub labels that should be applied, including priority, effort, and area labels.
10. `Acceptance criteria`: list concrete checks that prove the issue is done.
11. `Verification plan`: list the commands, browser states, data files, and modes that should be checked.

For UI issues, always state which modes are affected:

| Mode ID | Label | Viewport | Density setting |
|---------|-------|----------|-----------------|
| `DDE` | Desktop / Detailed | 1440 x 900 | Default density |
| `DCO` | Desktop / Compact | 1440 x 900 | Compact toggle active |
| `MDE` | Mobile / Detailed | 390 x 844 | Default density |
| `MCO` | Mobile / Compact | 390 x 844 | Compact toggle active |

Use the issue title and labels for priority instead of a local tracker row. Apply GitHub labels when creating or updating issues. At minimum, apply:

1. One priority label: `priority: critical`, `priority: important`, or `priority: polish`.
2. One effort label: `effort: quick-win`, `effort: medium`, or `effort: major`.
3. One or more area labels, for example `area: itinerary`, `area: map`, `area: mobile`, `area: ai-builder`, `area: data`, `area: guide`, `area: transport`, `area: accommodation`, `area: docs`.
4. Existing type labels such as `enhancement`, `bug`, `polish`, or `ux` where appropriate.

### Working Issues

1. Keep one focused branch per issue, using the default prefix `codex/`, for example `codex/90-linked-transport-map-segments`.
2. Treat the issue body as the old WI file: read `Before`, `Proposed`, `After`, `Estimate`, `Files impacted`, acceptance criteria, and verification plan before editing.
3. For visual work, capture or reference a before screenshot before changing behavior.
4. For visual work, add a proposed screenshot, mockup, or visual spec before implementation unless the issue body already contains one. If the proposed image is too generic to guide implementation, update it before coding.
5. If the implementation changes the expected outcome, update the issue with a short comment explaining the decision instead of silently drifting from the proposal.
6. Update `Estimate`, `Files impacted`, and labels if discovery changes the scope.
7. Preserve the issue's scope. Create or suggest a follow-up issue for richer adjacent work rather than expanding the current issue.

### Resolving Issues

When resolving an issue, leave a closing comment or update the issue with the completed tracker-style record:

1. `Before`: what was broken, missing, or hard to use.
2. `After`: what now works, including any user-visible behavior changes.
3. `Estimate`: original estimate and whether it held.
4. `Files changed`: the main files touched.
5. `Labels`: final labels/tags applied.
6. `Verification`: commands, visual checks, modes, and realistic data used.
7. `Screenshots`: before, proposed, and after screenshots. For UI/visual work, an after screenshot MUST be captured and attached/linked here to prove the final visual state.
8. `Remaining notes`: follow-up work, known limitations, or `None`.

Pull requests should reference the issue number and include the same completion summary so the issue, branch, commit, and PR all tell the same story.

## Completion

Before reporting done:

1. Run the relevant checks and record the results.
2. Update or close the GitHub issue as appropriate.
3. If the issue still needs review, leave it open and summarize what remains.
4. Commit the completed work on the issue branch with the issue number in the commit message.
5. Push the branch.
6. Summarize changed files, verification, branch name, commit hash, and issue links.
7. For UI/visual work, ensure an after screenshot is captured and included in the completion summary and pull request description.

## Archived Polish Sprint

Historical polish work lives in closed GitHub Issues. Search for labels `migrated` and `archive`, or search by the original `WI-XXX` identifier.
